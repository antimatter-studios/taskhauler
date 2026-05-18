# v2 Spec Inventory — Summary

## Totals

- **Total entries: 210**
- File: `/tmp/v2-spec-inventory.md`

## Count by category (multi-tag entries counted per tag)

| Category | Count |
|---|---:|
| backend-api | 31 |
| shell | 22 |
| data-model | 22 |
| primitives | 20 |
| view-kanban | 15 |
| animation | 14 |
| view-timeline | 12 |
| rail-plans | 12 |
| theme | 11 |
| rail-console | 11 |
| presence | 11 |
| card-detail | 11 |
| rail-activity | 9 |
| keyboard | 9 |
| empty-state | 9 |
| focus-modal | 8 |
| accessibility | 8 |
| url-state | 7 |
| view-terminal | 6 |
| view-dispatch | 6 |
| mock-data | 6 |
| drag-drop | 6 |
| localStorage | 4 |
| error-state | 4 |

## Spec ambiguities

1. **CardDetail "Agent activity" section header typography mismatch.** README L582–584 says section header is "10px 700 uppercase letter-spacing 1.5" (matching `--mono` section style). PARITY_CHECKLIST.md L223 repeats this. Prototype `concept-haul.jsx` L786 renders it as `11px 600 letter-spacing 0.5` (not 700 / 1.5). Implementer must pick one; SPEC-103 notes both.

2. **TimelineView weekday "MON 18" today-line position.** SCREENSHOTS.md says "Today line at right of MON 18". README L398 says today line is at "today's x position" (left edge of the today cell). Prototype: `todayX = tlX(window.NOW)` returns the x at start of today's day cell. The screenshot suggests it should be at right edge (end of MON), which would conflict with the cardX-right-edge-as-due-date convention. Ambiguity: is "today" represented as left or right edge of today's cell? Prototype currently uses left.

3. **Day header height: README L385 says 44px; prototype renders 42px.** Minor — PARITY_CHECKLIST.md L334 says "44px tall". Use 44 to match checklist.

4. **CardDetailPanel section header style.** README and PARITY_CHECKLIST give slightly conflicting typography (10px/700/1.5 vs 11px/600/0.5). See ambiguity #1.

5. **AgentChip variant for Mono theme.** README L257 says "terminal" variant is "used in Convoy lanes" (Convoy is not a view name elsewhere in the doc — probably the prototype's working name for Timeline). Implementer should treat as Timeline lane usage when theme=Mono. Term inconsistency.

6. **TerminalView sort order.** README L433 says "sort by priority,due" (matching prompt text). Prototype `concept-haul-views.jsx` L278–283 actually sorts by column first (`c2, c1, c3, c4`), then priority, then due — so "In Progress" appears first, not "Backlog". README screenshot caption supports column-first sort. The prompt text is misleading.

7. **AI suggestion strip gradient.** README L338 says "linear-gradient from `var(--accent-bg)` to `var(--bg)`". Prototype hardcodes `linear-gradient(180deg, #f6f5ff, #fafaf9)` — Day theme literal, not theme-aware. Implementation should use CSS vars.

8. **Console toggle default state.** Prototype defaults `consoleOpen = true`. PARITY_CHECKLIST.md doesn't specify default. localStorage absence → true seems intended (SPEC-194).

9. **Top-bar presence cluster max + "X active" label position.** README L294 says "Show first 5, then 'X active' label". Prototype shows "{N} active" after the cluster with no "+N" overflow text (just truncates to 5). Ambiguity: should there also be a "+N more" visible inside the cluster?

10. **Suggestion `kind`s.** BACKEND_GAPS.md lists 6 (promote/split/assign/escalate/archive/link). Mock data uses 5 (no `link`). README inline strip doesn't render a kind indicator. Spec under-specified for the `link` kind rendering.

11. **ProposalAction `assign` and `due` kinds.** Data model defines 8 kinds, but prototype's `PlanAction` renderer only handles 6 (priority/move/label/split/ping/archive). The other 2 are valid actions but have no rendering template — implementer must add.

12. **Activity kind pill colors.** BACKEND_GAPS.md L127 lists 8 kinds (agent/comment/move/assign/create/ship/label/priority). Prototype only maps 6 in `kindMeta` (no label or priority). Spec under-specified for label/priority events.

13. **"Hauler" terminology.** Open question (SPEC-181) — explicitly flagged in README L816 as a PM decision point. Tightly coupled UI copy strings will need to be touched across many components if dropped.

14. **PresenceCluster: which avatars get tooltips.** README L294 says hover for tooltip. Prototype puts a single title attr on the whole cluster, not per-avatar — limits hover precision.

15. **Realtime transport for activity events.** BACKEND_GAPS.md L160–166 makes it optional. Frontend animation (fade-in for newest in "now" bucket) only fires for index 0 — if events are batched via poll, multiple "now" events arrive at once and only one will animate. Spec doesn't address this batched-arrival case.

16. **WORKING badge styling.** PARITY_CHECKLIST.md L216 says "green WORKING badge". README L580 says same. Prototype renders: green text + small green dot, not a filled pill. Slight inconsistency.

## Items where prototype JSX differs from README description

1. **Day header height** — README/Checklist 44px, prototype 42px.

2. **Today line color** — README L398 says "yellow today line" generically; prototype uses theme's `--amber` (yellow in Day, but matches accent in Mono). README/checklist don't specify amber explicitly.

3. **TerminalView sort order** — README prompt says "sort=priority,due" but prototype sorts column-first then priority then due.

4. **CardDetail section headers** — README L582 says 10px 700 letter-spacing 1.5 mono; prototype renders 11px 600 letter-spacing 0.5 sans.

5. **AI suggestion strip background** — README says `linear-gradient(var(--accent-bg), var(--bg))`; prototype hardcodes `linear-gradient(180deg, #f6f5ff, #fafaf9)` (Day-only literal).

6. **FocusModal working pulse animation duration** — Prototype uses 1.4s for the assignee "working alongside you" dot (concept-haul-views.jsx L554) vs the standard 1.6s presence-pulse spec. Likely a minor variation, not a spec'd alternate.

7. **AgentChip working glow** — README L271 says "faint cyan ring glow" + green pulsing dot at bottom-right. Prototype's AgentChip itself only adds the cyan ring (`boxShadow 0 0 0 1px palette.glow`); the green pulsing dot is added by each container (KanbanCard, PresenceRow) separately, not by AgentChip itself.

8. **PresenceRow load color thresholds** — Spec PARITY_CHECKLIST.md L265 says "green ≤30%, accent 30-70%, amber >70%". Prototype `concept-haul-rails.jsx` L146 uses ">0.7 amber, >0.3 accent, else green" (same ranges expressed differently). DispatchAgentTile uses `working ? accent : text3` ignoring thresholds entirely — different.

9. **Top-bar presence cluster overlap** — README L294 implies overlap; PARITY_CHECKLIST.md L468 says "overlapped by 7px"; prototype uses `-7px` margin. Consistent here.

10. **PlanCard summary indent** — Prototype uses `paddingLeft: 32` for the expanded content (aligns to body, not to avatar+gap). Spec doesn't specify; intentional design choice.

11. **PresenceCluster on cards** — README/Checklist say "max 3 small (14px) avatars". Prototype slices to 3 then shows "+N" overflow text. Matches spec, but spec also says "exclude the assignee from the cluster if they're shown elsewhere on the card" — prototype only excludes when assignee is an agent already shown in main chip; doesn't exclude human assignees.

12. **Mono theme — drop shadows entirely** — README L221 says drop shadows entirely (or 1px solid border-hi). Prototype doesn't enforce this; uses same box-shadows across themes.

13. **Empty Kanban column "Drop or + add" emphasis** — Spec PARITY_CHECKLIST.md L190 says "Drop or **+ add** centered" with "+ add" emphasised. Prototype renders "+ add" in `--accent` 600. Matches.

14. **Theme switcher swatch active style** — README L177 says "filled outer ring in the accent color". Prototype sets outer button bg to `T.swatch` (fills the entire 22×22 button with accent), then mini-square's border becomes `T.surface` to maintain contrast. The "ring" interpretation could mean ring vs filled bg — prototype takes the latter.
