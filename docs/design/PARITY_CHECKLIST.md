# Taskhauler — Parity Checklist

Every feature, component, and behavior from the prototype, as a checklist. Tick boxes as you (or Claude Code) implement each piece. The order is roughly the recommended implementation sequence.

> **Source of truth**: when in doubt about how something should look or behave, open `prototype/index.html` in a browser and inspect the live design. The README has the full design spec.

---

## Phase 0 — Foundations

### 0.1 Theme system

- [ ] Add CSS custom properties for `:root[data-theme="day"]` in `src/index.css` (all tokens from README)
- [ ] Add CSS custom properties for `:root[data-theme="mono"]`
- [ ] Add CSS custom properties for `:root[data-theme="paper"]`
- [ ] Default `data-theme="day"` on `<html>` at app boot
- [ ] Persist theme choice to `localStorage` key `taskhauler.theme`
- [ ] Restore theme from `localStorage` on app boot, before first render (to avoid flash)
- [ ] Apply theme by setting `document.documentElement.setAttribute('data-theme', name)`
- [ ] Verify all 3 themes render the existing app without breaking anything

### 0.2 Fonts

- [ ] Load `Inter` (weights 400/500/600/700) via Google Fonts or self-host
- [ ] Load `JetBrains Mono` (weights 400/500/700)
- [ ] Load `Geist Mono` (weights 400/500/600)
- [ ] Verify font swap works when theme changes (Mono theme uses JetBrains Mono everywhere)

### 0.3 Shared helpers

- [ ] `src/lib/time.ts` — `fmtDue(timestamp)` returns `{ txt, overdue, soon }` for relative date display; `fmtAgo(timestamp)` returns "12s", "5m", "3h", "2d"
- [ ] `src/lib/positions.ts` — extract `positionAfter()` and `positionBefore()` from existing `KanbanBoard.tsx`
- [ ] `src/lib/pack-rows.ts` — greedy row packing for the Timeline view (see README, Timeline section)
- [ ] `src/lib/theme.ts` — exports `THEMES = { day, mono, paper }` and `applyTheme(name)`
- [ ] Test helpers with simple unit tests

### 0.4 Primitives

- [ ] `<UserChip id size>` — circular avatar with hue-based oklch bg/fg + 2-letter initials
- [ ] `<AgentChip name size variant>` — hex-clipped (via clip-path) monospace tile, single uppercase letter, optional cyan ring when working
- [ ] `<AssigneeChip assignee size>` — dispatches to UserChip or AgentChip based on `assignee` shape
- [ ] `<PresenceDot color active>` — small pulsing dot (8px), pinned bottom-right of avatar
- [ ] `<PresenceCluster maxShown=5>` — overlapping avatars + "+N" overflow + "X active" label
- [ ] `<PriorityIndicator priority>` — 3-bar indicator for low/med/high, solid red square for urgent
- [ ] `<EpicChip epic size>` — color dot + short name in colored pill (Day) / colored border (Mono)
- [ ] `<KeyHint>` — small kbd-style label with mono font, used for shortcut hints

---

## Phase 1 — Board shell

### 1.1 `<Board>` (top-level container)

- [ ] Full-viewport (100vw × 100vh) flex container, no scroll on outer
- [ ] Holds: `<BoardSidebar>` + main column + `<BoardRightRail>` (conditional)
- [ ] Manages top-level state: `view`, `selected`, `focusedId`, `consoleOpen`, `railTab`, `themeName`, `filterAssignee`, `grouping`
- [ ] Connects to `useKanbanStore` for cards/columns/epics
- [ ] Connects to `useUserStore` and `useAgentStore` for collaborators
- [ ] Listens for global keyboard shortcuts (`F`, `Esc`, `C`, `⌘K`)

### 1.2 `<BoardSidebar>` (200px left rail)

- [ ] Fixed 200px width, full height, `--bg` background, `--border` right edge
- [ ] **Workspace switcher** (top):
  - [ ] 22×22 gradient brand glyph (T monogram, indigo→violet gradient in Day, accent solid in Mono/Paper)
  - [ ] "Taskhauler" wordmark (700, 13px)
  - [ ] Chevron-down icon (clickable, opens workspace menu — placeholder)
- [ ] **Top-level nav** section:
  - [ ] Inbox row — inbox icon + label + count badge (right-aligned, `--text-3`)
  - [ ] My issues row — kanban icon + label + count
  - [ ] AI suggestions row — sparkles icon + label + count
- [ ] **Boards** section header (uppercase, 10.5px, 600, `--text-3`, letter-spacing)
  - [ ] List of board rows. Each row: 8px square color dot + board name + monospace prefix label right-aligned
  - [ ] Active board: `--surface` background + 1px border + 600 weight on name + dot in `--accent`
  - [ ] Inactive: transparent bg, `--text-2` color, dot in `--border-hi`
- [ ] **Saved views** section header
  - [ ] List of view rows. Each row: filter icon + name in `--text-2`
- [ ] **Current user** chip pinned to bottom: avatar + name (small, `--text-3`)

### 1.3 `<BoardTopBar>` (44px height)

- [ ] 44px tall, `--surface` background, 1px bottom border `--border`
- [ ] Padding 0 14px, flex row, gap 8px
- [ ] Left side:
  - [ ] Board name (semibold, 13px) — clickable to switch boards
  - [ ] `/` separator (`--text-3`)
  - [ ] Filter scope label ("All issues", 12px, `--text-2`)
  - [ ] Count "· {filteredN} of {totalN}" (11px, `--text-3`)
- [ ] `margin-left: auto` spacer
- [ ] Right side:
  - [ ] `<PresenceCluster>` — see Primitives
  - [ ] **Theme switcher** (3 swatches, see 1.4 below)
  - [ ] **Search input** — 220px wide pill, 28px tall, magnifier icon, "Search or jump to…" placeholder, `⌘K` key hint
  - [ ] **New issue button** — outline button, plus icon, "New issue" label, `C` key hint
  - [ ] **Console toggle button** — solid pill when on, outline when off. Green pulsing dot + "Console" + monospace `{working}/{total}` count

### 1.4 Theme switcher (in top bar)

- [ ] Container: flex row, 2px padding, 1px border, `--radius` rounded, `--bg` background
- [ ] 3 buttons (Day, Mono, Paper), 22×22 each
- [ ] Each button shows a 14×14 inner mini-square in that theme's `--bg` color, bordered by the swatch color
- [ ] 6px accent-color dot in center of mini-square
- [ ] Active swatch has filled outer ring in swatch's accent color
- [ ] Click → set theme, apply to `<html>`, persist to localStorage

### 1.5 `<BoardFilterRow>` (40px height)

- [ ] 40px tall, `--surface` bg, 1px bottom border, padding 0 14px
- [ ] **Group label + segmented control**:
  - [ ] "Group" 11px label in `--text-3`
  - [ ] 5 segments: Status / Priority / Epic / Assignee / Due
  - [ ] Active segment: `--surface` bg + subtle shadow + 600 weight
  - [ ] Inactive: transparent + `--text-2` + 500 weight
  - [ ] Click → update `grouping` state
- [ ] **Divider** (1×18px, `--border`)
- [ ] **Filter chips**:
  - [ ] "Filter" 11px label
  - [ ] 3 chips: All / Mine / Agents
  - [ ] Active chip: `--accent` border + `--accent-bg` background + `--accent` text
  - [ ] Agents chip: small green pulsing dot when active
  - [ ] Click → update `filterAssignee` state
- [ ] `margin-left: auto`
- [ ] **View switcher**:
  - [ ] Container: 1px border, 2px padding, `--bg` background, rounded
  - [ ] 4 buttons: Kanban / Timeline / Terminal / Dispatch
  - [ ] Each button: 12px icon + label, height 22, padding 0 9
  - [ ] Active button: `--surface` bg + subtle shadow + 600 weight
  - [ ] Click → update `view` state (also persist to URL query param)

### 1.6 `<BoardAISuggestionStrip>` (28px height, optional)

- [ ] Renders between filter row and view content
- [ ] Background: linear-gradient from `--accent-bg` to `--bg`
- [ ] Sparkles icon + "{N} AI suggestions" (accent) + " — " + top suggestion text
- [ ] **Apply** button (accent solid) + **Dismiss** button (subtle)
- [ ] Hide if no suggestions

### 1.7 `<BoardRightRail>` (340px width)

- [ ] 340px width, full main-area height, `--surface` background, 1px left border
- [ ] Visible when `consoleOpen === true || selected != null`
- [ ] Conditional content:
  - [ ] If `selected != null`: render `<CardDetailPanel>` (with "← Back to console" link at top if `consoleOpen` too)
  - [ ] Otherwise: render `<RailTabs>` + active tab panel

---

## Phase 2 — Kanban view (highest priority)

### 2.1 `<KanbanCard>` (the dense card — used in Kanban AND Dispatch)

- [ ] `--surface` background, 1px `--border`, `--radius` rounded, 8px/10px padding
- [ ] Display: flex column, gap 6px, font-size 12
- [ ] Shadow: `0 1px 0 rgba(0,0,0,0.02)` resting; selected state has `--accent` border + `0 0 0 3px var(--accent)/22` ring
- [ ] **Top meta row** (flex row, gap 6):
  - [ ] `<PriorityIndicator>`
  - [ ] HAUL-N (10.5px mono, `--text-3`, letter-spacing 0.2)
  - [ ] BUG label (if `card_type === "bug"`): red dot + "BUG" in 10px 600 red
  - [ ] Blocked icon (if `card.blockedBy`): red ban-circle
  - [ ] `margin-left: auto`
  - [ ] `<PresenceCluster maxShown=3 size=14>` for people viewing this card (excluding assignee if it's an agent already shown)
  - [ ] Comment count: msg icon + N (10.5px, `--text-3`)
  - [ ] `<AssigneeChip size=18>` with green pulsing dot if agent is working
- [ ] **Title** (font-weight 500, 12px, line-height 1.35, -webkit-line-clamp 2)
- [ ] **Meta row** (flex row, gap 6, flex-wrap):
  - [ ] `<EpicChip>` (small, with color dot + epic short name in pill)
  - [ ] Estimate "Npt" in `--text-3` monospace
  - [ ] `margin-left: auto`
  - [ ] Due date with color: red if overdue, amber if soon (≤2 days), `--text-3` otherwise
- [ ] **Progress bar** (only if `card.progress` is set and < 1): 2px tall, full width, `--border` track, `--accent` fill
- [ ] Draggable (HTML5 drag, or @dnd-kit useDraggable)
- [ ] Click → set `selected` in board state
- [ ] Hover: shadow upgrade + translateY(-1px) (120ms transition)
- [ ] **CRITICAL**: must work identically in Kanban view and Dispatch view sections (single component, used in both)

### 2.2 `<KanbanView>`

- [ ] Flex row, gap 4px, padding 12px 10px, overflow-x auto
- [ ] One **column** per grouping bucket. Column structure:
  - [ ] Flex column, gap 8px, padding 6px, `--radius` rounded, min-width 200, flex 1
  - [ ] Drag-over state: `--accent-bg` background
  - [ ] **Header row** (flex, gap 6, padding 2/4):
    - [ ] 8×8px color dot (status accent: indigo for In Progress, purple for Review, green for Done, gray for Backlog) — color comes from grouping field
    - [ ] Name (12px 600)
    - [ ] Count (11px `--text-3`)
    - [ ] `margin-left: auto`
    - [ ] "+" button (20px square, ghost)
    - [ ] "..." button (20px square, ghost)
  - [ ] **Cards list**: flex column, gap 6, min-height 80
  - [ ] **Empty state**: dashed border, "Drop or **+ add**" centered, 16px/8px padding, 11px text
- [ ] **Grouping logic** (must build the column array based on `grouping` state):
  - [ ] `col`: 4 columns from existing Board.columns
  - [ ] `priority`: Urgent / High / Med / Low (filter out empty)
  - [ ] `epic`: one per epic + "No epic" bucket
  - [ ] `assignee`: one per assignee with cards + "Unassigned"
  - [ ] `due`: Overdue / Today / This week / Later / No due date
- [ ] **Drag handlers**:
  - [ ] `onDragOver` → preventDefault + set `dragOver` state
  - [ ] `onDragLeave` → clear `dragOver`
  - [ ] `onDrop` → update card field based on grouping mode (column_id / priority / epic_id / assignee / due)
  - [ ] Use existing `positionAfter`/`positionBefore` for ordering within a column
- [ ] Compute positions correctly when dropping into different group types

### 2.3 `<CardDetailPanel>` (when card selected)

- [ ] 44px top header row:
  - [ ] HAUL-N (mono, 11px, `--text-3`) — left
  - [ ] `margin-left: auto`
  - [ ] Focus button (outline, gap 4, focus icon + "Focus" label + "F" key hint)
  - [ ] Close button (subtle outline)
- [ ] Body: padding 16, flex column, gap 14, overflow auto
- [ ] **Title** (h3, 16px 600, line-height 1.35, letter-spacing -0.2)
- [ ] **2-column metadata grid** (80px label / 1fr value, rowGap 8, columnGap 12, 12px):
  - [ ] Status (color dot + name)
  - [ ] Priority (indicator + label)
  - [ ] Assignee (chip + name; if agent is working, add green WORKING badge)
  - [ ] Epic (color dot + name)
  - [ ] Due (color by urgency)
  - [ ] Estimate (mono pt)
  - [ ] Labels (comma-split → small bordered chips)
- [ ] **Agent activity** section (if any events for this card):
  - [ ] Section header (10px 700 uppercase letter-spacing 1.5)
  - [ ] Events list — reuse the activity event row component
- [ ] **AI suggested** section:
  - [ ] Section header
  - [ ] One suggested action card: ✨ icon + title + Apply link

---

## Phase 3 — Right rail (3 tabs)

### 3.1 `<RailTabs>`

- [ ] Header at top of rail: padding 8/10, gap 4, 1px bottom border, `--surface` bg
- [ ] 3 segments: Console / Activity / Plans
- [ ] Each segment: flex 1, height 28, gap 5, 11.5px 600
- [ ] Each segment shows: label + count badge (small accent-bg pill, mono)
- [ ] Active segment: `--bg` background + inset 1px `--border-hi` shadow
- [ ] Click → update `railTab` state

### 3.2 `<ConsoleRail>` — live presence (humans + agents)

- [ ] Section header "{N} active now" / "on this board"
- [ ] List of `<PresenceRow>` for each active presence entry
- [ ] Section header "{N} idle" / "available · last seen recently"
- [ ] List of idle presence rows
- [ ] Bottom CTA: dashed-border "+ Invite people or hauler agents" button

**`<PresenceRow>`** anatomy:

- [ ] Padding 10/12, 1px bottom border
- [ ] **Top row** (button, full width, transparent bg):
  - [ ] Avatar (26px) with action-colored pulsing dot
  - [ ] Name (12px 700, mono for agents, sans for users)
  - [ ] USER / AGENT pill (10px 700, small bordered)
  - [ ] `margin-left: auto`
  - [ ] "{time} ago" (10px mono, `--text-3`)
  - [ ] Expand chevron (rotates 90° when expanded) — agents only
- [ ] **Action line below** (11.5px, `--text-2`):
  - [ ] Action verb in action color (viewing/editing/commenting/working/scanning)
  - [ ] HAUL-N chip (clickable → opens card detail)
  - [ ] Card title (truncated with ellipsis, takes remaining space)
- [ ] **Telemetry row** (working agents only):
  - [ ] "{load}% · {tok}t/m" (10px mono, fixed width 64)
  - [ ] Load bar (3px tall, color based on load: green ≤30%, accent 30-70%, amber >70%)
- [ ] **Transcript** (working agents, when expanded):
  - [ ] Padded mono box, 4 lines of recent transcript
  - [ ] Top line full opacity, lower lines fade by 0.18
  - [ ] Cycles every 3.2s (advance index by 1 modulo length)
  - [ ] "tail -f" label in top right corner

### 3.3 `<ActivityRail>` — chronological feed

- [ ] Top: filter chip row (1px bottom border, padding 8/10)
  - [ ] Filter chips: All / Agents / Comments / Ships
  - [ ] Active chip: `--accent` border + `--accent-bg` bg + `--accent` text
- [ ] Group events by relative bucket:
  - [ ] **Just now** (< 0.5h ago)
  - [ ] **Earlier today** (0.5–8h ago)
  - [ ] **Yesterday+** (> 8h ago)
- [ ] Each group has section header + event list
- [ ] **Vertical connector line** at x=24 within each group (1px `--border`)

**`<ActivityRow>`** anatomy:

- [ ] Padding 8/12, flex row, gap 10
- [ ] Avatar (left, 22px, zIndex 1)
- [ ] Body (flex 1):
  - [ ] Top meta row: actor name + KIND pill (color-coded: AGENT=accent, NOTE=text-2, MOVE=green, ASSIGN=amber, NEW=text-2, SHIP=green) + "{time} ago" right-aligned
  - [ ] Event text (12px, line-height 1.4)
  - [ ] Optional card chip: bordered pill with "HAUL-N · title"
- [ ] Fade-in animation when newest in "Just now" bucket

### 3.4 `<PlansRail>` — proposals queue

- [ ] Section header "{N} pending" / "waiting for review"
- [ ] List of `<ProposalCard>` for pending
- [ ] Section header "recently decided" / "{N}"
- [ ] List of decided proposals (approved/rejected)
- [ ] Bottom CTA: solid accent "+ Propose a plan" button

**`<ProposalCard>`** anatomy:

- [ ] Padding 10/12, 1px bottom border
- [ ] Pending proposals: `--surface` bg
- [ ] Decided: `--bg` bg, rejected: opacity 0.55
- [ ] **Top button** (click to expand):
  - [ ] Proposer avatar (22px) with AI badge in bottom-right corner if agent (11×11 pill in `--accent`, "AI" text)
  - [ ] Name + "proposes" + "{time} ago"
  - [ ] Title (13px 600)
  - [ ] Status pill + "{N} actions" + confidence (if agent)
- [ ] **Expanded content**:
  - [ ] Summary paragraph (12px, `--text-2`)
  - [ ] Action list in mono box: each action line shows KIND in color + human-readable description
    - PRIORITY: `set HAUL-N priority X → Y`
    - MOVE: `move HAUL-N X → Y`
    - LABEL: `add label "X" to HAUL-N`
    - SPLIT: `split HAUL-N into N cards`
    - PING: `ping @user re: HAUL-N`
    - ARCHIVE: `archive N cards`
  - [ ] **If pending**: Approve (primary), Reject (outline), Edit (outline) buttons
  - [ ] **If approved**: "Approved by {name} · executed" (green)
  - [ ] **If rejected**: "Rejected by {name} — '{reason}'" (italic, `--text-3`)

---

## Phase 4 — Other views

### 4.1 `<TimelineView>` (lanes by hauler)

- [ ] **Lane label column** (200px wide, left, sticky horizontally):
  - [ ] Header: "HAULER · N" (10px 700 uppercase mono)
  - [ ] For each lane: avatar + name + sub + presence dot (agents working) + workload bar (cap 21pt)
- [ ] **Day header** (44px tall, sticky vertically):
  - [ ] One cell per day (64px wide)
  - [ ] Weekday abbreviation (10px 700 mono uppercase)
  - [ ] Day number (13px 700)
  - [ ] Today cell: `--accent-bg` background
  - [ ] Weekend cells: `--bg` background
- [ ] **Lane tracks** (one per lane, auto-height):
  - [ ] Day stripes (1px right border between days, weekend tint)
  - [ ] Today line: 2px yellow vertical, full height
  - [ ] Cards placed absolutely:
    - [ ] x = `dueDate→x` (right edge), width = `clamp(80, estimate * 14, 200)`, top = `8 + row * 36`
    - [ ] Row packing via greedy collision (see `pack-rows.ts`)
  - [ ] Empty lane placeholder: "no haul scheduled — drop a card to assign" (italic, `--text-3`)
- [ ] **Timeline card** (slimmer than kanban card):
  - [ ] Height 32px, padding 3/6/3/9
  - [ ] 3px left stripe in epic color
  - [ ] Working dot (green, 5×5, pulsing) for working agents
  - [ ] HAUL-N (mono small)
  - [ ] Title (truncated)
  - [ ] P0 badge (top right) if urgent
  - [ ] Border red if overdue
  - [ ] Selected: 3px accent ring
- [ ] **Drag-drop**:
  - [ ] Drag onto different lane → reassign
  - [ ] Drag to different x → reschedule due date (round to nearest day)
  - [ ] Drop handler receives both lane id + computed day offset
- [ ] Both axes scroll independently

### 4.2 `<TerminalView>` (monospace ASCII table)

- [ ] Full page padding 12/14, font: `var(--font-mono)`, font-size 12, line-height 1.55
- [ ] Background `--bg`, color `--text`
- [ ] **Top prompt line**: `$ board --list --group=column --sort=priority,due` (green `$`)
- [ ] **Section per column** (Backlog → In Progress → In Review → Done):
  - [ ] Section header: `┌── COLUMN_NAME [NN] ──` + dashed line spacer (use 1px dashed bottom border on flex-1 span, NOT repeated `─` chars)
  - [ ] Row per card: `│` prefix + columns:
    - HAUL-N (70px wide, mono, `--text-2`)
    - Priority `[Pn]` (28px wide, color-coded)
    - Type `[TSK]` or `[BUG]` (34px wide, red if bug)
    - Title (flex 1, truncated)
    - Assignee `@agent` (green) or `~user` (accent)
    - "● live" if agent working
    - Estimate (right-aligned, 36px)
    - Due date with `~` prefix (`!` if overdue), color by urgency
  - [ ] Selected row: `--accent-bg` background + 2px left border accent
  - [ ] Empty section: `│ // empty` (italic, `--text-3`)
- [ ] **Bottom prompt**: `$ _` with 8×14 blinking accent block cursor
- [ ] Sort cards by: column → priority → due date
- [ ] Click row → open card detail (rail switches)
- [ ] **No drag-drop in this view** (read-oriented)

### 4.3 `<DispatchView>` (fleet bar + prioritised sections)

- [ ] Top: **Fleet bar** (~76px tall, full width, horizontal scroll):
  - [ ] "FLEET" + agent count (left, in pill bordered by `--border`)
  - [ ] One `<DispatchAgentTile>` per agent (220px wide)
- [ ] Below: 4 prioritised columns (flex row, gap 6, equal width, full height):
  - [ ] **Hot** (red dot, "overdue + urgent") — cards where `isOverdue(due) && col !== "c4"`
  - [ ] **In Flight** (accent, "being worked") — `col === "c2"`
  - [ ] **Ready** (green, "in review") — `col === "c3"`
  - [ ] **Queue** (`--text-3`, "backlog") — `col === "c1"`
- [ ] Each section uses the same `<KanbanCard>` component from Kanban view
- [ ] Drag-drop:
  - [ ] In Flight / Ready / Queue accept drops (update column_id accordingly)
  - [ ] Hot section is read-only (filter, not a column)

**`<DispatchAgentTile>`** anatomy:

- [ ] 220px wide, padding 9, `--radius` rounded
- [ ] Working agent: `--accent-bg` background + 3px accent left stripe
- [ ] Idle: `--bg` background
- [ ] Avatar (22px) + @name (mono 11.5px 700) + plugin (9.5px `--text-3`)
- [ ] LIVE / IDLE badge (10×10 right-aligned)
- [ ] "On card" line: `HAUL-N` mono + title (or agent.desc if idle, 26px-tall, 2-line overflow hidden)
- [ ] Load bar (3px) + percentage label

---

## Phase 5 — Focus modal

### 5.1 `<FocusModal>`

- [ ] Trigger: `F` key (when card selected) OR Focus button in card detail
- [ ] Fixed full-viewport overlay, z-index 1000
- [ ] Backdrop: `var(--bg) + f0` alpha + `backdrop-filter: blur(8px)`
- [ ] Click backdrop → close
- [ ] Esc key → close
- [ ] **Inner modal**:
  - [ ] Width `min(720px, 92vw)`, max-height `92vh`
  - [ ] Centered (flex align-items center, justify-content center)
  - [ ] `--surface` bg, 1px `--border`, 14px border-radius
  - [ ] Padding 32 top, 36 left/right, 28 bottom
  - [ ] Box shadow: `0 30px 80px rgba(0,0,0,0.25)`
  - [ ] Stop propagation on inner click
- [ ] **Meta strip** (flex row, gap 8, 11px):
  - [ ] HAUL-N (mono 700, `--accent`)
  - [ ] BUG badge if bug
  - [ ] Epic chip
  - [ ] "·" + "{priority} priority"
  - [ ] "·" + "due {date}" (red if overdue)
  - [ ] `margin-left: auto`
  - [ ] "Esc · close" button
- [ ] **Title** (h1, 32px 600, line-height 1.2, letter-spacing -0.5)
- [ ] **Assignee + actions row** (flex row, gap 12):
  - [ ] Assignee chip (28px) + name + "working alongside you · {plugin}" green status if agent working
  - [ ] `margin-left: auto`
  - [ ] "Mark shipped" button (solid `--accent`)
- [ ] **Description paragraph** (14px, line-height 1.55, `--text-2`)
- [ ] **Progress card** (flex row, gap 12, padding 10/14, `--bg` background, 1px `--border` rounded):
  - [ ] Big "{done}/{total}" (20px 700, mono)
  - [ ] Progress bar (5px tall, `--accent` fill)
  - [ ] "{pct}%" label
- [ ] **Subtasks** list:
  - [ ] Each item: button (transparent bg)
  - [ ] 18px square checkbox (`--accent` filled when done, `--borderHi` outlined when not)
  - [ ] Text (13.5px, strikethrough + `--text-3` when done)
  - [ ] Click toggles complete

---

## Phase 6 — Multiplayer presence

### 6.1 Presence on cards

- [ ] `<KanbanCard>` shows `<PresenceCluster>` with max 3 small (14px) avatars for people currently viewing/editing this card
- [ ] Exclude the assignee from the cluster if they're shown elsewhere on the card
- [ ] Hover the cluster → tooltip listing names + actions
- [ ] Each avatar has a small action-color dot (4px) at bottom-right
- [ ] Cluster appears on Kanban cards and Dispatch tiles (Timeline cards too small)

### 6.2 Top-bar presence cluster

- [ ] `<PresenceCluster>` showing all active collaborators (first 5)
- [ ] Each avatar 24px, overlapped by 7px
- [ ] Each has a 6px pulsing action-color dot bottom-right
- [ ] "+N" overflow text if >5
- [ ] "X active" label after the cluster

### 6.3 Send local presence

- [ ] When the user opens the board, publish: `{ userId, action: "viewing", card: selected, at: now }`
- [ ] When `selected` changes, update presence with new card
- [ ] When user types in card detail (focus into input), update action to `"editing"`
- [ ] Throttle updates to ~1/sec
- [ ] Use WebSocket or SSE (see `BACKEND_GAPS.md`)

---

## Phase 7 — Polish

### 7.1 Keyboard shortcuts

- [ ] `F` (when card selected) → open Focus modal
- [ ] `Esc` in Focus modal → close
- [ ] `C` → open New Issue dialog (placeholder)
- [ ] `⌘K` → open Search/Jump (placeholder)
- [ ] `J/K` → navigate cards in list (placeholder — Terminal/Kanban)
- [ ] `?` → show help overlay (placeholder)
- [ ] Don't fire shortcuts when an input/textarea has focus

### 7.2 URL persistence

- [ ] `view`, `grouping`, `filterAssignee`, `selected` → URL query params
- [ ] On URL change (back/forward), re-read state from query
- [ ] Active board → URL hash (existing pattern in `App.tsx`)

### 7.3 localStorage persistence

- [ ] `themeName` → `taskhauler.theme`
- [ ] `consoleOpen` → `taskhauler.console-open`
- [ ] `railTab` → `taskhauler.rail-tab`

### 7.4 Animations

- [ ] CSS `@keyframes presence-pulse` (1.6s ease-in-out infinite, opacity + scale)
- [ ] CSS `@keyframes fade-in` (320ms, opacity + translateY)
- [ ] CSS `@keyframes blink` (1s steps(1,end) infinite, opacity)
- [ ] Card hover: 120ms transition on shadow + transform
- [ ] Drag-over targets: 120ms background transition
- [ ] Progress bar: 240ms width transition
- [ ] Modal: 200ms fade-in

### 7.5 Accessibility

- [ ] All interactive elements are buttons (not divs)
- [ ] Tab order is sensible
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-current` on active sidebar item
- [ ] `aria-expanded` on collapsible rows
- [ ] Focus visible on all controls
- [ ] Screen reader announcement when card detail opens

### 7.6 Empty states

- [ ] No cards on board → blank board with "Add your first card" CTA
- [ ] No agents connected → empty Console rail with invite CTA
- [ ] No activity → "No recent activity"
- [ ] No proposals → "No plans pending"
- [ ] No subtasks on focused card → "Decompose this card into next steps" placeholder subtask

### 7.7 Error states

- [ ] Card update failed → toast error + revert optimistic UI
- [ ] Proposal execution failed mid-transaction → toast + don't mark approved
- [ ] WebSocket disconnect → "Reconnecting..." indicator next to presence cluster
- [ ] Agent telemetry stale (>30s) → grey out the live dot

---

## Phase 8 — Backend (see BACKEND_GAPS.md)

These items depend on backend work. Stub them with mocked data initially so the frontend works end-to-end:

- [ ] Presence WebSocket / SSE endpoint
- [ ] Activity feed endpoint
- [ ] Proposals CRUD + execute transaction
- [ ] Agent telemetry endpoint
- [ ] Subtasks domain (table + endpoints)
- [ ] Card extensions: `progress`, `estimate`, `blockedBy`
- [ ] AI suggestions endpoint

---

## Definition of "parity"

The implementation has reached parity when:

- [ ] All 4 views (Kanban / Timeline / Terminal / Dispatch) render the existing board's real data
- [ ] All 3 themes switch live and persist
- [ ] Right rail with 3 tabs works (Console / Activity / Plans), even if some data is mocked
- [ ] Card detail opens on click, Focus modal opens on F
- [ ] Multiplayer presence avatars show on top bar and cards (even if just self+a few mock peers)
- [ ] Drag-drop works in Kanban, Timeline, Dispatch
- [ ] Proposals can be approved / rejected and the actions execute
- [ ] Agent telemetry shows for at least one agent (live transcript, load, tokens)
- [ ] Visual design matches the prototype in `prototype/index.html` to a reasonable tolerance

---

## Out of scope for first pass

Things in the prototype but NOT required for parity:

- The "AI suggestions" inline strip (can be empty/hidden initially)
- Search / Jump to (placeholder only)
- New Issue dialog (link to existing creation flow is fine)
- Saved Views (placeholder)
- Inbox / My Issues nav (placeholder)
- Keyboard shortcuts beyond F + Esc
- Animations beyond presence pulse + fade-in

Mark these as "v2" tickets after first ship.
