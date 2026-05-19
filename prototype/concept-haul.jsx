// concept-haul.jsx — Dense pro Linear-style board.
// Theme-switchable: Day / Mono / Paper. The same dense board, three skins.

const HAUL_THEMES = {
  day: {
    name: "Day",
    bg:        "#fafaf9",
    surface:   "#ffffff",
    hover:     "#f4f4f3",
    border:    "#e7e5e0",
    borderHi:  "#d6d3cd",
    text:      "#18181b",
    text2:     "#52525b",
    text3:     "#a1a1aa",
    accent:    "#5b5bd6",
    accentBg:  "#eef0ff",
    accentFg:  "#fff",
    red:       "#dc2626",
    amber:     "#f59e0b",
    green:     "#16a34a",
    font:      "Inter, sans-serif",
    mono:      "'Geist Mono', monospace",
    radius:    6,
    swatch:    "#5b5bd6",
  },
  mono: {
    name: "Mono",
    bg:        "#0c0c0a",
    surface:   "#15140f",
    hover:     "#1e1c14",
    border:    "#2a2820",
    borderHi:  "#3b3826",
    text:      "#e8d9b0",
    text2:     "#a89770",
    text3:     "#6b6044",
    accent:    "#facc15",
    accentBg:  "rgba(250,204,21,0.10)",
    accentFg:  "#1c1917",
    red:       "#f87171",
    amber:     "#fbbf24",
    green:     "#84cc16",
    font:      "'JetBrains Mono', 'Geist Mono', monospace",
    mono:      "'JetBrains Mono', 'Geist Mono', monospace",
    radius:    2,
    swatch:    "#facc15",
  },
  paper: {
    name: "Paper",
    bg:        "#f5f0e2",
    surface:   "#fbf7e9",
    hover:     "#ede6cf",
    border:    "#d4cab2",
    borderHi:  "#b8ad8f",
    text:      "#2a251c",
    text2:     "#5e574a",
    text3:     "#9a8f78",
    accent:    "#9a3412",
    accentBg:  "#fef0e2",
    accentFg:  "#fff",
    red:       "#b91c1c",
    amber:     "#a16207",
    green:     "#65a30d",
    font:      "Inter, sans-serif",
    mono:      "'Geist Mono', monospace",
    radius:    4,
    swatch:    "#9a3412",
  },
};

// Mutable module-level — reassigned at the top of Haul() based on theme state.
// Closures in sub-components read this by name on each render.
let HAUL = HAUL_THEMES.day;

function HaulIcon({ d, size = 14, stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const ICON = {
  search:   "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2l-4.35-4.35",
  filter:   "M3 5h18l-7 9v6l-4-2v-4z",
  grid:     "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list:     "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  kanban:   "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v7h-4z",
  cal:      "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  timeline: "M3 12h2M9 12h2M15 12h2M21 12h-2M3 6h18M3 18h18",
  terminal: "M4 6l4 4-4 4M11 16h9",
  dispatch: "M4 6h4M16 6h4M10 6h4M4 12h16M4 18h16",
  plus:     "M12 5v14M5 12h14",
  inbox:    "M3 13h6l2 3h2l2-3h6M3 13V5h18v8M3 13v6h18v-6",
  sparkles: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  chev:     "M9 6l6 6-6 6",
  chevd:    "M6 9l6 6 6-6",
  more:     "M5 12h.01M12 12h.01M19 12h.01",
  block:    "M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM4.93 4.93l14.14 14.14",
  link:     "M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1",
  flame:    "M12 22a7 7 0 0 0 7-7c0-3-2.5-5.5-3-7-1.5-3.5-4-5-4-5s-1 3-3 5-4 4-4 7a7 7 0 0 0 7 7z",
  msg:      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  focus:    "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6",
};

const HAUL_GROUPINGS = [
  { id: "col",      label: "Status"     },
  { id: "priority", label: "Priority"   },
  { id: "epic",     label: "Epic"       },
  { id: "assignee", label: "Assignee"   },
  { id: "due",      label: "Due"        },
];

function HaulPriorityDot({ p }) {
  if (!p) return <span style={{ width: 12, height: 12, display: "inline-block" }} />;
  const cfg = window.PRIORITIES[p];
  // urgent: solid red dot; high: 3 bars; med: 2 bars; low: 1 bar.
  if (p === "urgent") {
    return <span title="Urgent" style={{ display: "inline-flex", alignItems: "center" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, boxShadow: `0 0 0 2px ${cfg.color}22` }} />
    </span>;
  }
  const heights = { high: [4, 7, 10], medium: [4, 7, 4], low: [4, 4, 4] }[p] || [4,4,4];
  const fills =   { high: [1, 1, 1],  medium: [1, 1, 0],  low: [1, 0, 0]  }[p] || [0,0,0];
  return (
    <span title={cfg.label} style={{ display: "inline-flex", alignItems: "flex-end", gap: 1.5, height: 12 }}>
      {heights.map((h, i) => (
        <span key={i} style={{
          width: 2.5, height: h,
          background: fills[i] ? HAUL.text2 : HAUL.borderHi,
          borderRadius: 0.5,
        }} />
      ))}
    </span>
  );
}

function HaulCard({ card, onOpen, selected, onDragStart, compact }) {
  const ep = card.epic ? window.getEpic(card.epic) : null;
  const due = window.fmtDue(card.due);
  const a = card.assignee?.agent ? window.getAgent(card.assignee.agent) : null;
  const isAgentWorking = a && a.status === "working";
  const presence = window.presenceOnCard(card.id).filter(p => !(p.kind === "agent" && card.assignee?.agent === p.name));
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, card.id)}
      onClick={() => onOpen(card.id)}
      style={{
        background: HAUL.surface,
        border: `1px solid ${selected ? HAUL.accent : HAUL.border}`,
        boxShadow: selected ? `0 0 0 3px ${HAUL.accent}22` : "0 1px 0 rgba(0,0,0,0.02)",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 6,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HaulPriorityDot p={card.priority} />
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: HAUL.text3, letterSpacing: 0.2 }}>
          HAUL-{card.number}
        </span>
        {card.type === "bug" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: HAUL.red, fontWeight: 600 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: HAUL.red }} />BUG
          </span>
        )}
        {card.blockedBy && (
          <span title="Blocked" style={{ color: HAUL.red, display: "inline-flex" }}>
            <HaulIcon d={ICON.block} size={11} />
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {presence.length > 0 && (
            <span title={`${presence.length} ${presence.length === 1 ? "person" : "people"} here · ${presence.map(p => window.presenceName(p)).join(", ")}`}
              style={{ display: "inline-flex", alignItems: "center" }}>
              {presence.slice(0, 3).map((p, i) => (
                <span key={p.id} style={{
                  display: "inline-flex",
                  marginLeft: i === 0 ? 0 : -5,
                  position: "relative",
                  boxShadow: `0 0 0 1.5px ${HAUL.surface}`,
                  borderRadius: 99,
                }}>
                  {window.presenceAvatar(p, 14)}
                  {p.action !== "idle" && (
                    <span style={{
                      position: "absolute", right: -1, bottom: -1, width: 4, height: 4, borderRadius: 99,
                      background: p.color === "editing" ? HAUL.amber : p.color === "agent" ? HAUL.green : HAUL.accent,
                      boxShadow: `0 0 0 1px ${HAUL.surface}`,
                    }} />
                  )}
                </span>
              ))}
              {presence.length > 3 && (
                <span style={{ marginLeft: -2, fontSize: 9, fontWeight: 700, color: HAUL.text3, fontFamily: "'Geist Mono', monospace" }}>+{presence.length - 3}</span>
              )}
            </span>
          )}
          {card.commentsN > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: HAUL.text3, fontSize: 10.5 }}>
              <HaulIcon d={ICON.msg} size={11} />{card.commentsN}
            </span>
          )}
          {card.assignee && (
            <span style={{ position: "relative", display: "inline-flex" }}>
              <window.AssigneeChip assignee={card.assignee} size={18} />
              {isAgentWorking && (
                <span style={{
                  position: "absolute", right: -2, bottom: -2,
                  width: 7, height: 7, borderRadius: 99,
                  background: "#22c55e", boxShadow: "0 0 0 1.5px #fff",
                  animation: "haul-pulse 1.6s ease-in-out infinite",
                }} />
              )}
            </span>
          )}
        </span>
      </div>
      <div style={{
        fontWeight: 500, color: HAUL.text, lineHeight: 1.35,
        display: "-webkit-box", WebkitLineClamp: compact ? 1 : 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{card.title}</div>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 1 }}>
          {ep && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10.5, fontWeight: 500, color: HAUL.text2,
              background: HAUL.bg, border: `1px solid ${HAUL.border}`,
              padding: "1px 5px", borderRadius: 3,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: ep.color }} />
              {ep.short}
            </span>
          )}
          {card.estimate && (
            <span style={{ fontSize: 10.5, color: HAUL.text3, fontFamily: "'Geist Mono', monospace" }}>{card.estimate}pt</span>
          )}
          {due && (
            <span style={{
              fontSize: 10.5, fontWeight: 500,
              color: due.overdue ? HAUL.red : due.soon ? HAUL.amber : HAUL.text3,
              marginLeft: "auto",
            }}>{due.txt}</span>
          )}
        </div>
      )}
      {typeof card.progress === "number" && card.progress < 1 && (
        <div style={{ height: 2, borderRadius: 99, background: HAUL.border, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${card.progress * 100}%`, background: HAUL.accent }} />
        </div>
      )}
    </div>
  );
}

function Haul() {
  const [themeName, setThemeName] = React.useState("day");
  HAUL = HAUL_THEMES[themeName]; // reassign module-level palette before children render

  const [cards, setCards] = React.useState(window.CARDS);
  const [grouping, setGrouping] = React.useState("col");
  const [view, setView] = React.useState("kanban");
  const [selected, setSelected] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [filterAssignee, setFilterAssignee] = React.useState("all");
  const [consoleOpen, setConsoleOpen] = React.useState(true);
  const [railTab, setRailTab] = React.useState("console");
  const [focusedId, setFocusedId] = React.useState(null);

  // ⌨️  F = focus selected card, Esc handled in modal
  React.useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "f" && selected && !focusedId) {
        e.preventDefault();
        setFocusedId(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, focusedId]);

  const onDragStart = (e, id) => { e.dataTransfer.setData("text/plain", id); };
  const onDrop = (e, colId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setCards(prev => prev.map(c => c.id === id ? { ...c, col: colId } : c));
    setDragOver(null);
  };

  const filtered = React.useMemo(() => {
    if (filterAssignee === "all") return cards;
    if (filterAssignee === "agents") return cards.filter(c => c.assignee?.agent);
    if (filterAssignee === "mine") return cards.filter(c => c.assignee?.user === 1);
    return cards;
  }, [cards, filterAssignee]);

  // Group cards by chosen dimension
  const groups = React.useMemo(() => {
    if (grouping === "col") {
      return window.COLUMNS.map(col => ({
        key: col.id, label: col.name, sub: col.short,
        cards: filtered.filter(c => c.col === col.id),
        accent: col.id === "c2" ? HAUL.accent : col.id === "c3" ? "#a855f7" : col.id === "c4" ? HAUL.green : HAUL.text3,
      }));
    }
    if (grouping === "priority") {
      const order = ["urgent", "high", "medium", "low"];
      return order.map(p => ({
        key: p, label: window.PRIORITIES[p].label, sub: window.PRIORITIES[p].short,
        cards: filtered.filter(c => c.priority === p),
        accent: window.PRIORITIES[p].color,
      })).filter(g => g.cards.length > 0);
    }
    if (grouping === "epic") {
      const eps = [...window.EPICS, { id: null, name: "No epic", color: HAUL.text3, short: "—" }];
      return eps.map(e => ({
        key: e.id ?? "none", label: e.name, sub: e.short,
        cards: filtered.filter(c => (c.epic ?? null) === e.id),
        accent: e.color,
      })).filter(g => g.cards.length > 0);
    }
    if (grouping === "assignee") {
      const buckets = new Map();
      filtered.forEach(c => {
        const k = c.assignee?.agent ? `a:${c.assignee.agent}` : c.assignee?.user ? `u:${c.assignee.user}` : "none";
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(c);
      });
      return Array.from(buckets.entries()).map(([k, list]) => {
        if (k === "none") return { key: k, label: "Unassigned", sub: "—", cards: list, accent: HAUL.text3 };
        if (k.startsWith("a:")) {
          const a = window.getAgent(k.slice(2));
          return { key: k, label: `@${a.name}`, sub: a.plugin, cards: list, accent: "#0ea5e9", agent: true };
        }
        const u = window.getUser(Number(k.slice(2)));
        return { key: k, label: u.name, sub: u.handle, cards: list, accent: `oklch(0.65 0.13 ${u.hue})` };
      });
    }
    if (grouping === "due") {
      const buckets = { overdue: [], today: [], week: [], later: [], none: [] };
      filtered.forEach(c => {
        if (!c.due) buckets.none.push(c);
        else {
          const d = (c.due - window.NOW) / 86400000;
          if (d < 0) buckets.overdue.push(c);
          else if (d < 1) buckets.today.push(c);
          else if (d < 7) buckets.week.push(c);
          else buckets.later.push(c);
        }
      });
      return [
        { key: "overdue", label: "Overdue",     sub: "!",  cards: buckets.overdue, accent: HAUL.red },
        { key: "today",   label: "Today",       sub: "0d", cards: buckets.today,   accent: HAUL.amber },
        { key: "week",    label: "This week",   sub: "7d", cards: buckets.week,    accent: HAUL.accent },
        { key: "later",   label: "Later",       sub: "→",  cards: buckets.later,   accent: HAUL.text3 },
        { key: "none",    label: "No due date", sub: "—",  cards: buckets.none,    accent: HAUL.text3 },
      ].filter(g => g.cards.length > 0);
    }
    return [];
  }, [filtered, grouping]);

  const selCard = selected ? cards.find(c => c.id === selected) : null;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: HAUL.bg, color: HAUL.text, fontFamily: HAUL.font, fontSize: 13 }}>
      <style>{`
        @keyframes haul-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.4); } }
        @keyframes haul-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes haul-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .haul-pill { transition: background 120ms, color 120ms, border-color 120ms; }
        .haul-pill:hover { background: ${HAUL.hover}; }
        .haul-kbd { font-family: 'Geist Mono', monospace; font-size: 10px; background: ${HAUL.surface}; border: 1px solid ${HAUL.border}; border-bottom-width: 2px; border-radius: 3px; padding: 0 4px; color: ${HAUL.text2}; }
        .haul-col { transition: background 120ms; }
        .haul-col.haul-over { background: ${HAUL.accentBg}; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{ width: 200, borderRight: `1px solid ${HAUL.border}`, padding: 12, display: "flex", flexDirection: "column", gap: 16, background: HAUL.bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: `linear-gradient(135deg, ${HAUL.accent}, #7c3aed)`,
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 12, fontFamily: "'Geist Mono', monospace",
          }}>T</div>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>Taskhauler</div>
          <HaulIcon d={ICON.chevd} size={12} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { i: ICON.inbox, l: "Inbox", n: 3 },
            { i: ICON.kanban, l: "My issues", n: 7, active: false },
            { i: ICON.sparkles, l: "AI suggestions", n: 5 },
          ].map((x) => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", fontSize: 12, color: HAUL.text2, borderRadius: 5, cursor: "pointer" }}>
              <HaulIcon d={x.i} size={13} />
              <span>{x.l}</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, color: HAUL.text3 }}>{x.n}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: HAUL.text3, textTransform: "uppercase", letterSpacing: 0.5, padding: "4px 8px" }}>Boards</div>
          {[
            { l: "Hauler core", active: true, prefix: "HAUL" },
            { l: "Marketing site", prefix: "MKT" },
            { l: "Mobile app",  prefix: "MOB" },
          ].map((b) => (
            <div key={b.l} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", fontSize: 12,
              color: b.active ? HAUL.text : HAUL.text2,
              background: b.active ? HAUL.surface : "transparent",
              border: b.active ? `1px solid ${HAUL.border}` : "1px solid transparent",
              borderRadius: 5, cursor: "pointer",
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: b.active ? HAUL.accent : HAUL.borderHi }} />
              <span style={{ fontWeight: b.active ? 600 : 400 }}>{b.l}</span>
              <span style={{ marginLeft: "auto", fontFamily: "'Geist Mono', monospace", fontSize: 10, color: HAUL.text3 }}>{b.prefix}</span>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: HAUL.text3, textTransform: "uppercase", letterSpacing: 0.5, padding: "4px 8px" }}>Saved views</div>
          {["Urgent + overdue", "Agent work in flight", "This week"].map((v) => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", fontSize: 12, color: HAUL.text2, borderRadius: 5, cursor: "pointer" }}>
              <HaulIcon d={ICON.filter} size={12} />{v}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", color: HAUL.text3, fontSize: 11 }}>
          <window.UserChip id={1} size={20} />
          <span>Mira Chen</span>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ height: 44, borderBottom: `1px solid ${HAUL.border}`, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: HAUL.surface }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Hauler core</span>
          <span style={{ color: HAUL.text3 }}>/</span>
          <span style={{ fontSize: 12, color: HAUL.text2 }}>All issues</span>
          <span style={{ fontSize: 11, color: HAUL.text3, marginLeft: 4 }}>· {filtered.length} of {cards.length}</span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            {/* Presence cluster — who's online */}
            <div title="People here right now" style={{ display: "inline-flex", alignItems: "center", marginRight: 4 }}>
              {window.PRESENCE.filter(p => p.action !== "idle").slice(0, 5).map((p, i) => (
                <span key={p.id} style={{
                  display: "inline-flex", marginLeft: i === 0 ? 0 : -7,
                  position: "relative",
                  boxShadow: `0 0 0 2px ${HAUL.surface}`,
                  borderRadius: 99,
                }}>
                  {window.presenceAvatar(p, 24)}
                  <span style={{
                    position: "absolute", right: -1, bottom: -1, width: 6, height: 6, borderRadius: 99,
                    background: p.color === "editing" ? HAUL.amber : p.color === "agent" ? HAUL.green : HAUL.accent,
                    boxShadow: `0 0 0 1.5px ${HAUL.surface}`,
                    animation: "haul-pulse 1.6s infinite",
                  }} />
                </span>
              ))}
              <span style={{ marginLeft: 6, fontSize: 11, color: HAUL.text2, fontFamily: "'Geist Mono', monospace" }}>
                {window.PRESENCE.filter(p => p.action !== "idle").length} active
              </span>
            </div>
            {/* Theme switcher */}
            <div title="Theme" style={{
              display: "flex", alignItems: "center", gap: 2, height: 28, padding: 2,
              border: `1px solid ${HAUL.border}`, borderRadius: 6, background: HAUL.bg, marginRight: 4,
            }}>
              {Object.keys(HAUL_THEMES).map(k => {
                const T = HAUL_THEMES[k];
                const active = themeName === k;
                return (
                  <button key={k} onClick={() => setThemeName(k)} title={T.name} style={{
                    width: 22, height: 22, borderRadius: 4, border: "none", cursor: "pointer",
                    background: active ? T.swatch : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 120ms",
                    padding: 0,
                  }}>
                    <span style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: T.bg, border: `1.5px solid ${active ? T.surface : T.swatch}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: T.swatch }} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, height: 28, padding: "0 8px",
              border: `1px solid ${HAUL.border}`, borderRadius: 6, background: HAUL.bg, color: HAUL.text3, fontSize: 12, minWidth: 220,
            }}>
              <HaulIcon d={ICON.search} size={12} />Search or jump to…
              <span className="haul-kbd" style={{ marginLeft: "auto" }}>⌘K</span>
            </div>
            <button className="haul-pill" style={{
              height: 28, padding: "0 10px", border: `1px solid ${HAUL.border}`, borderRadius: 6,
              background: HAUL.surface, color: HAUL.text, fontSize: 12, fontWeight: 500, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <HaulIcon d={ICON.plus} size={12} />New issue
              <span className="haul-kbd">C</span>
            </button>
            <button
              onClick={() => setConsoleOpen(o => !o)}
              className="haul-pill"
              title={consoleOpen ? "Hide console" : "Show console"}
              style={{
                height: 28, padding: "0 10px", border: `1px solid ${consoleOpen ? HAUL.accent : HAUL.border}`, borderRadius: 6,
                background: consoleOpen ? HAUL.accentBg : HAUL.surface,
                color: consoleOpen ? HAUL.accent : HAUL.text2,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
              <span style={{
                position: "relative", width: 8, height: 8, borderRadius: 99,
                background: HAUL.green, boxShadow: `0 0 0 2px ${HAUL.green}33`,
                animation: "haul-pulse 1.6s infinite",
              }} />
              Console
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: consoleOpen ? HAUL.accent : HAUL.text3 }}>
                {window.AGENTS.filter(a => a.status === "working").length}/{window.AGENTS.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ height: 40, borderBottom: `1px solid ${HAUL.border}`, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", background: HAUL.surface }}>
          <span style={{ fontSize: 11, color: HAUL.text3, marginRight: 4 }}>Group</span>
          <div style={{ display: "flex", background: HAUL.bg, border: `1px solid ${HAUL.border}`, borderRadius: 6, padding: 2 }}>
            {HAUL_GROUPINGS.map(g => (
              <button key={g.id} onClick={() => setGrouping(g.id)} className="haul-pill" style={{
                height: 22, padding: "0 9px", border: "none", borderRadius: 4,
                background: grouping === g.id ? HAUL.surface : "transparent",
                boxShadow: grouping === g.id ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                color: grouping === g.id ? HAUL.text : HAUL.text2,
                fontSize: 11.5, fontWeight: grouping === g.id ? 600 : 500, cursor: "pointer",
              }}>{g.label}</button>
            ))}
          </div>

          <span style={{ width: 1, height: 18, background: HAUL.border, margin: "0 6px" }} />

          <span style={{ fontSize: 11, color: HAUL.text3, marginRight: 4 }}>Filter</span>
          {[
            { id: "all",    l: "All" },
            { id: "mine",   l: "Mine" },
            { id: "agents", l: "Agents", icon: true },
          ].map(f => (
            <button key={f.id} onClick={() => setFilterAssignee(f.id)} className="haul-pill" style={{
              height: 24, padding: "0 8px", border: `1px solid ${filterAssignee === f.id ? HAUL.accent : HAUL.border}`,
              borderRadius: 5, background: filterAssignee === f.id ? HAUL.accentBg : HAUL.surface,
              color: filterAssignee === f.id ? HAUL.accent : HAUL.text2,
              fontSize: 11.5, fontWeight: 500, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              {f.icon && <span style={{ width: 6, height: 6, borderRadius: 99, background: "#22c55e", boxShadow: "0 0 0 2px #22c55e33" }} />}
              {f.l}
            </button>
          ))}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2, background: HAUL.bg, border: `1px solid ${HAUL.border}`, borderRadius: 6, padding: 2 }}>
            {[
              { id: "kanban",   i: ICON.kanban,   l: "Kanban"   },
              { id: "timeline", i: ICON.timeline, l: "Timeline" },
              { id: "terminal", i: ICON.terminal, l: "Terminal" },
              { id: "dispatch", i: ICON.dispatch, l: "Dispatch" },
            ].map(v => (
              <button key={v.id} onClick={() => setView(v.id)} className="haul-pill" style={{
                height: 22, padding: "0 9px", border: "none", borderRadius: 4,
                background: view === v.id ? HAUL.surface : "transparent",
                boxShadow: view === v.id ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                color: view === v.id ? HAUL.text : HAUL.text2, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11.5, fontWeight: view === v.id ? 600 : 500, fontFamily: HAUL.font,
              }}>
                <HaulIcon d={v.i} size={12} />{v.l}
              </button>
            ))}
          </div>
        </div>

        {/* AI suggestion strip */}
        <div style={{ borderBottom: `1px solid ${HAUL.border}`, background: "linear-gradient(180deg, #f6f5ff, #fafaf9)", padding: "6px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
          <HaulIcon d={ICON.sparkles} size={12} />
          <span style={{ color: HAUL.text2 }}>
            <span style={{ color: HAUL.accent, fontWeight: 600 }}>5 AI suggestions</span> —
            <span style={{ marginLeft: 4 }}>{window.SUGGESTIONS[0].text}</span>
          </span>
          <button style={{ marginLeft: "auto", background: HAUL.accent, color: "#fff", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>Apply</button>
          <button style={{ background: "transparent", color: HAUL.text2, fontSize: 11, fontWeight: 500, border: "none", padding: "3px 6px", cursor: "pointer" }}>Dismiss</button>
        </div>

        {/* View content swap */}
        {view === "kanban" && (
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "12px 10px", display: "flex", gap: 4 }}>
          {groups.map((g) => (
            <div key={g.key}
              className={`haul-col ${dragOver === g.key ? "haul-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(g.key); }}
              onDragLeave={() => setDragOver(d => d === g.key ? null : d)}
              onDrop={(e) => grouping === "col" && onDrop(e, g.key)}
              style={{
                flex: "1 1 0", minWidth: 200, display: "flex", flexDirection: "column",
                gap: 8, borderRadius: 8, padding: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{g.label}</span>
                <span style={{ fontSize: 11, color: HAUL.text3 }}>{g.cards.length}</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", gap: 2 }}>
                  <button className="haul-pill" style={{ width: 20, height: 20, border: "none", borderRadius: 4, background: "transparent", color: HAUL.text3, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <HaulIcon d={ICON.plus} size={12} />
                  </button>
                  <button className="haul-pill" style={{ width: 20, height: 20, border: "none", borderRadius: 4, background: "transparent", color: HAUL.text3, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <HaulIcon d={ICON.more} size={12} />
                  </button>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 80 }}>
                {g.cards.map(c => (
                  <HaulCard key={c.id} card={c}
                    selected={selected === c.id}
                    onOpen={(id) => setSelected(id === selected ? null : id)}
                    onDragStart={onDragStart} />
                ))}
                {g.cards.length === 0 && (
                  <div style={{ border: `1px dashed ${HAUL.border}`, borderRadius: 6, padding: "16px 8px", textAlign: "center", fontSize: 11, color: HAUL.text3 }}>
                    Drop or <span style={{ color: HAUL.accent, fontWeight: 600 }}>+ add</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {view === "timeline" && (
          <window.HaulTimelineView T={HAUL} cards={cards} setCards={setCards} selected={selected} onOpen={(id) => setSelected(id === selected ? null : id)} />
        )}

        {view === "terminal" && (
          <window.HaulTerminalView T={HAUL} cards={cards} selected={selected} onOpen={(id) => setSelected(id === selected ? null : id)} />
        )}

        {view === "dispatch" && (
          <window.HaulDispatchView
            T={HAUL} cards={cards} selected={selected}
            onOpen={(id) => setSelected(id === selected ? null : id)}
            onDragStart={onDragStart} dragOver={dragOver} setDragOver={setDragOver} onDrop={onDrop}
            renderCard={(c) => (
              <HaulCard key={c.id} card={c}
                selected={selected === c.id}
                onOpen={(id) => setSelected(id === selected ? null : id)}
                onDragStart={onDragStart} />
            )}
          />
        )}
      </div>

      {/* ── Right rail: detail OR console (tabbed) ─────────────────────── */}
      {(consoleOpen || selCard) && (
        <aside style={{
          width: 340, borderLeft: `1px solid ${HAUL.border}`, background: HAUL.surface,
          display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
        }}>
          {selCard ? (
            <>
              {consoleOpen && (
                <button onClick={() => setSelected(null)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderBottom: `1px solid ${HAUL.border}`,
                  background: HAUL.bg, color: HAUL.accent,
                  border: "none", borderBottomWidth: 1, borderBottomStyle: "solid",
                  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: HAUL.font, textAlign: "left",
                }}>
                  ← Back to console
                </button>
              )}
              <HaulDetail card={selCard} onClose={() => setSelected(null)} onFocus={() => setFocusedId(selCard.id)} />
            </>
          ) : (
            <>
              <window.RailTabs T={HAUL} tab={railTab} setTab={setRailTab} />
              {railTab === "console"  && <window.HaulConsoleRail  T={HAUL} onOpenCard={setSelected} />}
              {railTab === "activity" && <window.HaulActivityRail T={HAUL} onOpenCard={setSelected} />}
              {railTab === "plans"    && <window.HaulPlansRail    T={HAUL} />}
            </>
          )}
        </aside>
      )}

      {focusedId && (
        <window.FocusModal
          T={HAUL}
          card={cards.find(c => c.id === focusedId)}
          onClose={() => setFocusedId(null)}
        />
      )}
    </div>
  );
}

function HaulDetail({ card, onClose, onFocus }) {
  const ep = card.epic ? window.getEpic(card.epic) : null;
  const due = window.fmtDue(card.due);
  const cardActivity = window.ACTIVITY.filter(a => a.card === card.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 44, padding: "0 14px", borderBottom: `1px solid ${HAUL.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: HAUL.text3 }}>HAUL-{card.number}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 4 }}>
          {onFocus && (
            <button onClick={onFocus} title="Focus mode (F)" style={{
              height: 24, padding: "0 8px", border: `1px solid ${HAUL.border}`, borderRadius: 4, background: HAUL.surface,
              color: HAUL.text2, fontSize: 11, fontWeight: 500, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <HaulIcon d={ICON.focus} size={11} /> Focus
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, color: HAUL.text3, marginLeft: 2, padding: "0 4px", border: `1px solid ${HAUL.border}`, borderRadius: 2 }}>F</span>
            </button>
          )}
          <button onClick={onClose} style={{ height: 24, padding: "0 8px", border: `1px solid ${HAUL.border}`, borderRadius: 4, background: HAUL.bg, color: HAUL.text2, fontSize: 11, cursor: "pointer" }}>Close</button>
        </span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.35, letterSpacing: -0.2 }}>{card.title}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 8, columnGap: 12, fontSize: 12 }}>
          <span style={{ color: HAUL.text3 }}>Status</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: HAUL.accent }} />{window.getCol(card.col).name}
          </span>
          <span style={{ color: HAUL.text3 }}>Priority</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <HaulPriorityDot p={card.priority} />{window.PRIORITIES[card.priority].label}
          </span>
          <span style={{ color: HAUL.text3 }}>Assignee</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {card.assignee ? <>
              <window.AssigneeChip assignee={card.assignee} size={18} />
              <span>{window.getAssigneeName(card.assignee)}</span>
              {card.assignee.agent && window.getAgent(card.assignee.agent)?.status === "working" && (
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "#22c55e" }} />WORKING
                </span>
              )}
            </> : <span style={{ color: HAUL.text3 }}>Unassigned</span>}
          </span>
          <span style={{ color: HAUL.text3 }}>Epic</span>
          <span>{ep ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: ep.color }} />{ep.name}
          </span> : <span style={{ color: HAUL.text3 }}>—</span>}</span>
          <span style={{ color: HAUL.text3 }}>Due</span>
          <span style={{ color: due?.overdue ? HAUL.red : HAUL.text }}>{due?.txt || "—"}</span>
          <span style={{ color: HAUL.text3 }}>Estimate</span>
          <span style={{ fontFamily: "'Geist Mono', monospace" }}>{card.estimate ?? 0} pt</span>
          <span style={{ color: HAUL.text3 }}>Labels</span>
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(card.labels || "").split(",").filter(Boolean).map(l => (
              <span key={l} style={{ fontSize: 10.5, padding: "1px 6px", border: `1px solid ${HAUL.border}`, borderRadius: 3, color: HAUL.text2 }}>{l.trim()}</span>
            ))}
          </span>
        </div>

        {cardActivity.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: HAUL.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Agent activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cardActivity.map(a => (
                <div key={a.id} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <window.AgentChip name={a.agent} size={20} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: HAUL.text }}>{a.text}</span>
                    <div style={{ color: HAUL.text3, fontSize: 10.5, marginTop: 2 }}>{window.fmtAgo(a.at)} ago · @{a.agent}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 11, color: HAUL.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>AI suggested</div>
          <button style={{
            display: "flex", alignItems: "flex-start", gap: 8, width: "100%", textAlign: "left",
            padding: 10, border: `1px solid ${HAUL.border}`, borderRadius: 6, background: HAUL.bg, cursor: "pointer", fontSize: 12,
          }}>
            <HaulIcon d={ICON.sparkles} size={14} />
            <span><b>Move to In Review</b> — PR merged, tests green</span>
            <span style={{ marginLeft: "auto", color: HAUL.accent, fontWeight: 600, fontSize: 11 }}>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
}

window.Haul = Haul;
