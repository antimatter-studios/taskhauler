package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func newTestRouter(t *testing.T) (*gin.Engine, *Handler) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	conn, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, conn.AutoMigrate(&storage.Board{}, &storage.Column{}, &storage.Epic{}, &storage.Card{}, &storage.Comment{}))
	db := storage.NewDB(conn)
	h := New(db, nil, nil)

	r := gin.New()
	api := r.Group("/api/v1")
	api.GET("/health", h.Health)
	api.GET("/boards", h.ListBoards)
	api.POST("/boards", h.CreateBoard)
	api.GET("/boards/:id", h.GetBoard)
	api.PUT("/boards/:id", h.UpdateBoard)
	api.DELETE("/boards/:id", h.DeleteBoard)
	return r, h
}

func doJSON(t *testing.T, r *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.NoError(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestHealth(t *testing.T) {
	r, _ := newTestRouter(t)
	w := doJSON(t, r, http.MethodGet, "/api/v1/health", nil)
	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]string
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	assert.Equal(t, "ok", body["status"])
}

func TestCreateBoard_DerivesPrefix(t *testing.T) {
	r, _ := newTestRouter(t)
	w := doJSON(t, r, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Test Board"})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var b storage.Board
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &b))
	assert.Equal(t, "TB", b.Prefix)
}

func TestCreateBoard_ExplicitPrefix(t *testing.T) {
	r, _ := newTestRouter(t)
	w := doJSON(t, r, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Test Board", "prefix": "CUSTOM"})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var b storage.Board
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &b))
	assert.Equal(t, "CUSTOM", b.Prefix)
}

func TestCreateBoard_PrefixCollision(t *testing.T) {
	r, _ := newTestRouter(t)

	w1 := doJSON(t, r, http.MethodPost, "/api/v1/boards", map[string]string{"name": "First", "prefix": "X"})
	require.Equal(t, http.StatusCreated, w1.Code, "body=%s", w1.Body.String())
	var b1 storage.Board
	require.NoError(t, json.Unmarshal(w1.Body.Bytes(), &b1))
	assert.Equal(t, "X", b1.Prefix)

	w2 := doJSON(t, r, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Second", "prefix": "X"})
	require.Equal(t, http.StatusCreated, w2.Code, "body=%s", w2.Body.String())
	var b2 storage.Board
	require.NoError(t, json.Unmarshal(w2.Body.Bytes(), &b2))
	assert.Equal(t, "X2", b2.Prefix)
}

func TestListBoards_ReturnsAll(t *testing.T) {
	r, h := newTestRouter(t)
	for i := 0; i < 3; i++ {
		require.NoError(t, h.db.CreateBoard(&storage.Board{ID: uuid.New().String(), Name: "B"}))
	}
	w := doJSON(t, r, http.MethodGet, "/api/v1/boards", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var got []storage.Board
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	assert.Len(t, got, 3)
}

func TestGetBoard_NotFound(t *testing.T) {
	r, _ := newTestRouter(t)
	w := doJSON(t, r, http.MethodGet, "/api/v1/boards/does-not-exist", nil)
	assert.Equal(t, http.StatusNotFound, w.Code)
	var body map[string]string
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	assert.Contains(t, body["error"], "not found")
}
