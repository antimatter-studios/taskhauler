// Will be replaced by WS /api/v1/boards/:id/presence when realtime infra exists.
//
// Presence describes "who's looking at / acting on what right now". Each entry
// is one collaborator (user or agent) with a single current action. The
// `card_id` strings ("mock-card-1", …) are placeholders that the consumer
// remaps to real card IDs at runtime once the kanban store has loaded.

export type PresenceAction =
  | "viewing"
  | "editing"
  | "commenting"
  | "working"
  | "scanning"
  | "idle";

export type PresenceKind = "user" | "agent";

export interface PresenceEntry {
  id: string;
  kind: PresenceKind;
  /** Set when kind === "user". */
  user_id?: number;
  /** Set when kind === "agent". */
  agent_name?: string;
  action: PresenceAction;
  /** Placeholder card id, remapped at runtime. Null for idle/scanning. */
  card_id: string | null;
  /** Timestamp in ms — when this presence state was last refreshed. */
  at: number;
}

const NOW = Date.now();
const MIN = 60_000;

export const MOCK_PRESENCE: PresenceEntry[] = [
  {
    id: "pr1",
    kind: "user",
    user_id: 101,
    action: "viewing",
    card_id: "mock-card-1",
    at: NOW - 30_000,
  },
  {
    id: "pr2",
    kind: "user",
    user_id: 102,
    action: "editing",
    card_id: "mock-card-2",
    at: NOW - 15_000,
  },
  {
    id: "pr3",
    kind: "user",
    user_id: 103,
    action: "commenting",
    card_id: "mock-card-3",
    at: NOW - 90_000,
  },
  {
    id: "pr4",
    kind: "user",
    user_id: 104,
    action: "viewing",
    card_id: "mock-card-4",
    at: NOW - 6 * MIN,
  },
  {
    id: "pr5",
    kind: "user",
    user_id: 105,
    action: "idle",
    card_id: null,
    at: NOW - 18 * MIN,
  },
  {
    id: "pr6",
    kind: "agent",
    agent_name: "relay",
    action: "working",
    card_id: "mock-card-2",
    at: NOW - 20_000,
  },
  {
    id: "pr7",
    kind: "agent",
    agent_name: "scout",
    action: "working",
    card_id: "mock-card-5",
    at: NOW - 45_000,
  },
  {
    id: "pr8",
    kind: "agent",
    agent_name: "pylon",
    action: "scanning",
    card_id: null,
    at: NOW - 2 * MIN,
  },
  {
    id: "pr9",
    kind: "agent",
    agent_name: "atlas",
    action: "idle",
    card_id: null,
    at: NOW - 47 * MIN,
  },
];
