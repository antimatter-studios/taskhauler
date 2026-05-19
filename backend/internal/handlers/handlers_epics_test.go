package handlers

// Integration tests for the epics REST resource.

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func TestEpics_CreateAndList(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")

	w := e.do(t, http.MethodPost, "/api/v1/boards/"+b.ID+"/epics", map[string]interface{}{
		"name":        "Q1 Goals",
		"description": "all the things",
		"color":       "#4A90D9",
		"position":    1.0,
	})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var ep storage.Epic
	decodeBody(t, w, &ep)
	assert.Equal(t, "Q1 Goals", ep.Name)
	assert.Equal(t, "#4A90D9", ep.Color)
	assert.Equal(t, b.ID, ep.BoardID)

	w = e.do(t, http.MethodGet, "/api/v1/boards/"+b.ID+"/epics", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var list []storage.Epic
	decodeBody(t, w, &list)
	require.Len(t, list, 1)
	assert.Equal(t, ep.ID, list[0].ID)
}

func TestEpics_Create_BoardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/boards/missing/epics", map[string]string{"name": "x"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestEpics_Create_MissingName_400(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	w := e.do(t, http.MethodPost, "/api/v1/boards/"+b.ID+"/epics", map[string]interface{}{"color": "#000"})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestEpics_Update_PartialFields(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	ep := e.seedEpic(t, b.ID, "Old")

	newName := "New"
	newColor := "#FF0000"
	w := e.do(t, http.MethodPut, "/api/v1/boards/"+b.ID+"/epics/"+ep.ID, map[string]interface{}{
		"name":  newName,
		"color": newColor,
	})
	require.Equal(t, http.StatusOK, w.Code)
	var updated storage.Epic
	decodeBody(t, w, &updated)
	assert.Equal(t, "New", updated.Name)
	assert.Equal(t, "#FF0000", updated.Color)
}

func TestEpics_Update_NotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	w := e.do(t, http.MethodPut, "/api/v1/boards/"+b.ID+"/epics/nope", map[string]string{"name": "x"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestEpics_Delete_UnlinksCardsNotDeletes(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	ep := e.seedEpic(t, b.ID, "Epic 1")
	card := e.seedCard(t, b.ID, col.ID, "T")
	card.EpicID = ep.ID
	require.NoError(t, e.db.UpdateCard(card))

	w := e.do(t, http.MethodDelete, "/api/v1/boards/"+b.ID+"/epics/"+ep.ID, nil)
	require.Equal(t, http.StatusNoContent, w.Code)

	_, err := e.db.GetEpic(ep.ID)
	assert.Error(t, err)

	// Card still exists but its epic link is cleared.
	got, err := e.db.GetCard(card.ID)
	require.NoError(t, err)
	assert.Empty(t, got.EpicID, "DeleteEpic should unlink cards, not delete them")
}
