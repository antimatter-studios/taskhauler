export default function CTA() {
  return (
    <section id="cta" className="relative py-32 overflow-hidden grain">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(91,91,214,0.20),transparent_70%)] pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <img src="./brand/icon.svg" alt="" className="w-16 h-16 mx-auto mb-8" />
        <h2 className="font-serif text-5xl md:text-7xl leading-[1.0] tracking-tight title-gradient mb-6">
          Ship with your<br /><span className="italic accent-gradient">whole team.</span>
        </h2>
        <p className="text-ink-300 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Five minutes to self-host. MIT-licensed. Bring as many humans and agents as you have.
        </p>

        <div className="bg-ink-900/80 backdrop-blur border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto text-left font-mono text-sm mb-8">
          <div className="text-xs text-ink-400 mb-3 uppercase tracking-wider">install</div>
          <div className="space-y-1.5 text-ink-100">
            <div><span className="text-live mr-2">$</span>git clone https://github.com/you/taskhauler</div>
            <div><span className="text-live mr-2">$</span>cd taskhauler &amp;&amp; docker compose up -d</div>
            <div><span className="text-live mr-2">$</span>open http://localhost:8080</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="https://github.com/your-repo" className="bg-white text-ink-950 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-accent hover:text-white transition shadow-lg shadow-black/40">
            Star on GitHub →
          </a>
          <a href="https://github.com/your-repo#docs" className="text-ink-200 px-6 py-3 rounded-lg font-medium text-sm border border-white/15 hover:bg-white/5 transition">
            Read the docs
          </a>
          <a href="https://discord.gg/your-server" className="text-ink-200 px-6 py-3 rounded-lg font-medium text-sm border border-white/15 hover:bg-white/5 transition">
            Join Discord
          </a>
        </div>

        <div className="mt-12 text-xs font-mono text-ink-400">
          v0.4 · 2026-05 · MIT licensed · maintained by a tiny team
        </div>
      </div>
    </section>
  );
}
