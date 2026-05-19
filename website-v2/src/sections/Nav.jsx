export default function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-ink-950/60 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-8">
        <a href="#top" className="flex items-center gap-2.5 group">
          <img src="./brand/icon.svg" alt="" className="w-8 h-8" />
          <span className="font-bold tracking-tight">Taskhauler</span>
        </a>
        <div className="hidden md:flex items-center gap-6 text-sm text-ink-300">
          <a href="#views" className="hover:text-ink-100 transition">Views</a>
          <a href="#features" className="hover:text-ink-100 transition">Features</a>
          <a href="#agents" className="hover:text-ink-100 transition">Agents</a>
          <a href="#architecture" className="hover:text-ink-100 transition">How it works</a>
          <a href="#whynot" className="hover:text-ink-100 transition">Honest tradeoffs</a>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <a href="https://github.com" className="text-sm text-ink-300 hover:text-ink-100 transition hidden sm:inline">GitHub ↗</a>
          <a href="#cta" className="text-sm font-medium bg-white text-ink-950 px-3.5 py-1.5 rounded-md hover:bg-accent hover:text-white transition">Get started</a>
        </div>
      </div>
    </nav>
  );
}
