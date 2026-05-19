export default function WhyUse() {
  const reasons = [
    { t: 'You actually run agents.', d: 'If your team has Claude/OpenAI/Cursor agents shipping real work, you need a board that treats them as collaborators — not a chat sidebar.' },
    { t: 'You want one tool, four lenses.', d: 'Kanban for triage, Timeline for planning, Terminal for power users, Dispatch for ops days. Same data, no context switching.' },
    { t: 'You self-host on principle.', d: 'No telemetry to a SaaS, no per-seat pricing, no vendor lock-in. Your data lives in your Postgres.' },
    { t: 'You like proposals over autonomy.', d: 'Agents should propose; humans should approve. The Plans queue is a guardrail you control.' },
    { t: 'You\'re tired of "AI-powered" sprinkled on a 2018 product.', d: 'Taskhauler is built around agents from the data model up — not bolted on.' },
    { t: 'You want speed.', d: 'Drag-drop is instant. Theme switch is instant. The whole UI weighs under 300KB gzipped. Postgres + Go for the rest.' },
  ];

  return (
    <section className="relative py-28 grain">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-live mb-5">USE IT WHEN</div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight title-gradient mb-12 max-w-4xl">
          Built for teams that<br /><span className="italic accent-gradient">ship with agents.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-5">
          {reasons.map((r, i) => (
            <div key={i} className="bg-ink-900/50 border border-white/10 rounded-xl p-6 backdrop-blur lift">
              <div className="text-live font-mono text-xs mb-3">✓ FIT</div>
              <h3 className="font-semibold text-ink-100 text-lg mb-2">{r.t}</h3>
              <p className="text-ink-400 leading-relaxed">{r.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
