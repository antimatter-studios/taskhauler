package handlers

// Integration tests for the columns REST resource.

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func TestColumns_CreateAndList(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")

	w := e.do(t, http.MethodPost, "/api/v1/boards/"+b.ID+"/columns", map[string]interface{}{"name": "Todo", "position": 1.0})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var col storage.Column
	decodeBody(t, w, &col)
	assert.Equal(t, "Todo", col.Name)
	assert.Equal(t, b.ID, col.BoardID)
	assert.Equal(t, 1.0, col.Position)

	w = e.do(t, http.MethodGet, "/api/v1/boards/"+b.ID+"/columns", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var list []storage.Column
	decodeBody(t, w, &list)
	require.Len(t, list, 1)
	assert.Equal(t, col.ID, list[0].ID)
}

func TestColumns_Create_BoardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/boards/nope/columns", map[string]string{"name": "Todo"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestColumns_Create_MissingName_400(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	w := e.do(t, http.MethodPost, "/api/v1/boards/"+b.ID+"/columns", map[string]interface{}{"position": 1})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestColumns_List_OrderedByPosition(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	e.seedColumn(t, b.ID, "Third", 3)
	e.seedColumn(t, b.ID, "First", 1)
	e.seedColumn(t, b.ID, "Second", 2)

	w := e.do(t, http.MethodGet, "/api/v1/boards/"+b.ID+"/columns", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var got []storage.Column
	decodeBody(t, w, &got)
	require.Len(t, got, 3)
	assert.Equal(t, "First", got[0].Name)
	assert.Equal(t, "Second", got[1].Name)
	assert.Equal(t, "Third", got[2].Name)
}

func TestColumns_Update_NameAndPosition(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Old", 5)

	newName := "Renamed"
	newPos := 9.5
	w := e.do(t, http.MethodPut, "/api/v1/boards/"+b.ID+"/columns/"+col.ID, map[string]interface{}{
		"name":     newName,
		"position": newPos,
	})
	require.Equal(t, http.StatusOK, w.Code)
	var updated storage.Column
	decodeBody(t, w, &updated)
	assert.Equal(t, newName, updated.Name)
	assert.Equal(t, newPos, updated.Position)
}

func TestColumns_Update_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	w := e.do(t, http.MethodPut, "/api/v1/boards/"+b.ID+"/columns/nope", map[string]string{"name": "x"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestColumns_Delete_CascadesCards(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")

	w := e.do(t, http.MethodDelete, "/api/v1/boards/"+b.ID+"/columns/"+col.ID, nil)
	require.Equal(t, http.StatusNoContent, w.Code)

	_, err := e.db.GetColumn(col.ID)
	assert.Error(t, err)
	_, err = e.db.GetCard(card.ID)
	assert.Error(t, err, "card in deleted column should be gone")
}
