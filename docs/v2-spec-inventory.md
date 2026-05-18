# Taskhauler v2 — Canonical Spec Inventory

Flat, granular checklist of every distinct feature, component, behaviour, interaction, animation, data shape, design token, and edge case the spec mentions. Format: one entry per item, suitable for diffing against the implementation later.

---

## SPEC-001: Day theme CSS tokens

**Where in spec:** README.md L103–125; index.css block L719–737; prototype/concept-haul.jsx L4–25
**Category:** theme
**Description:** Default "Day" theme — cool neutral with indigo accent (Linear-ish baseline). 17 CSS custom properties on `:root[data-theme="day"]`.
**Acceptance criteria:** All of: `--bg #fafaf9`, `--surface #ffffff`, `--hover #f4f4f3`, `--border #e7e5e0`, `--border-hi #d6d3cd`, `--text #18181b`, `--text-2 #52525b`, `--text-3 #a1a1aa`, `--accent #5b5bd6`, `--accent-bg #eef0ff`, `--accent-fg #ffffff`, `--red #dc2626`, `--amber #f59e0b`, `--green #16a34a`, `--font Inter, sans-serif`, `--mono 'Geist Mono', monospace`, `--radius 6px`. README also lists equivalent HSL values for these.
**Dependencies:** none

## SPEC-002: Mono theme CSS tokens

**Where in spec:** README.md L127–149; index.css block L739–757; prototype/concept-haul.jsx L26–46
**Category:** theme
**Description:** Mono theme — black + amber, JetBrains Mono throughout, echoes terminal aesthetic across all views.
**Acceptance criteria:** All of: `--bg #0c0c0a`, `--surface #15140f`, `--hover #1e1c14`, `--border #2a2820`, `--border-hi #3b3826`, `--text #e8d9b0`, `--text-2 #a89770`, `--text-3 #6b6044`, `--accent #facc15`, `--accent-bg rgba(250,204,21,0.10)`, `--accent-fg #1c1917`, `--red #f87171`, `--amber #fbbf24`, `--green #84cc16`, `--font 'JetBrains Mono', 'Geist Mono', monospace`, `--mono same`, `--radius 2px`. Mono theme drops shadows entirely or uses 1px solid border-hi as elevation cue.
**Dependencies:** none

## SPEC-003: Paper theme CSS tokens

**Where in spec:** README.md L151–173; index.css block L759–777; prototype/concept-haul.jsx L47–67
**Category:** theme
**Description:** Paper theme — warm cream with burnt orange accent, tactile/print feel.
**Acceptance criteria:** All of: `--bg #f5f0e2`, `--surface #fbf7e9`, `--hover #ede6cf`, `--border #d4cab2`, `--border-hi #b8ad8f`, `--text #2a251c`, `--text-2 #5e574a`, `--text-3 #9a8f78`, `--accent #9a3412`, `--accent-bg #fef0e2`, `--accent-fg #ffffff`, `--red #b91c1c`, `--amber #a16207`, `--green #65a30d`, `--font Inter, sans-serif`, `--mono 'Geist Mono', monospace`, `--radius 4px`.
**Dependencies:** none

## SPEC-004: Theme application + persistence

**Where in spec:** README.md L98–102, L639; PARITY_CHECKLIST.md L13–20, L502
**Category:** theme | localStorage
**Description:** Themes implemented as CSS custom properties on `:root[data-theme="..."]`. Default `data-theme="day"` at boot. Persist to `localStorage` key `taskhauler.theme`. Restore from localStorage before first render to avoid flash. Applied via `document.documentElement.setAttribute('data-theme', name)`.
**Acceptance criteria:** localStorage key exactly `taskhauler.theme`; restore-before-render to avoid FOUC; toggle re-skins chrome live (theme swap is instant, no animation per README L617).
**Dependencies:** SPEC-001, SPEC-002, SPEC-003

## SPEC-005: Theme switcher swatches

**Where in spec:** README.md L175–177; PARITY_CHECKLIST.md L98–104; prototype/concept-haul.jsx L478–503
**Category:** shell | theme
**Description:** Three small swatches in the top bar between New Issue and Search. Each swatch is a 22×22 button with a 14×14 inner mini-square rendered in that theme's `--bg`, bordered by swatch color, with a 6px center dot in the accent color.
**Acceptance criteria:** Container has 2px padding, 1px border, `--radius` rounded, `--bg` bg; 3 buttons (Day/Mono/Paper) 22×22 each; active swatch has filled outer ring in swatch's accent color (prototype: active sets outer bg to T.swatch, mini-square border becomes T.surface); click switches theme.
**Dependencies:** SPEC-004

## SPEC-006: Spacing scale

**Where in spec:** README.md L179–183
**Category:** primitives
**Description:** "4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 24 · 32 · 44 · 56 · 80" px scale. Most card-internal gaps 4–6px, cross-component gaps 8–14px. Avoid spacing > 14px between sibling components except in modal layouts.
**Acceptance criteria:** No arbitrary spacings outside this scale appear in chrome. Modal layouts may use larger.
**Dependencies:** none

## SPEC-007: Typography scale

**Where in spec:** README.md L185–199
**Category:** primitives
**Description:** Typography table covering body (13px/400), top-bar brand (13px/700, -0.2 ls), sidebar header (10.5px/600 UPPER +0.5 ls), section header rail (10px/700 UPPER +1.5 ls mono), card title (12px/500), card meta (10–11px/500 mono), filter chip (11.5px/500–600), detail panel title (16px/600 -0.2 ls), modal h1 Focus (32px/600 -0.5 ls), activity text (12px/400), status bar/kbd (10–10.5px/600–700 mono +0.5 ls).
**Acceptance criteria:** Every text usage matches the row in the typography table (size, weight, line-height, letter-spacing, family).
**Dependencies:** SPEC-001/002/003

## SPEC-008: Border radii per theme

**Where in spec:** README.md L201–208
**Category:** theme
**Description:** Defined per-theme via `--radius`: Day 6px, Mono 2px, Paper 4px. Pill/chip radius always 99px. Avatar radii: users circular (50%), agents hex-clipped via `clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)`.
**Acceptance criteria:** Card/button radii read `var(--radius)`; pills use 99px; avatar shapes match exactly.
**Dependencies:** SPEC-001/002/003

## SPEC-009: Shadow tiers

**Where in spec:** README.md L210–222
**Category:** primitives
**Description:** Three shadow tiers: Resting card `0 1px 0 rgba(0,0,0,0.02)`; Hover/focus `0 1px 2px rgba(0,0,0,0.08)`; Selected (focus ring) `0 0 0 3px var(--accent)33`; Modal `0 30px 80px rgba(0,0,0,0.25)`. Mono theme drops shadows entirely or uses 1px solid `--border-hi` as elevation cue.
**Acceptance criteria:** All shadow usages match these tiers exactly; Mono theme suppresses them.
**Dependencies:** SPEC-002

## SPEC-010: Font loading (Inter, JetBrains Mono, Geist Mono)

**Where in spec:** PARITY_CHECKLIST.md L23–27
**Category:** theme
**Description:** Load Inter (400/500/600/700), JetBrains Mono (400/500/700), Geist Mono (400/500/600) via Google Fonts or self-host. Verify font swap works when theme changes (Mono uses JetBrains Mono everywhere).
**Acceptance criteria:** All weights present, no font flash on theme swap.
**Dependencies:** SPEC-001/002/003

## SPEC-011: `UserChip` primitive

**Where in spec:** README.md L227–248; PARITY_CHECKLIST.md L39; prototype/shared.jsx L259–277
**Category:** primitives
**Description:** Circular initial-based avatar. Per-user hue stored on user record drives both bg and fg via oklch. `bg = oklch(0.7 0.13 hue)`, `fg = oklch(0.25 0.05 hue)`.
**Acceptance criteria:** Props `{id, size=22}`; inline-flex centered; fontSize `size * 0.42`; fontWeight 700; borderRadius 50% (style="circle"); letter-spacing -0.02em; flex 0 0 auto; title attr = user.name; renders 2-letter initials from user.avatar (e.g. "MC"). Hue 0–360 driven by hash of display name in production. Mock hues: Mira=12, Theo=200, Sana=290, Jules=140, Wren=40.
**Dependencies:** SPEC-026 (User data + hue)

## SPEC-012: `AgentChip` primitive

**Where in spec:** README.md L250–272; PARITY_CHECKLIST.md L40; prototype/shared.jsx L279–303
**Category:** primitives
**Description:** Hexagonal monospace tile — agent identity is visually distinct from human circles. clip-path polygon = `polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)`. Single uppercase letter.
**Acceptance criteria:** Props `{name, size=22, variant="default"}`. Variants:
- default: bg #0f172a, fg #67e8f9, glow #22d3ee
- terminal: bg #facc15, fg #1c1917, glow #fde047
- glass: bg rgba(34,211,238,0.15), fg #67e8f9, glow #22d3ee (prototype-only)
- light: bg #ecfeff, fg #0e7490, glow #22d3ee (prototype-only)

When `agent.status === "working"`, the chip gets a faint cyan ring glow (`boxShadow: 0 0 0 1px ${palette.glow}`). fontFamily = `var(--mono)` (prototype uses Geist Mono explicitly). title = `@{name} · {plugin}`.
**Dependencies:** SPEC-027 (Agent data)

## SPEC-013: `AssigneeChip` primitive

**Where in spec:** PARITY_CHECKLIST.md L41; prototype/shared.jsx L306–311
**Category:** primitives
**Description:** Dispatches to UserChip or AgentChip based on `assignee` shape. Passes through size + variant.
**Acceptance criteria:** Returns AgentChip when `assignee.agent` truthy; UserChip when `assignee.user` truthy; null otherwise.
**Dependencies:** SPEC-011, SPEC-012

## SPEC-014: `PresenceDot` primitive

**Where in spec:** README.md L274–284; PARITY_CHECKLIST.md L42
**Category:** primitives | animation
**Description:** 7×8px circle in action color, pinned to bottom-right of avatar via absolute positioning, with 1.5px box-shadow ring in `--surface` color. Pulsing animation 1.6s ease-in-out infinite.
**Acceptance criteria:** Props `{color, active}`. Sizes vary by context: 4px on small cluster avatars; 6px on top-bar cluster (24px avatars); 7px on agent assignee chip; 8px on PresenceRow avatars. Animation `@keyframes presence-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.4); } }`. Box-shadow ring scales: 1px / 1.5px / 2px depending on context.
**Dependencies:** SPEC-066 (presence-pulse keyframe)

## SPEC-015: Presence dot action color map

**Where in spec:** README.md L284, L294, L466–468; prototype/concept-haul.jsx L188–193, L463–470
**Category:** presence
**Description:** Dot color by action: viewing = indigo (`--accent`); editing/commenting = amber (`--amber`); working (agent) = green (`--green`); scanning = green; idle = `--text-3`.
**Acceptance criteria:** PresenceCluster, PresenceRow, KanbanCard presence overlay all use the same mapping (prototype literal: `p.color === "editing" ? amber : p.color === "agent" ? green : accent` — the `color` field on presence entries drives this).
**Dependencies:** SPEC-031 (Presence data shape)

## SPEC-016: `PresenceCluster` primitive

**Where in spec:** README.md L292–294, L457–476; PARITY_CHECKLIST.md L43, L466–471
**Category:** primitives | presence
**Description:** Overlapping avatars (humans + agents) with "+N" overflow + "X active" label. Used in top bar (24px avatars, overlapped by 7px) and on cards (max 3 small 14px avatars).
**Acceptance criteria:** Props `{maxShown=5}`. Top-bar variant: 24px avatars, marginLeft -7px each (except first), 2px surface boxShadow ring; 6px pulsing dot bottom-right; "+N" only when over max; "{N} active" text in mono after cluster. Card variant: 14px avatars, marginLeft -5px, 1.5px ring; 4px dot. Tooltip on hover with full names + actions. Excludes assignee if already shown elsewhere on the card.
**Dependencies:** SPEC-011, SPEC-012, SPEC-014, SPEC-015

## SPEC-017: `PriorityIndicator` primitive

**Where in spec:** PARITY_CHECKLIST.md L44; prototype/concept-haul.jsx L113–135
**Category:** primitives
**Description:** 3-bar indicator for low/med/high; solid red square for urgent. Urgent renders an 8×8 red square with `0 0 0 2px {color}22` ring. Bars: heights `[4,7,10]` for high, `[4,7,4]` for medium, `[4,4,4]` for low. Fills (filled vs outlined): high `[1,1,1]`, medium `[1,1,0]`, low `[1,0,0]`. Bar width 2.5px, gap 1.5px, radius 0.5px, container height 12.
**Acceptance criteria:** Filled bars use `text-2`, unfilled use `border-hi`. Renders empty 12×12 span when no priority.
**Dependencies:** SPEC-029 (Priority data)

## SPEC-018: `EpicChip` primitive

**Where in spec:** PARITY_CHECKLIST.md L45; prototype/concept-haul.jsx L227–237
**Category:** primitives
**Description:** Color dot + short epic name in pill (Day) / colored border (Mono).
**Acceptance criteria:** Pill: 1px border, `--bg` background, `--text-2` text, 10.5px, 6×6 round color dot, 1px/5px padding, 3px radius.
**Dependencies:** SPEC-028 (Epic data)

## SPEC-019: `KeyHint` (kbd) primitive

**Where in spec:** PARITY_CHECKLIST.md L46; prototype/concept-haul.jsx L377
**Category:** primitives
**Description:** Small kbd-style label with mono font. `.haul-kbd { font-family: Geist Mono; font-size: 10px; background: surface; border: 1px solid border; border-bottom-width: 2px; border-radius: 3px; padding: 0 4px; color: text-2; }`.
**Acceptance criteria:** Used for `⌘K`, `C`, `F` hints.
**Dependencies:** SPEC-007

## SPEC-020: Top bar — height + layout

**Where in spec:** README.md L288–300; PARITY_CHECKLIST.md L80–96
**Category:** shell
**Description:** Fixed 44px height, full width below sidebar. `--surface` background, 1px bottom border `--border`. Flex row, padding 0 14px, gap 8px. Constant across all themes.
**Acceptance criteria:** Exactly 44px tall; padding and gap match.
**Dependencies:** SPEC-001/002/003

## SPEC-021: Top bar — breadcrumb

**Where in spec:** README.md L292; PARITY_CHECKLIST.md L84–88
**Category:** shell
**Description:** Left side: `Hauler core / All issues · 15 of 15` — board name (semibold 13px, clickable), `/` separator (text-3), filter scope label "All issues" (12px text-2), count `· {filteredN} of {totalN}` (11px text-3).
**Acceptance criteria:** All four parts present with the right typography; counts reactive to filter state.
**Dependencies:** SPEC-020

## SPEC-022: Top bar — presence cluster

**Where in spec:** README.md L294; PARITY_CHECKLIST.md L91
**Category:** shell | presence
**Description:** Overlapping avatars of active collaborators (humans + agents). Show first 5, then "X active" label. Each has pulsing presence dot in action color. Hover tooltip with full names + actions.
**Acceptance criteria:** First 5 active, 24px each, -7px overlap, 2px surface ring, 6px pulsing action-color dot bottom-right; "{N} active" mono text after cluster.
**Dependencies:** SPEC-016

## SPEC-023: Top bar — search input

**Where in spec:** README.md L296; PARITY_CHECKLIST.md L93
**Category:** shell | keyboard
**Description:** 220px-wide pill input, 28px tall, magnifier icon + "Search or jump to…" placeholder, `⌘K` kbd hint right-aligned. Functionality is placeholder — not required first pass.
**Acceptance criteria:** Min-width 220, height 28; placeholder text exact; kbd hint shows `⌘K`.
**Dependencies:** SPEC-019

## SPEC-024: Top bar — New Issue button

**Where in spec:** README.md L297; PARITY_CHECKLIST.md L94
**Category:** shell | keyboard
**Description:** Outline button with plus icon + "New issue" label + `C` kbd hint. 28px tall, padding 0 10px, 1px border, `--surface` bg, `--text` color, 12px 500.
**Acceptance criteria:** Plus icon, label, `C` kbd-style hint. `C` shortcut triggers same action.
**Dependencies:** SPEC-019, SPEC-061

## SPEC-025: Top bar — Console toggle

**Where in spec:** README.md L298; PARITY_CHECKLIST.md L95; prototype/concept-haul.jsx L519–539
**Category:** shell | rail-console
**Description:** Pill button: solid accent-color pill when on, outlined when off. Shows green pulsing dot + "Console" + monospace `{working}/{total}` agent count (e.g. `3/5`).
**Acceptance criteria:** Active state: 1px `--accent` border + `--accent-bg` background + `--accent` color. Inactive: `--border` + `--surface` + `--text-2`. Green 8×8 dot with `0 0 0 2px green/33` ring, pulsing animation. Working/total fraction in `--mono` 10px.
**Dependencies:** SPEC-014, SPEC-052

## SPEC-026: User data shape

**Where in spec:** README.md L246–247, BACKEND_GAPS.md L316–324; prototype/shared.jsx L7–13
**Category:** data-model
**Description:** USERS = `{ id, name, handle, hue, avatar }[]`. `hue` is 0–360 for UserChip background calculation. In production, hash display_name (option b — no backend change).
**Acceptance criteria:** Mock data has Mira=12 / Theo=200 / Sana=290 / Jules=140 / Wren=40. Implementation must derive hue per user.
**Dependencies:** none

## SPEC-027: Agent data shape

**Where in spec:** BACKEND_GAPS.md L328–339; prototype/shared.jsx L15–21
**Category:** data-model
**Description:** AGENTS = `{ name, type, plugin, desc, status, load, tok, step, lastAct }[]`. `type` ∈ `agent | tool_agent | tool`. `status` ∈ `working | idle`. RegistryAlias should gain optional `description?: string` for the Console rail's idle-agent line.
**Acceptance criteria:** All five mock agents present (scout, builder, triage, release, watchdog). When `description` absent, fall back to plugin/type.
**Dependencies:** none

## SPEC-028: Epic data shape

**Where in spec:** prototype/shared.jsx L43–48
**Category:** data-model
**Description:** EPICS = `{ id, name, color, short }[]`. Mock: Auth & Identity (#6366f1, AUTH), Hauler v2 (#f97316, V2), Observability (#10b981, OBS), Billing (#ec4899, BILL).
**Acceptance criteria:** `short` ≤ 4 chars for chip; `color` is hex.
**Dependencies:** none

## SPEC-029: Priority data shape

**Where in spec:** prototype/shared.jsx L57–62
**Category:** data-model
**Description:** PRIORITIES = map of `{label, color, short}` keyed by `urgent|high|medium|low`. urgent #dc2626 P0, high #f97316 P1, medium #3b82f6 P2, low #71717a P3.
**Acceptance criteria:** Keys, labels, colors, short codes exact.
**Dependencies:** none

## SPEC-030: Card data shape

**Where in spec:** BACKEND_GAPS.md L270–283; prototype/shared.jsx L66–89
**Category:** data-model | backend-api
**Description:** Card = existing fields + new: `estimate?: number` (story points), `progress?: number` (0..1 computed from subtasks or set manually), `blocked_by?: string[]` (card ids that block this). Mock fields used: `id, number, col, epic, title, type, priority, assignee, labels, due, estimate, updated, commentsN, blockedBy, progress`.
**Acceptance criteria:** Three new fields added to Card type; serializer surfaces them.
**Dependencies:** none

## SPEC-031: Presence data shape (PresenceEntry)

**Where in spec:** BACKEND_GAPS.md L67–78; prototype/shared.jsx L198–209
**Category:** data-model | backend-api
**Description:** `PresenceEntry = { id, kind: "user"|"agent", user_id?, agent_name?, action: "viewing"|"editing"|"commenting"|"working"|"scanning"|"idle", card_id, at }`. Plus presence field `color` in prototype: `viewing|editing|agent|idle` (drives dot color via SPEC-015).
**Acceptance criteria:** All six action verbs supported. card_id nullable.
**Dependencies:** none

## SPEC-032: ActivityEvent data shape

**Where in spec:** BACKEND_GAPS.md L122–136; prototype/shared.jsx L92–107
**Category:** data-model | backend-api
**Description:** `ActivityEvent = { id, board_id, kind, agent_name?, user_id?, card_id?, text, at, before?, after? }`. Kinds: agent, comment, move, assign, create, ship, label, priority.
**Acceptance criteria:** All 8 kinds emittable; `before/after` used for richer rendering.
**Dependencies:** none

## SPEC-033: Proposal data shape

**Where in spec:** BACKEND_GAPS.md L175–193; prototype/shared.jsx L111–183
**Category:** data-model | backend-api
**Description:** `Proposal = { id, board_id, proposer_kind, proposer_user_id?, proposer_agent_name?, title, summary, actions, status: "pending"|"approved"|"rejected"|"executing"|"failed", confidence?, at, approved_by_user_id?, rejected_by_user_id?, rejection_reason?, executed_at?, execution_error? }`.
**Acceptance criteria:** All 5 statuses; `confidence` only present on agent proposals; failure path retains `execution_error`.
**Dependencies:** none

## SPEC-034: ProposalAction 8 kinds

**Where in spec:** BACKEND_GAPS.md L195–204; README.md L552–558
**Category:** data-model | backend-api
**Description:** 8 action kinds:
- `priority`: `{ target, from, to }`
- `move`: `{ target, from, to }` (column id or label)
- `label`: `{ target, add?, remove? }`
- `split`: `{ target, parts: string[] }`
- `ping`: `{ target, users: string[] }`
- `archive`: `{ count }`
- `assign`: `{ target, assignee_user_id?, assignee_agent? }`
- `due`: `{ target, to: number }`

**Acceptance criteria:** All 8 kinds parseable; renderer (`PlanAction`) handles each. Note: prototype only renders 6 (priority, move, label, split, ping, archive).
**Dependencies:** SPEC-033

## SPEC-035: Suggestion data shape

**Where in spec:** BACKEND_GAPS.md L245–253; prototype/shared.jsx L186–192
**Category:** data-model | backend-api
**Description:** `Suggestion = { id, kind, text, card_id?, action?, reason? }`. Kinds: promote, split, assign, escalate, archive, link.
**Acceptance criteria:** All 6 kinds supported; `action` is a pre-computed ProposalAction for one-click apply.
**Dependencies:** SPEC-034

## SPEC-036: Subtask data shape

**Where in spec:** BACKEND_GAPS.md L290–298
**Category:** data-model | backend-api
**Description:** `Subtask = { id, card_id, text, done, position, created_at, updated_at }`. Separate table (preferred over markdown in description).
**Acceptance criteria:** Schema present; position supports reordering.
**Dependencies:** none

## SPEC-037: AgentTelemetry data shape

**Where in spec:** BACKEND_GAPS.md L16–31
**Category:** data-model | backend-api
**Description:** `AgentTelemetry = { name, status: "working"|"idle", load: 0..1, tok: number, step: string|null, current_card_id: string|null, last_act: number }`. `AgentTranscriptLine = { agent, ts, text }`.
**Acceptance criteria:** All 7 fields populated for agents; tokens-per-minute is current rate.
**Dependencies:** none

## SPEC-038: BoardUserPrefs data shape (optional)

**Where in spec:** BACKEND_GAPS.md L345–356
**Category:** data-model | backend-api
**Description:** Optional server-side persistence of view + theme + console-open + rail-tab per user per board: `BoardUserPrefs = { user_id, board_id, view, theme, console_open, rail_tab, updated_at }`. localStorage fine for v1.
**Acceptance criteria:** If implemented, syncs across devices; otherwise local only.
**Dependencies:** none

## SPEC-039: Endpoint — Agent telemetry GET

**Where in spec:** BACKEND_GAPS.md L36–37
**Category:** backend-api
**Description:** `GET /api/agents/telemetry` → `AgentTelemetry[]`.
**Acceptance criteria:** Returns array of telemetry for all agents; short-poll friendly.
**Dependencies:** SPEC-037

## SPEC-040: Endpoint — Agent transcript GET

**Where in spec:** BACKEND_GAPS.md L37
**Category:** backend-api
**Description:** `GET /api/agents/:name/transcript?tail=10` → `AgentTranscriptLine[]` (most recent first).
**Acceptance criteria:** Default tail size; sorted newest first.
**Dependencies:** SPEC-037

## SPEC-041: Endpoint — Agent SSE stream

**Where in spec:** BACKEND_GAPS.md L44–48
**Category:** backend-api
**Description:** `GET /api/agents/stream` (SSE). Event types: `telemetry` (data: `{name, status, load, tok, step, current_card_id}`); `transcript` (data: `{agent, ts, text}`).
**Acceptance criteria:** Push-based alternative to polling.
**Dependencies:** SPEC-037

## SPEC-042: Endpoint — Presence WebSocket

**Where in spec:** BACKEND_GAPS.md L84–101
**Category:** backend-api
**Description:** `WS /api/boards/:id/presence`. Client→server messages: `{type:"update", action, card_id}`, `{type:"leave"}`. Server→client: `{type:"snapshot", presence}`, `{type:"update", entry}`, `{type:"leave", id}`. Memory map `{boardId → Map<sessionId, PresenceEntry>}`, 30s TTL per entry, 10s heartbeats, broadcast `leave` on disconnect.
**Acceptance criteria:** All message types supported; clean disconnect; agents publish via runtime same way.
**Dependencies:** SPEC-031

## SPEC-043: Endpoint — Presence polling fallback

**Where in spec:** BACKEND_GAPS.md L110–112
**Category:** backend-api
**Description:** `GET /api/boards/:id/presence` (3–5s poll). Client POSTs heartbeat: `POST /api/boards/:id/presence/heartbeat`.
**Acceptance criteria:** Fallback when WS unavailable.
**Dependencies:** SPEC-031

## SPEC-044: Endpoint — Activity feed GET

**Where in spec:** BACKEND_GAPS.md L141–143
**Category:** backend-api
**Description:** `GET /api/boards/:id/activity?since=<ts>&limit=50&kind=agent,comment` → `ActivityEvent[]` newest-first.
**Acceptance criteria:** `since` cursor supports incremental fetch; multiple kinds comma-separated.
**Dependencies:** SPEC-032

## SPEC-045: Endpoint — Activity realtime broadcast

**Where in spec:** BACKEND_GAPS.md L160–166
**Category:** backend-api
**Description:** Optional: broadcast new activity events over presence WS as `{type:"activity", event}`.
**Acceptance criteria:** New events fade-in on receipt rather than polling.
**Dependencies:** SPEC-042, SPEC-032

## SPEC-046: Endpoint — Proposals CRUD

**Where in spec:** BACKEND_GAPS.md L209–215
**Category:** backend-api
**Description:** Full set:
- `POST /api/boards/:id/proposals` body `{title, summary, actions, confidence?}` → Proposal
- `GET /api/boards/:id/proposals?status=pending` → Proposal[]
- `GET /api/proposals/:id` → Proposal
- `POST /api/proposals/:id/approve` body `{}` → Proposal (status: executing→approved)
- `POST /api/proposals/:id/reject` body `{reason?}` → Proposal
- `PATCH /api/proposals/:id` body `{actions}` → Proposal (only while pending)

**Acceptance criteria:** All 6 endpoints; edit only allowed in pending status.
**Dependencies:** SPEC-033

## SPEC-047: Proposal atomic execution

**Where in spec:** BACKEND_GAPS.md L219–227
**Category:** backend-api
**Description:** Approval flow: mark `status=executing`; apply each action in a single DB transaction; rollback whole transaction on any failure → `status=failed` + `execution_error`; on success → `status=approved` + emit activity event of kind `agent` or `user`.
**Acceptance criteria:** Partial application impossible; failures recorded with detail.
**Dependencies:** SPEC-046, SPEC-032

## SPEC-048: Proposal permissions

**Where in spec:** BACKEND_GAPS.md L229–233
**Category:** backend-api
**Description:** Permission rules: anyone on the board (humans + agents) can create. Only board members with edit rights can approve. Reject permitted by proposer-or-admin with reason. Agents cannot self-approve their own proposals (humans must approve agent proposals).
**Acceptance criteria:** Server enforces each rule; agent self-approval returns 403.
**Dependencies:** SPEC-046

## SPEC-049: Endpoint — AI suggestions

**Where in spec:** BACKEND_GAPS.md L257–262
**Category:** backend-api
**Description:** `GET /api/boards/:id/suggestions` (top 5 board-wide); `GET /api/cards/:id/suggestions` (card-specific); `POST /api/suggestions/:id/apply` → `{success: true}`; `POST /api/suggestions/:id/dismiss` → `{success: true}`.
**Acceptance criteria:** Generated by AI agent on schedule (e.g. hourly) or events; server-cached.
**Dependencies:** SPEC-035

## SPEC-050: Endpoint — Subtasks CRUD

**Where in spec:** BACKEND_GAPS.md L303–308
**Category:** backend-api
**Description:** `GET /api/cards/:id/subtasks`; `POST /api/cards/:id/subtasks` body `{text, position?}`; `PATCH /api/subtasks/:id` body `{text?, done?, position?}`; `DELETE /api/subtasks/:id`.
**Acceptance criteria:** All 4 endpoints functional; reordering via position.
**Dependencies:** SPEC-036

## SPEC-051: Sidebar — workspace switcher

**Where in spec:** README.md L306; PARITY_CHECKLIST.md L64–67; prototype/concept-haul.jsx L383–393
**Category:** shell
**Description:** Top of sidebar: 22×22 gradient brand glyph (T monogram, `linear-gradient(135deg, accent, #7c3aed)` in Day; accent solid in Mono/Paper), "Taskhauler" wordmark (700, 13px), chevron-down icon (placeholder workspace menu).
**Acceptance criteria:** 5px radius on glyph; gradient end exactly #7c3aed; wordmark letter-spacing -0.2.
**Dependencies:** SPEC-052

## SPEC-052: Sidebar — overall layout

**Where in spec:** README.md L304, L318; PARITY_CHECKLIST.md L62–63
**Category:** shell
**Description:** Fixed 200px wide, full height, `--bg` background, `--border` right edge. Padding 12, flex column, gap 16. Section headers 10.5px UPPER 600 `--text-3` letter-spacing +0.5px, padding 4px 8px. Rows 26px tall (5px vertical padding).
**Acceptance criteria:** Width exactly 200px; sections gap 16; rows match header typography spec.
**Dependencies:** SPEC-007

## SPEC-053: Sidebar — top-level nav (Inbox / My issues / AI suggestions)

**Where in spec:** README.md L307–310; PARITY_CHECKLIST.md L68–71
**Category:** shell
**Description:** 3 rows: Inbox (inbox icon + label + count badge), My issues (kanban icon), AI suggestions (sparkles icon). Counts right-aligned in `--text-3`, 10.5px.
**Acceptance criteria:** Three rows with their icons; counts on right.
**Dependencies:** SPEC-052

## SPEC-054: Sidebar — Boards section

**Where in spec:** README.md L311–313; PARITY_CHECKLIST.md L72–75
**Category:** shell
**Description:** Section header "Boards" then list. Each board row: 8×8 color dot (`--accent` for active, `--border-hi` for inactive) + board name + monospace prefix label right-aligned (HAUL / MKT / MOB). Active board: `--surface` bg + 1px border + 600 weight on name.
**Acceptance criteria:** Three mock boards; active row visually distinct as specified.
**Dependencies:** SPEC-052

## SPEC-055: Sidebar — Saved views section

**Where in spec:** README.md L314–315; PARITY_CHECKLIST.md L76–77
**Category:** shell
**Description:** Section header "Saved views" then list of view rows: filter icon + name in `--text-2`. Mock examples: "Urgent + overdue", "Agent work in flight", "This week".
**Acceptance criteria:** Filter icon + label; not required functional first pass.
**Dependencies:** SPEC-052

## SPEC-056: Sidebar — Current user chip

**Where in spec:** README.md L316; PARITY_CHECKLIST.md L78
**Category:** shell
**Description:** Pinned to bottom. User avatar (20px) + name (small, `--text-3`, 11px). `margin-top: auto`.
**Acceptance criteria:** Always at bottom regardless of section count.
**Dependencies:** SPEC-011, SPEC-052

## SPEC-057: Filter row — overall layout

**Where in spec:** README.md L321–334; PARITY_CHECKLIST.md L107–108
**Category:** shell
**Description:** 40px tall, `--surface` bg, 1px bottom border `--border`, padding 0 14px, flex row, gap 6.
**Acceptance criteria:** Exactly 40px tall.
**Dependencies:** none

## SPEC-058: Filter row — Group segmented control

**Where in spec:** README.md L324; PARITY_CHECKLIST.md L109–114
**Category:** shell
**Description:** "Group" 11px label `--text-3` + 5-segment control with options Status / Priority / Epic / Assignee / Due. Container has 1px border, 2px padding, `--bg` background, 6px radius. Each segment height 22, padding 0 9, 11.5px. Active segment: `--surface` background + subtle 0 1px 2px rgba(0,0,0,0.08) shadow + 600 weight. Inactive: transparent + `--text-2` + 500.
**Acceptance criteria:** Exactly 5 options in this order; click updates `grouping` state.
**Dependencies:** SPEC-057

## SPEC-059: Filter row — Filter chips (All/Mine/Agents)

**Where in spec:** README.md L326; PARITY_CHECKLIST.md L116–122
**Category:** shell
**Description:** "Filter" 11px label + 3 chips: All / Mine / Agents. Each height 24, padding 0 8, 1px border, 5px radius. Active chip: `--accent` border + `--accent-bg` background + `--accent` text. Agents chip has green pulsing 6×6 dot (`#22c55e`, `0 0 0 2px #22c55e33` ring) when active.
**Acceptance criteria:** Click updates `filterAssignee` state ("all"|"mine"|"agents"); agents chip dot only on the agents chip when active.
**Dependencies:** SPEC-014, SPEC-057

## SPEC-060: Filter row — View switcher

**Where in spec:** README.md L328–334; PARITY_CHECKLIST.md L123–128
**Category:** shell
**Description:** Right-aligned (margin-left auto) pill group, 4 segmented buttons: Kanban / Timeline / Terminal / Dispatch. Container: 1px border, 2px padding, `--bg` bg, 6px radius. Each button height 22, padding 0 9, 12px icon + label, 11.5px font. Active button: `--surface` bg + 0 1px 2px shadow + 600 weight. Icons (lucide-react equivalents): Kanban (KanbanSquare/Columns3), Timeline (GanttChart or custom dot-line-dot), Terminal (Terminal or `>`), Dispatch (LayoutGrid/Radio/Network).
**Acceptance criteria:** All 4 buttons; clicking persists to URL query param `view`.
**Dependencies:** SPEC-057

## SPEC-061: Vertical divider in filter row

**Where in spec:** README.md L325; PARITY_CHECKLIST.md L115
**Category:** shell
**Description:** 1×18px vertical divider in `--border` between Group control and Filter chips, 6px horizontal margin.
**Acceptance criteria:** Exact width 1px, height 18px.
**Dependencies:** none

## SPEC-062: AI suggestion strip

**Where in spec:** README.md L336–339; PARITY_CHECKLIST.md L130–136
**Category:** shell
**Description:** 28px-tall strip between filter row and view content. Background: subtle linear-gradient from `--accent-bg` to `--bg` (prototype literal: `linear-gradient(180deg, #f6f5ff, #fafaf9)`). Content: ✨ sparkles icon + "{N} AI suggestions" (accent) + " — " + top suggestion text (text-2) + Apply button (accent solid) + Dismiss button (subtle). Hide entirely when `suggestions.length === 0`.
**Acceptance criteria:** Strip absent when no suggestions; otherwise renders. Padding 6/14, 11.5px text.
**Dependencies:** SPEC-035

## SPEC-063: KanbanView — overall layout

**Where in spec:** README.md L346–349; PARITY_CHECKLIST.md L176–177
**Category:** view-kanban
**Description:** 4 columns side-by-side (in `col` grouping; varies in other groupings — see SPEC-068). Flex row, gap 4px, padding 12px 10px, overflow-x auto. Each column flex 1, min-width 200px.
**Acceptance criteria:** Min-width 200 enforced; horizontal overflow scrolls.
**Dependencies:** SPEC-068

## SPEC-064: KanbanView — column structure

**Where in spec:** README.md L350–354; PARITY_CHECKLIST.md L178–190
**Category:** view-kanban
**Description:** Column = flex column, gap 8px, padding 6px, `--radius` rounded. Header row: 8×8 color dot (status accent: indigo for In Progress, purple `#a855f7` for Review, green for Done, neutral text-3 for Backlog) + name (12px 600) + count (11px `--text-3`) + spacer + "+" button (20×20 ghost) + "..." button (20×20 ghost). Cards list: flex column, gap 6, min-height 80. Empty state: dashed border `--border`, "Drop or **+ add**" centered (16/8 padding, 11px text, accent on "+ add").
**Acceptance criteria:** Column dot colors exactly match per status; header buttons functional placeholders.
**Dependencies:** SPEC-001/002/003

## SPEC-065: KanbanCard — outer container

**Where in spec:** README.md L356–369; PARITY_CHECKLIST.md L152–155
**Category:** card-detail | view-kanban
**Description:** `--surface` bg, 1px `--border`, 6px (Day) radius, 8px/10px padding, flex column gap 6, fontSize 12. Resting shadow `0 1px 0 rgba(0,0,0,0.02)`. Selected: `--accent` border + 3px `--accent`/22 outer ring via box-shadow.
**Acceptance criteria:** Exact paddings, gap, font size; selected ring renders.
**Dependencies:** SPEC-009

## SPEC-066: KanbanCard — top meta row

**Where in spec:** README.md L359; PARITY_CHECKLIST.md L156–164; prototype/concept-haul.jsx L159–220
**Category:** card-detail | view-kanban
**Description:** Flex row, gap 6: PriorityIndicator + HAUL-N (10.5px mono `--text-3`, letter-spacing 0.2) + BUG label (only if `card_type === "bug"`: 5×5 red round dot + "BUG" 10px 600 red) + blocked icon (only if `card.blockedBy`: red ban-circle 11px) + margin-left auto + PresenceCluster (max 3, size 14, excluding assignee if agent already in main chip) + comment count (msg icon + N, 10.5px `--text-3`) + AssigneeChip (size 18) with 7×7 green pulsing dot at bottom-right if agent working (1.5px surface ring).
**Acceptance criteria:** All elements present conditionally; order exact.
**Dependencies:** SPEC-013, SPEC-016, SPEC-017

## SPEC-067: KanbanCard — title + meta row + progress bar

**Where in spec:** README.md L360–362; PARITY_CHECKLIST.md L165–171
**Category:** card-detail | view-kanban
**Description:** Title: font-weight 500, 12px, line-height 1.35, -webkit-line-clamp 2. Meta row (flex row, gap 6, flex-wrap): EpicChip + estimate "Npt" (10.5px `--text-3` mono) + margin-left auto + due date (red if overdue, amber if soon ≤2 days, `--text-3` otherwise). Progress bar (only if `card.progress` set and < 1): 2px tall, full-width, `--border` track + `--accent` fill, border-radius 99 with overflow hidden.
**Acceptance criteria:** Line clamp = 2 (or 1 in compact mode); progress bar suppressed when 100%.
**Dependencies:** SPEC-018

## SPEC-068: KanbanView — grouping modes

**Where in spec:** README.md L368–376; PARITY_CHECKLIST.md L191–196; prototype/concept-haul.jsx L302–365
**Category:** view-kanban
**Description:** 5 grouping modes: `col` (4 status columns), `priority` (Urgent/High/Med/Low — only populated buckets shown), `epic` (one per epic with color dot + "No epic"), `assignee` (one per assignee with cards — agents grouped together then users — + "Unassigned"), `due` (Overdue/Today/This week/Later/No due date).
**Acceptance criteria:** When grouping ≠ `col`, drop between groups updates that field (priority, epic, assignee, or due date). Drag in `col` mode updates column_id only.
**Dependencies:** SPEC-069

## SPEC-069: KanbanView — drag-drop handlers

**Where in spec:** README.md L364–367, L376; PARITY_CHECKLIST.md L197–202; prototype/concept-haul.jsx L287–294
**Category:** drag-drop | view-kanban
**Description:** Uses `@dnd-kit`. onDragOver: preventDefault + set `dragOver` state. onDragLeave: clear `dragOver`. onDrop: update card field based on grouping mode (column_id / priority / epic_id / assignee / due). Position within column uses fractional positions via existing `positionAfter`/`positionBefore`. Drop target highlight: `--accent-bg` background.
**Acceptance criteria:** Fractional position math correct; drop highlight 120ms transition (SPEC-114).
**Dependencies:** SPEC-068, SPEC-114

## SPEC-070: TimelineView — constants + layout

**Where in spec:** README.md L378–401; PARITY_CHECKLIST.md L329–333; prototype/concept-haul-views.jsx L28–34
**Category:** view-timeline
**Description:** Constants: TL_DAY_W=64, TL_ROW_H=32, TL_LANE_PAD=8, TL_LANE_LABEL_W=200, TL_START=-2, TL_END=14 (17 days, today−2 to today+14). Header row: 200px lane-label column + scrollable days at 64px each. Lane rows below header — auto-height based on packed rows.
**Acceptance criteria:** 17 day cells visible by default; widths exact.
**Dependencies:** none

## SPEC-071: TimelineView — day header cell

**Where in spec:** README.md L385; PARITY_CHECKLIST.md L334–339
**Category:** view-timeline
**Description:** Header row 42px (prototype) / 44px (checklist) tall. Each cell 64px wide. Weekday abbreviation (10px 700 mono UPPER, letter-spacing 1) + day number (13px 700). Today's cell: `--accent-bg` background; weekday color = accent. Weekend cells: `--bg` background (slightly darker than surface). Lane-label header: "HAULER · N" (10px 700 mono UPPER, letter-spacing 1.5).
**Acceptance criteria:** Today + weekend states render correctly; week-day abbreviations uppercase.
**Dependencies:** SPEC-070

## SPEC-072: TimelineView — lane label cell

**Where in spec:** README.md L387–393; PARITY_CHECKLIST.md L331–333
**Category:** view-timeline
**Description:** 200px wide, padding 10/12, flex column. Avatar (26px) + name (600 12.5px, mono for agents/font for users) + sub (10.5px `--text-3` — handle for users, `{plugin} · agent` for agents). Working agents get a 7×7 green pulsing dot (boxShadow ring `0 0 0 2px green/33`). Bottom workload bar: "{count}t · {pts}pt" label (10px mono, minWidth 38) + thin 3px bar (1px border, 99px radius). Cap = 21pt (a sprint's worth). Fill color: green ≤70%, amber 70–100%, red >100%.
**Acceptance criteria:** Workload color thresholds exact; agent lanes have `--accent-bg` background tint.
**Dependencies:** none

## SPEC-073: TimelineView — lane track + today line + day stripes

**Where in spec:** README.md L395–398; PARITY_CHECKLIST.md L340–346
**Category:** view-timeline
**Description:** Lane track = everything right of label. Vertical day stripes (1px right border between days, weekend = `--bg` tint). 2px vertical yellow today line at today's x position, full lane height (prototype: amber color with `0 0 0 1px amber/33` shadow). Empty lane placeholder: "no haul scheduled — drop a card to assign" (italic, `--text-3`, 11px, vertically centered).
**Acceptance criteria:** Today line stays vertical and accurate after scroll.
**Dependencies:** SPEC-070

## SPEC-074: TimelineView — row packing algorithm

**Where in spec:** README.md L399; PARITY_CHECKLIST.md L344; prototype/concept-haul-views.jsx L44–57
**Category:** view-timeline
**Description:** Sort cards by left edge ascending; greedily place each card on the lowest row where it doesn't overlap any earlier card. Lane height = `rows * 36 + 16` (with minimum 58px so labels are readable). Prototype: `rows * TL_ROW_H + TL_LANE_PAD * 2` with `Math.max(58, ...)`. Tolerance 2px between cards.
**Acceptance criteria:** No card overlaps another; rows compact.
**Dependencies:** SPEC-070

## SPEC-075: TimelineBar (timeline card variant)

**Where in spec:** README.md L402–410; PARITY_CHECKLIST.md L347–355; prototype/concept-haul-views.jsx L233–268
**Category:** card-detail | view-timeline
**Description:** Thinner 32px-tall card. Padding 3/6/3/9. 3px left stripe in epic color (or asphalt/`--text-2` if no epic). 5×5 working dot (pulsing green) if agent working. HAUL-N (mono 10px `--text-3`). Title (truncates with ellipsis, 11.5px 500). P0 badge (top-right, 9px 700, red, padded 0/4, 1px red border) if urgent. Border red if overdue, otherwise epic color, 1.5px solid, 5px radius. Selected: `--accent` border + 3px `--accent`/55 outer ring + `0 2px 6px rgba(0,0,0,0.08)`. Resting box-shadow `0 1px 2px rgba(0,0,0,0.05)`. Cursor: grab.
**Acceptance criteria:** Width computed via `clamp(80, estimate * 14, 200)` px; positioned absolutely with right edge = due date x.
**Dependencies:** SPEC-070, SPEC-074

## SPEC-076: TimelineView — drag-drop (reassign + reschedule)

**Where in spec:** README.md L411–415; PARITY_CHECKLIST.md L356–360
**Category:** drag-drop | view-timeline
**Description:** Drag onto different lane → reassign to that hauler. Drag onto different x-position → change due date (round nearest day = `Math.round(x / 64) + TL_START`). Drop handler receives both lane id and x offset. Lane id "none" → set `assignee = null`. Both axes scroll independently.
**Acceptance criteria:** Lane + x simultaneously update on drop; rounding to nearest day correct.
**Dependencies:** SPEC-070

## SPEC-077: TerminalView — overall layout + prompt

**Where in spec:** README.md L417–433, L451–453; PARITY_CHECKLIST.md L362–368
**Category:** view-terminal
**Description:** Full page padding 12/14, font: `var(--font-mono)`, font-size 12, line-height 1.55. Background `--bg`, color `--text`. Top prompt line: `$ board --list --group=column --sort=priority,due` (green `$`, text-3 rest). View renders in monospace regardless of theme, colors come from theme palette; Mono theme is most coherent.
**Acceptance criteria:** Exact prompt text; line-height 1.55.
**Dependencies:** none

## SPEC-078: TerminalView — section headers (box-drawing chars)

**Where in spec:** README.md L424–429, L447; PARITY_CHECKLIST.md L369–370
**Category:** view-terminal
**Description:** Section dividers: `┌── COLUMN_NAME [count] ──` — box-drawing chars are literal Unicode (`┌`, `─`, `│`); the trailing dashed area is implemented as a 1px dashed bottom border on a flex-1 spacer (NOT repeated ─ chars). Count is zero-padded to 2 digits via `String(n).padStart(2, "0")`. Section header color = `--accent`, 700 weight.
**Acceptance criteria:** Literal `┌──` chars; dashed-border spacer not repeated em-dashes.
**Dependencies:** SPEC-077

## SPEC-079: TerminalRow (terminal view row)

**Where in spec:** README.md L436–446; PARITY_CHECKLIST.md L370–377; prototype/concept-haul-views.jsx L329–363
**Category:** card-detail | view-terminal
**Description:** Each `│`-prefixed line. Anatomy left to right: tab `│` (in `--text-3`); HAUL-N (70px wide, mono, `--text-2`); priority `[Pn]` (28px wide, 700, color-coded: P0=red, P1=amber, P2=`--accent`, P3=`--text-3`); type `[TSK]` or `[BUG]` (34px wide, red 700 if bug, else `--text-3`); title (flex 1, truncates with ellipsis); assignee (`@agent` in green if agent or `~user` in accent if user, 600); "● live" if agent working (9px green); estimate (right-aligned, mono, width 36 / spec says ≥); due date with prefix `~` for normal, `!` for overdue, color amber if soon, red if overdue (width 70, right-aligned). Selected row: `--accent-bg` background + 2px left border accent (transparent border on unselected).
**Acceptance criteria:** Column widths exact; click opens card detail; no drag-drop.
**Dependencies:** SPEC-077

## SPEC-080: TerminalView — sort order + empty section + bottom cursor

**Where in spec:** README.md L433, L451; PARITY_CHECKLIST.md L379–380; prototype/concept-haul-views.jsx L274–283
**Category:** view-terminal | animation
**Description:** Sort: column order (`c2, c1, c3, c4` in prototype — In Progress first), then priority (urgent/high/medium/low), then due. Empty section renders: `│ // empty` (italic, `--text-3`). Bottom prompt: `$ _` (green `$`) + 8×14 blinking accent-color block cursor (`animation: blink 1s steps(1,end) infinite`, verticalAlign middle).
**Acceptance criteria:** Sort order exact; empty placeholder visible per group; cursor blinks via blink keyframe.
**Dependencies:** SPEC-067 (blink keyframe = SPEC-115)

## SPEC-081: DispatchView — fleet bar

**Where in spec:** README.md L461–470; PARITY_CHECKLIST.md L386–388; prototype/concept-haul-views.jsx L378–388
**Category:** view-dispatch
**Description:** Top section ~76px tall (10/12 padding inside surface-bg + 1px border container), 8px radius, gap 8, horizontal scroll if needed. "FLEET" label (9.5px 700 mono `--text-3` letter-spacing 1.5) + big agent count (18px 700 mono letter-spacing -0.5) in pill bordered by `--border` (1px right border separator).
**Acceptance criteria:** Fleet label + count rendered, then tile per agent.
**Dependencies:** SPEC-082

## SPEC-082: DispatchAgentTile

**Where in spec:** README.md L462–470; PARITY_CHECKLIST.md L400–408; prototype/concept-haul-views.jsx L428–465
**Category:** card-detail | view-dispatch
**Description:** 220px wide (flex 0 0 220px), padding 9, 7px radius (or `--radius`). Working: `--accent-bg` background + 1px `accent + "55"` border + 3px accent left stripe (position absolute). Idle: `--bg` background + 1px `--border`. Top row: AgentChip (22) + @name (mono 11.5px 700) + plugin (9.5px `--text-3`) + LIVE (9px 700 accent mono, `● LIVE`) / IDLE (`--text-3`) badge top-right. "On card" line: 10.5px `--text-2`, height 26px, line-height 1.3, 2-line overflow hidden. Content: `HAUL-N` mono + title if agent on a c2 card, else `agent.desc` (text-3). Bottom: load bar (3px, 1px border, 99 radius) + percentage label (9px mono `--text-3` minWidth 28 right).
**Acceptance criteria:** Working state styling exact; load bar color = accent when working, text-3 when idle.
**Dependencies:** SPEC-012

## SPEC-083: DispatchView — 4 prioritised sections

**Where in spec:** README.md L472–479; PARITY_CHECKLIST.md L390–398; prototype/concept-haul-views.jsx L391–425
**Category:** view-dispatch
**Description:** Horizontal flex row, gap 6, equal width (flex 1 1 0, min-width 180), full height. 4 sections:
- **Hot** (red dot, "overdue + urgent") — `isOverdue(card.due) && col !== "c4"`
- **In Flight** (accent, "being worked") — `col === "c2"`
- **Ready** (green, "in review") — `col === "c3"`
- **Queue** (`--text-3`, "backlog") — `col === "c1"`

Section header: 8×8 colored dot + name (12px 700) + count (10.5px mono `--text-3`) + sub label (10px `--text-3`, prefixed with `· `).
**Acceptance criteria:** Filter predicates exact; Hot section is read-only filter, not a column.
**Dependencies:** SPEC-084

## SPEC-084: DispatchView — drag-drop rules

**Where in spec:** README.md L478–479; PARITY_CHECKLIST.md L395–398; prototype/concept-haul-views.jsx L399–401
**Category:** drag-drop | view-dispatch
**Description:** Drop on In Flight (c2) / Ready (c3) / Queue (c1) → update card.column_id accordingly. Hot section is NOT a drop target (it's a derived filter). Drag-over visual: `--accent-bg` background, 120ms transition. Cards rendered via passed-in `renderCard` prop so same KanbanCard component is reused across views.
**Acceptance criteria:** Dropping on Hot is rejected silently; mapped sections update column_id.
**Dependencies:** SPEC-083, SPEC-065

## SPEC-085: Right rail — orchestration

**Where in spec:** README.md L483–492, L51–56; PARITY_CHECKLIST.md L139–145; prototype/concept-haul.jsx L679–708
**Category:** shell
**Description:** Width 340px, full main-area height, `--surface` bg, 1px left border. Visible when `consoleOpen === true || selected != null`. Two modes: Card-selected (shows CardDetailPanel; if console also open, shows "← Back to console" link at top). Console mode (no card): RailTabs + active tab panel.
**Acceptance criteria:** Exactly 340px wide; flexShrink 0; hidden otherwise.
**Dependencies:** SPEC-086, SPEC-087, SPEC-088, SPEC-089

## SPEC-086: RailTabs

**Where in spec:** README.md L494–498; PARITY_CHECKLIST.md L233–239; prototype/concept-haul-rails.jsx L37–73
**Category:** rail-console | rail-activity | rail-plans
**Description:** Three-segment control at top of rail. Padding 8/10, gap 4, 1px bottom border, `--surface` bg. Each segment flex 1, height 28, padding 0 8, 5px radius, gap 5, 11.5px 600. Each shows label + count badge (small bg-accent pill when active else bg-border, 9.5px 700, 1/5 padding, 99 radius, mono, minWidth 16, centered). Active segment: `--bg` background + inset 0 0 0 1px `--border-hi` shadow + `--text` color (vs `--text-2` inactive). Tabs:
- Console — count of working agents
- Activity — count of events in current view (default 14)
- Plans — count of pending proposals

**Acceptance criteria:** Click updates `railTab` (localStorage).
**Dependencies:** SPEC-097

## SPEC-087: ConsoleRail — sections + invite CTA

**Where in spec:** README.md L500–516; PARITY_CHECKLIST.md L241–248; prototype/concept-haul-rails.jsx L77–137
**Category:** rail-console
**Description:** Two sections via SectionHead: "{N} active now" / "on this board" then list of PresenceRow for non-idle entries; "{N} idle" / "available · last seen recently" then idle entries. Bottom CTA: full-width 30px, dashed border `--border-hi`, transparent bg, `--text-2`, 5px radius, "+ Invite people or hauler agents" with `+` icon. SectionHead: 10px 700 mono UPPER `--text-3` letter-spacing 1.3, 11px sub.
**Acceptance criteria:** Active/idle split via `p.action !== "idle"`.
**Dependencies:** SPEC-090

## SPEC-088: PresenceRow

**Where in spec:** README.md L502–515; PARITY_CHECKLIST.md L249–270; prototype/concept-haul-rails.jsx L139–252
**Category:** rail-console
**Description:** Padding 10/12, 1px bottom border. Background `--accent-bg` if agent + active + expanded, else `--surface`. Opacity 0.7 if idle.

Top row (button): 26px avatar with 8×8 action-colored pulsing dot (1.5px surface ring) bottom-right; name (12px 700, mono for agents, font for users); USER/AGENT pill (10px 700 mono, 1px border, 1/5 padding, 3px radius — agent: green color + green/55 border; user: text-3 + border); right-aligned `{● }{time} ago` (10px mono `--text-3`); expand chevron (rotates 90° when expanded) — agents only.

Action line: 11.5px `--text-2`, gap 5, single-line ellipsis. Verb in action color (viewing=accent, editing/commenting=amber, working=green "working on", scanning=green, idle=text-3), then HAUL-N chip (mono 10.5px, `--bg` bg, 1px border, 3px radius, padding 0/5, clickable to open card; `e.stopPropagation()`) + truncated card title `--text-3`. If no card + active scanning: "across the board" (italic text-3). If no card + idle: "not on a card" (italic text-3).

Telemetry row (working agents only, expanded or not): `{load}% · {tok}t/m` (9.5px mono `--text-3`, minWidth 64) + 3px load bar (1px border, 99 radius). Load color: green ≤30%, accent 30–70%, amber >70%.

Transcript (working agents, expanded): mono box, padding 10, 5px radius, `--bg` bg, 1px border, fontSize 11, lineHeight 1.6, maxHeight 110, overflow hidden. 4 lines shown; top line full opacity color `--text`, lower lines opacity `1 - i*0.18` color `--text-2`. Each line prefixed `›` in `--text-3`. "tail -f" label top-right (9px mono `--text-3` letter-spacing 1).

**Acceptance criteria:** Transcript cycles via setInterval(3.2s) advancing index by 1 (modulo length). Click toggles expanded.
**Dependencies:** SPEC-016, SPEC-014, SPEC-098

## SPEC-089: SectionHead (rail section header)

**Where in spec:** prototype/concept-haul-rails.jsx L254–266
**Category:** rail-console | rail-activity | rail-plans
**Description:** Reusable section header in rails. Padding 10/12/4, flex baseline gap 8, 1px bottom border, `--bg` bg. Label: 10px 700 mono UPPER letter-spacing 1.3 `--text-3`. Sub: 11px `--text-3` font.
**Acceptance criteria:** Used by ConsoleRail and PlansRail and ActivityRail consistently.
**Dependencies:** none

## SPEC-090: ConsoleRail — transcript cycle timing

**Where in spec:** README.md L516, L621; PARITY_CHECKLIST.md L268–269; prototype/concept-haul-rails.jsx L81–95
**Category:** rail-console | animation
**Description:** A `setInterval` ticks every 3.2s and advances each working agent's transcript line by 1 (modulo length). In production: fetch real telemetry via polling or SSE/WS.
**Acceptance criteria:** Interval exactly 3200ms; idle agents skipped; cleared on unmount.
**Dependencies:** SPEC-088, SPEC-037

## SPEC-091: ActivityRail — filter chips

**Where in spec:** README.md L520; PARITY_CHECKLIST.md L274–276; prototype/concept-haul-rails.jsx L378–392
**Category:** rail-activity
**Description:** Top row: filter chips `All` / `Agents` / `Comments` / `Ships`. Padding 8/10, 1px bottom border, `--surface` bg, flex wrap gap 4. Each chip 22 high, padding 0/9, 99 radius, 1px border, 11px 600. Active: `--accent` border + `--accent-bg` bg + `--accent` text.
**Acceptance criteria:** Filter maps to kind: agent/comment/ship; `all` shows everything.
**Dependencies:** none

## SPEC-092: ActivityRail — time buckets

**Where in spec:** README.md L522–525; PARITY_CHECKLIST.md L277–280
**Category:** rail-activity
**Description:** Events sorted by `at` descending then grouped into 3 buckets: "Just now" (< 0.5h ago); "Earlier today" (0.5–8h ago); "Yesterday+" (> 8h ago). Each bucket has SectionHead with label UPPER and "{N} events" sub.
**Acceptance criteria:** Boundaries exact; empty buckets not rendered.
**Dependencies:** SPEC-089

## SPEC-093: ActivityRail — vertical connector line

**Where in spec:** README.md L533; PARITY_CHECKLIST.md L282
**Category:** rail-activity
**Description:** 1px vertical line at x=24 within each group connecting the avatars visually (subtle, `--border`). Renders as absolute-positioned span, top 8 bottom 8 width 1.
**Acceptance criteria:** Line precisely at x=24 from group left edge.
**Dependencies:** none

## SPEC-094: ActivityRow / ActivityItem

**Where in spec:** README.md L527–532; PARITY_CHECKLIST.md L284–292; prototype/concept-haul-rails.jsx L417–457
**Category:** rail-activity
**Description:** Padding 8/12, flex row gap 10. Left: actor avatar (22px, zIndex 1, agent or user). Body (flex 1): top meta row with actor name (11.5px 600, mono for agents/font for users) + KIND pill (9px 700 mono, 1px border `{kindColor}55`, 3px radius, 1/5 padding) + right-aligned `{fmtAgo} ago` (10px mono `--text-3`); event text (12px `--text-2`, line-height 1.4); optional card chip (inline-flex, 1/6 padding, 1px border, 3px radius, `--bg` bg, 10px mono, "HAUL-N · {title}" with title `--text-2`, font family, max-width 160, ellipsis). Fade-in animation 320ms cubic-bezier(.2,.7,.3,1) when newest in "now" bucket.
**Acceptance criteria:** All elements present; animation fires only for index 0 in `now` bucket.
**Dependencies:** SPEC-095, SPEC-116

## SPEC-095: ActivityRail — kind pill colors

**Where in spec:** README.md L529; PARITY_CHECKLIST.md L289; prototype/concept-haul-rails.jsx L424–431
**Category:** rail-activity
**Description:** Kind → {color, label}: agent → {accent, "AGENT"}; comment → {text-2, "NOTE"}; move → {green, "MOVE"}; assign → {amber, "ASSIGN"}; create → {text-2, "NEW"}; ship → {green, "SHIP"}.
**Acceptance criteria:** All 6 mappings present (label, priority are in data model but unmapped in prototype renderer).
**Dependencies:** SPEC-032

## SPEC-096: PlansRail — sections + propose CTA

**Where in spec:** README.md L538–566; PARITY_CHECKLIST.md L296–301; prototype/concept-haul-rails.jsx L461–507
**Category:** rail-plans
**Description:** SectionHead "{N} pending" / "waiting for review" then PlanCard list for pending; SectionHead "recently decided" / "{N}" then list for decided. Bottom CTA: full-width 30px, solid `--accent` bg, `--accent-fg` text, 5px radius, "+ Propose a plan" with `+` icon (stroke 2.2).
**Acceptance criteria:** Sections by status; CTA always visible.
**Dependencies:** SPEC-089, SPEC-098

## SPEC-097: PlansRail — count badge in RailTabs

**Where in spec:** README.md L498; prototype/concept-haul-rails.jsx L41
**Category:** rail-plans
**Description:** Plans tab badge in RailTabs = count of proposals with `status === "pending"`.
**Acceptance criteria:** Live updates as proposals are approved/rejected.
**Dependencies:** SPEC-086, SPEC-033

## SPEC-098: PlanCard

**Where in spec:** README.md L543–562; PARITY_CHECKLIST.md L302–323; prototype/concept-haul-rails.jsx L509–620
**Category:** rail-plans
**Description:** Padding 10/12, 1px bottom border. Background: pending → `--surface`; decided → `--bg`; rejected → opacity 0.55.

Top button (toggles expand): proposer avatar (22) with AI badge (11×11 round pill, `--accent` bg, `--accent-fg` text, 8px 800, "AI", 1.5px surface ring, positioned -3/-3 right/bottom) ONLY for agent proposers; name (11.5px 700, mono for agents/font for users) + "proposes" (10px `--text-3`) + right-aligned `{time} ago` (10px mono); title (13px 600 text); meta row (gap 8, marginTop 5): status pill (9px 700 mono, 1px border `{color}55`, 3px radius, 1/5 padding — pending=amber "PENDING", approved=green "APPROVED", rejected=text-3 "REJECTED") + `{N} action(s)` (10.5px `--text-3`) + right-aligned `conf {pct}%` (10px mono `--text-3`) only if confidence set.

Expanded content (paddingLeft 32, marginTop 10): summary paragraph (12px `--text-2`, line-height 1.45, marginBottom 8); action list inside mono box (1px border, `--bg` bg, 5px radius, padding 8, mono 11px line-height 1.6, marginBottom 10) — one PlanAction line per action.

Pending: 3 buttons in flex row gap 6: Approve (flex 1, 28h, `--accent` bg, `--accent-fg`, 11.5px 700, check icon stroke 2.4) + Reject (28h, padding 0/10, 1px border, `--surface` bg, `--text-2`, 11.5px 600) + Edit (same as Reject but with edit pencil icon).

Approved: text "Approved by {name} · executed" (11px green, check icon).
Rejected: text "Rejected by {name}" + optional italic " — '{reason}'" (11px `--text-3`).

**Acceptance criteria:** AI badge only on agent proposers; click anywhere on top button toggles expansion.
**Dependencies:** SPEC-033

## SPEC-099: PlanAction (action list line)

**Where in spec:** README.md L552–558; PARITY_CHECKLIST.md L315–320; prototype/concept-haul-rails.jsx L622–650
**Category:** rail-plans
**Description:** Line per action: kind label (10px 700, 0.5 letter-spacing, minWidth 60, UPPER, kind color) + summary. Kind colors: priority=amber, move=accent, label=text-2, split=green, ping=amber, archive=text-3.

Summary templates:
- PRIORITY: `set <b>{target}</b> priority {from} → <b>{to}</b>`
- MOVE: `move <b>{target}</b> {from} → <b>{to}</b>`
- LABEL: `add label <b>{add}</b> to <b>{target}</b>`
- SPLIT: `split <b>{target}</b> into {parts.length} cards`
- PING: `ping {users.map(u=>"@"+u).join(", ")} re: <b>{target}</b>`
- ARCHIVE: `archive <b>{count}</b> cards`

**Acceptance criteria:** All 6 templates rendered (assign + due are in data model but unimplemented in prototype renderer); bold tags applied.
**Dependencies:** SPEC-034

## SPEC-100: PlanCard — approve / reject behaviour

**Where in spec:** README.md L559–566, L606–607; PARITY_CHECKLIST.md L321; prototype/concept-haul-rails.jsx L471–486
**Category:** rail-plans | backend-api
**Description:** Click Approve → mark approved + execute actions atomically (status: pending → approved, also approvedBy user). Click Reject → mark rejected (optionally with reason). Edit → opens flow to modify actions before approving (placeholder). On approve, actions execute in a single DB transaction (server-side preferred per Open Product Questions).
**Acceptance criteria:** Atomic execution; partial failures roll back; UI optimistic update.
**Dependencies:** SPEC-098, SPEC-047

## SPEC-101: CardDetailPanel — header bar

**Where in spec:** README.md L568–571; PARITY_CHECKLIST.md L206–210
**Category:** card-detail
**Description:** 44px top header. Padding 0/14, 1px bottom border, flex row gap 8. HAUL-N (mono 11px `--text-3`) on left, margin-left auto, then Focus button (outline, 24h, 1px border, 4px radius, padding 0/8, focus icon + "Focus" label + F key hint 9px mono `--text-3` 1px border 2px radius padding 0/4) + Close button (24h, padding 0/8, 1px border `--bg` bg `--text-2`, 11px).
**Acceptance criteria:** Focus button click → set `focusedId`.
**Dependencies:** none

## SPEC-102: CardDetailPanel — 2-column metadata grid

**Where in spec:** README.md L575–584; PARITY_CHECKLIST.md L211–220
**Category:** card-detail
**Description:** Body: padding 16, flex column gap 14, overflow auto. Title (h3, 16px 600, line-height 1.35, letter-spacing -0.2). Grid: gridTemplateColumns `80px 1fr`, rowGap 8, columnGap 12, 12px font. Fields:
- Status (8×8 color dot in `--accent` + column name)
- Priority (PriorityIndicator + label)
- Assignee (chip 18 + name; if agent.status === "working": green 6×6 dot + "WORKING" 10px 600 green)
- Epic (6×6 round color dot + name) or `—`
- Due (color `--red` if overdue else `--text`) or `—`
- Estimate (mono "N pt")
- Labels (comma-split → small bordered chips: 10.5px, 1/6 padding, 1px border, 3px radius, `--text-2` color)

**Acceptance criteria:** All 7 fields rendered.
**Dependencies:** SPEC-013, SPEC-017, SPEC-018

## SPEC-103: CardDetailPanel — Agent activity section

**Where in spec:** README.md L582–584; PARITY_CHECKLIST.md L222–224
**Category:** card-detail
**Description:** Visible only if events for this card exist. Section header (11px 600 UPPER letter-spacing 0.5 `--text-3` marginBottom 6 — note checklist says 10px 700 letter-spacing 1.5; prototype uses 11/600/0.5). Reuses activity event row design.
**Acceptance criteria:** Filters ACTIVITY by card_id.
**Dependencies:** SPEC-094

## SPEC-104: CardDetailPanel — AI suggested section

**Where in spec:** README.md L585; PARITY_CHECKLIST.md L225–227
**Category:** card-detail
**Description:** Section header (same style as agent activity). One suggested action button: full-width, flex-start gap 8, padding 10, 1px border, 6px radius, `--bg` bg, 12px. Sparkles icon + bold action title + " — " + reason + right-aligned "Apply" link in `--accent` 600 11px. Example: "Move to In Review — PR merged, tests green".
**Acceptance criteria:** Renders even if no specific suggestion (prototype hardcodes one); Apply button triggers suggestion apply.
**Dependencies:** SPEC-035

## SPEC-105: CardDetailPanel — "Back to console" link

**Where in spec:** README.md L489; prototype/concept-haul.jsx L686–696
**Category:** card-detail
**Description:** When `consoleOpen && selectedCard`, panel shows "← Back to console" button at top. Padding 8/12, 1px bottom border, `--bg` bg, `--accent` color, 11.5px 600, left-aligned, cursor pointer. Click → deselect card (setSelected(null)) returning to rail tabs.
**Acceptance criteria:** Only visible when both states true.
**Dependencies:** SPEC-085

## SPEC-106: FocusModal — backdrop + container

**Where in spec:** README.md L416–428; PARITY_CHECKLIST.md L416–427; prototype/concept-haul-views.jsx L509–523
**Category:** focus-modal
**Description:** Fixed full-viewport overlay, z-index 1000. Backdrop: `var(--bg) + f0` alpha + `backdrop-filter: blur(8px)`. Click backdrop → close. Esc → close. Inner modal: stop propagation on inner click; centered (flex align/justify center); width `min(720px, 92vw)`, maxHeight 92vh; `--surface` bg, 1px `--border`, 14px borderRadius; padding 32 top, 36 left/right, 28 bottom; box-shadow `0 30px 80px rgba(0,0,0,0.25)`; flex column gap 18; overflow auto. Animation: `haul-fade-in 200ms`.
**Acceptance criteria:** Backdrop blur applied; ESC closes.
**Dependencies:** SPEC-116

## SPEC-107: FocusModal — meta strip + Esc button

**Where in spec:** README.md L429–434; PARITY_CHECKLIST.md L428–435
**Category:** focus-modal
**Description:** Top meta strip, flex row gap 8, 11px `--text-3`. HAUL-N (mono 700, `--accent`); BUG badge (10px 700 red, padding 1/6, 3px radius, red/22 bg) if bug; EpicChip-like inline (5×5 round dot + name); `·` separator; "{priority} priority"; `·`; "due {date}" (red 700 if overdue else `--text-3`); right-aligned "Esc · close" button (24h, padding 0/8, 1px border, 5px radius, `--bg` bg, 11px `--text-2`).
**Acceptance criteria:** All meta elements present conditionally.
**Dependencies:** none

## SPEC-108: FocusModal — title

**Where in spec:** README.md L436; PARITY_CHECKLIST.md L436
**Category:** focus-modal
**Description:** h1, 32px 600, line-height 1.2, letter-spacing -0.5, color `--text`. No margin.
**Acceptance criteria:** Exact typography.
**Dependencies:** SPEC-007

## SPEC-109: FocusModal — assignee + Mark shipped

**Where in spec:** README.md L437–440; PARITY_CHECKLIST.md L437–440; prototype/concept-haul-views.jsx L546–568
**Category:** focus-modal
**Description:** Flex row gap 12: assignee chip (28px) + name (12.5px 600) + secondary line (10.5px) — if agent.status === "working": green 5×5 pulsing dot + "working alongside you · {plugin}" (green 700); else "{plugin} · idle" or "human"; margin-left auto, "Mark shipped" button (32h, padding 0/14, solid `--accent` bg `--accent-fg` text, 7px radius, 12.5px 600, check icon stroke 2.4).
**Acceptance criteria:** Working pulse animation 1.4s in prototype (vs standard 1.6s).
**Dependencies:** SPEC-013

## SPEC-110: FocusModal — description

**Where in spec:** README.md L441; PARITY_CHECKLIST.md L441
**Category:** focus-modal
**Description:** 14px font, line-height 1.55, `--text-2` color. Supports inline bold for emphasis.
**Acceptance criteria:** Prototype hardcodes a description; production should pull from card.description.
**Dependencies:** none

## SPEC-111: FocusModal — progress card

**Where in spec:** README.md L442–445; PARITY_CHECKLIST.md L442–445
**Category:** focus-modal | animation
**Description:** Flex row gap 12, padding 10/14, `--bg` bg, 1px `--border`, 8px radius. Big `{done}/{total}` (20px 700 mono, line-height 1, "/" portion in `--text-3`) + flex 1 column with "SUBTASKS COMPLETE" label (10.5px `--text-3` 600 letter-spacing 0.5) + 5px progress bar (1px border, 99 radius, `--surface` track, `--accent` fill, width transition 240ms) + `{pct}%` (11px mono `--text-3`).
**Acceptance criteria:** pct computed from subtasks; progress bar animates on toggle.
**Dependencies:** SPEC-112, SPEC-118

## SPEC-112: FocusModal — subtasks list

**Where in spec:** README.md L446–450; PARITY_CHECKLIST.md L446–450
**Category:** focus-modal
**Description:** Flex column gap 1. Each subtask: button (transparent bg, no border, padding 9/8, flex-start gap 10, 6px radius, text-align left, cursor pointer, hover bg `--hover`). 18×18 checkbox (1.5px `--accent`/`--border-hi` border, 5px radius, accent bg when done, surface bg when not, check icon 12px stroke 2.6 when done in `--accent-fg`, transition all 160ms). Text 13.5px line-height 1.4, `--text-3` + strikethrough if done.
**Acceptance criteria:** Click toggles done; mock subtasks per card (FOCUS_SUBTASKS for k6, k7; fallback "Decompose this card into next steps").
**Dependencies:** SPEC-036

## SPEC-113: Keyboard shortcut — F (Focus)

**Where in spec:** README.md L590, L592; PARITY_CHECKLIST.md L486; prototype/concept-haul.jsx L274–285
**Category:** keyboard
**Description:** Pressing `F` when a card is selected (and focusedId not yet set) opens Focus modal. Don't fire when input/textarea/contentEditable has focus.
**Acceptance criteria:** Listener on window keydown; e.preventDefault when triggered.
**Dependencies:** SPEC-106

## SPEC-114: Keyboard shortcut — Esc (close Focus)

**Where in spec:** README.md L594; PARITY_CHECKLIST.md L487; prototype/concept-haul-views.jsx L492–498
**Category:** keyboard
**Description:** Esc closes Focus modal. Listener attached when modal mounts; cleaned up on unmount.
**Acceptance criteria:** Doesn't fire from outside modal.
**Dependencies:** SPEC-106

## SPEC-115: Keyboard shortcut — C (New Issue)

**Where in spec:** README.md L595; PARITY_CHECKLIST.md L488
**Category:** keyboard
**Description:** `C` triggers New Issue dialog (placeholder — not implemented in prototype).
**Acceptance criteria:** Skipped when input focused.
**Dependencies:** SPEC-024

## SPEC-116: Keyboard shortcut — ⌘K (Search)

**Where in spec:** README.md L596; PARITY_CHECKLIST.md L489
**Category:** keyboard
**Description:** `⌘K` opens Search/Jump (placeholder — not implemented in prototype).
**Acceptance criteria:** Both cmd+k and ctrl+k recognised.
**Dependencies:** SPEC-023

## SPEC-117: Keyboard shortcut — J/K (navigate)

**Where in spec:** PARITY_CHECKLIST.md L490
**Category:** keyboard
**Description:** `J/K` navigate cards in list (placeholder — Terminal/Kanban).
**Acceptance criteria:** Future; skip if input focused.
**Dependencies:** none

## SPEC-118: Keyboard shortcut — ? (help)

**Where in spec:** PARITY_CHECKLIST.md L491
**Category:** keyboard
**Description:** `?` opens help overlay (placeholder).
**Acceptance criteria:** Future; skip if input focused.
**Dependencies:** none

## SPEC-119: Keyboard global rule — don't fire over inputs

**Where in spec:** PARITY_CHECKLIST.md L492; prototype/concept-haul.jsx L276–277
**Category:** keyboard
**Description:** Don't fire shortcuts when an input/textarea has focus (also covers `contentEditable`).
**Acceptance criteria:** Test in input + textarea + ce element confirms suppression.
**Dependencies:** none

## SPEC-120: Animation — `presence-pulse` keyframe

**Where in spec:** README.md L277–282, L614; PARITY_CHECKLIST.md L508; prototype/concept-haul.jsx L372
**Category:** animation
**Description:** `@keyframes haul-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.4); } }`. Duration 1.6s ease-in-out infinite.
**Acceptance criteria:** Applied to presence dots, agent green pulse on cards, Console toggle dot.
**Dependencies:** none

## SPEC-121: Animation — `fade-in` keyframe

**Where in spec:** README.md L615–616, L535; PARITY_CHECKLIST.md L509; prototype/concept-haul.jsx L373
**Category:** animation
**Description:** `@keyframes haul-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`. Used: 320ms for activity arrivals; 200ms for modal open.
**Acceptance criteria:** Applied to first event of "now" bucket on prepend; modal mount.
**Dependencies:** none

## SPEC-122: Animation — `blink` keyframe (terminal cursor)

**Where in spec:** README.md L451; PARITY_CHECKLIST.md L510; prototype/concept-haul.jsx L374
**Category:** animation
**Description:** `@keyframes haul-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`. Applied as `blink 1s steps(1,end) infinite` to 8×14 accent block cursor at terminal view bottom.
**Acceptance criteria:** Crisp on/off blink (steps function), not a smooth fade.
**Dependencies:** SPEC-080

## SPEC-123: Animation — card hover translateY + shadow

**Where in spec:** README.md L619; PARITY_CHECKLIST.md L511
**Category:** animation
**Description:** Card hover: 120ms transition on shadow + transform translateY(-1px).
**Acceptance criteria:** Applied to KanbanCard at minimum; small lift visible.
**Dependencies:** SPEC-065

## SPEC-124: Animation — drag-target highlight 120ms

**Where in spec:** README.md L617; PARITY_CHECKLIST.md L512
**Category:** animation | drag-drop
**Description:** Drop targets get `--accent-bg` background with 120ms transition. CSS: `.haul-col { transition: background 120ms; } .haul-col.haul-over { background: --accent-bg; }`.
**Acceptance criteria:** Applied to Kanban columns and Dispatch sections.
**Dependencies:** SPEC-069, SPEC-084

## SPEC-125: Animation — progress bar 240ms

**Where in spec:** README.md L620; PARITY_CHECKLIST.md L513
**Category:** animation
**Description:** Progress bar fill: width transition 240ms.
**Acceptance criteria:** Applied to FocusModal progress, KanbanCard progress, telemetry load bar.
**Dependencies:** SPEC-067, SPEC-111

## SPEC-126: Animation — modal fade-in 200ms

**Where in spec:** README.md L616; PARITY_CHECKLIST.md L514
**Category:** animation
**Description:** Modal opens with 200ms fade-in (uses fade-in keyframe).
**Acceptance criteria:** Applied to FocusModal mount.
**Dependencies:** SPEC-106, SPEC-121

## SPEC-127: Animation — transcript line cycle (3.2s)

**Where in spec:** README.md L621; prototype/concept-haul-rails.jsx L82–93
**Category:** animation | rail-console
**Description:** Transcript line cycle 3.2s interval; top line full opacity; lower lines opacity `1 - i*0.18` per step.
**Acceptance criteria:** Index advances mod length; only working agents tick.
**Dependencies:** SPEC-088, SPEC-090

## SPEC-128: Animation — theme swap is instant

**Where in spec:** README.md L618
**Category:** theme | animation
**Description:** Theme swap is instant — no animation. Chrome simply re-renders with new palette.
**Acceptance criteria:** No CSS transition on tokens that would cause visible interpolation.
**Dependencies:** SPEC-004

## SPEC-129: localStorage key `taskhauler.theme`

**Where in spec:** README.md L639; PARITY_CHECKLIST.md L502
**Category:** localStorage
**Description:** Stores theme name (`day`|`mono`|`paper`). Restored before first render. Applied to `<html>` data-theme attr.
**Acceptance criteria:** Exact key string; survive page reload.
**Dependencies:** SPEC-004

## SPEC-130: localStorage key `taskhauler.console-open`

**Where in spec:** README.md L637; PARITY_CHECKLIST.md L503
**Category:** localStorage
**Description:** Stores boolean whether the right rail is open in console mode.
**Acceptance criteria:** Exact key string; default true per prototype.
**Dependencies:** SPEC-025

## SPEC-131: localStorage key `taskhauler.rail-tab`

**Where in spec:** README.md L638; PARITY_CHECKLIST.md L504
**Category:** localStorage
**Description:** Stores `railTab` (`console`|`activity`|`plans`).
**Acceptance criteria:** Exact key string; default "console".
**Dependencies:** SPEC-086

## SPEC-132: URL persistence — view

**Where in spec:** README.md L634; PARITY_CHECKLIST.md L496
**Category:** url-state
**Description:** `view` (`kanban`|`timeline`|`terminal`|`dispatch`) persisted as URL query param.
**Acceptance criteria:** Reading URL on load + writing on change; back/forward updates state.
**Dependencies:** SPEC-060

## SPEC-133: URL persistence — grouping

**Where in spec:** README.md L633; PARITY_CHECKLIST.md L496
**Category:** url-state
**Description:** `grouping` (`col`|`priority`|`epic`|`assignee`|`due`) as URL query param.
**Acceptance criteria:** Reading URL on load; back/forward.
**Dependencies:** SPEC-058

## SPEC-134: URL persistence — filterAssignee

**Where in spec:** README.md L640; PARITY_CHECKLIST.md L496
**Category:** url-state
**Description:** `filterAssignee` (`all`|`mine`|`agents`) as URL query param.
**Acceptance criteria:** Reading URL on load; back/forward.
**Dependencies:** SPEC-059

## SPEC-135: URL persistence — selected card

**Where in spec:** README.md L635; PARITY_CHECKLIST.md L496
**Category:** url-state
**Description:** `selected` card id as URL hash or query param. Shareable link.
**Acceptance criteria:** Reading URL on load opens detail panel.
**Dependencies:** none

## SPEC-136: URL persistence — back/forward

**Where in spec:** PARITY_CHECKLIST.md L497
**Category:** url-state
**Description:** On URL change (back/forward navigation), re-read state from query.
**Acceptance criteria:** popstate listener wires state updates.
**Dependencies:** SPEC-132/133/134/135

## SPEC-137: URL — active board in hash

**Where in spec:** PARITY_CHECKLIST.md L498
**Category:** url-state
**Description:** Active board ID persisted to URL hash (existing pattern in `App.tsx`).
**Acceptance criteria:** Matches existing app conventions.
**Dependencies:** none

## SPEC-138: Empty state — no cards on board

**Where in spec:** PARITY_CHECKLIST.md L528
**Category:** empty-state
**Description:** Blank board with "Add your first card" CTA.
**Acceptance criteria:** Shown when board.cards.length === 0.
**Dependencies:** none

## SPEC-139: Empty state — no agents connected (Console)

**Where in spec:** PARITY_CHECKLIST.md L529
**Category:** empty-state | rail-console
**Description:** Empty Console rail with invite CTA visible.
**Acceptance criteria:** "Invite people or hauler agents" CTA always present at bottom; section headers may show "0 active now".
**Dependencies:** SPEC-087

## SPEC-140: Empty state — no activity

**Where in spec:** PARITY_CHECKLIST.md L530
**Category:** empty-state | rail-activity
**Description:** "No recent activity" message.
**Acceptance criteria:** Shown when filtered activity list is empty.
**Dependencies:** SPEC-091

## SPEC-141: Empty state — no proposals

**Where in spec:** PARITY_CHECKLIST.md L531
**Category:** empty-state | rail-plans
**Description:** "No plans pending" message.
**Acceptance criteria:** Shown when no pending proposals.
**Dependencies:** SPEC-096

## SPEC-142: Empty state — no subtasks on focused card

**Where in spec:** PARITY_CHECKLIST.md L532; prototype/concept-haul-views.jsx L488–490
**Category:** empty-state | focus-modal
**Description:** "Decompose this card into next steps" placeholder subtask shown when card has no subtasks.
**Acceptance criteria:** Renders one fake subtask with that text.
**Dependencies:** SPEC-112

## SPEC-143: Empty state — empty Kanban column

**Where in spec:** README.md L354; PARITY_CHECKLIST.md L190; prototype/concept-haul.jsx L644–648
**Category:** empty-state | view-kanban
**Description:** Dashed border, "Drop or **+ add**" centered. Padding 16/8, 11px text, accent on "+ add".
**Acceptance criteria:** Visible when column has zero cards.
**Dependencies:** SPEC-064

## SPEC-144: Empty state — empty Dispatch section

**Where in spec:** prototype/concept-haul-views.jsx L417–419
**Category:** empty-state | view-dispatch
**Description:** "—" placeholder in dashed-border box (padding 16/8, 1px dashed `--border`, 6px radius, `--text-3`, 11px).
**Acceptance criteria:** Visible when section has zero cards.
**Dependencies:** SPEC-083

## SPEC-145: Empty state — empty Timeline lane

**Where in spec:** README.md L401; prototype/concept-haul-views.jsx L216–220
**Category:** empty-state | view-timeline
**Description:** "no haul scheduled — drop a card to assign" placeholder (italic, `--text-3`, 11px, vertically centered at left:14).
**Acceptance criteria:** Visible when lane has zero cards.
**Dependencies:** SPEC-073

## SPEC-146: Empty state — empty Terminal section

**Where in spec:** prototype/concept-haul-views.jsx L315–317
**Category:** empty-state | view-terminal
**Description:** `│ // empty` (italic, `--text-3`, paddingLeft 4) shown when section has zero items.
**Acceptance criteria:** Visible per empty column.
**Dependencies:** SPEC-078

## SPEC-147: Error state — card update failed

**Where in spec:** PARITY_CHECKLIST.md L536
**Category:** error-state
**Description:** Toast error + revert optimistic UI when card mutation fails.
**Acceptance criteria:** UI rolls back to pre-mutation state; toast surfaces server error.
**Dependencies:** none

## SPEC-148: Error state — proposal execution failure (mid-transaction)

**Where in spec:** PARITY_CHECKLIST.md L537; BACKEND_GAPS.md L224
**Category:** error-state | rail-plans
**Description:** Toast error + don't mark approved. Server returns proposal with `status="failed"` and `execution_error` message.
**Acceptance criteria:** Status reverts to pending or shows failed state; user can retry.
**Dependencies:** SPEC-047

## SPEC-149: Error state — WebSocket disconnect

**Where in spec:** PARITY_CHECKLIST.md L538
**Category:** error-state | presence
**Description:** "Reconnecting..." indicator next to presence cluster when WS disconnects.
**Acceptance criteria:** Shown on close event; cleared on reconnect.
**Dependencies:** SPEC-042

## SPEC-150: Error state — stale agent telemetry

**Where in spec:** PARITY_CHECKLIST.md L539
**Category:** error-state | rail-console
**Description:** Grey out the live green dot when agent telemetry is stale (>30s since last update).
**Acceptance criteria:** Detect via `Date.now() - last_act > 30000`; render dot in `--text-3` instead of green.
**Dependencies:** SPEC-014, SPEC-037

## SPEC-151: Accessibility — buttons not divs

**Where in spec:** PARITY_CHECKLIST.md L518
**Category:** accessibility
**Description:** All interactive elements are `<button>` (not `<div>`).
**Acceptance criteria:** Audit confirms all click targets are buttons.
**Dependencies:** none

## SPEC-152: Accessibility — tab order

**Where in spec:** PARITY_CHECKLIST.md L519
**Category:** accessibility
**Description:** Tab order is sensible — follows visual reading order.
**Acceptance criteria:** Tab cycles through sidebar → top bar → filter row → view content → rail.
**Dependencies:** none

## SPEC-153: Accessibility — aria-label on icon-only buttons

**Where in spec:** PARITY_CHECKLIST.md L520
**Category:** accessibility
**Description:** Icon-only buttons get `aria-label` describing the action.
**Acceptance criteria:** Column +/... buttons, expand chevrons, etc., all labelled.
**Dependencies:** none

## SPEC-154: Accessibility — aria-current on active sidebar item

**Where in spec:** PARITY_CHECKLIST.md L521
**Category:** accessibility
**Description:** Active board row has `aria-current="page"` (or similar).
**Acceptance criteria:** Screen reader announces current board.
**Dependencies:** SPEC-054

## SPEC-155: Accessibility — aria-expanded on collapsible rows

**Where in spec:** PARITY_CHECKLIST.md L522
**Category:** accessibility
**Description:** PresenceRow + PlanCard expanders carry `aria-expanded`.
**Acceptance criteria:** Toggles true/false on expansion.
**Dependencies:** SPEC-088, SPEC-098

## SPEC-156: Accessibility — focus visible on all controls

**Where in spec:** PARITY_CHECKLIST.md L523
**Category:** accessibility
**Description:** All controls show visible focus ring (`:focus-visible`).
**Acceptance criteria:** Tab traversal shows obvious focus state.
**Dependencies:** none

## SPEC-157: Accessibility — screen reader announcement on card open

**Where in spec:** PARITY_CHECKLIST.md L524
**Category:** accessibility
**Description:** When card detail opens, screen reader announces it (e.g. via aria-live region or focus management).
**Acceptance criteria:** SR test confirms announcement.
**Dependencies:** SPEC-101

## SPEC-158: Send local presence on board open

**Where in spec:** PARITY_CHECKLIST.md L473
**Category:** presence
**Description:** When user opens board, publish `{userId, action: "viewing", card: selected, at: now}`.
**Acceptance criteria:** Single update on mount.
**Dependencies:** SPEC-042

## SPEC-159: Update presence on card selection change

**Where in spec:** PARITY_CHECKLIST.md L474
**Category:** presence
**Description:** When `selected` changes, update presence with new card_id.
**Acceptance criteria:** Each card switch sends update.
**Dependencies:** SPEC-042

## SPEC-160: Update presence on edit (focus into input)

**Where in spec:** PARITY_CHECKLIST.md L475
**Category:** presence
**Description:** When user types in card detail (focus into input), update action to `"editing"`.
**Acceptance criteria:** Reset to "viewing" on blur.
**Dependencies:** SPEC-042

## SPEC-161: Throttle presence updates

**Where in spec:** PARITY_CHECKLIST.md L476
**Category:** presence
**Description:** Throttle presence updates to ~1/sec.
**Acceptance criteria:** No spammy writes during rapid typing.
**Dependencies:** SPEC-042

## SPEC-162: Card schema extension — `progress`

**Where in spec:** BACKEND_GAPS.md L280, L310–312
**Category:** data-model | backend-api
**Description:** `progress: number (0..1)`, computed `doneSubtasks/totalSubtasks` or stored denormalised value.
**Acceptance criteria:** Updates on subtask change; surfaces in KanbanCard progress bar and FocusModal.
**Dependencies:** SPEC-036, SPEC-067, SPEC-111

## SPEC-163: Card schema extension — `estimate`

**Where in spec:** BACKEND_GAPS.md L279
**Category:** data-model | backend-api
**Description:** `estimate: number` (story points 0..N).
**Acceptance criteria:** Renders in KanbanCard meta, Timeline width calc (`estimate * 14`), Terminal row, CardDetail.
**Dependencies:** none

## SPEC-164: Card schema extension — `blocked_by`

**Where in spec:** BACKEND_GAPS.md L281
**Category:** data-model | backend-api
**Description:** `blocked_by: string[]` (card ids that block this one).
**Acceptance criteria:** When non-empty, KanbanCard shows red blocked icon.
**Dependencies:** SPEC-066

## SPEC-165: Suggestion data shape — kinds

**Where in spec:** BACKEND_GAPS.md L246; prototype/shared.jsx L186–192
**Category:** data-model
**Description:** Suggestion kinds: promote, split, assign, escalate, archive, link.
**Acceptance criteria:** 6 kinds supported; renderer handles each (prototype only shows text).
**Dependencies:** SPEC-035

## SPEC-166: Helper — `fmtDue`

**Where in spec:** PARITY_CHECKLIST.md L31; prototype/shared.jsx L234–243
**Category:** primitives
**Description:** `fmtDue(timestamp)` → `{txt, overdue, soon}` for relative date display. Rules: `<0d` → "{N}d overdue" + overdue:true; 0 → "today" + soon:true; 1 → "tomorrow" + soon:true; <7 → "{N}d" + soon: (N≤2); else toLocaleDateString {month: "short", day: "numeric"}.
**Acceptance criteria:** Output shape exact.
**Dependencies:** none

## SPEC-167: Helper — `fmtAgo`

**Where in spec:** PARITY_CHECKLIST.md L31; prototype/shared.jsx L245–255
**Category:** primitives
**Description:** `fmtAgo(timestamp)` → "12s", "5m", "3h", "2d". Buckets: <60s→Ns; <60m→Nm; <24h→Nh; else Nd.
**Acceptance criteria:** All 4 unit buckets.
**Dependencies:** none

## SPEC-168: Helper — `positionAfter` / `positionBefore`

**Where in spec:** PARITY_CHECKLIST.md L32; README.md L366
**Category:** primitives
**Description:** Extract from existing `KanbanBoard.tsx`. Compute fractional positions for ordering within a column.
**Acceptance criteria:** Move into `src/lib/positions.ts`; reused across views.
**Dependencies:** none

## SPEC-169: Helper — `pack-rows` (greedy row packing)

**Where in spec:** PARITY_CHECKLIST.md L33; prototype/concept-haul-views.jsx L44–57
**Category:** primitives | view-timeline
**Description:** Greedy row packing for Timeline view. Sort cards by left edge ascending; greedily place each on lowest row with no overlap (tolerance 2px).
**Acceptance criteria:** Returns `{placement: Map<cardId, row>, rowCount}`.
**Dependencies:** SPEC-074

## SPEC-170: Helper — `theme.ts`

**Where in spec:** PARITY_CHECKLIST.md L34
**Category:** primitives | theme
**Description:** Exports `THEMES = { day, mono, paper }` + `applyTheme(name)`.
**Acceptance criteria:** Centralised theme application.
**Dependencies:** SPEC-001/002/003, SPEC-004

## SPEC-171: Zustand store — `boardUIStore`

**Where in spec:** README.md L626–646
**Category:** data-model
**Description:** NEW store for view, theme, console-open, rail-tab, grouping, filterAssignee. Replaces top-level component state from prototype.
**Acceptance criteria:** Persistence layered on top (localStorage + URL).
**Dependencies:** SPEC-129/130/131, SPEC-132/133/134/135

## SPEC-172: Zustand store — `presenceStore`

**Where in spec:** README.md L642
**Category:** data-model | presence
**Description:** NEW store for presence entries; WS-driven.
**Acceptance criteria:** Receives WS messages and updates state.
**Dependencies:** SPEC-031, SPEC-042

## SPEC-173: Zustand store — `activityStore`

**Where in spec:** README.md L643
**Category:** data-model | rail-activity
**Description:** NEW store for activity feed events.
**Acceptance criteria:** Append on poll/broadcast; filter by kind.
**Dependencies:** SPEC-032, SPEC-044

## SPEC-174: Zustand store — `proposalsStore`

**Where in spec:** README.md L644
**Category:** data-model | rail-plans
**Description:** NEW store for proposals queue.
**Acceptance criteria:** CRUD + status updates wired.
**Dependencies:** SPEC-033, SPEC-046

## SPEC-175: Zustand store — `agentTelemetryStore`

**Where in spec:** README.md L645
**Category:** data-model | rail-console
**Description:** NEW store for per-agent live state (polled or streamed).
**Acceptance criteria:** Updated every 3s (poll) or on SSE event.
**Dependencies:** SPEC-037, SPEC-039/040/041

## SPEC-176: Frontend file structure — `src/components/board/`

**Where in spec:** README.md L651–712
**Category:** primitives
**Description:** Proposed structure: split `KanbanBoard.tsx` into `board/Board.tsx`, `BoardSidebar.tsx`, `BoardTopBar.tsx`, `BoardFilterRow.tsx`, `BoardAISuggestionStrip.tsx`, `BoardRightRail.tsx`; subfolders `views/`, `rail/`, `cards/`, `overlays/`, `primitives/`.
**Acceptance criteria:** One file per concern; matches enumerated list in README.
**Dependencies:** none

## SPEC-177: API client extensions — `presence.ts`, `activity.ts`

**Where in spec:** README.md L660–662
**Category:** backend-api
**Description:** NEW: `src/api/presence.ts` (WebSocket/SSE client) and `src/api/activity.ts` (activity feed polling).
**Acceptance criteria:** Encapsulate transport; expose hooks for stores.
**Dependencies:** SPEC-042, SPEC-044

## SPEC-178: Card hover — translateY + shadow upgrade

**Where in spec:** README.md L619; PARITY_CHECKLIST.md L174
**Category:** animation | view-kanban
**Description:** Hover state: shadow upgrade (0 1px 2px rgba(0,0,0,0.08)) + transform translateY(-1px), 120ms transition.
**Acceptance criteria:** Mouse over a card lifts it 1px.
**Dependencies:** SPEC-009, SPEC-065

## SPEC-179: KanbanCard reuse in Dispatch sections (`renderCard` prop)

**Where in spec:** README.md L477, L668–673; PARITY_CHECKLIST.md L174, L395
**Category:** view-kanban | view-dispatch
**Description:** CRITICAL: KanbanCard must work identically in Kanban view and Dispatch view sections. Single component, used in both via `renderCard` prop pattern.
**Acceptance criteria:** Same component, no duplication; styling matches across views.
**Dependencies:** SPEC-065, SPEC-083

## SPEC-180: AI badge on agent-proposed plans

**Where in spec:** README.md L544; PARITY_CHECKLIST.md L308; prototype/concept-haul-rails.jsx L535–542
**Category:** rail-plans
**Description:** Small 11×11 accent pill in bottom-right corner of proposer avatar — only for agent proposers. "AI" text, 8px 800, mono, `--accent-fg` color, 1.5px surface box-shadow ring.
**Acceptance criteria:** Hidden on user proposers.
**Dependencies:** SPEC-098

## SPEC-181: "Hauler" terminology decision

**Where in spec:** README.md L816; PARITY_CHECKLIST.md (implicit)
**Category:** primitives
**Description:** Open product question. Prototype leans into "hauler" as metaphor: lanes = haulers, "Invite people or hauler agents", "Dispatch", "New haul". Decision: keep, soften, or drop entirely.
**Acceptance criteria:** Decision documented; copy updated accordingly throughout.
**Dependencies:** none

## SPEC-182: Open question — Realtime presence transport

**Where in spec:** README.md L810
**Category:** backend-api
**Description:** Open: WebSocket vs polling SSE vs short polling? Affects backend stack choice.
**Acceptance criteria:** Decision documented.
**Dependencies:** SPEC-042/043

## SPEC-183: Open question — Proposal execution mode

**Where in spec:** README.md L811
**Category:** backend-api
**Description:** Open: Server-side transaction (preferred, atomic) or client-side ops chain (cheaper)?
**Acceptance criteria:** Decision documented; spec recommends server-side.
**Dependencies:** SPEC-047

## SPEC-184: Open question — Agent telemetry source

**Where in spec:** README.md L812
**Category:** backend-api
**Description:** Open: Where do `step`, `tok`, transcript come from? Agent runtime must emit events to backend.
**Acceptance criteria:** Wiring documented; hook into existing runtime event stream.
**Dependencies:** SPEC-037

## SPEC-185: Open question — Subtasks storage

**Where in spec:** README.md L813
**Category:** backend-api
**Description:** Open: Separate `subtasks` table (with FK to card_id) or markdown checkboxes in `card.description`? Recommends former for state tracking.
**Acceptance criteria:** Decision documented.
**Dependencies:** SPEC-036

## SPEC-186: Open question — Theme persistence scope

**Where in spec:** README.md L814
**Category:** theme
**Description:** Open: Per-user (server-side) or per-device (localStorage)?
**Acceptance criteria:** Decision documented; localStorage default per spec.
**Dependencies:** SPEC-038

## SPEC-187: Open question — View persistence scope

**Where in spec:** README.md L815
**Category:** url-state
**Description:** Open: Per-board (each remembers last view) or global?
**Acceptance criteria:** Decision documented.
**Dependencies:** SPEC-132

## SPEC-188: Drag-drop library — `@dnd-kit`

**Where in spec:** README.md L365; INDEX.md L69
**Category:** drag-drop
**Description:** Use `@dnd-kit/core` + `@dnd-kit/sortable` (already in package.json). Prototype uses HTML5 native drag for demo purposes.
**Acceptance criteria:** Implementation uses dnd-kit primitives (useDraggable, useDroppable, DndContext).
**Dependencies:** none

## SPEC-189: Card selected state — focus ring

**Where in spec:** README.md L218, L362; prototype/concept-haul.jsx L151
**Category:** view-kanban | view-timeline | view-terminal
**Description:** Selected card outer ring: `0 0 0 3px var(--accent)33` (alpha 0x33 ≈ 20%) via box-shadow + 1px `--accent` border. Timeline variant uses alpha 0x55. Terminal: `--accent-bg` background + 2px left border accent (no ring).
**Acceptance criteria:** Each view's selection treatment matches its variant.
**Dependencies:** SPEC-065, SPEC-075, SPEC-079

## SPEC-190: Sidebar — section gap

**Where in spec:** prototype/concept-haul.jsx L383
**Category:** shell
**Description:** Sidebar uses flex column with gap 16 between sections (workspace switcher, nav, boards, saved views, user chip).
**Acceptance criteria:** 16px between sections.
**Dependencies:** SPEC-052

## SPEC-191: Top bar — overall element ordering

**Where in spec:** README.md L290–299
**Category:** shell
**Description:** Top bar order LTR: breadcrumb (left) — flex spacer — presence cluster — theme switcher (3 swatches) — search (220px) — New Issue button — Console toggle.
**Acceptance criteria:** Exact left-to-right order.
**Dependencies:** SPEC-020/021/022/023/024/025

## SPEC-192: ConsoleRail — agent expanded default

**Where in spec:** prototype/concept-haul-rails.jsx L78
**Category:** rail-console
**Description:** Builder agent (pr6) expanded by default to showcase telemetry + transcript.
**Acceptance criteria:** Prototype-only; real implementation may default to collapsed.
**Dependencies:** SPEC-088

## SPEC-193: PlansRail — first plan expanded default

**Where in spec:** prototype/concept-haul-rails.jsx L463
**Category:** rail-plans
**Description:** First plan (p1) expanded by default.
**Acceptance criteria:** Prototype-only; production likely defaults all collapsed.
**Dependencies:** SPEC-098

## SPEC-194: Filter row — selected grouping default

**Where in spec:** prototype/concept-haul.jsx L264
**Category:** view-kanban
**Description:** Default grouping = `col`. Default view = `kanban`. Default filterAssignee = `all`. Default themeName = `day`. Default consoleOpen = true. Default railTab = `console`.
**Acceptance criteria:** Initial state matches; URL/localStorage can override.
**Dependencies:** SPEC-129/130/131, SPEC-132/133/134

## SPEC-195: TimelineView — lane ordering

**Where in spec:** prototype/concept-haul-views.jsx L61–69
**Category:** view-timeline
**Description:** Lanes ordered: ALL agents first (regardless of card presence), then users with cards (filtered), then unassigned ("none") lane last.
**Acceptance criteria:** Order matches; spec note SCREENSHOTS.md L11 says "5 agents up top, then 5 users with cards, then unassigned".
**Dependencies:** SPEC-070

## SPEC-196: TimelineView — excludes Done column cards

**Where in spec:** prototype/concept-haul-views.jsx L76
**Category:** view-timeline
**Description:** Timeline only shows cards where `col !== "c4"` (Done excluded by default).
**Acceptance criteria:** Done cards filtered out at lane composition.
**Dependencies:** SPEC-072

## SPEC-197: Theme — Mono variant of AgentChip

**Where in spec:** README.md L257; prototype/shared.jsx L286
**Category:** primitives | theme
**Description:** Mono theme uses "terminal" AgentChip variant: bg #facc15, fg #1c1917 (used in Convoy/Timeline lanes per README L257).
**Acceptance criteria:** When theme=Mono and in Timeline context, AgentChip variant switches.
**Dependencies:** SPEC-012, SPEC-002

## SPEC-198: Card filter — Mine

**Where in spec:** prototype/concept-haul.jsx L298
**Category:** view-kanban
**Description:** `filterAssignee === "mine"` filters cards to `c.assignee?.user === 1` (current user id 1 = Mira). In production, current user id from auth store.
**Acceptance criteria:** Cards filtered by current user assignee.
**Dependencies:** SPEC-059

## SPEC-199: Card filter — Agents

**Where in spec:** prototype/concept-haul.jsx L297
**Category:** view-kanban
**Description:** `filterAssignee === "agents"` filters cards to `c.assignee?.agent` truthy.
**Acceptance criteria:** Cards filtered to agent assignees only.
**Dependencies:** SPEC-059

## SPEC-200: Phase-8 stubbing strategy

**Where in spec:** PARITY_CHECKLIST.md L544–554
**Category:** backend-api
**Description:** Phase 8 backend items can be stubbed with mocked data initially: Presence WS/SSE; Activity feed; Proposals CRUD + execute; Agent telemetry; Subtasks; Card extensions (progress/estimate/blocked_by); AI suggestions.
**Acceptance criteria:** Each can be incrementally replaced with real endpoint without changing UI.
**Dependencies:** SPEC-039–050, SPEC-162/163/164

## SPEC-201: Avatar tooltip behaviour

**Where in spec:** README.md L294; prototype/concept-haul.jsx L176
**Category:** presence | accessibility
**Description:** Hover top-bar presence cluster and card-level cluster → tooltip listing names + actions. KanbanCard inline title: `"{N} {person|people} here · {names joined}"`.
**Acceptance criteria:** Tooltip via title attr or richer popover.
**Dependencies:** SPEC-016

## SPEC-202: KanbanCard — compact mode

**Where in spec:** prototype/concept-haul.jsx L137, L222–249
**Category:** view-kanban
**Description:** `compact` prop: when true, title clamps to 1 line and meta row is hidden. Used in dense contexts.
**Acceptance criteria:** Compact card hides epic/estimate/due meta row.
**Dependencies:** SPEC-065

## SPEC-203: Drag cursor — grab

**Where in spec:** prototype/concept-haul-views.jsx L254
**Category:** drag-drop
**Description:** Draggable cards use `cursor: grab` (TimelineBar explicit). KanbanCard uses `cursor: pointer` per prototype; could be enhanced to grab during drag.
**Acceptance criteria:** Grab cursor at minimum on Timeline.
**Dependencies:** none

## SPEC-204: Mock TRANSCRIPTS data

**Where in spec:** prototype/shared.jsx L23–41
**Category:** mock-data
**Description:** Per-agent transcript arrays. Mocks: builder (5 lines), scout (4 lines), watchdog (2 lines). Used as fallback when real telemetry absent.
**Acceptance criteria:** Real backend should provide via `/api/agents/:name/transcript`.
**Dependencies:** SPEC-037

## SPEC-205: Mock data — 15 cards across 4 columns

**Where in spec:** prototype/shared.jsx L66–89
**Category:** mock-data
**Description:** 15 cards: 5 Backlog, 4 In Progress, 3 In Review, 3 Done. Mix of types (task/bug), priorities, assignees (users + agents + unassigned), with realistic estimates, due dates, comment counts.
**Acceptance criteria:** Same distribution available as fixture data.
**Dependencies:** SPEC-030

## SPEC-206: Mock data — 14 activity events

**Where in spec:** prototype/shared.jsx L92–107
**Category:** mock-data
**Description:** 14 ACTIVITY entries spanning all 6 kinds (agent, comment, move, assign, create, ship) at varying times for bucket testing.
**Acceptance criteria:** Drives Activity tab badge default (14).
**Dependencies:** SPEC-032

## SPEC-207: Mock data — 5 proposals

**Where in spec:** prototype/shared.jsx L111–183
**Category:** mock-data
**Description:** 5 PROPOSALS covering all action kinds in mixed statuses: p1 pending (4 actions, 0.82 conf, agent triage), p2 pending (3 moves, user), p3 pending (split, 0.71 conf, agent builder), p4 approved (ping+label, 0.95 conf, agent watchdog), p5 rejected (archive, user proposer).
**Acceptance criteria:** Full status coverage.
**Dependencies:** SPEC-033, SPEC-034

## SPEC-208: Mock data — 10 presence entries

**Where in spec:** prototype/shared.jsx L198–209
**Category:** mock-data
**Description:** 10 PRESENCE entries: 5 users (mixed actions) + 5 agents (mixed status). Drives default top-bar cluster and Console rail content.
**Acceptance criteria:** Diverse action mix for testing dot colors.
**Dependencies:** SPEC-031

## SPEC-209: Mock data — NOW timestamp

**Where in spec:** prototype/shared.jsx L4–5
**Category:** mock-data
**Description:** `NOW = Date.UTC(2026, 4, 18, 14, 30)` (May 18 2026 14:30 UTC). `D(days, hours=0) = NOW + days*86400000 + hours*3600000`.
**Acceptance criteria:** Mock-only; production uses real timestamps.
**Dependencies:** none

## SPEC-210: presenceOnCard helper

**Where in spec:** prototype/shared.jsx L211–213
**Category:** primitives | presence
**Description:** `presenceOnCard(cardId)` returns presence entries with `p.card === cardId && p.action !== "idle"`.
**Acceptance criteria:** Used by KanbanCard to render avatar cluster.
**Dependencies:** SPEC-031
