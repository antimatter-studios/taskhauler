package handlers

// Integration tests for the comments REST resource.

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComments_Create_EnrichesAuthorName(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")

	w := e.do(t, http.MethodPost, "/api/v1/cards/"+card.ID+"/comments", map[string]string{"body": "hello"})
	require.Equal(t, http.StatusCreated, w.Code, "body=%s", w.Body.String())
	var cm CommentResponse
	decodeBody(t, w, &cm)
	assert.Equal(t, "hello", cm.Body)
	assert.Equal(t, e.admin.ID, cm.AuthorID, "author_id should be set from JWT user")
	assert.NotEmpty(t, cm.AuthorName, "author_name should be enriched")
	assert.Contains(t, cm.AuthorName, e.admin.Email)
}

func TestComments_Create_CardNotFound(t *testing.T) {
	e := newIntegrationEnv(t)
	w := e.do(t, http.MethodPost, "/api/v1/cards/missing/comments", map[string]string{"body": "x"})
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestComments_Create_MissingBody_400(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")
	w := e.do(t, http.MethodPost, "/api/v1/cards/"+card.ID+"/comments", map[string]string{})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestComments_List_EnrichesAuthorName(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")
	e.seedComment(t, card.ID, e.admin.ID, "first")
	e.seedComment(t, card.ID, e.admin.ID, "second")

	w := e.do(t, http.MethodGet, "/api/v1/cards/"+card.ID+"/comments", nil)
	require.Equal(t, http.StatusOK, w.Code)
	var list []CommentResponse
	decodeBody(t, w, &list)
	require.Len(t, list, 2)
	for _, cm := range list {
		assert.Contains(t, cm.AuthorName, e.admin.Email, "author_name should be enriched in list")
	}
}

func TestComments_Delete(t *testing.T) {
	e := newIntegrationEnv(t)
	b := e.seedBoard(t, "B", "B")
	col := e.seedColumn(t, b.ID, "Todo", 1)
	card := e.seedCard(t, b.ID, col.ID, "T")
	cm := e.seedComment(t, card.ID, e.admin.ID, "x")

	w := e.do(t, http.MethodDelete, "/api/v1/cards/"+card.ID+"/comments/"+cm.ID, nil)
	require.Equal(t, http.StatusNoContent, w.Code)

	list, err := e.db.ListComments(card.ID)
	require.NoError(t, err)
	assert.Empty(t, list)
}
