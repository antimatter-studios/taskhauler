import { Inbox, Route, History } from 'lucide-react'

const steps = [
  {
    n: '01',
    icon: Inbox,
    title: 'Capture',
    body: 'Humans or agents create tasks via the UI, REST API, or MCP. Same data model, same authorization, same audit trail.',
  },
  {
    n: '02',
    icon: Route,
    title: 'Route',
    body: 'Triage and dispatch. Tasks get tagged agent-ready or needs-human, routed to boards, and picked up by whichever worker is right.',
  },
  {
    n: '03',
    icon: History,
    title: 'Record',
    body: 'A durable, queryable log of every status change, comment, link, and artifact. Your tracker is also your history of record.',
  },
]

export default function HowItWorks() {
  return (
    <section className="relative w-full border-b border-zinc-800/60">
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
        <div className="max-w-3xl mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-cyan-400 mb-4">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Three steps. No magic.
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          {/* Connector line on desktop */}
          <div
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
            aria-hidden
          />

          {steps.map(({ n, icon: Icon, title, body }) => (
            <div
              key={n}
              className="relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 text-cyan-200">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="font-mono text-sm text-zinc-600 tracking-widest">
                  {n}
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">{title}</h3>
              <p className="text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8">
          <div>
            <h3 className="text-xl font-semibold text-white">Ready to haul some tasks?</h3>
            <p className="text-zinc-400 mt-1">Spin up the app, point your agents at it, and get to work.</p>
          </div>
          <a
            href="https://taskhauler.antimatter-studios.com"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 text-zinc-950 font-semibold px-5 py-3 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            Open taskhauler
          </a>
        </div>
      </div>
    </section>
  )
}
