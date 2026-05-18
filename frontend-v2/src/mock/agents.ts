// Will be replaced by GET /api/v1/registry/agents (or similar) when endpoint
// exists. The real backend's RegistryAlias type lives in api/types.ts —
// MockAgent picks up its shape and adds presentation fields the UI needs
// (description, status) that the registry doesn't yet expose.

export type AgentPlugin = "anthropic" | "openai" | "google";
export type AgentStatus = "working" | "idle";

export interface MockAgent {
  name: string;
  plugin: AgentPlugin;
  model: string;
  description: string;
  status: AgentStatus;
}

export const MOCK_AGENTS: MockAgent[] = [
  {
    name: "relay",
    plugin: "anthropic",
    model: "claude-3.5-sonnet",
    description: "Drafts PRs against open tickets and ships migration notes",
    status: "working",
  },
  {
    name: "scout",
    plugin: "openai",
    model: "gpt-4o",
    description: "Triages new bugs from Sentry logs and links duplicates",
    status: "working",
  },
  {
    name: "atlas",
    plugin: "google",
    model: "gemini-1.5-pro",
    description: "Cross-references docs and surfaces related prior work",
    status: "idle",
  },
  {
    name: "oracle",
    plugin: "anthropic",
    model: "claude-3.5-sonnet",
    description: "Labels and routes incoming work to the right oncall",
    status: "working",
  },
  {
    name: "vega",
    plugin: "openai",
    model: "gpt-4o",
    description: "Cuts release notes from cards landing in Done",
    status: "idle",
  },
  {
    name: "pylon",
    plugin: "anthropic",
    model: "claude-3.5-sonnet",
    description: "Pings overdue cards and escalates blocked work",
    status: "working",
  },
];
