const FEATURES = [
  {
    title: 'Three themeable skins',
    blurb: 'Same dense board, three personalities. Day (Linear-style cool neutral), Mono (black + amber, JetBrains Mono everywhere), Paper (warm cream + burnt orange). Themes are CSS custom properties — bring your own.',
    img: ['./screenshots/05-kanban-mono.png', './screenshots/06-kanban-paper-theme.png'],
    accent: 'mono',
  },
  {
    title: 'Console rail with live agent telemetry',
    blurb: 'A right-side rail showing every agent\'s status, current step, token throughput, and a rolling transcript that updates every 3 seconds. Humans and agents share the same panel — no two-class system.',
    img: './screenshots/01-kanban.png',
    accent: 'live',
  },
  {
    title: 'Activity feed, time-bucketed',
    blurb: 'Every action — agent step, comment, move, ship — flows into a single chronological feed. Just now / earlier today / yesterday+. Filter to agents only when standup gets noisy.',
    img: './screenshots/07-rail-activity.png',
    accent: 'accent',
  },
  {
    title: 'Plans queue — agents propose, humans approve',
    blurb: 'When an agent wants to do something multi-step ("split this 13pt card into 3 subtasks", "re-prioritize 4 stale auth cards"), it files a Plan. The actions execute atomically only when you approve.',
    img: './screenshots/08-rail-plans.png',
    accent: 'amber',
  },
  {
    title: 'Focus mode',
    blurb: 'Press F on any selected card. The whole UI dims and you get a fullscreen, distraction-free view of just that card with its subtasks. Esc to escape.',
    img: './screenshots/09-card-detail.png',
    accent: 'accent',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative bg-ink-950 py-28 grain">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-live mb-5">
          FEATURES THAT MATTER
        </div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight title-gradient mb-16 max-w-4xl">
          Built around <span className="italic accent-gradient">live work</span>,<br />not weekly retros.
        </h2>

        <div className="grid lg:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} large={i === 0 || i === 4} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, blurb, img, accent, large }) {
  const accentClasses = {
    mono: 'from-signal-amber/20',
    live: 'from-live/20',
    accent: 'from-accent/20',
    amber: 'from-signal-amber/20',
  }[accent];

  return (
    <div className={`relative bg-ink-900/60 backdrop-blur border border-white/10 rounded-2xl overflow-hidden lift ${large ? 'lg:col-span-2' : ''}`}>
      <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${accentClasses} to-transparent opacity-60 pointer-events-none`} />
      <div className={`relative p-7 md:p-9 ${large ? 'lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center' : ''}`}>
        <div className={large ? 'lg:col-span-5' : ''}>
          <h3 className="font-serif text-3xl text-ink-100 mb-3 tracking-tight">{title}</h3>
          <p className="text-ink-300 leading-relaxed">{blurb}</p>
        </div>
        <div className={`mt-6 ${large ? 'lg:col-span-7 lg:mt-0' : ''}`}>
          {Array.isArray(img) ? (
            <div className="grid grid-cols-2 gap-3">
              {img.map((src, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-white/10 bg-ink-900">
                  <img src={src} alt="" className="w-full block" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border border-white/10 bg-ink-900">
              <img src={img} alt={title} className="w-full block" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
