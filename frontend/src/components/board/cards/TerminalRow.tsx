// TerminalRow — a single `│`-prefixed row in the TerminalView.
//
// Monospace, fixed-column widths so the columns line up regardless of theme.
// No drag-drop — Terminal view is read-oriented; click to select.

import type { CSSProperties } from "react";
import type { Card } from "@/api/types";
import { fmtDue } from "@/lib/time";

const P_TAG: Record<string, string> = {
  urgent: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  "": "--",
};

function priorityColor(p: Card["priority"]): string {
  if (p === "urgent") return "var(--red)";
  if (p === "high") return "var(--amber)";
  if (p === "medium") return "var(--accent)";
  if (p === "low") return "var(--text-3)";
  return "var(--text-3)";
}

// Deterministic mock estimate (mirror of KanbanCard's helper). Kept inline to
// avoid coupling: the views agent owns both files.
function mockEstimate(id: string): number {
  const tail = id.slice(-2);
  const n = parseInt(tail, 16);
  if (Number.isNaN(n)) return 3;
  return (n % 13) + 1;
}

export interface TerminalRowProps {
  card: Card;
  selected: boolean;
  onClick: () => void;
  isAgentWorking?: boolean;
  /** Resolved user handle for `~userhandle` display when card has a user assignee. */
  userHandle?: string;
  prefix?: string;
}

export function TerminalRow({
  card,
  selected,
  onClick,
  isAgentWorking,
  userHandle,
  prefix = "HAUL",
}: TerminalRowProps) {
  const due = fmtDue(card.due_date);
  const estimate = mockEstimate(card.id);
  const pTag = P_TAG[card.priority] ?? "--";
  const pColor = priorityColor(card.priority);
  const isBug = card.card_type === "bug";

  const style: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2px 4px 2px 8px",
    background: selected ? "var(--accent-bg)" : "transparent",
    color: "var(--text)",
    cursor: "pointer",
    borderLeft: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
    whiteSpace: "nowrap",
    overflow: "hidden",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.55,
  };

  const dueColor = due.overdue
    ? "var(--red)"
    : due.soon
      ? "var(--amber)"
      : "var(--text-3)";

  const assigneeLabel = card.assignee_agent
    ? `@${card.assignee_agent}`
    : card.assignee_id > 0
      ? `~${userHandle ?? card.assignee_name ?? `u${card.assignee_id}`}`
      : "";

  return (
    <div style={style} onClick={onClick}>
      <span style={{ color: "var(--text-3)", flexShrink: 0 }}>│</span>
      <span style={{ color: "var(--text-2)", flexShrink: 0, width: 70 }}>
        {prefix}-{card.number}
      </span>
      <span
        style={{
          color: pColor,
          fontWeight: 700,
          flexShrink: 0,
          width: 28,
        }}
      >
        {card.priority ? `[${pTag}]` : ""}
      </span>
      <span
        style={{
          color: isBug ? "var(--red)" : "var(--text-3)",
          flexShrink: 0,
          width: 34,
          fontWeight: isBug ? 700 : 400,
        }}
      >
        {isBug ? "[BUG]" : "[TSK]"}
      </span>
      <span
        style={{
          color: "var(--text)",
          fontWeight: 500,
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {card.title}
      </span>
      {assigneeLabel && (
        <span
          style={{
            color: card.assignee_agent ? "var(--green)" : "var(--accent)",
            flexShrink: 0,
            fontWeight: 600,
          }}
        >
          {assigneeLabel}
        </span>
      )}
      {isAgentWorking && (
        <span style={{ color: "var(--green)", flexShrink: 0, fontSize: 9 }}>
          ● live
        </span>
      )}
      <span
        style={{
          color: "var(--text-3)",
          flexShrink: 0,
          width: 36,
          textAlign: "right",
        }}
      >
        {estimate}pt
      </span>
      <span
        style={{
          color: dueColor,
          flexShrink: 0,
          width: 70,
          textAlign: "right",
          fontWeight: due.overdue ? 700 : 400,
        }}
      >
        {due.txt ? (due.overdue ? "!" : "~") + due.txt : "—"}
      </span>
    </div>
  );
}
