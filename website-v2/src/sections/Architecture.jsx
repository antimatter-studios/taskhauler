export default function Architecture() {
  return (
    <section id="architecture" className="relative bg-cream-50 text-ink-900 py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-5">
          UNDER THE HOOD
        </div>
        <h2 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight mb-6 max-w-3xl">
          A small, sharp, <span className="italic text-accent">self-hostable</span> stack.
        </h2>
        <p className="text-ink-700 text-lg max-w-2xl mb-16 leading-relaxed">
          Designed to fit in a single docker-compose, deploy to your own infra in minutes, and stay legible for the team that owns it. No telemetry pipeline you can't see. No SaaS dependencies you didn't pick.
        </p>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-cream-200 p-8 shadow-sm">
            <div className="font-mono text-xs text-ink-500 uppercase tracking-wider mb-5">stack</div>
            <div className="space-y-5">
              {[
                { layer: 'Frontend', tech: 'React 19 · Vite · Tailwind 4 · shadcn/ui · Zustand · @dnd-kit', why: 'Modern, fast HMR, components you already know. The kanban board itself is ~12 small files.' },
                { layer: 'Backend', tech: 'Go · Echo · Postgres · NATS (presence)', why: 'Single binary. Compiles fast. Fits in a Pi or a beefy box. Postgres for data, NATS for the realtime channel.' },
                { layer: 'Agent runtime', tech: 'Pluggable (Claude SDK · OpenAI · BYO)', why: 'Agents are external processes that connect to an API token. You bring the runtime, Taskhauler is just the surface.' },
                { layer: 'Realtime', tech: 'WebSocket on /presence, SSE on /activity', why: 'Two simple channels. Presence updates broadcast on connect/disconnect/move. Activity is read-only stream.' },
              ].map((row) => (
                <div key={row.layer} className="grid grid-cols-12 gap-4 pb-5 border-b border-cream-200 last:border-0 last:pb-0">
                  <div className="col-span-3 font-semibold text-ink-900">{row.layer}</div>
                  <div className="col-span-9">
                    <div className="font-mono text-sm text-ink-700">{row.tech}</div>
                    <div className="text-sm text-ink-600 mt-1.5 leading-relaxed">{row.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-ink-950 text-ink-100 rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent pointer-events-none" />
              <div className="relative">
                <div className="font-mono text-xs text-live mb-3 uppercase tracking-wider">deploy</div>
                <pre className="font-mono text-xs leading-relaxed text-ink-100 overflow-x-auto"><code>{`# Clone and run
git clone github.com/you/taskhauler
cd taskhauler
docker compose up -d

# Hit the board
open http://localhost:8080`}</code></pre>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-cream-200 p-6">
              <div className="font-mono text-xs text-accent mb-3 uppercase tracking-wider">resource cost</div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-ink-600">Idle RAM</span><span className="font-mono font-semibold">~80 MB</span></div>
                <div className="flex justify-between"><span className="text-ink-600">10 users + 5 agents</span><span className="font-mono font-semibold">~140 MB</span></div>
                <div className="flex justify-between"><span className="text-ink-600">Database (10k cards)</span><span className="font-mono font-semibold">~25 MB</span></div>
                <div className="flex justify-between"><span className="text-ink-600">P99 API latency</span><span className="font-mono font-semibold">&lt; 12 ms</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Data model */}
        <div className="mt-16">
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-5">CORE PRIMITIVES</div>
          <h3 className="font-serif text-3xl text-ink-900 mb-8 max-w-2xl">Eight types. That's the whole system.</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-sm">
            {[
              { t: 'Board', d: 'name, prefix, settings' },
              { t: 'Column', d: 'name, position, board_id' },
              { t: 'Epic', d: 'name, color, board_id' },
              { t: 'Card', d: 'title, body, status, priority, assignee, due, estimate, progress' },
              { t: 'User', d: 'name, email, hue' },
              { t: 'Agent', d: 'name, plugin, telemetry, transcript' },
              { t: 'Comment', d: 'body, card_id, author' },
              { t: 'Proposal', d: 'proposer, actions[], status, confidence' },
            ].map(p => (
              <div key={p.t} className="bg-white border border-cream-200 rounded-lg p-4">
                <div className="text-ink-900 font-bold mb-1">{p.t}</div>
                <div className="text-ink-500 text-xs leading-relaxed">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
