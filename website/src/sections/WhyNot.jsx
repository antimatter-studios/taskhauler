export default function WhyNot() {
  const reasons = [
    { t: 'You\'re a solo developer.', d: 'Honestly, you can use Linear, Things, or a markdown file. The agent integration is the differentiator — if you don\'t run agents, you\'re paying complexity tax for nothing.' },
    { t: 'You need enterprise SSO + SCIM.', d: 'Out of scope for v0.x. There\'s a JWT layer and an admin role, but no Okta/Azure AD/Google SCIM integration. PRs welcome.' },
    { t: 'You want a mobile app.', d: 'No native apps. The board is responsive but the Timeline + Terminal views aren\'t designed for touch. Phone is a read-only second-class citizen right now.' },
    { t: 'You need 1000+ user scale.', d: 'The realtime layer (NATS) is fine, but the activity feed pulls full history on connect. Designed for 5–50 person teams + ~20 agents.' },
    { t: 'You need automation graphs (Zapier-style).', d: 'Plans are simple action arrays, not DAG-based workflows. Use n8n or your CI/CD if you need branching, retries, conditions.' },
    { t: 'You want a managed offering.', d: 'There isn\'t one. We don\'t sell hosting, we don\'t have a free tier you\'ll get upsold off of. You spin it up yourself.' },
    { t: 'You\'re allergic to JavaScript runtimes.', d: 'Frontend is React. If your team won\'t touch Node/Vite for builds, this isn\'t your tool.' },
    { t: 'You need offline-first / CRDT sync.', d: 'Server-authoritative. If your connection drops, your edits do too. No Linear-style local-first sync (yet).' },
  ];

  return (
    <section id="whynot" className="relative bg-cream-50 text-ink-900 py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-signal-red mb-5">DON'T USE IT WHEN</div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6 max-w-4xl">
          The <span className="italic text-signal-red">honest tradeoffs.</span>
        </h2>
        <p className="text-ink-700 text-lg max-w-2xl mb-14 leading-relaxed">
          Taskhauler is opinionated. Those opinions cost something. Here's where it's the wrong tool, plainly.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {reasons.map((r, i) => (
            <div key={i} className="bg-white border border-cream-200 rounded-xl p-6">
              <div className="text-signal-red font-mono text-xs mb-3">✕ NOT A FIT</div>
              <h3 className="font-semibold text-ink-900 text-lg mb-2">{r.t}</h3>
              <p className="text-ink-600 leading-relaxed text-sm">{r.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-ink-900 text-ink-100 rounded-2xl p-8 max-w-3xl">
          <h3 className="font-serif text-2xl mb-3">What we're good at</h3>
          <p className="text-ink-300 leading-relaxed mb-4">
            <strong className="text-ink-100">Live, mixed teams.</strong> Humans + agents working on the same board, in real time, with visible work-in-flight. The Plans queue keeps agent autonomy bounded. The Console rail shows you what's happening right now, not in a daily digest.
          </p>
          <h3 className="font-serif text-2xl mb-3 mt-6">What we're bad at</h3>
          <p className="text-ink-300 leading-relaxed">
            <strong className="text-ink-100">Big-team process.</strong> Sprint planning rituals, OKR rollup, capacity planning, multi-board portfolios. If you live in Jira on purpose, Taskhauler will feel naked.
          </p>
        </div>
      </div>
    </section>
  );
}
