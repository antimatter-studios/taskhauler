package events

import "log"

// EventEmitter is the interface used by handlers to emit task-tracking events.
type EventEmitter interface {
	PublishEvent(eventType, detail string)
}

// Logger is a no-op EventEmitter that just writes events to stdout.
type Logger struct{}

// NewLogger returns a Logger.
func NewLogger() *Logger { return &Logger{} }

// PublishEvent satisfies EventEmitter.
func (l *Logger) PublishEvent(eventType, detail string) {
	log.Printf("event %s: %s", eventType, detail)
}
