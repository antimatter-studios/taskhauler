const TOOLS = [
  { n: 'Taskhauler', us: true, kanban: 'yes', timeline: 'yes', terminal: 'yes', agents: 'first-class', plans: 'yes', presence: 'yes', selfhost: 'yes', price: 'free · MIT' },
  { n: 'Linear',     us: false, kanban: 'yes', timeline: 'cycles', terminal: 'no', agents: 'via API', plans: 'no', presence: 'no', selfhost: 'no', price: '$10/seat' },
  { n: 'Jira',       us: false, kanban: 'yes', timeline: 'yes', terminal: 'no', agents: 'plugin', plans: 'no', presence: 'partial', selfhost: 'yes (DC)', price: 'enterprise' },
  { n: 'Trello',     us: false, kanban: 'yes', timeline: 'no', terminal: 'no', agents: 'no', plans: 'no', presence: 'no', selfhost: 'no', price: '$5/seat' },
  { n: 'GitHub Projects', us: false, kanban: 'yes', timeline: 'roadmap', terminal: 'no', agents: 'actions', plans: 'no', presence: 'no', selfhost: 'no', price: 'free + repo' },
];

const COLS = [
  { k: 'kanban', l: 'Kanban' },
  { k: 'timeline', l: 'Timeline' },
  { k: 'terminal', l: 'Terminal view' },
  { k: 'agents', l: 'Agents' },
  { k: 'plans', l: 'Plan proposals' },
  { k: 'presence', l: 'Presence' },
  { k: 'selfhost', l: 'Self-host' },
  { k: 'price', l: 'Price' },
];

export default function Comparison() {
  return (
    <section className="relative py-28 grain">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent-400 mb-5">VS. THE OTHERS</div>
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] tracking-tight title-gradient mb-12 max-w-4xl">
          A different shape<br />of <span className="italic accent-gradient">work tool.</span>
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-ink-900/40">
                <th className="text-left p-4 font-semibold text-ink-100 sticky left-0 bg-ink-900/40">Tool</th>
                {COLS.map(c => <th key={c.k} className="text-left p-4 font-medium text-ink-300 whitespace-nowrap">{c.l}</th>)}
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.n} className={`border-b border-white/5 ${t.us ? 'bg-accent/5' : ''}`}>
                  <td className={`p-4 font-semibold sticky left-0 ${t.us ? 'text-accent-400 bg-accent/5' : 'text-ink-100 bg-ink-950'}`}>
                    <div className="flex items-center gap-2">
                      {t.us && <img src="./brand/icon.svg" className="w-5 h-5" alt="" />}
                      <span>{t.n}</span>
                    </div>
                  </td>
                  {COLS.map(c => (
                    <td key={c.k} className={`p-4 ${t.us ? 'text-ink-100' : 'text-ink-400'} whitespace-nowrap font-mono text-xs`}>
                      <Cell value={t[c.k]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-xs text-ink-400 font-mono">
          Not a hit-piece — Linear and Jira do plenty Taskhauler doesn't. This table only highlights the axes where Taskhauler is opinionated.
        </div>
      </div>
    </section>
  );
}

function Cell({ value }) {
  if (value === 'yes') return <span className="text-live">●  yes</span>;
  if (value === 'no')  return <span className="text-ink-500">○  no</span>;
  if (value === 'first-class') return <span className="text-live font-semibold">★  first-class</span>;
  return <span>{value}</span>;
}
