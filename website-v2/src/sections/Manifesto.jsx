export default function Manifesto() {
  return (
    <section className="relative py-32 grain">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent-400 mb-6">
          THE THESIS
        </div>
        <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight title-gradient mb-8">
          Your team isn't just humans anymore.<br />
          <span className="text-ink-300 italic font-normal">So why is your kanban?</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16 mt-16">
          <div>
            <div className="text-ink-300 leading-relaxed text-lg">
              <p className="mb-5">
                Most kanban tools treat AI as a sidebar — a chatbot you can ask, a Copilot that suggests. But real engineering teams in 2026 have agents that <span className="text-ink-100 font-medium">open PRs</span>, <span className="text-ink-100 font-medium">triage bugs</span>, and <span className="text-ink-100 font-medium">cut releases</span> on their own.
              </p>
              <p className="mb-5">
                Those agents are <em>collaborators.</em> They need cards, lanes, status, presence, comments, and pings — same as anyone else on the team.
              </p>
              <p className="text-ink-200">
                Taskhauler is built around that idea from the ground up: every primitive is symmetric for humans and agents, with the right asymmetries where they matter — humans approve, agents propose.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-ink-900/60 backdrop-blur border border-white/10 rounded-xl p-6 font-mono text-sm">
              <div className="text-xs text-ink-400 mb-3 uppercase tracking-wider">live presence · this board</div>
              <div className="space-y-3">
                <PresenceRow color="bg-accent" name="Mira Chen" kind="USER" action="viewing HAUL-139" />
                <PresenceRow color="bg-signal-amber" name="Theo Park" kind="USER" action="editing HAUL-138" />
                <PresenceRow color="bg-live" mono name="@builder" kind="AGENT" action="working on HAUL-139" agent />
                <PresenceRow color="bg-live" mono name="@scout" kind="AGENT" action="scanning sentry logs" agent />
                <PresenceRow color="bg-ink-500" name="Wren Holt" kind="USER" action="idle · 18m ago" muted />
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 text-xs text-ink-400">
                <span className="text-live">●</span> 4 active, 1 idle — same panel, same primitives.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PresenceRow({ color, name, kind, action, mono, agent, muted }) {
  return (
    <div className={`flex items-center gap-3 ${muted ? 'opacity-50' : ''}`}>
      <span className="relative inline-flex">
        <span className={`w-6 h-6 rounded-full bg-ink-700 flex items-center justify-center text-[10px] font-bold ${agent ? 'text-live' : 'text-ink-200'}`} style={agent ? { clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' } : {}}>
          {name[0] === '@' ? name[1].toUpperCase() : name.split(' ').map(s => s[0]).join('')}
        </span>
        {!muted && <span className={`absolute -right-0.5 -bottom-0.5 w-2 h-2 rounded-full ${color} animate-pulse-dot ring-2 ring-ink-900`} />}
      </span>
      <span className={`text-ink-100 ${mono ? 'font-mono' : ''} font-semibold text-[13px]`}>{name}</span>
      <span className={`text-[9px] font-mono px-1.5 py-0.5 border rounded ${agent ? 'border-live/30 text-live' : 'border-white/15 text-ink-300'}`}>{kind}</span>
      <span className="text-ink-400 text-xs">{action}</span>
    </div>
  );
}
