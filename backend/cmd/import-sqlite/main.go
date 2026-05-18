// Package main implements the import-sqlite CLI tool, which copies all
// task-tracker data from a (read-only) SQLite database into the taskhauler
// Postgres database. It is idempotent: re-running it will not duplicate rows.
package main

import (
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
)

// boardRow mirrors storage.Board but uses *string for Prefix so NULL prefixes
// in the source SQLite are preserved as NULL in Postgres (the unique index on
// `prefix` allows multiple NULLs but not multiple empty strings).
type boardRow struct {
	ID          string  `gorm:"primaryKey"`
	Name        string
	Prefix      *string `gorm:"uniqueIndex"`
	Description string
	CreatedAt   int64   `gorm:"autoCreateTime:milli"`
	UpdatedAt   int64   `gorm:"autoUpdateTime:milli"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func (boardRow) TableName() string { return "boards" }

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	source := flag.String("source", "/data/source.db", "path to the source SQLite database (will be opened read-only)")
	dryRun := flag.Bool("dry-run", false, "do not write to Postgres, just report counts")
	flag.Parse()

	if err := run(*source, *dryRun); err != nil {
		log.Fatalf("import failed: %v", err)
	}
}

func run(sourcePath string, dryRun bool) error {
	// Verify source exists before doing anything else.
	if _, err := os.Stat(sourcePath); err != nil {
		return fmt.Errorf("source database not found at %q: %w", sourcePath, err)
	}

	// Open SQLite read-only. The mode=ro URI parameter prevents writes at the
	// SQLite level; _journal_mode=OFF avoids any -journal/-wal side files being
	// created. The path is percent-escaped so paths with spaces/special chars work.
	sqliteDSN := "file:" + url.PathEscape(sourcePath) + "?mode=ro&_journal_mode=OFF&_busy_timeout=5000&immutable=1"
	srcConn, err := gorm.Open(sqlite.Open(sqliteDSN), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("open source sqlite: %w", err)
	}
	log.Printf("source: %s (read-only)", sourcePath)

	// Read all rows from each table. We use Unscoped so soft-deleted rows are
	// included verbatim (preserving DeletedAt). Boards use boardRow (with a
	// nullable Prefix) to preserve NULL semantics across the migration.
	var boards []boardRow
	if err := srcConn.Unscoped().Table("boards").Find(&boards).Error; err != nil {
		return fmt.Errorf("read boards: %w", err)
	}
	var columns []storage.Column
	if err := srcConn.Unscoped().Find(&columns).Error; err != nil {
		return fmt.Errorf("read columns: %w", err)
	}
	var epics []storage.Epic
	if err := srcConn.Unscoped().Find(&epics).Error; err != nil {
		return fmt.Errorf("read epics: %w", err)
	}
	var cards []storage.Card
	if err := srcConn.Unscoped().Find(&cards).Error; err != nil {
		return fmt.Errorf("read cards: %w", err)
	}
	var comments []storage.Comment
	if err := srcConn.Unscoped().Find(&comments).Error; err != nil {
		return fmt.Errorf("read comments: %w", err)
	}

	log.Printf("source counts: boards=%d columns=%d epics=%d cards=%d comments=%d",
		len(boards), len(columns), len(epics), len(cards), len(comments))

	if dryRun {
		log.Printf("--dry-run: not writing to Postgres")
		fmt.Printf("Imported (dry-run) %d boards, %d columns, %d epics, %d cards, %d comments\n",
			len(boards), len(columns), len(epics), len(cards), len(comments))
		return nil
	}

	// Connect to Postgres target. storage.Open runs AutoMigrate.
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL env var is required")
	}
	dstConn, err := storage.Open(dsn)
	if err != nil {
		return fmt.Errorf("open postgres: %w", err)
	}
	log.Printf("destination: postgres connected, schema migrated")

	// Upsert each entity in dependency order. DoNothing on any conflict makes
	// the import idempotent — re-running won't duplicate or overwrite rows.
	// We deliberately do NOT pin a target column (e.g. id) because the source
	// schema has multiple unique constraints (notably boards.prefix) and we
	// want all of them to be treated as "row already present, skip".
	upsertOpts := clause.OnConflict{DoNothing: true}

	imported := struct {
		boards, columns, epics, cards, comments int64
	}{}

	if len(boards) > 0 {
		res := dstConn.Clauses(upsertOpts).Create(&boards)
		if res.Error != nil {
			return fmt.Errorf("insert boards: %w", res.Error)
		}
		imported.boards = res.RowsAffected
	}
	if len(columns) > 0 {
		res := dstConn.Clauses(upsertOpts).Create(&columns)
		if res.Error != nil {
			return fmt.Errorf("insert columns: %w", res.Error)
		}
		imported.columns = res.RowsAffected
	}
	if len(epics) > 0 {
		res := dstConn.Clauses(upsertOpts).Create(&epics)
		if res.Error != nil {
			return fmt.Errorf("insert epics: %w", res.Error)
		}
		imported.epics = res.RowsAffected
	}
	if len(cards) > 0 {
		// Insert cards in chunks of 500 to keep parameter counts within Postgres'
		// 65535-parameter limit (each card has ~17 columns).
		const chunk = 500
		for i := 0; i < len(cards); i += chunk {
			end := i + chunk
			if end > len(cards) {
				end = len(cards)
			}
			res := dstConn.Clauses(upsertOpts).Create(cards[i:end])
			if res.Error != nil {
				return fmt.Errorf("insert cards [%d:%d]: %w", i, end, res.Error)
			}
			imported.cards += res.RowsAffected
		}
	}
	if len(comments) > 0 {
		const chunk = 500
		for i := 0; i < len(comments); i += chunk {
			end := i + chunk
			if end > len(comments) {
				end = len(comments)
			}
			res := dstConn.Clauses(upsertOpts).Create(comments[i:end])
			if res.Error != nil {
				return fmt.Errorf("insert comments [%d:%d]: %w", i, end, res.Error)
			}
			imported.comments += res.RowsAffected
		}
	}

	fmt.Printf("Imported %d boards, %d columns, %d epics, %d cards, %d comments\n",
		imported.boards, imported.columns, imported.epics, imported.cards, imported.comments)
	fmt.Printf("(source had %d boards, %d columns, %d epics, %d cards, %d comments — rows already present in Postgres are skipped)\n",
		len(boards), len(columns), len(epics), len(cards), len(comments))
	return nil
}
