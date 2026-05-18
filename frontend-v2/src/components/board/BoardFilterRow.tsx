import { Columns3, GanttChart, Terminal, Network } from "lucide-react";
import { useBoardUIStore } from "@/stores/boardUIStore";
import type { ComponentType } from "react";

const GROUPINGS = [
  { id: "status", label: "Status" },
  { id: "priority", label: "Priority" },
  { id: "epic", label: "Epic" },
  { id: "assignee", label: "Assignee" },
  { id: "due", label: "Due" },
] as const;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "agents", label: "Agents", hasDot: true },
] as const;

interface ViewDef {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
}

const VIEWS: ViewDef[] = [
  { id: "kanban", label: "Kanban", icon: Columns3 },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "dispatch", label: "Dispatch", icon: Network },
];

/**
 * Filter row — 40px tall.
 * Group segmented control + filter chips + view switcher.
 */
export default function BoardFilterRow() {
  const grouping = useBoardUIStore((s) => s.grouping) as string;
  const setGrouping = useBoardUIStore((s) => (s as any).setGrouping);
  const filterAssignee = useBoardUIStore((s) => s.filterAssignee) as string;
  const setFilterAssignee = useBoardUIStore((s) => (s as any).setFilterAssignee);
  const view = useBoardUIStore((s) => s.view) as string;
  const setView = useBoardUIStore((s) => (s as any).setView);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 40,
        padding: "0 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flex: "0 0 40px",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-3)", marginRight: 4 }}>
        Group
      </span>
      <div
        className="flex"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 2,
        }}
      >
        {GROUPINGS.map((g) => {
          const active = grouping === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrouping?.(g.id)}
              className="transition-colors hover:bg-[var(--hover)]"
              style={{
                height: 22,
                padding: "0 9px",
                border: "none",
                borderRadius: 4,
                background: active ? "var(--surface)" : "transparent",
                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                color: active ? "var(--text)" : "var(--text-2)",
                fontSize: 11.5,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <span
        style={{
          width: 1,
          height: 18,
          background: "var(--border)",
          margin: "0 6px",
        }}
      />

      <span style={{ fontSize: 11, color: "var(--text-3)", marginRight: 4 }}>
        Filter
      </span>
      {FILTERS.map((f) => {
        const active = filterAssignee === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterAssignee?.(f.id)}
            className="inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--hover)]"
            style={{
              height: 24,
              padding: "0 8px",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 5,
              background: active ? "var(--accent-bg)" : "var(--surface)",
              color: active ? "var(--accent)" : "var(--text-2)",
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {"hasDot" in f && f.hasDot && active && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: "var(--green)",
                  boxShadow:
                    "0 0 0 2px color-mix(in srgb, var(--green) 20%, transparent)",
                  animation: "presence-pulse 1.6s ease-in-out infinite",
                }}
              />
            )}
            {f.label}
          </button>
        );
      })}

      <div
        className="ml-auto flex items-center"
        style={{
          gap: 2,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 2,
        }}
      >
        {VIEWS.map((v) => {
          const active = view === v.id;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView?.(v.id)}
              className="inline-flex items-center gap-1.5 transition-colors hover:bg-[var(--hover)]"
              style={{
                height: 22,
                padding: "0 9px",
                border: "none",
                borderRadius: 4,
                background: active ? "var(--surface)" : "transparent",
                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                color: active ? "var(--text)" : "var(--text-2)",
                fontSize: 11.5,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
              }}
            >
              <Icon size={12} />
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
