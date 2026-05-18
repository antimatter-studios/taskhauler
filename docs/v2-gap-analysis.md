# Frontend v2 — Gap Analysis & Audit Findings

> **Generated:** May 2026 against the version of frontend-v2 at commit `6879de1` (audit fixes), backend-v1 at the same head, and the Task Hauler board state with **148 cards** (up from 99 at start of audit).
>
> **Purpose:** Reconcile what the v2 spec demands, what the v2 implementation actually delivers, and what the Task Hauler board tracks. Find every gap, drift, and decision-pending item. Convert findings into cards on the board so nothing is lost.

## TL;DR

| Bucket | Count |
|---|---:|
| **Spec entries inventoried** ([v2-spec-inventory.md](v2-spec-inventory.md)) | 210 |
| **Implementation files inventoried** ([v2-impl-inventory.md](v2-impl-inventory.md)) | 59 |
| **Board cards before audit** | 99 |
| **Board cards after audit** | **148** (+49) |
| Critical runtime bugs found AND fixed in code | 4 |
| Other implementation bugs / smells found | 16 |
| Refactor opportunities | 5 |
| Spec ambiguities requiring a decision | 16 |
| Open-question decision points | 6 |
| Spec features needing finer-grained tracking | 9 |

Every finding has a TH-NN card on the board. Every existing card that needed clarification got a comment.

Companion inventory documents (all in this directory):
- [v2-spec-inventory.md](v2-spec-inventory.md) — 210 SPEC-NN entries with acceptance criteria
- [v2-spec-inventory-summary.md](v2-spec-inventory-summary.md) — counts + 16 ambiguities + 14 prototype↔README divergences
- [v2-impl-inventory.md](v2-impl-inventory.md) — 59 file-level entries with hardcoded/mock/incomplete flags + verification scan
- [v2-impl-inventory-summary.md](v2-impl-inventory-summary.md) — 20 risk items + "surprisingly well-implemented" list
- [v2-board-inventory.md](v2-board-inventory.md) — full text of all 99 (now 148) cards grouped by epic
- [v2-board-coverage-map.md](v2-board-coverage-map.md) — flat grep map for fast cross-reference

---

## Method

1. **Spec analyst** (parallel agent) read every line of `frontend-v2-src/{README,PARITY_CHECKLIST,BACKEND_GAPS,SCREENSHOTS,INDEX}.md` + all 5 prototype JSX files and produced **210 SPEC-NN entries** with category, description, acceptance criteria, dependencies, line refs.

2. **Implementation analyst** (parallel agent) read every file in `frontend-v2/src/` + `index.html` (59 files) and produced an inventory with what each file implements, what's hardcoded/mock, what looks incomplete or wrong. Ran `npm run build`, grepped for TODO/FIXME/as any/console/alert.

3. **Board analyst** (parallel agent) fetched all 99 cards via the API plus their comments, grouped them by epic, produced a flat grep map of "what each card claims to track."

4. **Reconciliation** (this agent, manually) cross-referenced the three inventories category-by-category. For each gap or drift, decided: new card, comment on existing card, or both. Fixed the four highest-impact runtime bugs directly in code.

5. **Post-audit board state** has 148 cards across 17 epics (2 new: "Audit: bugs & drift" and "Decisions / spec ambiguities").

---

## Critical runtime bugs (FIXED in code, tracked as cards)

The parallel-agent build introduced four `(s as any).setX?.()` calls to methods that don't exist on `boardUIStore`. The optional-chain plus the `as any` cast let TypeScript pass; the UI silently did nothing. All four were live until this audit pass.

| Card | File | Was | Is now | Effect on UX |
|---|---|---|---|---|
| TH-100 | `BoardFilterRow.tsx` | `id: "status"` (first group) | `id: "col"` | Clicking "Status" was emptying the board because KanbanView's grouping dispatcher didn't recognise it. Now actually groups by column. |
| TH-101 | `BoardFilterRow.tsx` | `setFilterAssignee` (does not exist) | `setFilter` | All / Mine / Agents chips were silent no-ops. Now filter cards. |
| TH-102 | `Board.tsx` | `setFocusedCardId` (does not exist) | `focusCard` | F + Esc keyboard shortcuts were silent no-ops. Now opens / closes FocusModal. |
| TH-103 | `BoardRightRail.tsx` | `setSelectedCardId` (does not exist) | `selectCard` | "← Back to console" link was a silent no-op. Now deselects card and returns to rail tabs. |

All four cards moved to **Done** with `type: bug` and reference commit `6879de1` in their descriptions.

**Lesson:** the `(s as any).setX?.()` pattern is a TS-silencer that masks real bugs. Future builds should reference store methods by name and let TS fail loudly. Tracked as a coding-style note via TH-36's audit comment.

---

## Implementation bugs (Backlog cards)

These are real bugs the impl audit surfaced. All have TH-NN cards.

| Card | Problem | Workaround until fixed |
|---|---|---|
| TH-104 | `mockEstimate` hashes diverge between KanbanCard and CardDetailPanel | Same card shows different point values in list vs detail |
| TH-105 | Mark Shipped uses last-position column when no "Done" exists | Cards on non-standard boards land in the wrong column |
| TH-106 | Card mutations have no error UI — silent rollback failures | User sees nothing when API returns 4xx/5xx |
| TH-107 | HAUL-N hardcoded in CardDetailPanel + FocusModal | Multi-board users see wrong prefix in those two surfaces only |
| TH-108 | `main.tsx` writes `.dark` class but theme system reads `data-theme` | Dead code; cleanup |
| TH-109 | `ViewSwitcher.activeBoardId` prop is unused | Dead prop; cleanup or wire up |
| TH-110 | `TimelineView` lane `handle`/`avatar` fields populated but never read | Dead code; clarify or remove |
| TH-111 | `AgentChip` palette hardcoded — doesn't adapt to active theme | Looks great in Mono, fights Day and Paper |
| TH-112 | `EpicChip`'s documented mono-theme override isn't implemented | Docstring drift; reconcile |
| TH-116 | `BoardTopBar` filter count is fake — always `total of total` | Cosmetic; misleads on filter scope |

---

## Refactors (Backlog cards)

Code-quality items, not bugs but worth addressing.

| Card | Issue |
|---|---|
| TH-113 | Theme palette literals duplicated in `index.css` + `BoardTopBar` ThemeSwitcher |
| TH-114 | `PresenceEntry` shape mismatch between `mock/presence.ts` and `PresenceCluster` |
| TH-115 | Many sidebar CTAs have no `onClick` (workspace, nav, saved views, +, More, etc.) |
| TH-117 | `mockEstimate` inlined 3 times (Kanban / Terminal / Timeline) |
| TH-118 | `resolveCard` / `reverseMockId` / `indexCards` duplicated across 4 rail files |
| TH-119 | `alert()` placeholders should become real toasts |

---

## Spec ambiguities (Backlog cards in Decisions epic)

Real ambiguities surfaced by the spec analyst — places where the README, PARITY_CHECKLIST, prototype JSX, and screenshots disagree. Each needs a product/design decision.

| Card | Decision |
|---|---|
| TH-120 | CardDetail "Agent activity" section header typography (mono vs sans) |
| TH-121 | TimelineView today-line — left edge or right edge of today's cell? |
| TH-122 | TimelineView day header height — 44px or 42px? |
| TH-123 | AgentChip "terminal" variant — what context activates it? |
| TH-124 | TerminalView sort order — prompt says priority,due but prototype sorts column-first |
| TH-125 | AI suggestion strip gradient — theme-aware or hardcoded? |
| TH-126 | Top-bar PresenceCluster — `+N` visible inside or just "X active" label? |
| TH-127 | Suggestion `link` kind — how is it rendered? |
| TH-128 | ProposalAction `assign` and `due` kinds — action-line rendering templates |
| TH-129 | ActivityRail kind pill colors for `label` and `priority` events |
| TH-130 | "Hauler" terminology — keep, soften, or drop? |
| TH-131 | PresenceCluster tooltip behaviour — cluster-level or per-avatar? |
| TH-132 | Activity batched arrivals — fade-in only index 0 or all "now" bucket? |
| TH-133 | WORKING badge styling — text+dot or pill? |
| TH-134 | Mono theme drop-shadow stance — none or 1px solid border-hi? |
| TH-135 | ThemeSwitcher active swatch style — ring or filled background? |

## Open product questions (Backlog cards in Decisions epic)

These are the README's explicitly-flagged "Open product questions" (§ near the bottom). Each has a TH-NN card.

| Card | Question |
|---|---|
| TH-145 | Theme persistence scope — per-user (server) or per-device (localStorage)? |
| TH-146 | View persistence scope — per-board or global? |
| TH-147 | Realtime transport for presence — WebSocket / SSE / short-poll? |
| TH-148 | Proposal execution — server-side DB transaction or client-side ops chain? |

The other two open questions (agent telemetry source SPEC-184, subtasks storage SPEC-185) are already covered by TH-77 and TH-74 respectively.

---

## Spec features needing finer-grained tracking (Backlog)

These spec entries existed but weren't represented as individual cards. Now they are.

| Card | What it tracks |
|---|---|
| TH-136 | Spec: spacing scale (13 step values) — codify as `--space-*` CSS vars |
| TH-137 | Spec: typography scale — 10 type styles with exact size/weight/lh/ls/family |
| TH-138 | Spec: shadow tiers — 4 levels + Mono drops shadows entirely |
| TH-139 | Empty state: no boards at all |
| TH-140 | Empty state: empty Kanban column |
| TH-141 | Empty state: empty Timeline lane |
| TH-142 | Empty state: empty Terminal section |
| TH-143 | Empty state: no subtasks on focused card |
| TH-144 | A11y: screen-reader announcement when card detail opens |

(Most other Phase-7 empty/error/a11y items are already covered by TH-68 / TH-69 / TH-70.)

---

## Drift annotations on existing cards

15 existing cards received `AUDIT:` comments pointing at related findings or bugs:

| Card | Note added |
|---|---|
| TH-21 | Theme system works, but legacy `.dark` class lives on (TH-108) |
| TH-28 | AgentChip palette hardcoded — doesn't theme (TH-111, TH-112) |
| TH-35 | PresenceEntry shape mismatch between mock + primitive (TH-114) |
| TH-36 | The 4 runtime no-ops origin story (TH-100/101/102/103); coding-style note |
| TH-37 | F + Esc were dead before the audit pass (TH-102, fixed in commit 6879de1) |
| TH-38 | Many sidebar CTAs have no onClick (TH-115) |
| TH-39 | Theme palette duplicated (TH-113); fake filter count (TH-116) |
| TH-40 | Both runtime no-ops in BoardFilterRow now fixed (TH-100, TH-101) |
| TH-42 | "Back to console" was dead (TH-103, fixed) |
| TH-45 | HAUL-N prefix bug (TH-107); estimate divergence (TH-104) |
| TH-47 | Transcript cycling: confirmed correct (the impl audit called it out as well-implemented) |
| TH-48 | label / priority pill colors missing (TH-129) |
| TH-49 | `link` suggestion kind (TH-127) and assign/due rendering (TH-128) |
| TH-50 | Lane handle/avatar fields populated but never read (TH-110) |
| TH-58 | Mark Shipped heuristic bug on non-standard boards (TH-105) |

---

## What's NOT covered (and intentionally so)

Some spec items are sub-features of an existing card; calling them out as separate cards would be over-decomposition. Examples:

- **SPEC-065 / 066 / 067** (KanbanCard outer / top meta row / title row) → folded into TH-43.
- **SPEC-001 / 002 / 003** (3 theme palettes' tokens) → folded into TH-21.
- **SPEC-011 to 019** (8 primitives) → already 1:1 with TH-27 through TH-34.
- **SPEC-039 to 050** (12 endpoint shapes) → folded into the respective backend-gap cards (TH-71 to TH-80).
- **SPEC-129 / 130 / 131** (3 localStorage keys) → covered by TH-65 collectively.
- **SPEC-176** (frontend file structure) → emergent, no card needed.

Some spec items are aspirational beyond the v1 milestone:
- **SPEC-202** (KanbanCard compact mode for dense boards) — not in prototype, not implemented, no card. Park it.
- **SPEC-181** (Hauler terminology) — captured as TH-130 but not actionable until product decides.

---

## What the audit confirmed is solid

The impl agent flagged several things as "surprisingly well-implemented; don't double-check these":

- `lib/pack-rows.ts` — clean greedy algorithm, used correctly by TimelineView
- `lib/positions.ts` — float-midpoint position model from v1, correct
- `lib/time.ts` — `fmtDue` bucketing precise, `fmtAgo` clamps negatives
- `lib/theme.ts` — proper localStorage validation, SSR-safe
- `api/client.ts` — 401-refresh singleton, ApiError class, 204/empty-body handling, retry guard
- `stores/kanbanStore.ts` — clean CRUD + epic cascade on delete
- `mock/*` — realistic, consistent, well-organized with README documenting the placeholder convention
- KanbanView grouping logic — all 5 modes wired (the broken filter chip was outside this)
- TimelineView drop-coordinate math — pointer + delta + scrollLeft computation is correct
- FocusModal subtask persistence — clean seed-from-mock-then-overwrite, proper portal + Esc handling
- ConsoleRail transcript cycling — 3.2s interval set up + torn down correctly
- PlansRail action rendering — `PlanActionLine` handles all 8 ProposalAction kinds with sensible English
- Theme system end-to-end — three palettes, persisted, applied before paint
- All 8 primitives — small, focused, prop-clean

This is the "trust budget" — when future work touches these areas, you can reasonably assume the existing code is correct and look elsewhere first when something breaks.

---

## How to use this document

- **Working on a feature?** Find its TH-NN in [v2-board-coverage-map.md](v2-board-coverage-map.md) and follow the description.
- **Triaging a bug?** Check this doc first to see if it's already tracked.
- **Implementing a backend endpoint?** Find the matching TH-71 to TH-80 card; description includes the agreed shape.
- **Making a design decision?** TH-120 to TH-148 are the open ones — pick yours and move to Done.
- **Auditing again later?** Re-run the 3 inventory agents with the same prompts; diff against these files.

---

## Anchors (per board)

- Board: `Task Hauler` (id `aa4c87b6-bde7-4394-9db5-f59325e3aca0`), prefix `TH`
- Open at: http://taskhauler-v2.localhost (then pick "Task Hauler" from the sidebar)
- 17 epics: Platform / Backend / Frontend v1 / 8× v2 phases / Backend gaps / Auth / Marketing / Integrations / Audit bugs / Decisions
- 148 cards as of audit completion
- 4 columns: Backlog (60), In Progress (8), Review (0), Done (80)
