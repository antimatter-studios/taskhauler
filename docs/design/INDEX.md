# Taskhauler Redesign — Handoff Package

This package contains a high-fidelity design prototype for the **Taskhauler** redesign, along with documentation explaining how to land it in the existing `frontend/` codebase.

## Read these in order

1. **[README.md](./README.md)** — the full design spec. Tokens, components, views, behaviors, file structure. This is the main reference for Claude Code or any developer implementing the redesign.
2. **[PARITY_CHECKLIST.md](./PARITY_CHECKLIST.md)** — every feature/component as a checklist, organized into 8 phases. Use this to track progress.
3. **[BACKEND_GAPS.md](./BACKEND_GAPS.md)** — focused doc on the API/data additions needed for full parity (presence, proposals, agent telemetry, activity feed, subtasks).
4. **[SCREENSHOTS.md](./SCREENSHOTS.md)** — what each screenshot in `screenshots/` shows.

## What's in this folder

```
design_handoff_taskhauler/
├── INDEX.md                   ← you are here
├── README.md                  ← full design specification
├── PARITY_CHECKLIST.md        ← granular feature checklist
├── BACKEND_GAPS.md            ← API/data work needed
├── SCREENSHOTS.md             ← screenshot captions
├── screenshots/               ← visual references
│   ├── 01-kanban.png          (Day theme, default)
│   ├── 02-timeline.png        (lanes by hauler)
│   ├── 03-terminal.png        (monospace ASCII table)
│   ├── 04-dispatch.png        (fleet bar + sections)
│   ├── 05-kanban-mono.png     (Mono theme)
│   ├── 06-kanban-paper-theme.png  (Paper theme)
│   ├── 07-rail-activity.png   (right rail, Activity tab)
│   ├── 08-rail-plans.png      (right rail, Plans tab)
│   └── 09-card-detail.png     (card selected, detail panel)
└── prototype/                 ← the working HTML/React prototype
    ├── index.html
    ├── app.jsx
    ├── shared.jsx             ← mock data: cards, users, agents, presence, proposals, activity
    ├── concept-haul.jsx       ← shell + Kanban view + CardDetail
    ├── concept-haul-views.jsx ← Timeline, Terminal, Dispatch views + FocusModal
    └── concept-haul-rails.jsx ← Console, Activity, Plans rail panels
```

## Quick start

Open `prototype/index.html` in a browser. Or serve it locally:

```bash
cd prototype
python3 -m http.server 8000
# then visit http://localhost:8000
```

Try:
- **View switcher** (Kanban / Timeline / Terminal / Dispatch — in the filter row)
- **Theme switcher** (3 swatches in the top bar — Day / Mono / Paper)
- **Right rail tabs** (Console / Activity / Plans)
- Click any card → detail panel opens. Press **F** → fullscreen Focus modal. **Esc** to close.
- Drag cards between columns / lanes / sections

## Important

The prototype is **a design reference, not production code.** It uses React + Babel-in-browser + inline styles + mock data — built for fast iteration, not for shipping.

The implementation task is to **recreate the prototype's UI and behavior** in the existing codebase using its real stack:

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- shadcn/ui (already in `src/components/ui/`)
- Zustand (already has `useKanbanStore`, `useAgentStore`, `useUserStore`, `useAuthStore`)
- `@dnd-kit` for drag-drop
- `apiClient` in `src/api/client.ts` (which needs new endpoints — see `BACKEND_GAPS.md`)
- `lucide-react` for icons

The existing `src/components/KanbanBoard.tsx` (~1818 lines) should be split into smaller files under `src/components/board/`. See README.md for the proposed file structure.

## Two suggested PRs

If you want to split this into shippable chunks:

**PR 1 — frontend-only redesign (no backend changes):**
- All 4 views (Kanban / Timeline / Terminal / Dispatch) wired to existing API
- All 3 themes
- Card detail panel + Focus modal (subtasks stored locally for now)
- Drag-drop across columns / lanes / sections
- Stub the rail tabs with "Coming soon" or mocked data

This is a complete UX upgrade with zero backend dependency — gets the new design in front of users fast.

**PR 2 — live & multiplayer features (depends on backend):**
- Console rail with real agent telemetry
- Activity rail with real event stream
- Plans rail with real proposals queue
- Presence avatars on cards + top bar (WebSocket-driven)
- AI suggestions strip

See `BACKEND_GAPS.md` for the API work that PR 2 depends on.
