# Task Hauler Board — Coverage Map (flat grep file)

Format: `TH-N | Epic | Column | claim summary`

TH-1  | Platform / Infrastructure          | Done       | Extraction of TA tool-task-tracker plugin into standalone monorepo (backend-v1/ + frontend/ + frontend-v2/ + website/)
TH-2  | Platform / Infrastructure          | Done       | Version-per-service deployment pattern (each API version its own deployable, DDT routes by /api/vN)
TH-3  | Platform / Infrastructure          | Done       | DDT reverse-proxy routing for *.localhost (taskhauler / taskhauler-v2 / marketing.taskhauler / /api/v1)
TH-4  | Platform / Infrastructure          | Done       | Root Taskfile orchestrating raw `docker run` (no docker-compose) for dev/prod/db/import/openapi
TH-5  | Platform / Infrastructure          | Done       | Docker Desktop compose-style grouping via com.docker.compose.project + .service labels
TH-6  | Platform / Infrastructure          | Backlog    | Production deployment to taskhauler.antimatter-studios.com (host/TLS/DNS/DB/logs/observability)
TH-7  | Platform / Infrastructure          | Backlog    | CI/CD pipeline (GitHub Actions builds + GHCR + deploy on merge)
TH-8  | Platform / Infrastructure          | Backlog    | Postgres backup strategy (pre-prod: scheduled pg_dump; post-prod: managed PITR)
TH-9  | Backend (Go service)               | Done       | Postgres/GORM storage layer with AutoMigrate, soft deletes, per-board sequential card numbers
TH-10 | Backend (Go service)               | Done       | Local JWT auth (login/refresh/me) with bcrypt cost-12 matching TA
TH-11 | Backend (Go service)               | Done       | Service-account tokens (`tha_<hex>`) for non-interactive callers, sha256-hashed in DB
TH-12 | Backend (Go service)               | Done       | REST CRUD under /api/v1 for boards/columns/epics/cards/comments incl. search + lookup-by-number
TH-13 | Backend (Go service)               | Done       | MCP tool endpoints (15 tools) under POST /mcp/* mirroring REST
TH-14 | Backend (Go service)               | Done       | OpenAPI 3.0 spec generated from Go source via go-oapifly, served at /api/v1/openapi.json
TH-15 | Backend (Go service)               | Done       | One-shot SQLite→Postgres importer for TA task-tracker data (cmd/import-sqlite)
TH-16 | Backend (Go service)               | Done       | One-shot SQLite→Postgres importer for TA user accounts (cmd/import-users), preserves IDs + bcrypt
TH-17 | Backend (Go service)               | Done       | Stub internal event emitter wired on assign / comment paths, replacing TA pluginsdk bus
TH-18 | Backend (Go service)               | Done       | Multi-stage backend Dockerfile (builder/dev/prod) producing 3 binaries
TH-19 | Backend (Go service)               | Done       | CORS middleware (env-driven CORS_ALLOWED_ORIGINS) for cross-origin v2 frontend access
TH-20 | Backend (Go service)               | Done       | BUG: Board.Prefix unique-index collision fix + auto-derived prefix from board name
TH-21 | v2: Phase 0 — Foundations          | Done       | Theme system Day/Mono/Paper via CSS custom properties scoped on [data-theme]
TH-22 | v2: Phase 0 — Foundations          | Done       | Font loading: Inter / JetBrains Mono / Geist Mono from Google Fonts
TH-23 | v2: Phase 0 — Foundations          | Done       | Lib: time helpers (fmtDue / fmtAgo / fmtDate) in src/lib/time.ts
TH-24 | v2: Phase 0 — Foundations          | Done       | Lib: fractional position helpers (positionAfter / positionBefore) for drag-drop ordering
TH-25 | v2: Phase 0 — Foundations          | Done       | Lib: pack-rows greedy row packer used by TimelineView lane layout
TH-26 | v2: Phase 0 — Foundations          | Done       | Lib: theme helpers (applyTheme / getStoredTheme / persistTheme / THEMES) avoiding FOWT
TH-27 | v2: Phase 0 — Foundations          | Done       | Primitive: UserChip (circular oklch-hue avatar) for humans
TH-28 | v2: Phase 0 — Foundations          | Done       | Primitive: AgentChip (hexagonal mono tile, cyan glow when working) — core v2 design choice
TH-29 | v2: Phase 0 — Foundations          | Done       | Primitive: AssigneeChip dispatching to UserChip or AgentChip with optional working dot
TH-30 | v2: Phase 0 — Foundations          | Done       | Primitive: PresenceDot (8px pulsing action-colored dot)
TH-31 | v2: Phase 0 — Foundations          | Done       | Primitive: PresenceCluster (overlapping avatars + +N + "X active" label)
TH-32 | v2: Phase 0 — Foundations          | Done       | Primitive: PriorityIndicator (1/2/3 amber bars or urgent red square)
TH-33 | v2: Phase 0 — Foundations          | Done       | Primitive: EpicChip (epic.color dot + name pill, theme-adaptive via color-mix)
TH-34 | v2: Phase 0 — Foundations          | Done       | Primitive: KeyHint (small `<kbd>`-style label) used in TopBar / CardDetail / FocusModal
TH-35 | v2: Phase 0 — Foundations          | Done       | Mock data files under src/mock/ (11 files), one per future API endpoint — the swap contract
TH-36 | v2: Phase 0 — Foundations          | Done       | boardUIStore (Zustand): view/grouping/filter/selection/console/rail/search with selective localStorage persistence
TH-37 | v2: Phase 1 — Board Shell          | Done       | Board.tsx top-level shell — three-column layout, boot-time theme + data fetch, F/Esc handler
TH-38 | v2: Phase 1 — Board Shell          | Done       | BoardSidebar (200px) — workspace switcher, Inbox/My Issues/AI Suggestions counts, boards list, saved views, user chip
TH-39 | v2: Phase 1 — Board Shell          | Done       | BoardTopBar (44px) — breadcrumb, presence cluster, theme switcher, search pill, New Issue, Console toggle
TH-40 | v2: Phase 1 — Board Shell          | Done       | BoardFilterRow (40px) — 5 grouping segments + 3 filter chips + 4 view-switcher buttons
TH-41 | v2: Phase 1 — Board Shell          | Done       | BoardAISuggestionStrip (28px gradient) — top AI suggestion w/ Apply/Dismiss (alert() stubs today)
TH-42 | v2: Phase 1 — Board Shell          | Done       | BoardRightRail (340px) orchestrates CardDetailPanel vs RailTabs + active panel
TH-43 | v2: Phase 2 — Kanban view          | Done       | KanbanCard — dense card reused by Kanban + Dispatch (priority/HAUL-N/presence/assignee/title/meta/progress)
TH-44 | v2: Phase 2 — Kanban view          | Done       | KanbanView with 5 client-side grouping modes (col/priority/epic/assignee/due) + drag-drop
TH-45 | v2: Phase 2 — Kanban view          | Done       | CardDetailPanel — selected-card view in right rail (metadata grid, per-card activity, AI section, Focus/Close)
TH-46 | v2: Phase 3 — Right rail           | Done       | RailTabs — 3-segment Console/Activity/Plans control with count badges, persisted to localStorage
TH-47 | v2: Phase 3 — Right rail           | InProgress | ConsoleRail (mocked) — presence list + agent transcripts; blocked on /agents/telemetry endpoint
TH-48 | v2: Phase 3 — Right rail           | InProgress | ActivityRail (mocked) — chronological feed with filter chips + 3 time buckets; blocked on /boards/:id/activity
TH-49 | v2: Phase 3 — Right rail           | InProgress | PlansRail (mocked) — proposals queue with Approve/Reject stubs; blocked on proposals domain
TH-50 | v2: Phase 4 — Other views          | Done       | TimelineView — hauler lanes × 17-day axis, bars positioned by due/estimate, packRows collision
TH-51 | v2: Phase 4 — Other views          | Done       | TimelineView drag-drop — reassign across lanes + reschedule across days in a single PUT
TH-52 | v2: Phase 4 — Other views          | Done       | TimelineBar (32px slim card) — epic stripe, working dot, urgent P0 badge, overdue red border
TH-53 | v2: Phase 4 — Other views          | Done       | TerminalView — monospace ASCII-table grouped by column with blinking $ prompt
TH-54 | v2: Phase 4 — Other views          | Done       | DispatchView — fleet bar + Hot/InFlight/Ready/Queue sections (drag-drop into 3 writable sections)
TH-55 | v2: Phase 4 — Other views          | Done       | DispatchAgentTile (220px) — agent card for the Dispatch fleet bar
TH-56 | v2: Phase 4 — Other views          | Done       | TerminalRow — single fixed-width row for TerminalView
TH-57 | v2: Phase 5 — Focus modal          | Done       | FocusModal shell — portal overlay opened by F or Focus button, dismissed by backdrop/Esc
TH-58 | v2: Phase 5 — Focus modal          | Done       | FocusModal content — meta strip / title / assignee row + Mark shipped / description / progress / subtasks
TH-59 | v2: Phase 5 — Focus modal          | InProgress | Subtasks via localStorage (seeded from MOCK_SUBTASKS) — placeholder until real subtasks domain
TH-60 | v2: Phase 6 — Presence             | InProgress | Card-level PresenceCluster on KanbanCard (mocked) — needs realtime channel
TH-61 | v2: Phase 6 — Presence             | InProgress | Top-bar PresenceCluster (self real, others mocked) — needs realtime channel
TH-62 | v2: Phase 6 — Presence             | Backlog    | Send local presence updates (viewing/editing/leave) — no-op until WS endpoint exists
TH-63 | v2: Phase 7 — Polish               | Done       | Keyboard shortcuts: F (focus) / Esc (close focus) — wired in Board.tsx keydown
TH-64 | v2: Phase 7 — Polish               | Backlog    | Keyboard shortcuts: C / ⌘K / J K / ? — currently console-log placeholders
TH-65 | v2: Phase 7 — Polish               | Done       | localStorage persistence: theme / consoleOpen / railTab / subtasks (all live, restored at boot)
TH-66 | v2: Phase 7 — Polish               | Backlog    | URL-query persistence for view / grouping / filterAssignee / selectedCardId
TH-67 | v2: Phase 7 — Polish               | Done       | Animations: presence-pulse / fade-in / blink + KanbanCard hover + progress fill transitions
TH-68 | v2: Phase 7 — Polish               | Backlog    | Accessibility pass — semantic buttons, aria-labels/current/expanded, focus-visible, sr-only live region
TH-69 | v2: Phase 7 — Polish               | Backlog    | Error handling + toast system — replace alert() stubs, optimistic-revert, WS reconnect indicator, stale telemetry
TH-70 | v2: Phase 7 — Polish               | Backlog    | Polished empty states for rails + board when mocks are swapped for live data
TH-71 | Backend additions for v2 parity    | Backlog    | GET /api/v1/users — list users so frontend can resolve assignee names/emails
TH-72 | Backend additions for v2 parity    | Backlog    | Add comment_count to boards-cards response (avoid N+1 fetches for KanbanCard indicator)
TH-73 | Backend additions for v2 parity    | Backlog    | Card schema additions — estimate (int) / progress (0..1) / blocked_by (text[]) columns
TH-74 | Backend additions for v2 parity    | Backlog    | Subtasks domain — new table + CRUD + denormalised card.progress (replaces localStorage subtasks)
TH-75 | Backend additions for v2 parity    | Backlog    | Agent registry GET /api/v1/agents (ownership: backend-owned / self-register / federate from TA — TBD)
TH-76 | Backend additions for v2 parity    | Backlog    | Activity feed endpoint GET /boards/:id/activity (new table + emit on mutations + optional WS broadcast)
TH-77 | Backend additions for v2 parity    | Backlog    | Agent telemetry endpoint + optional SSE stream + agent-runtime emit side
TH-78 | Backend additions for v2 parity    | Backlog    | Proposals domain — CRUD + transactional approve-execute + agent-self-approve guard
TH-79 | Backend additions for v2 parity    | Backlog    | Presence realtime channel (WS or SSE) with snapshot/update/leave, heartbeats, TTL, polling fallback
TH-80 | Backend additions for v2 parity    | Backlog    | AI suggestions endpoints (board + per-card, apply/dismiss) feeding AISuggestionStrip and CardDetail
TH-81 | Backend additions for v2 parity    | Backlog    | Add description column to agent record so ConsoleRail can show it under idle agents
TH-82 | Identity / Auth (ZITADEL roadmap)  | Backlog    | Add users.external_id column + partial unique index (ZITADEL prep)
TH-83 | Identity / Auth (ZITADEL roadmap)  | Backlog    | Introduce AuthProvider interface with Local + OIDC impls, switched via AUTH_PROVIDER env
TH-84 | Identity / Auth (ZITADEL roadmap)  | Backlog    | Audit out any `WHERE email = ?` in non-auth code (use opaque id instead)
TH-85 | Identity / Auth (ZITADEL roadmap)  | Backlog    | Stand up ZITADEL IdP at id.decentrali.se (deployment, TLS, branding, SMTP, Projects)
TH-86 | Identity / Auth (ZITADEL roadmap)  | Backlog    | One-shot Go script to migrate TH users into ZITADEL (ImportHumanUser, store external_id)
TH-87 | Identity / Auth (ZITADEL roadmap)  | Backlog    | ZITADEL Project Grants for per-product access control (TH open, TA curated, EYED Chris-only, Decentrali.se open)
TH-88 | Frontend v1 (legacy)               | Done       | Port KanbanBoard (~1800 lines) from TA system-web-dashboard plugin into standalone frontend
TH-89 | Frontend v1 (legacy)               | Done       | Vite + React 19 + TS + Tailwind 4 + shadcn/ui setup for frontend v1
TH-90 | Frontend v1 (legacy)               | Done       | JWT auth flow + LoginForm (localStorage tokens, authStore, automatic refresh on 401)
TH-91 | Frontend v1 (legacy)               | Done       | Frontend v1 multi-stage Dockerfile (vite HMR dev / nginx prod, /api proxy moved to DDT)
TH-92 | Marketing website                  | Done       | Marketing site at marketing.taskhauler.localhost — separate Vite project with Hero/Why/Features/HowItWorks/Footer
TH-93 | Marketing website                  | Backlog    | Deploy marketing site as sub-path of www.antimatter-studios.com/taskhauler (static export or reverse-proxy)
TH-94 | Future integrations                | Backlog    | HEADLINE: GitHub integration — webhook → LLM triage → TH task with backlink + GH comment
TH-95 | Future integrations                | Backlog    | HEADLINE: 'agent-ready' tasks dispatched to external agent runtime (poll or outbound webhook); PR-driven column transitions
TH-96 | Future integrations                | Backlog    | MCP server packaging — ship stdio MCP bridge "taskhauler" for Claude Code / Desktop, auth via tha_ token
TH-97 | Future integrations                | Backlog    | Packaged agent skills (record-work / triage-incoming / pick-next / report-blocked) composing with MCP
TH-98 | Future integrations                | Backlog    | EYED ↔ Taskhauler federation (TBD placeholder) — service-account read/write, TH boards as EYED lens
TH-99 | Future integrations                | Backlog    | Decentrali.se ↔ Taskhauler integration (TBD placeholder) — DID-based sharing, identity-source decision
