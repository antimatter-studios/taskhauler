// DispatchAgentTile — 220px-wide tile in the Dispatch view's fleet bar.
//
// Working agents get an accent-bg fill + 3px accent left stripe. Idle agents
// stay neutral. The `cardTitle` slot is the title of the card the agent is
// currently working (passed in by the view based on telemetry).

import type { CSSProperties } from "react";
import AgentChip from "@/components/board/primitives/AgentChip";

// Mirrors the shape mock/agents.ts is exporting. Kept loose so we don't fight
// the foundation agent on field names.
export interface AgentInfo {
  name: string;
  plugin?: string;
  description?: string;
  type?: string;
}

export interface AgentTelemetry {
  status: "working" | "idle";
  load: number; // 0..1
  cardId?: string | null;
}

export interface DispatchAgentTileProps {
  agent: AgentInfo;
  telemetry?: AgentTelemetry;
  /** Title of the card the agent is currently working, if any. */
  cardTitle?: string;
  /** Card number (HAUL-N) if the agent is working a card. */
  cardNumber?: number;
  prefix?: string;
}

export function DispatchAgentTile({
  agent,
  telemetry,
  cardTitle,
  cardNumber,
  prefix = "HAUL",
}: DispatchAgentTileProps) {
  const working = telemetry?.status === "working";
  const load = telemetry?.load ?? 0;

  const style: CSSProperties = {
    flex: "0 0 220px",
    background: working ? "var(--accent-bg)" : "var(--bg)",
    border: `1px solid ${working ? "color-mix(in srgb, var(--accent) 33%, transparent)" : "var(--border)"}`,
    borderRadius: 7,
    padding: 9,
    display: "flex",
    flexDirection: "column",
    gap: 5,
    position: "relative",
    overflow: "hidden",
    fontFamily: "var(--font-sans)",
  };

  return (
    <div style={style}>
      {working && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "var(--accent)",
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <AgentChip name={agent.name} size={22} working={working} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 11.5,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            @{agent.name}
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--text-3)",
            }}
          >
            {agent.plugin ?? "—"}
          </div>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: working ? "var(--accent)" : "var(--text-3)",
            fontFamily: "var(--font-mono)",
            padding: "1px 5px",
            borderRadius: 99,
            border: `1px solid ${working ? "var(--accent)" : "var(--border)"}`,
            background: working ? "var(--surface)" : "transparent",
            whiteSpace: "nowrap",
          }}
        >
          {working ? "● LIVE" : "IDLE"}
        </span>
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "var(--text-2)",
          lineHeight: 1.3,
          height: 26,
          overflow: "hidden",
        }}
      >
        {working && cardTitle ? (
          <>
            {typeof cardNumber === "number" && (
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                {prefix}-{cardNumber}{" "}
              </span>
            )}
            {cardTitle}
          </>
        ) : (
          <span style={{ color: "var(--text-3)" }}>
            {agent.description ?? ""}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
              width: `${load * 100}%`,
              background: working ? "var(--accent)" : "var(--text-3)",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 9,
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
            minWidth: 28,
            textAlign: "right",
          }}
        >
          {Math.round(load * 100)}%
        </span>
      </div>
    </div>
  );
}
