export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 bg-ink-950">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          <img src="./brand/icon.svg" alt="" className="w-7 h-7" />
          <div>
            <div className="font-bold tracking-tight text-sm">Taskhauler</div>
            <div className="text-xs text-ink-400 font-mono">kanban for teams of humans + agents</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-2">Product</div>
            <a href="#views" className="block text-ink-300 hover:text-ink-100 transition mb-1">Views</a>
            <a href="#features" className="block text-ink-300 hover:text-ink-100 transition mb-1">Features</a>
            <a href="#agents" className="block text-ink-300 hover:text-ink-100 transition">Agents</a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-2">Docs</div>
            <a href="#architecture" className="block text-ink-300 hover:text-ink-100 transition mb-1">Architecture</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition mb-1">API reference</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition">Agent SDK</a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-2">Community</div>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition mb-1">GitHub</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition mb-1">Discord</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition">Blog</a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 font-mono mb-2">Legal</div>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition mb-1">MIT license</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition mb-1">Privacy</a>
            <a href="#" className="block text-ink-300 hover:text-ink-100 transition">Security</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ink-500">
        <div className="font-mono">© 2026 Taskhauler contributors</div>
        <div className="font-mono">built with React · Vite · Tailwind · ❤︎</div>
      </div>
    </footer>
  );
}
