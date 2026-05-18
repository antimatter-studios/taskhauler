# Taskhauler v2 — Canonical Implementation Inventory

Scope: every file under `/Volumes/sdcard256gb/projects/taskhauler/frontend-v2/src/` plus `index.html`. Build is clean (`tsc -b && vite build` exits 0, 1634 modules, 349.5 kB JS / 30.4 kB CSS).

---

## IMPL-001: index.html

**Lines:** 23
**Exports:** —
**Implements:**
- Hardcodes `data-theme="day"` on `<html>` so first paint is day theme (before JS).
- Favicon is an inline SVG data-URL: indigo rounded square with white "T" pictograph.
- Preconnects to fonts.googleapis.com + fonts.gstatic.com, loads Inter, JetBrains Mono, Geist Mono.
- Mounts `<div id="root">` and `<script type="module" src="/src/main.tsx">`.

**Hardcoded / mock / stub:**
- Favicon color `#5b5bd6` is hardcoded to the day-theme accent — won't recolor for mono/paper themes.

**Looks incomplete or wrong:**
- Title is "Taskhauler v2" — fine, but no `<meta name="description">`.

**File reference:** `frontend-v2/index.html:1`

---

## IMPL-002: src/main.tsx

**Lines:** 17
**Exports:** —
**Implements:**
- StrictMode root render at `#root`.
- Adds `dark` class to `<html>` "as belt-and-braces measure" — but the v2 theme system is `data-theme` based, not `dark` class.

**Looks incomplete or wrong:**
- MISMATCH: comment says "default to dark mode" but theme is selected via `data-theme` attribute (set by `applyTheme`); the `.dark` class does nothing in this codebase (Tailwind 4 + custom `data-theme` rules). Dead.

**File reference:** `frontend-v2/src/main.tsx:8`

---

## IMPL-003: src/App.tsx

**Lines:** 45
**Exports:** default `App`
**Reads from store:** `authStore` (user, fetchMe), `lib/theme` (applyTheme, getStoredTheme).
**Implements:**
- Two useEffects: (1) restore theme from localStorage on mount, (2) `fetchMe()` then setBooted(true).
- While `!booted` renders "Loading…" centered, `font-size: 13px`.
- When booted and no user → `<LoginForm />`.
- When user present → `<Board />`.

**File reference:** `frontend-v2/src/App.tsx:7`

---

## IMPL-004: src/index.css

**Lines:** 223
**Exports:** CSS only.
**Implements:**
- `@theme inline` block maps Tailwind v4 color tokens to CSS variables (--bg, --surface, --hover, --border, --border-hi, --text, --text-2, --text-3, --accent, --accent-bg, --accent-fg, --red, --amber, --green).
- Three themes via `data-theme`:
  - **day:** bg `#fafaf9`, surface `#ffffff`, accent `#5b5bd6`, radius 6px, Inter font.
  - **mono:** bg `#0c0c0a`, surface `#15140f`, accent `#facc15` (amber), radius 2px, JetBrains Mono. Sets `--shadow-rest: none` and `--shadow-hover: none` (1px borders only).
  - **paper:** bg `#f5f0e2`, surface `#fbf7e9`, accent `#9a3412` (burnt orange), radius 4px, Inter font.
- Animations: `presence-pulse` (1.6s, scales 1→1.4), `fade-in` (translateY 4px → 0, opacity 0→1), `blink` (1s steps).
- Base layer applies `border-color: var(--border)` to all `*, ::before, ::after, ::backdrop, ::file-selector-button`.
- Body font-size: 13px, line-height 1.5, antialiased.
- Custom 8px-wide scrollbars using `--border` and `--border-hi`.

**File reference:** `frontend-v2/src/index.css:1`

---

## IMPL-005: src/lib/utils.ts

**Lines:** 6
**Exports:** `cn(...inputs)`
**Implements:** Standard shadcn-style `twMerge(clsx(...))` helper.
**File reference:** `frontend-v2/src/lib/utils.ts:4`

---

## IMPL-006: src/lib/time.ts

**Lines:** 88
**Exports:** `fmtDue`, `fmtAgo`, `fmtDate`, `DueInfo`.
**Implements:**
- `fmtDue(ts)`: returns `{ txt, overdue, soon }`. Buckets — overdue → "Nd ago"; today (days===0) → "today" (soon=true); 1≤days≤2 → "in Nd" (soon=true); 3≤days<7 → "Mon 12"; ≥7 → "Feb 3"; null → empty/false/false.
- `fmtAgo(ts)`: never negative — `Math.max(0, ...)`. Returns `Ns`/`Nm`/`Nh`/`Nd`.
- `fmtDate(ts)`: full `toLocaleString` with month/day/year/hour/minute.
- `MS_PER_DAY = 86_400_000`.

**File reference:** `frontend-v2/src/lib/time.ts:29`

---

## IMPL-007: src/lib/theme.ts

**Lines:** 48
**Exports:** `ThemeName` (`"day" | "mono" | "paper"`), `THEMES`, `applyTheme`, `getStoredTheme`, `persistTheme`.
**Implements:**
- Reads/writes localStorage key `"taskhauler.theme"`, default `"day"`.
- `applyTheme(name)` sets `data-theme` attribute on `document.documentElement`.
- Safe in SSR (no-ops if `document`/`localStorage` undefined).
- Validator function `isThemeName` rejects unknowns.

**File reference:** `frontend-v2/src/lib/theme.ts:23`

---

## IMPL-008: src/lib/positions.ts

**Lines:** 40
**Exports:** `positionAfter(items)`, `positionBefore(items, idx)`.
**Implements:**
- Empty list → 1000.
- After last → `lastPos + 1000`.
- Before idx=0 → `firstPos - 1000`.
- Between → midpoint `(a + b) / 2`.
- Float-based, never need renumbering.
**File reference:** `frontend-v2/src/lib/positions.ts:20`

---

## IMPL-009: src/lib/pack-rows.ts

**Lines:** 51
**Exports:** `packRows<T extends {x, width}>(items)`.
**Implements:**
- Greedy "fewest tracks" row packing.
- Sort by `x` ascending (stable on original index).
- For each item, pick lowest-indexed row whose rowEnd ≤ x; else open new row.
- Returns `number[]` of row indices in caller's input order.
**File reference:** `frontend-v2/src/lib/pack-rows.ts:21`

---

## IMPL-010: src/api/types.ts

**Lines:** 124
**Exports:** `Board`, `Column`, `Epic`, `Card`, `Comment`, `User`, `UserDetails`, `RegistryAlias`, `AuthResponse`, `CreateCardRequest`, `UpdateCardRequest`.
**Implements:**
- Mirrors backend types verbatim. All timestamps are ms.
- `Card.priority` is `"low" | "medium" | "high" | "urgent" | ""`.
- `Card.card_type` is `"task" | "bug" | ""`.
- `Card.assignee_id: number` (0 = unassigned) and `Card.assignee_agent: string` ("" = none).
- `UpdateCardRequest` has `clear_epic`, `clear_assignee`, `clear_due` flag fields.

**Hardcoded / mock / stub:**
- No `estimate`, `comment_count`, `blocked_by` fields — these get faked elsewhere.

**File reference:** `frontend-v2/src/api/types.ts:33`

---

## IMPL-011: src/api/client.ts

**Lines:** 238
**Exports:** `apiClient` (`tasks`, `auth`, `users`).
**External libs:** native fetch.
**Implements:**
- Base URL: `VITE_API_BASE_URL` env or `http://taskhauler.localhost/api/v1`.
- localStorage keys: `taskhauler_token`, `taskhauler_refresh_token`.
- 401 retry: tries one refresh via `/auth/refresh`, then clears storage and throws `ApiError("unauthorized", 401)`.
- Singleton `refreshing` promise prevents stampede.
- 204 / empty body returns `undefined as T`.
- ApiError class extends `Error` with `status`.
- `tasks` covers boards, columns, epics, cards (CRUD + search by query string + getByNumber), comments.
- `auth.login` writes both tokens to localStorage on success. `auth.logout` is fire-and-forget POST + storage clear.
- `users.listUsers` calls `/users` (may 404 — userStore tolerates).

**File reference:** `frontend-v2/src/api/client.ts:88`

---

## IMPL-012: src/stores/authStore.ts

**Lines:** 51
**Exports:** `useAuthStore`.
**Implements:**
- `user`, `loading`, `error`.
- `login(email, password)` calls client, sets user or rethrows after capturing error.
- `logout()` calls `apiClient.auth.logout()` + clears user.
- `fetchMe()` short-circuits if `!isAuthenticated()`, else calls `/auth/me`.

**File reference:** `frontend-v2/src/stores/authStore.ts:15`

---

## IMPL-013: src/stores/kanbanStore.ts

**Lines:** 146
**Exports:** `useKanbanStore`.
**Implements:**
- State: `boards`, `columns`, `epics`, `cards`, `activeBoardId`, `loading` (init true), `error`.
- Board CRUD: `fetchBoards`, `createBoard`, `updateBoard`, `setActiveBoard`.
- `fetchBoard(boardId)` does `Promise.all([listColumns, listEpics, listCards])`; epics call has `.catch(() => [])` — tolerates 404.
- Column/epic/card CRUD all flow through `apiClient`.
- `deleteEpic` also clears `epic_id` on affected cards locally.
- `setCards(fn)` and `setColumns(fn)` are mutator escape hatches for optimistic updates.
- Comments: list/create/delete pass-through.

**Looks incomplete or wrong:**
- No optimistic-update logic for drag-drop in the store — views call `updateCard` and wait for server response before state updates. No error UI for failed `updateCard`.

**File reference:** `frontend-v2/src/stores/kanbanStore.ts:48`

---

## IMPL-014: src/stores/boardUIStore.ts

**Lines:** 115
**Exports:** `useBoardUIStore`, `ViewName`, `GroupingMode`, `FilterMode`, `RailTab`.
**Implements:**
- State: `view`, `grouping`, `filterAssignee`, `consoleOpen`, `railTab`, `selectedCardId`, `focusedCardId`, `searchQuery`.
- Persists `consoleOpen` to `taskhauler.console-open` and `railTab` to `taskhauler.rail-tab` (other state is session-only).
- Setters: `setView`, `setGrouping`, `setFilter` (note: not `setFilterAssignee`), `setConsoleOpen`, `toggleConsole`, `setRailTab`, `selectCard` (note: not `setSelectedCardId`), `focusCard` (note: not `setFocusedCardId`), `setSearchQuery`.
- Default view: `kanban`, grouping: `col`, filterAssignee: `all`, railTab: `console` (or persisted), consoleOpen: `true` (or persisted).

**Looks incomplete or wrong:**
- **CRITICAL NAMING MISMATCH:** The store exports `setFilter`, `selectCard`, `focusCard` — but several callers (Board.tsx, BoardRightRail.tsx, BoardFilterRow.tsx) try to read non-existent `setFilterAssignee`, `setSelectedCardId`, `setFocusedCardId` via `(s as any).X` and get `undefined`. The `?.()` optional-call swallows the error silently. **Affected features are broken at runtime even though TS doesn't catch them.**

**File reference:** `frontend-v2/src/stores/boardUIStore.ts:75`

---

## IMPL-015: src/stores/userStore.ts

**Lines:** 28
**Exports:** `useUserStore`.
**Implements:** `fetch()` calls `apiClient.users.listUsers()`; on any error sets `users: []` and error=null. Comment notes the endpoint may not exist yet.

**File reference:** `frontend-v2/src/stores/userStore.ts:15`

---

## IMPL-016: src/stores/agentStore.ts

**Lines:** 18
**Exports:** `useAgentStore`.
**Implements:** Always returns `aliases: []`. Comment: "Taskhauler has no agent registry — return empty list so the assignee autocomplete falls back to free-form typing."

**Hardcoded / mock / stub:**
- Permanent stub — never makes an HTTP call.

**File reference:** `frontend-v2/src/stores/agentStore.ts:13`

---

## IMPL-017: src/mock/inbox.ts

**Lines:** 3
**Exports:** `MOCK_INBOX = 7`.
**Implements:** Constant integer 7. Used by sidebar for inbox count.
**Hardcoded / mock / stub:** Literally the number 7 — no underlying data.
**File reference:** `frontend-v2/src/mock/inbox.ts:3`

---

## IMPL-018: src/mock/users.ts

**Lines:** 64
**Exports:** `MOCK_USERS: MockUser[]` (5 entries — Mira/Theo/Sana/Jules/Wren with ids 101–105), `MockUser` extends `UserDetails` with `handle`, `avatar` (initials), `hue`.
**Implements:** Hues drive `oklch(0.7 0.13 <hue>)` background and `oklch(0.25 0.05 <hue>)` foreground in UserChip.
**File reference:** `frontend-v2/src/mock/users.ts:23`

---

## IMPL-019: src/mock/agents.ts

**Lines:** 60
**Exports:** `MOCK_AGENTS: MockAgent[]` (6 agents: relay, scout, atlas, oracle, vega, pylon). Each has `name`, `plugin` (anthropic/openai/google), `model`, `description`, `status` ("working" | "idle").
**Implements:** Currently 4 working (relay, scout, oracle, pylon) / 2 idle (atlas, vega).
**File reference:** `frontend-v2/src/mock/agents.ts:17`

---

## IMPL-020: src/mock/telemetry.ts

**Lines:** 78
**Exports:** `MOCK_TELEMETRY: AgentTelemetry[]` (6 entries — one per MOCK_AGENT).
**Implements:** Per-agent `status`, `load` (0..1), `tok` (tokens/min), `step` (one-liner or null), `current_card_id` (placeholder ids like `"mock-card-2"`), `last_act` (ms).
**File reference:** `frontend-v2/src/mock/telemetry.ts:23`

---

## IMPL-021: src/mock/transcripts.ts

**Lines:** 79
**Exports:** `MOCK_TRANSCRIPTS: Record<string, AgentTranscriptLine[]>` — keyed by agent name, 8 lines per agent for all 6 mock agents.
**Implements:** Each line `{agent, ts, text}` with timestamps relative to `Date.now()` at module load. Atlas/vega lines are old (47+ minutes ago) reflecting idle state.
**File reference:** `frontend-v2/src/mock/transcripts.ts:18`

---

## IMPL-022: src/mock/presence.ts

**Lines:** 108
**Exports:** `MOCK_PRESENCE: PresenceEntry[]` (9 entries: 5 users pr1-pr5, 4 agents pr6-pr9). `PresenceAction`, `PresenceKind`, `PresenceEntry`.
**Implements:** Each entry has `kind`, `user_id` xor `agent_name`, `action`, `card_id` (placeholder or null), `at`.
- Active actions: pr1 viewing, pr2 editing, pr3 commenting, pr4 viewing, pr6 working, pr7 working, pr8 scanning. Idle: pr5, pr9.
**File reference:** `frontend-v2/src/mock/presence.ts:35`

---

## IMPL-023: src/mock/activity.ts

**Lines:** 222
**Exports:** `MOCK_ACTIVITY: ActivityEvent[]` (20 entries a1–a20), `ActivityKind` (8 kinds), `ActivityEvent`.
**Implements:**
- Span all three time buckets: 7 entries < 30min ("just now"), 7 in 0.5–8h ("earlier today"), 6 > 8h ("yesterday+").
- BUT: comment at top says cutoff is 0.5h/8h/yesterday — ActivityRail body code uses 0.5h/8h thresholds as well. Match.
- All reference `mock-card-1` … `mock-card-14` placeholders.

**Looks incomplete or wrong:**
- MISMATCH: top-of-file comment says "just now" is `< 30 minutes` but mock entry a7 is at 28 min and a8 is at 1.1h — boundary works. Header inside ActivityRail uses `< 0.5` hours = 30 min. Consistent.

**File reference:** `frontend-v2/src/mock/activity.ts:36`

---

## IMPL-024: src/mock/proposals.ts

**Lines:** 154
**Exports:** `MOCK_PROPOSALS: Proposal[]` (6 entries p1–p6). `ProposalStatus`, `ProposalAction` (8 kinds: priority/move/label/split/ping/archive/assign/due), `Proposal`.
**Implements:** 3 pending (p1/p2/p3), 2 approved (p4/p5), 1 rejected (p6 with rejection reason).
**File reference:** `frontend-v2/src/mock/proposals.ts:47`

---

## IMPL-025: src/mock/suggestions.ts

**Lines:** 58
**Exports:** `MOCK_SUGGESTIONS: Suggestion[]` (5 entries s1–s5). `SuggestionKind` (promote/split/assign/escalate/archive/link).
**Implements:** Each has `text`, optional `card_id` placeholder, optional `reason`. s5 has no card_id (board-level).
**File reference:** `frontend-v2/src/mock/suggestions.ts:23`

---

## IMPL-026: src/mock/subtasks.ts

**Lines:** 41
**Exports:** `MOCK_SUBTASKS: Record<string, Subtask[]>`. Keyed by mock-card-N. Only 4 cards seeded (mock-card-1/2/3/4) with 3–6 subtasks each.
**Implements:** Each subtask `{id, card_id, text, done, position}`.
**File reference:** `frontend-v2/src/mock/subtasks.ts:14`

---

## IMPL-027: src/mock/README.md

**Lines:** 48
**Implements:** Documents the strategy ("render every panel at full visual fidelity"), file table, the `mock-card-N` placeholder remapping convention, rules for adding new mocks.
**File reference:** `frontend-v2/src/mock/README.md:1`

---

## IMPL-028: src/components/LoginForm.tsx

**Lines:** 177
**Exports:** default `LoginForm`.
**Reads from store:** `authStore` (login, loading, error).
**Implements:**
- Centered card on `var(--bg)`. 320px max width.
- Email + password inputs (height 32, padding 0 10).
- Error block in red color-mix when `error`.
- Disabled submit when loading or empty fields.
- DEV-only hint block: "admin@taskhauler.localhost / admin".
**File reference:** `frontend-v2/src/components/LoginForm.tsx:4`

---

## IMPL-029: src/components/board/Board.tsx

**Lines:** 128
**Exports:** default `Board`.
**Reads from store:** `boardUIStore` (selectedCardId, focusedCardId, **(s as any).setFocusedCardId**), `kanbanStore` (fetchBoards, fetchBoard, setActiveBoard, activeBoardId).
**Implements:**
- Top-level shell: flex h-screen w-screen, sidebar / main / right-rail / FocusModal.
- Inner main col: BoardTopBar + BoardFilterRow + BoardAISuggestionStrip + view-slot (overflow-auto, hosts `<ViewSwitcher activeBoardId>`).
- 3 useEffects: theme restore on mount; load boards on mount (eslint-disable exhaustive-deps); load board content when activeBoardId changes.
- Global keydown: Esc (clears focusedCardId), ⌘K (console.log no-op), F (focus selected card if any), C (console.log no-op). Skips if focus is in INPUT/TEXTAREA/contenteditable.
- Theme restore is duplicated here AND in App.tsx (belt-and-braces).

**Hardcoded / mock / stub:**
- ⌘K shortcut: `console.log("[shortcut] ⌘K search (no-op)")` — not wired.
- C shortcut: `console.log("[shortcut] C new issue (no-op)")` — not wired.

**Looks incomplete or wrong:**
- **BUG:** `setFocusedCardId` is undefined on the store (store exports `focusCard`). Optional-call swallows it silently. **F key + Esc focus reset are no-ops at runtime.**
- eslint-disable on first useEffect's empty deps.

**File reference:** `frontend-v2/src/components/board/Board.tsx:21`

---

## IMPL-030: src/components/board/BoardSidebar.tsx

**Lines:** 228
**Exports:** default `BoardSidebar`.
**Reads from store/mock:** `authStore` (user), `kanbanStore` (boards, activeBoardId, setActiveBoard, cards), `MOCK_INBOX`, `MOCK_SUGGESTIONS`.
**Implements:**
- 200px-wide flex-0-0-200px aside. Padding 12, gap 4.
- Workspace switcher: 22×22 indigo→purple linear-gradient tile with "T", label "Taskhauler", ChevronDown — no onClick wired.
- NavRows: Inbox (count MOCK_INBOX), My issues (`cards.filter(c.assignee_id === user.id).length`), AI suggestions (MOCK_SUGGESTIONS.length). NavRow has no onClick.
- Boards section: maps `boards` to buttons; active board has accent dot + surface bg + accent border-color and weight 600. Shows board.prefix in mono on right. Empty state: "No boards yet".
- Saved views: hardcoded `["Urgent + overdue", "Agent work in flight", "This week"]` — Filter-icon buttons with no onClick.
- Bottom: UserChip + user.display_name (or email).

**Hardcoded / mock / stub:**
- SAVED_VIEWS is a literal array — no persistence, no apply logic.
- Workspace switcher (Taskhauler) button has no onClick.
- NavRow buttons (Inbox/My issues/AI suggestions) have no onClick.

**File reference:** `frontend-v2/src/components/board/BoardSidebar.tsx:8`

---

## IMPL-031: src/components/board/BoardTopBar.tsx

**Lines:** 243
**Exports:** default `BoardTopBar`.
**Reads from store/mock:** `kanbanStore` (boards, activeBoardId, cards), `boardUIStore` (consoleOpen, **(s as any).setConsoleOpen** ✓, searchQuery, **(s as any).setSearchQuery** ✓), `MOCK_PRESENCE`, `MOCK_AGENTS`, `lib/theme`.
**Implements:**
- 44px tall, 0 14px padding, var(--surface) bg, 1px bottom border.
- Breadcrumb: active board name / "All issues" / "· N of N" (currently `filtered === cards` since "filter logic lives in the views layer").
- Right cluster: PresenceCluster (first 5 entries, size 24, showLabel), ThemeSwitcher, SearchPill (height 28, width 220, ⌘K hint), "New issue" button with `<Plus>` and C KeyHint (no onClick wired), Console toggle button.
- Console button: shows pulsing green dot, "Console" label, mono `working/total` count (filters MOCK_AGENTS by `.status === "working"`). Toggles `consoleOpen`.
- ThemeSwitcher: 3 swatches (day/mono/paper). 22×22 each. Active = accent fill; inner 14×14 mini-square uses theme.bg + accent border + 6×6 accent dot.

**Hardcoded / mock / stub:**
- "New issue" button has no onClick.
- ThemeSwitcher palettes are inlined as literal hex values — duplicate of values in index.css (could drift).
- `presenceEntries as any` cast — types from `MOCK_PRESENCE` use `agent_name`/`user_id`/`at`, but PresenceCluster's local PresenceEntry interface uses `name`/`userId`/`action` only. Cast paves over the shape mismatch.

**Looks incomplete or wrong:**
- `filtered = cards` comment says "filter logic lives in the views layer" — so the "N of N" count is always "total of total".

**File reference:** `frontend-v2/src/components/board/BoardTopBar.tsx:14`

---

## IMPL-032: src/components/board/BoardFilterRow.tsx

**Lines:** 184
**Exports:** default `BoardFilterRow`.
**Reads from store:** `boardUIStore` (grouping, **(s as any).setGrouping** ✓; filterAssignee, **(s as any).setFilterAssignee** ✗ DOES NOT EXIST; view, **(s as any).setView** ✓).
**Implements:**
- 40px tall.
- Left: "Group" label + segmented control with 5 options. **BUT the IDs are `["status","priority","epic","assignee","due"]`** while store's `GroupingMode` type uses `"col" | "priority" | "epic" | "assignee" | "due"`. The control will write `"status"` into the store which the KanbanView treats as the empty default-case.
- Middle: "Filter" label + 3 chips (All / Mine / Agents). Agents chip has a pulsing green dot when active.
- Right: View switcher segmented control (Kanban / Timeline / Terminal / Dispatch) with lucide icons (Columns3 / GanttChart / Terminal / Network).

**Looks incomplete or wrong:**
- **CRITICAL BUG #1:** Group buttons send `"status"` but KanbanView checks for `"col"`. Clicking "Status" button gives the empty `return []` from `KanbanView`'s grouping function — board appears blank.
- **CRITICAL BUG #2:** `setFilterAssignee` doesn't exist on the store (store exposes `setFilter`). Filter chip buttons (All/Mine/Agents) do nothing at runtime.

**File reference:** `frontend-v2/src/components/board/BoardFilterRow.tsx:5`

---

## IMPL-033: src/components/board/BoardAISuggestionStrip.tsx

**Lines:** 68
**Exports:** default `BoardAISuggestionStrip`.
**Reads from mock:** `MOCK_SUGGESTIONS`.
**Implements:**
- 28px tall, gradient bg from accent-bg → bg.
- Renders only if MOCK_SUGGESTIONS has entries.
- Shows count + first suggestion text. Apply (filled accent) and Dismiss (transparent) buttons.
- Apply/Dismiss → `console.log(...)` only.

**Hardcoded / mock / stub:**
- Apply button: `console.log("[suggestion] apply", top?.id)` — explicit "not yet wired" comment at top.
- Dismiss button: `console.log("[suggestion] dismiss", top?.id)`.

**File reference:** `frontend-v2/src/components/board/BoardAISuggestionStrip.tsx:33`

---

## IMPL-034: src/components/board/BoardRightRail.tsx

**Lines:** 72
**Exports:** default `BoardRightRail`.
**Reads from store:** `boardUIStore` (selectedCardId, consoleOpen, **(s as any).setSelectedCardId** ✗ DOES NOT EXIST, railTab).
**Implements:**
- 340px wide, full-height aside on the right border.
- Renders nothing when both `consoleOpen === false && selectedCardId == null`.
- If a card is selected: shows CardDetailPanel; if console is also open, prepends a "← Back to console" link.
- Otherwise: RailTabs + the active tab's component (ConsoleRail/ActivityRail/PlansRail).

**Looks incomplete or wrong:**
- **BUG:** `setSelectedCardId` doesn't exist on store (store has `selectCard`). "Back to console" link is a runtime no-op.

**File reference:** `frontend-v2/src/components/board/BoardRightRail.tsx:19`

---

## IMPL-035: src/components/board/primitives/AgentChip.tsx

**Lines:** 54
**Exports:** default `AgentChip` (name, size=22, variant: default/terminal, working).
**Implements:**
- Hexagonal mono-letter avatar via `clipPath: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)`.
- Two palettes: default (bg #0f172a, fg #67e8f9, glow #22d3ee) and terminal (bg #facc15, fg #1c1917, glow #fde047).
- `working=true` adds `boxShadow: 0 0 0 1px <glow>, 0 0 8px <glow>55`.
- Letter = first char uppercase of name; "?" if no name.

**Hardcoded / mock / stub:**
- Palettes are hardcoded — no theming. Always cyan/yellow regardless of active theme.

**File reference:** `frontend-v2/src/components/board/primitives/AgentChip.tsx:22`

---

## IMPL-036: src/components/board/primitives/UserChip.tsx

**Lines:** 61
**Exports:** default `UserChip` (user, size=22).
**Implements:**
- Circular initials avatar.
- Hue from `user.hue` if present, else `hashHue(display_name)` (FNV-like rolling hash mod 360).
- `initials(displayName)` = first+last initial uppercase; single word → first 2 chars; empty → "?".
- Colors: `oklch(0.7 0.13 <hue>)` bg, `oklch(0.25 0.05 <hue>)` fg.
**File reference:** `frontend-v2/src/components/board/primitives/UserChip.tsx:37`

---

## IMPL-037: src/components/board/primitives/AssigneeChip.tsx

**Lines:** 50
**Exports:** default `AssigneeChip` (userId?, agentName?, size=22, working?).
**Reads from mock:** `MOCK_USERS`.
**Implements:** Dispatcher — agentName → AgentChip; userId>0 + MOCK_USERS hit → UserChip; else "?" dashed circle placeholder.
**File reference:** `frontend-v2/src/components/board/primitives/AssigneeChip.tsx:17`

---

## IMPL-038: src/components/board/primitives/EpicChip.tsx

**Lines:** 59
**Exports:** default `EpicChip` (epic, size: sm/md).
**Implements:**
- Pill with 6×6 epic.color dot + truncated name (max 16 chars + "…").
- bg: `color-mix(in srgb, <epic.color> 8%, var(--bg))`.
- border: `color-mix(in srgb, <epic.color> 35%, var(--border))`.
- `max-width: 140px`.

**Looks incomplete or wrong:**
- Long comment claims a data-theme-mono CSS attribute override exists but the code doesn't actually special-case mono.

**File reference:** `frontend-v2/src/components/board/primitives/EpicChip.tsx:20`

---

## IMPL-039: src/components/board/primitives/PresenceDot.tsx

**Lines:** 27
**Exports:** default `PresenceDot` (color, active=true).
**Implements:** Absolute-positioned 7×8px dot at bottom-right of parent. boxShadow `0 0 0 1.5px var(--surface)`. Pulses (1.6s) when active.
**File reference:** `frontend-v2/src/components/board/primitives/PresenceDot.tsx:12`

---

## IMPL-040: src/components/board/primitives/PresenceCluster.tsx

**Lines:** 122
**Exports:** default `PresenceCluster` (entries, maxShown=5, size=24, showLabel=false); `PresenceEntry` type (local, loose).
**Reads from mock:** `MOCK_USERS`.
**Implements:**
- Overlapping avatar stack, marginLeft: -7px per item after first.
- Each avatar wrapped with `boxShadow: 0 0 0 2px var(--surface)` ring.
- Active (`action !== "idle"`) entries get a colored PresenceDot. Color map: viewing→accent, editing/commenting→amber, working→green, scanning/idle/default→text-3.
- Overflow "+N" in mono after shown items.
- `showLabel` appends "N active" in mono.
- Tooltip = newline-joined "<name> — <action>" list.

**Looks incomplete or wrong:**
- `PresenceEntry` type here uses `name`/`userId` fields, but `MOCK_PRESENCE` uses `agent_name`/`user_id`. Callers cast `as any` (BoardTopBar) — duplicate type definition with subtle mismatch.

**File reference:** `frontend-v2/src/components/board/primitives/PresenceCluster.tsx:11`

---

## IMPL-041: src/components/board/primitives/PriorityIndicator.tsx

**Lines:** 62
**Exports:** default `PriorityIndicator` (priority?).
**Implements:**
- Returns null if no priority.
- urgent: 8×8 red square with 13% red color-mix outer ring.
- low/medium/high: three vertical bars 2.5px wide, heights `[4,4,4]`/`[4,7,4]`/`[4,7,10]`, fills `[1,0,0]`/`[1,1,0]`/`[1,1,1]`. Filled bar color: high→amber, others→text-2; empty bar→border-hi.
**File reference:** `frontend-v2/src/components/board/primitives/PriorityIndicator.tsx:13`

---

## IMPL-042: src/components/board/primitives/KeyHint.tsx

**Lines:** 29
**Exports:** default `KeyHint` (children).
**Implements:** Small `<kbd>` element, 16px height/min-width, mono font 10px, 2px bottom border (mock keycap), surface bg.
**File reference:** `frontend-v2/src/components/board/primitives/KeyHint.tsx:10`

---

## IMPL-043: src/components/board/cards/KanbanCard.tsx

**Lines:** 249
**Exports:** named `KanbanCard`, `KanbanCardProps`, re-export `PresenceEntry`.
**External libs:** `@dnd-kit/core` (useDraggable), `@dnd-kit/utilities` (CSS.Translate).
**Reads from primitives:** AssigneeChip, EpicChip, PresenceCluster, PriorityIndicator.
**Implements:**
- Draggable id = card.id, data: `{ type: "card", card }`.
- Card surface: var(--surface) bg, 1px border (accent when selected, else --border), shadow-rest/shadow-hover/selected-glow toggling via mouseEnter/Leave handlers that bail out if dragging or selected.
- Selected ring: `0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)`.
- Padding 8px 10px; gap 6; fontSize 12.
- Top row: PriorityIndicator, mono `PREFIX-N`, optional "● BUG" tag, right-aligned PresenceCluster (filtered to exclude the agent who is the assignee) + AssigneeChip (size 18).
- Title: line-clamp 2 via `-webkit-box`.
- Meta row: EpicChip + mono "Npt" estimate + dueText (red overdue / amber soon / text-3) right-aligned.
- 2px progress bar when 0 < mockProgress(id) < 1.

**Hardcoded / mock / stub:**
- `mockEstimate(id)`: `parseInt(id.slice(-2), 16) % 13 + 1`. NaN-safe (returns 3).
- `mockProgress(id)`: `parseInt(id.slice(-2), 16)`; if n%3===0 → 0; else `((n % 10) + 1) / 12`.
- `prefix` default "HAUL" — passed from views via board.prefix lookup.
- "blocked icon — Card type has no blocked_by field yet, so omitted." (comment).
- "comment count omitted — Card type has no count field yet." (comment).

**File reference:** `frontend-v2/src/components/board/cards/KanbanCard.tsx:36`

---

## IMPL-044: src/components/board/cards/TerminalRow.tsx

**Lines:** 165
**Exports:** named `TerminalRow`, `TerminalRowProps`.
**Implements:**
- Monospace row, no drag. Click to select.
- Layout: `│` + mono `PREFIX-N` (width 70) + `[P0/P1/P2/P3/--]` colored (width 28) + `[BUG]`/`[TSK]` (width 34) + flexible title + assignee `@agent` / `~userhandle` + optional "● live" green when agent working + `Npt` estimate (width 36) + due (width 70, prefixed `~` or `!`).
- Selected: accent-bg + 2px accent left border.
- Same `mockEstimate(id)` hash duplicated inline (comment says "Kept inline to avoid coupling: the views agent owns both files.").

**File reference:** `frontend-v2/src/components/board/cards/TerminalRow.tsx:28`

---

## IMPL-045: src/components/board/cards/TimelineBar.tsx

**Lines:** 154
**Exports:** named `TimelineBar`, `TimelineBarProps`.
**External libs:** `@dnd-kit/core` (useDraggable).
**Implements:**
- Absolutely positioned bar in parent lane. left/width/top/height from props.
- Border 1.5px: selected=accent, else overdue=red, else epic.color (or "#777" fallback).
- 3px epic.color stripe on the left edge.
- Pulsing green 5×5 dot if `isAgentWorking`.
- mono `PREFIX-N`, title text-ellipsis.
- P0 badge (red border, mono 9px) when priority === "urgent".
- Selected: heavier shadow `0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent)`.

**File reference:** `frontend-v2/src/components/board/cards/TimelineBar.tsx:30`

---

## IMPL-046: src/components/board/cards/DispatchAgentTile.tsx

**Lines:** 172
**Exports:** named `DispatchAgentTile`, `AgentInfo`, `AgentTelemetry`, `DispatchAgentTileProps`.
**Implements:**
- 220px-wide tile.
- Working agents: accent-bg fill + 33% accent border + 3px accent left stripe.
- AgentChip (22px) + `@name` mono + plugin sub.
- Status badge top-right: `● LIVE` (accent + accent surface) or `IDLE` (text-3 + transparent).
- Body: card title + mono `PREFIX-N` when working; agent description when idle. Height 26px clipped.
- Load bar (3px): width = load * 100%, color = accent when working else text-3.
- Mono "NN%" right-aligned.

**File reference:** `frontend-v2/src/components/board/cards/DispatchAgentTile.tsx:35`

---

## IMPL-047: src/components/board/views/index.ts

**Lines:** 9
**Exports:** re-exports `ViewSwitcher`, `KanbanView`, `TimelineView`, `TerminalView`, `DispatchView`.
**File reference:** `frontend-v2/src/components/board/views/index.ts:5`

---

## IMPL-048: src/components/board/views/ViewSwitcher.tsx

**Lines:** 24
**Exports:** named `ViewSwitcher`, `ViewSwitcherProps`.
**Implements:** Reads `view` from store; switches on `"kanban"|"timeline"|"terminal"|"dispatch"`. Default fallthrough returns null.
**Looks incomplete or wrong:**
- `activeBoardId` prop is unused (`_props`). Comment explicitly notes this is for future-proofing.

**File reference:** `frontend-v2/src/components/board/views/ViewSwitcher.tsx:17`

---

## IMPL-049: src/components/board/views/KanbanView.tsx

**Lines:** 477
**Exports:** named `KanbanView`.
**External libs:** `@dnd-kit/core` (DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDroppable).
**Reads from store:** `kanbanStore`, `boardUIStore` (grouping, filterAssignee, searchQuery, selectedCardId, selectCard), `authStore` (user).
**Implements:**
- DndContext mounted at view root. PointerSensor with `distance: 4` activation constraint.
- DragOverlay renders a copy of the dragging card at opacity 0.95 pointer-events-none.
- Filter pipeline applies filterAssignee + searchQuery (title+description case-insensitive).
- Groups derived per grouping mode:
  - **col**: maps `columns` sorted by position. Accent assignment is positional (i===1 → accent, i===2 → purple #a855f7, last → green, else text-3) — odd choice but deterministic.
  - **priority**: hardcoded order urgent/high/medium/low with red/amber/accent/text-3 accents.
  - **epic**: maps epics sorted by position + "No epic" bucket with `clear_epic: true` payload.
  - **assignee**: agents first (cyan #0ea5e9), then users (accent), then unassigned (text-3) if any.
  - **due**: overdue/today/week/later/none with `due_date` payloads computed by `bucketTargetTs` (now-1d / now+0.5d / now+3d / now+14d / clear_due).
- ColumnDropZone is a useDroppable with id `col:<groupKey>`. isOver swaps bg to var(--accent-bg).
- onDragEnd: applies `overData.payload()` + `position = positionAfter(targetGroup.cards excluding this card)`. Calls `updateCard(activeBoardId, cardId, patch)` — no optimistic update, no error UI.
- ColumnSection: per-group container. Header has 8×8 accent dot, title (12px 600), count (text-3), Plus + MoreHorizontal buttons (no onClick wired).
- Empty zone shows "Drop or + add" dashed-border block.

**Hardcoded / mock / stub:**
- Plus / MoreHorizontal column-header icons have no onClick.
- Purple #a855f7 hardcoded for column index 2 (out of theme).

**Looks incomplete or wrong:**
- **Bug interaction with BoardFilterRow:** the row writes `"status"` for the Column grouping, but this code matches on `"col"`. With status group selected, board renders empty. So all 5 modes ARE wired here, but only 4 are reachable via the UI ("col" is the default).
- No error handling around `updateCard`.

**File reference:** `frontend-v2/src/components/board/views/KanbanView.tsx:102`

---

## IMPL-050: src/components/board/views/TimelineView.tsx

**Lines:** 642
**Exports:** named `TimelineView`.
**External libs:** `@dnd-kit/core` (DndContext, useDroppable, PointerSensor).
**Reads from store/mock:** `kanbanStore`, `boardUIStore`, `authStore`, `MOCK_AGENTS`, `MOCK_USERS`, `MOCK_TELEMETRY`.
**Implements:**
- Constants: `DAY_W=64`, `ROW_H=36`, `LANE_PAD=8`, `LANE_LABEL_W=200`, `START=-2`, `END=14` — i.e. 17 days window starting 2 days ago.
- Pointer sensor activation distance 6.
- `tsToX(ts)` projects a ms-timestamp into pixels: `((ts - todayUtcMidnight()) / MS_PER_DAY - START) * DAY_W`.
- `cardWidth(estimate) = clamp(estimate * 14, 80, 200)`.
- Lanes built: every MOCK_AGENT becomes a lane; ad-hoc agents (assignee_agent not in MOCK_AGENTS) get added; users with cards become lanes; always pushes an `"none"` lane at end.
- Card boxes: x = max(2, tsToX(due_date) - width). Pack-rows packs them into laneH = rowCount * 36 + 16.
- Lane load: `sumPts/cap` with cap=21. Color: >cap red, >70%cap amber, else green.
- Sticky day header (z 4) with weekend tint (var(--bg)) and today tint (var(--accent-bg)). Today header column shows accent color on weekday label.
- Today line: 2px amber vertical bar at todayX, pointer-events-none.
- Lane background: agents get var(--accent-bg); users/none get var(--surface).
- Empty lane: "no haul scheduled — drop a card to assign" italic text-3.
- Drag-drop: each lane is a useDroppable keyed `lane:<id>` with `data.laneId`. On drop, computes day offset from `activatorEvent.clientX + delta.x` minus laneEl boundingClientRect.left then `Math.round(localX / DAY_W) + START`. Falls back to dayOffset=0 if no rect.
- Patch: `{ due_date: todayUtcMidnight() + dayOffset * MS_PER_DAY, ...assigneePatchByLaneId }`.

**Hardcoded / mock / stub:**
- Per-lane capacity hardcoded at 21 points. No way to override.
- Skips cards in Done column (heuristic match `/done/i` on column name).
- mockEstimate copy is inlined again (third copy).

**Looks incomplete or wrong:**
- `agentTelemetry(name).status === "working"` looked up multiple times (no memo).
- The `data.handle` and `data.avatar` fields on Lane.data are declared but never actually read.

**File reference:** `frontend-v2/src/components/board/views/TimelineView.tsx:42`

---

## IMPL-051: src/components/board/views/TerminalView.tsx

**Lines:** 162
**Exports:** named `TerminalView`.
**Reads from store/mock:** `kanbanStore`, `boardUIStore`, `authStore`, `MOCK_USERS`, `MOCK_TELEMETRY`.
**Implements:**
- No drag-drop, click to select.
- Top: green `$` + `board --list --group=column --sort=priority,due` synthetic command line.
- Renders one section per column sorted by `position`. Header is `┌── COLUMN_NAME [02] ─────────────` (count zero-padded to 2 digits, dashed border fills remainder via 1px dashed var(--border) on a flex-1 spacer).
- Items sorted by priority order (urgent/high/medium/low/empty) then by due_date.
- Empty section shows `│ // empty` italic.
- Bottom: green `$` + `_` and a blinking accent 8×14 caret via `blink` keyframe.

**Hardcoded / mock / stub:**
- Synthetic "board --list ..." command line.

**File reference:** `frontend-v2/src/components/board/views/TerminalView.tsx:36`

---

## IMPL-052: src/components/board/views/DispatchView.tsx

**Lines:** 391
**Exports:** named `DispatchView`.
**External libs:** `@dnd-kit/core`.
**Reads from store/mock:** `kanbanStore`, `boardUIStore`, `authStore`, `MOCK_AGENTS`, `MOCK_TELEMETRY`.
**Implements:**
- Fleet bar (top): "FLEET N" indicator (mono uppercase, 18px count) + DispatchAgentTile for every MOCK_AGENT. Tile gets card title via telemetry.current_card_id lookup, falling back to a card whose assignee_agent==name and column==in-progress.
- 4 sections side-by-side:
  - Hot (red, read-only) = overdue + not done. No drop target.
  - In Flight (accent, drops → inProgressCol.id) = cards in column matched `/in.?progress/i|/^doing$/i|/working/i` else sortedCols[1].
  - Ready (green, drops → reviewCol.id) = `/review/i|/qa/i` else sortedCols[2].
  - Queue (text-3, drops → backlogCol.id) = `/backlog/i|/queue/i` else sortedCols[0].
- Each SectionDropZone is useDroppable id `section:<id>`. isOver → accent-bg.
- onDragEnd updates `column_id` + `position = positionAfter(targetCards)`. Same fire-and-forget pattern as KanbanView.
- DragOverlay renders KanbanCard duplicate at 0.95 opacity.

**Hardcoded / mock / stub:**
- Column name regex matching is brittle (e.g. if board has no "In Progress" / "Backlog" column, falls back to position index).
- Hot section is read-only.

**File reference:** `frontend-v2/src/components/board/views/DispatchView.tsx:127`

---

## IMPL-053: src/components/board/rail/RailTabs.tsx

**Lines:** 100
**Exports:** default `RailTabs`.
**Reads from store/mock:** `boardUIStore` (railTab, setRailTab), `MOCK_TELEMETRY`, `MOCK_ACTIVITY`, `MOCK_PROPOSALS`.
**Implements:**
- 3 tabs (Console / Activity / Plans) in a flex segmented control.
- Badges show counts: Console = working agents in telemetry; Activity = total events; Plans = pending proposals.
- Active tab gets `var(--bg)` background, `inset 0 0 0 1px var(--border-hi)` shadow.
- Badge style: active → accent bg + accent-fg color; inactive → border bg + text-2.

**File reference:** `frontend-v2/src/components/board/rail/RailTabs.tsx:18`

---

## IMPL-054: src/components/board/rail/ConsoleRail.tsx

**Lines:** 596
**Exports:** default `ConsoleRail`.
**Reads from store/mock:** `kanbanStore` (cards), `boardUIStore` (selectCard), `MOCK_PRESENCE`, `MOCK_USERS`, `MOCK_TELEMETRY`, `MOCK_TRANSCRIPTS`.
**Implements:**
- Two sections: `<N active now>` (action != idle) and `<N idle>`.
- PresenceRow per entry: AssigneeChip + pulsing dot (color from action) + name + USER/AGENT badge + relative time. Working agents are expandable with chevron rotation.
- `useEffect` cycles `transcriptIdx[name]` modulo lines.length every 3.2s for every working agent.
- Initial expanded set: `new Set(["pr6"])` — relay is pre-expanded.
- Transcript box: 4 lines per agent, indexed wrapping starting at `transcriptIdx[agent]`. Opacity fades: `1 - i*0.18`. mono font 11px. Max-height 110px. Shows `tail -f` label top-right.
- Telemetry row when expanded + working: shows `<load%> · <tok>t/m`, load bar (color green/accent/amber by load).
- `resolveCard("mock-card-N", sortedCards)` maps placeholders to real cards. HAUL-N chip clickable → opens card detail.
- Bottom: dashed "Invite people or hauler agents" button (no onClick).

**Hardcoded / mock / stub:**
- Default-expand "pr6" (relay). If presence data changes order, this stops working.
- Invite button has no onClick.

**Looks incomplete or wrong:**
- `dotColorForAction` includes a special case `(isAgent && action === "scanning") → green` (otherwise scanning → text-3). Subtle.
- Transcript scroll animation is just a cycling array indexer — appears as discrete steps every 3.2s, not a smooth tail.

**File reference:** `frontend-v2/src/components/board/rail/ConsoleRail.tsx:469`

---

## IMPL-055: src/components/board/rail/ActivityRail.tsx

**Lines:** 375
**Exports:** default `ActivityRail`, named `ActivityRow`.
**Reads from store/mock:** `kanbanStore` (cards), `boardUIStore` (selectCard), `MOCK_ACTIVITY`, `MOCK_USERS`.
**Implements:**
- Top filter chip row: All / Agents / Comments / Ships. Active chip = accent border + accent-bg + accent text.
- Items sorted by `at` desc, then grouped into now (<0.5h), today (0.5–8h), earlier (>8h).
- Group headers: mono uppercase label + "N events".
- Each ActivityRow shows AgentChip or UserChip + name + kind badge (color per kind) + relative time + body text + clickable HAUL-N chip (if card resolvable).
- Newest item in `now` group gets `fade-in 320ms` animation.
- Subtle 1px vertical connector line at left:24 per group.
- `kindMeta` colors: agent→accent, comment→text-2, move→green, assign→amber, create→text-2, ship→green, label→text-3, priority→red.

**Looks incomplete or wrong:**
- Empty-state for an active filter that yields no items in a bucket → bucket just hidden (`if (!list.length) return null`). No "no events" fallback.

**File reference:** `frontend-v2/src/components/board/rail/ActivityRail.tsx:224`

---

## IMPL-056: src/components/board/rail/PlansRail.tsx

**Lines:** 596
**Exports:** default `PlansRail`.
**Reads from mock:** `MOCK_PROPOSALS`, `MOCK_USERS`.
**Implements:**
- Sections: "N pending" (first expanded by default) + "recently decided" (only shown if any).
- ProposalCard: avatar (AgentChip with "AI" badge or UserChip), name, "proposes" label, relative time, title, status badge (PENDING amber / APPROVED green / REJECTED text-3), action count, confidence %.
- Expanded: summary + monospace action list (one PlanActionLine per action, kind-uppercased + plain-English summary built per kind).
- Pending expansions show Approve (accent button) / Reject / Edit (Pencil icon) — **all three call `notWired(action, plan)` → `alert(...)`**.
- Approved expansions: green check + "Approved by <name> · executed".
- Rejected expansions: muted text + "— "<rejection_reason>"" if present.
- Rejected proposals: container opacity 0.55.
- Bottom: solid accent "Propose a plan" button (no onClick).

**Hardcoded / mock / stub:**
- All three action buttons use `alert("X "Title" would execute server-side; not yet wired.")` — explicit "no-alert" eslint-disable.
- "Propose a plan" CTA button has no onClick.
- `PlanActionLine` `due` formats with `fmtDate(action.to)` — good.

**File reference:** `frontend-v2/src/components/board/rail/PlansRail.tsx:17`

---

## IMPL-057: src/components/board/rail/CardDetailPanel.tsx

**Lines:** 514
**Exports:** default `CardDetailPanel` (cardId).
**Reads from store/mock:** `kanbanStore` (cards, columns, epics), `boardUIStore` (selectCard, focusCard), `MOCK_ACTIVITY`, `MOCK_SUGGESTIONS`, `MOCK_TELEMETRY`, `MOCK_USERS`.
**Imports** `ActivityRow` from `./ActivityRail` (cross-file dependency for the inline activity feed).
**Implements:**
- Header bar (44px): mono `HAUL-N` left; Focus button (Maximize2 + F KeyHint, calls `focusCard(card.id)`) + Close button (X) right.
- Card-not-found fallback: 16px text-3 panel with Close button (calls `selectCard(null)`).
- Title (h3, 16px 600).
- Metadata grid: 80px label col / 1fr value col. Rows: Status (8×8 accent dot + column.name), Priority (PriorityIndicator + capitalized name), Assignee (AssigneeChip + name + green pulse "WORKING" tag if agent working), Epic (EpicChip or em-dash), Due (red bold if overdue), Estimate (mock-derived, mono "Npt"), Labels (comma-split labels rendered as small bordered pills).
- "Agent activity" section: filters MOCK_ACTIVITY by `card_id === card.id || card_id === reverseMockId(card)`. Inline ActivityRow components with a 1px vertical connector.
- "AI suggested" section: finds first MOCK_SUGGESTION matching card.id or mock alias. Renders SuggestionRow: Sparkles icon + suggestion text + "Apply" accent label. **onClick → alert("Apply suggestion would execute server-side; not yet wired.\n\n<text>")**.

**Hardcoded / mock / stub:**
- `mockEstimate(card)` here uses a DIFFERENT hash than KanbanCard's helper! Here: char-rolling FNV-like hash mod buckets `[1,2,3,5,8,13]`. KanbanCard's helper: `parseInt(id.slice(-2),16) % 13 + 1`. **Two different point values for the same card in the dense card vs. the detail panel.**
- SuggestionRow apply → `alert(...)`.

**Looks incomplete or wrong:**
- The `HAUL-<n>` heading is hardcoded — doesn't use the active board's `prefix`.
- `reverseMockId` is duplicated in FocusModal.

**File reference:** `frontend-v2/src/components/board/rail/CardDetailPanel.tsx:25`

---

## IMPL-058: src/components/board/overlays/FocusModal.tsx

**Lines:** 548
**Exports:** default `FocusModal`.
**Reads from store/mock:** `kanbanStore` (cards, columns, epics, activeBoardId, updateCard), `boardUIStore` (focusedCardId, focusCard), `MOCK_SUBTASKS`, `MOCK_TELEMETRY`, `MOCK_AGENTS`, `MOCK_USERS`.
**Implements:**
- Renders nothing when no focused card.
- Returns null SSR (`typeof document === "undefined"`); else `createPortal(content, document.body)`.
- Backdrop: position fixed inset 0, z 1000, `background: color-mix(in srgb, var(--bg) 94%, transparent)`, `backdrop-filter: blur(8px)`, fade-in 200ms.
- Modal: `min(720px, 92vw)`, max-height 92vh, surface bg, border-radius 14, padding 32 36 28, shadow `0 30px 80px rgba(0,0,0,0.25)`. Clicking backdrop closes; click on modal stops propagation.
- Esc key listener registered only while open.
- Meta strip: mono accent `HAUL-N`, BUG tag, epic dot+name, priority sentence, due date (red bold if overdue), "Esc · close" button.
- Title h1 32px 600.
- Assignee + actions row: AssigneeChip (size 28) + name + "working alongside you · <plugin>" line when agent working. Mark shipped accent button (height 32) on the right. **handleMarkShipped** updates `card.column_id = doneColumn.id` where doneColumn is matched by name "done" (lowercase) or, failing that, the highest-position column.
- Description block (preserves \n via `whiteSpace: pre-wrap`).
- Subtasks block: if seeded (mock-card-N → MOCK_SUBTASKS), renders progress widget (huge `N/total` mono numeric + 5px progress bar + "NN%") and a list of large checkbox buttons. Toggling subtask writes new state + persists to `taskhauler.subtasks.<realCardId>` in localStorage.
- Seed strategy: on first open, `loadSubtasks(card, sortedCards)` reads `taskhauler.subtasks.<cardId>` if present; else `MOCK_SUBTASKS[mockAlias] || MOCK_SUBTASKS[card.id] || []` (cloned).

**Hardcoded / mock / stub:**
- "Mark shipped" target column is heuristically detected. If no column named "done", uses the last column by position — which may not actually be the done column.
- Subtasks: only mock-card-1..4 have seeds; cards beyond that show empty subtask list (no progress widget rendered).

**Looks incomplete or wrong:**
- Modal HAUL-N badge is hardcoded — doesn't use board.prefix.
- No error handling around `updateCard`.

**File reference:** `frontend-v2/src/components/board/overlays/FocusModal.tsx:77`

---

## IMPL-059: src/vite-env.d.ts

**Lines:** 1 (assumed standard)
**Exports:** vite env reference comment.
**File reference:** `frontend-v2/src/vite-env.d.ts:1`

---

## Cross-cutting observations

### `as any` casts — integration scars

All present in shell-layer components that try to look up setter names that don't match the store's actual API:

- `BoardRightRail.tsx:20` — `(s as any).setSelectedCardId` → **undefined** (store has `selectCard`)
- `BoardTopBar.tsx:19` — `(s as any).setConsoleOpen` → defined ✓
- `BoardTopBar.tsx:21` — `(s as any).setSearchQuery` → defined ✓
- `BoardTopBar.tsx:58` — `presenceEntries as any` → presence shape mismatch
- `BoardTopBar.tsx:174-175` — `name as any` → ThemeName cast (harmless since it round-trips through the type)
- `Board.tsx:21` — `(s as any).setFocusedCardId` → **undefined** (store has `focusCard`)
- `BoardFilterRow.tsx:38` — `(s as any).setGrouping` → defined ✓
- `BoardFilterRow.tsx:40` — `(s as any).setFilterAssignee` → **undefined** (store has `setFilter`)
- `BoardFilterRow.tsx:42` — `(s as any).setView` → defined ✓

### eslint-disable comments

- `Board.tsx:42` — exhaustive-deps disabled for one-shot mount effect.
- `PlansRail.tsx:17` — no-alert for the notWired helper.
- `CardDetailPanel.tsx:476` — no-alert for SuggestionRow.

### console.log placeholders (handlers wired to logs/alerts only)

- `BoardAISuggestionStrip.tsx:35,52` — Apply + Dismiss → console.log.
- `Board.tsx:74,88` — ⌘K + C → console.log.
- `Board.tsx:40,49` — fetchBoards/fetchBoard errors → console.error.

### alert() placeholders

- `PlansRail.tsx:18` — Approve / Reject / Edit → `alert("X "..." would execute server-side; not yet wired.")`.
- `CardDetailPanel.tsx:477` — AI suggestion Apply → `alert(...)`.

### Duplication

- `mockEstimate(id)` defined inline three times (KanbanCard, TerminalRow, TimelineView's local copy) with the **same hash** (`parseInt(id.slice(-2),16) % 13 + 1`), but CardDetailPanel re-implements with a **different hash** producing different point values.
- `reverseMockId` and `indexCards` duplicated in CardDetailPanel.tsx and FocusModal.tsx.
- `resolveCard` (mock-card-N → real card) duplicated in ConsoleRail, ActivityRail, CardDetailPanel, FocusModal.
- Theme palette literal hex values duplicated in `BoardTopBar.tsx` ThemeSwitcher and `src/index.css`.
- `PresenceEntry` defined in both `mock/presence.ts` (`agent_name`/`user_id`/`at`) and `primitives/PresenceCluster.tsx` (`name`/`userId`) with different field names — callers cast `as any`.
- Theme restoration runs in App.tsx AND Board.tsx.

### Dead / unused code

- `main.tsx`'s `document.documentElement.classList.add("dark")` — the data-theme system doesn't use `.dark`.
- `ViewSwitcher` accepts `activeBoardId` prop and never reads it.
- `Lane.data.handle` / `Lane.data.avatar` populated in TimelineView's lane builder but never read inside `LaneRow`.
- `SAVED_VIEWS` array in BoardSidebar has no onClick.
- NavRow / Workspace switcher buttons in BoardSidebar have no onClick.
- "New issue" button in BoardTopBar has no onClick.
- "Invite people or hauler agents" button in ConsoleRail has no onClick.
- "Propose a plan" CTA in PlansRail has no onClick.
- Plus / MoreHorizontal column-header buttons in KanbanView have no onClick.

### MISMATCH between code and comment / spec

- `main.tsx` comment "default to dark mode" but mechanism is `data-theme`, not class.
- BoardFilterRow GROUPINGS uses id `"status"` while GroupingMode + KanbanView use `"col"`. **Spec-divergence: probable rename half-done.**
- BoardSidebar imports KanbanSquare for "My issues" — minor naming oddity.
- Comment in CardDetailPanel says "mirrors the same hash used by KanbanCard" — it doesn't.

### Missing imports / files

None — all imports resolve.

---

## Verification scan

### `npm run build`

```
vite v7.3.3 building client environment for production...
(node:75603) [DEP0205] DeprecationWarning: `module.register()` is deprecated. Use `module.registerHooks()` instead.
transforming...
✓ 1634 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.18 kB │ gzip:   0.58 kB
dist/assets/index-DndGUgG6.css   30.36 kB │ gzip:   6.51 kB
dist/assets/index-DBoTe2rG.js   349.50 kB │ gzip: 104.60 kB
✓ built in 2.01s
```

Build is clean. One Node DEP0205 deprecation warning from vite tooling, not application code.

### `grep -rn "TODO\|FIXME\|XXX\|HACK" src/`

(No matches.)

### `grep -rn "as any\|@ts-ignore" src/`

```
src/components/board/BoardRightRail.tsx:20:    (s) => (s as any).setSelectedCardId
src/components/board/BoardTopBar.tsx:19:  const setConsoleOpen = useBoardUIStore((s) => (s as any).setConsoleOpen);
src/components/board/BoardTopBar.tsx:21:  const setSearchQuery = useBoardUIStore((s) => (s as any).setSearchQuery);
src/components/board/BoardTopBar.tsx:58:        <PresenceCluster entries={presenceEntries as any} size={24} showLabel />
src/components/board/BoardTopBar.tsx:174:    persistTheme(name as any);
src/components/board/BoardTopBar.tsx:175:    applyTheme(name as any);
src/components/board/Board.tsx:21:  const setFocusedCardId = useBoardUIStore((s) => (s as any).setFocusedCardId);
src/components/board/BoardFilterRow.tsx:38:  const setGrouping = useBoardUIStore((s) => (s as any).setGrouping);
src/components/board/BoardFilterRow.tsx:40:  const setFilterAssignee = useBoardUIStore((s) => (s as any).setFilterAssignee);
src/components/board/BoardFilterRow.tsx:42:  const setView = useBoardUIStore((s) => (s as any).setView);
src/components/board/rail/PlansRail.tsx:17:  // eslint-disable-next-line no-alert
src/components/board/rail/CardDetailPanel.tsx:476:    // eslint-disable-next-line no-alert
```

No `@ts-ignore` / `@ts-expect-error` anywhere. The eslint-disable lines are no-alert-specific (PlansRail + CardDetailPanel).

### `grep -rn "alert(" src/`

```
src/components/board/rail/PlansRail.tsx:18:  alert(
src/components/board/rail/CardDetailPanel.tsx:477:    alert(`Apply suggestion would execute server-side; not yet wired.\n\n${text}`);
```

Two `alert()` placeholders — Approve/Reject/Edit and Apply-suggestion.

### `grep -rn "console.log\|console.warn\|console.error" src/`

```
src/components/board/BoardAISuggestionStrip.tsx:6: * Apply/Dismiss buttons are wired to console.log placeholders.
src/components/board/BoardAISuggestionStrip.tsx:35:        onClick={() => console.log("[suggestion] apply", top?.id)}
src/components/board/BoardAISuggestionStrip.tsx:52:        onClick={() => console.log("[suggestion] dismiss", top?.id)}
src/components/board/Board.tsx:40:      .catch((e) => console.error("fetchBoards failed:", e));
src/components/board/Board.tsx:49:        console.error("fetchBoard failed:", e)
src/components/board/Board.tsx:74:        console.log("[shortcut] ⌘K search (no-op)");
src/components/board/Board.tsx:88:        console.log("[shortcut] C new issue (no-op)");
```

Four console.log placeholders + two console.error catches for fetch failures.
