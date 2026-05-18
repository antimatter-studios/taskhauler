import { KanbanSquare, Bot, Server } from 'lucide-react'

const pillars = [
  {
    icon: KanbanSquare,
    title: 'Standalone task tracker',
    body: 'Kanban boards, epics, sub-boards. No project-management bloat — just the structure you actually use to ship work.',
  },
  {
    icon: Bot,
    title: 'Built for humans, drivable by agents',
    body: 'REST + MCP + skills, all first class. Your team uses the UI; your agents use the same API the UI does.',
  },
  {
    icon: Server,
    title: 'Self-hostable',
    body: 'Postgres + a Go binary + a React app. Run it on your laptop, on a VPS, or in your cluster. No lock-in.',
  },
]

export default function Why() {
  return (
    <section className="relative w-full border-b border-zinc-800/60">
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
        <div className="max-w-3xl mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-cyan-400 mb-4">
            Why taskhauler
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Where the work gets recorded.
          </h2>
          <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
            Most trackers are built around humans clicking buttons. taskhauler
            assumes half your team is software — and treats it that way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 hover:border-zinc-700 hover:bg-zinc-900/70 transition"
            >
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 mb-6 group-hover:bg-cyan-400/20 transition">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
              <p className="text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
