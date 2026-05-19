// Will be replaced by GET /api/v1/boards/:id/proposals when endpoint exists.
//
// Proposals are multi-step plans waiting for human review. Anyone (users or
// agents) can propose; humans approve/reject/edit. They drive the Plans rail
// tab and the Dispatch view's review queue.

export type ProposalStatus = "pending" | "approved" | "rejected";

export type ProposalAction =
  | { kind: "priority"; target: string; from: string; to: string }
  | { kind: "move"; target: string; from: string; to: string }
  | { kind: "label"; target: string; add?: string; remove?: string }
  | { kind: "split"; target: string; parts: string[] }
  | { kind: "ping"; target: string; users: string[] }
  | { kind: "archive"; count: number }
  | {
      kind: "assign";
      target: string;
      assignee_user_id?: number;
      assignee_agent?: string;
    }
  | { kind: "due"; target: string; to: number };

export interface Proposal {
  id: string;
  board_id: string;
  proposer_kind: "user" | "agent";
  proposer_user_id?: number;
  proposer_agent_name?: string;
  title: string;
  summary: string;
  actions: ProposalAction[];
  status: ProposalStatus;
  confidence?: number;
  at: number;
  approved_by_user_id?: number;
  rejected_by_user_id?: number;
  rejection_reason?: string;
}

const NOW = Date.now();
const MIN = 60_000;
const HR = 60 * MIN;
const DAY = 24 * HR;
const BID = "mock-board";

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "p1",
    board_id: BID,
    proposer_kind: "agent",
    proposer_agent_name: "oracle",
    title: "Re-prioritize 4 stale auth cards",
    summary:
      "Auth epic has 4 cards untouched 14d+. Demote priorities so live work surfaces in the top of the queue.",
    actions: [
      { kind: "priority", target: "HAUL-129", from: "high", to: "low" },
      { kind: "priority", target: "HAUL-134", from: "high", to: "medium" },
      { kind: "label", target: "HAUL-146", add: "stale" },
      { kind: "assign", target: "HAUL-146", assignee_agent: "scout" },
    ],
    status: "pending",
    confidence: 0.82,
    at: NOW - 12 * MIN,
  },
  {
    id: "p2",
    board_id: BID,
    proposer_kind: "user",
    proposer_user_id: 102,
    title: "Promote 3 cards to In Review",
    summary:
      "PRs merged and tests green for HAUL-138, HAUL-139, HAUL-141. Ready for review.",
    actions: [
      { kind: "move", target: "HAUL-138", from: "In Progress", to: "In Review" },
      { kind: "move", target: "HAUL-139", from: "In Progress", to: "In Review" },
      { kind: "move", target: "HAUL-141", from: "In Progress", to: "In Review" },
    ],
    status: "pending",
    at: NOW - 1.5 * HR,
  },
  {
    id: "p3",
    board_id: BID,
    proposer_kind: "agent",
    proposer_agent_name: "relay",
    title: "Split HAUL-138 into 3 subtasks",
    summary:
      "13pt is 2.6x team median. Suggest splitting into spike + impl + migration to unblock parallel work.",
    actions: [
      {
        kind: "split",
        target: "HAUL-138",
        parts: [
          "Event schema spike (3pt)",
          "Adapter impl (5pt)",
          "Hot-path migration (5pt)",
        ],
      },
      { kind: "due", target: "HAUL-138", to: NOW + 5 * DAY },
    ],
    status: "pending",
    confidence: 0.71,
    at: NOW - 3 * HR,
  },
  {
    id: "p4",
    board_id: BID,
    proposer_kind: "agent",
    proposer_agent_name: "pylon",
    title: "Escalate overdue urgent: HAUL-140",
    summary:
      "1 day overdue, P0, blocks release. Pinged @sana and added to oncall queue.",
    actions: [
      { kind: "ping", target: "HAUL-140", users: ["sana"] },
      { kind: "label", target: "HAUL-140", add: "oncall" },
      { kind: "priority", target: "HAUL-140", from: "high", to: "urgent" },
    ],
    status: "approved",
    confidence: 0.95,
    at: NOW - 14 * HR,
    approved_by_user_id: 101,
  },
  {
    id: "p5",
    board_id: BID,
    proposer_kind: "user",
    proposer_user_id: 104,
    title: "Reassign frontend backlog to @wren",
    summary:
      "Wren is back from leave Monday and has bandwidth. Hand off 3 backlog items.",
    actions: [
      { kind: "assign", target: "HAUL-135", assignee_user_id: 105 },
      { kind: "assign", target: "HAUL-144", assignee_user_id: 105 },
      { kind: "assign", target: "HAUL-146", assignee_user_id: 105 },
    ],
    status: "approved",
    at: NOW - 26 * HR,
    approved_by_user_id: 101,
  },
  {
    id: "p6",
    board_id: BID,
    proposer_kind: "user",
    proposer_user_id: 101,
    title: "Archive 9 done cards older than 30d",
    summary: "Clean up the Done column ahead of end-of-sprint review.",
    actions: [{ kind: "archive", count: 9 }],
    status: "rejected",
    at: NOW - 2 * DAY,
    rejected_by_user_id: 103,
    rejection_reason: "let's keep them visible for the sprint retro",
  },
];
