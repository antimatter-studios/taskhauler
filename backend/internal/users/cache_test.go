package users

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/antimatter-studios/taskhauler/backend/internal/auth"
)

// newTestDB returns a fresh in-memory SQLite-backed *gorm.DB with the auth
// schema migrated. Each call gets a unique DSN so tests don't bleed.
func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	conn, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, auth.AutoMigrate(conn))
	return conn
}

func seedUser(t *testing.T, db *gorm.DB, email, displayName string) *auth.User {
	t.Helper()
	u := &auth.User{Email: email, DisplayName: displayName, PasswordHash: "x"}
	require.NoError(t, db.Create(u).Error)
	return u
}

func TestUserInfo_FormatName(t *testing.T) {
	cases := []struct {
		name string
		u    *UserInfo
		want string
	}{
		{name: "nil receiver", u: nil, want: ""},
		{name: "email only", u: &UserInfo{Email: "a@b.c"}, want: "a@b.c"},
		{name: "display + email", u: &UserInfo{Email: "a@b.c", DisplayName: "Alice"}, want: "Alice (a@b.c)"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.want, tc.u.FormatName())
		})
	}
}

func TestCache_Get_ReturnsNilForZeroID(t *testing.T) {
	db := newTestDB(t)
	c := New(db, time.Minute)
	got, err := c.Get(context.Background(), 0)
	require.NoError(t, err)
	assert.Nil(t, got, "id=0 must short-circuit to (nil, nil)")
}

func TestCache_Get_FetchesAndPopulatesFields(t *testing.T) {
	db := newTestDB(t)
	u := seedUser(t, db, "alice@example.com", "Alice")

	c := New(db, time.Minute)
	got, err := c.Get(context.Background(), u.ID)
	require.NoError(t, err)
	require.NotNil(t, got)
	assert.Equal(t, u.ID, got.ID)
	assert.Equal(t, "alice@example.com", got.Email)
	assert.Equal(t, "Alice", got.DisplayName)
}

func TestCache_Get_MissingUserReturnsError(t *testing.T) {
	db := newTestDB(t)
	c := New(db, time.Minute)
	got, err := c.Get(context.Background(), 99999)
	assert.Error(t, err, "lookup of unknown id must surface gorm.ErrRecordNotFound")
	assert.Nil(t, got)
}

func TestCache_Get_CachesResultWithinTTL(t *testing.T) {
	db := newTestDB(t)
	u := seedUser(t, db, "alice@example.com", "Alice")
	c := New(db, time.Minute)

	// Prime the cache.
	first, err := c.Get(context.Background(), u.ID)
	require.NoError(t, err)
	require.NotNil(t, first)

	// Delete the row from the DB — a fresh fetch would now fail. The cache
	// must serve the stale value because the TTL has not elapsed.
	require.NoError(t, db.Unscoped().Delete(&auth.User{}, u.ID).Error)

	cached, err := c.Get(context.Background(), u.ID)
	require.NoError(t, err, "cached read must not touch the DB while within TTL")
	require.NotNil(t, cached)
	assert.Equal(t, "alice@example.com", cached.Email)
}

func TestCache_Get_RefetchesAfterTTLExpiry(t *testing.T) {
	db := newTestDB(t)
	u := seedUser(t, db, "alice@example.com", "Alice")

	// Very short TTL so we don't waste test time.
	c := New(db, 10*time.Millisecond)

	first, err := c.Get(context.Background(), u.ID)
	require.NoError(t, err)
	require.Equal(t, "Alice", first.DisplayName)

	// Update the row in the DB.
	require.NoError(t, db.Model(&auth.User{}).Where("id = ?", u.ID).Update("display_name", "Alice2").Error)

	// Wait past TTL.
	time.Sleep(25 * time.Millisecond)

	refreshed, err := c.Get(context.Background(), u.ID)
	require.NoError(t, err)
	assert.Equal(t, "Alice2", refreshed.DisplayName, "after TTL the cache must re-fetch from the DB")
}

func TestCache_GetMany_ReturnsKnownUsersAndSkipsMissing(t *testing.T) {
	db := newTestDB(t)
	u1 := seedUser(t, db, "a@x.com", "A")
	u2 := seedUser(t, db, "b@x.com", "B")

	c := New(db, time.Minute)
	got := c.GetMany(context.Background(), []uint{u1.ID, u2.ID, 9999, 0})

	require.Len(t, got, 2, "GetMany must drop missing ids and id=0")
	assert.Equal(t, "a@x.com", got[u1.ID].Email)
	assert.Equal(t, "b@x.com", got[u2.ID].Email)
	_, hasMissing := got[9999]
	assert.False(t, hasMissing)
	_, hasZero := got[0]
	assert.False(t, hasZero)
}

func TestCache_GetMany_EmptyInput(t *testing.T) {
	db := newTestDB(t)
	c := New(db, time.Minute)
	got := c.GetMany(context.Background(), nil)
	assert.NotNil(t, got, "GetMany must return a non-nil map even for empty input")
	assert.Empty(t, got)
}

func TestCache_Get_ConcurrentAccessIsRaceFree(t *testing.T) {
	// Run under `go test -race` to catch any data race on the internal map.
	db := newTestDB(t)
	users := make([]*auth.User, 0, 10)
	for i := 0; i < 10; i++ {
		users = append(users, seedUser(t, db, uuid.New().String()+"@x.com", "u"))
	}
	c := New(db, time.Minute)

	const goroutines = 25
	const perGoroutine = 50
	var success int64
	var wg sync.WaitGroup
	wg.Add(goroutines)
	for g := 0; g < goroutines; g++ {
		go func(g int) {
			defer wg.Done()
			for i := 0; i < perGoroutine; i++ {
				u := users[(g+i)%len(users)]
				got, err := c.Get(context.Background(), u.ID)
				if err == nil && got != nil && got.ID == u.ID {
					atomic.AddInt64(&success, 1)
				}
			}
		}(g)
	}
	wg.Wait()
	assert.Equal(t, int64(goroutines*perGoroutine), success, "every concurrent Get should return the correct user")
}
