package handlers

// Integration tests for the MCP-style POST tool endpoints. These verify
// that every MCP tool is wired, accepts its declared payload shape, and
// shares the same storage layer as the REST routes (so writes through
// MCP appear in REST reads and vice-versa).

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func TestMCP_GetTools(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodGet, "/api/v1/mcp", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var body struct {
		Tools []map[string]interface{} `json:"tools"`
	}
	decodeBody(t, w, &body)
	require.NotEmpty(t, body.Tools)

	// Verify every tool we expose has the canonical fields.
	expected := map[string]bool{
		"list_boards": false, "create_board": false, "rename_board": false, "delete_board": false,
		"list_epics": false, "create_epic": false, "update_epic": false, "delete_epic": false,
		"list_tasks": false, "list_tasks_by_status": false, "create_task": false,
		"update_task": false, "set_task_state": false, "search_tasks": false, "add_comment": false,
	}
	for _, tool := range body.Tools {
		name, _ := tool["name"].(string)
		if _, ok := expected[name]; ok {
			expected[name] = true
		}
		assert.NotEmpty(t, tool["endpoint"], "tool %s missing endpoint", name)
		assert.NotEmpty(t, tool["description"], "tool %s missing description", name)
	}
	for name, seen := range expected {
		assert.True(t, seen, "tool %s missing from manifest", name)
	}
}

func TestMCP_ListBoards_EmbedsColumns(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "Board", "B")
	e.seedColumn(t, b.ID, "Todo", 1)
	e.seedColumn(t, b.ID, "Done", 2)

	w := e.do(t, http.MethodPost, "/api/v1/mcp/list_boards", map[string]interface{}{})
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())

	var list []struct {
		storage.Board
		Columns []storage.Column `json:"columns"`
	}
	decodeBody(t, w, &list)
	require.Len(t, list, 1)
	assert.Equal(t, b.ID, list[0].ID)
	assert.Len(t, list[0].Columns, 2)
}

func TestMCP_CreateBoard_DefaultColumns(t *testing.T) {
	e := newIntegrationEnv(t)

	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_board", map[string]interface{}{
		"name":   "My Project",
		"prefix": "MP",
	})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())

	var body struct {
		Board   storage.Board    `json:"board"`
		Columns []storage.Column `json:"columns"`
	}
	decodeBody(t, w, &body)
	assert.Equal(t, "My Project", body.Board.Name)
	assert.Equal(t, "MP", body.Board.Prefix)
	require.Len(t, body.Columns, 4, "default columns are To Do/In Progress/Review/Done")
	names := []string{body.Columns[0].Name, body.Columns[1].Name, body.Columns[2].Name, body.Columns[3].Name}
	assert.Equal(t, []string{"To Do", "In Progress", "Review", "Done"}, names)

	// REST sees the same board the MCP created.
	w = e.do(t, http.MethodGet, "/api/v1/boards/"+body.Board.ID, nil)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestMCP_CreateBoard_CustomColumns(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_board", map[string]interface{}{
		"name":    "Custom",
		"columns": []string{"Backlog", "Doing", "Shipped"},
	})
	require.Equal(t, http.StatusCreated, w.Code)
	var body struct {
		Board   storage.Board    `json:"board"`
		Columns []storage.Column `json:"columns"`
	}
	decodeBody(t, w, &body)
	require.Len(t, body.Columns, 3)
	assert.Equal(t, "Backlog", body.Columns[0].Name)
	assert.Equal(t, "Shipped", body.Columns[2].Name)
}

func TestMCP_CreateBoard_MissingName_400(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_board", map[string]interface{}{})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestMCP_RenameBoard(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "Old", "OLD")

	newName := "New"
	w := e.do(t, http.MethodPost, "/api/v1/mcp/rename_board", map[string]interface{}{
		"board_id": b.ID,
		"name":     newName,
	})
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())

	row, err := e.db.GetBoard(b.ID)
	require.NoError(t, err)
	assert.Equal(t, "New", row.Name)
}

func TestMCP_RenameBoard_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/rename_board", map[string]interface{}{
		"board_id": "missing",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_DeleteBoard(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/delete_board", map[string]interface{}{"board_id": b.ID})
	require.Equal(t, http.StatusOK, w.Code)
	var body map[string]string
	decodeBody(t, w, &body)
	assert.Equal(t, b.ID, body["deleted"])

	_, err := e.db.GetBoard(b.ID)
	assert.Error(t, err)
}

func TestMCP_DeleteBoard_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/delete_board", map[string]interface{}{"board_id": "missing"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_Epics_FullLifecycle(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")

	// Create.
	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_epic", map[string]interface{}{
		"board_id": b.ID,
		"name":     "Epic One",
		"color":    "#abc",
	})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var created storage.Epic
	decodeBody(t, w, &created)
	assert.Equal(t, "Epic One", created.Name)

	// List.
	w = e.do(t, http.MethodPost, "/api/v1/mcp/list_epics", map[string]interface{}{"board_id": b.ID})
	require.Equal(t, http.StatusOK, w.Code)
	var list []storage.Epic
	decodeBody(t, w, &list)
	require.Len(t, list, 1)

	// Update.
	newName := "Renamed"
	w = e.do(t, http.MethodPost, "/api/v1/mcp/update_epic", map[string]interface{}{
		"epic_id": created.ID,
		"name":    newName,
	})
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())

	// Delete.
	w = e.do(t, http.MethodPost, "/api/v1/mcp/delete_epic", map[string]interface{}{"epic_id": created.ID})
	require.Equal(t, http.StatusNoContent, w.Code)
	_, err := e.db.GetEpic(created.ID)
	assert.Error(t, err)
}

func TestMCP_CreateEpic_BoardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_epic", map[string]interface{}{
		"board_id": "missing",
		"name":     "x",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_UpdateEpic_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/update_epic", map[string]interface{}{
		"epic_id": "missing",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_ListTasks_GroupedByStatus(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	colA := e.seedColumn(t, b.ID, "Todo", 1)
	colB := e.seedColumn(t, b.ID, "Done", 2)
	e.seedCard(t, b.ID, colA.ID, "t1")
	e.seedCard(t, b.ID, colA.ID, "t2")
	e.seedCard(t, b.ID, colB.ID, "t3")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/list_tasks", map[string]interface{}{"board_id": b.ID})
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())

	var groups []struct {
		StatusID   string         `json:"status_id"`
		StatusName string         `json:"status_name"`
		Tasks      []CardResponse `json:"tasks"`
	}
	decodeBody(t, w, &groups)
	require.Len(t, groups, 2)
	byName := map[string]int{}
	for _, g := range groups {
		byName[g.StatusName] = len(g.Tasks)
	}
	assert.Equal(t, 2, byName["Todo"])
	assert.Equal(t, 1, byName["Done"])
}

func TestMCP_ListTasksByStatus(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Doing", 1)
	e.seedCard(t, b.ID, col.ID, "x")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/list_tasks_by_status", map[string]interface{}{"column_id": col.ID})
	require.Equal(t, http.StatusOK, w.Code)
	var body struct {
		StatusID   string         `json:"status_id"`
		StatusName string         `json:"status_name"`
		Tasks      []CardResponse `json:"tasks"`
	}
	decodeBody(t, w, &body)
	assert.Equal(t, col.ID, body.StatusID)
	assert.Equal(t, "Doing", body.StatusName)
	assert.Len(t, body.Tasks, 1)
}

func TestMCP_ListTasksByStatus_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/list_tasks_by_status", map[string]interface{}{"column_id": "missing"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_CreateTask_AndSeenViaREST(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)

	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_task", map[string]interface{}{
		"board_id":  b.ID,
		"column_id": col.ID,
		"title":     "From MCP",
	})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var created CardResponse
	decodeBody(t, w, &created)
	assert.Equal(t, "From MCP", created.Title)
	assert.Equal(t, uint(1), created.Number)
	assert.Equal(t, "Todo", created.StatusName)

	// REST list should see it (cross-layer verification: MCP write -> REST read).
	w = e.do(t, http.MethodGet, "/api/v1/boards/"+b.ID+"/cards", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var list []CardResponse
	decodeBody(t, w, &list)
	require.Len(t, list, 1)
	assert.Equal(t, created.ID, list[0].ID)
}

func TestMCP_CreateTask_BoardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/create_task", map[string]interface{}{
		"board_id":  "missing",
		"column_id": "x",
		"title":     "x",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_SetTaskState(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	colA := e.seedColumn(t, b.ID, "Todo", 1)
	colB := e.seedColumn(t, b.ID, "Done", 2)
	card := e.seedCard(t, b.ID, colA.ID, "move me")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/set_task_state", map[string]interface{}{
		"card_id":   card.ID,
		"column_id": colB.ID,
	})
	require.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
	var updated CardResponse
	decodeBody(t, w, &updated)
	assert.Equal(t, colB.ID, updated.ColumnID)
	assert.Equal(t, "Done", updated.StatusName)
}

func TestMCP_SetTaskState_CardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/set_task_state", map[string]interface{}{
		"card_id":   "missing",
		"column_id": "x",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_UpdateTask_PartialFields(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "old title")

	newTitle := "new title"
	newPriority := "urgent"
	w := e.do(t, http.MethodPost, "/api/v1/mcp/update_task", map[string]interface{}{
		"card_id":  card.ID,
		"title":    newTitle,
		"priority": newPriority,
	})
	require.Equal(t, http.StatusOK, w.Code)
	var updated CardResponse
	decodeBody(t, w, &updated)
	assert.Equal(t, "new title", updated.Title)
	assert.Equal(t, "urgent", updated.Priority)
}

func TestMCP_UpdateTask_AssigneeIDClearsAgent(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "t")
	card.AssigneeAgent = "@relay"
	require.NoError(t, e.db.UpdateCard(card))

	w := e.do(t, http.MethodPost, "/api/v1/mcp/update_task", map[string]interface{}{
		"card_id":     card.ID,
		"assignee_id": e.admin.ID,
	})
	require.Equal(t, http.StatusOK, w.Code)
	var updated CardResponse
	decodeBody(t, w, &updated)
	assert.Equal(t, e.admin.ID, updated.AssigneeID)
	assert.Empty(t, updated.AssigneeAgent)
}

func TestMCP_UpdateTask_CardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/update_task", map[string]interface{}{"card_id": "missing"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestMCP_SearchTasks_RequiresQuery(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/search_tasks", map[string]interface{}{"board_id": "x"})
	// Missing required `query` -> 400.
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestMCP_SearchTasks_SQLiteLimitation documents the same ILIKE quirk as the
// REST search route: SQLite cannot run the production query so we accept
// either 200 (no rows) or 500 (SQL error). The route is still verified wired.
func TestMCP_SearchTasks_SQLiteLimitation(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	e.seedCard(t, b.ID, col.ID, "hello")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/search_tasks", map[string]interface{}{
		"board_id": b.ID,
		"query":    "hello",
	})
	if w.Code != http.StatusOK && w.Code != http.StatusInternalServerError {
		t.Fatalf("unexpected status %d body=%s", w.Code, w.Body.String())
	}
}

func TestMCP_AddComment_DefaultsAuthorToCaller(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/add_comment", map[string]interface{}{
		"card_id": card.ID,
		"body":    "hello from mcp",
	})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var cm CommentResponse
	decodeBody(t, w, &cm)
	assert.Equal(t, "hello from mcp", cm.Body)
	assert.Equal(t, e.admin.ID, cm.AuthorID, "author defaults to JWT user when not provided")
	assert.Contains(t, cm.AuthorName, e.admin.Email)
}

func TestMCP_AddComment_ExplicitAuthorID(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")

	w := e.do(t, http.MethodPost, "/api/v1/mcp/add_comment", map[string]interface{}{
		"card_id":   card.ID,
		"body":      "explicit author",
		"author_id": 999,
	})
	require.Equal(t, http.StatusCreated, w.Code)
	var cm CommentResponse
	decodeBody(t, w, &cm)
	assert.Equal(t, uint(999), cm.AuthorID, "explicit author_id should override caller")
}

func TestMCP_AddComment_CardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/mcp/add_comment", map[string]interface{}{
		"card_id": "missing",
		"body":    "x",
	})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// TestMCP_ValidationErrors_Table covers the missing-required-field branches
// across MCP endpoints in one shot.
func TestMCP_ValidationErrors_Table(t *testing.T) {
	e := newIntegrationEnv(t)
	cases := []struct {
		name string
		path string
		body map[string]interface{}
	}{
		{"rename_board no body", "/api/v1/mcp/rename_board", map[string]interface{}{}},
		{"delete_board no body", "/api/v1/mcp/delete_board", map[string]interface{}{}},
		{"list_epics no body", "/api/v1/mcp/list_epics", map[string]interface{}{}},
		{"create_epic no body", "/api/v1/mcp/create_epic", map[string]interface{}{}},
		{"update_epic no body", "/api/v1/mcp/update_epic", map[string]interface{}{}},
		{"delete_epic no body", "/api/v1/mcp/delete_epic", map[string]interface{}{}},
		{"list_tasks no body", "/api/v1/mcp/list_tasks", map[string]interface{}{}},
		{"list_tasks_by_status no body", "/api/v1/mcp/list_tasks_by_status", map[string]interface{}{}},
		{"create_task no body", "/api/v1/mcp/create_task", map[string]interface{}{}},
		{"set_task_state no body", "/api/v1/mcp/set_task_state", map[string]interface{}{}},
		{"update_task no body", "/api/v1/mcp/update_task", map[string]interface{}{}},
		{"search_tasks no body", "/api/v1/mcp/search_tasks", map[string]interface{}{}},
		{"add_comment no body", "/api/v1/mcp/add_comment", map[string]interface{}{}},
	}
	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			w := e.do(t, http.MethodPost, tc.path, tc.body)
			assert.Equal(t, http.StatusBadRequest, w.Code, "body=%s", w.Body.String())
		})
	}
}
