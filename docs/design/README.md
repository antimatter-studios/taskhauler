# Handoff: Taskhauler Redesign

## Overview

This is a complete redesign of the Taskhauler kanban tool — a project management board that supports both human users **and AI agents** as first-class collaborators. The redesign unifies what would normally be several separate apps (kanban board, timeline, terminal/CLI, ops dashboard) into a **single shell with swappable views**, adds **live multiplayer presence** for humans and agents, surfaces agent activity through a **3-tab right rail** (Console / Activity / Plans), and provides a **fullscreen Focus mode** for deep work on a single card.

The defining feature: cards can be assigned to AI agents the same way they're assigned to humans, and agents report live telemetry (current step, transcript, load, tokens/min) back to the UI so the team can see what's happening in flight.

## About the Design Files

The files in `prototype/` are **design references** — a working interactive prototype built with React 18 + Babel-in-browser + inline styles + mock data. They are **not production code to copy directly**.

The implementation task is to **recreate this design in the existing `frontend/` codebase** (React 19 + Vite + TypeScript + Tailwind 4 + shadcn/ui + Zustand + @dnd-kit) using its established patterns and libraries.

## Fidelity

**High-fidelity.** Colors, typography, spacing, animations, and interaction patterns are final. Use the design tokens in this document verbatim. The only intentional flexibility: where the prototype uses inline styles, the implementation should use Tailwind utilities + CSS custom properties to match the codebase's conventions.

## Target codebase context

Repo: `frontend/` (existing in this project)

| Concern | What's there now |
|---|---|
| Framework | React 19, Vite, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui components (`src/components/ui/`) |
| State | Zustand stores: `kanbanStore`, `agentStore`, `userStore`, `authStore` |
| Drag/drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Icons | `lucide-react` |
| API | `apiClient` in `src/api/client.ts` |
| Types | `src/api/types.ts` |
| Current board | `src/components/KanbanBoard.tsx` (~1818 lines — needs splitting) |
| Theme system | `src/index.css` already uses CSS custom properties (`--background`, `--foreground`, etc.) on `:root` and `.dark` |

The current `KanbanBoard.tsx` is a monolithic file. The redesign reorganises it into `src/components/board/` with one file per concern.

## High-level architecture

```
<Board>                                  ← top-level shell
  <BoardSidebar />                       ← left rail: Inbox / My Issues / AI Suggestions / Boards / Saved Views
  <BoardMain>
    <BoardTopBar />                      ← brand · breadcrumb · presence · theme · search · New Issue · Console toggle
    <BoardFilterRow />                   ← Group by · Filter chips · View switcher (Kanban/Timeline/Terminal/Dispatch)
    <BoardAISuggestionStrip />           ← optional one-line strip with top AI suggestion
    {view === "kanban"   && <KanbanView />}
    {view === "timeline" && <TimelineView />}
    {view === "terminal" && <TerminalView />}
    {view === "dispatch" && <DispatchView />}
  </BoardMain>
  <BoardRightRail>                       ← visible when consoleOpen OR a card is selected
    {selectedCard ? <CardDetail /> : (
      <RailTabs />                       ← Console / Activity / Plans
      <ConsoleRail | ActivityRail | PlansRail />
    )}
  </BoardRightRail>
  {focusedCard && <FocusModal />}        ← fullscreen overlay
</Board>
```

The **chrome stays constant across views**; only the middle pane swaps. The right rail also stays constant — it shows board-wide collaborator state regardless of which view is active.

## Files in this bundle

- `README.md` — this document (full design spec)
- `PARITY_CHECKLIST.md` — sequential plan to ship, owner-facing
- `BACKEND_GAPS.md` — focused doc on backend additions
- `INDEX.md` — short orientation
- `prototype/` — the working prototype
  - `index.html` — boots the prototype
  - `shared.jsx` — mock data (USERS, AGENTS, CARDS, ACTIVITY, PROPOSALS, PRESENCE, etc.) + shared atoms (UserChip, AgentChip)
  - `concept-haul.jsx` — the main shell + KanbanView inline + CardDetail
  - `concept-haul-views.jsx` — Timeline / Terminal / Dispatch views + FocusModal
  - `concept-haul-rails.jsx` — Console / Activity / Plans rail panels
  - `app.jsx` — mount

Open `prototype/index.html` in a browser to see the design live and interact with it. **This is the canonical visual reference** — when in doubt about a styling or interaction detail, check the prototype.

## What's in the rest of this README

- [Design tokens](#design-tokens) — colors, typography, spacing, the 3 theme palettes
- [Avatars](#avatars) — UserChip and AgentChip
- [Top-bar components](#top-bar) — brand, presence cluster, theme switcher, console toggle
- [Sidebar](#sidebar)
- [Filter row & view switcher](#filter-row)
- [Views](#views) — Kanban, Timeline, Terminal, Dispatch
- [Right rail](#right-rail) — Console / Activity / Plans / Card detail
- [Focus modal](#focus-modal)
- [Interactions & keyboard shortcuts](#interactions)
- [State management](#state-management)
- [Frontend file structure](#frontend-file-structure)

See also: **BACKEND_GAPS.md** for the API/data model additions needed.

## Design tokens

### Theme palettes

The design supports **3 themes** (the user picks via swatches in the top bar). All chrome — sidebar, top bar, rail, cards — re-skins live. Themes are independent of layout (view).

Implement themes as **CSS custom properties on `:root[data-theme="..."]`** to match the codebase's existing pattern in `src/index.css` (which already does this for light/dark).

#### Day (default)

Cool neutral with indigo accent. The Linear-ish baseline.

| Token | Value |
|---|---|
| `--bg` | `#fafaf9` |
| `--surface` | `#ffffff` |
| `--hover` | `#f4f4f3` |
| `--border` | `#e7e5e0` |
| `--border-hi` | `#d6d3cd` |
| `--text` | `#18181b` |
| `--text-2` | `#52525b` |
| `--text-3` | `#a1a1aa` |
| `--accent` | `#5b5bd6` (indigo) |
| `--accent-bg` | `#eef0ff` |
| `--accent-fg` | `#ffffff` |
| `--red` | `#dc2626` |
| `--amber` | `#f59e0b` |
| `--green` | `#16a34a` |
| `--font` | `Inter, sans-serif` |
| `--mono` | `'Geist Mono', monospace` |
| `--radius` | `6px` |

#### Mono

Black + amber, JetBrains Mono throughout. Echoes the terminal aesthetic across all views.

| Token | Value |
|---|---|
| `--bg` | `#0c0c0a` |
| `--surface` | `#15140f` |
| `--hover` | `#1e1c14` |
| `--border` | `#2a2820` |
| `--border-hi` | `#3b3826` |
| `--text` | `#e8d9b0` |
| `--text-2` | `#a89770` |
| `--text-3` | `#6b6044` |
| `--accent` | `#facc15` (amber) |
| `--accent-bg` | `rgba(250,204,21,0.10)` |
| `--accent-fg` | `#1c1917` |
| `--red` | `#f87171` |
| `--amber` | `#fbbf24` |
| `--green` | `#84cc16` |
| `--font` | `'JetBrains Mono', 'Geist Mono', monospace` |
| `--mono` | `'JetBrains Mono', 'Geist Mono', monospace` |
| `--radius` | `2px` |

#### Paper

Warm cream with burnt orange accent. Tactile/print feel.

| Token | Value |
|---|---|
| `--bg` | `#f5f0e2` |
| `--surface` | `#fbf7e9` |
| `--hover` | `#ede6cf` |
| `--border` | `#d4cab2` |
| `--border-hi` | `#b8ad8f` |
| `--text` | `#2a251c` |
| `--text-2` | `#5e574a` |
| `--text-3` | `#9a8f78` |
| `--accent` | `#9a3412` (burnt orange) |
| `--accent-bg` | `#fef0e2` |
| `--accent-fg` | `#ffffff` |
| `--red` | `#b91c1c` |
| `--amber` | `#a16207` |
| `--green` | `#65a30d` |
| `--font` | `Inter, sans-serif` |
| `--mono` | `'Geist Mono', monospace` |
| `--radius` | `4px` |

### Theme switcher UX

Three small swatches in the top bar, between New Issue and Search. Each swatch is a 22×22 button with a 14×14 inner mini-square rendered in that theme's `bg` color, bordered by the swatch color, with a 6px center dot in the accent color. The currently-active swatch has a filled outer ring in the accent color.

### Spacing scale

`4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 24 · 32 · 44 · 56 · 80` (in px).

The board is dense — most card-internal gaps are 4–6px, cross-component gaps 8–14px. Avoid spacing larger than 14px between sibling components except in modal layouts.

### Typography

| Use | Size | Weight | Line height | Letter spacing | Family |
|---|---|---|---|---|---|
| Body / default | 13px | 400 | 1.5 | 0 | `--font` |
| Top-bar brand | 13px | 700 | 1.4 | -0.2px | `--font` |
| Sidebar header | 10.5px | 600 | 1.4 | +0.5px UPPER | `--font` |
| Section header (rail) | 10px | 700 | 1.4 | +1.5px UPPER | `--mono` |
| Card title | 12px | 500 | 1.35 | 0 | `--font` |
| Card meta (HAUL-N, pts, dates) | 10–11px | 500 | 1.2 | 0–0.2px | `--mono` |
| Filter chip | 11.5px | 500–600 | 1.2 | 0 | `--font` |
| Detail panel title | 16px | 600 | 1.35 | -0.2px | `--font` |
| Modal h1 (Focus) | 32px | 600 | 1.2 | -0.5px | `--font` |
| Activity text | 12px | 400 | 1.4 | 0 | `--font` |
| Status bar / kbd | 10–10.5px | 600–700 | 1.2 | +0.5px | `--mono` |

### Border radii

Defined per-theme via `--radius`:
- Day: 6px (cards, buttons)
- Mono: 2px (terminal aesthetic — almost square)
- Paper: 4px

Pill / chip radius is always 99px (fully rounded). Avatar radii: users circular (50%), agents hex-clipped via `clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)`.

### Shadows

The design is mostly flat. Three shadow tiers:

| Use | Value |
|---|---|
| Resting card | `0 1px 0 rgba(0,0,0,0.02)` |
| Hover / focus | `0 1px 2px rgba(0,0,0,0.08)` |
| Selected (focus ring) | `0 0 0 3px var(--accent)33` |
| Modal | `0 30px 80px rgba(0,0,0,0.25)` |

Avoid heavy or blurred shadows. In the Mono theme, drop shadows entirely (or use a 1px solid border in `--border-hi` as the elevation cue).

---

## Avatars

### `UserChip` — human avatar

A circular initial-based avatar. Per-user hue stored on the user record drives both background and foreground:

```tsx
function UserChip({ id, size = 22 }) {
  const u = getUser(id);
  const bg = `oklch(0.7 0.13 ${u.hue})`;
  const fg = `oklch(0.25 0.05 ${u.hue})`;
  return (
    <span title={u.name} style={{
      width: size, height: size, fontSize: size * 0.42, fontWeight: 700,
      background: bg, color: fg, borderRadius: "50%",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      letterSpacing: "-0.02em",
    }}>{u.avatar /* 2-letter initials, e.g. "MC" */}</span>
  );
}
```

User hues in the mock data: Mira=12, Theo=200, Sana=290, Jules=140, Wren=40. In production, hash the user's display name to a hue 0–360.

### `AgentChip` — AI agent avatar

A **hexagonal** monospace tile. The hex shape is the agent identity — visually distinct from human circles at a glance.

```tsx
function AgentChip({ name, size = 22, variant = "default" }) {
  // bg/fg per variant — "default" used most often:
  // default:  bg #0f172a, fg #67e8f9, glow #22d3ee
  // terminal: bg #facc15, fg #1c1917 (used in Convoy lanes)
  return (
    <span title={`@${name}`} style={{
      width: size, height: size, fontSize: size * 0.42, fontWeight: 700,
      background: palette.bg, color: palette.fg,
      clipPath: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
      fontFamily: "var(--mono)",
      boxShadow: agent.status === "working" ? `0 0 0 1px ${palette.glow}` : "none",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>{name[0].toUpperCase()}</span>
  );
}
```

When the agent is `status === "working"`, the chip gets a faint cyan ring glow; in some contexts (cards, rail rows) it also gets a small green pulsing dot at the bottom-right corner.

### Presence dot

A 7×8px circle in the action color, pinned to the bottom-right of the avatar via absolute positioning, with a 1.5px box-shadow ring in `--surface` color to lift it off the avatar. Pulsing animation (1.6s ease-in-out infinite):

```css
@keyframes presence-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.4); }
}
```

Dot colors by action: viewing=indigo (`--accent`), editing/commenting=amber, working (agent)=green.

---

## Top bar

Fixed 44px height, full width below the sidebar. Contains (left to right):

1. **Breadcrumb**: `Hauler core / All issues · 15 of 15` — current board name, divider, filter scope, count
2. *(flex spacer)*
3. **Presence cluster**: overlapping avatars of currently-active collaborators (humans + agents). Show first 5, then "X active" label. Each avatar has a pulsing presence dot in its action color. Hover for tooltip with full names + actions.
4. **Theme switcher**: 3 swatches (see Design Tokens)
5. **Search**: a 220px-wide pill input with magnifier icon + "Search or jump to…" placeholder + ⌘K kbd hint at right. Doesn't need to be functional at first pass.
6. **New Issue** button: outline button with plus icon and "C" kbd hint
7. **Console toggle**: solid accent-color pill when on, outlined when off. Shows pulsing green dot + "Console" + working/total agent count (e.g. `3/5`).

Top-bar height is constant across all themes.

## Sidebar

Fixed 200px wide, full height. Sections (top to bottom):

1. **Workspace switcher**: 22px square brand glyph (gradient T monogram) + "Taskhauler" + chevron-down
2. **Top-level nav**:
   - Inbox · count badge
   - My issues · count badge
   - AI suggestions · count badge
3. **Boards** (section header, then list):
   - Each board: 8px square color dot (accent for active, border-hi for inactive) + name + monospace prefix label (HAUL/MKT/MOB)
   - Active board has a surface background + border
4. **Saved views** (section header, then list):
   - Each: filter icon + name. Examples: "Urgent + overdue", "Agent work in flight", "This week"
5. **Current user chip** (at bottom): user avatar + name

Sidebar rows are 26px tall with 5px vertical padding. Section headers are 10.5px UPPERCASE bold in `--text-3`.

## Filter row

40px tall, just below the top bar. Contains (left to right):

1. **"Group" label** + segmented control with 5 options: Status / Priority / Epic / Assignee / Due. Active segment has `--surface` background and subtle drop shadow.
2. **Divider** (1px vertical, `--border`)
3. **"Filter" label** + chip group: `All` · `Mine` · `Agents` (Agents chip has a green pulsing dot when on). Active chip uses `--accent-bg` background + `--accent` border + `--accent` text.
4. *(flex spacer)*
5. **View switcher**: pill group with 4 segmented buttons: Kanban · Timeline · Terminal · Dispatch. Each has a 12px icon and label. Active button has `--surface` background and 0 1px 2px shadow.

Icons used (lucide-react equivalents):
- Kanban: `KanbanSquare` or `Columns3`
- Timeline: `GanttChart` or a custom dot-line-dot
- Terminal: `Terminal` or `ChevronRight` + space
- Dispatch: `LayoutGrid` with a fleet-bar feel — `Radio` or `Network` could also work

## AI suggestion strip (optional)

A 28px-tall strip below the filter row, above the board. Shows: `✨` icon + "5 AI suggestions" (accent) + " — " + the top suggestion text + Apply button (accent) + Dismiss button. Background: subtle gradient from `var(--accent-bg)` to `var(--bg)`. If `suggestions.length === 0`, hide the strip.

---

## Views

The view buttons in the filter row swap the middle pane only. Sidebar, top bar, filter row, and right rail stay constant.

### Kanban view

The default. 4 columns rendered side-by-side, each flex-1 with min-width 200px and gap 4px between columns.

**Column structure**:
- Column header: 8px color dot (per status — accent for In Progress, purple for Review, green for Done, neutral for Backlog) + name (12px semibold) + count (`--text-3`) + spacer + "+" button + "..." button
- Cards: vertical flex, 6px gap
- Empty state: dashed border, "Drop or **+ add**" centered

**Card structure** (the most important component — see prototype `HaulCard`):
- Outer: `--surface` bg, `--border` 1px solid, `--radius` rounded, 8px/10px padding, shadow when not selected
- Top row: priority dot (or 3-bar indicator) + HAUL-N (mono, `--text-3`) + BUG label (if bug) + blocked icon (if blocked) + spacer + presence avatars + comment count + assignee chip
- Title row: 12px medium 500, 2-line clamp
- Meta row: epic chip (color dot + short name) + estimate (pt, mono) + spacer + due date (color by urgency)
- Optional progress bar: 2px tall full-width at bottom, accent fill

**Selected state**: `--accent` border + 3px `--accent`/22 outer ring (use box-shadow). Selected card opens the right rail's Card Detail panel.

**Drag-drop**:
- Use `@dnd-kit` (already in package.json).
- Dragging a card between columns updates `card.column_id`. Position within column uses fractional positions (see existing `positionAfter`/`positionBefore` helpers in `KanbanBoard.tsx`).
- When dragging, drop targets get `--accent-bg` highlight.

**Grouping** (changes how cards are bucketed):
- `col`: standard 4 status columns
- `priority`: Urgent / High / Med / Low (only populated buckets shown)
- `epic`: one column per epic (with epic color dot), plus "No epic"
- `assignee`: one column per assignee with cards (agents grouped together, then users), plus "Unassigned"
- `due`: Overdue / Today / This week / Later / No due date

When grouping is not `col`, dropping between groups should update the corresponding field (priority, epic, assignee, or due date). Status-based dragging only fires when grouping === col.

### Timeline view

Lanes = haulers. Cards positioned on a horizontal day axis.

**Layout**:
- Header row: 200px lane-label column + scrollable days (64px each, ~17 days: today−2 to today+14)
- Day cell shows weekday abbreviation (e.g. MON) + day number; today's cell has accent-bg background; weekends have `--bg` (slightly darker than surface)
- Lane rows below header — auto-height based on packed rows

**Lane label cell** (200px wide, left side of each row):
- Avatar + name + sub (handle for users, "{plugin} · agent" for agents)
- Working agents get a green pulsing dot
- Bottom: workload bar — "{count}t · {pts}pt" label + thin bar. Cap at 21pt (a sprint's worth). Bar fills:
  - Green if ≤70% of cap
  - Amber if 70–100%
  - Red if >100%

**Lane track** (everything to the right of the label):
- Vertical day stripes (1px `--border` between days, weekend = `--bg` background)
- A 2px vertical **yellow today line** at today's x position
- Cards positioned absolutely with right edge = due date, width = `max(80, min(200, estimate * 14))px`
- **Row packing**: sort cards by left edge ascending, then greedily place each card on the lowest row where it doesn't overlap any earlier card. Lane height = `rows * 36 + 16` (with a minimum of 58px so labels are readable).
- Empty lane: shows "no haul scheduled — drop a card to assign" placeholder

**Timeline card** (a thinner version of the kanban card, 32px tall):
- Left stripe: 3px wide, epic color (or asphalt if no epic)
- Working dot (if agent assignee is working)
- HAUL-N (mono small)
- Title (truncates with ellipsis)
- P0 badge if urgent (red box, top-right)
- Border red if overdue, otherwise epic color
- Selected: accent border + 3px accent/55 outer ring

**Drag-drop**:
- Dragging a card onto a different lane reassigns it.
- Dragging onto a different x-position changes the due date (round nearest day = `(x / 64) + startDayOffset`).
- The drop handler receives both the lane id and the x offset.

### Terminal view

A monospace flat list grouped by status. The card data is presented as a CLI command output.

**Page structure**:
```
$ board --list --group=column --sort=priority,due

┌── BACKLOG [05] ──────────────────────…
│ HAUL-143  [P0]  [BUG]  Magic-link expiration not respecting TZ              @scout  ●live  2pt  ~today
│ HAUL-145  [P1]  [BUG]  Quarterly invoicing webhook stalls @ 50k rows                       13pt  ~3d
│ ...

┌── IN PROGRESS [04] ──────────────────…
│ HAUL-140  [P0]  [BUG]  SAML response signature edge case                     ~sana         5pt  !1d overdue
│ ...

$ _   ← blinking cursor
```

**Row anatomy** (each `│`-prefixed line):
- Left tab `│` (in `--text-3`)
- HAUL-N (70px wide, mono, `--text-2`)
- Priority `[Pn]` (28px wide, color-coded: P0=red, P1=amber, P2=accent, P3=text-3)
- Type `[TSK]` or `[BUG]` (34px wide, red if bug)
- Title (flex 1, truncates)
- Assignee (`@agent` in green or `~user` in accent)
- "● live" if agent is working (small, green)
- Estimate (right-aligned, mono)
- Due date with prefix: `~` for normal, `!` for overdue, color amber if soon, red if overdue

Section dividers: `┌── COLUMN_NAME [count] ──…` — the box-drawing chars are literal Unicode (`┌`, `─`, `│`); the trailing dashed area is implemented as a 1px dashed bottom border on a flex-1 spacer, NOT as repeated ─ characters (which break at narrow widths).

The view always renders in monospace regardless of theme (use `var(--mono)`), but colors come from the theme palette. The Mono theme is the most coherent for this view.

**Bottom**: a final `$ _` line with a blinking 8×14px accent-color block cursor (`animation: blink 1s steps(1,end) infinite`).

**Selected row**: `--accent-bg` background + 2px left border accent.

No drag-drop in terminal view (it's a read-oriented view). Click a row to open card detail.

### Dispatch view

Agent-first ops dashboard. Fleet bar at top, prioritised work sections below.

**Fleet bar** (top, ~76px tall, full width, scrollable horizontally if needed):
- "FLEET" label + agent count (mono, big)
- One **agent tile** per agent (220px wide):
  - Tile has `--accent-bg` background if working, `--bg` if idle
  - 3px accent left stripe when working
  - Avatar + @name (mono) + plugin (small)
  - LIVE / IDLE badge (top right, pill)
  - 2-line "on card" text: `HAUL-N` mono + title (or agent.desc if idle)
  - Load bar at bottom + percentage label

**4 prioritised sections** below fleet bar (horizontal, equal width):
- **Hot** (red) — `isOverdue(card.due) && col !== "c4"` — "overdue + urgent"
- **In Flight** (accent) — `col === "c2"` — "being worked"
- **Ready** (green) — `col === "c3"` — "in review"
- **Queue** (text-3) — `col === "c1"` — "backlog"

Each section uses the same dense card component as the Kanban view (`renderCard` is passed in as a prop so the same component renders consistently across views).

Drag a card onto a section that maps to a column (c1/c2/c3) to move it; the Hot section isn't a drop target (it's a filter, not a column).

---

## Right rail

Width 340px, full main-area height, slides in from the right when (`consoleOpen` OR card is selected).

Two modes:

**Card selected mode**: shows `<CardDetail>` (see below). When `consoleOpen` is also true, shows a "← Back to console" bar at top of the panel that, when clicked, deselects the card.

**Console mode** (no card selected): shows `<RailTabs>` + the active tab's panel.

### `<RailTabs>`

Three-segment control at top of rail. Each tab shows: label + count badge.
- Console — count of working agents
- Activity — count of events in current view (default 14)
- Plans — count of pending proposals

### Console tab — live presence

Two sections: **active now** and **idle**.

Each presence row contains:
- Avatar (with action-colored pulsing dot when active)
- Name (mono for agents, sans for users)
- USER / AGENT tag (small pill)
- "{time} ago" right-aligned
- Action line below: action verb (viewing/editing/commenting/working/scanning) in action color + HAUL-N chip + truncated card title
- For agents: chevron to expand
- For working agents (expanded or not): load% + tokens/min, with a load bar (green/accent/amber based on %)
- For working agents (expanded): a 4-line scrolling transcript in mono, top line full opacity, lower lines fading. The transcript cycles every 3.2s to feel live.

Bottom CTA: "+ Invite people or hauler agents" dashed-border button.

**Live behavior**: A `setInterval` ticks every 3.2s and advances each working agent's transcript line by 1. In production, fetch real telemetry from a polling endpoint or SSE/WebSocket (see BACKEND_GAPS.md).

### Activity tab — chronological feed

Top: filter chips `All` · `Agents` · `Comments` · `Ships`. Active chip uses accent border + bg.

Body: events sorted by `at` descending, grouped into 3 buckets:
- **Just now** — < 0.5 hours ago
- **Earlier today** — 0.5–8 hours ago
- **Yesterday+** — > 8 hours ago

Each event row:
- Actor avatar (left) — agent or user
- Top line: actor name + kind pill (AGENT/NOTE/MOVE/ASSIGN/NEW/SHIP, color-coded) + relative time
- Text line: the event description
- Card chip: `HAUL-N · title` in a small bordered chip if the event references a card

A 1px vertical line at x=24 connects the avatars visually (subtle, `--border`).

**Live behavior**: When new events arrive (poll or stream), prepend with a `fade-in` animation (320ms).

### Plans tab — proposals queue

A list of multi-step plans waiting for review. **Proposals can come from both humans and agents.** This is the unique idea of this design — agents propose changes (split a card, reassign multiple cards, archive done cards), and humans approve/reject. Humans can also propose plans.

Two sections: **pending** and **recently decided**.

Each proposal card:
- Proposer avatar (with AI badge if agent — small accent pill in bottom-right corner)
- Proposer name + "proposes" + relative time
- Title (13px semibold)
- Status pill (PENDING/APPROVED/REJECTED) + action count + confidence% (if from agent)
- Chevron to expand

Expanded view:
- Summary paragraph
- Action list (in a monospace bordered box) — each line shows the action kind in color + a human-readable description:
  - PRIORITY: set HAUL-129 priority high → low
  - MOVE: move HAUL-138 In Progress → In Review
  - LABEL: add label "stale" to HAUL-146
  - SPLIT: split HAUL-138 into 3 cards
  - PING: ping @sana re: HAUL-140
  - ARCHIVE: archive 9 cards
- For pending: **Approve** (primary accent), **Reject** (outline), **Edit** (outline)
- For approved: "Approved by {name} · executed" (green)
- For rejected: "Rejected by {name} — '{reason}'" (text-3, italic)

Bottom CTA: "+ Propose a plan" primary button.

When the user **approves** a plan, the actions execute atomically (transaction). When rejected, it's marked rejected with optional reason. Edit opens a flow to modify the actions before approving.

### `<CardDetail>` — when a card is selected

44px top header bar:
- HAUL-N (mono, small, text-3)
- Right side: **Focus** button (outline, with "F" kbd hint) + **Close** button (subtle)

Body (scrollable):
- h3 title
- 2-column grid (80px label + value):
  - Status (with color dot)
  - Priority (with priority indicator)
  - Assignee (with chip + WORKING badge if agent is live)
  - Epic (with epic color dot)
  - Due (red if overdue)
  - Estimate (mono pt)
  - Labels (comma-split into small bordered chips)
- **Agent activity** section: events filtered to this card, same row design as the Activity rail
- **AI suggested** section: one-action card (`✨ Move to In Review — PR merged, tests green` + Apply link)

---

## Interactions & keyboard shortcuts

| Shortcut | Action |
|---|---|
| Click card | Open card detail in rail |
| **F** (with a card selected) | Open Focus modal |
| **Esc** (in Focus modal) | Close Focus modal |
| **C** | New issue (placeholder — not implemented in prototype) |
| **⌘K** | Search (placeholder — not implemented in prototype) |
| Drag card between columns (Kanban) | Change `column_id` |
| Drag card between groups (Kanban with non-status grouping) | Change the grouping field (priority/epic/assignee/due) |
| Drag card to a different lane (Timeline) | Reassign to that hauler |
| Drag card to a different x (Timeline) | Reschedule `due` to that day |
| Drag card between Hot/InFlight/Ready/Queue sections (Dispatch) | Change column (Hot is read-only filter) |
| Click theme swatch | Swap color palette + font live |
| Click console toggle | Show / hide right rail (when no card selected) |
| Click rail tab | Switch between Console / Activity / Plans |
| Click "← Back to console" in rail header (when card selected + console open) | Deselect card and return to rail tabs |
| Click "Approve" on a proposal | Mark approved + execute actions atomically |
| Click "Reject" on a proposal | Mark rejected (optionally with reason) |
| Click subtask checkbox in Focus modal | Toggle subtask complete |

### Animations

| Element | Animation |
|---|---|
| Presence dot, agent green dot | `pulse` — 1.6s ease-in-out infinite (opacity 1→0.6, scale 1→1.4) |
| New activity event arrives | `fade-in` — 320ms (opacity 0→1, translateY -4px→0) |
| Modal open | `fade-in` — 200ms |
| Drag drop target highlight | 120ms background transition |
| Theme swap | Instant — no animation (the chrome simply re-renders with new palette) |
| Card hover | 120ms shadow + transform translateY(-1px) |
| Progress bar fill | 240ms width transition |
| Transcript line cycle | 3.2s interval, top line full opacity, lower lines fading by 0.18 per step |

---

## State management

State lives in the top-level `<Board>` component in the prototype. In production, split between Zustand stores and URL/localStorage.

| State | Type | Where (production) |
|---|---|---|
| `cards[]` | Card[] | `useKanbanStore` (already exists) |
| `columns[]`, `epics[]` | derived | `useKanbanStore` (already exists) |
| `grouping` | "col"\|"priority"\|"epic"\|"assignee"\|"due" | URL query param |
| `view` | "kanban"\|"timeline"\|"terminal"\|"dispatch" | URL query param |
| `selected` (selected card id) | string \| null | URL hash or query param |
| `focusedId` | string \| null | Local component state |
| `consoleOpen` | boolean | localStorage (persist user preference) |
| `railTab` | "console"\|"activity"\|"plans" | localStorage |
| `themeName` | "day"\|"mono"\|"paper" | localStorage + applied as `data-theme` attr on `<html>` |
| `filterAssignee` | "all"\|"mine"\|"agents" | URL query param |
| `dragOver` | string \| null | Transient (drag state) |
| `presence[]` | Presence[] | `usePresenceStore` (new — see BACKEND_GAPS.md) |
| `activity[]` | ActivityEvent[] | `useActivityStore` (new) |
| `proposals[]` | Proposal[] | `useProposalsStore` (new) |
| `agentTelemetry` | per-agent live state | `useAgentTelemetryStore` (new, polled or streamed) |

URL persistence makes the board's state shareable as a link — important for collaboration.

---

## Frontend file structure (proposed)

The existing `src/components/KanbanBoard.tsx` (1818 lines) should be broken up. Proposed structure:

```
src/
├── api/
│   ├── client.ts             (existing — extend with new endpoints)
│   ├── types.ts              (existing — add Proposal, PresenceEntry, etc.)
│   ├── presence.ts           (NEW — WebSocket / SSE client)
│   └── activity.ts           (NEW — activity feed polling)
├── stores/
│   ├── kanbanStore.ts        (existing — minor extensions)
│   ├── userStore.ts          (existing)
│   ├── agentStore.ts         (existing — extend with telemetry)
│   ├── presenceStore.ts      (NEW)
│   ├── proposalsStore.ts     (NEW)
│   ├── activityStore.ts      (NEW)
│   └── boardUIStore.ts       (NEW — view, theme, console toggle, rail tab)
├── lib/
│   ├── utils.ts              (existing)
│   ├── positions.ts          (NEW — extract positionAfter/positionBefore)
│   ├── pack-rows.ts          (NEW — greedy row packing for Timeline)
│   ├── time.ts               (NEW — fmtDue, fmtAgo, etc.)
│   └── theme.ts              (NEW — theme palettes + CSS var application)
├── components/
│   ├── ui/                   (existing shadcn/ui components)
│   └── board/                (NEW)
│       ├── Board.tsx              (shell, routes between views)
│       ├── BoardSidebar.tsx
│       ├── BoardTopBar.tsx
│       ├── BoardFilterRow.tsx
│       ├── BoardAISuggestionStrip.tsx
│       ├── BoardRightRail.tsx     (orchestrates Console/Activity/Plans/Detail)
│       ├── views/
│       │   ├── KanbanView.tsx
│       │   ├── TimelineView.tsx
│       │   ├── TerminalView.tsx
│       │   └── DispatchView.tsx
│       ├── rail/
│       │   ├── RailTabs.tsx
│       │   ├── ConsoleRail.tsx
│       │   ├── ActivityRail.tsx
│       │   ├── PlansRail.tsx
│       │   └── CardDetailPanel.tsx
│       ├── cards/
│       │   ├── KanbanCard.tsx     (the dense card used by Kanban + Dispatch)
│       │   ├── TimelineBar.tsx    (slim card for Timeline)
│       │   ├── TerminalRow.tsx
│       │   └── DispatchAgentTile.tsx
│       ├── overlays/
│       │   └── FocusModal.tsx
│       └── primitives/
│           ├── UserChip.tsx
│           ├── AgentChip.tsx
│           ├── AssigneeChip.tsx
│           ├── PresenceDot.tsx
│           ├── PresenceCluster.tsx
│           ├── PriorityIndicator.tsx  (the bars)
│           └── EpicChip.tsx
└── index.css                 (existing — add theme CSS variable definitions)
```

### Theme CSS

Append to `src/index.css`:

```css
:root[data-theme="day"] {
  --bg: hsl(0 0% 98%);
  --surface: hsl(0 0% 100%);
  --hover: hsl(40 8% 95%);
  --border: hsl(40 12% 90%);
  --border-hi: hsl(40 10% 82%);
  --text: hsl(240 6% 10%);
  --text-2: hsl(240 4% 36%);
  --text-3: hsl(240 4% 65%);
  --accent: hsl(244 60% 60%);          /* #5b5bd6 */
  --accent-bg: hsl(232 100% 96%);
  --accent-fg: hsl(0 0% 100%);
  --red: hsl(0 73% 51%);
  --amber: hsl(38 92% 50%);
  --green: hsl(142 71% 36%);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --radius: 6px;
}

:root[data-theme="mono"] {
  --bg: hsl(54 11% 4%);
  --surface: hsl(48 13% 7%);
  --hover: hsl(45 16% 10%);
  --border: hsl(45 13% 14%);
  --border-hi: hsl(45 17% 19%);
  --text: hsl(45 50% 80%);
  --text-2: hsl(42 25% 55%);
  --text-3: hsl(40 22% 34%);
  --accent: hsl(48 96% 53%);           /* #facc15 */
  --accent-bg: hsla(48, 96%, 53%, 0.10);
  --accent-fg: hsl(24 9% 10%);
  --red: hsl(0 91% 71%);
  --amber: hsl(45 96% 56%);
  --green: hsl(82 78% 47%);
  --font-sans: 'JetBrains Mono', 'Geist Mono', monospace;
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace;
  --radius: 2px;
}

:root[data-theme="paper"] {
  --bg: hsl(43 38% 92%);
  --surface: hsl(44 50% 95%);
  --hover: hsl(40 33% 87%);
  --border: hsl(38 26% 76%);
  --border-hi: hsl(38 19% 64%);
  --text: hsl(33 20% 14%);
  --text-2: hsl(33 12% 33%);
  --text-3: hsl(34 13% 54%);
  --accent: hsl(19 81% 34%);           /* #9a3412 */
  --accent-bg: hsl(33 90% 94%);
  --accent-fg: hsl(0 0% 100%);
  --red: hsl(0 75% 42%);
  --amber: hsl(33 91% 35%);
  --green: hsl(83 78% 44%);
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --radius: 4px;
}

body { background: var(--bg); color: var(--text); font-family: var(--font-sans); }
```

Use these vars in Tailwind via `@theme` in your Tailwind config, or use `bg-[var(--surface)]` arbitrary values inline.

---

## Implementation order (suggested)

1. **Theme system + design tokens** — get CSS vars in place + the swatch switcher. This unlocks all subsequent styling.
2. **Kanban view + dense card** — replaces existing `KanbanBoard.tsx` board area. Reuse the existing API/store wiring.
3. **Card detail panel** — replaces the existing side panel. Add Focus button (but FocusModal can be a placeholder).
4. **Sidebar + top bar shell** — these are mostly static.
5. **Filter row + view switcher buttons** (initially only Kanban view works, others render a "Coming soon" placeholder).
6. **Timeline view** — depends on `positions.ts` + `pack-rows.ts` helpers and adds drag-drop to reschedule.
7. **Dispatch view** — small once Kanban card exists, since it reuses the card component.
8. **Terminal view** — pure styling once the data is in place.
9. **Console rail** — needs agent telemetry backend (or stub).
10. **Activity rail** — needs activity feed backend (or polled).
11. **Plans rail** — needs proposals domain in backend.
12. **Presence avatars + cluster** — needs realtime backend.
13. **Focus modal** — once subtasks are persisted somewhere.

See **PARITY_CHECKLIST.md** for a granular, component-by-component checklist that mirrors this order.

---

## Open product questions

These are decisions the implementer / PM should confirm:

- **Realtime presence**: WebSocket vs polling SSE vs short polling? Affects backend stack.
- **Proposal execution**: Server-side transaction (preferred — atomic) or client-side ops chain (cheaper)?
- **Agent telemetry source**: Where does `step`, `tok` (tokens/min), and the transcript come from? Likely the agent runtime needs to emit events to your backend.
- **Subtasks**: Stored as a separate `subtasks` table with FK to `card_id`, or as markdown checkboxes inside `card.description`? Recommend the former for state tracking.
- **Theme persistence**: Per-user (saved server-side) or per-device (localStorage)?
- **View persistence**: Per-board (each board remembers its last view) or global?
- **"Hauler" terminology**: The prototype leans into "hauler" as the metaphor (lanes = haulers, "Invite people or hauler agents", "Dispatch", "New haul"). Keep, soften, or drop entirely?

See **BACKEND_GAPS.md** for the API/data work each of these depends on.
