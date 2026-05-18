import {
  LayoutGrid,
  Layers,
  GitBranch,
  Plug,
  KeyRound,
  FileCode2,
} from 'lucide-react'

const features = [
  {
    icon: LayoutGrid,
    title: 'Kanban boards with drag-drop',
    body: 'Columns, swimlanes, WIP limits. The board moves at the speed of your hand.',
  },
  {
    icon: Layers,
    title: 'Epics & sub-boards',
    body: 'Break large initiatives into nested boards without losing context. Roll progress up.',
  },
  {
    icon: GitBranch,
    title: 'GitHub integration',
    body: 'Issues become tasks. Optional auto-repair flows hand work to agents and report back.',
  },
  {
    icon: Plug,
    title: 'MCP server included',
    body: 'Native Model Context Protocol server, so Claude and other agents can drive the tracker directly.',
  },
  {
    icon: KeyRound,
    title: 'JWT auth + service accounts',
    body: 'Humans and bots both first-class. Scoped tokens, audit log, no shared credentials.',
  },
  {
    icon: FileCode2,
    title: 'OpenAPI spec',
    body: 'Every endpoint documented and typed. Generate clients in any language in seconds.',
  },
]

export default function Features() {
  return (
    <section className="relative w-full border-b border-zinc-800/60 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/40">
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-24 sm:py-32">
        <div className="max-w-3xl mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase text-cyan-400 mb-4">
            Features
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Everything a modern team — human or otherwise — needs.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6 lg:gap-8">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-7 hover:border-cyan-500/40 hover:bg-zinc-900/80 transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-zinc-800/80 border border-zinc-700 text-cyan-300 group-hover:text-cyan-200 group-hover:border-cyan-500/40 transition">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>
              <p className="text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
