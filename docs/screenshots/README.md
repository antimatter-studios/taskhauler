# Screenshots

Visual reference of every view and major state from the design prototype. All captured at 924×540 from the live prototype. The right rail is visible in some shots and cropped off-frame in others (the prototype renders at 1440px wide; in narrow captures the columns occupy the visible viewport and the rail is past the right edge — open the prototype directly to see it in full).

When in doubt, open the prototype to inspect any view in its native size:

```bash
task prototype:dev
# then visit http://prototype.taskhauler.localhost
```

| File | What it shows |
|---|---|
| `01-kanban.png` | **Kanban view** (default) in the Day theme. Sidebar · top bar · filter row · AI suggestion strip · 4 columns of dense cards · right rail showing the **Console** tab with active presence + agent transcript. This is the canonical "everything visible" shot. |
| `02-timeline.png` | **Timeline view** in the Day theme. Lanes by hauler (5 agents up top, then 5 users with cards, then unassigned). Cards positioned by due date, width = estimate. Today line at right of "MON 18". |
| `03-terminal.png` | **Terminal view** in the Day theme. Monospace ASCII table grouped by status, sorted by priority then due. Each row shows HAUL-N, priority, type, title, assignee, "● live" for working agents, estimate, due. Blinking cursor at bottom. |
| `04-dispatch.png` | **Dispatch view** in the Day theme. Fleet bar of 5 agent tiles up top (with load %, current card, LIVE/IDLE), then 4 prioritised sections: Hot (overdue+urgent) · In Flight · Ready · Queue. |
| `05-kanban-mono.png` | Kanban view re-skinned in the **Mono theme**: black background, amber accent, JetBrains Mono throughout. Same layout, totally different feel. |
| `06-kanban-paper.png` | Kanban view in the **Paper theme**: warm cream + burnt orange accent. |
| `07-rail-activity.png` | Right rail switched to the **Activity tab**. Filter chips at top (All / Agents / Comments / Ships). Events grouped by time bucket (Just Now / Earlier Today). Each event has actor avatar, kind pill (AGENT/MOVE/NOTE), text, card chip. |
| `08-rail-plans.png` | Right rail switched to the **Plans tab**. Proposals from both agents and humans, with AI badge on agent-proposed plans. The expanded "Re-prioritize 4 stale auth cards" plan shows its 4 atomic actions (PRIORITY × 2, LABEL, MOVE), confidence %, and Approve/Reject/Edit buttons. |
| `09-card-detail.png` | A card selected. Rail switches to **Card Detail panel** with HAUL-138, Focus button + Esc/key hint, full metadata grid, AI suggested action. The "← Back to console" link at the top returns to the rail tabs. |

The Focus modal didn't capture cleanly (the modal renders fine in-browser but the html-to-image snapshot doesn't preserve `position:fixed` elements well). To see it: open the prototype, click a card, then press `F` (or click the Focus button in the detail panel).
