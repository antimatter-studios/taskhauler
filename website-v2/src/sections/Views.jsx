const VIEWS = [
  {
    id: 'kanban',
    label: 'Kanban',
    tag: 'the workhorse',
    title: 'Dense, draggable, keyboard-first',
    blurb: 'Linear-style columns with rich cards. Group by status, priority, epic, assignee, or due date — the grouping flips columns without losing your selection. Presence avatars bubble onto every card the moment someone opens it.',
    bullets: [
      'Drag across columns and groupings',
      '5 grouping dimensions',
      'Multi-line cards with progress + epic + estimate',
      'Hover-revealed quick actions',
    ],
    src: './screenshots/01-kanban.png',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    tag: 'planning',
    title: 'Haulers in lanes, work in flight',
    blurb: 'Each lane is a hauler — human or agent. Cards stack by greedy row packing, so collisions never hide work. Drag a card sideways to reschedule, drag it down to reassign. The yellow "now" bar grounds you in real time.',
    bullets: [
      'Auto-row-packing — never overlaps',
      'Width = estimate, position = due date',
      'Drag to reschedule + reassign in one gesture',
      'Workload bars per hauler',
    ],
    src: './screenshots/02-timeline.png',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    tag: 'power-user',
    title: 'Monospace, ASCII, vim-ish',
    blurb: 'For the people who never left the CLI. A flat table grouped by status, sorted by priority + due, with a blinking cursor on the bottom prompt. Pair with the Mono theme and you have a board you can stare at all day.',
    bullets: [
      'Monospace everywhere',
      'Sortable, scriptable feel',
      'Pairs perfectly with Mono theme',
      'Keyboard-only navigation',
    ],
    src: './screenshots/03-terminal.png',
  },
  {
    id: 'dispatch',
    label: 'Dispatch',
    tag: 'agent-heavy',
    title: 'Fleet bar + prioritized sections',
    blurb: 'Built for when most of your work is in motion. A horizontal fleet bar shows every agent\'s live load, current card, and tokens/min. Below: Hot, In Flight, Ready, Queue — the columns that actually matter at standup.',
    bullets: [
      'Agent fleet bar with live load + token/min',
      'Hot lane surfaces overdue + urgent automatically',
      'Compact cards, dense board',
      'Same primitives as Kanban view',
    ],
    src: './screenshots/04-dispatch.png',
  },
];

export default function Views() {
  return (
    <section id="views" className="relative bg-cream-50 text-ink-900 py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-5">
          ONE BOARD · FOUR LENSES
        </div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight text-ink-900 mb-6 max-w-4xl">
          The same data,<br />through <span className="italic text-accent">four different lenses.</span>
        </h2>
        <p className="text-ink-700 text-lg max-w-2xl mb-16 leading-relaxed">
          Every view operates on the same cards, columns, and agents. Switch lenses anytime — the cursor stays where it was, your selection survives, your filters carry over.
        </p>

        <div className="space-y-24">
          {VIEWS.map((v, i) => (
            <div key={v.id} className={`grid md:grid-cols-12 gap-8 md:gap-12 items-center ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <div className="md:col-span-5">
                <div className="flex items-baseline gap-3 mb-3">
                  <div className="text-3xl font-mono font-bold text-ink-300">0{i + 1}</div>
                  <div className="text-xs font-mono uppercase tracking-wider text-accent-600">{v.tag}</div>
                </div>
                <h3 className="font-serif text-4xl text-ink-900 mb-4 tracking-tight">{v.title}</h3>
                <p className="text-ink-700 text-base leading-relaxed mb-5">{v.blurb}</p>
                <ul className="space-y-2">
                  {v.bullets.map(b => (
                    <li key={b} className="flex gap-2.5 text-sm text-ink-700">
                      <span className="text-live-dim mt-0.5">→</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-2 text-xs font-mono text-ink-500 bg-cream-200/60 rounded px-2.5 py-1.5">
                  press <span className="kbd !text-ink-700 !bg-white !border-ink-300">V</span> then <span className="kbd !text-ink-700 !bg-white !border-ink-300">{v.label[0]}</span> to switch
                </div>
              </div>
              <div className="md:col-span-7">
                <div className="rounded-xl overflow-hidden bg-white shadow-[0_20px_80px_-20px_rgba(0,0,0,0.25)] border border-cream-200">
                  <img src={v.src} alt={`${v.label} view`} className="w-full block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
