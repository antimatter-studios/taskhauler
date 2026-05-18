package auth

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newAuthTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := "file:" + uuid.New().String() + "?mode=memory&cache=shared"
	conn, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, AutoMigrate(conn))
	return conn
}

func TestSeedAdmin_WhenNoUsers(t *testing.T) {
	db := newAuthTestDB(t)

	err := SeedAdmin(db, "admin@x.test", "s3cret", false)
	require.NoError(t, err)

	var u User
	require.NoError(t, db.First(&u, "email = ?", "admin@x.test").Error)
	assert.Equal(t, "admin@x.test", u.Email)
	assert.True(t, u.IsAdmin)
	assert.NotEmpty(t, u.PasswordHash)
	assert.True(t, CheckPassword(u.PasswordHash, "s3cret"))
}

func TestSeedAdmin_WhenUsersExist(t *testing.T) {
	db := newAuthTestDB(t)

	// Pre-seed an existing user.
	hash, err := HashPassword("existing")
	require.NoError(t, err)
	require.NoError(t, db.Create(&User{Email: "someone@x.test", PasswordHash: hash}).Error)

	// SeedAdmin should be a no-op because count > 0.
	err = SeedAdmin(db, "admin@x.test", "s3cret", true)
	require.NoError(t, err)

	var count int64
	require.NoError(t, db.Model(&User{}).Count(&count).Error)
	assert.Equal(t, int64(1), count, "no new admin should be created when users already exist")

	// Confirm the requested admin email was NOT created.
	var found User
	err = db.First(&found, "email = ?", "admin@x.test").Error
	assert.Error(t, err, "admin should not have been created")
}
