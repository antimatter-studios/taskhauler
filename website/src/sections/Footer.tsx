import { Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-950">
      <div className="mx-auto max-w-screen-2xl px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-cyan-400 to-blue-500 text-zinc-950">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12 L10 17 L19 7" />
                </svg>
              </span>
              <span className="font-semibold tracking-tight text-zinc-100">taskhauler</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
              Kanban for humans and agents. A self-hostable task tracker with a first-class API.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="https://taskhauler.antimatter-studios.com" className="hover:text-zinc-200 transition">
                  Open the app
                </a>
              </li>
              <li>
                <a href="https://github.com/antimatter-studios/taskhauler" className="hover:text-zinc-200 transition inline-flex items-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4">Studio</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="https://www.antimatter-studios.com" className="hover:text-zinc-200 transition">
                  Antimatter Studios
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">
            &copy; 2026 Antimatter Studios. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700 font-mono">
            taskhauler &middot; built where the work gets recorded
          </p>
        </div>
      </div>
    </footer>
  )
}
