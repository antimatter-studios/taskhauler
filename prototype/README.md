# prototype/ — taskhauler v2 design reference

Original interactive prototype from the v2 design handoff. Pure static — React + Babel-in-browser via CDN, no build step. Run it locally and the design is alive in a browser; click around to inspect actual look, behaviour, and interaction.

**This is a design reference, not production code.** All four production-target stacks (`frontend/`, `frontend-v2/`, `website-v2/`) consume this as their visual source of truth.

## Layout

| File | Contents |
|---|---|
| `index.html` | boots React + Babel from CDN, mounts `<App />` |
| `app.jsx` | mount |
| `shared.jsx` | mock data (USERS, AGENTS, CARDS, ACTIVITY, PROPOSALS, PRESENCE…) + shared atoms (UserChip, AgentChip) |
| `concept-haul.jsx` | shell + KanbanView + CardDetail |
| `concept-haul-views.jsx` | Timeline / Terminal / Dispatch views + FocusModal |
| `concept-haul-rails.jsx` | Console / Activity / Plans rail panels |

## Run it

Via the Taskfile:

```sh
task prototype:dev       # bind-mount source at runtime — edits visible on refresh
task prototype:stop
```

Then open: http://prototype.taskhauler.localhost

For a self-contained build (files baked into the image):

```sh
task prototype:prod
```

## How to interact

- **View switcher** (in the filter row): Kanban / Timeline / Terminal / Dispatch.
- **Theme switcher** (3 swatches in the top bar): Day / Mono / Paper.
- **Right rail tabs**: Console / Activity / Plans.
- Click any card → detail panel opens. Press `F` → fullscreen Focus modal. `Esc` to close.
- Drag cards between columns / lanes / sections.

## Companion docs

- [docs/design/README.md](../docs/design/README.md) — full design spec
- [docs/design/PARITY_CHECKLIST.md](../docs/design/PARITY_CHECKLIST.md) — granular feature checklist
- [docs/design/BACKEND_GAPS.md](../docs/design/BACKEND_GAPS.md) — API additions required for parity
- [docs/v2-spec-inventory.md](../docs/v2-spec-inventory.md) — 210 SPEC-NN entries distilled from the design docs
- [docs/v2-gap-analysis.md](../docs/v2-gap-analysis.md) — audit comparing spec to live implementation
