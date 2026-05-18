# Frontend v2 — feature status & backend gap tracker

This doc tracks every feature in the [v2 design handoff](../frontend-v2-src/) and how it gets implemented against the current `/api/v1` surface vs. eventually-needed backend additions.

Companion docs (read order):
1. [frontend-v2-src/README.md](../frontend-v2-src/README.md) — full design spec
2. [frontend-v2-src/PARITY_CHECKLIST.md](../frontend-v2-src/PARITY_CHECKLIST.md) — granular feature checklist (8 phases)
3. [frontend-v2-src/BACKEND_GAPS.md](../frontend-v2-src/BACKEND_GAPS.md) — original list of backend additions
4. **This doc** — running status: what's wired to real data vs. backed by mock data

---

## The two goals

> **V1 milestone — what we're building now.** **100% of the prototype's user interface**, rendered with full visual fidelity. Every panel, view, rail, modal, badge, and animation from the prototype must be present.
>
> Where the current `/api/v1` doesn't yet supply the data a panel needs, we **render the panel with realistic hardcoded mock data** — not an empty state, not a "coming soon" message. The page should look indistinguishable from the prototype.

> **V2 final target — eventual.** Convert every mocked data source into a real API call. The UI doesn't change; only the data pipeline behind it changes from `import { MOCK_X } from '@/mock/...'` to `await apiClient.x.list()`.

This is a deliberate separation: **ship the design now, fill in the live data over time.** Users see the full vision from day one; backend additions improve liveness without ever re-doing the UI.

---

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented, wired to real API data |
| 🟡 | Implemented, real API data, just hasn't been built yet (in queue) |
| 🎭 | Implemented with full UI fidelity, **data is mocked client-side**. Will be swapped for a real API call once that endpoint exists. The UI doesn't change. |
| 🔁 | Implemented, hybrid: real API where available + mock where API gaps exist (e.g. cards from API but presence avatars on cards from mocks). |

**Note:** there's no ❌ status. Every UI element gets built. Mocked data is how we ship the design while the backend catches up.

---

## Current `/api/v1` surface (what's real today)

What the backend supplies right now (`backend-v1/openapi.json`):

| Resource | Operations |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout` |
| Boards | full CRUD |
| Columns (nested) | full CRUD |
| Epics (nested) | full CRUD |
| Cards (nested) | full CRUD, search, lookup-by-number |
| Comments (nested) | full CRUD |
| MCP tools | 15 endpoints mirroring REST |
| Service accounts | full CRUD + token issuance/revocation |
| Health & spec | `GET /health`, `GET /openapi.json` |

Anything UI-side that consumes these resources will be ✅. Everything else gets mocked (🎭) until a corresponding endpoint exists.

What's **not** in the API today (so anything depending on these will start out 🎭):
- `GET /users` list
- Any agent registry / agent telemetry / agent transcript
- Activity feed
- Proposals / plans
- Subtasks
- Presence (no realtime infra)
- AI suggestions

---

## Mock-data strategy

All hardcoded mock data lives under `frontend-v2/src/mock/` so it's easy to:
- See at a glance what's mocked
- Swap to real API calls per file as endpoints land
- Vary the fixtures (different agents, different load levels, etc.) for design QA

Suggested file layout:

```
frontend-v2/src/mock/
├── README.md           — why each file exists and what API will replace it
├── users.ts            — 5–8 fake humans with hues, emails, display names
├── agents.ts           — 4–6 fake agents (names, plugins, descriptions)
├── presence.ts         — mock presence entries (who's viewing what)
├── telemetry.ts        — per-agent telemetry (load, tokens/min, current step)
├── transcripts.ts      — rolling transcript lines per agent
├── activity.ts         — ~20 mock activity events spanning the 3 time buckets
├── proposals.ts        — 5–8 mock proposals (mix pending / approved / rejected)
├── suggestions.ts      — 3–5 AI suggestions for the strip and card detail
└── subtasks.ts         — used as the default seed when localStorage is empty
```

Each file exports a typed constant + a comment block pointing at the API endpoint that will replace it. When the endpoint lands, the import site changes from `import { MOCK_AGENTS } from '@/mock/agents'` to `const agents = useAgents()` (a store hook hitting the real API), nothing else.

This is the **only** code that needs to be deleted/swapped during the v1→v2 transition. The UI components stay identical.

---

## Feature matrix — by Phase

Phases mirror [PARITY_CHECKLIST.md](../frontend-v2-src/PARITY_CHECKLIST.md). Items collapsed; check the checklist for full granularity.

### Phase 0 — Foundations

| # | Feature | Status | Data source |
|---|---|---|---|
| 0.1 | Theme system (Day / Mono / Paper) | 🟡 | No data — CSS vars + localStorage |
| 0.2 | Fonts (Inter, JetBrains Mono, Geist Mono) | 🟡 | Static assets |
| 0.3 | Shared helpers (`time.ts`, `positions.ts`, `pack-rows.ts`, `theme.ts`) | 🟡 | Pure logic |
| 0.4 | Primitives (UserChip, AgentChip, AssigneeChip, PresenceDot, PresenceCluster, PriorityIndicator, EpicChip, KeyHint) | 🟡 | Will consume `MOCK_USERS`, `MOCK_AGENTS`, `MOCK_PRESENCE` until real endpoints |

### Phase 1 — Board shell

| # | Feature | Status | Data source |
|---|---|---|---|
| 1.1 | `<Board>` shell + top-level state | 🟡 | No data |
| 1.2 | `<BoardSidebar>` | 🔁 | Boards list ✅ from API. Inbox / My Issues / AI Suggestions counts 🎭 mocked. Saved views 🎭 mocked. Current user ✅ from `GET /auth/me`. |
| 1.3 | `<BoardTopBar>` | 🔁 | Breadcrumb + count ✅. Presence cluster 🎭 (mock self + 4 fake collaborators). Search bar cosmetic (`⌘K` placeholder). New Issue + Console toggle wired. |
| 1.4 | Theme switcher | 🟡 | localStorage |
| 1.5 | `<BoardFilterRow>` | 🟡 | Client-side grouping over existing card fields |
| 1.6 | `<BoardAISuggestionStrip>` | 🎭 | Mock suggestion ("Promote HAUL-138 to In Review — PR merged"). Apply button shows a toast acknowledging it's a stub. |
| 1.7 | `<BoardRightRail>` orchestration | 🟡 | UI plumbing only |

### Phase 2 — Kanban view

| # | Feature | Status | Data source |
|---|---|---|---|
| 2.1 | `<KanbanCard>` (the dense card) | 🔁 | All card fields ✅. Presence avatars on card 🎭 (mock). Agent "● live" indicator 🎭 (cards with `assignee_agent` set have a 50% chance of showing live status from mock telemetry). Comment count 🎭 (random plausible numbers until backend adds `comment_count`). |
| 2.2 | `<KanbanView>` with all 5 grouping modes | 🟡 | Client-side grouping |
| 2.3 | `<CardDetailPanel>` | 🔁 | All API-backed metadata ✅. Agent activity section 🎭 (filter mock activity by card_id). AI suggested section 🎭 (mock suggestion). |

### Phase 3 — Right rail tabs

| # | Feature | Status | Data source |
|---|---|---|---|
| 3.1 | `<RailTabs>` (Console / Activity / Plans tab control) | 🟡 | UI plumbing |
| 3.2 | `<ConsoleRail>` — live presence + agent transcripts | 🎭 | Full panel rendered with `MOCK_PRESENCE` + `MOCK_TELEMETRY` + `MOCK_TRANSCRIPTS`. Transcripts cycle every 3.2s using the mock data — looks "live" without being live. |
| 3.3 | `<ActivityRail>` — chronological feed | 🎭 | Full panel rendered with `MOCK_ACTIVITY` events spanning all 3 time buckets. Filter chips work over the mock dataset. |
| 3.4 | `<PlansRail>` — proposals queue | 🎭 | Full panel rendered with `MOCK_PROPOSALS` (mix of pending / approved / rejected). Approve/Reject buttons mutate the local store only; show a toast that real execution requires backend. |

### Phase 4 — Other views

| # | Feature | Status | Data source |
|---|---|---|---|
| 4.1 | `<TimelineView>` (lanes by hauler) | 🔁 | Lanes derived from card.assignee_id and assignee_agent ✅. Mock agents merged in alongside real users so the lane list looks populated 🎭. Estimate field — see Phase 0 + card gaps below; for v1 we use `MOCK_ESTIMATES` keyed by card_id (deterministic from card.id hash). Drag-to-reschedule writes `due_date` via `PUT /cards/:cid` ✅. |
| 4.2 | `<TerminalView>` (monospace ASCII table) | 🔁 | Card data ✅. "● live" indicator 🎭 from mock telemetry. |
| 4.3 | `<DispatchView>` (fleet bar + 4 prioritised sections) | 🔁 | Sections render from existing cards ✅. **Fleet bar** 🎭 populated with `MOCK_AGENTS` (looks busy — different load levels, different states). Drag-drop reuses Kanban handlers. |

### Phase 5 — Focus modal

| # | Feature | Status | Data source |
|---|---|---|---|
| 5.1 | `<FocusModal>` shell + F/Esc shortcuts | 🟡 | UI only |
| 5.1 | Subtasks list | 🎭 | Per-card localStorage. Seeded with `MOCK_SUBTASKS` for the first card so the design renders well on first load. |
| 5.1 | Progress card (X/N + bar) | 🎭 | Derived from local subtask state. |
| 5.1 | "Mark shipped" button | 🟡 | Maps to `PUT /cards/:cid` with `column_id` = Done column ID. |

### Phase 6 — Multiplayer presence

| # | Feature | Status | Data source |
|---|---|---|---|
| 6.1 | Presence avatars on cards | 🎭 | Mock — fixed mapping of presence to cards from `MOCK_PRESENCE`. |
| 6.2 | Top-bar presence cluster | 🎭 | Self (real, from `GET /auth/me`) + 4 fake collaborators from `MOCK_PRESENCE`. |
| 6.3 | Send local presence | 🎭 | No-op for v1 (no endpoint). Local presence state still ticks (interval that "updates" mock entries' `at` timestamps) so the "X is editing this card" feels alive. |

### Phase 7 — Polish

| # | Feature | Status | Data source |
|---|---|---|---|
| 7.1 | Keyboard shortcuts (F, Esc, C, ⌘K, J/K, ?) | 🟡 | F + Esc wired. Others bind to toast placeholders. |
| 7.2 | URL persistence (view, grouping, filter, selected) | 🟡 | Hash-based |
| 7.3 | localStorage persistence (theme, console-open, rail-tab, subtasks) | 🟡 | localStorage |
| 7.4 | Animations (presence-pulse, fade-in, blink) | 🟡 | CSS |
| 7.5 | Accessibility | 🟡 | Ongoing |
| 7.6 | Empty states | 🟡 | For cases like "no boards yet" — these are different from the rail panels (which never go empty thanks to mocks) |
| 7.7 | Error states | 🟡 | Toast + optimistic-revert pattern works against current API |

### Other (auxiliary)

| Feature | Status | Notes |
|---|---|---|
| Users list (for assignee picker, sidebar user, etc.) | 🎭 | Mock until `GET /users` lands. Real current user ✅ from `GET /auth/me`. |
| Agents list (for assignee picker, Dispatch fleet bar, console rail) | 🎭 | Mock `MOCK_AGENTS` until agent registry endpoint exists. |

---

## Backend gaps catalog (priority order)

Each item below would convert 🎭 entries to ✅. Ordered by **impact per effort**, easiest+biggest-payoff first.

### 1. `GET /api/v1/users` — list users (smallest)

**Converts:** `MOCK_USERS` → real users.

**Shape:**
```
GET /api/v1/users
  → [{ id, email, display_name, is_admin, created_at }]
```

Half an hour. `users` table already exists.

### 2. `comment_count` on card list response

**Converts:** mocked comment counts on `<KanbanCard>` → real.

**Shape:** add `comment_count: number` to the card list response (denormalised on read or via subquery).

Tiny.

### 3. Card schema extensions: `estimate`, `progress`, `blocked_by`

**Converts:** mock estimates / blocked indicators on cards → real. Focus modal progress comes from server.

**Shape:**
```
Card {
  ...,
  estimate?: number,
  progress?: number,        // 0..1, denormalised from subtasks
  blocked_by?: string[],
}
```

Schema migration + handler updates. ~2 hours.

### 4. Subtasks domain

**Converts:** localStorage subtasks → server-synced.

**Shape:**
```
GET    /api/v1/cards/:id/subtasks
POST   /api/v1/cards/:id/subtasks    body: { text, position? }
PATCH  /api/v1/subtasks/:id          body: { text?, done?, position? }
DELETE /api/v1/subtasks/:id

Subtask { id, card_id, text, done, position, created_at, updated_at }
```

New table, simple CRUD, ~half a day.

### 5. Agent registry (`GET /api/v1/agents`)

**Converts:** `MOCK_AGENTS` → real agents. Dispatch fleet bar populates from real data; assignee picker autocompletes against actual registered agents.

**Shape:**
```
GET /api/v1/agents
  → [{ name, type, plugin, model, description }]
```

Open design question: where does the agent registry live?
- (a) Backend-v1 owns it (add an `agents` table + admin CRUD)
- (b) Agent runtime registers itself with backend-v1 via `POST /api/v1/agents`
- (c) Federate from teamagentica's existing agent registry

Decision needed.

### 6. Activity feed (`GET /api/v1/boards/:id/activity`)

**Converts:** `MOCK_ACTIVITY` → real feed. Card detail's "Agent activity" section becomes real.

**Shape:** see [BACKEND_GAPS.md §3](../frontend-v2-src/BACKEND_GAPS.md).

Add an `activity_events` table, emit on mutations, expose read endpoint. ~1 day.

### 7. Agent telemetry (`GET /api/v1/agents/telemetry` + transcript)

**Converts:** Console rail's mock telemetry / transcripts → real live data. "● live" indicators on cards become accurate.

Requires the agent runtime to emit telemetry events. The endpoint is easy; the runtime hook is the hard part. Effort depends on which runtime + whether it has event hooks.

### 8. Proposals domain

**Converts:** `MOCK_PROPOSALS` → real proposals + execute transaction.

Most novel feature of the v2 design. New domain, new endpoints, transactional execution of plans. Multi-day work.

Shape: see [BACKEND_GAPS.md §4](../frontend-v2-src/BACKEND_GAPS.md).

### 9. Presence (WebSocket or SSE)

**Converts:** mock presence cluster + "viewing this card" avatars → live.

Requires new infrastructure (WebSocket server, scope-by-board channel, TTL on entries). Polling fallback possible but worse UX. Multi-day.

### 10. AI suggestions

**Converts:** mock suggestion in strip / card detail → real.

Depends on an LLM call. Lowest priority because the strip can be hidden if no entries; but with mocks shown, the user sees the design even before this is wired.

---

## "V1 frontend complete" — definition of done

The v1 milestone is complete when:

- [ ] All 4 views (Kanban / Timeline / Terminal / Dispatch) render real backend data with full prototype visual fidelity
- [ ] All 3 themes switch live and persist
- [ ] Card detail panel shows all fields the current API supplies plus the mocked extras (activity, suggestions)
- [ ] Focus modal opens with F, closes with Esc; subtasks work via localStorage
- [ ] Drag-drop on Kanban (all grouping modes) + Timeline (lane + day reschedule) writes back to `PUT /cards/:cid`
- [ ] Sidebar / top bar / filter row chrome matches the prototype visually
- [ ] **Console / Activity / Plans rail tabs all render full panels populated with realistic mock data** — never empty placeholders
- [ ] **Top-bar presence cluster shows self + mock collaborators with pulsing dots**
- [ ] **Dispatch view fleet bar shows mock agents with mock telemetry, load bars, working states**
- [ ] **AI suggestion strip shows a mock suggestion at the top of the board**
- [ ] All `src/mock/` files have a comment pointing at the API endpoint that will replace them
- [ ] Login, board switching, board CRUD, card CRUD, comment CRUD all work as in v1 frontend

At that point, a user comparing v2 against the prototype `index.html` should see **no missing UI**. The only thing the user can't yet do is have agent telemetry / presence / activity be live.

Every backend addition above converts a 🎭 to ✅ in this doc and replaces an `import` from `src/mock/` with a real API call. The UI doesn't change.

---

## How to update this doc

When you implement a feature, update its row's status symbol (and add a brief note if useful). When you add a backend endpoint, move the affected mock files out of `src/mock/`, swap their imports to real API calls, and update the rows here from 🎭 → ✅.

Keep the **goals** at the top stable — they're the contract.
