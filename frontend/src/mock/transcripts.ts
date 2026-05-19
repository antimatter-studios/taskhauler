// Will be replaced by GET /api/v1/registry/agents/:name/transcript (or a WS
// stream) when backend agent runtime exists. Used by the Terminal view's
// per-agent panes and the Console rail when expanded.

export interface AgentTranscriptLine {
  agent: string;
  ts: number;
  text: string;
}

const NOW = Date.now();
const SEC = 1_000;

function line(agent: string, secondsAgo: number, text: string): AgentTranscriptLine {
  return { agent, ts: NOW - secondsAgo * SEC, text };
}

export const MOCK_TRANSCRIPTS: Record<string, AgentTranscriptLine[]> = {
  relay: [
    line("relay", 4, "tool call: read_file('cmd/import-sqlite/main.go')"),
    line("relay", 12, "drafting migration note for PR #2841"),
    line("relay", 24, "wrote 142 LOC across 3 files"),
    line("relay", 41, "ran benchmarks: 4.2x faster scroll @ 10k cards"),
    line("relay", 73, "tests passing — 247 ok / 0 fail"),
    line("relay", 118, "opened PR #2841 — virtualization patch"),
    line("relay", 184, "tool call: write_file('docs/migrations/2026-05.md')"),
    line("relay", 240, "starting card HAUL-139 — virtualization patch"),
  ],
  scout: [
    line("scout", 8, "scanned 1,204 Sentry events from last 24h"),
    line("scout", 22, "found 3 similar reports to HAUL-143, linking"),
    line("scout", 47, "reproduced TZ bug locally on staging"),
    line("scout", 88, "auto-tagged 6 new bugs with severity"),
    line("scout", 142, "tool call: search_logs(window=24h, level=error)"),
    line("scout", 210, "summary posted to HAUL-143"),
    line("scout", 320, "polling Sentry feed every 30s"),
    line("scout", 480, "starting triage sweep"),
  ],
  atlas: [
    line("atlas", 47 * 60, "idle — last action: indexed docs/ tree"),
    line("atlas", 49 * 60, "indexed 312 markdown files into vector store"),
    line("atlas", 51 * 60, "tool call: glob('docs/**/*.md')"),
    line("atlas", 55 * 60, "starting reindex job (cron)"),
    line("atlas", 86 * 60, "answered 4 cross-reference queries"),
    line("atlas", 124 * 60, "tool call: vector_search('event sourcing')"),
    line("atlas", 180 * 60, "idle"),
    line("atlas", 240 * 60, "idle"),
  ],
  oracle: [
    line("oracle", 2, "classified HAUL-146 → 'copy' label"),
    line("oracle", 9, "routed HAUL-145 to billing oncall"),
    line("oracle", 18, "labeled HAUL-144 'telemetry'"),
    line("oracle", 36, "tool call: classify(card='HAUL-144')"),
    line("oracle", 64, "batch routing: 14 of 21 done"),
    line("oracle", 112, "fetched inbound ticket batch (n=21)"),
    line("oracle", 200, "starting routing sweep"),
    line("oracle", 320, "idle — waiting for next batch"),
  ],
  vega: [
    line("vega", 5 * 60 * 60, "idle — last release notes cut for v1.4.2"),
    line("vega", 5 * 60 * 60 + 30, "wrote CHANGELOG.md entry · 12 cards"),
    line("vega", 5 * 60 * 60 + 90, "summarized 12 Done cards into release"),
    line("vega", 5 * 60 * 60 + 180, "tool call: list_cards(column='Done', since=v1.4.1)"),
    line("vega", 5 * 60 * 60 + 240, "starting release-notes job"),
    line("vega", 12 * 60 * 60, "idle"),
    line("vega", 24 * 60 * 60, "idle"),
    line("vega", 48 * 60 * 60, "released v1.4.1 notes"),
  ],
  pylon: [
    line("pylon", 18, "HAUL-140 overdue by 1d — escalated to @sana"),
    line("pylon", 90, "scanning due dates · 142 cards · 1 overdue"),
    line("pylon", 240, "pinged @sana via console"),
    line("pylon", 410, "tool call: list_cards(due_before=now)"),
    line("pylon", 600, "next ping cycle in 4m"),
    line("pylon", 900, "scanned, 0 overdue"),
    line("pylon", 1500, "starting due-date sweep"),
    line("pylon", 2400, "idle between cycles"),
  ],
};
