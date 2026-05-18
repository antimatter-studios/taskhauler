package storage

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Open connects to Postgres via the given DSN and runs AutoMigrate for all
// task-tracker tables. Returns the *gorm.DB so callers can also pass it to
// auth.AutoMigrate etc.
func Open(dsn string) (*gorm.DB, error) {
	conn, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}
	if err := conn.AutoMigrate(&Board{}, &Column{}, &Epic{}, &Card{}, &Comment{}); err != nil {
		return nil, fmt.Errorf("automigrate: %w", err)
	}
	// Drop any all-rows unique index AutoMigrate may have left from earlier
	// schema versions, then create a partial unique index so multiple boards
	// can coexist without a prefix while set prefixes still collide cleanly.
	if err := conn.Exec(`DROP INDEX IF EXISTS idx_boards_prefix`).Error; err != nil {
		return nil, fmt.Errorf("drop old prefix index: %w", err)
	}
	if err := conn.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_boards_prefix
		ON boards (prefix) WHERE prefix <> '' AND deleted_at IS NULL`).Error; err != nil {
		return nil, fmt.Errorf("create partial prefix index: %w", err)
	}
	return conn, nil
}
