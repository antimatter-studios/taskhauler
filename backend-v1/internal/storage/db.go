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
	return conn, nil
}
