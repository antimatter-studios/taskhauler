// Will be replaced by GET /api/v1/boards/:id/suggestions when endpoint exists.
//
// AI suggestions populate the suggestion strip above the board and the
// "suggested actions" surface inside card detail. Each entry is a single
// proposed move with a short, human-readable explanation.

export type SuggestionKind =
  | "promote"
  | "split"
  | "assign"
  | "escalate"
  | "archive"
  | "link";

export interface Suggestion {
  id: string;
  kind: SuggestionKind;
  text: string;
  card_id?: string;
  reason?: string;
}

export const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    kind: "promote",
    text: "Promote HAUL-139 to In Review — PR merged, tests green",
    card_id: "mock-card-2",
    reason: "Linked PR #2841 merged 12m ago; CI passed on main.",
  },
  {
    id: "s2",
    kind: "split",
    text: "Split HAUL-138 — 13pt is above team median; suggest 3 subtasks",
    card_id: "mock-card-1",
    reason: "Team median estimate is 5pt; this card is 2.6x larger.",
  },
  {
    id: "s3",
    kind: "assign",
    text: "Assign HAUL-145 to @relay — matches billing/perf signature",
    card_id: "mock-card-4",
    reason: "Labels match 87% of @relay's last 30 closed cards.",
  },
  {
    id: "s4",
    kind: "escalate",
    text: "Escalate HAUL-140 — overdue urgent bug, blocking release",
    card_id: "mock-card-3",
    reason: "Overdue 1d, priority P0, tagged 'release-blocker'.",
  },
  {
    id: "s5",
    kind: "archive",
    text: "Archive 3 stale Done cards (>30d) to clean board",
    reason: "3 cards in Done untouched for 30+ days.",
  },
];
