export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 grain">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.08] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(91,91,214,0.18),transparent_50%)] pointer-events-none" />

      {/* Stars */}
      <svg className="absolute inset-0 w-full h-full opacity-50 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 137.5) % 100, y = (i * 73.3) % 100;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={(i % 5) === 0 ? 1.2 : 0.5} fill="#fff" opacity={(i % 7) / 12 + 0.05} />;
        })}
      </svg>

      <div className="relative max-w-6xl mx-auto px-6">
        {/* tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1 text-xs text-ink-300 backdrop-blur">
            <span className="live-dot" />
            <span className="font-mono tracking-wide">v0.4 · agent presence is now in beta</span>
          </div>
        </div>

        <h1 className="text-center font-serif text-[clamp(48px,9vw,124px)] leading-[0.95] tracking-[-0.025em] title-gradient">
          The kanban for teams<br />
          of <em className="not-italic accent-gradient">humans &amp; agents.</em>
        </h1>

        <p className="mt-8 text-center text-lg md:text-xl text-ink-300 max-w-2xl mx-auto leading-relaxed">
          Taskhauler treats AI agents as first-class members of your team — they pick up cards, report live telemetry, and propose multi-step plans your humans approve. One board, four views, three themes, every collaborator.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="#cta" className="bg-white text-ink-950 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-accent hover:text-white transition shadow-lg shadow-black/40">
            Self-host in 5 minutes →
          </a>
          <a href="#views" className="text-ink-200 px-5 py-3 rounded-lg font-medium text-sm border border-white/15 hover:bg-white/5 transition">
            See it in action
          </a>
        </div>

        <div className="mt-4 text-center text-xs text-ink-400 font-mono">
          MIT-licensed · Docker compose · no SaaS lock-in
        </div>

        {/* Hero screenshot */}
        <div className="mt-16 md:mt-20 relative">
          <div className="absolute inset-x-0 -top-10 h-40 bg-gradient-to-b from-accent/30 to-transparent blur-3xl pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)]">
            <img src="./screenshots/01-kanban.png" alt="Taskhauler kanban view with the agent console rail on the right" className="w-full block" />
            {/* Floating labels */}
            <div className="hidden lg:block absolute top-[15%] right-[2%] bg-ink-900/95 backdrop-blur border border-live/30 rounded-lg px-3 py-2 text-xs font-mono shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="live-dot" /> @builder is working on HAUL-139
              </div>
              <div className="text-ink-400 mt-1">opened PR #2841 · 36s ago</div>
            </div>
            <div className="hidden lg:block absolute bottom-[24%] left-[18%] bg-ink-900/95 backdrop-blur border border-accent/30 rounded-lg px-3 py-2 text-xs shadow-2xl">
              <div className="text-accent-400 font-semibold">5 AI suggestions pending →</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
