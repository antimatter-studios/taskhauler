package openapi

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// roundTrippedSpec marshals the spec via Spec.JSON and unmarshals it into a
// plain map[string]interface{}. We need this for inspection because go-oapifly
// returns typed concrete maps inside the raw Map() result (e.g. `paths` is a
// `map[string]map[string]PathItem`), so direct map[string]interface{} casts
// against Map() silently miss those fields. The JSON round-trip flattens
// everything into generic maps and is exactly what API consumers receive.
func roundTrippedSpec(t *testing.T, s *Spec) map[string]interface{} {
	t.Helper()
	data, err := s.JSON()
	require.NoError(t, err)
	require.NotEmpty(t, data)

	var got map[string]interface{}
	require.NoError(t, json.Unmarshal(data, &got))
	return got
}

func TestNew_ReturnsConfiguredSpec(t *testing.T) {
	s := New()
	require.NotNil(t, s)
	require.NotNil(t, s.gen, "generator must be initialised by New()")
}

func TestSpec_JSON_ProducesValidJSON(t *testing.T) {
	s := New()
	data, err := s.JSON()
	require.NoError(t, err)
	require.NotEmpty(t, data)
	assert.True(t, json.Valid(data), "Spec.JSON() must produce valid JSON")
}

func TestSpec_Map_PopulatesTopLevelFields(t *testing.T) {
	s := New()
	spec := roundTrippedSpec(t, s)

	// info.title / info.version / info.description come from the constants
	// in openapi.go via postProcess / oapifly.Config.
	info, ok := spec["info"].(map[string]interface{})
	require.True(t, ok, "spec must contain an info object")
	assert.Equal(t, specTitle, info["title"])
	assert.Equal(t, specVersion, info["version"])
	assert.Equal(t, specDescription, info["description"])

	// openapi version field — the library emits "3.0.0" or similar. We just
	// require it's a non-empty string starting with "3." since the exact
	// patch revision is the library's concern, not ours.
	v, _ := spec["openapi"].(string)
	assert.NotEmpty(t, v, "openapi version field must be set")
	if v != "" {
		assert.Equal(t, "3.", v[:2], "should declare OpenAPI 3.x")
	}
}

func TestSpec_Map_IncludesExpectedPaths(t *testing.T) {
	s := New()
	spec := roundTrippedSpec(t, s)

	paths, ok := spec["paths"].(map[string]interface{})
	require.True(t, ok, "spec.paths must be a map after JSON round-trip")
	require.NotEmpty(t, paths, "spec.paths must be populated by the AST scanner")

	// Pick a handful of routes we know exist in handlers/ and auth/ and assert
	// they're present. We don't enumerate every endpoint — that would couple
	// this test to handler churn — we just sample to prove the scanner ran.
	// Paths are emitted with the `/api/v1` prefix as declared on the @Router
	// annotations in handlers/auth.
	expected := []string{
		"/api/v1/boards",
		"/api/v1/cards/{cid}",
		"/api/v1/auth/login",
	}
	for _, want := range expected {
		assert.Containsf(t, paths, want, "expected path %q to appear in spec.paths (keys: %v)", want, mapKeys(paths))
	}
}

func TestSpec_Map_IncludesSchemas(t *testing.T) {
	s := New()
	spec := roundTrippedSpec(t, s)

	components, ok := spec["components"].(map[string]interface{})
	require.True(t, ok, "spec.components must exist")

	schemas, ok := components["schemas"].(map[string]interface{})
	require.True(t, ok, "spec.components.schemas must exist")
	assert.NotEmpty(t, schemas, "schemas must be populated by the AST scanner (saw 0 entries — TypeDirs may be misconfigured)")
}

func TestSpec_Map_PostProcessAddsServersAndSecurity(t *testing.T) {
	s := New()
	spec := roundTrippedSpec(t, s)

	// servers
	servers, ok := spec["servers"].([]interface{})
	require.True(t, ok, "spec.servers must be an array")
	require.Len(t, servers, 1)
	srv, _ := servers[0].(map[string]interface{})
	require.NotNil(t, srv)
	assert.Equal(t, "http://localhost:8080", srv["url"])

	// components.securitySchemes.bearerAuth
	components, _ := spec["components"].(map[string]interface{})
	require.NotNil(t, components)
	schemes, ok := components["securitySchemes"].(map[string]interface{})
	require.True(t, ok)
	bearer, ok := schemes["bearerAuth"].(map[string]interface{})
	require.True(t, ok, "bearerAuth security scheme must be present")
	assert.Equal(t, "http", bearer["type"])
	assert.Equal(t, "bearer", bearer["scheme"])
	assert.Equal(t, "JWT", bearer["bearerFormat"])

	// global security requirement
	sec, ok := spec["security"].([]interface{})
	require.True(t, ok, "spec.security must be an array")
	require.NotEmpty(t, sec)
}

func TestSpec_Map_CachedAcrossCalls(t *testing.T) {
	// Spec.Map uses sync.Once — the returned map should be the same value on
	// each call so callers can rely on identity. We compare via pointer
	// equality since map values in Go reference an underlying header.
	s := New()
	m1 := s.Map()
	m2 := s.Map()
	require.NotNil(t, m1)
	// Mutate m1 and verify m2 sees the change — proves they share storage.
	m1["__test_sentinel__"] = "yes"
	assert.Equal(t, "yes", m2["__test_sentinel__"], "Spec.Map should be cached and return the same underlying map")
	delete(m1, "__test_sentinel__")
}

func TestSpec_Warnings_NonNilSlice(t *testing.T) {
	// Warnings is just a passthrough to gen.Warnings. We don't assert content
	// (warnings depend on what the scanner finds in /internal/handlers etc.),
	// we just exercise that calling it after Map() doesn't panic and returns
	// a slice (possibly empty).
	s := New()
	_ = s.Map() // ensure generator has run
	w := s.Warnings()
	// Warnings may be empty; what matters is that the call is safe.
	_ = w
}

func mapKeys(m map[string]interface{}) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
