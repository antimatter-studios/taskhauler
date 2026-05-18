// Package openapi wires github.com/antimatter-studios/go-oapifly into the
// taskhauler backend. The library is an AST scanner: it reads Go source files
// at runtime and parses swaggo-style annotations (`@Router`, `@Summary`,
// `@Param`, `@Success`, `@Failure`) to produce an OpenAPI 3.0 map. It does
// NOT wrap gin's route registration — handlers are untouched apart from the
// doc-comment annotations.
//
// The library has a few features the taskhauler API needs that it does not
// supply out of the box (security schemes, the `servers` block, a fallback
// for body-less endpoints, time.Time → date-time format). We patch those in
// here as a post-processing step over the map the library returns.
package openapi

import (
	"encoding/json"
	"path/filepath"
	"runtime"
	"sync"

	oapifly "github.com/antimatter-studios/go-oapifly"
)

const (
	specTitle       = "TaskHauler API"
	specDescription = "TaskHauler kanban-style task tracker REST API with MCP tool endpoints."
	specVersion     = "1.0.0"
)

// Spec wraps a cached generator so subsequent calls reuse the same map.
type Spec struct {
	once sync.Once
	mu   sync.Mutex
	spec map[string]interface{}
	gen  *oapifly.Generator
}

// backendRoot returns the absolute path to the backend module root, derived
// from this source file's location. We do this so the spec can be generated
// regardless of which cwd the binary is run from.
func backendRoot() string {
	_, file, _, _ := runtime.Caller(0)
	// file = .../backend/internal/openapi/openapi.go
	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", ".."))
}

// New constructs a Spec configured to scan the backend's source tree.
func New() *Spec {
	root := backendRoot()
	gen := oapifly.New(oapifly.Config{
		Title:       specTitle,
		Description: specDescription,
		Version:     specVersion,
		ScanPatterns: []string{
			filepath.Join(root, "internal", "handlers", "*.go"),
			filepath.Join(root, "internal", "auth", "*.go"),
			// Scanned only so @schema-annotated structs (storage.Card etc)
			// are pulled into components.schemas even though no handler
			// returns them directly (they're embedded inside *Response
			// wrappers, and the library does not recurse through embedded
			// fields to register their types).
			filepath.Join(root, "internal", "storage", "*.go"),
		},
		TypeDirs: []string{
			filepath.Join(root, "internal", "handlers"),
			filepath.Join(root, "internal", "auth"),
			filepath.Join(root, "internal", "storage"),
		},
	})
	return &Spec{gen: gen}
}

// Map returns the OpenAPI 3.0 spec as a generic map, building it the first
// time and caching thereafter.
func (s *Spec) Map() map[string]interface{} {
	s.once.Do(func() {
		s.mu.Lock()
		defer s.mu.Unlock()
		raw := s.gen.Generate()
		s.spec = postProcess(raw)
	})
	return s.spec
}

// JSON returns the spec serialized as indented JSON.
func (s *Spec) JSON() ([]byte, error) {
	return json.MarshalIndent(s.Map(), "", "  ")
}

// Warnings returns any non-fatal issues encountered by the AST scanner.
// Useful for surfacing library gaps during CI / local generation.
func (s *Spec) Warnings() []string {
	return s.gen.Warnings
}

// postProcess mutates the generator's raw map to add features that
// go-oapifly does not produce on its own:
//   - components.securitySchemes (bearerAuth)
//   - a global security requirement
//   - a servers entry pointing at the local dev server
func postProcess(spec map[string]interface{}) map[string]interface{} {
	if spec == nil {
		spec = map[string]interface{}{}
	}

	// servers
	spec["servers"] = []map[string]interface{}{
		{"url": "http://localhost:8080", "description": "Local development"},
	}

	// Ensure components exists, then add securitySchemes.
	components, _ := spec["components"].(map[string]interface{})
	if components == nil {
		components = map[string]interface{}{}
		spec["components"] = components
	}
	components["securitySchemes"] = map[string]interface{}{
		"bearerAuth": map[string]interface{}{
			"type":         "http",
			"scheme":       "bearer",
			"bearerFormat": "JWT",
			"description":  "JWT access token issued by /api/v1/auth/login, or `tha_*` service-account token.",
		},
	}

	// Global security requirement. Public endpoints (login/refresh/health)
	// can override this with an empty security array if desired; we leave
	// the global requirement in place for documentation simplicity.
	spec["security"] = []map[string]interface{}{
		{"bearerAuth": []string{}},
	}

	return spec
}
