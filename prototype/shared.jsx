// shared.jsx — mock data + shared primitives used by all 5 concepts.

// timestamps relative to "now" — declared first so any data const can use D(...)
const NOW = Date.UTC(2026, 4, 18, 14, 30); // May 18 2026 14:30 UTC
const D = (days, hours = 0) => NOW + days * 86400000 + hours * 3600000;

const USERS = [
  { id: 1, name: "Mira Chen",   handle: "mira",   hue: 12,  avatar: "MC" },
  { id: 2, name: "Theo Park",   handle: "theo",   hue: 200, avatar: "TP" },
  { id: 3, name: "Sana Devi",   handle: "sana",   hue: 290, avatar: "SD" },
  { id: 4, name: "Jules Rey",   handle: "jules",  hue: 140, avatar: "JR" },
  { id: 5, name: "Wren Holt",   handle: "wren",   hue: 40,  avatar: "WH" },
];

const AGENTS = [
  { name: "scout",     type: "agent",      plugin: "openai",  desc: "Triages new bugs from logs",     status: "working", load: 0.4, tok: 380,  step: "Reading recent error reports from Sentry…", lastAct: D(0, -0.4) },
  { name: "builder",   type: "agent",      plugin: "claude",  desc: "Drafts PRs against open tickets", status: "working", load: 0.8, tok: 1240, step: "Writing migration note from PR #2841 diff…",  lastAct: D(0, -0.1) },
  { name: "triage",    type: "tool_agent", plugin: "claude",  desc: "Labels & routes incoming work",   status: "idle",    load: 0.0, tok: 0,    step: null,                                          lastAct: D(0, -2.4) },
  { name: "release",   type: "agent",      plugin: "claude",  desc: "Cuts release notes from done col", status: "idle",   load: 0.0, tok: 0,    step: null,                                          lastAct: D(-1, -3) },
  { name: "watchdog",  type: "tool",       plugin: "internal",desc: "Pings overdue cards",             status: "working", load: 0.2, tok: 60,   step: "Scanning due dates · 142 cards · 1 overdue",   lastAct: D(0, -0.3) },
];

const TRANSCRIPTS = {
  builder: [
    "wrote 142 LOC across 3 files",
    "ran benchmarks: 4.2× faster scroll @ 10k cards",
    "tests passing — 247 ✓ / 0 ✗",
    "opened PR #2841 — virtualization patch",
    "writing migration note from diff…",
  ],
  scout: [
    "scanned 1,204 sentry events from last 24h",
    "found 3 similar reports to HAUL-143, linking",
    "reproduced TZ bug locally on staging",
    "auto-tagged 6 new bugs with severity",
  ],
  watchdog: [
    "HAUL-140 overdue by 1d — escalated to @sana",
    "next ping cycle in 4m",
  ],
};

const EPICS = [
  { id: "e1", name: "Auth & Identity",   color: "#6366f1", short: "AUTH" },
  { id: "e2", name: "Hauler v2",         color: "#f97316", short: "V2"   },
  { id: "e3", name: "Observability",     color: "#10b981", short: "OBS"  },
  { id: "e4", name: "Billing",           color: "#ec4899", short: "BILL" },
];

const COLUMNS = [
  { id: "c1", name: "Backlog",     short: "BKLG" },
  { id: "c2", name: "In Progress", short: "WIP"  },
  { id: "c3", name: "In Review",   short: "RVW"  },
  { id: "c4", name: "Done",        short: "DONE" },
];

const PRIORITIES = {
  urgent: { label: "Urgent", color: "#dc2626", short: "P0" },
  high:   { label: "High",   color: "#f97316", short: "P1" },
  medium: { label: "Med",    color: "#3b82f6", short: "P2" },
  low:    { label: "Low",    color: "#71717a", short: "P3" },
};

// ── Cards ─────────────────────────────────────────────────────────────────

const CARDS = [
  // Backlog
  { id: "k1", number: 142, col: "c1", epic: "e2", title: "Refactor card store to support partial sync", type: "task", priority: "high",   assignee: { user: 1 },               labels: "performance,backend", due: D(7),  estimate: 5, updated: D(-1, -3), commentsN: 3, blockedBy: ["k7"] },
  { id: "k2", number: 143, col: "c1", epic: "e1", title: "Magic-link expiration not respecting TZ",        type: "bug",  priority: "urgent", assignee: { agent: "scout" },         labels: "auth",               due: D(0),  estimate: 2, updated: D(0, -1),  commentsN: 7 },
  { id: "k3", number: 144, col: "c1", epic: "e3", title: "Trace IDs missing on agent invocations",         type: "task", priority: "medium", assignee: { user: 2 },               labels: "telemetry",           due: D(14), estimate: 8, updated: D(-2),     commentsN: 1 },
  { id: "k4", number: 145, col: "c1", epic: "e4", title: "Quarterly invoicing webhook stalls @ 50k rows",  type: "bug",  priority: "high",   assignee: null,                       labels: "billing,perf",        due: D(3),  estimate: 13,updated: D(-1),     commentsN: 0 },
  { id: "k5", number: 146, col: "c1", epic: null, title: "Onboarding empty-state copy pass",               type: "task", priority: "low",    assignee: { user: 4 },               labels: "copy",                due: D(21), estimate: 2, updated: D(-3),     commentsN: 4 },

  // In Progress
  { id: "k6", number: 138, col: "c2", epic: "e2", title: "Migrate dispatcher to event-sourced backbone",   type: "task", priority: "high",   assignee: { user: 2 },               labels: "backend,core",        due: D(5),  estimate: 13,updated: D(0, -2),  commentsN: 12, progress: 0.6 },
  { id: "k7", number: 139, col: "c2", epic: "e2", title: "New column virtualization for 10k+ cards",        type: "task", priority: "medium", assignee: { agent: "builder" },       labels: "frontend,perf",       due: D(2),  estimate: 8, updated: D(0, 0),   commentsN: 4,  progress: 0.85 },
  { id: "k8", number: 140, col: "c2", epic: "e1", title: "SAML response signature edge case",               type: "bug",  priority: "urgent", assignee: { user: 3 },               labels: "auth,security",       due: D(-1), estimate: 5, updated: D(0, -4),  commentsN: 9,  progress: 0.4 },
  { id: "k9", number: 141, col: "c2", epic: "e3", title: "Sentry → Hauler ingestion pipeline",              type: "task", priority: "medium", assignee: { agent: "scout" },         labels: "telemetry,infra",     due: D(4),  estimate: 8, updated: D(0, -6),  commentsN: 2,  progress: 0.3 },

  // In Review
  { id: "k10", number: 134, col: "c3", epic: "e1", title: "Passkey enrollment flow",                         type: "task", priority: "high",   assignee: { user: 1 },               labels: "auth,frontend",       due: D(1),  estimate: 8, updated: D(0, -8),  commentsN: 5, progress: 1.0 },
  { id: "k11", number: 135, col: "c3", epic: "e2", title: "Card detail panel keyboard nav",                 type: "task", priority: "medium", assignee: { user: 5 },               labels: "frontend,a11y",       due: D(2),  estimate: 3, updated: D(-1, -2), commentsN: 2, progress: 1.0 },
  { id: "k12", number: 136, col: "c3", epic: "e3", title: "Agent metrics: tokens & cost per card",          type: "task", priority: "low",    assignee: { agent: "builder" },       labels: "telemetry",           due: D(9),  estimate: 5, updated: D(-1),     commentsN: 1, progress: 1.0 },

  // Done
  { id: "k13", number: 128, col: "c4", epic: "e2", title: "Drag-drop physics across columns",               type: "task", priority: "medium", assignee: { user: 2 },               labels: "frontend",            due: D(-2), estimate: 5, updated: D(-2),     commentsN: 6, progress: 1.0 },
  { id: "k14", number: 129, col: "c4", epic: "e1", title: "Lockout window after 5 failed logins",            type: "task", priority: "high",   assignee: { agent: "builder" },       labels: "auth,security",       due: D(-3), estimate: 3, updated: D(-3),     commentsN: 3, progress: 1.0 },
  { id: "k15", number: 130, col: "c4", epic: "e4", title: "Prorated upgrades for mid-cycle plan change",     type: "task", priority: "medium", assignee: { user: 3 },               labels: "billing",             due: D(-4), estimate: 8, updated: D(-4),     commentsN: 11, progress: 1.0 },
];

// Live agent activity feed entries
const ACTIVITY = [
  { id: 1,  kind: "agent",    agent: "builder", card: "k7",  text: "opened PR #2841 — virtualization patch",                 at: D(0, -0.1) },
  { id: 2,  kind: "agent",    agent: "scout",   card: "k2",  text: "found 3 similar reports in last 30d, linked",            at: D(0, -0.4) },
  { id: 3,  kind: "move",     user: 2,          card: "k10", text: "moved HAUL-134 to In Review",                            at: D(0, -0.6) },
  { id: 4,  kind: "agent",    agent: "builder", card: "k7",  text: "ran benchmarks: 4.2× faster scroll @ 10k cards",         at: D(0, -1.1) },
  { id: 5,  kind: "comment",  user: 3,          card: "k8",  text: "left a comment: \"can repro on Safari 17.4 with SSO disabled\"", at: D(0, -1.4) },
  { id: 6,  kind: "agent",    agent: "scout",   card: "k9",  text: "scaffolded ingestion adapter, 6 fields auto-mapped",     at: D(0, -2.0) },
  { id: 7,  kind: "assign",   user: 1,          card: "k4",  text: "assigned @builder to HAUL-145",                          at: D(0, -2.5) },
  { id: 8,  kind: "agent",    agent: "watchdog",card: "k8",  text: "ping: overdue by 1d, urgent — escalated to @sana",       at: D(0, -3.2) },
  { id: 9,  kind: "ship",     user: 2,          card: "k13", text: "shipped HAUL-128 to production",                         at: D(0, -3.8) },
  { id: 10, kind: "agent",    agent: "builder", card: "k12", text: "wrote test coverage: 94% lines, 88% branches",           at: D(0, -4.4) },
  { id: 11, kind: "create",   user: 4,          card: "k5",  text: "created HAUL-146",                                       at: D(0, -5.1) },
  { id: 12, kind: "agent",    agent: "triage",  card: "k4",  text: "labeled \"perf\", routed to billing oncall",             at: D(0, -6.0) },
  { id: 13, kind: "comment",  user: 5,          card: "k11", text: "left a comment: \"a11y review passed, ready to merge\"", at: D(0, -6.8) },
  { id: 14, kind: "agent",    agent: "scout",   card: "k2",  text: "reproduced locally on staging — TZ offset confirmed",    at: D(0, -7.3) },
];

// Proposals — multi-step plans waiting for review.
// Anyone (users or agents) can propose; humans approve/reject/edit.
const PROPOSALS = [
  {
    id: "p1",
    proposer: { agent: "triage" },
    at: D(0, -0.2),
    title: "Re-prioritize 4 stale auth cards",
    summary: "Auth epic has 4 cards untouched 14d+. Demote priorities so live work surfaces.",
    actions: [
      { kind: "priority", target: "HAUL-129", from: "high", to: "low" },
      { kind: "priority", target: "HAUL-134", from: "high", to: "medium" },
      { kind: "label",    target: "HAUL-146", add: "stale" },
      { kind: "move",     target: "HAUL-145", from: "Backlog", to: "Done" },
    ],
    status: "pending",
    confidence: 0.82,
  },
  {
    id: "p2",
    proposer: { user: 2 },
    at: D(0, -1.5),
    title: "Promote 3 cards to In Review",
    summary: "PRs merged + tests green for HAUL-138, HAUL-139, HAUL-141. Ready to review.",
    actions: [
      { kind: "move", target: "HAUL-138", from: "In Progress", to: "In Review" },
      { kind: "move", target: "HAUL-139", from: "In Progress", to: "In Review" },
      { kind: "move", target: "HAUL-141", from: "In Progress", to: "In Review" },
    ],
    status: "pending",
  },
  {
    id: "p3",
    proposer: { agent: "builder" },
    at: D(0, -3),
    title: "Split HAUL-138 into 3 subtasks",
    summary: "13pt is 2.6× team median. Suggest splitting into spike + impl + migration to unblock parallel work.",
    actions: [
      { kind: "split", target: "HAUL-138", parts: [
        "Event schema spike (3pt)",
        "Adapter impl (5pt)",
        "Hot-path migration (5pt)",
      ]},
    ],
    status: "pending",
    confidence: 0.71,
  },
  {
    id: "p4",
    proposer: { agent: "watchdog" },
    at: D(-0.5),
    title: "Escalate overdue urgent: HAUL-140",
    summary: "1 day overdue, P0, blocks release. Pinged @sana and added to oncall queue.",
    actions: [
      { kind: "ping",  target: "HAUL-140", users: ["sana"] },
      { kind: "label", target: "HAUL-140", add: "oncall" },
    ],
    status: "approved",
    approvedBy: { user: 1 },
    confidence: 0.95,
  },
  {
    id: "p5",
    proposer: { user: 1 },
    at: D(-1),
    title: "Archive 9 done cards older than 30d",
    summary: "Clean up the Done column for end-of-sprint review.",
    actions: [
      { kind: "archive", count: 9 },
    ],
    status: "rejected",
    rejectedBy: { user: 3 },
    rejectionReason: "let's keep them for the sprint retro",
  },
];

// AI suggestions
const SUGGESTIONS = [
  { id: "s1", kind: "promote",  text: "Promote k7 to In Review — PR merged, tests green",          card: "k7"  },
  { id: "s2", kind: "split",    text: "Split k6 — 13pt is above team median; suggest 3 subtasks",   card: "k6"  },
  { id: "s3", kind: "assign",   text: "Assign k4 to @builder — matches billing/perf signature",     card: "k4"  },
  { id: "s4", kind: "escalate", text: "Escalate k8 — overdue urgent bug, blocking release",         card: "k8"  },
  { id: "s5", kind: "archive",  text: "Archive 3 stale Done cards (>30d) to clean board",           card: null  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

// Live presence — what each collaborator (user or agent) is doing right now.
// Multiplayer-style state: who's looking at what, who's editing, who's idle.
const PRESENCE = [
  { id: "pr1",  kind: "user",  userId: 1, action: "viewing",    card: "k7",  at: D(0, -0.02), color: "viewing"    },
  { id: "pr2",  kind: "user",  userId: 2, action: "editing",    card: "k6",  at: D(0, -0.01), color: "editing"    },
  { id: "pr3",  kind: "user",  userId: 3, action: "commenting", card: "k8",  at: D(0, -0.05), color: "editing"    },
  { id: "pr4",  kind: "user",  userId: 4, action: "viewing",    card: "k5",  at: D(0, -0.10), color: "viewing"    },
  { id: "pr5",  kind: "user",  userId: 5, action: "idle",       card: null,  at: D(0, -0.30), color: "idle"       },
  { id: "pr6",  kind: "agent", name: "builder",  action: "working",  card: "k7", at: D(0, -0.01), color: "agent" },
  { id: "pr7",  kind: "agent", name: "scout",    action: "working",  card: "k2", at: D(0, -0.04), color: "agent" },
  { id: "pr8",  kind: "agent", name: "watchdog", action: "scanning", card: null, at: D(0, -0.06), color: "agent" },
  { id: "pr9",  kind: "agent", name: "triage",   action: "idle",     card: null, at: D(0, -1.0),  color: "idle"  },
  { id: "pr10", kind: "agent", name: "release",  action: "idle",     card: null, at: D(-1, -3),   color: "idle"  },
];

function presenceOnCard(cardId) {
  return PRESENCE.filter(p => p.card === cardId && p.action !== "idle");
}

function presenceAvatar(p, size = 22) {
  if (p.kind === "agent") return <AgentChip name={p.name} size={size} />;
  return <UserChip id={p.userId} size={size} />;
}

function presenceName(p) {
  if (p.kind === "agent") return `@${p.name}`;
  return getUser(p.userId)?.name || "?";
}

function getUser(id) { return USERS.find(u => u.id === id); }
function getAgent(name) { return AGENTS.find(a => a.name === name); }
function getEpic(id) { return EPICS.find(e => e.id === id); }
function getCol(id) { return COLUMNS.find(c => c.id === id); }
function getCard(id) { return CARDS.find(c => c.id === id); }
function isOverdue(t) { return t && t < NOW; }

function cardRef(prefix, n) { return `${prefix}-${n}`; }

function fmtDue(t) {
  if (!t) return null;
  const dt = new Date(t);
  const days = Math.round((t - NOW) / 86400000);
  if (days < 0) return { txt: `${-days}d overdue`, overdue: true };
  if (days === 0) return { txt: "today", overdue: false, soon: true };
  if (days === 1) return { txt: "tomorrow", overdue: false, soon: true };
  if (days < 7)  return { txt: `${days}d`, overdue: false, soon: days <= 2 };
  return { txt: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }), overdue: false };
}

function fmtAgo(t) {
  const diff = NOW - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// ── Shared atoms ────────────────────────────────────────────────────────────

function UserChip({ id, size = 22, style = "circle" }) {
  const u = getUser(id);
  if (!u) return null;
  const bg = `oklch(0.7 0.13 ${u.hue})`;
  const fg = `oklch(0.25 0.05 ${u.hue})`;
  return (
    <span title={u.name}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, fontSize: size * 0.42, fontWeight: 700,
        background: bg, color: fg,
        borderRadius: style === "circle" ? "50%" : 4,
        letterSpacing: "-0.02em",
        flex: "0 0 auto",
      }}>
      {u.avatar}
    </span>
  );
}

function AgentChip({ name, size = 22, variant = "default" }) {
  // Agents = hex/square avatar with monospace label
  const a = getAgent(name);
  if (!a) return null;
  const palette = {
    default:  { bg: "#0f172a", fg: "#67e8f9", glow: "#22d3ee" },
    glass:    { bg: "rgba(34,211,238,0.15)", fg: "#67e8f9", glow: "#22d3ee" },
    terminal: { bg: "#facc15", fg: "#1c1917", glow: "#fde047" },
    light:    { bg: "#ecfeff", fg: "#0e7490", glow: "#22d3ee" },
  }[variant] || { bg: "#0f172a", fg: "#67e8f9", glow: "#22d3ee" };
  return (
    <span title={`@${a.name} · ${a.plugin}`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, fontSize: size * 0.42, fontWeight: 700,
        background: palette.bg, color: palette.fg,
        clipPath: "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
        fontFamily: "'Geist Mono', monospace",
        boxShadow: a.status === "working" ? `0 0 0 1px ${palette.glow}` : "none",
        flex: "0 0 auto",
      }}>
      {name.slice(0,1).toUpperCase()}
    </span>
  );
}

// AssigneeChip — picks the right kind based on data
function AssigneeChip({ assignee, size = 22, variant }) {
  if (!assignee) return null;
  if (assignee.agent) return <AgentChip name={assignee.agent} size={size} variant={variant} />;
  if (assignee.user)  return <UserChip id={assignee.user} size={size} />;
  return null;
}

function getAssigneeName(assignee) {
  if (!assignee) return null;
  if (assignee.agent) return `@${assignee.agent}`;
  if (assignee.user) return getUser(assignee.user)?.name;
  return null;
}

// Export everything to window so other babel scripts can see it
Object.assign(window, {
  USERS, AGENTS, EPICS, COLUMNS, CARDS, ACTIVITY, SUGGESTIONS, PRIORITIES, PROPOSALS, TRANSCRIPTS, PRESENCE, NOW, D,
  getUser, getAgent, getEpic, getCol, getCard, isOverdue, cardRef, fmtDue, fmtAgo,
  UserChip, AgentChip, AssigneeChip, getAssigneeName,
  presenceOnCard, presenceAvatar, presenceName,
});
