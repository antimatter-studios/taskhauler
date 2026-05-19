// concept-haul-rails.jsx — Right-rail content for HAUL's "Console" mode.
// Three swappable panels exploring different ways to surface live work:
//   - HaulConsoleRail   : agents online, what each is doing right now
//   - HaulActivityRail  : git-log style chronological stream
//   - HaulPlansRail     : proposals queue (agent + human) for approval
//
// All accept a theme T as a prop so they respect HAUL's Day/Mono/Paper skin.

function RIcon({ d, size = 14, stroke = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const RICON = {
  chev:    "M9 6l6 6-6 6",
  chevd:   "M6 9l6 6 6-6",
  more:    "M5 12h.01M12 12h.01M19 12h.01",
  check:   "M5 13l4 4L19 7",
  x:       "M6 6l12 12M18 6L6 18",
  spark:   "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
  bolt:    "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  ping:    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 3v3M12 18v3M3 12h3M18 12h3",
  arrow:   "M5 12h14M13 5l7 7-7 7",
  msg:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  ship:    "M3 13l3 8h12l3-8M3 13l3-8h12l3 8M3 13h18M12 5v8",
  plus:    "M12 5v14M5 12h14",
  edit:    "M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  filter:  "M3 5h18l-7 9v6l-4-2v-4z",
  agent:   "M12 1l3 7h7l-6 4 2 8-6-5-6 5 2-8L0 8h7z",
};

// ── HEADER FOR ALL RAILS ───────────────────────────────────────────────────

function RailTabs({ T, tab, setTab }) {
  const tabs = [
    { id: "console",  l: "Console",  badge: window.AGENTS.filter(a => a.status === "working").length },
    { id: "activity", l: "Activity", badge: 14 },
    { id: "plans",    l: "Plans",    badge: window.PROPOSALS.filter(p => p.status === "pending").length },
  ];
  return (
    <div style={{
      display: "flex", padding: "8px 10px", gap: 4, borderBottom: `1px solid ${T.border}`,
      background: T.surface,
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, height: 28, padding: "0 8px", borderRadius: 5, border: "none",
            background: active ? T.bg : "transparent",
            color: active ? T.text : T.text2,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            boxShadow: active ? `inset 0 0 0 1px ${T.borderHi}` : "none",
            fontFamily: T.font,
            transition: "background 120ms",
          }}>
            {t.l}
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding: "1px 5px",
              background: active ? T.accent : T.border,
              color: active ? T.accentFg : T.text2,
              borderRadius: 99, fontFamily: T.mono, minWidth: 16, textAlign: "center",
            }}>{t.badge}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── CONSOLE RAIL : live presence — users + agents working together ────────

function HaulConsoleRail({ T, onOpenCard }) {
  const [expanded, setExpanded] = React.useState(new Set(["pr6"])); // builder expanded by default
  const [transcriptIdx, setTranscriptIdx] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTranscriptIdx(prev => {
        const next = { ...prev };
        for (const a of window.AGENTS) {
          if (a.status !== "working") continue;
          const lines = window.TRANSCRIPTS[a.name] || [];
          if (lines.length === 0) continue;
          next[a.name] = ((prev[a.name] ?? 0) + 1) % lines.length;
        }
        return next;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const toggle = (id) => setExpanded(s => {
    const ns = new Set(s);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    return ns;
  });

  const active = window.PRESENCE.filter(p => p.action !== "idle");
  const idle   = window.PRESENCE.filter(p => p.action === "idle");

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      <SectionHead T={T} label={`${active.length} active now`} sub="on this board" />
      {active.map(p => (
        <PresenceRow key={p.id} T={T} pres={p}
          expanded={expanded.has(p.id)} onToggle={() => toggle(p.id)}
          tIdx={p.kind === "agent" ? (transcriptIdx[p.name] ?? 0) : 0}
          onOpenCard={onOpenCard}
        />
      ))}
      <SectionHead T={T} label={`${idle.length} idle`} sub="available · last seen recently" />
      {idle.map(p => (
        <PresenceRow key={p.id} T={T} pres={p}
          expanded={expanded.has(p.id)} onToggle={() => toggle(p.id)}
          tIdx={0} onOpenCard={onOpenCard}
        />
      ))}

      <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <button style={{
          width: "100%", height: 30, padding: "0 10px",
          background: "transparent", color: T.text2, fontFamily: T.font,
          border: `1px dashed ${T.borderHi}`, borderRadius: 5,
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <RIcon d={RICON.plus} size={12} /> Invite people or hauler agents
        </button>
      </div>
    </div>
  );
}

function PresenceRow({ T, pres, expanded, onToggle, tIdx, onOpenCard }) {
  const isAgent = pres.kind === "agent";
  const active = pres.action !== "idle";
  const agent = isAgent ? window.getAgent(pres.name) : null;
  const transcript = isAgent ? (window.TRANSCRIPTS[pres.name] || []) : [];
  const currentStep = isAgent && active ? (transcript[tIdx] || agent?.step) : null;
  const card = pres.card ? window.getCard(pres.card) : null;
  const loadColor = agent && agent.load > 0.7 ? T.amber : agent && agent.load > 0.3 ? T.accent : T.green;

  // Action verb display
  const verb = {
    viewing:    { c: T.accent, l: "viewing"    },
    editing:    { c: T.amber,  l: "editing"    },
    commenting: { c: T.amber,  l: "commenting" },
    working:    { c: T.green,  l: "working on" },
    scanning:   { c: T.green,  l: "scanning"   },
    idle:       { c: T.text3,  l: "idle"       },
  }[pres.action] || { c: T.text3, l: pres.action };

  // Dot color = action category
  const dot = active
    ? (pres.color === "editing" ? T.amber : pres.color === "agent" ? T.green : T.accent)
    : T.text3;

  return (
    <div style={{
      padding: "10px 12px", borderBottom: `1px solid ${T.border}`,
      background: isAgent && active && expanded ? T.accentBg : T.surface,
      opacity: active ? 1 : 0.7,
    }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        textAlign: "left", color: T.text, fontFamily: T.font,
      }}>
        <span style={{ position: "relative" }}>
          {window.presenceAvatar(pres, 26)}
          <span style={{
            position: "absolute", right: -2, bottom: -2,
            width: 8, height: 8, borderRadius: 99, background: dot,
            boxShadow: `0 0 0 1.5px ${T.surface}`,
            animation: active ? "haul-pulse 1.6s infinite" : "none",
          }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: isAgent ? T.mono : T.font, fontSize: 12, fontWeight: 700, color: T.text }}>
              {window.presenceName(pres)}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: isAgent ? T.green : T.text3, letterSpacing: 0.5, padding: "1px 5px", border: `1px solid ${isAgent ? T.green + "55" : T.border}`, borderRadius: 3, fontFamily: T.mono }}>
              {isAgent ? "AGENT" : "USER"}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: T.text3, fontFamily: T.mono }}>
              {active ? "● " : ""}{window.fmtAgo(pres.at)} ago
            </span>
          </div>
          <div style={{
            fontSize: 11.5, color: T.text2, marginTop: 2, lineHeight: 1.35,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ color: verb.c, fontWeight: 600 }}>{verb.l}</span>
            {card && (
              <span
                onClick={(e) => { e.stopPropagation(); onOpenCard?.(card.id); }}
                style={{
                  fontFamily: T.mono, fontSize: 10.5, color: T.text,
                  padding: "0 5px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3,
                  cursor: "pointer",
                }}
              >HAUL-{card.number}</span>
            )}
            {card && <span style={{ color: T.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{card.title}</span>}
            {!card && !active && <span style={{ color: T.text3, fontStyle: "italic" }}>not on a card</span>}
            {!card && active && pres.action === "scanning" && <span style={{ color: T.text3, fontStyle: "italic" }}>across the board</span>}
          </div>
        </div>
        {isAgent && (
          <span style={{ color: T.text3, transition: "transform 160ms", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
            <RIcon d={RICON.chev} size={12} />
          </span>
        )}
      </button>

      {/* Agent-only telemetry */}
      {isAgent && active && (
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9.5, color: T.text3, fontFamily: T.mono, minWidth: 64 }}>
            {Math.round(agent.load * 100)}% · {agent.tok}t/m
          </span>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: T.bg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${agent.load * 100}%`, background: loadColor, transition: "width 240ms" }} />
          </div>
        </div>
      )}

      {isAgent && expanded && (
        <div style={{
          marginTop: 8, padding: 10, borderRadius: 5,
          background: T.bg, border: `1px solid ${T.border}`,
          fontFamily: T.mono, fontSize: 11, lineHeight: 1.6, color: T.text2,
          maxHeight: 110, overflow: "hidden", position: "relative",
        }}>
          <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: T.text3, fontFamily: T.mono, letterSpacing: 1 }}>tail -f</span>
          {(transcript.length ? transcript : ["// idle — no transcript"]).slice(0, 4).map((line, i) => (
            <div key={i} style={{ opacity: i === 0 ? 1 : 1 - i * 0.18, color: i === 0 ? T.text : T.text2 }}>
              <span style={{ color: T.text3, marginRight: 6 }}>›</span>{line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionHead({ T, label, sub }) {
  return (
    <div style={{
      padding: "10px 12px 4px", display: "flex", alignItems: "baseline", gap: 8,
      borderBottom: `1px solid ${T.border}`, background: T.bg,
    }}>
      <span style={{ fontSize: 10, color: T.text3, fontWeight: 700, letterSpacing: 1.3, fontFamily: T.mono }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 11, color: T.text3, fontFamily: T.font }}>{sub}</span>
    </div>
  );
}

function AgentRow({ T, agent, expanded, onToggle, tIdx }) {
  const working = agent.status === "working";
  const transcript = window.TRANSCRIPTS[agent.name] || [];
  const currentStep = working ? (transcript[tIdx] || agent.step) : null;
  const loadColor = agent.load > 0.7 ? T.amber : agent.load > 0.3 ? T.accent : T.green;

  return (
    <div style={{
      padding: "10px 12px", borderBottom: `1px solid ${T.border}`,
      background: working && expanded ? T.accentBg : T.surface,
    }}>
      <button onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        textAlign: "left", color: T.text, fontFamily: T.font,
      }}>
        <span style={{ position: "relative" }}>
          <window.AgentChip name={agent.name} size={26} />
          {working && (
            <span style={{
              position: "absolute", right: -2, bottom: -2,
              width: 8, height: 8, borderRadius: 99, background: T.green,
              boxShadow: `0 0 0 1.5px ${T.surface}`, animation: "haul-pulse 1.6s infinite",
            }} />
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: T.text }}>@{agent.name}</span>
            <span style={{ fontSize: 10, color: T.text3, fontFamily: T.mono }}>{agent.plugin}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
              color: working ? T.green : T.text3, fontFamily: T.mono,
            }}>{working ? "● LIVE" : "IDLE"}</span>
          </div>
          {working ? (
            <div style={{
              fontSize: 11, color: T.text2, marginTop: 2, lineHeight: 1.3,
              fontFamily: T.font, fontStyle: "italic",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{currentStep}</div>
          ) : (
            <div style={{ fontSize: 11, color: T.text3, marginTop: 2, fontFamily: T.font }}>{agent.desc}</div>
          )}
        </div>
        <span style={{ color: T.text3, transition: "transform 160ms", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
          <RIcon d={RICON.chev} size={12} />
        </span>
      </button>

      {working && (
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9.5, color: T.text3, fontFamily: T.mono, minWidth: 56 }}>
            {Math.round(agent.load * 100)}% · {agent.tok}t/m
          </span>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: T.bg, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${agent.load * 100}%`, background: loadColor, transition: "width 240ms" }} />
          </div>
        </div>
      )}

      {expanded && (
        <div style={{
          marginTop: 8, padding: 10, borderRadius: 5,
          background: T.bg, border: `1px solid ${T.border}`,
          fontFamily: T.mono, fontSize: 11, lineHeight: 1.6, color: T.text2,
          maxHeight: 100, overflow: "hidden", position: "relative",
        }}>
          <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: T.text3, fontFamily: T.mono, letterSpacing: 1 }}>tail -f</span>
          {transcript.slice(0, 4).map((line, i) => (
            <div key={i} style={{ opacity: i === 0 ? 1 : 1 - i * 0.18, color: i === 0 ? T.text : T.text2 }}>
              <span style={{ color: T.text3, marginRight: 6 }}>›</span>{line}
            </div>
          ))}
          {transcript.length === 0 && <span style={{ color: T.text3 }}>// no transcript</span>}
        </div>
      )}
    </div>
  );
}

// ── ACTIVITY RAIL : chronological feed ───────────────────────────────────

function HaulActivityRail({ T, onOpenCard }) {
  const [filter, setFilter] = React.useState("all");
  const filters = [
    { id: "all",      l: "All"      },
    { id: "agent",    l: "Agents"   },
    { id: "comment",  l: "Comments" },
    { id: "ship",     l: "Ships"    },
  ];

  const items = React.useMemo(() => {
    let xs = [...window.ACTIVITY].sort((a, b) => b.at - a.at);
    if (filter !== "all") xs = xs.filter(x => x.kind === filter);
    return xs;
  }, [filter]);

  // Group by relative bucket
  const groups = React.useMemo(() => {
    const g = { now: [], today: [], earlier: [] };
    for (const it of items) {
      const diff = (window.NOW - it.at) / 3600000;
      if (diff < 0.5) g.now.push(it);
      else if (diff < 8) g.today.push(it);
      else g.earlier.push(it);
    }
    return g;
  }, [items]);

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{
        padding: "8px 10px", display: "flex", gap: 4, flexWrap: "wrap",
        borderBottom: `1px solid ${T.border}`, background: T.surface,
      }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            height: 22, padding: "0 9px", borderRadius: 99,
            border: `1px solid ${filter === f.id ? T.accent : T.border}`,
            background: filter === f.id ? T.accentBg : "transparent",
            color: filter === f.id ? T.accent : T.text2,
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
          }}>{f.l}</button>
        ))}
      </div>

      {[
        { k: "now",     l: "JUST NOW" },
        { k: "today",   l: "EARLIER TODAY" },
        { k: "earlier", l: "YESTERDAY+" },
      ].map(({ k, l }) => {
        const list = groups[k];
        if (!list.length) return null;
        return (
          <div key={k}>
            <SectionHead T={T} label={l} sub={`${list.length} events`} />
            <div style={{ padding: "4px 0", position: "relative" }}>
              <span style={{ position: "absolute", left: 24, top: 8, bottom: 8, width: 1, background: T.border }} />
              {list.map((it, idx) => (
                <ActivityItem key={it.id} T={T} item={it} isNewest={k === "now" && idx === 0} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityItem({ T, item, isNewest }) {
  const card = window.getCard(item.card);
  const actorEl = item.agent
    ? <window.AgentChip name={item.agent} size={22} />
    : <window.UserChip id={item.user} size={22} />;
  const actorName = item.agent ? `@${item.agent}` : window.getUser(item.user)?.name || "?";

  const kindMeta = {
    agent:   { c: T.accent, l: "AGENT"  },
    comment: { c: T.text2,  l: "NOTE"   },
    move:    { c: T.green,  l: "MOVE"   },
    assign:  { c: T.amber,  l: "ASSIGN" },
    create:  { c: T.text2,  l: "NEW"    },
    ship:    { c: T.green,  l: "SHIP"   },
  }[item.kind] || { c: T.text3, l: "" };

  return (
    <div style={{
      display: "flex", gap: 10, padding: "8px 12px",
      position: "relative",
      animation: isNewest ? "haul-fade-in 320ms cubic-bezier(.2,.7,.3,1)" : "none",
    }}>
      <div style={{ position: "relative", zIndex: 1 }}>{actorEl}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 11.5, color: T.text, fontFamily: item.agent ? T.mono : T.font }}>{actorName}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: kindMeta.c, letterSpacing: 0.5, padding: "1px 5px", border: `1px solid ${kindMeta.c}55`, borderRadius: 3, fontFamily: T.mono }}>
            {kindMeta.l}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: T.text3, fontFamily: T.mono }}>{window.fmtAgo(item.at)} ago</span>
        </div>
        <div style={{ fontSize: 12, color: T.text2, marginTop: 2, lineHeight: 1.4 }}>{item.text}</div>
        {card && (
          <div style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 6px", border: `1px solid ${T.border}`, borderRadius: 3, background: T.bg, fontSize: 10, color: T.text3, fontFamily: T.mono }}>
            HAUL-{card.number} · <span style={{ color: T.text2, fontFamily: T.font, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PLANS RAIL : proposals queue ────────────────────────────────────────

function HaulPlansRail({ T }) {
  const [plans, setPlans] = React.useState(window.PROPOSALS);
  const [expanded, setExpanded] = React.useState(new Set(["p1"]));

  const toggleExpand = (id) => setExpanded(s => {
    const ns = new Set(s);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    return ns;
  });

  const setStatus = (id, status, extra = {}) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status, ...extra } : p));
  };

  const pending  = plans.filter(p => p.status === "pending");
  const decided  = plans.filter(p => p.status !== "pending");

  return (
    <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      <SectionHead T={T} label={`${pending.length} pending`} sub="waiting for review" />
      {pending.map(p => (
        <PlanCard key={p.id} T={T} plan={p}
          expanded={expanded.has(p.id)} onToggle={() => toggleExpand(p.id)}
          onApprove={() => setStatus(p.id, "approved", { approvedBy: { user: 1 } })}
          onReject={() => setStatus(p.id, "rejected", { rejectedBy: { user: 1 } })}
        />
      ))}
      {decided.length > 0 && <SectionHead T={T} label="recently decided" sub={`${decided.length}`} />}
      {decided.map(p => (
        <PlanCard key={p.id} T={T} plan={p}
          expanded={expanded.has(p.id)} onToggle={() => toggleExpand(p.id)} />
      ))}

      <div style={{ marginTop: "auto", padding: "10px 12px", borderTop: `1px solid ${T.border}`, background: T.bg }}>
        <button style={{
          width: "100%", height: 30, padding: "0 10px",
          background: T.accent, color: T.accentFg,
          border: "none", borderRadius: 5,
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <RIcon d={RICON.plus} size={12} stroke={2.2} /> Propose a plan
        </button>
      </div>
    </div>
  );
}

function PlanCard({ T, plan, expanded, onToggle, onApprove, onReject }) {
  const fromAgent = !!plan.proposer.agent;
  const proposerChip = fromAgent
    ? <window.AgentChip name={plan.proposer.agent} size={22} />
    : <window.UserChip id={plan.proposer.user} size={22} />;
  const proposerName = fromAgent ? `@${plan.proposer.agent}` : window.getUser(plan.proposer.user)?.name;

  const statusBadge = {
    pending:  { c: T.amber,  l: "PENDING"  },
    approved: { c: T.green,  l: "APPROVED" },
    rejected: { c: T.text3,  l: "REJECTED" },
  }[plan.status];

  return (
    <div style={{
      padding: "10px 12px", borderBottom: `1px solid ${T.border}`,
      background: plan.status === "pending" ? T.surface : T.bg,
      opacity: plan.status === "rejected" ? 0.55 : 1,
    }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "flex-start", gap: 10,
        background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
        fontFamily: T.font, color: T.text,
      }}>
        <div style={{ position: "relative" }}>
          {proposerChip}
          {fromAgent && (
            <span style={{
              position: "absolute", right: -3, bottom: -3,
              width: 11, height: 11, borderRadius: 99, background: T.accent, color: T.accentFg,
              fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: T.mono, boxShadow: `0 0 0 1.5px ${T.surface}`,
            }}>AI</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text, fontFamily: fromAgent ? T.mono : T.font }}>{proposerName}</span>
            <span style={{ fontSize: 10, color: T.text3 }}>proposes</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: T.text3, fontFamily: T.mono }}>{window.fmtAgo(plan.at)} ago</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.35 }}>{plan.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: statusBadge.c, letterSpacing: 0.5,
              padding: "1px 5px", border: `1px solid ${statusBadge.c}55`, borderRadius: 3, fontFamily: T.mono,
            }}>{statusBadge.l}</span>
            <span style={{ fontSize: 10.5, color: T.text3 }}>{plan.actions.length} action{plan.actions.length !== 1 ? "s" : ""}</span>
            {plan.confidence != null && (
              <span style={{ marginLeft: "auto", fontSize: 10, color: T.text3, fontFamily: T.mono }}>
                conf {Math.round(plan.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ marginTop: 10, paddingLeft: 32 }}>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.45, marginBottom: 8 }}>{plan.summary}</div>

          {/* Action list */}
          <div style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5,
            padding: 8, fontFamily: T.mono, fontSize: 11, lineHeight: 1.6,
            marginBottom: 10,
          }}>
            {plan.actions.map((a, i) => <PlanAction key={i} T={T} action={a} />)}
          </div>

          {plan.status === "pending" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onApprove} style={{
                flex: 1, height: 28, border: "none", borderRadius: 5,
                background: T.accent, color: T.accentFg,
                fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
                <RIcon d={RICON.check} size={12} stroke={2.4} />Approve
              </button>
              <button onClick={onReject} style={{
                height: 28, padding: "0 10px", border: `1px solid ${T.border}`, borderRadius: 5,
                background: T.surface, color: T.text2,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
              }}>Reject</button>
              <button style={{
                height: 28, padding: "0 10px", border: `1px solid ${T.border}`, borderRadius: 5,
                background: T.surface, color: T.text2,
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: T.font,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <RIcon d={RICON.edit} size={11} />Edit
              </button>
            </div>
          )}
          {plan.status === "approved" && plan.approvedBy && (
            <div style={{ fontSize: 11, color: T.green, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <RIcon d={RICON.check} size={12} stroke={2.4} />
              Approved by {window.getUser(plan.approvedBy.user)?.name} · executed
            </div>
          )}
          {plan.status === "rejected" && plan.rejectedBy && (
            <div style={{ fontSize: 11, color: T.text3 }}>
              Rejected by {window.getUser(plan.rejectedBy.user)?.name}
              {plan.rejectionReason && <span style={{ fontStyle: "italic" }}> — "{plan.rejectionReason}"</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanAction({ T, action }) {
  const kindColor = {
    priority: T.amber,
    move:     T.accent,
    label:    T.text2,
    split:    T.green,
    ping:     T.amber,
    archive:  T.text3,
  }[action.kind] || T.text3;

  const summary = (() => {
    switch (action.kind) {
      case "priority": return <>set <b>{action.target}</b> priority {action.from} → <b>{action.to}</b></>;
      case "move":     return <>move <b>{action.target}</b> {action.from} → <b>{action.to}</b></>;
      case "label":    return <>add label <b>{action.add}</b> to <b>{action.target}</b></>;
      case "split":    return <>split <b>{action.target}</b> into {action.parts.length} cards</>;
      case "ping":     return <>ping {action.users.map(u => `@${u}`).join(", ")} re: <b>{action.target}</b></>;
      case "archive":  return <>archive <b>{action.count}</b> cards</>;
      default:         return JSON.stringify(action);
    }
  })();

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, color: T.text2 }}>
      <span style={{ color: kindColor, fontWeight: 700, minWidth: 60, flexShrink: 0, fontSize: 10, letterSpacing: 0.5 }}>{action.kind.toUpperCase()}</span>
      <span style={{ flex: 1 }}>{summary}</span>
    </div>
  );
}

// Expose to window
Object.assign(window, { RailTabs, HaulConsoleRail, HaulActivityRail, HaulPlansRail });
