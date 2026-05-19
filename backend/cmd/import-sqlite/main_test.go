package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// TestImportSqlite_CmdBuilds verifies the import-sqlite CLI compiles. The
// full importer round-trip needs both a SQLite source file and a Postgres
// target, so a real smoke test is impractical here — the importer was
// manually verified against TA data in TH-15. This test catches the
// regression case where the cmd package stops compiling.
func TestImportSqlite_CmdBuilds(t *testing.T) {
	dir := t.TempDir()
	out := filepath.Join(dir, "import-sqlite-test-bin")
	cmd := exec.Command("go", "build", "-o", out, ".")
	cmd.Env = os.Environ()
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("go build failed: %v\n%s", err, output)
	}
	if _, err := os.Stat(out); err != nil {
		t.Fatalf("expected binary at %s: %v", out, err)
	}
}
