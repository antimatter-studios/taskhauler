# `src/mock/` — frontend-v2 mock data

This directory holds the **client-side mock data** that powers panels whose
backing API endpoint doesn't exist yet. It exists so we can ship the full v2
design from day one without waiting on backend work.

## Strategy

> Render every panel at full visual fidelity. Where `/api/v1` doesn't yet
> supply the needed data, import a `MOCK_*` constant from this directory.
> When the endpoint lands, swap the import for a store hook — the UI doesn't
> change.

See [`docs/frontend-v2-status.md`](../../../docs/frontend-v2-status.md) for
the full status matrix.

## Files

| File | Exports | Will be replaced by |
|---|---|---|
| `users.ts` | `MOCK_USERS`, `MockUser` | `GET /api/v1/users` |
| `agents.ts` | `MOCK_AGENTS`, `MockAgent` | `GET /api/v1/registry/agents` (with status field added) |
| `presence.ts` | `MOCK_PRESENCE`, `PresenceEntry` | `WS /api/v1/boards/:id/presence` |
| `telemetry.ts` | `MOCK_TELEMETRY`, `AgentTelemetry` | `GET /api/v1/registry/agents/telemetry` |
| `transcripts.ts` | `MOCK_TRANSCRIPTS`, `AgentTranscriptLine` | `GET /api/v1/registry/agents/:name/transcript` |
| `activity.ts` | `MOCK_ACTIVITY`, `ActivityEvent` | `GET /api/v1/boards/:id/activity` |
| `proposals.ts` | `MOCK_PROPOSALS`, `Proposal`, `ProposalAction` | `GET /api/v1/boards/:id/proposals` |
| `suggestions.ts` | `MOCK_SUGGESTIONS`, `Suggestion` | `GET /api/v1/boards/:id/suggestions` |
| `subtasks.ts` | `MOCK_SUBTASKS`, `Subtask` | `GET /api/v1/cards/:id/subtasks` |

## ID remapping

Several mocks reference cards by placeholder ids (`"mock-card-1"`,
`"mock-card-2"`, …). Consumers (the views, the rail, the card detail panel)
should remap these to the first N real card IDs from `kanbanStore` at render
time. That way the mocks "follow" whatever real data is loaded without ever
referencing an id that doesn't exist.

## Adding new mocks

1. Add a typed `MOCK_*` export + matching interface.
2. Put a top-of-file comment naming the API endpoint that will eventually
   supersede it.
3. Update the table above.
4. **Don't** add mocks for resources the API already supplies (boards,
   columns, epics, cards, comments, auth). Those should always come from the
   real client.
