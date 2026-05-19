# v2 Implementation Inventory — Summary

## Totals

- **Entries inventoried:** 59 files (everything in `frontend/src/` plus `index.html`).
- Build: clean (`tsc -b && vite build` → exit 0, 1634 modules, 349.5 kB JS, 30.4 kB CSS).

### Count by category

| Category | Count |
|---|---|
| Shell entry / scaffolding (index.html, main.tsx, App.tsx, index.css, LoginForm) | 5 |
| `lib/` utilities (time, theme, positions, pack-rows, utils) | 5 |
| `api/` (client, types) | 2 |
| `stores/` (boardUI, kanban, auth, user, agent) | 5 |
| `mock/` (data + README) | 11 |
| Board shell (Board, Sidebar, TopBar, FilterRow, AIStrip, RightRail) | 6 |
| Primitives (8 files) | 8 |
| Cards (4 files) | 4 |
| Views (Kanban, Timeline, Terminal, Dispatch, ViewSwitcher, index) | 6 |
| Rail panels (RailTabs, Console, Activity, Plans, CardDetailPanel) | 5 |
| Overlays (FocusModal) | 1 |
| vite-env.d.ts | 1 |
| **Total** | **59** |

---

## Broken or risky (concrete)

Critical (runtime no-ops; build still passes because of `as any` + optional-call):

1. **`BoardFilterRow.tsx` grouping IDs are wrong.** Sends `"status"` while store/`KanbanView` expects `"col"`. Clicking the "Status" group button (first segment) makes the board render empty. `BoardFilterRow.tsx:5-11` vs `KanbanView.tsx:145`.
2. **`BoardFilterRow.tsx` filter setter doesn't exist.** Reads `(s as any).setFilterAssignee` — store only has `setFilter`. All/Mine/Agents chip clicks are silent no-ops. `BoardFilterRow.tsx:40`.
3. **`Board.tsx` focus shortcut setter doesn't exist.** Reads `(s as any).setFocusedCardId` — store only has `focusCard`. F key + Esc focus reset are silent no-ops. `Board.tsx:21`.
4. **`BoardRightRail.tsx` close-card setter doesn't exist.** Reads `(s as any).setSelectedCardId` — store only has `selectCard`. "Back to console" link is a silent no-op. `BoardRightRail.tsx:19-20`.

Important but lower-impact:

5. **Two estimate hashes diverge** between `KanbanCard` (and TerminalRow/TimelineView) and `CardDetailPanel.tsx:26`. Same card shows N pt in the column and a different M pt in detail.
6. **Mark Shipped target column is heuristic.** If board has no column literally named "Done" (case-insensitive), the action moves the card to whatever column has the highest `position` — could be wrong (e.g. an "Archive" column). `FocusModal.tsx:138`.
7. **No error UI for failed mutations** — all `updateCard` calls in KanbanView/TimelineView/DispatchView/FocusModal fire-and-forget. Failures just log nothing (kanbanStore doesn't catch). Cards visually rubber-band silently on rollback (which doesn't happen, so cards stay in place).
8. **HAUL-N hardcoded** in `CardDetailPanel` header and `FocusModal` meta strip — ignores `board.prefix`. Multi-board users will see wrong prefix in those two surfaces.
9. **Theme palette literals duplicated.** Day/mono/paper hex values appear in both `index.css` and `BoardTopBar.tsx` ThemeSwitcher (independent source of truth — easy to drift).
10. **PresenceEntry shape mismatch.** `mock/presence.ts` uses `agent_name`/`user_id`/`at`; `PresenceCluster.tsx` defines its own with `name`/`userId`. Callers cast `as any` — TS won't catch a rename.
11. **No onClick on many CTAs:** Sidebar workspace switcher, all NavRows, saved views, "New issue", Plus / MoreHorizontal column-header icons, "Invite people or hauler agents", "Propose a plan".
12. **`BoardTopBar` filter count is fake.** Says "filter logic lives in the views layer", so the breadcrumb's "N of N" is always `total of total`.
13. **`main.tsx` writes `dark` class** but the theme system is `data-theme` — class is dead.
14. **`ViewSwitcher.activeBoardId` is unused.** Plumbed by Board.tsx, accepted as `_props`.
15. **`alert()` placeholders** in PlansRail (Approve/Reject/Edit) and CardDetailPanel (Apply suggestion).
16. **mockEstimate inlined three times** (KanbanCard, TerminalRow, TimelineView).
17. **resolveCard / reverseMockId / indexCards duplicated** across ConsoleRail / ActivityRail / CardDetailPanel / FocusModal.
18. **TimelineView lane data fields** `handle`/`avatar` are populated but never read in `LaneRow`.
19. **AgentChip palettes** are hardcoded (cyan or yellow) and don't theme — looks fine in mono, fights day/paper.
20. **EpicChip's data-theme=mono override** described in the docstring isn't actually implemented.

---

## Surprisingly well-implemented (don't double-check these)

- **`lib/pack-rows.ts`** — clean greedy algorithm with stable sort, used correctly by TimelineView. Worth keeping.
- **`lib/positions.ts`** — float-midpoint position model from v1, correct.
- **`lib/time.ts`** — `fmtDue` bucketing is precise and produces the documented strings. `fmtAgo` clamps negatives to 0.
- **`lib/theme.ts`** — proper localStorage validation, SSR-safe.
- **`api/client.ts`** — solid: 401-refresh singleton, ApiError class, 204/empty-body handling, retry guard.
- **`stores/kanbanStore.ts`** — clean CRUD with epic cascade on delete + escape-hatch `setCards`/`setColumns` mutators.
- **`mock/*`** data is realistic, consistent, and well-organized; README documents the placeholder remapping convention precisely.
- **`KanbanView` grouping logic** — all 5 modes (col/priority/epic/assignee/due) are fully wired with sensible drop payloads. The filter chip wiring is broken, but the view itself is fine.
- **`TimelineView` drop coordinate math** — pointer-to-day calculation using `activatorEvent + delta + scrollLeft` is correct.
- **`FocusModal` subtask persistence** — clean localStorage seed-from-mock-then-overwrite flow with proper portal + Esc handling.
- **`ConsoleRail` transcript cycling** — sets up + tears down 3.2s interval correctly, indexes modulo lines per agent.
- **`PlansRail` action rendering** — `PlanActionLine` handles all 8 ProposalAction kinds with sensible English. Just don't expect the buttons to do anything.
- **Theme system end-to-end** — three palettes via `data-theme`, persisted, applied before paint (twice — App and Board).
- **`primitives/`** — all 8 primitives are small, focused, prop-clean. No funny business.

---

## File paths confirmed

Both outputs written:

- `/tmp/v2-impl-inventory.md` — 59 entries, verification scan at bottom.
- `/tmp/v2-impl-inventory-summary.md` — this file.
