package users

import (
	"context"
	"fmt"
	"sync"
	"time"

	"gorm.io/gorm"

	"github.com/antimatter-studios/taskhauler/backend/internal/auth"
)

// UserInfo is the trimmed-down identity shape used by handlers.
type UserInfo struct {
	ID          uint   `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
}

// FormatName returns "Display Name (email)" or just email.
func (u *UserInfo) FormatName() string {
	if u == nil {
		return ""
	}
	if u.DisplayName != "" {
		return fmt.Sprintf("%s (%s)", u.DisplayName, u.Email)
	}
	return u.Email
}

type entry struct {
	user      *UserInfo
	fetchedAt time.Time
}

// Cache is a TTL-bounded user lookup backed by the local users table.
type Cache struct {
	db    *gorm.DB
	mu    sync.RWMutex
	users map[uint]*entry
	ttl   time.Duration
}

// New constructs a Cache. Pass the shared *gorm.DB.
func New(db *gorm.DB, ttl time.Duration) *Cache {
	return &Cache{db: db, users: make(map[uint]*entry), ttl: ttl}
}

// Get returns the user with the given ID, or nil for id 0.
func (c *Cache) Get(ctx context.Context, id uint) (*UserInfo, error) {
	if id == 0 {
		return nil, nil
	}
	c.mu.RLock()
	if e, ok := c.users[id]; ok && time.Since(e.fetchedAt) < c.ttl {
		c.mu.RUnlock()
		return e.user, nil
	}
	c.mu.RUnlock()

	var u auth.User
	if err := c.db.WithContext(ctx).First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	info := &UserInfo{ID: u.ID, Email: u.Email, DisplayName: u.DisplayName}

	c.mu.Lock()
	c.users[id] = &entry{user: info, fetchedAt: time.Now()}
	c.mu.Unlock()
	return info, nil
}

// GetMany resolves multiple user IDs, silently dropping errors.
func (c *Cache) GetMany(ctx context.Context, ids []uint) map[uint]*UserInfo {
	result := make(map[uint]*UserInfo, len(ids))
	for _, id := range ids {
		if u, err := c.Get(ctx, id); err == nil && u != nil {
			result[id] = u
		}
	}
	return result
}
