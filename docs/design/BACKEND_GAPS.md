# Backend Gaps — what the API needs to gain for full parity

The redesign introduces several new domains that the current `frontend/` codebase's API (`src/api/types.ts`, `src/api/client.ts`) doesn't have. This doc lists every missing piece, the data shape needed, and a suggested endpoint contract.

The frontend can be built with mocked data first (see `PARITY_CHECKLIST.md` Phase 8). Each gap below should be tracked as a separate backend ticket.

---

## 1. Agent telemetry (live agent state)

**Why**: The Console rail shows each agent's current step, load %, tokens/min, and a rolling transcript of recent work. The card-level "● live" indicator and the green pulsing dot on agent assignees also depend on knowing if an agent is currently working.

### Data shape

```ts
interface AgentTelemetry {
  name: string;            // matches RegistryAlias.name
  status: "working" | "idle";
  load: number;            // 0..1, current utilisation
  tok: number;             // tokens per minute (current rate)
  step: string | null;     // human-readable current action, e.g. "Reading test fixtures…"
  current_card_id: string | null;  // card the agent is currently working on
  last_act: number;        // timestamp of last action
}

interface AgentTranscriptLine {
  agent: string;
  ts: number;
  text: string;            // e.g. "wrote 142 LOC across 3 files"
}
```

### Endpoints

```
GET  /api/agents/telemetry           → AgentTelemetry[]
GET  /api/agents/:name/transcript?tail=10  → AgentTranscriptLine[]  (most recent first)
```

### Recommended transport

Either short-poll every 3s, or use Server-Sent Events for push:

```
GET /api/agents/stream  (SSE)
event: telemetry        data: { name, status, load, tok, step, current_card_id }
event: transcript       data: { agent, ts, text }
```

### Where the data comes from

Your agent runtime needs to emit these signals as it works. Each agent's main work loop should:

- On task start: emit `telemetry { status: "working", step: "what I'm about to do" }`
- On each significant action (API call, code generation, tool use): append a transcript line
- On task end: emit `telemetry { status: "idle", load: 0 }`

If you're using a job queue or a runtime like LangChain/Claude SDK, hook into its event stream.

---

## 2. Presence (multiplayer cursors on cards)

**Why**: The presence cluster in the top bar shows who's currently active on the board, and small avatars on each card show who's currently looking at/editing that card. This is the "co-presence" feature like in Figma or Notion.

### Data shape

```ts
interface PresenceEntry {
  id: string;              // unique per session
  kind: "user" | "agent";
  user_id?: number;        // for human users
  agent_name?: string;     // for agents
  action: "viewing" | "editing" | "commenting" | "working" | "scanning" | "idle";
  card_id: string | null;  // current card the user is focused on, if any
  at: number;              // timestamp of last update
}
```

### Endpoint (realtime)

A WebSocket channel scoped to a board:

```
WS /api/boards/:id/presence
```

**Client → server messages:**
```json
{ "type": "update", "action": "viewing", "card_id": "abc-123" }
{ "type": "update", "action": "editing", "card_id": "abc-123" }
{ "type": "update", "action": "idle", "card_id": null }
{ "type": "leave" }
```

**Server → client messages:**
```json
{ "type": "snapshot", "presence": [ /* PresenceEntry[] */ ] }
{ "type": "update",   "entry": { /* PresenceEntry */ } }
{ "type": "leave",    "id": "session-id" }
```

### Implementation notes

- Server holds a memory-only map of `{ boardId → Map<sessionId, PresenceEntry> }`
- TTL each entry to 30s; clients send heartbeats every 10s
- On disconnect (websocket close), broadcast `leave` to other clients on the same board
- Agents publish presence the same way humans do, via their runtime (when an agent starts working on a card, it publishes `{ action: "working", card_id }`)

### Fallback (if WebSocket isn't available)

Short-poll: `GET /api/boards/:id/presence` every 3–5s. Client also POSTs its own state to `/api/boards/:id/presence/heartbeat` on the same interval. Worse UX but works.

---

## 3. Activity feed

**Why**: The Activity tab in the right rail shows a chronological feed of every action on the board — card moves, comments, agent actions, assignments, ships, new cards. Also surfaces in the card detail's "Agent activity" section.

### Data shape

```ts
interface ActivityEvent {
  id: string;
  board_id: string;
  kind: "agent" | "comment" | "move" | "assign" | "create" | "ship" | "label" | "priority";
  agent_name?: string;     // when kind === "agent"
  user_id?: number;        // for human actions
  card_id?: string;
  text: string;            // human-readable description
  at: number;
  // optional structured payload for richer rendering
  before?: any;
  after?: any;
}
```

### Endpoint

```
GET /api/boards/:id/activity?since=<ts>&limit=50&kind=agent,comment  → ActivityEvent[]
```

Returns events newest-first. The `since` cursor supports incremental fetching.

### Source

Your backend likely already writes audit entries for card updates. Surface them via this endpoint. New event kinds to add:

- `agent` — emitted whenever an agent logs a significant action
- `ship` — when a card moves to the Done column (compute from move events, or emit explicitly)
- `comment` — when a comment is added
- `move` — when a card's column changes
- `assign` — when assignee changes
- `create` — when a card is created
- `label` — when labels change
- `priority` — when priority changes

### Realtime delivery (optional)

If you want new events to fade in live (vs. on next poll), broadcast over the same presence WebSocket:

```
{ "type": "activity", "event": { /* ActivityEvent */ } }
```

---

## 4. Proposals (multi-step plans for review)

**Why**: This is the key novel concept of the redesign. **Both agents and humans can propose multi-step changes to the board** (split a card, reassign several cards, archive stale work, re-prioritise). The Plans tab shows pending proposals; an authorised user approves/rejects/edits. On approval, the actions execute as an atomic transaction.

### Data shape

```ts
interface Proposal {
  id: string;
  board_id: string;
  proposer_kind: "user" | "agent";
  proposer_user_id?: number;
  proposer_agent_name?: string;
  title: string;
  summary: string;
  actions: ProposalAction[];
  status: "pending" | "approved" | "rejected" | "executing" | "failed";
  confidence?: number;        // 0..1, only from agent proposers
  at: number;                 // when proposed
  approved_by_user_id?: number;
  rejected_by_user_id?: number;
  rejection_reason?: string;
  executed_at?: number;
  execution_error?: string;
}

type ProposalAction =
  | { kind: "priority"; target: string; from: string; to: string }
  | { kind: "move";     target: string; from: string; to: string }   // target=card id, from/to=column id or label
  | { kind: "label";    target: string; add?: string; remove?: string }
  | { kind: "split";    target: string; parts: string[] }            // splits one card into N (description per part)
  | { kind: "ping";     target: string; users: string[] }            // notify users about a card
  | { kind: "archive";  count: number }                              // archive N done cards (could specify ids)
  | { kind: "assign";   target: string; assignee_user_id?: number; assignee_agent?: string }
  | { kind: "due";      target: string; to: number }
  ;
```

### Endpoints

```
POST   /api/boards/:id/proposals          body: { title, summary, actions, confidence? }  → Proposal
GET    /api/boards/:id/proposals?status=pending                                            → Proposal[]
GET    /api/proposals/:id                                                                  → Proposal
POST   /api/proposals/:id/approve         body: {}                                         → Proposal (status=executing→approved)
POST   /api/proposals/:id/reject          body: { reason?: string }                        → Proposal
PATCH  /api/proposals/:id                 body: { actions: ProposalAction[] }              → Proposal (only while pending)
```

### Execution semantics

When `/approve` is called:
1. Mark proposal `status=executing`
2. Within a single DB transaction, apply each action in order
3. If any action fails, **rollback the entire transaction** and set `status=failed` with `execution_error`
4. On success: `status=approved`, emit an `activity` event of kind `agent` (or `user`) describing the bulk change

The atomicity matters — a proposal is a "plan", and a partially-applied plan is worse than an aborted one.

### Permissions

- Anyone on the board can **create** a proposal (humans and agents)
- Only board members with edit rights can **approve** (and maybe only the proposer-or-an-admin can **reject** with reason)
- Agents cannot self-approve their own proposals (humans must approve agent proposals)

---

## 5. AI suggestions (lightweight, in-context)

**Why**: The single-line AI suggestion strip below the filter row shows the highest-value next action ("Promote k7 to In Review — PR merged, tests green"). The card detail panel also surfaces one suggested action per card.

This is **lower stakes than proposals** — it's a single action, not a multi-step plan, and one-click apply rather than approval workflow.

### Data shape

```ts
interface Suggestion {
  id: string;
  kind: "promote" | "split" | "assign" | "escalate" | "archive" | "link";
  text: string;                  // human-readable
  card_id?: string;               // if scoped to one card
  action?: ProposalAction;        // optional pre-computed action to execute on Apply
  reason?: string;
}
```

### Endpoints

```
GET  /api/boards/:id/suggestions                  → Suggestion[]  (top 5 board-wide)
GET  /api/cards/:id/suggestions                   → Suggestion[]  (specific to one card)
POST /api/suggestions/:id/apply                   → { success: true }
POST /api/suggestions/:id/dismiss                 → { success: true }
```

### Generation

An AI agent generates these on a schedule (e.g. every hour) or in response to events (PR merged → suggest promote). Cache server-side; refresh on board mutation.

---

## 6. Card schema additions

The existing `Card` type (in `src/api/types.ts`) is good. Add:

```ts
interface Card {
  // ... existing fields ...
  
  // NEW
  estimate?: number;            // story points (0..N)
  progress?: number;            // 0..1, computed from subtasks or set manually
  blocked_by?: string[];        // card ids that block this one
}
```

### Subtasks (new domain)

The Focus modal shows a subtask checklist. This needs its own table:

```ts
interface Subtask {
  id: string;
  card_id: string;
  text: string;
  done: boolean;
  position: number;
  created_at: number;
  updated_at: number;
}
```

### Endpoints

```
GET    /api/cards/:id/subtasks
POST   /api/cards/:id/subtasks       body: { text, position? }
PATCH  /api/subtasks/:id             body: { text?, done?, position? }
DELETE /api/subtasks/:id
```

### Card `progress` computation

`progress = doneSubtasks / totalSubtasks` (computed on read, or stored as denormalised value updated on subtask change).

---

## 7. User extensions

Users need a stable display color for their `<UserChip>` avatar. Either:

- (a) Add `hue: number` to the `User` type and let users pick / hash from name
- (b) Compute deterministically client-side from `display_name` or `email`

Recommend (b) — no backend change needed. Just hash to 0–360 and use that hue.

---

## 8. Agent extensions

The existing `RegistryAlias` type has `name`, `type`, `plugin`, `model`, `system_prompt`. Add a small description:

```ts
interface RegistryAlias {
  // ... existing ...
  description?: string;       // human-friendly one-liner, e.g. "Triages new bugs from logs"
}
```

This is what the Console rail shows under idle agents. If you don't add this, fall back to the agent type/plugin.

---

## 9. Board / view persistence (optional)

Currently the prototype keeps view + theme + console-open in localStorage (per-device). For team consistency, you could persist these per-user per-board on the backend:

```ts
interface BoardUserPrefs {
  user_id: number;
  board_id: string;
  view: "kanban" | "timeline" | "terminal" | "dispatch";
  theme: "day" | "mono" | "paper";
  console_open: boolean;
  rail_tab: "console" | "activity" | "plans";
  updated_at: number;
}
```

But localStorage is fine for v1.

---

## Recommended ticket breakdown

If you're filing backend tickets, here's a reasonable split:

1. **Agent telemetry endpoint + transcript** — biggest piece, depends on agent runtime
2. **Presence WebSocket** — new infra (depends on whether you have one already)
3. **Activity feed endpoint** — likely reuses existing audit log; just needs an API view
4. **Proposals domain** — new table, new endpoints, transactional execute logic
5. **Subtasks domain** — new table, simple CRUD
6. **Card schema extensions** — `estimate`, `progress`, `blocked_by`
7. **AI suggestions** — depends on an LLM call; could mock for v1
8. **Agent description field** — trivial

Items 1–3 are the biggest UX wins. Item 4 is the most novel feature. Items 5–8 are smaller.

---

## What you can ship without ANY backend changes

If you implement only the frontend + add localStorage persistence, you can ship:

- All 4 views (Kanban / Timeline / Terminal / Dispatch) — they all use existing card data
- All 3 themes
- Card detail panel (using existing API)
- Focus modal (with subtasks stored locally or as markdown in description)
- Drag-drop card reordering/reassignment (uses existing card mutations)

This is a complete UX redesign with no backend dependency — a great first PR.

The "live" features (Console / Activity / Plans tabs, presence avatars, AI suggestions) can come in a second wave once the backend is ready. Stub them with "Coming soon" or mocked data until then.
