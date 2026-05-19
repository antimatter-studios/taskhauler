import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Plus, ChevronRight } from "lucide-react";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { MOCK_PRESENCE } from "@/mock/presence";
import type { PresenceEntry, PresenceAction } from "@/mock/presence";
import { MOCK_USERS } from "@/mock/users";
import { MOCK_TELEMETRY } from "@/mock/telemetry";
import type { AgentTelemetry } from "@/mock/telemetry";
import { MOCK_TRANSCRIPTS } from "@/mock/transcripts";
import { fmtAgo } from "@/lib/time";
import type { Card } from "@/api/types";
import AssigneeChip from "../primitives/AssigneeChip";

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Resolve a mock placeholder card_id ("mock-card-N") to a real card from the
 * kanban store. We sort cards by `number` ascending and index by the N
 * suffix on the placeholder. If the index is out of range, returns undefined.
 */
function resolveCard(
  mockId: string | null | undefined,
  sortedCards: Card[],
): Card | undefined {
  if (!mockId) return undefined;
  const m = /^mock-card-(\d+)$/.exec(mockId);
  if (!m) return sortedCards.find((c) => c.id === mockId);
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return sortedCards[n - 1];
}

function presenceName(pres: PresenceEntry): string {
  if (pres.kind === "agent") return `@${pres.agent_name ?? "?"}`;
  const u = MOCK_USERS.find((x) => x.id === pres.user_id);
  return u?.display_name || "?";
}

function getAgentTelemetry(name?: string): AgentTelemetry | undefined {
  if (!name) return undefined;
  return MOCK_TELEMETRY.find((t) => t.name === name);
}

function dotColorForAction(action: PresenceAction, isAgent: boolean): string {
  if (action === "idle") return "var(--text-3)";
  if (action === "editing" || action === "commenting") return "var(--amber)";
  if (action === "working" || (isAgent && action === "scanning"))
    return "var(--green)";
  return "var(--accent)";
}

interface VerbDef {
  color: string;
  label: string;
}

function verbForAction(action: PresenceAction): VerbDef {
  switch (action) {
    case "viewing":
      return { color: "var(--accent)", label: "viewing" };
    case "editing":
      return { color: "var(--amber)", label: "editing" };
    case "commenting":
      return { color: "var(--amber)", label: "commenting" };
    case "working":
      return { color: "var(--green)", label: "working on" };
    case "scanning":
      return { color: "var(--green)", label: "scanning" };
    case "idle":
    default:
      return { color: "var(--text-3)", label: "idle" };
  }
}

// ── Section header ───────────────────────────────────────────────────────

function SectionHead({ label, sub }: { label: string; sub: string }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          fontWeight: 700,
          letterSpacing: 1.3,
          fontFamily: "var(--mono)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          fontFamily: "var(--font)",
        }}
      >
        {sub}
      </span>
    </div>
  );
}

// ── PresenceRow ──────────────────────────────────────────────────────────

interface PresenceRowProps {
  pres: PresenceEntry;
  expanded: boolean;
  onToggle: () => void;
  transcriptIdx: number;
  resolvedCard: Card | undefined;
  onOpenCard: (cardId: string) => void;
}

function PresenceRow({
  pres,
  expanded,
  onToggle,
  transcriptIdx,
  resolvedCard,
  onOpenCard,
}: PresenceRowProps) {
  const isAgent = pres.kind === "agent";
  const active = pres.action !== "idle";
  const agent = isAgent ? getAgentTelemetry(pres.agent_name) : undefined;
  const transcriptLines = isAgent
    ? MOCK_TRANSCRIPTS[pres.agent_name ?? ""] ?? []
    : [];
  const verb = verbForAction(pres.action);
  const dot = active ? dotColorForAction(pres.action, isAgent) : "var(--text-3)";

  const loadVal = agent?.load ?? 0;
  const loadColor =
    loadVal > 0.7
      ? "var(--amber)"
      : loadVal > 0.3
        ? "var(--accent)"
        : "var(--green)";

  const showCardChip = !!resolvedCard;
  const showFallbackCardChip = !!pres.card_id && !resolvedCard;
  const working = isAgent && pres.action === "working";

  // Transcript starts at transcriptIdx and shows 4 consecutive lines (wrapping).
  const visibleLines: string[] = useMemo(() => {
    if (!working) return [];
    const lines = transcriptLines;
    if (lines.length === 0) return ["// idle — no transcript"];
    const out: string[] = [];
    for (let i = 0; i < 4; i++) {
      const idx = (transcriptIdx + i) % lines.length;
      out.push(lines[idx].text);
    }
    return out;
  }, [working, transcriptLines, transcriptIdx]);

  const containerStyle: CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--border)",
    background:
      isAgent && active && expanded ? "var(--accent-bg)" : "var(--surface)",
    opacity: active ? 1 : 0.7,
  };

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: isAgent ? "pointer" : "default",
          textAlign: "left",
          color: "var(--text)",
          fontFamily: "var(--font)",
        }}
      >
        <span style={{ position: "relative", flex: "0 0 auto" }}>
          <AssigneeChip
            userId={pres.user_id}
            agentName={pres.agent_name}
            size={26}
            working={working}
          />
          <span
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 8,
              height: 8,
              borderRadius: 99,
              background: dot,
              boxShadow: "0 0 0 1.5px var(--surface)",
              animation: active ? "presence-pulse 1.6s infinite" : "none",
            }}
          />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: isAgent ? "var(--mono)" : "var(--font)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {presenceName(pres)}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: isAgent ? "var(--green)" : "var(--text-3)",
                letterSpacing: 0.5,
                padding: "1px 5px",
                border: `1px solid ${
                  isAgent
                    ? "color-mix(in srgb, var(--green) 33%, transparent)"
                    : "var(--border)"
                }`,
                borderRadius: 3,
                fontFamily: "var(--mono)",
              }}
            >
              {isAgent ? "AGENT" : "USER"}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "var(--text-3)",
                fontFamily: "var(--mono)",
              }}
            >
              {active ? "● " : ""}
              {fmtAgo(pres.at)} ago
            </span>
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--text-2)",
              marginTop: 2,
              lineHeight: 1.35,
              display: "flex",
              alignItems: "center",
              gap: 5,
              minWidth: 0,
            }}
          >
            <span style={{ color: verb.color, fontWeight: 600, flex: "0 0 auto" }}>
              {verb.label}
            </span>
            {showCardChip && resolvedCard && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCard(resolvedCard.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenCard(resolvedCard.id);
                  }
                }}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  color: "var(--text)",
                  padding: "0 5px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 3,
                  cursor: "pointer",
                  flex: "0 0 auto",
                }}
              >
                HAUL-{resolvedCard.number}
              </span>
            )}
            {showFallbackCardChip && (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10.5,
                  color: "var(--text-3)",
                  padding: "0 5px",
                  background: "var(--bg)",
                  border: "1px dashed var(--border)",
                  borderRadius: 3,
                  flex: "0 0 auto",
                }}
              >
                HAUL-?
              </span>
            )}
            {resolvedCard && (
              <span
                style={{
                  color: "var(--text-3)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {resolvedCard.title}
              </span>
            )}
            {!resolvedCard && !showFallbackCardChip && !active && (
              <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>
                not on a card
              </span>
            )}
            {!resolvedCard && !showFallbackCardChip && active && (
              <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>
                across the board
              </span>
            )}
          </div>
        </div>
        {isAgent && (
          <span
            style={{
              color: "var(--text-3)",
              transition: "transform 160ms",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={12} />
          </span>
        )}
      </button>

      {/* Agent telemetry row */}
      {working && agent && (
        <div
          style={{
            marginTop: 7,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              color: "var(--text-3)",
              fontFamily: "var(--mono)",
              minWidth: 64,
            }}
          >
            {Math.round(agent.load * 100)}% · {agent.tok}t/m
          </span>
          <div
            style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${agent.load * 100}%`,
                background: loadColor,
                transition: "width 240ms",
              }}
            />
          </div>
        </div>
      )}

      {/* Transcript box (expanded + working agents) */}
      {working && expanded && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 5,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            fontFamily: "var(--mono)",
            fontSize: 11,
            lineHeight: 1.6,
            color: "var(--text-2)",
            maxHeight: 110,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 6,
              fontSize: 9,
              color: "var(--text-3)",
              fontFamily: "var(--mono)",
              letterSpacing: 1,
            }}
          >
            tail -f
          </span>
          {visibleLines.map((line, i) => (
            <div
              key={i}
              style={{
                opacity: 1 - i * 0.18,
                color: i === 0 ? "var(--text)" : "var(--text-2)",
              }}
            >
              <span style={{ color: "var(--text-3)", marginRight: 6 }}>
                ›
              </span>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ConsoleRail ──────────────────────────────────────────────────────────

/**
 * Console rail: live presence + agent transcripts.
 *
 * - Two sections (active now / idle), each rendered as a list of PresenceRows.
 * - Working-agent rows cycle through their transcript every 3.2s.
 */
export default function ConsoleRail() {
  const cards = useKanbanStore((s) => s.cards);
  const selectCard = useBoardUIStore((s) => s.selectCard);

  // Default: builder (pr6) expanded so users see the transcript on first open.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["pr6"]));
  const [transcriptIdx, setTranscriptIdx] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setTranscriptIdx((prev) => {
        const next: Record<string, number> = { ...prev };
        for (const t of MOCK_TELEMETRY) {
          if (t.status !== "working") continue;
          const lines = MOCK_TRANSCRIPTS[t.name] ?? [];
          if (lines.length === 0) continue;
          next[t.name] = ((prev[t.name] ?? 0) + 1) % lines.length;
        }
        return next;
      });
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  // Sort cards by `number` ascending so the mock-card-N → card mapping is stable.
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [cards],
  );

  const toggle = (id: string) =>
    setExpanded((s) => {
      const ns = new Set(s);
      if (ns.has(id)) ns.delete(id);
      else ns.add(id);
      return ns;
    });

  const active = MOCK_PRESENCE.filter((p) => p.action !== "idle");
  const idle = MOCK_PRESENCE.filter((p) => p.action === "idle");

  const handleOpenCard = (cardId: string) => selectCard(cardId);

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <SectionHead label={`${active.length} active now`} sub="on this board" />
      {active.map((p) => (
        <PresenceRow
          key={p.id}
          pres={p}
          expanded={expanded.has(p.id)}
          onToggle={() => toggle(p.id)}
          transcriptIdx={
            p.kind === "agent" ? (transcriptIdx[p.agent_name ?? ""] ?? 0) : 0
          }
          resolvedCard={resolveCard(p.card_id, sortedCards)}
          onOpenCard={handleOpenCard}
        />
      ))}

      <SectionHead
        label={`${idle.length} idle`}
        sub="available · last seen recently"
      />
      {idle.map((p) => (
        <PresenceRow
          key={p.id}
          pres={p}
          expanded={expanded.has(p.id)}
          onToggle={() => toggle(p.id)}
          transcriptIdx={0}
          resolvedCard={resolveCard(p.card_id, sortedCards)}
          onOpenCard={handleOpenCard}
        />
      ))}

      <div
        style={{
          marginTop: "auto",
          padding: "10px 12px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg)",
          flex: "0 0 auto",
        }}
      >
        <InviteButton />
      </div>
    </div>
  );
}

function InviteButton(): ReactNode {
  return (
    <button
      type="button"
      style={{
        width: "100%",
        height: 30,
        padding: "0 10px",
        background: "transparent",
        color: "var(--text-2)",
        fontFamily: "var(--font)",
        border: "1px dashed var(--border-hi)",
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Plus size={12} />
      Invite people or hauler agents
    </button>
  );
}
