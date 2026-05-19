import type { CSSProperties } from "react";
import { MOCK_USERS } from "@/mock/users";
import UserChip from "./UserChip";
import AgentChip from "./AgentChip";
import PresenceDot from "./PresenceDot";

/**
 * Loose presence entry shape — matches MOCK_PRESENCE.
 * The mock-data agent owns the exact type; we accept the shape we need.
 */
export interface PresenceEntry {
  id?: string | number;
  kind: "user" | "agent";
  userId?: number;
  name?: string; // agent name
  action: "viewing" | "editing" | "commenting" | "working" | "scanning" | "idle" | string;
}

interface PresenceClusterProps {
  entries: PresenceEntry[];
  maxShown?: number;
  size?: number;
  showLabel?: boolean;
}

function dotColor(action: string): string {
  switch (action) {
    case "viewing":
      return "var(--accent)";
    case "editing":
    case "commenting":
      return "var(--amber)";
    case "working":
      return "var(--green)";
    case "scanning":
    case "idle":
    default:
      return "var(--text-3)";
  }
}

function entryName(p: PresenceEntry): string {
  if (p.kind === "agent") return `@${p.name ?? "agent"}`;
  const u = MOCK_USERS.find((x) => x.id === p.userId);
  return u?.display_name ?? "?";
}

function entryAvatar(p: PresenceEntry, size: number) {
  if (p.kind === "agent") {
    return <AgentChip name={p.name ?? "?"} size={size} working={p.action === "working"} />;
  }
  const u = MOCK_USERS.find((x) => x.id === p.userId);
  if (!u) return null;
  return <UserChip user={u} size={size} />;
}

/**
 * Overlapping avatar stack with pulsing action dots + "+N" overflow
 * + optional "X active" label.
 */
export default function PresenceCluster({
  entries,
  maxShown = 5,
  size = 24,
  showLabel = false,
}: PresenceClusterProps) {
  if (!entries || entries.length === 0) return null;

  const shown = entries.slice(0, maxShown);
  const overflow = entries.length - shown.length;
  const activeCount = entries.filter((p) => p.action !== "idle").length;

  const tooltip = entries
    .map((p) => `${entryName(p)} — ${p.action}`)
    .join("\n");

  return (
    <div title={tooltip} className="inline-flex items-center">
      {shown.map((p, i) => {
        const ringStyle: CSSProperties = {
          position: "relative",
          display: "inline-flex",
          marginLeft: i === 0 ? 0 : -7,
          boxShadow: "0 0 0 2px var(--surface)",
          borderRadius: 99,
        };
        return (
          <span key={p.id ?? `${p.kind}-${i}`} style={ringStyle}>
            {entryAvatar(p, size)}
            {p.action !== "idle" && (
              <PresenceDot color={dotColor(p.action)} active />
            )}
          </span>
        );
      })}
      {overflow > 0 && (
        <span
          className="ml-1 font-bold"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--text-3)",
          }}
        >
          +{overflow}
        </span>
      )}
      {showLabel && (
        <span
          className="ml-2"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--text-2)",
          }}
        >
          {activeCount} active
        </span>
      )}
    </div>
  );
}
