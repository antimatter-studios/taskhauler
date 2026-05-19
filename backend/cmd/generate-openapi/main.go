// Command generate-openapi writes the generated OpenAPI 3.0 spec for the
// taskhauler backend to a file (default: openapi.json in the cwd).
//
// Usage:
//
//	go run ./cmd/generate-openapi --out openapi.json
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/antimatter-studios/taskhauler/backend/internal/openapi"
)

func main() {
	out := flag.String("out", "openapi.json", "Output path for the generated OpenAPI JSON spec")
	flag.Parse()

	spec := openapi.New()
	data, err := spec.JSON()
	if err != nil {
		log.Fatalf("marshal spec: %v", err)
	}
	if err := os.WriteFile(*out, data, 0o644); err != nil {
		log.Fatalf("write %s: %v", *out, err)
	}

	for _, w := range spec.Warnings() {
		fmt.Fprintln(os.Stderr, "[oapifly warning]", w)
	}

	pathCount, schemaCount := countSpec(spec.Map())
	fmt.Printf("wrote %s (paths=%d schemas=%d)\n", *out, pathCount, schemaCount)
}

// countSpec counts paths and schemas without relying on a specific concrete
// map type — go-oapifly uses typed `map[string]map[string]PathItem` for paths
// rather than `map[string]interface{}`, so the obvious cast fails silently.
func countSpec(m map[string]interface{}) (int, int) {
	pathCount := 0
	switch p := m["paths"].(type) {
	case map[string]interface{}:
		pathCount = len(p)
	default:
		// Re-serialize the spec to JSON and count via the resulting map.
		// Cheap and dependency-free.
		b, err := json.Marshal(m)
		if err == nil {
			var generic map[string]interface{}
			if json.Unmarshal(b, &generic) == nil {
				if pp, ok := generic["paths"].(map[string]interface{}); ok {
					pathCount = len(pp)
				}
				if comps, ok := generic["components"].(map[string]interface{}); ok {
					if schemas, ok := comps["schemas"].(map[string]interface{}); ok {
						return pathCount, len(schemas)
					}
				}
			}
		}
	}
	schemaCount := 0
	if comps, ok := m["components"].(map[string]interface{}); ok {
		if schemas, ok := comps["schemas"].(map[string]map[string]interface{}); ok {
			schemaCount = len(schemas)
		} else if schemas, ok := comps["schemas"].(map[string]interface{}); ok {
			schemaCount = len(schemas)
		}
	}
	return pathCount, schemaCount
}
