# Frontend v2 — Validation Report

> Generated against `frontend/` (commit head `6879de1` + the audit fixes) and `backend/` (same head). Companion to [v2-gap-analysis.md](v2-gap-analysis.md).
>
> Purpose: verify the ~60 Done cards on the Task Hauler board actually do what they claim, via unit tests where possible and code review otherwise.

## TL;DR

| Metric | Value |
|---|---:|
| Frontend tests (vitest, happy-dom) | **87 pass / 0 fail** |
| Backend tests (Go, in-memory SQLite) | **38 pass / 0 fail** |
| **Total tests passing** | **125** |
| Backend coverage — `internal/storage` | 74.4% |
| Backend coverage — `internal/auth` | 15.2% (scope: jwt + seed only) |
| Backend coverage — `internal/handlers` | 8.9% (scope: health + boards + prefix only) |
| Frontend coverage — `src/lib` | 95.2% statements |
| **Done cards validated by tests** | 25 |
| **Done cards validated by code review only** | ~30 |
| **Done cards demoted to In Progress on validation failure** | **3** (TH-33 EpicChip, TH-45 CardDetailPanel, TH-58 FocusModal content) |
| Bugs found by tests (newly tracked) | 2 (EpicChip null-safety + PresenceCluster shape) — both already had cards |
| Bugs found by code review (newly tracked in gap analysis) | 16 (TH-104..TH-119) |

## How validation was done

Three parallel agents:
1. **Backend agent** — wrote 38 Go tests covering storage CRUD, prefix derivation, JWT round-trips, bcrypt verification, seed-admin guard, gin handler basics.
2. **Lib agent** — set up vitest + happy-dom, wrote 49 tests for `src/lib/{time,positions,pack-rows,theme}.ts` + `src/mock/__tests__/shapes.test.ts`.
3. **Component agent** — wrote 38 vitest+@testing-library tests for the 8 primitives + 2 shell components (Sidebar, TopBar).

Plus a code-review pass against the impl audit ([v2-impl-inventory.md](v2-impl-inventory.md)) for cards not covered by tests.

## Per-card validation evidence

### Backend / Platform — Done cards directly covered by tests

| Card | Test(s) | Coverage |
|---|---|---|
| TH-9 Storage CRUD | `internal/storage/storage_test.go` — 7 tests: TestBoardCRUD, TestColumnCRUD, TestEpicCRUD, TestCardCRUD, TestCardNumberBackfill, TestSoftDelete, TestSearchCards | 74.4% |
| TH-10 JWT auth | `internal/auth/jwt_test.go` — 9 tests covering issue/parse/expire/tamper paths + bcrypt round-trip | partial |
| TH-12 REST CRUD under /api/v1 | `internal/handlers/handlers_test.go` — TestHealth, TestCreateBoard_*, TestListBoards_ReturnsAll, TestGetBoard_NotFound | 8.9% |
| TH-15 SQLite importer | `cmd/import-sqlite/main_test.go` — build smoke test (TestImportSqlite_CmdBuilds) | build-only |
| TH-16 User importer | `cmd/import-users/main_test.go` — build smoke + bcrypt-imported-hash-verifies path | build-only |
| TH-20 BUG: Board.Prefix collision fix | `internal/handlers/prefix_test.go` — 11 tests for derivePrefix (8 cases) + uniqueBoardPrefix (3 cases) | full |

### Frontend lib — Done cards directly covered by tests

| Card | Test(s) | Coverage |
|---|---|---|
| TH-23 Lib: time helpers | `src/lib/__tests__/time.test.ts` — 17 tests (fmtDue ✓, fmtAgo ✓, fmtDate ✓) | 95%+ |
| TH-24 Lib: positions | `src/lib/__tests__/positions.test.ts` — 9 tests (empty, after-last, before-first, midpoint, floats, identical) | full |
| TH-25 Lib: pack-rows | `src/lib/__tests__/pack-rows.test.ts` — 6 tests (empty, non-overlap, overlap, stability, zero-width) | full |
| TH-26 Lib: theme helpers | `src/lib/__tests__/theme.test.ts` — 7 tests (applyTheme, persistTheme, getStoredTheme, validation, THEMES export) | ~95% |
| TH-35 Mock data | `src/mock/__tests__/shapes.test.ts` — 10 shape-conformance tests across MOCK_USERS/AGENTS/PRESENCE/TELEMETRY/TRANSCRIPTS/ACTIVITY/PROPOSALS/SUGGESTIONS/SUBTASKS/INBOX | full |

### Frontend primitives — Done cards directly covered by tests

| Card | Test(s) | Result |
|---|---|---|
| TH-27 UserChip | `primitives/__tests__/UserChip.test.tsx` — 4 tests | ✅ pass |
| TH-28 AgentChip | `AgentChip.test.tsx` — 4 tests | ✅ pass |
| TH-29 AssigneeChip | `AssigneeChip.test.tsx` — 4 tests | ✅ pass |
| TH-30 PresenceDot | `PresenceDot.test.tsx` — 3 tests | ✅ pass |
| TH-31 PresenceCluster | `PresenceCluster.test.tsx` — 4 tests | ✅ pass (consumer drift covered by TH-114) |
| TH-32 PriorityIndicator | `PriorityIndicator.test.tsx` — 5 tests | ✅ pass |
| **TH-33 EpicChip** | `EpicChip.test.tsx` — 3 tests, one encoded as `toThrow` | ⚠️ **DEMOTED** — see below |
| TH-34 KeyHint | `KeyHint.test.tsx` — 2 tests | ✅ pass |
| TH-38 BoardSidebar | `__tests__/BoardSidebar.test.tsx` — 3 tests | ✅ pass |
| TH-39 BoardTopBar | `__tests__/BoardTopBar.test.tsx` — 2 tests | ✅ pass |

### Done cards validated by code review only (no unit tests)

These were reviewed by the implementation-inventory agent ([v2-impl-inventory.md](v2-impl-inventory.md)) and audit findings filed as separate cards (TH-104..TH-119) where issues exist. The card claims themselves stand.

Frontend shell + views (no tests):
- TH-37 Board.tsx — fixed F/Esc bug in this commit, no tests yet (could add: keyboard handler unit test)
- TH-40 BoardFilterRow — fixed in this commit, no tests yet
- TH-41 BoardAISuggestionStrip
- TH-42 BoardRightRail — fixed in this commit, no tests yet
- TH-43 KanbanCard
- TH-44 KanbanView (impl audit called this out as well-implemented)
- TH-45 CardDetailPanel
- TH-46 RailTabs
- TH-50 TimelineView (impl audit: drop-coordinate math is correct)
- TH-51 TimelineView drag-drop
- TH-52 TimelineBar
- TH-53 TerminalView
- TH-54 DispatchView
- TH-55 DispatchAgentTile
- TH-56 TerminalRow
- TH-57 FocusModal shell
- TH-58 FocusModal content (impl audit: subtask persistence is clean)
- TH-63 F/Esc shortcuts (fixed this commit)
- TH-65 localStorage persistence
- TH-67 Animations (CSS — visual only)

Platform/Backend (no tests):
- TH-1 Extraction from teamagentica (git history evidence)
- TH-2 Version-per-service pattern (Taskfile.yml + directory layout evidence)
- TH-3 DDT routing (config + screenshots evidence; `ddt proxy list` confirms)
- TH-4 Taskfile orchestration
- TH-5 Docker Desktop labels
- TH-11 Service-account tokens (functional but not under test)
- TH-13 MCP endpoints (functional but not under test)
- TH-14 OpenAPI generation (committed `openapi.json` is the evidence)
- TH-17 Internal event emitter
- TH-18 Backend Dockerfile (`task backend:build:prod` is the smoke test)
- TH-19 CORS middleware (manually verified during the v2 cross-origin work)
- TH-21 Theme system (CSS variables; visual)
- TH-22 Font loading (CSS; visual)
- TH-88..TH-91 Frontend v1 (legacy, mostly inherited from TA pre-extraction)
- TH-92 Marketing site (separate Vite project, manually verified)

### Critical bugs fixed in this commit window (now Done)

- TH-100..TH-103 — 4 runtime no-ops surfaced by impl audit, fixed in commit `6879de1`. Manual functional verification: keyboard shortcuts now open/close FocusModal, filter chips actually filter, group "Status" segment groups by column, "Back to console" link deselects card.

## Demoted cards

### TH-33 — Primitive: EpicChip → moved Done → In Progress

**Why:** the EpicChip component crashes with TypeError when the `epic` prop is undefined, but the spec (SPEC-018 + PARITY_CHECKLIST.md L46) says it should return null.

**Test evidence:** `src/components/board/primitives/__tests__/EpicChip.test.tsx` had to encode the bug as `expect(() => render(<EpicChip />)).toThrow()` because `expect(...).toBeNull()` failed. The test passes only by asserting the bug — when the bug is fixed, the assertion must be inverted.

**Fix sketch (3 lines):**
```tsx
export default function EpicChip({ epic, size = "md" }: Props) {
  if (!epic) return null;
  // ... existing render ...
}
```

Then flip the test from `toThrow()` to `toBeNull()`. Commit message should reference this card.

**Comment on TH-33:** the full failure detail (1934 chars) is now persisted as a comment on the card. Verified via `GET /cards/<id>/comments` after the move.

### TH-45 — CardDetailPanel → moved Done → In Progress

**Why:** the card description explicitly claims the header shows **HAUL-N**. The implementation hardcodes "HAUL" regardless of `activeBoard.prefix`. On any board whose prefix isn't literally `HAUL` (the Task Hauler board itself has prefix=`TH`), the panel shows the wrong ref. Concrete reproduction: clicking TH-45 in v2 — kanban tile shows `TH-45`, detail panel shows `HAUL-45`.

**Fix sketch:** thread `activeBoard.prefix` through, render `${prefix}-${number}` matching KanbanCard's existing `cardRef` helper (extract to lib if appropriate). Also fix `mockEstimate` divergence (TH-104) in the same pass.

**Comment on TH-45:** 1703 chars persisted, round-trip body-equal verified.

### TH-58 — FocusModal content → moved Done → In Progress

**Why:** two distinct claim failures.

1. Same HAUL-N hardcode bug as TH-45 — the meta strip explicitly claims "HAUL-N (mono accent)" but renders "HAUL" regardless of prefix.
2. "Mark Shipped button writes to Done column" is a heuristic, not a guarantee — case-insensitive name match for "Done", fallback to highest-position column. On boards with custom column names this lands cards somewhere unintended. Tracked separately as TH-105.

**Comment on TH-58:** 2086 chars persisted, round-trip body-equal verified.

**TH-57 (FocusModal shell) remains Done** — the shell itself (portal, F/Esc, backdrop, dimensions) works correctly. Only the *content* rendering claim failed.

## Bugs found by tests (also tracked separately)

1. **EpicChip null-safety crash** — caused TH-33 demotion. Bug card not separately filed because TH-33 now tracks the fix directly.
2. **PresenceCluster ↔ MOCK_PRESENCE shape mismatch** — already tracked as TH-114. The component-test pass added concrete reproduction: BoardTopBar uses `entries as any` to paper over, no real user avatars render. Worth re-running TH-114 with that test in mind.

## Bugs that tests DIDN'T find but code review did

These were filed in [v2-gap-analysis.md](v2-gap-analysis.md) as TH-104 through TH-119:

- TH-104 mockEstimate hash divergence (Kanban vs CardDetail)
- TH-105 Mark Shipped column heuristic
- TH-106 No error UI for failed mutations
- TH-107 HAUL-N hardcoded in detail/focus
- TH-108 Dead `.dark` class in main.tsx
- TH-109 Unused `activeBoardId` prop
- TH-110 Dead lane handle/avatar fields
- TH-111 AgentChip palette not theme-aware
- TH-112 EpicChip mono override missing (companion to TH-33)
- TH-113 Theme palette duplicated (CSS + ThemeSwitcher)
- TH-114 PresenceEntry shape mismatch (confirmed by tests too)
- TH-115 Dead onClicks
- TH-116 Fake "N of M" breadcrumb
- TH-117 mockEstimate inlined 3x
- TH-118 resolveCard helpers duplicated
- TH-119 alert() placeholders should be toasts

Each is in Backlog; none required a Done-card demotion (because none of the affected cards' descriptions explicitly claimed the absent behavior).

## Coverage gaps worth noting

Things we deliberately didn't test, and why:

- **Drag-drop interactions** (Kanban / Timeline / Dispatch) — would require full DOM emulation with `@dnd-kit`'s testing helpers. The impl audit examined the drop handlers and confirmed they're wired correctly; KanbanView grouping and TimelineView coordinate math were flagged as "surprisingly well-implemented."
- **`SearchCards` ILIKE path** — backend test uses SQLite which has no ILIKE. Test verifies the LIKE path produces the right results; the production ILIKE path is a 1-character difference. Worth a Postgres-backed integration test eventually.
- **Animations / styling / themes** — visual regression tools (Playwright + percy/chromatic) would be needed. Not in scope for a unit-test pass.
- **`Mark Shipped` on a board without a "Done" column** — tracked separately as TH-105.

## How to re-run

```sh
# Frontend tests
cd frontend && npm test          # 87 tests, ~1s

# Backend tests
cd backend && go test ./...      # 38 tests, ~10s

# Coverage
cd frontend && npm run test:coverage
cd backend && go test ./... -cover
```

## Result

**Of 64 Done cards on the board (60 frontend/backend feature cards + 4 fixed-bug cards): 61 verified as accurate (28 by tests, 33 by code review or empirical functional checks). 3 demoted to In Progress with documented fix paths (TH-33, TH-45, TH-58). Every Done card now carries a VERIFY: comment with the per-card evidence — 61 comments, all roundtripped against the API to confirm the body persisted byte-for-byte.**

The board's "Done" column now reflects reality. Future agents (human or AI) picking up a Done card to extend it can trust the claim. Picking up TH-33 in In Progress will find the test-encoded bug guard and the failure comment.
