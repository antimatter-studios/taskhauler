export default function Agentic() {
  return (
    <section id="agents" className="relative py-28 grain">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(132,204,22,0.08),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-live mb-5">
          AGENT INTEGRATION
        </div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight title-gradient mb-6 max-w-4xl">
          Run a dev team that<br />
          <span className="italic accent-gradient">doesn't sleep.</span>
        </h2>
        <p className="text-ink-300 text-lg max-w-2xl mb-16 leading-relaxed">
          Agents in Taskhauler aren't bolt-on plugins. They're built into the data model — assignees, presence, activity, proposals. Connect any runtime (Claude, OpenAI, your own) via the agent registry, and they become real team members.
        </p>

        {/* 4 step protocol */}
        <div className="grid md:grid-cols-4 gap-4 mb-20">
          {[
            { n: '01', t: 'Connect', d: 'Register an agent in the alias registry: name, plugin, model, system prompt. Agents get an API token and a hex avatar.' },
            { n: '02', t: 'Assign', d: 'Drop a card onto an agent\'s lane in Timeline view, or use the assignee picker. Agents subscribe to a webhook for their queue.' },
            { n: '03', t: 'Work + report', d: 'Agents pull context (description, comments, linked cards), do the work, and emit telemetry every action: step, tokens, transcript.' },
            { n: '04', t: 'Propose + close', d: 'For anything multi-step, agents file a Plan. Humans approve. The actions execute atomically and the card moves on.' },
          ].map(step => (
            <div key={step.n} className="bg-ink-900/60 border border-white/10 rounded-xl p-5 backdrop-blur">
              <div className="font-mono text-xs text-live mb-2">{step.n}</div>
              <h3 className="font-semibold text-ink-100 mb-2">{step.t}</h3>
              <p className="text-ink-400 text-sm leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>

        {/* Two-column: agent telemetry sample + plan sample */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-ink-900/80 border border-live/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
              <span className="live-dot" />
              <div className="text-xs font-mono uppercase tracking-wider text-live">live · @builder</div>
              <span className="ml-auto text-xs font-mono text-ink-400">claude-sonnet-4.5</span>
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed">
              <div className="text-ink-400 text-xs mb-3">› current step</div>
              <div className="text-ink-100 italic mb-5">Writing migration note from PR #2841 diff…</div>

              <div className="text-ink-400 text-xs mb-3">› transcript (tail -f)</div>
              <div className="space-y-1 text-ink-200">
                <div><span className="text-ink-500 mr-2">›</span>wrote 142 LOC across 3 files</div>
                <div className="opacity-80"><span className="text-ink-500 mr-2">›</span>ran benchmarks: 4.2× faster scroll @ 10k cards</div>
                <div className="opacity-60"><span className="text-ink-500 mr-2">›</span>tests passing — 247 ✓ / 0 ✗</div>
                <div className="opacity-40"><span className="text-ink-500 mr-2">›</span>opened PR #2841 — virtualization patch</div>
              </div>

              <div className="mt-5 flex gap-6 text-xs text-ink-400">
                <div><span className="text-ink-100 font-bold">80%</span> load</div>
                <div><span className="text-ink-100 font-bold">1,240</span> tok/min</div>
                <div><span className="text-ink-100 font-bold">3m 14s</span> active</div>
              </div>
            </div>
          </div>

          <div className="bg-ink-900/80 border border-signal-amber/20 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-signal-amber" />
              <div className="text-xs font-mono uppercase tracking-wider text-signal-amber">pending plan · @triage proposes</div>
              <span className="ml-auto text-xs font-mono text-ink-400">conf 82%</span>
            </div>
            <div className="p-5">
              <h4 className="font-semibold text-ink-100 mb-2">Re-prioritize 4 stale auth cards</h4>
              <p className="text-ink-400 text-sm leading-relaxed mb-4">Auth epic has 4 cards untouched 14d+. Demote priorities so live work surfaces.</p>

              <div className="bg-ink-950/60 border border-white/5 rounded-lg p-3 font-mono text-xs space-y-1.5">
                <div><span className="text-signal-amber font-bold">PRIORITY</span> <span className="text-ink-300">set</span> <span className="text-ink-100">HAUL-129</span> high → low</div>
                <div><span className="text-signal-amber font-bold">PRIORITY</span> <span className="text-ink-300">set</span> <span className="text-ink-100">HAUL-134</span> high → medium</div>
                <div><span className="text-ink-400 font-bold">LABEL</span> <span className="text-ink-300">add</span> "stale" to <span className="text-ink-100">HAUL-146</span></div>
                <div><span className="text-live font-bold">MOVE</span> <span className="text-ink-300">move</span> <span className="text-ink-100">HAUL-145</span> Backlog → Done</div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-live text-ink-950 px-4 py-2 rounded-md text-sm font-bold hover:bg-live-glow transition">✓ Approve</button>
                <button className="px-4 py-2 rounded-md text-sm font-medium text-ink-300 border border-white/10 hover:bg-white/5 transition">Reject</button>
                <button className="px-4 py-2 rounded-md text-sm font-medium text-ink-300 border border-white/10 hover:bg-white/5 transition">Edit</button>
              </div>
            </div>
          </div>
        </div>

        {/* Key principles */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { t: 'Symmetric primitives', d: 'Agents and users share the same cards, presence, comments, activity. No second-class plugin surface.' },
            { t: 'Asymmetric authority', d: 'Agents propose. Humans approve. The Plans queue is the single chokepoint for multi-step changes.' },
            { t: 'Live by default', d: 'Telemetry streams over WebSocket. No polling. No "agent finished — refresh to see". The UI reflects reality.' },
          ].map(p => (
            <div key={p.t} className="border-l-2 border-live/40 pl-5">
              <h3 className="font-semibold text-ink-100 mb-2">{p.t}</h3>
              <p className="text-ink-400 text-sm leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
