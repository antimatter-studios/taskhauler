#!/usr/bin/env bash
#
# Seed a Taskhauler build-progress board with cards mined from the
# original design docs (parity checklist + backend gaps), now distilled
# into docs/v2-spec-inventory.md + docs/frontend-v2-status.md.
#
# Eating our own dogfood: track the implementation as cards in the very
# product we're building. This is the bootstrap path for a fresh DB; the
# Task Hauler (TH) board on the live instance was originally seeded by
# this script under its earlier name.
#
# Usage:
#   bash scripts/seed-board.sh
#   API=http://taskhauler.localhost/api/v1 EMAIL=admin@taskhauler.localhost PASSWORD=admin bash scripts/seed-board.sh
#
# Re-running: aborts if a board with the same name already exists.

set -euo pipefail

API="${API:-http://taskhauler.localhost/api/v1}"
EMAIL="${EMAIL:-admin@taskhauler.localhost}"
PASSWORD="${PASSWORD:-admin}"
BOARD_NAME="${BOARD_NAME:-Taskhauler Build}"
BOARD_PREFIX="${BOARD_PREFIX:-V2}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }; }
need curl
need jq

say() { printf '\033[36m▸\033[0m %s\n' "$*"; }
ok()  { printf '  \033[32m✓\033[0m %s\n' "$*"; }
err() { printf '  \033[31m✗\033[0m %s\n' "$*" >&2; }

# ── Login ─────────────────────────────────────────────────────────────────────
say "Login as $EMAIL"
TOKEN="$(curl -sf -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$API/auth/login" | jq -r .access_token)"
[ -n "$TOKEN" ] && [ "$TOKEN" != "null" ] || { err "login failed"; exit 1; }
ok "logged in"

api() {
  # api METHOD PATH [JSON]
  local method=$1 path=$2 data="${3:-}"
  if [ -n "$data" ]; then
    curl -sf -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" "$API$path"
  else
    curl -sf -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      "$API$path"
  fi
}

# ── Idempotency check ────────────────────────────────────────────────────────
EXISTING="$(api GET /boards | jq -r --arg n "$BOARD_NAME" '.[] | select(.name == $n) | .id' | head -1)"
if [ -n "$EXISTING" ]; then
  err "Board \"$BOARD_NAME\" already exists ($EXISTING). Delete it first or pass BOARD_NAME=... to choose another."
  exit 2
fi

# ── Create board ──────────────────────────────────────────────────────────────
say "Create board: $BOARD_NAME ($BOARD_PREFIX)"
BOARD_ID="$(api POST /boards "$(jq -n \
  --arg n "$BOARD_NAME" --arg p "$BOARD_PREFIX" \
  --arg d "Dogfooding the build. Cards mined from the design docs (now in docs/v2-spec-inventory.md + docs/frontend-v2-status.md). Done = already shipped; In Progress = active or mocked; Review = needs verification; Backlog = not yet started or blocked on backend." \
  '{name:$n, prefix:$p, description:$d}')" | jq -r .id)"
ok "board $BOARD_ID"

# ── Columns ───────────────────────────────────────────────────────────────────
say "Create columns"
col() {
  local name=$1 pos=$2
  api POST "/boards/$BOARD_ID/columns" "$(jq -n --arg n "$name" --argjson p "$pos" '{name:$n, position:$p}')" | jq -r .id
}
COL_BACKLOG="$(col 'Backlog' 0)"
COL_INPROG="$(col 'In Progress' 1)"
COL_REVIEW="$(col 'Review' 2)"
COL_DONE="$(col 'Done' 3)"
ok "Backlog / In Progress / Review / Done"

# ── Epics ─────────────────────────────────────────────────────────────────────
say "Create epics (one per Parity Checklist phase + Backend Gaps + Polish)"
epic() {
  local name=$1 color=$2 pos=$3
  api POST "/boards/$BOARD_ID/epics" "$(jq -n \
    --arg n "$name" --arg c "$color" --argjson p "$pos" \
    '{name:$n, color:$c, position:$p}')" | jq -r .id
}
EP_P0="$(epic 'Phase 0 — Foundations'              '#5b5bd6' 0)"
EP_P1="$(epic 'Phase 1 — Board Shell'              '#0ea5e9' 1)"
EP_P2="$(epic 'Phase 2 — Kanban view'              '#16a34a' 2)"
EP_P3="$(epic 'Phase 3 — Right rail (3 tabs)'      '#f59e0b' 3)"
EP_P4="$(epic 'Phase 4 — Other views'              '#9333ea' 4)"
EP_P5="$(epic 'Phase 5 — Focus modal'              '#dc2626' 5)"
EP_P6="$(epic 'Phase 6 — Multiplayer presence'     '#ec4899' 6)"
EP_P7="$(epic 'Phase 7 — Polish'                   '#52525b' 7)"
EP_P8="$(epic 'Phase 8 — Backend additions'        '#a16207' 8)"
ok "9 epics"

# ── Cards ────────────────────────────────────────────────────────────────────
say "Create cards"

# card EPIC COLUMN PRIORITY TYPE LABELS TITLE DESCRIPTION
card() {
  local epic=$1 col=$2 pri=$3 typ=$4 labels=$5 title=$6 desc=$7
  api POST "/boards/$BOARD_ID/cards" "$(jq -n \
    --arg col "$col" --arg ep "$epic" --arg pri "$pri" --arg typ "$typ" \
    --arg lbl "$labels" --arg t "$title" --arg d "$desc" \
    '{column_id:$col, epic_id:$ep, priority:$pri, card_type:$typ, labels:$lbl, title:$t, description:$d}')" > /dev/null
  printf '.'
}

# ── Phase 0 — Foundations (DONE) ─────────────────────────────────────────────
card "$EP_P0" "$COL_DONE" medium task "frontend,theme" \
  "Theme system: Day / Mono / Paper" \
  "Three theme palettes implemented as CSS custom properties on :root[data-theme]. Switches live via the topbar swatches. Persisted to localStorage. See src/index.css."

card "$EP_P0" "$COL_DONE" low task "frontend" \
  "Fonts: Inter / JetBrains Mono / Geist Mono" \
  "Google Fonts <link> tags in index.html. Mono theme uses JetBrains Mono throughout per the spec."

card "$EP_P0" "$COL_DONE" medium task "frontend,helpers" \
  "Shared helpers: time, positions, pack-rows, theme" \
  "src/lib/{time,positions,pack-rows,theme}.ts. fmtDue/fmtAgo/fmtDate for date display; positionAfter/positionBefore for drag-drop ordering; packRows for Timeline lane packing; applyTheme + persistTheme + getStoredTheme."

card "$EP_P0" "$COL_DONE" medium task "frontend,primitives" \
  "Primitives: UserChip, AgentChip, AssigneeChip, PresenceDot, PresenceCluster, PriorityIndicator, EpicChip, KeyHint" \
  "8 atoms in src/components/board/primitives/. Pure prop-in JSX-out, theme-variable-driven."

card "$EP_P0" "$COL_DONE" medium task "frontend,mocks" \
  "Mock data files for all unbacked features" \
  "src/mock/{users,agents,presence,telemetry,transcripts,activity,proposals,suggestions,subtasks,inbox}.ts. Each will be swapped for a real API call when the corresponding endpoint exists."

card "$EP_P0" "$COL_DONE" medium task "frontend" \
  "boardUIStore (Zustand) for view/grouping/filter/selection/console/rail/search" \
  "src/stores/boardUIStore.ts. Persists consoleOpen and railTab to localStorage."

# ── Phase 1 — Board Shell (DONE) ──────────────────────────────────────────────
card "$EP_P1" "$COL_DONE" medium task "frontend,shell" \
  "Board.tsx (top-level shell + keyboard shortcuts)" \
  "Sidebar + main column + right rail layout. Mounts theme restoration and F/Esc/C/⌘K global handlers. Loads boards on mount and picks the first as active."

card "$EP_P1" "$COL_DONE" medium task "frontend,shell" \
  "BoardSidebar (200px workspace + nav + boards + saved views + user chip)" \
  "Inbox / My Issues / AI Suggestions rows (counts mock). Boards list from store. 3 placeholder saved views. Current user chip at bottom."

card "$EP_P1" "$COL_DONE" medium task "frontend,shell" \
  "BoardTopBar (44px + ThemeSwitcher + PresenceCluster + Console toggle)" \
  "Breadcrumb + count, presence cluster (mock), inline ThemeSwitcher with 3 swatches, search pill, New Issue button, Console toggle showing working/total agent count."

card "$EP_P1" "$COL_DONE" medium task "frontend,shell" \
  "BoardFilterRow (grouping segments + filter chips + view switcher)" \
  "Group by Status/Priority/Epic/Assignee/Due, filter chips All/Mine/Agents, and the 4-button view switcher (Kanban/Timeline/Terminal/Dispatch)."

card "$EP_P1" "$COL_DONE" low task "frontend,shell" \
  "BoardAISuggestionStrip (28px gradient with top suggestion)" \
  "Sparkles icon + suggestion text + Apply/Dismiss. Hidden when no suggestions; currently always populated by MOCK_SUGGESTIONS."

card "$EP_P1" "$COL_DONE" medium task "frontend,shell" \
  "BoardRightRail (340px) — orchestrates CardDetail vs rail tabs" \
  "Slides in when consoleOpen or selectedCardId. Shows CardDetailPanel for selected, otherwise RailTabs + Console/Activity/Plans panel."

# ── Phase 2 — Kanban view (DONE) ──────────────────────────────────────────────
card "$EP_P2" "$COL_DONE" high task "frontend,views" \
  "KanbanCard (dense card, reused by KanbanView + DispatchView)" \
  "src/components/board/cards/KanbanCard.tsx. Priority indicator + HAUL-N + BUG label + presence cluster + comment count + assignee + title + epic + estimate + due. Selected state with accent ring. Draggable via @dnd-kit."

card "$EP_P2" "$COL_DONE" high task "frontend,views" \
  "KanbanView with 5 grouping modes (status/priority/epic/assignee/due)" \
  "Client-side grouping + filtering + search. DndContext + per-column droppables. Drop handler updates the right field per grouping mode using positionAfter/Before."

card "$EP_P2" "$COL_DONE" medium task "frontend,views" \
  "CardDetailPanel (right-rail card detail)" \
  "44px header (Focus + Close), 2-column metadata grid, agent activity section (mock), AI suggested section (mock). Wired into BoardRightRail."

# ── Phase 3 — Right rail (DONE, mostly mocked) ────────────────────────────────
card "$EP_P3" "$COL_DONE" medium task "frontend,rail" \
  "RailTabs 3-segment control" \
  "Console / Activity / Plans. Each segment shows live count from mocks (working agents / activity events / pending proposals)."

card "$EP_P3" "$COL_INPROG" medium task "frontend,rail,mocked" \
  "ConsoleRail — UI built, data mocked" \
  "Live-feel presence panel: active/idle sections, agent transcripts cycling every 3.2s, load bars color-graded. All data from MOCK_TELEMETRY + MOCK_TRANSCRIPTS. Converts to ✅ when agent-telemetry endpoint exists."

card "$EP_P3" "$COL_INPROG" medium task "frontend,rail,mocked" \
  "ActivityRail — UI built, data mocked" \
  "Filter chips (All/Agents/Comments/Ships), 3 time buckets (Just now / Earlier today / Yesterday+), fade-in on freshest event. Data from MOCK_ACTIVITY. Converts to ✅ when activity feed endpoint exists."

card "$EP_P3" "$COL_INPROG" medium task "frontend,rail,mocked" \
  "PlansRail — UI built, actions stubbed" \
  "Proposals queue with pending/decided sections, expandable proposal cards with action lists, status pills, confidence%. Approve/Reject/Edit fire alert() stubs until proposals domain exists."

# ── Phase 4 — Other views (DONE) ──────────────────────────────────────────────
card "$EP_P4" "$COL_DONE" medium task "frontend,views" \
  "TimelineView with lane packing + drag-to-reschedule" \
  "200px lane labels + 17-day horizontal axis. Greedy row packing avoids card overlap. Drag between lanes reassigns; drag along x-axis reschedules due_date via PUT /cards/:cid."

card "$EP_P4" "$COL_DONE" medium task "frontend,views" \
  "TerminalView (monospace ASCII table)" \
  "Box-drawing section headers + per-card row with HAUL-N, [Pn], [TSK|BUG], title, assignee (~user / @agent), live dot, estimate, due. Click to select. Blinking cursor at bottom."

card "$EP_P4" "$COL_DONE" medium task "frontend,views" \
  "DispatchView (fleet bar + 4 prioritised sections)" \
  "Fleet bar shows MOCK_AGENTS with load bars and live/idle state. Hot (overdue+urgent) is filter-only; In Flight / Ready / Queue accept drops to change column."

# ── Phase 5 — Focus modal (DONE, subtasks localStorage) ───────────────────────
card "$EP_P5" "$COL_DONE" medium task "frontend,overlays" \
  "FocusModal shell + F / Esc shortcuts" \
  "Fullscreen portal modal, backdrop blur, mark-shipped button (writes to Done column)."

card "$EP_P5" "$COL_INPROG" low task "frontend,overlays,mocked" \
  "Focus subtasks via localStorage" \
  "Per-card key taskhauler.subtasks.<cardId>, seeded from MOCK_SUBTASKS. Won't sync across browsers/users. Converts to ✅ when subtasks endpoint exists."

# ── Phase 6 — Multiplayer presence (mocked) ───────────────────────────────────
card "$EP_P6" "$COL_INPROG" medium task "frontend,presence,mocked" \
  "Presence avatars on cards" \
  "Renders from MOCK_PRESENCE — fixed mapping of presence entries to cards. Converts to ✅ when realtime presence (WebSocket/SSE) exists."

card "$EP_P6" "$COL_INPROG" medium task "frontend,presence,mocked" \
  "Top-bar presence cluster" \
  "Self (real, from /auth/me) + mock collaborators. Pulsing action-color dots. Converts to ✅ when realtime presence exists."

card "$EP_P6" "$COL_BACKLOG" low task "frontend,presence,blocked" \
  "Send local presence updates" \
  "No-op currently. Will throttle to ~1/sec via the WebSocket once that endpoint exists."

# ── Phase 7 — Polish ──────────────────────────────────────────────────────────
card "$EP_P7" "$COL_DONE" low task "frontend,polish" \
  "Keyboard shortcuts: F (focus), Esc (close)" \
  "Wired in Board.tsx. C / ⌘K / J / K / ? are no-op placeholders."

card "$EP_P7" "$COL_BACKLOG" low task "frontend,polish" \
  "URL persistence for view / grouping / filterAssignee / selected" \
  "Currently only the active board is in the URL hash (legacy v1 pattern). Sync the rest of boardUIStore state to URL query params."

card "$EP_P7" "$COL_DONE" low task "frontend,polish" \
  "localStorage persistence (theme, consoleOpen, railTab, subtasks)" \
  "Theme, console toggle, rail tab, and per-card subtasks all persist to localStorage."

card "$EP_P7" "$COL_DONE" low task "frontend,polish" \
  "Animations: presence-pulse, fade-in, blink" \
  "Defined as @keyframes in src/index.css. Used by presence dots, freshest activity event, and Terminal view's prompt cursor."

card "$EP_P7" "$COL_BACKLOG" medium task "frontend,polish,a11y" \
  "Accessibility pass" \
  "All interactives are <button>; aria-labels on icon-only buttons; aria-current on active sidebar/segment; focus-visible rings; screen-reader announcement on card-detail open."

card "$EP_P7" "$COL_BACKLOG" medium task "frontend,polish" \
  "Error states + toast system" \
  "Currently rail actions use alert(). Replace with proper toast component. Add optimistic-revert pattern for failed card mutations."

card "$EP_P7" "$COL_BACKLOG" low task "frontend,polish" \
  "Empty states for boards / agents / activity / proposals" \
  "Today the rail panels are always populated thanks to mocks. Once real endpoints exist, polish empty-state copy for first-time users."

# ── Phase 8 — Backend additions ───────────────────────────────────────────────
card "$EP_P8" "$COL_BACKLOG" high task "backend,backend-gap" \
  "GET /api/v1/users (list users)" \
  "Unblocks the assignee picker and sidebar user list. Half an hour of work — the users table already exists. Returns [{id,email,display_name,is_admin,created_at}]."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "comment_count on card list response" \
  "Denormalise comment count on GET /boards/:id/cards so the KanbanCard chrome can show counts without N+1 fetches."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "Card schema additions: estimate, progress, blocked_by" \
  "Frontend currently derives mock estimates from card.id hash. Adding real fields unblocks Timeline workload bars and Focus-modal progress."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "Subtasks domain (table + CRUD endpoints)" \
  "Subtask{id, card_id, text, done, position, ...}. GET/POST under /cards/:id/subtasks; PATCH/DELETE on /subtasks/:id. Converts FocusModal subtasks from localStorage → server-synced."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "Agent registry endpoint" \
  "GET /api/v1/agents → [{name, type, plugin, model, description}]. Open question: backend owns the table, or agents self-register, or federate from teamagentica. Unblocks Dispatch fleet bar and assignee picker."

card "$EP_P8" "$COL_BACKLOG" high task "backend,backend-gap" \
  "Activity feed endpoint" \
  "GET /api/v1/boards/:id/activity?since=<ts>&kind=...&limit=50 → ActivityEvent[]. Add activity_events table, emit on card mutations. Converts ActivityRail mocks → real."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "Agent telemetry endpoint (+ optional SSE stream)" \
  "GET /agents/telemetry + GET /agents/:name/transcript. Requires the agent runtime to emit events on every significant action. Hardest because runtime-coupled."

card "$EP_P8" "$COL_BACKLOG" medium task "backend,backend-gap" \
  "Proposals domain (CRUD + transactional execute)" \
  "Most novel feature: agents and humans can propose multi-step plans (priority/move/label/split/ping/archive/assign/due). Approval executes all actions atomically. Multi-day work."

card "$EP_P8" "$COL_BACKLOG" low task "backend,backend-gap,infra" \
  "Presence (WebSocket or SSE)" \
  "WS /api/v1/boards/:id/presence with snapshot + update + leave messages, scoped per board, with TTL on entries. Polling fallback also acceptable for v1."

card "$EP_P8" "$COL_BACKLOG" low task "backend,backend-gap" \
  "AI suggestions endpoint" \
  "GET /boards/:id/suggestions + /cards/:id/suggestions. Generates from LLM call on a schedule or event. Cache server-side."

printf '\n'

# ── Done ──────────────────────────────────────────────────────────────────────
say "Created board $BOARD_ID"
echo ""
echo "  Open it at:"
echo "    http://taskhauler.localhost/#$(echo "$BOARD_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
echo "    http://taskhauler.localhost/    (then pick \"$BOARD_NAME\" from the sidebar)"
echo ""
