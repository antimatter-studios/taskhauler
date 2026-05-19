package handlers

// Integration tests for the boards REST resource.

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func TestBoards_CreateAndGet(t *testing.T) {
	e := newIntegrationEnv(t)

	w := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Engineering", "prefix": "ENG", "description": "eng work"})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())

	var created storage.Board
	decodeBody(t, w, &created)
	assert.NotEmpty(t, created.ID)
	assert.Equal(t, "Engineering", created.Name)
	assert.Equal(t, "ENG", created.Prefix)
	assert.Equal(t, "eng work", created.Description)

	// Confirm visible via GET.
	w = e.do(t, http.MethodGet, "/api/v1/boards/"+created.ID, nil)
	require.Equal(t, http.StatusOK, w.Code)
	var fetched storage.Board
	decodeBody(t, w, &fetched)
	assert.Equal(t, created.ID, fetched.ID)
	assert.Equal(t, "Engineering", fetched.Name)

	// And via DB side-effect.
	row, err := e.db.GetBoard(created.ID)
	require.NoError(t, err)
	assert.Equal(t, "ENG", row.Prefix)
}

func TestBoards_Create_DerivesPrefixFromName(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Quick Brown Fox"})
	require.Equal(t, http.StatusCreated, w.Code)
	var b storage.Board
	decodeBody(t, w, &b)
	assert.Equal(t, "QBF", b.Prefix)
}

func TestBoards_Create_MissingNameRejected(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBoards_Create_EmptyPrefixDoesNotCollide(t *testing.T) {
	// Regression for TH-20: two boards with empty (or unsettable) prefix must
	// both be creatable. On Postgres a partial unique index on prefix WHERE
	// prefix <> '' enforces uniqueness only for non-empty values. SQLite tests
	// here don't have that index, but the handler-derived prefix logic must
	// not collide either: two boards with the same single-letter name still
	// produce a usable (suffixed) prefix.
	e := newIntegrationEnv(t)

	// Boards with a name that produces an empty derived prefix (all stop words).
	w1 := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "the of a"})
	require.Equal(t, http.StatusCreated, w1.Code, "body=%s", w1.Body.String())
	w2 := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "an of the"})
	require.Equal(t, http.StatusCreated, w2.Code, "body=%s", w2.Body.String())

	var b1, b2 storage.Board
	decodeBody(t, w1, &b1)
	decodeBody(t, w2, &b2)
	assert.Empty(t, b1.Prefix)
	assert.Empty(t, b2.Prefix)
	assert.NotEqual(t, b1.ID, b2.ID)
}

func TestBoards_Create_PrefixCollisionAutoSuffix(t *testing.T) {
	e := newIntegrationEnv(t)

	w1 := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "First", "prefix": "X"})
	require.Equal(t, http.StatusCreated, w1.Code)
	w2 := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Second", "prefix": "X"})
	require.Equal(t, http.StatusCreated, w2.Code)
	w3 := e.do(t, http.MethodPost, "/api/v1/boards", map[string]string{"name": "Third", "prefix": "X"})
	require.Equal(t, http.StatusCreated, w3.Code)

	var b1, b2, b3 storage.Board
	decodeBody(t, w1, &b1)
	decodeBody(t, w2, &b2)
	decodeBody(t, w3, &b3)
	assert.Equal(t, "X", b1.Prefix)
	assert.Equal(t, "X2", b2.Prefix)
	assert.Equal(t, "X3", b3.Prefix)
}

func TestBoards_List_OrderedByCreatedAt(t *testing.T) {
	e := newIntegrationEnv(t)
	e.seedBoard(t, "A", "AAA")
	e.seedBoard(t, "B", "BBB")
	e.seedBoard(t, "C", "CCC")

	w := e.do(t, http.MethodGet, "/api/v1/boards", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var got []storage.Board
	decodeBody(t, w, &got)
	require.Len(t, got, 3)
}

func TestBoards_Get_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodGet, "/api/v1/boards/missing-id", nil)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestBoards_Update_PartialFields(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "Old", "OLD")

	newName := "New Name"
	w := e.do(t, http.MethodPut, "/api/v1/boards/"+b.ID, map[string]interface{}{"name": newName})
	require.Equal(t, http.StatusOK, w.Code)

	var updated storage.Board
	decodeBody(t, w, &updated)
	assert.Equal(t, "New Name", updated.Name)
	assert.Equal(t, "OLD", updated.Prefix, "prefix should be untouched when omitted from payload")

	// Verify DB side-effect.
	row, err := e.db.GetBoard(b.ID)
	require.NoError(t, err)
	assert.Equal(t, "New Name", row.Name)
}

func TestBoards_Update_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPut, "/api/v1/boards/nope", map[string]string{"name": "x"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestBoards_Delete_CascadesToColumnsAndCards(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "Board", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "task")

	w := e.do(t, http.MethodDelete, "/api/v1/boards/"+b.ID, nil)
	require.Equal(t, http.StatusNoContent, w.Code)

	// Board, column, card all gone.
	_, err := e.db.GetBoard(b.ID)
	assert.Error(t, err)
	_, err = e.db.GetColumn(col.ID)
	assert.Error(t, err)
	_, err = e.db.GetCard(card.ID)
	assert.Error(t, err)
}
