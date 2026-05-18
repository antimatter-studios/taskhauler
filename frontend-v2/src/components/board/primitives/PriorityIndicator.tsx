import type { CSSProperties } from "react";

type Priority = "low" | "medium" | "high" | "urgent" | "";

interface PriorityIndicatorProps {
  priority?: Priority;
}

/**
 * 3-bar graduated indicator for low/medium/high, or a solid red 8×8 square
 * for urgent. Returns null when no priority is set.
 */
export default function PriorityIndicator({ priority }: PriorityIndicatorProps) {
  if (!priority) return null;

  if (priority === "urgent") {
    const sq: CSSProperties = {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: "var(--red)",
      boxShadow: "0 0 0 2px color-mix(in srgb, var(--red) 13%, transparent)",
    };
    return (
      <span title="Urgent" className="inline-flex items-center">
        <span style={sq} />
      </span>
    );
  }

  const cfg = {
    low: { heights: [4, 4, 4], fills: [1, 0, 0], label: "Low" },
    medium: { heights: [4, 7, 4], fills: [1, 1, 0], label: "Medium" },
    high: { heights: [4, 7, 10], fills: [1, 1, 1], label: "High" },
  }[priority];

  if (!cfg) return null;

  return (
    <span
      title={cfg.label}
      className="inline-flex items-end"
      style={{ gap: 1.5, height: 12 }}
    >
      {cfg.heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            height: h,
            background: cfg.fills[i]
              ? priority === "high"
                ? "var(--amber)"
                : "var(--text-2)"
              : "var(--border-hi)",
            borderRadius: 0.5,
          }}
        />
      ))}
    </span>
  );
}
