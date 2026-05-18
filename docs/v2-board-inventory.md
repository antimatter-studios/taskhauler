# Task Hauler Board Inventory — Canonical (99 cards)

Source: `GET /api/v1/boards/aa4c87b6-bde7-4394-9db5-f59325e3aca0/*` on 2026-05-18.
Board prefix is "TH"; cards numbered TH-1 to TH-99.

## Summary

- **Total cards:** 99
- **By column:** Backlog 33 / In Progress 6 / Review 0 / Done 60
- **By epic:**
  - Platform / Infrastructure: 8 cards (Done 5 / In Progress 0 / Backlog 3 / Review 0)
  - Backend (Go service): 12 cards (Done 12 / In Progress 0 / Backlog 0 / Review 0)
  - Frontend v1 (legacy): 4 cards (Done 4 / In Progress 0 / Backlog 0 / Review 0)
  - v2: Phase 0 — Foundations: 16 cards (Done 16 / In Progress 0 / Backlog 0 / Review 0)
  - v2: Phase 1 — Board Shell: 6 cards (Done 6 / In Progress 0 / Backlog 0 / Review 0)
  - v2: Phase 2 — Kanban view: 3 cards (Done 3 / In Progress 0 / Backlog 0 / Review 0)
  - v2: Phase 3 — Right rail: 4 cards (Done 1 / In Progress 3 / Backlog 0 / Review 0)
  - v2: Phase 4 — Other views: 7 cards (Done 7 / In Progress 0 / Backlog 0 / Review 0)
  - v2: Phase 5 — Focus modal: 3 cards (Done 2 / In Progress 1 / Backlog 0 / Review 0)
  - v2: Phase 6 — Presence: 3 cards (Done 0 / In Progress 2 / Backlog 1 / Review 0)
  - v2: Phase 7 — Polish: 8 cards (Done 3 / In Progress 0 / Backlog 5 / Review 0)
  - Backend additions for v2 parity: 11 cards (Done 0 / In Progress 0 / Backlog 11 / Review 0)
  - Identity / Auth (ZITADEL roadmap): 6 cards (Done 0 / In Progress 0 / Backlog 6 / Review 0)
  - Marketing website: 2 cards (Done 1 / In Progress 0 / Backlog 1 / Review 0)
  - Future integrations: 6 cards (Done 0 / In Progress 0 / Backlog 6 / Review 0)
- **By label (top 15):**
  - frontend-v2 — 50 cards
  - backend-v1 — 28 cards
  - backend-gap — 11 cards
  - views — 10 cards
  - auth — 9 cards
  - primitives — 8 cards
  - polish — 8 cards
  - shell — 6 cards
  - mocked — 6 cards
  - integration — 6 cards
  - rail — 5 cards
  - presence — 5 cards
  - infra — 5 cards
  - agents — 5 cards
  - lib — 4 cards
- **By priority:** urgent 0 / high 14 / medium 60 / low 25 / none 0
- **Cards with assignee_agent set:** 23
  - @backend-builder (21): TH-47, TH-48, TH-49, TH-59, TH-60, TH-61, TH-62, TH-71, TH-72, TH-73, TH-74, TH-75, TH-76, TH-77, TH-78, TH-79, TH-80, TH-81, TH-82, TH-83, TH-84
  - @triage-agent (1): TH-94
  - @dispatch-agent (1): TH-95
- **Cards with comments:** 0 (none of the 99 cards have any comments yet)
- **Bug cards:** 1
  - TH-20 — Board.Prefix collision fix + name-derived prefix
- **Cards with empty descriptions:** 0 (all 99 have descriptions)

---

## Epic: Platform / Infrastructure (8 cards)

### TH-1: Extract task tracker from teamagentica into standalone repo

- **Card ID:** f900da58-c97b-44c4-bb7e-785ab7e4cb78
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** monorepo, extraction
- **Assignee agent:** (none)
- **Description (full):**
  The TA tool-task-tracker plugin was tightly coupled to the agent platform. The product value of a kanban tool exceeded that of an embedded component, so it was extracted into its own deployable. The new repo lives at https://github.com/antimatter-studios/taskhauler and is organised as a monorepo (backend-v1/, frontend/, frontend-v2/, website/) under Antimatter Studios.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** The historical extraction of the TA tool-task-tracker plugin into a standalone monorepo under Antimatter Studios — establishes the repo layout (backend-v1/, frontend/, frontend-v2/, website/).

### TH-2: Adopt version-per-service deployment pattern

- **Card ID:** 39b26d0c-3507-4572-b562-bc8c73e93501
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** version-per-service, architecture
- **Assignee agent:** (none)
- **Description (full):**
  Each API version is its own deployable: backend-v1/ now, future backend-v2/ alongside. The DDT proxy routes /api/v1 → taskhauler-backend-v1 and would route /api/v2 → taskhauler-backend-v2. Frontend follows the same: frontend/, frontend-v2/. This means versions can diverge in stack, schema, and roadmap without touching each other.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** The architecture decision that each API/UI version is its own deployable, so backends and frontends can diverge without coupling.

### TH-3: DDT reverse-proxy routing for *.localhost

- **Card ID:** edb2924a-f2f2-4dc0-bd7f-0419b0275d2b
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** ddt, routing
- **Assignee agent:** (none)
- **Description (full):**
  All services register with the DDT proxy via docker-proxy.<name>.host/.port/.path labels (the TA pattern). Routes: taskhauler.localhost (frontend v1), taskhauler-v2.localhost (frontend v2), taskhauler.localhost/api/v1 (backend), marketing.taskhauler.localhost (website). DDT proxy + DNS started by 'ddt start'.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Local-dev domain routing through the DDT reverse proxy, mapping *.localhost hostnames to each container.

### TH-4: Root Taskfile orchestrating raw docker run (no compose)

- **Card ID:** 947de963-e033-47cd-9a77-cc8b8c7e59cc
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** taskfile, orchestration
- **Assignee agent:** (none)
- **Description (full):**
  Taskfile.yml drives the whole stack via 'docker run' commands rather than docker-compose. Tasks cover dev (HMR for both Go via air and React via vite), prod (compiled binary / nginx), db:up/down/reset, import, openapi:gen, ps, urls, logs. Bundles: 'task dev', 'task prod', 'task down'.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Replacing docker-compose with a Taskfile-driven raw `docker run` orchestration covering dev / prod / db / import / openapi commands.

### TH-5: Docker Desktop compose-style grouping via labels

- **Card ID:** e1cce54d-6276-4af2-9ed9-28ac84ea3316
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** docker, labels
- **Assignee agent:** (none)
- **Description (full):**
  Every container has com.docker.compose.project=taskhauler + com.docker.compose.service=<name> labels so Docker Desktop groups them under one folder, same UX as docker-compose without actually using it.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Applying compose-style container labels so Docker Desktop groups all taskhauler containers visually, without using docker-compose itself.

### TH-6: Production deployment to taskhauler.antimatter-studios.com

- **Card ID:** dd74ebb8-c4e0-4753-b14b-99d889612529
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** infra, deployment
- **Assignee agent:** (none)
- **Description (full):**
  App goes live at taskhauler.antimatter-studios.com (single subdomain) once a target host is picked. Need to: (1) provision a VM / managed container service, (2) configure TLS via Caddy/Traefik or Let's Encrypt, (3) wire DNS, (4) ship a Postgres instance + backup strategy, (5) decide on log aggregation, (6) decide on observability (metrics/traces).
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Standing up Task Hauler in production at a single subdomain — host, TLS, DNS, DB, logs, observability.

### TH-7: CI/CD pipeline

- **Card ID:** e4c5488c-16e7-4b7d-b305-9b45abbd4c40
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** infra, ci
- **Assignee agent:** (none)
- **Description (full):**
  No GitHub Actions yet. Should at minimum: run 'go build ./...' on backend, 'npm run build' on frontend/v2/website, and tag-driven container builds pushed to GHCR. Deploy on merge to main.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Adding a CI/CD pipeline (GitHub Actions) that builds backend + frontends, publishes images to GHCR, and deploys on merge.

### TH-8: Postgres backup strategy

- **Card ID:** cbb4536a-06d1-446c-8473-e0f552f1856d
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** infra, backups
- **Assignee agent:** (none)
- **Description (full):**
  Currently the taskhauler-pgdata volume is local-only. Pre-prod: pg_dump on schedule to S3/GCS, restore drill. Post-prod: managed Postgres with PITR or matching cron in the host.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Designing pre- and post-prod backup/restore strategy for the Postgres data volume.

---

## Epic: Backend (Go service) (12 cards)

### TH-9: Postgres storage layer (GORM models for Board/Column/Epic/Card/Comment)

- **Card ID:** 66b5d3ee-6057-4623-8ac1-04ebe576e873
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, postgres, gorm
- **Assignee agent:** (none)
- **Description (full):**
  Replaces the original SQLite-via-pluginsdk layer. AutoMigrate runs on startup. Per-board sequential card numbers via backfillCardNumbers. Soft deletes via gorm.DeletedAt across all entities. Schema preserved from the TA plugin (same field names + JSON shape) so existing data imports cleanly.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** The GORM/Postgres persistence layer with AutoMigrate, soft deletes, and per-board sequential card numbers — replacing the original SQLite-via-pluginsdk store.

### TH-10: JWT auth (login / refresh / me) with bcrypt passwords

- **Card ID:** 1d615b82-b297-403d-b565-f06b2bd71bba
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, jwt, auth
- **Assignee agent:** (none)
- **Description (full):**
  POST /auth/login → access (1h) + refresh (30d) tokens. POST /auth/refresh exchanges a refresh token for a new access token. GET /auth/me returns the authed user. Passwords are bcrypt cost 12 (matches TA's hashing so imported users keep their existing creds). JWT secret from JWT_SECRET env var (required).
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** The local JWT auth flow (login / refresh / me) with bcrypt password hashing matching TA's existing scheme.

### TH-11: Service-account token system (tha_<hex>)

- **Card ID:** 4a5b761c-d4dd-44c6-8cf9-38de73e30d37
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, auth, service-accounts
- **Assignee agent:** (none)
- **Description (full):**
  Long-lived bearer tokens for non-interactive callers (other apps, agents, CI). Admin-only management under /service-accounts/*. Tokens are opaque random strings prefixed 'tha_'; hashed with sha256 in the DB. Same Authorization: Bearer header as JWT — middleware detects the prefix and routes to the right validation path.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** Long-lived `tha_<hex>` service-account bearer tokens for agents / CI / non-interactive callers, alongside JWT.

### TH-12: REST API: full CRUD under /api/v1 for boards, columns, epics, cards, comments

- **Card ID:** 4b901272-5871-4787-bd46-524eed46aa8a
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, rest, api
- **Assignee agent:** (none)
- **Description (full):**
  Gin router under router.Group("/api/v1"). Mirrors the TA plugin's surface: list/create/get/update/delete on every entity, plus search (LIKE on title/description/labels) and lookup-by-number for cards. Response shapes include enriched fields like assignee_name and status_name resolved on the server.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** The full CRUD REST surface under /api/v1 for boards/columns/epics/cards/comments, including search and lookup-by-number, with server-resolved enrichment fields.

### TH-13: MCP tool endpoints (15 tools mirroring REST)

- **Card ID:** 7f9bf130-68f8-4ebe-b71e-0dcb3dab02dd
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, mcp
- **Assignee agent:** (none)
- **Description (full):**
  POST /mcp/{list,create,update,delete}_board, ..._epic, ..._task, plus set_task_state, search_tasks, add_comment, list_tasks_by_status. Each accepts a JSON request body matching the tool schema. Tool definitions exposed at GET /mcp for discovery by MCP clients.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** A set of 15 HTTP MCP tool endpoints under /mcp that mirror the REST surface for use by MCP clients.

### TH-14: OpenAPI 3.0 spec generated from Go source (go-oapifly)

- **Card ID:** c706cd86-a3cd-45a5-979e-6b5989915cf3
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, openapi
- **Assignee agent:** (none)
- **Description (full):**
  Uses github.com/antimatter-studios/go-oapifly to scan handlers + struct tags and produce openapi.json at build time. Available at runtime via GET /api/v1/openapi.json, and committed to backend-v1/openapi.json. 37 paths, 95 schemas covered. Means no hand-maintained spec drift.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Auto-generation of OpenAPI 3.0 spec from Go handler/struct annotations using go-oapifly, served at /api/v1/openapi.json.

### TH-15: SQLite → Postgres importer for TA task-tracker data

- **Card ID:** fb522851-7751-4a6b-b634-b51e848eb0c4
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, importer, migration
- **Assignee agent:** (none)
- **Description (full):**
  One-shot CLI at cmd/import-sqlite. Opens TA's tasks.db read-only (mode=ro URI), reads boards/columns/epics/cards/comments via GORM, UPSERT into Postgres with ON CONFLICT DO NOTHING (idempotent). Preserves IDs, soft-deletes, and the per-board card numbers. Source counts: 6 boards / 28 columns / 17 epics / 311 cards / 165 comments — all imported successfully.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** A one-shot CLI that idempotently UPSERTs TA's SQLite task-tracker data into the new Postgres schema, preserving IDs and per-board card numbers.

### TH-16: SQLite → Postgres importer for TA user accounts

- **Card ID:** 5030a1c6-6ac8-4d93-83db-8cca4b5e316b
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, importer, users
- **Assignee agent:** (none)
- **Description (full):**
  Second one-shot CLI at cmd/import-users. Reads from TA's system-user-manager users.db read-only. Preserves IDs (so cards.assignee_id and comments.author_id stay valid post-import). bcrypt-compatible — passwords transfer as-is. Maps TA.role='admin' → TH.is_admin. Skips banned users by default. Bumps users_id_seq after insert to avoid future autoincrement collisions.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** A second one-shot importer CLI that brings TA user accounts (including bcrypt password hashes) into the new Postgres users table, preserving IDs.

### TH-17: Internal event emitter (task-tracking:assign / :comment)

- **Card ID:** a344c767-5103-473d-8a05-049e092bbf4b
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, events
- **Assignee agent:** (none)
- **Description (full):**
  Stub events.EventEmitter that logs to stdout when cards get assigned or comments are added. Drop-in replacement for the TA-side pluginsdk event bus. Same emit points kept on CreateCard / UpdateCard / CreateComment so future consumers (notifications, agent triggers, activity feed) can subscribe without touching the handlers.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** A stub EventEmitter wired into card-create/update and comment-create paths, replacing the TA pluginsdk event bus and reserving hook points for future consumers.

### TH-18: Multi-stage Dockerfile (builder / dev / prod)

- **Card ID:** 7d0b4d5f-0077-48cd-a79c-d8d8856d5afd
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, docker, dockerfile
- **Assignee agent:** (none)
- **Description (full):**
  builder stage: go build of three binaries (taskhauler-backend, taskhauler-import-sqlite, taskhauler-import-users); static-linked CGO for SQLite ones. dev stage: golang:1.26-alpine + air for hot reload (binds source at runtime via Taskfile mount). prod stage: alpine:3.19 with ca-certificates, non-root user, all three binaries in /usr/local/bin/.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** The multi-stage backend Dockerfile that produces three Go binaries and supplies builder/dev/prod stages for development and deployment.

### TH-19: CORS support for cross-origin frontend access

- **Card ID:** 4317e748-84ae-4b47-a84a-666febb9ce54
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, cors
- **Assignee agent:** (none)
- **Description (full):**
  gin-contrib/cors middleware reads CORS_ALLOWED_ORIGINS env (comma-separated). Currently lets taskhauler.localhost, taskhauler-v2.localhost, and localhost:3000 in. Required since v2 frontend lives at a different origin than the API.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** CORS middleware on the backend (env-driven allow-list) so the cross-origin v2 frontend can call /api/v1.

### TH-20: Board.Prefix collision fix + name-derived prefix

- **Card ID:** 6a2edd20-c831-4ffa-b55a-21e3fc5b5b03
- **Column:** Done
- **Priority:** medium
- **Type:** bug
- **Labels:** backend-v1, prefix
- **Assignee agent:** (none)
- **Description (full):**
  Original schema had Prefix string with uniqueIndex; the second board ever created without a prefix would hit a 500 because '' collides with itself. Two changes: (1) replace the all-rows unique index with a partial index 'WHERE prefix <> '' AND deleted_at IS NULL', (2) auto-derive a prefix from the board name when none provided ('Infrastructure Platform' → IP, 'Roadmap' → ROAD), with collision-suffix logic ('Bugs and Issues' twice → BI, BI2).
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** The fix for the Board.Prefix unique-index collision (500 on second prefix-less board) and the introduction of auto-derived prefixes from board names.

---

## Epic: v2: Phase 0 — Foundations (16 cards)

### TH-21: Theme system: Day / Mono / Paper via CSS custom properties

- **Card ID:** eb0045e5-ac2f-409c-bb0a-b5e669c1bdc5
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, theme
- **Assignee agent:** (none)
- **Description (full):**
  Three palettes scoped under :root[data-theme="day|mono|paper"] in src/index.css. The active theme is set on <html> at boot from localStorage (key taskhauler.theme), defaulting to 'day' on first visit. Switching swaps the entire chrome including fonts (Mono uses JetBrains Mono throughout). Token names: --bg, --surface, --hover, --border, --border-hi, --text, --text-2, --text-3, --accent, --accent-bg, --accent-fg, --red, --amber, --green, --radius.
- **Comments (if any):** (none)
- **Suggested category mapping:** theme
- **What this card claims to track:** The three-theme (Day/Mono/Paper) CSS custom-property palette system, applied on <html> from localStorage at boot.

### TH-22: Font loading: Inter, JetBrains Mono, Geist Mono

- **Card ID:** f7d42fe7-eb63-4484-b2e2-47ae5193957f
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, theme, fonts
- **Assignee agent:** (none)
- **Description (full):**
  <link> tags in index.html load all three from Google Fonts with display=swap. Weights: Inter 400/500/600/700, JetBrains Mono 400/500/700, Geist Mono 400/500/700. Picked per theme via --font-sans / --font-mono CSS variables.
- **Comments (if any):** (none)
- **Suggested category mapping:** theme
- **What this card claims to track:** Loading the three webfonts (Inter / JetBrains Mono / Geist Mono) used by the theme system from Google Fonts via index.html link tags.

### TH-23: Lib: time helpers (fmtDue / fmtAgo / fmtDate)

- **Card ID:** 22f262c8-1930-435f-8f32-5a78579fe984
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, lib
- **Assignee agent:** (none)
- **Description (full):**
  src/lib/time.ts. fmtDue(ts) returns {txt, overdue, soon} — used by KanbanCard, TimelineBar, CardDetail. fmtAgo(ts) returns short relative (12s, 5m, 3h, 2d) — used by Activity rows, presence rows, proposal timestamps. fmtDate(ts) returns absolute date for tooltips and meta strips.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The shared time-formatting helpers (fmtDue/fmtAgo/fmtDate) consumed by cards, timelines, activity rows, and tooltips.

### TH-24: Lib: position helpers (positionAfter / positionBefore)

- **Card ID:** 7216928a-5e38-4c55-87ae-fc68a02b99a0
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, lib, drag-drop
- **Assignee agent:** (none)
- **Description (full):**
  src/lib/positions.ts. Fractional positioning for drag-drop ordering. Returns sensible values for empty/before-first/after-last/between cases (1000-spaced with halving). Used by all 3 drag-enabled views to compute the new position on drop without renumbering everything.
- **Comments (if any):** (none)
- **Suggested category mapping:** drag-drop
- **What this card claims to track:** The fractional-position helpers (positionAfter/positionBefore) used by drag-drop reorder logic across all three drag-enabled views.

### TH-25: Lib: pack-rows greedy row packer (for Timeline)

- **Card ID:** fdb66731-3c59-444d-948b-f3e5a0a96be2
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, lib, timeline
- **Assignee agent:** (none)
- **Description (full):**
  src/lib/pack-rows.ts. Given an array of {x, width} items, returns row indices (0-based) so no two items on the same row overlap. Sort by x ascending; for each item find lowest row where previous occupant's right edge ≤ this.x. Used by TimelineView to lay out cards within a lane without manual collision math.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-timeline
- **What this card claims to track:** The greedy row-packing helper used by TimelineView to lay out bars in lanes without overlap.

### TH-26: Lib: theme helpers (applyTheme / getStoredTheme / persistTheme)

- **Card ID:** 340241d2-6685-4245-bb71-3809925df7e0
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, lib, theme
- **Assignee agent:** (none)
- **Description (full):**
  src/lib/theme.ts. applyTheme(name) sets data-theme on <html>. getStoredTheme reads localStorage (key taskhauler.theme), defaults to 'day'. persistTheme writes localStorage. THEMES is exported as ThemeName[] = ['day','mono','paper']. Called from Board.tsx on mount before any UI paints, to avoid flash of wrong theme.
- **Comments (if any):** (none)
- **Suggested category mapping:** theme
- **What this card claims to track:** The theme-state helpers (applyTheme/getStoredTheme/persistTheme + THEMES) that read/write the theme from localStorage and avoid flash-of-wrong-theme.

### TH-27: Primitive: UserChip (circular hue-based avatar)

- **Card ID:** 33dae2cc-035e-45b0-803c-1b4049967715
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Circular avatar with oklch-derived bg/fg using the user's hue (or a deterministic hash from display_name if hue missing). 2-letter initials in the centre. Configurable size (default 22). Used everywhere humans appear: sidebar, top bar, card chrome, comments, activity rows.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The circular hue-coloured user-avatar primitive (initials inside, oklch-derived colours) used everywhere humans appear.

### TH-28: Primitive: AgentChip (hexagonal monospace tile)

- **Card ID:** 5ec45c49-4d94-441d-a9fd-b9f623555029
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Hex-clipped via clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%). Variants: default (#0f172a bg, cyan fg, cyan glow), terminal (amber bg). Cyan ring + glow when working. Single uppercase letter, mono font. Visually distinct from human circles at a glance — central design choice of the v2 redesign.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The hexagonal monospace agent-avatar primitive (with working-state cyan ring/glow) that visually separates agents from humans — the central v2 design choice.

### TH-29: Primitive: AssigneeChip (dispatches to UserChip or AgentChip)

- **Card ID:** 2d815adb-e200-44eb-9482-01f0b6d49e52
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Takes userId or agentName, looks up MOCK_USERS / MOCK_AGENTS, renders the right chip. Supports a 'working' prop that overlays a pulsing green dot. Renders a dashed '?' when neither id is supplied. Used wherever a card or activity row needs to show 'who's assigned'.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The AssigneeChip dispatcher that resolves a userId/agentName to the right chip (UserChip / AgentChip) with an optional working overlay.

### TH-30: Primitive: PresenceDot (pulsing action-color dot)

- **Card ID:** e10f4a44-8568-4d24-b285-bdc4a921b659
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, primitives, presence
- **Assignee agent:** (none)
- **Description (full):**
  8px circle, absolute positioned bottom-right of parent, with a 1.5px box-shadow ring in --surface for lift. Pulse animation when active (1.6s ease-in-out infinite, opacity 1→0.6, scale 1→1.4). Colors by action: viewing=accent, editing/commenting=amber, working=green.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The pulsing PresenceDot primitive (8px, action-coloured) overlaid on avatars to indicate viewing/editing/working.

### TH-31: Primitive: PresenceCluster (overlapping avatars + +N + label)

- **Card ID:** b073825c-dc8c-4600-a71e-978171a2e37a
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, primitives, presence
- **Assignee agent:** (none)
- **Description (full):**
  Renders first maxShown (default 5) entries with -7px margin overlap. Each avatar has its action-color PresenceDot. Shows '+N' overflow if more, then 'X active' label. Hover tooltips list full names + current actions.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The PresenceCluster primitive — overlapping avatars with +N overflow and an "X active" label — used in the top bar and on cards.

### TH-32: Primitive: PriorityIndicator (3-bar / urgent square)

- **Card ID:** 0d8202fe-cc1a-4e74-a7d7-fd7900c56171
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Low / Medium / High shown as 1/2/3 bars gradiated from --text-3 to --amber. Urgent shown as a solid 8×8 red square. Empty / no priority returns null so callers don't reserve width.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The PriorityIndicator primitive — 1/2/3 amber bars or a red square for urgent — used on KanbanCard / TerminalRow / FocusModal.

### TH-33: Primitive: EpicChip (color dot + name pill)

- **Card ID:** d3fe6755-2794-4e2c-854c-1233b35a15a8
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Color dot in epic.color + short name in a pill. Uses color-mix() for tinted bg so the same component looks like a filled pill on Day/Paper themes and a colored-border outlined chip on Mono — no theme-name prop needed.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The EpicChip primitive (epic.color dot + name pill, theme-adaptive via color-mix()).

### TH-34: Primitive: KeyHint (kbd label)

- **Card ID:** 7ca3d84b-b4fe-4130-b6bc-e903725e61b5
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, primitives
- **Assignee agent:** (none)
- **Description (full):**
  Small mono-font keyboard hint with subtle border + bg from theme vars. Used in TopBar (C, ⌘K), CardDetailPanel (F), FocusModal (Esc).
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The KeyHint primitive — small `<kbd>`-style keyboard label — used in TopBar, CardDetail, FocusModal.

### TH-35: Mock data: users, agents, presence, telemetry, transcripts, activity, proposals, suggestions, subtasks, inbox

- **Card ID:** 772c7616-38c8-47f1-95a3-25a32b1d76ad
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, mocks
- **Assignee agent:** (none)
- **Description (full):**
  11 files under src/mock/, one per future API endpoint. Each ships with a comment pointing at what real call will replace it. The strategy doc docs/frontend-v2-status.md frames this as 'UI is 100% fidelity now, mocks get swapped for live API as endpoints land — no UI changes needed at that swap.' This is the contract that keeps v2 → v2-with-live-data smooth.
- **Comments (if any):** (none)
- **Suggested category mapping:** primitives
- **What this card claims to track:** The src/mock/ contract — 11 mock-data files (one per future API endpoint) that the UI consumes today so the eventual mocks-to-live-API swap requires no UI changes.

### TH-36: boardUIStore (Zustand) — view/grouping/filter/selection/console/rail/search

- **Card ID:** b71b82e6-9a73-41bb-936d-c6550827ddbe
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, state
- **Assignee agent:** (none)
- **Description (full):**
  src/stores/boardUIStore.ts. State: view (kanban|timeline|terminal|dispatch), grouping (col|priority|epic|assignee|due), filterAssignee (all|mine|agents), consoleOpen (bool), railTab (console|activity|plans), selectedCardId, focusedCardId, searchQuery. Persists consoleOpen + railTab to localStorage. Other state is transient.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The Zustand-based board UI state store (view / grouping / filter / selection / console / rail / search) — selectively persisted to localStorage.

---

## Epic: v2: Phase 1 — Board Shell (6 cards)

### TH-37: Board.tsx — top-level shell + data loading + keyboard shortcuts

- **Card ID:** 197afdae-06a8-40b5-94b5-e94fa4cc883b
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** frontend-v2, shell
- **Assignee agent:** (none)
- **Description (full):**
  src/components/board/Board.tsx. Layout: <BoardSidebar /> | main column (TopBar, FilterRow, AISuggestionStrip, ViewSwitcher) | <BoardRightRail />. On mount: applyTheme(getStoredTheme()) before first paint, fetchBoards() then setActiveBoard(first), fetchBoard(active) on activeBoardId change. Global keyboard handler: F opens FocusModal (if a card is selected), Esc closes it, C and ⌘K are no-op placeholders (don't fire when an input has focus).
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The top-level Board.tsx shell — three-column layout, boot-time theme + data fetch, and the global keydown handler for F / Esc shortcuts.

### TH-38: BoardSidebar — workspace switcher / nav / boards list / saved views / user chip

- **Card ID:** 54d4762b-97c8-4bab-a311-9d6eef977306
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, shell, sidebar
- **Assignee agent:** (none)
- **Description (full):**
  200px wide, full height. Top: 22×22 brand glyph + 'Taskhauler' + chevron-down. Nav rows: Inbox (count MOCK_INBOX=7), My Issues (count = cards.filter(assignee_id==user.id)), AI Suggestions (count = MOCK_SUGGESTIONS.length). Boards section: list from useKanbanStore.boards, active board has surface bg + border + accent color dot. Saved views: 3 hardcoded placeholders. Bottom: current user UserChip + name from useAuthStore.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The left BoardSidebar — workspace switcher, nav rows with counts, boards list, saved-views placeholders, current-user chip at bottom.

### TH-39: BoardTopBar — breadcrumb / presence / theme / search / new-issue / console toggle

- **Card ID:** 9627c4c6-bf83-4b13-bdf5-e2959e178350
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** frontend-v2, shell, topbar
- **Assignee agent:** (none)
- **Description (full):**
  44px tall. Left: board name + filter scope + 'N of M' count. Right: PresenceCluster (self + 4 mock collaborators), inline ThemeSwitcher (3 swatches), search pill with ⌘K hint, New Issue button with C hint, Console toggle (solid accent pill when on, outline when off, showing pulsing green dot + 'Console' + working/total agent count).
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The BoardTopBar — breadcrumb, presence cluster, theme switcher, search pill, New Issue button, and Console toggle.

### TH-40: BoardFilterRow — grouping segments / filter chips / view switcher

- **Card ID:** 237c0f27-3e79-4ac6-944f-64f741d7cc67
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, shell, filter-row
- **Assignee agent:** (none)
- **Description (full):**
  40px tall. Group: 5 segments (Status/Priority/Epic/Assignee/Due) updating boardUIStore.grouping. 1px divider. Filter: 3 chips (All/Mine/Agents) updating boardUIStore.filterAssignee; Agents chip has a pulsing green dot when active. View switcher (margin-left:auto): 4 buttons with lucide icons (Columns3, GanttChart, Terminal, Network) updating boardUIStore.view.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The BoardFilterRow — grouping-mode segmented control, assignee filter chips, and view switcher.

### TH-41: BoardAISuggestionStrip — gradient strip showing top AI suggestion

- **Card ID:** 8260b42c-214e-41be-8240-c9338edc78e3
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, shell, ai
- **Assignee agent:** (none)
- **Description (full):**
  28px tall, linear-gradient from --accent-bg to --bg. Sparkles icon + '{N} AI suggestions' + ' — ' + first suggestion text + Apply / Dismiss buttons. Hidden when MOCK_SUGGESTIONS.length === 0 (always populated today). Apply / Dismiss fire alert() until proposals/suggestions endpoint exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The thin AI-suggestion gradient strip showing the top suggestion + Apply/Dismiss (mock data + alert() stubs).

### TH-42: BoardRightRail — 340px container orchestrating CardDetail vs rail tabs

- **Card ID:** d5f7957f-c432-4eea-bb2a-6fe82362c5fb
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, shell, rail
- **Assignee agent:** (none)
- **Description (full):**
  Visible when consoleOpen || selectedCardId. Shows CardDetailPanel for the selected card (with a '← Back to console' link at top when consoleOpen too — lets users deselect without closing the rail). Otherwise renders RailTabs + active panel (Console / Activity / Plans).
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The 340px BoardRightRail container that orchestrates whether to show CardDetailPanel (selected card) or the RailTabs + active panel.

---

## Epic: v2: Phase 2 — Kanban view (3 cards)

### TH-43: KanbanCard — the dense card (reused by KanbanView + DispatchView)

- **Card ID:** 02b5eea8-0834-492d-b4be-e249a31941f6
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** frontend-v2, views, cards
- **Assignee agent:** (none)
- **Description (full):**
  src/components/board/cards/KanbanCard.tsx. --surface bg, 1px --border, --radius rounded, 8/10 padding. Top row: PriorityIndicator + HAUL-N (mono) + BUG label + PresenceCluster (max 3, size 14) + comment count + AssigneeChip (size 18, working dot if agent live). Title: 12px medium, 2-line clamp. Meta: EpicChip + estimate + due. 2px progress bar at bottom when partial. Selected = accent border + 3px ring. Hover = translateY(-1px). Draggable via @dnd-kit useDraggable.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-kanban
- **What this card claims to track:** The dense KanbanCard component (priority/HAUL-N/presence/assignee/title/epic/estimate/due/progress) used in both Kanban and Dispatch views.

### TH-44: KanbanView with 5 grouping modes + drag-drop across groups

- **Card ID:** 622563b6-b7cf-45fd-94ac-8f69d7d18cc9
- **Column:** Done
- **Priority:** high
- **Type:** task
- **Labels:** frontend-v2, views, grouping, drag-drop
- **Assignee agent:** (none)
- **Description (full):**
  Client-side grouping over real card data (no server-side grouping needed). Modes: col (4 board columns), priority (Urgent/High/Med/Low, only populated), epic (one per epic + 'No epic'), assignee (per unique assignee + 'Unassigned', agents grouped before users), due (Overdue/Today/This week/Later/No due date). DndContext + per-column-droppable. Drop handler updates the right card field per grouping: column_id / priority / epic_id / assignee_id|assignee_agent / due_date. Position computed via positionAfter / positionBefore.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-kanban
- **What this card claims to track:** The KanbanView with 5 client-side grouping modes (column/priority/epic/assignee/due) and drag-drop that mutates the appropriate field on drop.

### TH-45: CardDetailPanel — selected-card view in the right rail

- **Card ID:** d65958b3-b76e-4ea6-8988-c5509dc38586
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views, card-detail
- **Assignee agent:** (none)
- **Description (full):**
  44px header: HAUL-N (left) + Focus button with F hint + Close (right). Body: title (h3 16px), 2-column metadata grid (80px labels / 1fr values: Status, Priority, Assignee, Epic, Due, Estimate, Labels), Agent activity section filtered to this card from MOCK_ACTIVITY, AI suggested section (mock). Close → selectedCardId=null. Focus → focusedCardId=cardId.
- **Comments (if any):** (none)
- **Suggested category mapping:** card-detail
- **What this card claims to track:** The CardDetailPanel that fills the right rail when a card is selected (metadata grid, per-card agent activity, AI section, Focus + Close).

---

## Epic: v2: Phase 3 — Right rail (4 cards)

### TH-46: RailTabs — 3-segment Console / Activity / Plans control

- **Card ID:** 24731b16-070f-45f1-9567-19b64abcae26
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, rail
- **Assignee agent:** (none)
- **Description (full):**
  Header at top of BoardRightRail when no card selected. Each tab shows label + count badge (Console = working agents from MOCK_TELEMETRY, Activity = MOCK_ACTIVITY.length, Plans = pending proposals count). Active tab has --bg + inset border-hi shadow. Click updates boardUIStore.railTab (persisted to localStorage).
- **Comments (if any):** (none)
- **Suggested category mapping:** rail-console
- **What this card claims to track:** The 3-segment Console/Activity/Plans tab control at the top of the right rail, with count badges and localStorage persistence.

### TH-47: ConsoleRail — presence list with agent transcripts (UI built, data mocked)

- **Card ID:** 6daec46c-a40a-4836-9b89-8fad0896941a
- **Column:** In Progress
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, rail, mocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  Two sections (active now / idle). Each presence row: 26px avatar with action-colored pulsing dot + name (mono for agents) + USER/AGENT pill + 'time ago' + chevron (agents). Action line: verb (viewing/editing/working) in action color + HAUL-N chip + truncated title. Working agents show load% + tok/m + load bar (green ≤30% / accent 30-70% / amber >70%) and, when expanded, a 4-line mono transcript cycling every 3.2s from MOCK_TRANSCRIPTS. Bottom CTA: dashed-border '+ Invite people or hauler agents' button. Converts to ✅ once /agents/telemetry endpoint exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** rail-console
- **What this card claims to track:** The ConsoleRail UI (presence list, expandable agent transcript, load bars, invite CTA) — UI built but blocked on /agents/telemetry endpoint.

### TH-48: ActivityRail — chronological feed (UI built, data mocked)

- **Card ID:** 66d3dca6-62b1-4af5-bae9-b0a89a6a0754
- **Column:** In Progress
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, rail, mocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  Top: filter chips (All/Agents/Comments/Ships). Body: events sorted by .at desc, grouped into 3 buckets (Just now <0.5h / Earlier today 0.5-8h / Yesterday+ >8h). Each ActivityRow: actor avatar (zIndex 1 over a 1px vertical connector line at x=24) + name + kind pill (color-coded AGENT=accent, MOVE=green, SHIP=green, ASSIGN=amber, PRIORITY=red, etc.) + time ago + event text + optional card chip. Newest event in Just-now bucket gets fade-in 320ms animation. Converts to ✅ once /boards/:id/activity endpoint exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** rail-activity
- **What this card claims to track:** The ActivityRail feed UI (filter chips, 3 time buckets, kind-coloured pills, fade-in on newest) — UI built but blocked on /boards/:id/activity endpoint.

### TH-49: PlansRail — proposals queue (UI built, actions stubbed)

- **Card ID:** a8635310-eccc-4d5d-8e1e-081c5aabd787
- **Column:** In Progress
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, rail, mocked, novel
- **Assignee agent:** @backend-builder
- **Description (full):**
  Two sections (pending / recently decided). Each ProposalCard (click to expand): proposer avatar (with 'AI' badge for agent proposers) + name + 'proposes' + time ago + title + status pill + action count + confidence (for agent proposers). Expanded: summary + action list in mono bordered box (PRIORITY: set X priority Y → Z / MOVE: move X Y → Z / LABEL / SPLIT / PING / ARCHIVE / ASSIGN / DUE), then Approve/Reject/Edit buttons (pending) or 'Approved by ...'/'Rejected — reason' (decided). Bottom: solid accent '+ Propose a plan' button. All action buttons fire alert() stubs until proposals domain exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** rail-plans
- **What this card claims to track:** The PlansRail UI for the proposals queue (pending/decided sections, ProposalCard with expandable action list, Approve/Reject/Edit stubs) — UI built but blocked on the proposals domain.

---

## Epic: v2: Phase 4 — Other views (7 cards)

### TH-50: TimelineView — lanes by hauler × 17-day axis

- **Card ID:** edb84686-aeba-4d97-b5c1-071e5bdaebb0
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views
- **Assignee agent:** (none)
- **Description (full):**
  200px lane labels (sticky horizontal). Day header (44px, sticky vertical): today-2 to today+14, 64px per cell, weekday + day number; today cell has --accent-bg; weekends have --bg. Lane row auto-height (rows*36+16, min 58). 2px yellow today-line at x position. Cards positioned absolutely: x = day_offset * 64 - cardWidth (right edge = due), width = clamp(80, estimate*14, 200). packRows() handles row collision. Lane label: AssigneeChip + name + sub + working green dot + workload bar capped at 21pt.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-timeline
- **What this card claims to track:** The TimelineView layout — per-hauler lanes × 17-day axis with bars positioned by due/estimate and packRows() collision handling.

### TH-51: TimelineView drag-drop — reassign across lanes / reschedule across days

- **Card ID:** 758488b4-cac3-4c1c-88a7-73c30475fb2b
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views, timeline, drag-drop
- **Assignee agent:** (none)
- **Description (full):**
  DndContext per view + useDraggable on TimelineBar + useDroppable per lane track. On drop: read pointer x (activatorEvent.clientX + delta.x), subtract lane element's bounding-rect left, floor / 64 to compute day offset → new due_date. Also pick up the target lane's assignee id from droppable.data. Single PUT /cards/:cid call updates both assignee + due_date.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-timeline
- **What this card claims to track:** TimelineView's drag-drop — drop position computes a new due_date and target-lane assignee, then issues a single PUT to update both.

### TH-52: TimelineBar — slim 32px card for Timeline view

- **Card ID:** 42795c02-432b-4c42-af44-5db21eb222e5
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views, cards
- **Assignee agent:** (none)
- **Description (full):**
  Height 32, padding 3/6/3/9. 3px left stripe in epic color (or asphalt if no epic). 5×5 pulsing green dot for working agents. HAUL-N (mono small) + title (truncated). P0 badge top-right if priority=urgent. Border red if overdue, epic color otherwise. Selected: 3px accent ring. Hover: width/border transitions; click selects.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-timeline
- **What this card claims to track:** The slim 32px TimelineBar card (epic-coloured stripe, urgent P0 badge, overdue red border) rendered absolutely within Timeline lanes.

### TH-53: TerminalView — monospace ASCII table grouped by column

- **Card ID:** ad8e9339-fc5c-4bce-aca5-67ad0f045490
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views
- **Assignee agent:** (none)
- **Description (full):**
  Top prompt: '$ board --list --group=column --sort=priority,due' with green $. Sections per column: '┌── COLUMN_NAME [count] ──' header + dashed line spacer (1px dashed bottom border on a flex-1 span, not repeated ─ chars which break at narrow widths). Each row: '│' prefix + HAUL-N (70px mono) + [Pn] (28px color-coded) + [TSK]/[BUG] (34px) + title (flex 1, truncated) + assignee (@agent green / ~user accent) + ● live (if working) + estimate (right) + due (~today / !overdue, color by urgency). Bottom: '$ _' with 8×14 blinking accent cursor (animation: blink 1s steps(1,end) infinite).
- **Comments (if any):** (none)
- **Suggested category mapping:** view-terminal
- **What this card claims to track:** The TerminalView — a monospace ASCII-table rendering of the board grouped by column, with a blinking prompt at the bottom.

### TH-54: DispatchView — fleet bar + 4 prioritised sections

- **Card ID:** ac8e295f-23e7-4e84-bc8d-e8fd1e8b26df
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, views
- **Assignee agent:** (none)
- **Description (full):**
  Fleet bar (76px, horizontal scroll): 'FLEET' label + agent count + one DispatchAgentTile per MOCK_AGENT. 4 sections below (horizontal, equal width): Hot (red, overdue+urgent, read-only filter), In Flight (accent, c2), Ready (green, c3), Queue (text-3, c1). Each section uses the SAME KanbanCard component as Kanban view. Drag-drop: In Flight / Ready / Queue accept drops (update column_id); Hot is read-only.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-dispatch
- **What this card claims to track:** The DispatchView — horizontal fleet bar plus four prioritised sections (Hot/In Flight/Ready/Queue), with drag-drop into the writable sections.

### TH-55: DispatchAgentTile — 220px agent card for fleet bar

- **Card ID:** 6061ceb1-7eeb-4124-98ef-c48313ffd2c2
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, views, cards
- **Assignee agent:** (none)
- **Description (full):**
  Working: --accent-bg + 3px accent left stripe. Idle: --bg. Top: AgentChip + @name + plugin (small). LIVE / IDLE pill top-right. 2-line: HAUL-N + truncated title (or agent.description if idle). Bottom: 3px load bar + load % label.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-dispatch
- **What this card claims to track:** The 220px DispatchAgentTile shown in the Dispatch fleet bar (agent chip, LIVE/IDLE pill, current task or description, load bar).

### TH-56: TerminalRow — single row of TerminalView

- **Card ID:** 34230f9d-1a35-4fc4-b172-7f605cafc3f0
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, views, cards
- **Assignee agent:** (none)
- **Description (full):**
  Card-as-row: '│' + fixed-width columns for HAUL-N / priority / type / title / assignee / live / estimate / due. Click → setSelectedCardId. Selected row: --accent-bg + 2px left border accent.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-terminal
- **What this card claims to track:** The single TerminalRow used as a card-as-row in TerminalView (fixed-width columns, selection state).

---

## Epic: v2: Phase 5 — Focus modal (3 cards)

### TH-57: FocusModal — fullscreen overlay for deep work on one card

- **Card ID:** 4e14c5c0-2dcc-4f82-8a8b-17325a51faa4
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, overlays
- **Assignee agent:** (none)
- **Description (full):**
  Trigger: F key (when a card is selected) OR Focus button in CardDetailPanel. Rendered via createPortal to document.body, z-index 1000. Backdrop: --bg + f0 alpha + backdrop-filter: blur(8px). Click backdrop or Esc → setFocusedCardId(null). Inner modal: width min(720px, 92vw), max-height 92vh, --surface bg, 14px border-radius, padding 32/36/28, shadow 0 30px 80px rgba(0,0,0,0.25).
- **Comments (if any):** (none)
- **Suggested category mapping:** focus
- **What this card claims to track:** The FocusModal shell — portal-rendered fullscreen overlay opened by F or the Focus button, dismissed by backdrop click or Esc.

### TH-58: FocusModal content — meta strip / title / assignee / description / progress / subtasks

- **Card ID:** eec3748d-0886-424a-acc9-0e7fab9fc60c
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, overlays
- **Assignee agent:** (none)
- **Description (full):**
  Meta strip (11px): HAUL-N (mono accent) + BUG badge + EpicChip + priority + due + 'Esc · close'. Title (h1 32px). Assignee row (28px AssigneeChip + 'working alongside you · {plugin}' for working agents + Mark shipped button which writes to Done column via useKanbanStore.updateCard). Description paragraph. Progress card (big done/total + bar + pct). Subtasks list — checkbox + text (strikethrough when done).
- **Comments (if any):** (none)
- **Suggested category mapping:** focus
- **What this card claims to track:** The content inside FocusModal — meta strip, title, assignee row with Mark shipped, description, progress card, subtasks list.

### TH-59: Subtasks via localStorage (seed from MOCK_SUBTASKS)

- **Card ID:** e1298dfb-079e-4f5e-84cd-0bcc2a760811
- **Column:** In Progress
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, overlays, localStorage, mocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  Per-card key 'taskhauler.subtasks.<cardId>'. Initialized from MOCK_SUBTASKS[realCardId] (resolved via the mock-card-N bridge) the first time a card is opened in Focus. Toggles write through to localStorage immediately. Won't sync across browsers or users — that's the limitation that the subtasks domain (Phase 8) fixes.
- **Comments (if any):** (none)
- **Suggested category mapping:** focus
- **What this card claims to track:** Today's localStorage-backed subtasks (seeded from MOCK_SUBTASKS) — placeholder until the real subtasks domain (Phase 8) lands.

---

## Epic: v2: Phase 6 — Presence (3 cards)

### TH-60: Card-level presence avatars

- **Card ID:** 70221747-d152-40a5-aa3c-ce63c840993e
- **Column:** In Progress
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, presence, mocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  PresenceCluster on KanbanCard (max 3, size 14) — shows who's currently viewing/editing that card. Today it's a fixed mapping from MOCK_PRESENCE.card_id (mock-card-N) → real card via sort-by-number. Excludes the assignee if they're already shown elsewhere on the card. Tooltips list names + actions. Converts to ✅ when realtime presence (WebSocket or SSE) exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** presence
- **What this card claims to track:** Per-card PresenceCluster on KanbanCard — mocked today via MOCK_PRESENCE, will go live when realtime presence ships.

### TH-61: Top-bar presence cluster

- **Card ID:** 29fcc6f6-b39a-4a08-b711-59e01a43bbc1
- **Column:** In Progress
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, presence, mocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  PresenceCluster in BoardTopBar (max 5, size 24, with 'X active' label). Self comes from useAuthStore.user (real). Other entries come from MOCK_PRESENCE for now. Pulsing action-color dots per spec. Converts to ✅ when realtime presence exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** presence
- **What this card claims to track:** The top-bar PresenceCluster (self real, others mocked) — converts to live data when the realtime channel exists.

### TH-62: Send local presence updates

- **Card ID:** 3aca2553-b963-4d5f-8d49-157e312b41df
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, presence, blocked
- **Assignee agent:** @backend-builder
- **Description (full):**
  Throttled (~1/sec) emit on: page mount ({action:'viewing', card_id:selectedCardId}), selectedCardId change, focus into description/comment text inputs ({action:'editing'}). On disconnect emit {type:'leave'}. No-op currently — requires the WebSocket endpoint.
- **Comments (if any):** (none)
- **Suggested category mapping:** presence
- **What this card claims to track:** Emitting throttled local presence events (viewing/editing/leave) to the realtime channel — currently a no-op pending the WS endpoint.

---

## Epic: v2: Phase 7 — Polish (8 cards)

### TH-63: Keyboard shortcuts: F (focus), Esc (close focus)

- **Card ID:** 6e41f20d-a97b-494a-8842-4a632ad0044d
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, shortcuts
- **Assignee agent:** (none)
- **Description (full):**
  Wired in Board.tsx's keydown handler. F opens FocusModal when a card is selected and modal isn't already open. Esc closes the modal. Both are no-op when an input/textarea/contenteditable has focus.
- **Comments (if any):** (none)
- **Suggested category mapping:** keyboard
- **What this card claims to track:** The implemented F/Esc keyboard shortcuts to open/close FocusModal, ignoring keys when an input has focus.

### TH-64: Keyboard shortcuts: C (new issue) / ⌘K (search) / J K (navigate) / ? (help)

- **Card ID:** 27e8237e-45d2-4e5c-85ba-9d1b44927a9d
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, shortcuts
- **Assignee agent:** (none)
- **Description (full):**
  Currently log to console as placeholders. C should open a new-issue dialog (reuse CardDetailPanel's edit form, or a dedicated modal). ⌘K should open a fuzzy search modal scoped to the active board's cards. J/K should navigate the focused card up/down in the current view. ? should show a help overlay listing all shortcuts.
- **Comments (if any):** (none)
- **Suggested category mapping:** keyboard
- **What this card claims to track:** The remaining placeholder shortcuts (C/⌘K/J K/?) — wiring them to a new-issue dialog, fuzzy-search modal, card navigation, and help overlay.

### TH-65: localStorage persistence: theme / consoleOpen / railTab / subtasks

- **Card ID:** 2c800f2e-099b-43c8-85b1-db3e049bd941
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, persistence
- **Assignee agent:** (none)
- **Description (full):**
  All four already persisted under taskhauler.* keys. Restored on app boot before first render where it matters (theme).
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** The existing localStorage persistence (theme / consoleOpen / railTab / subtasks) under taskhauler.* keys, restored at boot.

### TH-66: URL persistence for view / grouping / filterAssignee / selectedCardId

- **Card ID:** cc0cb0b8-805b-42ea-ada6-16c88df9a66a
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, persistence, routing
- **Assignee agent:** (none)
- **Description (full):**
  Today only the active board name is in the URL hash (legacy v1 pattern). Sync the rest of boardUIStore to URL query params so a shared link reproduces the exact state. On URL change (back/forward), re-read state into the store. Use the existing useEffect that already watches the hash.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** Syncing the rest of boardUIStore (view/grouping/filter/selected card) to URL query params so links are shareable and back/forward works.

### TH-67: Animations: presence-pulse / fade-in / blink / hover transitions

- **Card ID:** c5db0ff6-3631-4d68-bd0e-46ef38fb4137
- **Column:** Done
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, animations
- **Assignee agent:** (none)
- **Description (full):**
  @keyframes defined in src/index.css: presence-pulse (1.6s ease-in-out infinite, opacity+scale), fade-in (320ms, opacity+translateY), blink (1s steps(1,end) infinite, opacity). Used by presence dots, freshest activity row, Terminal cursor. Plus hover transitions on KanbanCard (120ms shadow + translateY -1px) and progress bar fill (240ms width).
- **Comments (if any):** (none)
- **Suggested category mapping:** animation
- **What this card claims to track:** The shared @keyframes / hover transitions (presence-pulse, fade-in, blink, KanbanCard hover, progress fill) defined in src/index.css.

### TH-68: Accessibility pass

- **Card ID:** 1830ef84-e50f-4fd7-af5c-2276295a8937
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, polish, a11y
- **Assignee agent:** (none)
- **Description (full):**
  All interactives are <button> (not <div>); add aria-labels on icon-only buttons; aria-current on active sidebar/segment; aria-expanded on collapsible rows (proposal cards, presence rows); focus-visible on all controls; screen-reader announcement when card detail opens (use sr-only div with aria-live=polite).
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** A11y sweep across the v2 frontend (semantic buttons, aria-labels/current/expanded, focus-visible, sr-only live region for card detail opens).

### TH-69: Error handling + toast system

- **Card ID:** 1755a058-1418-408c-a915-0ea06189e6e1
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** frontend-v2, polish, errors
- **Assignee agent:** (none)
- **Description (full):**
  Today rail action buttons fire alert() — replace with a proper toast component (could reuse shadcn's sonner if we add it). Add optimistic-revert pattern for card mutations: snapshot pre-update state, apply optimistically, on API failure restore + show error toast. WebSocket disconnect indicator next to presence cluster ('Reconnecting...'). Stale agent telemetry (>30s) greys out the live dot.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** Replacing alert()-based stubs with a real toast system, adding optimistic-revert for card mutations, WS reconnect indicator, and stale-telemetry treatment.

### TH-70: Polished empty states (when real data takes over from mocks)

- **Card ID:** d0dcaa3d-8385-4e59-874b-3830d08e4748
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** frontend-v2, polish, empty-states
- **Assignee agent:** (none)
- **Description (full):**
  Today the rail panels are always populated thanks to mocks. Once real endpoints exist, design empty-state copy for first-time users: 'No agents reporting yet — connect one to get started', 'No activity yet on this board', 'No plans pending — drag a card to In Progress to propose...'. Also: no-cards-on-board → CTA, board not found → 'pick a board from the sidebar'.
- **Comments (if any):** (none)
- **Suggested category mapping:** shell
- **What this card claims to track:** Designing real empty-state copy/UX for the rails and board once mocks are swapped for live data.

---

## Epic: Backend additions for v2 parity (11 cards)

### TH-71: Add GET /api/v1/users (list users)

- **Card ID:** 9133b6c0-fa7f-49c6-a133-cb0f1a3c1ddc
- **Column:** Backlog
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, backend-gap
- **Assignee agent:** @backend-builder
- **Description (full):**
  Smallest gap, biggest UX unblock. Returns [{id, email, display_name, is_admin, created_at}]. Filter to non-service-account rows. Probably admin-only OR scoped to 'users who have a card on the same board as the caller' to avoid leaking emails. Unblocks: assignee picker autocomplete, sidebar user list, CardDetail metadata, presence cluster names. ~30 min implementation since the users table already exists.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding the GET /api/v1/users endpoint so the frontend can resolve user names/emails for assignee pickers, sidebar, CardDetail, and presence labels.

### TH-72: Add comment_count to GET /boards/:id/cards response

- **Card ID:** 7a4ae959-9aad-42cd-b4a7-e000dc8e170e
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, perf
- **Assignee agent:** @backend-builder
- **Description (full):**
  Denormalise on read: either a subquery on the cards list query, or a denormalised count column updated on comment insert/delete. Lets KanbanCard show the comment indicator without N+1 fetches. Tiny change.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding a comment_count value to the cards-list response so KanbanCard can show the comment indicator without N+1 fetches.

### TH-73: Card schema additions: estimate (int) / progress (0..1) / blocked_by (text[])

- **Card ID:** 5cb4c152-03d0-4f0b-bbc7-d853cd9b02ff
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, schema
- **Assignee agent:** @backend-builder
- **Description (full):**
  Today: frontend mocks these from card.id hash. With real fields: Timeline workload bars compute from real estimates instead of a constant; FocusModal progress card reads from server (denormalised from subtasks); KanbanCard can show a blocked-icon. Migration: ALTER TABLE cards ADD COLUMN estimate INT, progress FLOAT, blocked_by TEXT[]. Update handlers to accept + return them.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding estimate/progress/blocked_by columns to cards so Timeline / Focus / KanbanCard can stop fabricating these values from hashes.

### TH-74: Subtasks domain (new table + CRUD endpoints)

- **Card ID:** f545b6af-ef53-4e01-ba26-17d081f52834
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, domain
- **Assignee agent:** @backend-builder
- **Description (full):**
  Subtask {id, card_id (FK), text, done (bool), position (float), created_at, updated_at}. Endpoints: GET POST under /cards/:id/subtasks, PATCH DELETE on /subtasks/:id. On insert/delete: recompute card.progress (done/total) and write it back to cards (denormalised). Converts FocusModal subtasks from localStorage → server-synced across browsers/users. ~half day.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Building the real Subtasks domain (table + CRUD endpoints + card.progress denormalisation) to replace FocusModal's localStorage subtasks.

### TH-75: Agent registry (GET /api/v1/agents)

- **Card ID:** 3647ceab-44e2-4ef0-9d26-9bd7cad9ed7a
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, agents
- **Assignee agent:** @backend-builder
- **Description (full):**
  Returns [{name, type, plugin, model, description}]. Open question: who owns the agents table? Options: (a) backend-v1 owns it with admin CRUD, (b) agents self-register via POST /api/v1/agents at runtime, (c) federate from teamagentica's existing infra-agent-registry. Pick before building. Unblocks: assignee picker shows real agents, Dispatch fleet bar populates from real data, ConsoleRail has real agents to show telemetry for.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding a real Agent registry endpoint (and deciding ownership model) so assignee picker, Dispatch fleet bar, and ConsoleRail can use real agent data.

### TH-76: Activity feed endpoint (GET /boards/:id/activity)

- **Card ID:** be626485-1c01-42f7-84ee-8002abe823bf
- **Column:** Backlog
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, backend-gap, activity
- **Assignee agent:** @backend-builder
- **Description (full):**
  Query: ?since=<ts>&kind=agent,comment&limit=50. Returns ActivityEvent[] newest-first. Kinds: agent / comment / move / assign / create / ship / label / priority. Add activity_events table; emit on every card mutation (already have the emit-points from the events stub). Optional: broadcast via the same WebSocket as presence so ActivityRail can fade-in new events live without polling. Converts ActivityRail mocks → real, plus CardDetail's per-card activity section. ~1 day.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Building a real Activity feed endpoint (new table + emit on mutations + optional WS broadcast) to unblock ActivityRail and CardDetail per-card activity.

### TH-77: Agent telemetry endpoint + optional SSE stream

- **Card ID:** ba16b450-d47a-473a-aa00-fba80b528c62
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, agents, runtime
- **Assignee agent:** @backend-builder
- **Description (full):**
  GET /agents/telemetry → AgentTelemetry[] (name, status, load, tok, step, current_card_id, last_act). GET /agents/:name/transcript?tail=10 → AgentTranscriptLine[]. The hard part isn't the endpoint — it's getting the agent runtime to emit these events. If using a SDK like LangChain or Claude Agent SDK, hook into its event stream. Optional: GET /agents/stream (SSE) for push instead of poll. Unblocks: ConsoleRail's live agent state, KanbanCard's '● live' indicator on agent-assigned cards.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding Agent telemetry + transcript endpoints (with optional SSE stream) plus the agent-runtime side that emits these events — unblocks ConsoleRail's live agent state.

### TH-78: Proposals domain (CRUD + transactional execute)

- **Card ID:** 0700a606-f232-4a9c-b692-8e4477c1a6fe
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, proposals, novel
- **Assignee agent:** @backend-builder
- **Description (full):**
  Most novel feature. Tables: proposals + proposal_actions (with kind: priority/move/label/split/ping/archive/assign/due). Endpoints: POST /boards/:id/proposals (anyone), GET ?status=pending, GET /proposals/:id, POST /proposals/:id/approve (board members with edit rights), POST /proposals/:id/reject body:{reason?}, PATCH /proposals/:id (only while pending). On approve: status=executing, apply each action inside a single DB transaction; rollback on any failure with execution_error; success = status=approved + emit activity event. Permissions: agents cannot self-approve their own proposals — humans must. Multi-day.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Building the Proposals domain — tables, CRUD endpoints, transactional execute on approve, agent-self-approve guard — to unblock PlansRail.

### TH-79: Presence (WebSocket or SSE realtime channel)

- **Card ID:** c359644b-3cc4-43a1-a261-d62fc1eb7bab
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, backend-gap, realtime, infra
- **Assignee agent:** @backend-builder
- **Description (full):**
  WS /api/v1/boards/:id/presence with snapshot + update + leave messages. Memory-only Map<boardId, Map<sessionId, PresenceEntry>>. TTL each entry 30s; clients heartbeat every 10s. On WS close → broadcast leave. Agents publish presence the same way humans do (when an agent starts on a card, it publishes {action:'working', card_id}). Polling fallback for clients without WS. Requires new infrastructure (Gorilla websocket or similar in backend; reverse proxy must support upgrade). Multi-day.
- **Comments (if any):** (none)
- **Suggested category mapping:** presence
- **What this card claims to track:** Building the realtime presence channel (WS or SSE) with snapshot/update/leave messages, heartbeats, TTL, and polling fallback.

### TH-80: AI suggestions endpoint

- **Card ID:** f0703356-09b6-475a-8aba-cc30a377d26e
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** backend-v1, backend-gap, ai
- **Assignee agent:** @backend-builder
- **Description (full):**
  GET /boards/:id/suggestions → top 5 board-wide. GET /cards/:id/suggestions → per-card. POST /suggestions/:id/apply, /:id/dismiss. Generation: an agent computes these on a schedule (hourly) or on events (PR merged → suggest promote to In Review). Cache server-side. Surface in BoardAISuggestionStrip and CardDetailPanel's AI section. Lowest priority because the strip hides when empty (or shows the mock today).
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding board- and card-level AI suggestions endpoints (+ apply/dismiss) that feed BoardAISuggestionStrip and CardDetailPanel's AI section.

### TH-81: Add description field to RegistryAlias / agent record

- **Card ID:** 0fa297e6-b540-42f4-a487-977f3f950e3e
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** backend-v1, backend-gap, agents
- **Assignee agent:** @backend-builder
- **Description (full):**
  Human-friendly one-liner ('Triages new bugs from logs'). Shown in ConsoleRail under idle agents. Trivial — once the agents table exists, just add a column.
- **Comments (if any):** (none)
- **Suggested category mapping:** api
- **What this card claims to track:** Adding a human-friendly description column to the agent record so ConsoleRail can show it under idle agents.

---

## Epic: Identity / Auth (ZITADEL roadmap) (6 cards)

### TH-82: Add external_id column to users (ZITADEL prep)

- **Card ID:** e4db25c9-4dd5-4e23-9c6f-97d824491db8
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, auth, zitadel-prep
- **Assignee agent:** @backend-builder
- **Description (full):**
  ALTER TABLE users ADD COLUMN external_id TEXT; CREATE UNIQUE INDEX idx_users_external_id ON users (external_id) WHERE external_id IS NOT NULL. Stays NULL for everyone until the ZITADEL migration; afterwards holds the ZITADEL user id. Cheap now, painful to retrofit later. See docs/zitadel.md.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** A cheap-now ALTER to add users.external_id (with a partial unique index) so the ZITADEL migration can write the IdP user id into it later without retrofit pain.

### TH-83: Introduce AuthProvider interface in front of login handler

- **Card ID:** c0b025af-0657-42f1-a7ed-b2d8b7695873
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, auth, zitadel-prep
- **Assignee agent:** @backend-builder
- **Description (full):**
  Wrap the current password-check+JWT-mint in an AuthProvider interface { Authenticate(c *gin.Context) (userID uint, isAdmin bool, err error) }. LocalAuthProvider is today's implementation. OIDCAuthProvider validates ZITADEL tokens against the JWKS and looks up users by external_id. AUTH_PROVIDER env var (local|oidc) picks at startup. Service-account tokens stay unchanged either way. See docs/zitadel.md for migration plan.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** Refactoring login into an AuthProvider interface with Local/OIDC implementations, switchable via AUTH_PROVIDER env, leaving service-account tokens alone.

### TH-84: Audit out any WHERE email = ? in non-auth code

- **Card ID:** de2ddbf4-0fd9-4712-8d17-1f8e2de31e81
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** backend-v1, auth, zitadel-prep
- **Assignee agent:** @backend-builder
- **Description (full):**
  Email lives in ZITADEL post-migration. Any code that uses email as a foreign-key surface (instead of users.id) becomes painful to migrate. Sweep the codebase, fix any such queries to use the opaque id instead. Probably zero issues since we've been disciplined, but worth confirming before ZITADEL day.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** A grep-and-fix sweep to remove any `WHERE email = ?` patterns from non-auth code paths, since email migrates to ZITADEL.

### TH-85: Stand up ZITADEL at id.decentrali.se

- **Card ID:** 57c46cb7-f701-4b85-8b8d-14ec05df374f
- **Column:** Backlog
- **Priority:** high
- **Type:** task
- **Labels:** infra, auth, zitadel
- **Assignee agent:** (none)
- **Description (full):**
  Choose deployment target (managed VM, container service, K8s). Postgres backing store. Custom domain + TLS. Disable self-registration on the IdP-hosted UI. Configure branding (logo, colors, 'Sign in to Decentrali.se' text). SMTP for verification + reset emails from our domain. Create one Project per app (TH, TA, EYED, Decentrali.se). Issue service-user API tokens for each app's signup forms. See docs/zitadel.md for full plan.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** Standing up the shared ZITADEL IdP at id.decentrali.se — deployment, TLS, branding, SMTP, one Project per app, service-user tokens.

### TH-86: Migrate TaskHauler users into ZITADEL (one-shot script)

- **Card ID:** a2067351-dc98-441d-9e88-100f9b26a11a
- **Column:** Backlog
- **Priority:** high
- **Type:** task
- **Labels:** backend-v1, auth, zitadel
- **Assignee agent:** (none)
- **Description (full):**
  After ZITADEL is up: cmd/zitadel-migrate Go script that iterates users WHERE external_id IS NULL, calls ZITADEL's ImportHumanUser API (which accepts bcrypt password hashes — no force-reset needed), saves the returned zitadel_user_id into users.external_id. Idempotent. Then flip AUTH_PROVIDER=oidc and the frontend redirect URL.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** A one-shot Go migration script that imports local users (with bcrypt hashes intact) into ZITADEL and stores the ZITADEL ids into users.external_id.

### TH-87: Project Grants — per-product access control via ZITADEL

- **Card ID:** c67a2ce4-4e42-43f7-8f89-c31bac88eeb1
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** backend-v1, auth, zitadel
- **Assignee agent:** (none)
- **Description (full):**
  Each product is a ZITADEL Project. Users have grants per project. EYED: only Chris has the grant. TA: curated (invite/paid). TH: open (any verified user). Decentrali.se: open. Without a grant, ZITADEL refuses to mint a token for that product — Bob can authenticate but can't even reach EYED's code with a valid token. Defense-in-depth on top of the per-product users table.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** Using ZITADEL Project Grants for per-product access control (TH open, TA curated, EYED Chris-only, Decentrali.se open) as defense-in-depth.

---

## Epic: Frontend v1 (legacy) (4 cards)

### TH-88: Port KanbanBoard from teamagentica's system-web-dashboard plugin

- **Card ID:** b79dd08f-e7b5-47d0-bccd-099168860d02
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend, kanban, extracted
- **Assignee agent:** (none)
- **Description (full):**
  Original component at TA's plugins/system-web-dashboard/web/src/components/KanbanBoard.tsx (~1800 lines). Rewired @teamagentica/api-client imports to a local fetch-based src/api/client.ts. Replaced TA-specific stores (userStore/agentStore) with simpler local versions backed by the new API. Kept all functionality: drag-drop, swimlanes by epic, board manager, side panel for new/edit card with assignee autocomplete + comments.
- **Comments (if any):** (none)
- **Suggested category mapping:** view-kanban
- **What this card claims to track:** Porting the existing TA KanbanBoard (~1800 lines) into the standalone frontend, rewiring API client and stores while keeping full functionality.

### TH-89: Vite + React 19 + TS + Tailwind 4 + shadcn/ui project setup

- **Card ID:** 8437f454-655f-406b-9292-d2eabf2ca589
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend, vite, tailwind
- **Assignee agent:** (none)
- **Description (full):**
  All copied from TA's existing dashboard. Project lives at frontend/. Routes everything through /api/v1 via vite dev proxy (in dev) / nginx /api/ → backend:8080 (in prod, before version-per-service refactor stripped this). Dark-mode by default via class on <html>.
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** Bootstrapping the frontend v1 project (Vite + React 19 + TS + Tailwind 4 + shadcn/ui), dev proxy to /api/v1, dark mode default.

### TH-90: JWT auth flow + LoginForm (frontend v1)

- **Card ID:** 8da811e5-3b03-4480-a58f-eee7a767d59c
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend, auth, jwt
- **Assignee agent:** (none)
- **Description (full):**
  Login → store access + refresh tokens in localStorage. authStore (zustand) holds the user object. fetchMe() on app boot to validate stored token. 401 → automatic refresh attempt, then clear storage + show LoginForm on persistent failure.
- **Comments (if any):** (none)
- **Suggested category mapping:** auth
- **What this card claims to track:** The frontend v1 JWT login flow (LoginForm, localStorage access/refresh tokens, authStore, automatic refresh on 401).

### TH-91: Multi-stage Dockerfile for frontend v1 (dev = vite HMR, prod = nginx)

- **Card ID:** 94a5112c-6f9a-4fb1-ac7d-2ff04f0a05f6
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** frontend, docker
- **Assignee agent:** (none)
- **Description (full):**
  dev: node:22-alpine running vite with --host 0.0.0.0 --port 3000, source bind-mounted at runtime. builder: npm run build → /app/dist. prod: nginx:1.27-alpine, serves built assets with SPA fallback. /api proxy in nginx was removed during the version-per-service refactor (DDT does path-based routing now).
- **Comments (if any):** (none)
- **Suggested category mapping:** infra
- **What this card claims to track:** The frontend v1 multi-stage Dockerfile (vite HMR in dev, nginx serving SPA in prod) — /api proxy moved to DDT after refactor.

---

## Epic: Marketing website (2 cards)

### TH-92: Marketing site at marketing.taskhauler.localhost (Vite + React + Tailwind)

- **Card ID:** 86328d8b-bee4-4dad-b057-5fb322499310
- **Column:** Done
- **Priority:** medium
- **Type:** task
- **Labels:** website, marketing
- **Assignee agent:** (none)
- **Description (full):**
  Separate Vite project at website/, no shared deps with frontend/. Hero / Why / Features / HowItWorks / Footer sections. Dark-mode default. Cool/technical aesthetic (cyan accent, zinc base, subtle gradients). Each section is full-bleed with internal max-w-screen-2xl content column — works from 320px to 4K without degenerating into a thin centered page.
- **Comments (if any):** (none)
- **Suggested category mapping:** website
- **What this card claims to track:** The standalone marketing site at marketing.taskhauler.localhost (separate Vite project, Hero/Why/Features/HowItWorks/Footer sections, full-bleed layout).

### TH-93: Deploy marketing site to www.antimatter-studios.com/taskhauler

- **Card ID:** 511cb78b-3156-4bb5-abdc-3c7e417b1da8
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** website, deploy
- **Assignee agent:** (none)
- **Description (full):**
  Currently runs at marketing.taskhauler.localhost for local dev. Production target is the antimatter-studios.com brand site as a sub-path. Likely a static-export to CDN or a reverse-proxy slot in the main antimatter-studios.com site.
- **Comments (if any):** (none)
- **Suggested category mapping:** website
- **What this card claims to track:** Deploying the marketing site as a sub-path of www.antimatter-studios.com/taskhauler (static export or reverse-proxy slot).

---

## Epic: Future integrations (6 cards)

### TH-94: GitHub integration: webhook → triage → task

- **Card ID:** e6d8e8a2-8a73-4dda-879b-e107a79789c1
- **Column:** Backlog
- **Priority:** high
- **Type:** task
- **Labels:** integration, github, headline
- **Assignee agent:** @triage-agent
- **Description (full):**
  The headline integration from the original product pitch. Flow: GitHub webhook on issues.opened / issues.edited / pull_request.opened (both issues and PRs ingested). LLM analyzes title/body/labels/diff and produces: routing decision (auto-repair vs needs-human), target board/labels, confidence score. Create task backlinked to the issue/PR with routing decision as label/column. Comment back to GitHub with the TH task URL.
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** The headline GitHub integration — webhook ingestion of issues/PRs, LLM triage with routing decision, TH task creation with backlink, GH comment with TH URL.

### TH-95: Agent dispatch: 'agent-ready' tasks → external runtime

- **Card ID:** 4a4ed962-6157-4b40-a81e-88fe33c00fad
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** integration, agents, headline
- **Assignee agent:** @dispatch-agent
- **Description (full):**
  Companion to GitHub integration. A task labeled 'agent-ready' (manually or by triage confidence threshold) is picked up by an external agent runtime — either by polling /api/v1/boards/:id/cards?labels=agent-ready or by an outbound webhook (POST /webhooks/outbound to a configured sink). Agent posts progress as comments. On PR open: task → in-review. On merge: task → done.
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** Dispatching 'agent-ready'-labelled tasks to external agent runtimes (poll or outbound webhook), with progress comments and PR-driven column transitions.

### TH-96: MCP server packaging: ship 'taskhauler' as a registerable MCP

- **Card ID:** e454139f-4338-418e-a359-20f53eda95d5
- **Column:** Backlog
- **Priority:** medium
- **Type:** task
- **Labels:** integration, mcp, agents
- **Assignee agent:** (none)
- **Description (full):**
  Backend already exposes /api/v1/mcp/* tool endpoints. Next: ship a stdio MCP bridge (small Go or TS binary) that Claude Code, Claude Desktop, and other MCP-capable clients can install. Tools surface as taskhauler.create_task, list_boards, etc. Auth via a tha_<hex> service-account token in MCP config.
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** Packaging a stdio MCP bridge ("taskhauler") that wraps the backend /api/v1/mcp/* endpoints so MCP-capable clients (Claude Code/Desktop) can install it.

### TH-97: Packaged agent skills for common patterns

- **Card ID:** 31c1ad4d-eb7a-40b2-b599-960c6a5f26e5
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** integration, skills
- **Assignee agent:** (none)
- **Description (full):**
  Beyond raw MCP tools, ship higher-level skills that wrap common workflows: record-work (agent finishes a task, posts result + flips column), triage-incoming (freeform request → pick project/board/labels and create task), pick-next (find highest-priority agent-ready task), report-blocked (add comment + move to blocked column). Skills compose with MCP, don't bypass it.
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** Shipping packaged higher-level agent skills (record-work / triage-incoming / pick-next / report-blocked) that wrap common workflows on top of MCP.

### TH-98: EYED ↔ Taskhauler federation (TBD)

- **Card ID:** c9369317-3d1d-4be2-b9b8-f002b188179c
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** integration, eyed
- **Assignee agent:** (none)
- **Description (full):**
  Eventually EYED reads/writes to TaskHauler via service-account token. Open shape: TaskHauler boards as one of EYED's data lenses; EYED triggering new TH tasks from external signals (calendar, email); cross-referencing TH tasks in EYED timelines.
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** Placeholder for the EYED ↔ Taskhauler federation story — service-account based read/write, TH boards as an EYED lens, signal-driven task creation.

### TH-99: Decentrali.se ↔ Taskhauler integration story (TBD)

- **Card ID:** 1b808ce2-6690-4d19-acad-731f0d45d783
- **Column:** Backlog
- **Priority:** low
- **Type:** task
- **Labels:** integration, decentralise
- **Assignee agent:** (none)
- **Description (full):**
  Once Decentrali.se exists as a decentralized social network: TH tasks could be shared / discussed / co-owned across DIDs. Open architectural question: does TH consume identity from Decentrali.se's DID system, or just from ZITADEL's centralized pool?
- **Comments (if any):** (none)
- **Suggested category mapping:** integration
- **What this card claims to track:** Placeholder for the Decentrali.se ↔ Taskhauler story — DID-based sharing/co-ownership of tasks, identity-source decision (DID vs ZITADEL).
