import { ArrowRight, Github } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative w-full min-h-[70vh] flex items-center overflow-hidden border-b border-zinc-800/60">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(34,211,238,0.5), rgba(59,130,246,0.2) 40%, transparent 70%)',
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-zinc-950" aria-hidden />

      {/* Nav */}
      <nav className="absolute top-0 inset-x-0 z-20">
        <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <LogoMark />
            <span className="font-semibold tracking-tight text-zinc-100">taskhauler</span>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="https://github.com/antimatter-studios/taskhauler"
              className="hidden sm:inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://taskhauler.antimatter-studios.com"
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 text-zinc-900 px-3 py-1.5 text-sm font-medium hover:bg-white transition"
            >
              Open app
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-32 sm:py-40">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur px-3 py-1 text-xs text-zinc-400 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Kanban for humans and agents
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05]">
              <span className="block text-white">Track work.</span>
              <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Trigger agents.
              </span>
              <span className="block text-white">Done.</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
              <span className="text-zinc-100 font-medium">taskhauler</span> is a
              standalone task tracker built for humans and drivable by agents.
              Kanban, epics, sub-boards — with a first-class REST and MCP API
              underneath.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <a
                href="https://taskhauler.antimatter-studios.com"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 text-zinc-950 font-semibold px-5 py-3 text-sm sm:text-base hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20"
              >
                Try the app
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://github.com/antimatter-studios/taskhauler"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900/60 backdrop-blur px-5 py-3 text-sm sm:text-base font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/60 transition"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoMark() {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 text-zinc-950">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12 L10 17 L19 7" />
      </svg>
    </span>
  )
}
