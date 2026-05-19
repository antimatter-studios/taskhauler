package events

import (
	"bytes"
	"log"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// captureLog redirects the std log package's output to a buffer for the
// duration of fn and returns whatever was written. We swap log's destination
// and flags so the captured text is deterministic.
func captureLog(t *testing.T, fn func()) string {
	t.Helper()
	var buf bytes.Buffer
	origOut := log.Writer()
	origFlags := log.Flags()
	log.SetOutput(&buf)
	log.SetFlags(0)
	t.Cleanup(func() {
		log.SetOutput(origOut)
		log.SetFlags(origFlags)
	})
	fn()
	return buf.String()
}

func TestNewLogger_ReturnsNonNil(t *testing.T) {
	l := NewLogger()
	require.NotNil(t, l)
}

func TestLogger_ImplementsEventEmitter(t *testing.T) {
	// Compile-time check via assignment: if Logger doesn't satisfy
	// EventEmitter the file won't compile, which is the intent.
	var _ EventEmitter = NewLogger()
}

func TestLogger_PublishEvent_FormatsExpectedLine(t *testing.T) {
	cases := []struct {
		name      string
		eventType string
		detail    string
		want      string
	}{
		{
			name:      "simple event",
			eventType: "card.created",
			detail:    "id=abc title=foo",
			want:      "event card.created: id=abc title=foo\n",
		},
		{
			name:      "empty detail",
			eventType: "board.deleted",
			detail:    "",
			want:      "event board.deleted: \n",
		},
		{
			name:      "empty event type",
			eventType: "",
			detail:    "something happened",
			want:      "event : something happened\n",
		},
		{
			name:      "multiline detail",
			eventType: "comment.added",
			detail:    "line1\nline2",
			want:      "event comment.added: line1\nline2\n",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			l := NewLogger()
			got := captureLog(t, func() {
				l.PublishEvent(tc.eventType, tc.detail)
			})
			assert.Equal(t, tc.want, got)
		})
	}
}

func TestLogger_PublishEvent_ConcurrentCallsAreSafe(t *testing.T) {
	// The Logger holds no state and delegates to the std log package, which is
	// itself goroutine-safe. This test asserts no data race / panic under
	// concurrent publish and that every event ends up in the captured output.
	const goroutines = 50
	const perGoroutine = 20

	got := captureLog(t, func() {
		l := NewLogger()
		var wg sync.WaitGroup
		wg.Add(goroutines)
		for g := 0; g < goroutines; g++ {
			go func(g int) {
				defer wg.Done()
				for i := 0; i < perGoroutine; i++ {
					l.PublishEvent("concurrent", "g=ok")
				}
			}(g)
		}
		wg.Wait()
	})

	// Count occurrences of the event prefix; should equal total publish calls.
	count := strings.Count(got, "event concurrent: g=ok\n")
	assert.Equal(t, goroutines*perGoroutine, count, "every concurrent publish should produce one log line")
}

func TestLogger_PublishEvent_DoesNotPanicOnNilLogger(t *testing.T) {
	// PublishEvent is a value-receiver method, so calling it on a nil *Logger
	// must still be safe (it never dereferences the receiver). This guards the
	// invariant that handlers can hold an EventEmitter interface value backed
	// by a nil *Logger without risk of panic — although in practice we always
	// construct via NewLogger.
	var l *Logger
	require.NotPanics(t, func() {
		_ = captureLog(t, func() {
			l.PublishEvent("nil.receiver", "no panic please")
		})
	})
}
