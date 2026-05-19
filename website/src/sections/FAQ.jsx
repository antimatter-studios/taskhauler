const QA = [
  { q: 'What\'s the deal with "agents"? What runs them?', a: 'You do. Taskhauler doesn\'t embed a model — agents are external processes (a script using the Claude/OpenAI/Anthropic SDK, a long-running Python service, whatever) that authenticate via an API token. They subscribe to webhooks for their queue and POST telemetry back. The flexibility is intentional: you bring the runtime, we provide the surface.' },
  { q: 'Can I disable the agent stuff entirely?', a: 'Yes. The Console rail toggles off, agents are just users you never invite. The Plans queue is empty. You get a clean, fast kanban with 4 views and 3 themes — like a self-hosted Linear-lite.' },
  { q: 'How does the realtime layer work?', a: 'A single WebSocket per client on /presence, scoped to the active board. Presence updates are tiny (~80 bytes) and broadcast to other clients on the board. Activity events come over SSE on /activity?since=cursor. Both are server-authoritative — no CRDT, no local-first.' },
  { q: 'Can I bring my own theme?', a: 'Yes. Themes are CSS custom properties applied to :root[data-theme="..."]. Add a new selector with your tokens (background, surface, accent, etc.) and your theme appears in the swatch row. Bring your own font stack via --font-sans / --font-mono.' },
  { q: 'What\'s the API surface like for agents?', a: 'REST + SSE. The agent reads /api/cards/:id, posts /api/cards/:id/comments, updates its presence on /presence, files proposals on /api/proposals. The full OpenAPI spec is in /docs/api.yaml.' },
  { q: 'Is there a UI for agent ops (start/stop/configure)?', a: 'A small one in admin: list of registered agent aliases, last-seen timestamps, ability to revoke tokens. Most teams hook this into their existing service registry.' },
  { q: 'Why Go on the backend?', a: 'Single binary deploys. Fast startup. Mature WebSocket libraries. Boring in a good way. We were not going to add a Python or Node runtime just for a kanban backend.' },
  { q: 'Can I migrate from Linear / Jira?', a: 'There\'s a one-shot importer for Linear (uses their GraphQL export) and a Jira CSV adapter. Both preserve card IDs, links, comments, and labels. They do NOT preserve workflow rules or automations — Taskhauler doesn\'t have a direct mapping for those.' },
  { q: 'How fragile is the agent presence / live transcript stuff?', a: 'It\'s an enhancement, not a requirement. If an agent doesn\'t send telemetry, its card just looks like a normal assigned card. The board still works. We treat the live feel as progressive enhancement, not a load-bearing feature.' },
  { q: 'Does it work offline?', a: 'No. If you close your laptop, your changes pause. We\'re not building local-first sync this year.' },
];

export default function FAQ() {
  return (
    <section className="relative bg-cream-50 text-ink-900 py-28">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-5">QUESTIONS</div>
        <h2 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight mb-12 max-w-3xl">
          The stuff people <span className="italic text-accent">actually ask.</span>
        </h2>

        <div className="space-y-3">
          {QA.map((item, i) => (
            <details key={i} className="group bg-white border border-cream-200 rounded-xl p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                <h3 className="font-semibold text-ink-900 text-lg leading-snug">{item.q}</h3>
                <span className="text-accent text-xl mt-0.5 transition-transform group-open:rotate-45 flex-shrink-0">+</span>
              </summary>
              <p className="mt-4 text-ink-700 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
