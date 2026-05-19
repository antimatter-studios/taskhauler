package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

// TestImportUsers_CmdBuilds verifies the import-users CLI compiles. Same
// rationale as the import-sqlite test: full execution needs both source DB
// and target DB, so we only catch compile-time regressions here. The full
// importer was verified manually in TH-10/TH-16.
func TestImportUsers_CmdBuilds(t *testing.T) {
	dir := t.TempDir()
	out := filepath.Join(dir, "import-users-test-bin")
	cmd := exec.Command("go", "build", "-o", out, ".")
	cmd.Env = os.Environ()
	if output, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("go build failed: %v\n%s", err, output)
	}
	if _, err := os.Stat(out); err != nil {
		t.Fatalf("expected binary at %s: %v", out, err)
	}
}
