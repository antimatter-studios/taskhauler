# import-sqlite

Imports task-tracker data from a SQLite database (the legacy teamagentica
`tool-task-tracker` plugin store) into the taskhauler Postgres database.

Usage:

```
DATABASE_URL='postgres://user:pass@host:5432/db?sslmode=disable' \
  go run ./cmd/import-sqlite --source /path/to/tasks.db
```

Flags: `--source <path>` (default `/data/source.db`), `--dry-run` (read source
only, report counts, no Postgres writes).

The source DB is opened read-only (`mode=ro&immutable=1`) and is never written
to. Imports are idempotent — rerunning skips rows whose `id` already exists
(`ON CONFLICT (id) DO NOTHING`). IDs, timestamps, and soft-deletes are
preserved verbatim.
