// concept-haul-views.jsx — alternate rendering styles for the HAUL board.
// Each view is theme-aware (takes T = palette), self-contained, and shares
// the same cards + interactions API with the parent Haul shell.

function VIcon({ d, size = 14, stroke = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const VICON = {
  check:   "M5 13l4 4L19 7",
  x:       "M6 6l12 12M18 6L6 18",
  truck:   "M3 17h10V5H3zM13 8h4l4 4v5h-8M7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  arrow:   "M5 12h14M13 5l7 7-7 7",
  bolt:    "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  flame:   "M12 22a7 7 0 0 0 7-7c0-3-2.5-5.5-3-7-1.5-3.5-4-5-4-5s-1 3-3 5-4 4-4 7a7 7 0 0 0 7 7z",
  expand:  "M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6",
  plus:    "M12 5v14M5 12h14",
};

// ════════════════════════════════════════════════════════════════════════════
// TIMELINE VIEW — lanes by hauler, cards over time
// ════════════════════════════════════════════════════════════════════════════

const TL_DAY_W = 64;
const TL_ROW_H = 32;
const TL_LANE_PAD = 8;
const TL_LANE_LABEL_W = 200;
const TL_START = -2;
const TL_END = 14;

function tlDays() { return TL_END - TL_START + 1; }
function tlDate(off) { return new Date(window.NOW + off * 86400000); }
function tlX(ts) {
  const days = (ts - window.NOW) / 86400000;
  return (days - TL_START) * TL_DAY_W;
}
function tlCardX(c) { return c.due ? Math.max(0, Math.min(tlDays() * TL_DAY_W, tlX(c.due))) : tlX(window.NOW); }
function tlCardW(c) { return Math.max(80, Math.min(200, (c.estimate || 3) * 14)); }

function tlPackRows(cards) {
  const sorted = [...cards].sort((a, b) => tlCardX(a) - tlCardW(a) - (tlCardX(b) - tlCardW(b)));
  const rows = []; // last end-x per row
  const placement = new Map();
  for (const c of sorted) {
    const end = tlCardX(c);
    const start = end - tlCardW(c);
    let r = 0;
    while (r < rows.length && rows[r] > start - 2) r++;
    rows[r] = end;
    placement.set(c.id, r);
  }
  return { placement, rowCount: Math.max(1, rows.length) };
}

function HaulTimelineView({ T, cards, setCards, selected, onOpen }) {
  // Lanes = users with cards + all agents + unassigned
  const lanes = React.useMemo(() => {
    const ls = [];
    window.AGENTS.forEach(a => ls.push({ kind: "agent", id: `a:${a.name}`, data: a }));
    window.USERS
      .filter(u => cards.some(c => c.assignee?.user === u.id))
      .forEach(u => ls.push({ kind: "user", id: `u:${u.id}`, data: u }));
    ls.push({ kind: "none", id: "none" });
    return ls;
  }, [cards]);

  const laneFor = (c) => c.assignee?.agent ? `a:${c.assignee.agent}` : c.assignee?.user ? `u:${c.assignee.user}` : "none";

  const laneData = React.useMemo(() => {
    const m = new Map();
    for (const lane of lanes) {
      const inLane = cards.filter(c => laneFor(c) === lane.id && c.col !== "c4");
      m.set(lane.id, { cards: inLane, ...tlPackRows(inLane) });
    }
    return m;
  }, [lanes, cards]);

  const days = Array.from({ length: tlDays() }, (_, i) => TL_START + i);
  const todayX = tlX(window.NOW);
  const trackW = days.length * TL_DAY_W;

  const onTrackDrop = (e, laneId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const offset = Math.round(x / TL_DAY_W) + TL_START;
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updates = { due: window.NOW + offset * 86400000 };
      if (laneId === "none") updates.assignee = null;
      else if (laneId.startsWith("a:")) updates.assignee = { agent: laneId.slice(2) };
      else updates.assignee = { user: Number(laneId.slice(2)) };
      return { ...c, ...updates };
    }));
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg }}>
      {/* Sticky day header */}
      <div style={{ display: "flex", flexShrink: 0, borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{
          width: TL_LANE_LABEL_W, padding: "8px 14px", fontSize: 10, fontWeight: 700,
          color: T.text3, letterSpacing: 1.5, flexShrink: 0,
          borderRight: `1px solid ${T.border}`, display: "flex", alignItems: "center",
          fontFamily: T.mono,
        }}>HAULER · {lanes.length}</div>
        <div style={{ flex: 1, overflowX: "auto" }}>
          <div style={{ display: "flex", width: trackW, height: 42 }}>
            {days.map(off => {
              const d = tlDate(off);
              const isToday = off === 0;
              const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
              return (
                <div key={off} style={{
                  width: TL_DAY_W, padding: "5px 8px", borderRight: `1px solid ${T.border}`,
                  background: isToday ? T.accentBg : weekend ? T.bg : "transparent",
                }}>
                  <div style={{ fontSize: 9.5, color: isToday ? T.accent : T.text3, fontWeight: 700, letterSpacing: 1, fontFamily: T.mono }}>
                    {d.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? T.text : T.text2 }}>{d.getUTCDate()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lanes (scrolls both axes) */}
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {lanes.map(lane => {
          const { cards: inLane, placement, rowCount } = laneData.get(lane.id);
          const laneH = rowCount * TL_ROW_H + TL_LANE_PAD * 2;
          const sumPts = inLane.reduce((s, c) => s + (c.estimate || 0), 0);
          return (
            <TLLaneRow key={lane.id} T={T} lane={lane} laneH={laneH} sumPts={sumPts}
              cards={inLane} placement={placement} trackW={trackW} days={days}
              todayX={todayX} selected={selected} onOpen={onOpen}
              onDrop={(e) => onTrackDrop(e, lane.id)}
            />
          );
        })}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}

function TLLaneRow({ T, lane, laneH, sumPts, cards, placement, trackW, days, todayX, selected, onOpen, onDrop }) {
  // Label cell
  let chip, name, sub, badge;
  if (lane.kind === "agent") {
    chip = <window.AgentChip name={lane.data.name} size={26} />;
    name = `@${lane.data.name}`;
    sub = `${lane.data.plugin} · agent`;
    if (lane.data.status === "working") badge = <span style={{ width: 7, height: 7, borderRadius: 99, background: T.green, animation: "haul-pulse 1.6s infinite", boxShadow: `0 0 0 2px ${T.green}33` }} />;
  } else if (lane.kind === "user") {
    chip = <window.UserChip id={lane.data.id} size={26} />;
    name = lane.data.name;
    sub = `@${lane.data.handle}`;
  } else {
    chip = <div style={{ width: 26, height: 26, borderRadius: 99, border: `1.5px dashed ${T.borderHi}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 12 }}>?</div>;
    name = "Unassigned";
    sub = "needs hauler";
  }

  const cap = 21;
  const pct = Math.min(1, sumPts / cap);
  const loadColor = sumPts > cap ? T.red : sumPts > cap * 0.7 ? T.amber : T.green;

  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, minHeight: Math.max(58, laneH), background: lane.kind === "agent" ? T.accentBg : T.surface }}>
      <div style={{ width: TL_LANE_LABEL_W, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, borderRight: `1px solid ${T.border}`, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {chip}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 12.5, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: lane.kind === "agent" ? T.mono : T.font }}>{name}</span>
            <span style={{ fontSize: 10.5, color: T.text3 }}>{sub}</span>
          </div>
          {badge}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: T.text3, fontFamily: T.mono, minWidth: 38 }}>{cards.length}t · {sumPts}pt</span>
          <span style={{ flex: 1, height: 3, background: T.bg, borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
            <span style={{ display: "block", height: "100%", width: `${pct * 100}%`, background: loadColor }} />
          </span>
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        style={{ position: "relative", width: trackW, minHeight: Math.max(58, laneH), flexShrink: 0 }}
      >
        {/* day stripes */}
        {days.map((off, i) => {
          const d = tlDate(off);
          const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
          const isToday = off === 0;
          return (
            <div key={off} style={{
              position: "absolute", left: i * TL_DAY_W, top: 0, bottom: 0, width: TL_DAY_W,
              background: isToday ? T.accentBg : weekend ? T.bg : "transparent",
              borderRight: `1px solid ${T.border}`,
            }} />
          );
        })}
        {/* today line */}
        <div style={{ position: "absolute", left: todayX, top: 0, bottom: 0, width: 2, background: T.amber, boxShadow: `0 0 0 1px ${T.amber}33`, pointerEvents: "none" }} />
        {cards.length === 0 && (
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.text3, fontStyle: "italic" }}>
            no haul scheduled — drop a card to assign
          </div>
        )}
        {cards.map(c => (
          <TLBar key={c.id} T={T} card={c}
            row={placement.get(c.id) ?? 0}
            selected={selected === c.id}
            onOpen={() => onOpen(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TLBar({ T, card, row, selected, onOpen }) {
  const ep = card.epic ? window.getEpic(card.epic) : null;
  const due = window.fmtDue(card.due);
  const a = card.assignee?.agent ? window.getAgent(card.assignee.agent) : null;
  const working = a?.status === "working";
  const w = tlCardW(card);
  const right = tlCardX(card);
  const left = Math.max(2, right - w);
  const color = ep?.color || T.text2;
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", card.id)}
      onClick={onOpen}
      style={{
        position: "absolute", left, width: w,
        top: TL_LANE_PAD + row * TL_ROW_H, height: TL_ROW_H - 4,
        background: T.surface,
        border: `1.5px solid ${selected ? T.accent : due?.overdue ? T.red : color}`,
        borderRadius: 5, padding: "3px 6px 3px 9px",
        display: "flex", alignItems: "center", gap: 6,
        cursor: "grab", overflow: "hidden",
        boxShadow: selected ? `0 0 0 3px ${T.accent}33, 0 2px 6px rgba(0,0,0,0.08)` : "0 1px 2px rgba(0,0,0,0.05)",
        fontFamily: T.font,
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color }} />
      {working && <span style={{ width: 5, height: 5, borderRadius: 99, background: T.green, flexShrink: 0, animation: "haul-pulse 1.6s infinite" }} />}
      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, flexShrink: 0 }}>{card.number}</span>
      <span style={{ fontSize: 11.5, fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{card.title}</span>
      {card.priority === "urgent" && (
        <span style={{ fontSize: 9, fontWeight: 700, color: T.red, padding: "0 4px", background: T.surface, border: `1px solid ${T.red}`, borderRadius: 3, flexShrink: 0 }}>P0</span>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TERMINAL VIEW — monospace table, ASCII chrome
// ════════════════════════════════════════════════════════════════════════════

function HaulTerminalView({ T, cards, selected, onOpen }) {
  const sorted = React.useMemo(() => {
    const pOrder = { urgent: 0, high: 1, medium: 2, low: 3, "": 4 };
    const cOrder = { c2: 0, c1: 1, c3: 2, c4: 3 };
    return [...cards].sort((a, b) => {
      if (cOrder[a.col] !== cOrder[b.col]) return cOrder[a.col] - cOrder[b.col];
      if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
      return (a.due ?? Infinity) - (b.due ?? Infinity);
    });
  }, [cards]);

  // Group by column
  const groups = React.useMemo(() => {
    return window.COLUMNS.map(col => ({
      col,
      items: sorted.filter(c => c.col === col.id),
    }));
  }, [sorted]);

  return (
    <div style={{
      flex: 1, minHeight: 0, overflow: "auto",
      background: T.bg, color: T.text,
      fontFamily: T.mono, fontSize: 12, lineHeight: 1.55,
      padding: "12px 14px",
    }}>
      <div style={{ color: T.text3, marginBottom: 8 }}>
        <span style={{ color: T.green }}>$</span> board --list --group=column --sort=priority,due
      </div>

      {groups.map(g => (
        <div key={g.col.id} style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            color: T.accent, fontWeight: 700, marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden",
          }}>
            <span style={{ flexShrink: 0 }}>┌── {g.col.name.toUpperCase()}</span>
            <span style={{ color: T.text3, flexShrink: 0 }}>[{String(g.items.length).padStart(2, "0")}]</span>
            <span style={{ flex: 1, borderBottom: `1px dashed ${T.border}`, height: 1 }} />
          </div>
          {g.items.length === 0 && (
            <div style={{ color: T.text3, paddingLeft: 4 }}>│ <span style={{ fontStyle: "italic" }}>// empty</span></div>
          )}
          {g.items.map(c => <TermRow key={c.id} T={T} card={c} selected={selected === c.id} onOpen={onOpen} />)}
        </div>
      ))}

      <div style={{ marginTop: 16, color: T.text3, fontSize: 11 }}>
        <span style={{ color: T.green }}>$</span> _<span style={{ display: "inline-block", width: 8, height: 14, background: T.accent, marginLeft: 2, animation: "haul-blink 1s steps(1,end) infinite", verticalAlign: "middle" }} />
      </div>
    </div>
  );
}

function TermRow({ T, card, selected, onOpen }) {
  const due = window.fmtDue(card.due);
  const a = card.assignee?.agent ? window.getAgent(card.assignee.agent) : null;
  const working = a?.status === "working";
  const pColor = card.priority === "urgent" ? T.red : card.priority === "high" ? T.amber : card.priority === "medium" ? T.accent : T.text3;
  const pTag = card.priority ? window.PRIORITIES[card.priority].short : "--";
  return (
    <div onClick={() => onOpen(card.id)} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "2px 4px 2px 8px",
      background: selected ? T.accentBg : "transparent",
      color: T.text, cursor: "pointer",
      borderLeft: `2px solid ${selected ? T.accent : "transparent"}`,
      whiteSpace: "nowrap", overflow: "hidden",
    }}>
      <span style={{ color: T.text3, flexShrink: 0 }}>│</span>
      <span style={{ color: T.text2, flexShrink: 0, width: 70 }}>HAUL-{card.number}</span>
      <span style={{ color: pColor, fontWeight: 700, flexShrink: 0, width: 28 }}>[{pTag}]</span>
      <span style={{ color: card.type === "bug" ? T.red : T.text3, flexShrink: 0, width: 34, fontWeight: card.type === "bug" ? 700 : 400 }}>
        {card.type === "bug" ? "[BUG]" : "[TSK]"}
      </span>
      <span style={{ color: T.text, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title}</span>
      {card.assignee && (
        <span style={{ color: card.assignee.agent ? T.green : T.accent, flexShrink: 0, fontWeight: 600 }}>
          {card.assignee.agent ? `@${card.assignee.agent}` : `~${window.getUser(card.assignee.user).handle}`}
        </span>
      )}
      {working && <span style={{ color: T.green, flexShrink: 0, fontSize: 9 }}>● live</span>}
      <span style={{ color: T.text3, flexShrink: 0, width: 36, textAlign: "right" }}>{card.estimate}pt</span>
      <span style={{ color: due?.overdue ? T.red : due?.soon ? T.amber : T.text3, flexShrink: 0, width: 70, textAlign: "right", fontWeight: due?.overdue ? 700 : 400 }}>
        {due ? (due.overdue ? "!" : "~") + due.txt : "—"}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DISPATCH VIEW — fleet bar + prioritized board sections
// ════════════════════════════════════════════════════════════════════════════

function HaulDispatchView({ T, cards, selected, onOpen, onDragStart, dragOver, setDragOver, onDrop, renderCard }) {
  const overdue = cards.filter(c => window.isOverdue(c.due) && c.col !== "c4");
  const inFlight = cards.filter(c => c.col === "c2");
  const ready = cards.filter(c => c.col === "c3");
  const queue = cards.filter(c => c.col === "c1");

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: T.bg, display: "flex", flexDirection: "column", gap: 12, padding: "12px 14px" }}>
      {/* Fleet bar */}
      <div style={{
        display: "flex", gap: 8, padding: "10px 12px",
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
        overflowX: "auto", flexShrink: 0,
      }}>
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1, paddingRight: 10, borderRight: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1.5, color: T.text3, fontFamily: T.mono }}>FLEET</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: T.mono, letterSpacing: -0.5 }}>{window.AGENTS.length}</span>
        </div>
        {window.AGENTS.map(a => <DispatchAgentTile key={a.name} T={T} agent={a} cards={cards} />)}
      </div>

      {/* 4 prioritized lanes (horizontal) */}
      <div style={{ display: "flex", gap: 6, flex: 1, minHeight: 0 }}>
        {[
          { id: "hot",      l: "Hot",        cards: overdue, accent: T.red,   sub: "overdue + urgent" },
          { id: "c2",       l: "In Flight",  cards: inFlight, accent: T.accent, sub: "being worked" },
          { id: "c3",       l: "Ready",      cards: ready,    accent: T.green, sub: "in review" },
          { id: "c1",       l: "Queue",      cards: queue,    accent: T.text3, sub: "backlog" },
        ].map(sec => (
          <div key={sec.id}
            onDragOver={(e) => { if (sec.id.startsWith("c")) { e.preventDefault(); setDragOver(sec.id); } }}
            onDragLeave={() => setDragOver(d => d === sec.id ? null : d)}
            onDrop={(e) => sec.id.startsWith("c") && onDrop(e, sec.id)}
            style={{
              flex: "1 1 0", minWidth: 180,
              display: "flex", flexDirection: "column", gap: 6,
              background: dragOver === sec.id ? T.accentBg : "transparent",
              borderRadius: 8, padding: 6, transition: "background 120ms",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: sec.accent }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{sec.l}</span>
              <span style={{ fontSize: 10.5, color: T.text3, fontFamily: T.mono }}>{sec.cards.length}</span>
              <span style={{ marginLeft: 4, fontSize: 10, color: T.text3 }}>· {sec.sub}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "auto", flex: 1 }}>
              {sec.cards.map(c => renderCard(c))}
              {sec.cards.length === 0 && (
                <div style={{ padding: "16px 8px", textAlign: "center", border: `1px dashed ${T.border}`, borderRadius: 6, color: T.text3, fontSize: 11 }}>—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DispatchAgentTile({ T, agent, cards }) {
  const onCard = cards.find(c => c.assignee?.agent === agent.name && c.col === "c2");
  const working = agent.status === "working";
  return (
    <div style={{
      flex: "0 0 220px",
      background: working ? T.accentBg : T.bg,
      border: `1px solid ${working ? T.accent + "55" : T.border}`,
      borderRadius: 7, padding: 9,
      display: "flex", flexDirection: "column", gap: 5,
      position: "relative", overflow: "hidden",
    }}>
      {working && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.accent }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <window.AgentChip name={agent.name} size={22} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 11.5, color: T.text }}>@{agent.name}</div>
          <div style={{ fontSize: 9.5, color: T.text3, fontFamily: T.font }}>{agent.plugin}</div>
        </div>
        {working ? (
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: T.accent, fontFamily: T.mono }}>● LIVE</span>
        ) : (
          <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, fontFamily: T.mono }}>IDLE</span>
        )}
      </div>
      <div style={{ fontSize: 10.5, color: T.text2, lineHeight: 1.3, height: 26, overflow: "hidden" }}>
        {onCard ? <><span style={{ fontFamily: T.mono, color: T.text3 }}>HAUL-{onCard.number}</span> {onCard.title}</>
                : <span style={{ color: T.text3 }}>{agent.desc}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 99, background: T.bg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${agent.load * 100}%`, background: working ? T.accent : T.text3 }} />
        </div>
        <span style={{ fontSize: 9, color: T.text3, fontFamily: T.mono, minWidth: 28, textAlign: "right" }}>{Math.round(agent.load * 100)}%</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FOCUS MODAL — fullscreen single-card deep work
// ════════════════════════════════════════════════════════════════════════════

const FOCUS_SUBTASKS = {
  k7: [
    { id: 1, t: "Spike: profile current scroll perf @ 10k cards",            done: true  },
    { id: 2, t: "Implement windowed virtualization with overscan = 8",        done: true  },
    { id: 3, t: "Preserve drag-drop hit-targets across virtualized rows",     done: true  },
    { id: 4, t: "Bench: confirm 4× scroll fps target on M1 + Win laptops",    done: false },
    { id: 5, t: "Write migration note + flip behind feature flag",            done: false },
  ],
  k6: [
    { id: 1, t: "Event schema draft + ADR",                                   done: true  },
    { id: 2, t: "Append-only log adapter",                                    done: true  },
    { id: 3, t: "Replay-from-snapshot rebuild path",                          done: false },
    { id: 4, t: "Migrate 3 hottest write paths first",                        done: false },
  ],
};

function FocusModal({ T, card, onClose, onNext }) {
  const [subtasks, setSubtasks] = React.useState(FOCUS_SUBTASKS[card.id] || [
    { id: 1, t: "Decompose this card into next steps", done: false },
  ]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ep = card.epic ? window.getEpic(card.epic) : null;
  const due = window.fmtDue(card.due);
  const a = card.assignee?.agent ? window.getAgent(card.assignee.agent) : null;
  const working = a?.status === "working";
  const doneN = subtasks.filter(s => s.done).length;
  const pct = subtasks.length ? doneN / subtasks.length : 0;

  const toggle = (id) => setSubtasks(subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: T.bg + "f0", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "haul-fade-in 200ms",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(720px, 92vw)", maxHeight: "92vh",
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: "32px 36px 28px",
        display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
        color: T.text, fontFamily: T.font, overflow: "auto",
      }}>
        {/* Meta strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.text3 }}>
          <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.accent }}>HAUL-{card.number}</span>
          {card.type === "bug" && <span style={{ fontSize: 10, fontWeight: 700, color: T.red, padding: "1px 6px", background: T.red + "22", borderRadius: 3 }}>BUG</span>}
          {ep && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: ep.color }} />{ep.name}
            </span>
          )}
          <span>·</span>
          <span>{window.PRIORITIES[card.priority]?.label} priority</span>
          {due && <><span>·</span><span style={{ color: due.overdue ? T.red : T.text3, fontWeight: due.overdue ? 700 : 400 }}>due {due.txt}</span></>}
          <button onClick={onClose} style={{ marginLeft: "auto", height: 24, padding: "0 8px", border: `1px solid ${T.border}`, borderRadius: 5, background: T.bg, color: T.text2, fontSize: 11, cursor: "pointer", fontFamily: T.font }}>
            Esc · close
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.5, color: T.text }}>
          {card.title}
        </h1>

        {/* Assignee + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {card.assignee && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <window.AssigneeChip assignee={card.assignee} size={28} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{window.getAssigneeName(card.assignee)}</div>
                {working ? (
                  <div style={{ fontSize: 10.5, color: T.green, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: T.green, animation: "haul-pulse 1.4s infinite" }} />
                    working alongside you · {a.plugin}
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{a ? `${a.plugin} · idle` : "human"}</div>
                )}
              </div>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button style={{ height: 32, padding: "0 14px", border: "none", borderRadius: 7, background: T.accent, color: T.accentFg, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: T.font, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <VIcon d={VICON.check} size={13} stroke={2.4} />Mark shipped
            </button>
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 14, lineHeight: 1.55, color: T.text2 }}>
          Existing list rendering breaks past <b style={{ color: T.text }}>~2k cards</b>. The new virtualization needs to preserve drag-drop hit-targets and the keyboard cursor across row recycle, and not regress the agent activity ribbon on each card.
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: T.text, lineHeight: 1, fontFamily: T.mono }}>
            {doneN}<span style={{ color: T.text3 }}>/{subtasks.length}</span>
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: T.text3, marginBottom: 4, fontWeight: 600, letterSpacing: 0.5 }}>SUBTASKS COMPLETE</div>
            <div style={{ height: 5, background: T.surface, borderRadius: 99, overflow: "hidden", border: `1px solid ${T.border}` }}>
              <div style={{ height: "100%", width: `${pct * 100}%`, background: T.accent, transition: "width 240ms" }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: T.text3, fontFamily: T.mono }}>{Math.round(pct * 100)}%</span>
        </div>

        {/* Subtasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {subtasks.map(s => (
            <button key={s.id} onClick={() => toggle(s.id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 8px",
                border: "none", background: "transparent", textAlign: "left", cursor: "pointer", borderRadius: 6, fontFamily: T.font,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                flexShrink: 0, marginTop: 1,
                width: 18, height: 18, borderRadius: 5,
                border: `1.5px solid ${s.done ? T.accent : T.borderHi}`,
                background: s.done ? T.accent : T.surface,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.accentFg, transition: "all 160ms",
              }}>
                {s.done && <VIcon d={VICON.check} size={12} stroke={2.6} />}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.4, color: s.done ? T.text3 : T.text, textDecoration: s.done ? "line-through" : "none" }}>{s.t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HaulTimelineView, HaulTerminalView, HaulDispatchView, FocusModal });
