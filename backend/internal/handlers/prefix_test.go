package handlers

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

func newTestHandler(t *testing.T) *Handler {
	t.Helper()
	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	conn, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, conn.AutoMigrate(&storage.Board{}, &storage.Column{}, &storage.Epic{}, &storage.Card{}, &storage.Comment{}))
	db := storage.NewDB(conn)
	return New(db, nil, nil)
}

func TestDerivePrefix_MultiWord(t *testing.T) {
	assert.Equal(t, "IP", derivePrefix("Infrastructure Platform"))
}

func TestDerivePrefix_SingleWord(t *testing.T) {
	assert.Equal(t, "ROAD", derivePrefix("Roadmap"))
}

func TestDerivePrefix_StopWords(t *testing.T) {
	assert.Equal(t, "QBF", derivePrefix("The Quick Brown Fox"))
}

func TestDerivePrefix_AndOf(t *testing.T) {
	assert.Equal(t, "BI", derivePrefix("Bugs and Issues"))
	assert.Equal(t, "MT", derivePrefix("Memory of Things"))
}

func TestDerivePrefix_Empty(t *testing.T) {
	assert.Equal(t, "", derivePrefix(""))
}

func TestDerivePrefix_Numeric(t *testing.T) {
	// "100 Bugs" → two tokens ["100","Bugs"], multi-word path takes first
	// char of each → "1B".
	assert.Equal(t, "1B", derivePrefix("100 Bugs"))
}

func TestDerivePrefix_NonAlpha(t *testing.T) {
	// Non-alphanumeric chars are field separators → tokens ["Foo","Bar"] → "FB".
	assert.Equal(t, "FB", derivePrefix("Foo!!Bar??"))
}

func TestDerivePrefix_AllStopWords(t *testing.T) {
	assert.Equal(t, "", derivePrefix("the of a an"))
}

func TestUniqueBoardPrefix_Collision(t *testing.T) {
	h := newTestHandler(t)

	// Seed one board with prefix INFR.
	require.NoError(t, h.db.CreateBoard(&storage.Board{ID: uuid.New().String(), Name: "Infrastructure", Prefix: "INFR"}))

	// Asking for INFR again should bump to INFR2.
	got := h.uniqueBoardPrefix("INFR")
	assert.Equal(t, "INFR2", got)

	// Seed it.
	require.NoError(t, h.db.CreateBoard(&storage.Board{ID: uuid.New().String(), Name: "Infrastructure 2", Prefix: "INFR2"}))

	got = h.uniqueBoardPrefix("INFR")
	assert.Equal(t, "INFR3", got)
}

func TestUniqueBoardPrefix_DoubleCollision(t *testing.T) {
	h := newTestHandler(t)
	for _, p := range []string{"BI", "BI2", "BI3"} {
		require.NoError(t, h.db.CreateBoard(&storage.Board{ID: uuid.New().String(), Name: "Bugs " + p, Prefix: p}))
	}
	got := h.uniqueBoardPrefix("BI")
	assert.Equal(t, "BI4", got)
}

func TestUniqueBoardPrefix_Empty(t *testing.T) {
	h := newTestHandler(t)
	assert.Equal(t, "", h.uniqueBoardPrefix(""))
}
