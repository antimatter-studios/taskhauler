import type { CSSProperties } from "react";
import { useBoardUIStore } from "@/stores/boardUIStore";
import type { RailTab } from "@/stores/boardUIStore";
import { MOCK_TELEMETRY } from "@/mock/telemetry";
import { MOCK_ACTIVITY } from "@/mock/activity";
import { MOCK_PROPOSALS } from "@/mock/proposals";

interface TabDef {
  id: RailTab;
  label: string;
  badge: number;
}

/**
 * Three-segment control at the top of the right rail.
 * Active tab: --bg background + inset 1px --border-hi shadow.
 */
export default function RailTabs() {
  const railTab = useBoardUIStore((s) => s.railTab);
  const setRailTab = useBoardUIStore((s) => s.setRailTab);

  const tabs: TabDef[] = [
    {
      id: "console",
      label: "Console",
      badge: MOCK_TELEMETRY.filter((t) => t.status === "working").length,
    },
    {
      id: "activity",
      label: "Activity",
      badge: MOCK_ACTIVITY.length,
    },
    {
      id: "plans",
      label: "Plans",
      badge: MOCK_PROPOSALS.filter((p) => p.status === "pending").length,
    },
  ];

  const wrapperStyle: CSSProperties = {
    display: "flex",
    padding: "8px 10px",
    gap: 4,
    borderBottom: "1px solid var(--border)",
    background: "var(--surface)",
    flex: "0 0 auto",
  };

  return (
    <div style={wrapperStyle}>
      {tabs.map((t) => {
        const active = railTab === t.id;
        const buttonStyle: CSSProperties = {
          flex: 1,
          height: 28,
          padding: "0 8px",
          borderRadius: 5,
          border: "none",
          background: active ? "var(--bg)" : "transparent",
          color: active ? "var(--text)" : "var(--text-2)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: active ? "inset 0 0 0 1px var(--border-hi)" : "none",
          fontFamily: "var(--font)",
          transition: "background 120ms",
        };

        const badgeStyle: CSSProperties = {
          fontSize: 9.5,
          fontWeight: 700,
          padding: "1px 5px",
          background: active ? "var(--accent)" : "var(--border)",
          color: active ? "var(--accent-fg)" : "var(--text-2)",
          borderRadius: 99,
          fontFamily: "var(--mono)",
          minWidth: 16,
          textAlign: "center",
          lineHeight: 1.2,
        };

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setRailTab(t.id)}
            style={buttonStyle}
          >
            {t.label}
            <span style={badgeStyle}>{t.badge}</span>
          </button>
        );
      })}
    </div>
  );
}
