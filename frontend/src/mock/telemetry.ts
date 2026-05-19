// Will be replaced by GET /api/v1/registry/agents/telemetry (or per-agent
// telemetry endpoints) when backend agent runtime exists. Drives the Console
// rail's per-agent rows and the Terminal view's load/tokens columns.

export interface AgentTelemetry {
  name: string;
  status: "working" | "idle";
  /** 0..1 — fraction of agent's concurrency budget currently in use. */
  load: number;
  /** Tokens/min over the last 60s rolling window. */
  tok: number;
  /** One-line description of the current step. Null when idle. */
  step: string | null;
  /** Card the agent is currently acting on, if any. */
  current_card_id: string | null;
  /** ms timestamp of last activity. */
  last_act: number;
}

const NOW = Date.now();
const MIN = 60_000;

export const MOCK_TELEMETRY: AgentTelemetry[] = [
  {
    name: "relay",
    status: "working",
    load: 0.78,
    tok: 184,
    step: "Writing migration note from PR #2841 diff…",
    current_card_id: "mock-card-2",
    last_act: NOW - 8_000,
  },
  {
    name: "scout",
    status: "working",
    load: 0.42,
    tok: 96,
    step: "Reading recent error reports from Sentry…",
    current_card_id: "mock-card-5",
    last_act: NOW - 22_000,
  },
  {
    name: "atlas",
    status: "idle",
    load: 0.0,
    tok: 0,
    step: null,
    current_card_id: null,
    last_act: NOW - 47 * MIN,
  },
  {
    name: "oracle",
    status: "working",
    load: 0.56,
    tok: 142,
    step: "Classifying inbound tickets · 14 of 21…",
    current_card_id: "mock-card-3",
    last_act: NOW - 4_000,
  },
  {
    name: "vega",
    status: "idle",
    load: 0.0,
    tok: 0,
    step: null,
    current_card_id: null,
    last_act: NOW - 5 * 60 * MIN,
  },
  {
    name: "pylon",
    status: "working",
    load: 0.21,
    tok: 82,
    step: "Scanning due dates · 142 cards · 1 overdue",
    current_card_id: null,
    last_act: NOW - 90_000,
  },
];
