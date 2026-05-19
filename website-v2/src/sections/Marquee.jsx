const ITEMS = [
  'Live agent telemetry',
  'Multi-step plan proposals',
  '4 swappable views',
  '3 themeable skins',
  'Drag-and-drop everywhere',
  'Multiplayer presence',
  'Keyboard-first',
  'MIT licensed',
  'Self-hosted',
  'Webhooks + REST',
  'Fullscreen focus mode',
  'Agent-friendly API',
];

export default function Marquee() {
  return (
    <section className="border-y border-white/5 bg-ink-900/30 overflow-hidden">
      <div className="flex marquee-track whitespace-nowrap py-4">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div key={i} className="flex items-center gap-3 mx-6 text-ink-300 text-sm">
            <span className="w-1 h-1 rounded-full bg-accent-400" />
            <span className="font-mono tracking-wide">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
