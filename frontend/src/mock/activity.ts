// Will be replaced by GET /api/v1/boards/:id/activity when endpoint exists.
//
// Activity feed entries. The Activity rail buckets these into three time
// windows:
//   • "just now"      — < 30 minutes ago
//   • "earlier today" — 30 minutes to 8 hours ago
//   • "yesterday+"    — > 8 hours ago
// The mocks below span all three so the UI can be designed/QAed end-to-end.

export type ActivityKind =
  | "agent"
  | "comment"
  | "move"
  | "assign"
  | "create"
  | "ship"
  | "label"
  | "priority";

export interface ActivityEvent {
  id: string;
  board_id: string;
  kind: ActivityKind;
  agent_name?: string;
  user_id?: number;
  card_id?: string;
  text: string;
  at: number;
}

const NOW = Date.now();
const MIN = 60_000;
const HR = 60 * MIN;
const BID = "mock-board";

export const MOCK_ACTIVITY: ActivityEvent[] = [
  // ── just now (< 30 min) ─────────────────────────────────────────────
  {
    id: "a1",
    board_id: BID,
    kind: "agent",
    agent_name: "relay",
    card_id: "mock-card-2",
    text: "opened PR #2841 — virtualization patch",
    at: NOW - 90_000,
  },
  {
    id: "a2",
    board_id: BID,
    kind: "agent",
    agent_name: "scout",
    card_id: "mock-card-5",
    text: "found 3 similar reports in last 30d, linked",
    at: NOW - 4 * MIN,
  },
  {
    id: "a3",
    board_id: BID,
    kind: "move",
    user_id: 102,
    card_id: "mock-card-7",
    text: "moved HAUL-134 to In Review",
    at: NOW - 8 * MIN,
  },
  {
    id: "a4",
    board_id: BID,
    kind: "comment",
    user_id: 103,
    card_id: "mock-card-3",
    text: 'left a comment: "can repro on Safari 17.4 with SSO disabled"',
    at: NOW - 12 * MIN,
  },
  {
    id: "a5",
    board_id: BID,
    kind: "agent",
    agent_name: "oracle",
    card_id: "mock-card-4",
    text: "labeled \"perf\", routed to billing oncall",
    at: NOW - 16 * MIN,
  },
  {
    id: "a6",
    board_id: BID,
    kind: "priority",
    user_id: 101,
    card_id: "mock-card-3",
    text: "raised HAUL-140 to urgent",
    at: NOW - 22 * MIN,
  },
  {
    id: "a7",
    board_id: BID,
    kind: "agent",
    agent_name: "pylon",
    card_id: "mock-card-3",
    text: "ping: overdue by 1d, urgent — escalated to @sana",
    at: NOW - 28 * MIN,
  },

  // ── earlier today (0.5h–8h) ────────────────────────────────────────
  {
    id: "a8",
    board_id: BID,
    kind: "agent",
    agent_name: "relay",
    card_id: "mock-card-2",
    text: "ran benchmarks: 4.2x faster scroll @ 10k cards",
    at: NOW - 1.1 * HR,
  },
  {
    id: "a9",
    board_id: BID,
    kind: "assign",
    user_id: 101,
    card_id: "mock-card-4",
    text: "assigned @relay to HAUL-145",
    at: NOW - 2.5 * HR,
  },
  {
    id: "a10",
    board_id: BID,
    kind: "agent",
    agent_name: "scout",
    card_id: "mock-card-6",
    text: "scaffolded ingestion adapter, 6 fields auto-mapped",
    at: NOW - 3.2 * HR,
  },
  {
    id: "a11",
    board_id: BID,
    kind: "label",
    user_id: 104,
    card_id: "mock-card-1",
    text: "added label 'performance' to HAUL-142",
    at: NOW - 4.0 * HR,
  },
  {
    id: "a12",
    board_id: BID,
    kind: "ship",
    user_id: 102,
    card_id: "mock-card-13",
    text: "shipped HAUL-128 to production",
    at: NOW - 5.5 * HR,
  },
  {
    id: "a13",
    board_id: BID,
    kind: "agent",
    agent_name: "relay",
    card_id: "mock-card-12",
    text: "wrote test coverage: 94% lines, 88% branches",
    at: NOW - 6.4 * HR,
  },
  {
    id: "a14",
    board_id: BID,
    kind: "create",
    user_id: 104,
    card_id: "mock-card-5",
    text: "created HAUL-146",
    at: NOW - 7.5 * HR,
  },

  // ── yesterday+ (> 8h) ──────────────────────────────────────────────
  {
    id: "a15",
    board_id: BID,
    kind: "comment",
    user_id: 105,
    card_id: "mock-card-11",
    text: 'left a comment: "a11y review passed, ready to merge"',
    at: NOW - 9.2 * HR,
  },
  {
    id: "a16",
    board_id: BID,
    kind: "agent",
    agent_name: "scout",
    card_id: "mock-card-5",
    text: "reproduced locally on staging — TZ offset confirmed",
    at: NOW - 11 * HR,
  },
  {
    id: "a17",
    board_id: BID,
    kind: "move",
    user_id: 103,
    card_id: "mock-card-8",
    text: "moved HAUL-141 to In Progress",
    at: NOW - 14 * HR,
  },
  {
    id: "a18",
    board_id: BID,
    kind: "ship",
    user_id: 101,
    card_id: "mock-card-14",
    text: "shipped HAUL-129 to production",
    at: NOW - 26 * HR,
  },
  {
    id: "a19",
    board_id: BID,
    kind: "priority",
    user_id: 102,
    card_id: "mock-card-6",
    text: "lowered HAUL-141 to medium",
    at: NOW - 32 * HR,
  },
  {
    id: "a20",
    board_id: BID,
    kind: "agent",
    agent_name: "oracle",
    card_id: "mock-card-1",
    text: "auto-routed HAUL-142 to perf oncall queue",
    at: NOW - 44 * HR,
  },
];
