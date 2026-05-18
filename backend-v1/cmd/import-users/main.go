// Package main implements the import-users CLI tool, which copies users from
// teamagentica's system-user-manager SQLite database into the taskhauler
// Postgres database, preserving the original user IDs so existing task
// assignee_id / author_id references stay valid.
//
// Source DB is opened read-only. The import is idempotent — re-running it
// skips users that already exist (matched by id or email).
package main

import (
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/antimatter-studios/taskhauler/backend/internal/auth"
	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

// taUser mirrors the source-side users table from system-user-manager.
// Datetime columns come back as time.Time; role/banned are TA-specific
// fields not directly modeled by taskhauler.
type taUser struct {
	ID           uint
	Email        string
	PasswordHash string
	DisplayName  string
	Role         string
	Banned       int
	BanReason    string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

func (taUser) TableName() string { return "users" }

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	source := flag.String("source", "/data/users.db", "path to the source SQLite users database (will be opened read-only)")
	dryRun := flag.Bool("dry-run", false, "do not write to Postgres, just report counts")
	includeBanned := flag.Bool("include-banned", false, "import banned users too (default: skip them)")
	flag.Parse()

	if err := run(*source, *dryRun, *includeBanned); err != nil {
		log.Fatalf("import failed: %v", err)
	}
}

func run(sourcePath string, dryRun, includeBanned bool) error {
	if _, err := os.Stat(sourcePath); err != nil {
		return fmt.Errorf("source database not found at %q: %w", sourcePath, err)
	}

	sqliteDSN := "file:" + url.PathEscape(sourcePath) + "?mode=ro&_journal_mode=OFF&_busy_timeout=5000&immutable=1"
	srcConn, err := gorm.Open(sqlite.Open(sqliteDSN), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("open source sqlite: %w", err)
	}
	log.Printf("source: %s (read-only)", sourcePath)

	// Read all users from TA (including soft-deleted, so the DeletedAt is preserved).
	var rows []taUser
	q := srcConn.Unscoped().Table("users")
	if !includeBanned {
		q = q.Where("banned = 0 OR banned IS NULL")
	}
	if err := q.Find(&rows).Error; err != nil {
		return fmt.Errorf("read users: %w", err)
	}
	log.Printf("source: %d users (banned %s)", len(rows), func() string {
		if includeBanned {
			return "included"
		}
		return "excluded"
	}())

	if dryRun {
		fmt.Printf("Would import %d users (dry-run, no writes)\n", len(rows))
		for _, u := range rows {
			fmt.Printf("  id=%d email=%s role=%s banned=%d display=%q\n",
				u.ID, u.Email, u.Role, u.Banned, u.DisplayName)
		}
		return nil
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL env var is required")
	}
	// storage.Open runs the task-tracker AutoMigrate; auth.AutoMigrate ensures
	// the users / service_account_tokens tables exist.
	dstConn, err := storage.Open(dsn)
	if err != nil {
		return fmt.Errorf("open postgres: %w", err)
	}
	if err := auth.AutoMigrate(dstConn); err != nil {
		return fmt.Errorf("auth automigrate: %w", err)
	}
	log.Printf("destination: postgres connected, schema migrated")

	// Map TA rows → TH auth.User. Preserve the original id so cards.assignee_id
	// and comments.author_id (already imported from the task-tracker DB) keep
	// referring to the right human.
	users := make([]auth.User, 0, len(rows))
	for _, u := range rows {
		users = append(users, auth.User{
			ID:               u.ID,
			Email:            strings.ToLower(strings.TrimSpace(u.Email)),
			PasswordHash:     u.PasswordHash,
			DisplayName:      u.DisplayName,
			IsAdmin:          strings.EqualFold(u.Role, "admin"),
			IsServiceAccount: false,
			CreatedAt:        u.CreatedAt.UnixMilli(),
			UpdatedAt:        u.UpdatedAt.UnixMilli(),
			DeletedAt:        u.DeletedAt,
		})
	}

	if len(users) == 0 {
		fmt.Println("Imported 0 users (source had no rows)")
		return nil
	}

	// Idempotent insert: skip rows whose id already exists in TH. Email also
	// has a unique index, so a row with the same email but different id will
	// also be skipped — that's the intended behavior (TH's seeded admin won't
	// clobber, and a re-run won't fail).
	res := dstConn.Clauses(clause.OnConflict{DoNothing: true}).Create(&users)
	if res.Error != nil {
		return fmt.Errorf("insert users: %w", res.Error)
	}

	// Postgres autoincrement: bump users_id_seq past the max imported id so
	// subsequent INSERTs (e.g. someone signing up via the API) don't collide
	// with an imported id. Safe to run unconditionally.
	if err := dstConn.Exec(`SELECT setval('users_id_seq', (SELECT GREATEST(MAX(id), 1) FROM users))`).Error; err != nil {
		return fmt.Errorf("bump users_id_seq: %w", err)
	}

	fmt.Printf("Imported %d users (source had %d — rows already present in Postgres are skipped)\n",
		res.RowsAffected, len(rows))
	return nil
}
