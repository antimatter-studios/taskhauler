package handlers

// Integration tests for the handlers package. These spin up a real gin
// router with the real auth middleware on top of an in-memory SQLite DB,
// exercise every REST + MCP endpoint via httptest, and assert on both
// HTTP responses and side-effects on the underlying DB.
//
// The setup mirrors backend/main.go's route registration so any drift
// between the test router and the production wiring is a code review
// catch, not a silent test-only bug.

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/antimatter-studios/taskhauler/backend/internal/auth"
	"github.com/antimatter-studios/taskhauler/backend/internal/events"
	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
	"github.com/antimatter-studios/taskhauler/backend/internal/users"
)

// testEnv bundles everything an integration test needs to drive the API.
type testEnv struct {
	router  *gin.Engine
	handler *Handler
	db      *storage.DB
	conn    *gorm.DB
	admin   *auth.User
	token   string
}

// newIntegrationEnv builds an in-memory SQLite-backed router that mirrors
// backend/main.go's route registration, seeds an admin user, and mints
// a real JWT access token for it.
func newIntegrationEnv(t *testing.T) *testEnv {
	t.Helper()
	gin.SetMode(gin.TestMode)

	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	conn, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)

	// Run both task-tracker and auth migrations against SQLite.
	require.NoError(t, conn.AutoMigrate(&storage.Board{}, &storage.Column{}, &storage.Epic{}, &storage.Card{}, &storage.Comment{}))
	require.NoError(t, auth.AutoMigrate(conn))

	// Seed an admin user.
	hash, err := auth.HashPassword("admin-pw")
	require.NoError(t, err)
	admin := &auth.User{
		Email:        "admin@taskhauler.test",
		PasswordHash: hash,
		DisplayName:  "Admin",
		IsAdmin:      true,
	}
	require.NoError(t, conn.Create(admin).Error)

	// Build the real handler stack.
	db := storage.NewDB(conn)
	emitter := events.NewLogger()
	userCache := users.New(conn, 5*time.Minute)
	issuer := auth.NewIssuer("integration-test-secret")
	mw := auth.NewMiddleware(conn, issuer)
	authH := auth.NewHandler(conn, issuer)
	h := New(db, emitter, userCache)

	router := gin.New()
	api := router.Group("/api/v1")

	// Public.
	api.GET("/health", h.Health)
	api.POST("/auth/login", authH.Login)

	// Authenticated group, mirrors main.go.
	authed := api.Group("")
	authed.Use(mw.RequireAuth())

	// Boards
	authed.GET("/boards", h.ListBoards)
	authed.POST("/boards", h.CreateBoard)
	authed.GET("/boards/:id", h.GetBoard)
	authed.PUT("/boards/:id", h.UpdateBoard)
	authed.DELETE("/boards/:id", h.DeleteBoard)

	// Columns
	authed.GET("/boards/:id/columns", h.ListColumns)
	authed.POST("/boards/:id/columns", h.CreateColumn)
	authed.PUT("/boards/:id/columns/:cid", h.UpdateColumn)
	authed.DELETE("/boards/:id/columns/:cid", h.DeleteColumn)

	// Epics
	authed.GET("/boards/:id/epics", h.ListEpics)
	authed.POST("/boards/:id/epics", h.CreateEpic)
	authed.PUT("/boards/:id/epics/:eid", h.UpdateEpic)
	authed.DELETE("/boards/:id/epics/:eid", h.DeleteEpic)

	// Cards
	authed.GET("/boards/:id/cards/search", h.SearchCards)
	authed.GET("/boards/:id/cards", h.ListCards)
	authed.POST("/boards/:id/cards", h.CreateCard)
	authed.PUT("/boards/:id/cards/:cid", h.UpdateCard)
	authed.DELETE("/boards/:id/cards/:cid", h.DeleteCard)
	authed.GET("/cards/:cid", h.GetCard)
	authed.GET("/boards/:id/cards/number/:num", h.GetCardByNumber)

	// Comments
	authed.GET("/cards/:cid/comments", h.ListComments)
	authed.POST("/cards/:cid/comments", h.CreateComment)
	authed.DELETE("/cards/:cid/comments/:cmid", h.DeleteComment)

	// MCP
	authed.GET("/mcp", h.GetTools)
	authed.POST("/mcp/list_boards", h.MCPListBoards)
	authed.POST("/mcp/create_board", h.MCPCreateBoard)
	authed.POST("/mcp/rename_board", h.MCPRenameBoard)
	authed.POST("/mcp/delete_board", h.MCPDeleteBoard)
	authed.POST("/mcp/list_epics", h.MCPListEpics)
	authed.POST("/mcp/create_epic", h.MCPCreateEpic)
	authed.POST("/mcp/update_epic", h.MCPUpdateEpic)
	authed.POST("/mcp/delete_epic", h.MCPDeleteEpic)
	authed.POST("/mcp/list_tasks", h.MCPListTasks)
	authed.POST("/mcp/list_tasks_by_status", h.MCPListTasksByStatus)
	authed.POST("/mcp/create_task", h.MCPCreateTask)
	authed.POST("/mcp/set_task_state", h.MCPSetTaskState)
	authed.POST("/mcp/update_task", h.MCPUpdateTask)
	authed.POST("/mcp/search_tasks", h.MCPSearchTasks)
	authed.POST("/mcp/add_comment", h.MCPAddComment)

	tok, err := issuer.IssueAccess(admin)
	require.NoError(t, err)

	return &testEnv{
		router:  router,
		handler: h,
		db:      db,
		conn:    conn,
		admin:   admin,
		token:   tok,
	}
}

// do issues an authenticated JSON request through the gin router. Passing
// nil for body sends no body.
func (e *testEnv) do(t *testing.T, method, path string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+e.token)
	w := httptest.NewRecorder()
	e.router.ServeHTTP(w, req)
	return w
}

// doNoAuth issues a request without an Authorization header — used to assert
// that auth-required endpoints reject anonymous traffic.
func (e *testEnv) doNoAuth(t *testing.T, method, path string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	e.router.ServeHTTP(w, req)
	return w
}

// seedBoard creates a board directly through the DB layer, returning the
// persisted board. Skips the handler so tests of dependent resources
// don't have to round-trip through CreateBoard first.
func (e *testEnv) seedBoard(t *testing.T, name, prefix string) *storage.Board {
	t.Helper()
	b := &storage.Board{ID: uuid.New().String(), Name: name, Prefix: prefix}
	require.NoError(t, e.db.CreateBoard(b))
	return b
}

func (e *testEnv) seedColumn(t *testing.T, boardID, name string, position float64) *storage.Column {
	t.Helper()
	col := &storage.Column{ID: uuid.New().String(), BoardID: boardID, Name: name, Position: position}
	require.NoError(t, e.db.CreateColumn(col))
	return col
}

func (e *testEnv) seedEpic(t *testing.T, boardID, name string) *storage.Epic {
	t.Helper()
	ep := &storage.Epic{ID: uuid.New().String(), BoardID: boardID, Name: name}
	require.NoError(t, e.db.CreateEpic(ep))
	return ep
}

func (e *testEnv) seedCard(t *testing.T, boardID, columnID, title string) *storage.Card {
	t.Helper()
	c := &storage.Card{
		ID:       uuid.New().String(),
		Number:   e.db.NextCardNumber(boardID),
		BoardID:  boardID,
		ColumnID: columnID,
		Title:    title,
	}
	require.NoError(t, e.db.CreateCard(c))
	return c
}

func (e *testEnv) seedComment(t *testing.T, cardID string, authorID uint, body string) *storage.Comment {
	t.Helper()
	cm := &storage.Comment{ID: uuid.New().String(), CardID: cardID, AuthorID: authorID, Body: body}
	require.NoError(t, e.db.CreateComment(cm))
	return cm
}

// decodeBody unmarshals a JSON response body into out, failing the test
// on decode error.
func decodeBody(t *testing.T, w *httptest.ResponseRecorder, out interface{}) {
	t.Helper()
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), out), "body=%s", w.Body.String())
}

// ── Smoke + auth-required tests ──────────────────────────────────────────────

func TestIntegration_Health_Public(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.doNoAuth(t, http.MethodGet, "/api/v1/health", nil)
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
	var body map[string]string
	decodeBody(t, w, &body)
	require.Equal(t, "ok", body["status"])
}

func TestIntegration_AuthRequired_Boards(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.doNoAuth(t, http.MethodGet, "/api/v1/boards", nil)
	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestIntegration_AuthRequired_MCP(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.doNoAuth(t, http.MethodGet, "/api/v1/mcp", nil)
	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestIntegration_InvalidToken_Rejected(t *testing.T) {
	e := newIntegrationEnv(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/boards", nil)
	req.Header.Set("Authorization", "Bearer not-a-real-token")
	w := httptest.NewRecorder()
	e.router.ServeHTTP(w, req)
	require.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestIntegration_MalformedAuthHeader_Rejected(t *testing.T) {
	e := newIntegrationEnv(t)
	cases := []string{"", "Token foo", "Bearer", "Bearer "}
	for _, h := range cases {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/boards", nil)
		if h != "" {
			req.Header.Set("Authorization", h)
		}
		w := httptest.NewRecorder()
		e.router.ServeHTTP(w, req)
		require.Equal(t, http.StatusUnauthorized, w.Code, "header=%q", h)
	}
}
