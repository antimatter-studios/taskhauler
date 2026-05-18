// TerminalView — monospace flat list grouped by column, sorted by priority+due.
//
// No drag-drop. Click a row to select. Renders one section per column in
// position order, with the spec's `┌── COLUMN [count] ──...` header (the
// trailing dashed line is a 1px dashed border on a flex-1 spacer).

import { useMemo } from "react";
import type { Card } from "@/api/types";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { useAuthStore } from "@/stores/authStore";
import { TerminalRow } from "@/components/board/cards/TerminalRow";
import { MOCK_USERS } from "@/mock/users";
import { MOCK_TELEMETRY } from "@/mock/telemetry";

function agentTelemetry(name: string) {
  return MOCK_TELEMETRY.find((t) => t.name === name);
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  "": 4,
};

function sortKey(c: Card): number {
  return PRIORITY_ORDER[c.priority] ?? 4;
}

function dueKey(c: Card): number {
  return c.due_date ?? Number.POSITIVE_INFINITY;
}

export function TerminalView() {
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const boards = useKanbanStore((s) => s.boards);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);

  const filterAssignee = useBoardUIStore((s) => s.filterAssignee);
  const searchQuery = useBoardUIStore((s) => s.searchQuery);
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const selectCard = useBoardUIStore((s) => s.selectCard);

  const me = useAuthStore((s) => s.user);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const prefix = activeBoard?.prefix || "HAUL";

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((c) => {
      if (filterAssignee === "mine" && me) {
        if (c.assignee_id !== me.id) return false;
      } else if (filterAssignee === "agents") {
        if (!c.assignee_agent) return false;
      }
      if (q && !`${c.title} ${c.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, filterAssignee, searchQuery, me]);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );

  const userHandle = (uid: number): string | undefined => {
    return MOCK_USERS.find((u) => u.id === uid)?.handle;
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        lineHeight: 1.55,
        padding: "12px 14px",
      }}
    >
      <div style={{ color: "var(--text-3)", marginBottom: 8 }}>
        <span style={{ color: "var(--green)" }}>$</span> board --list --group=column --sort=priority,due
      </div>

      {sortedColumns.map((col) => {
        const items = filtered
          .filter((c) => c.column_id === col.id)
          .sort((a, b) => sortKey(a) - sortKey(b) || dueKey(a) - dueKey(b));
        return (
          <div key={col.id} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--accent)",
                fontWeight: 700,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ flexShrink: 0 }}>┌── {col.name.toUpperCase()}</span>
              <span style={{ color: "var(--text-3)", flexShrink: 0 }}>
                [{String(items.length).padStart(2, "0")}]
              </span>
              <span
                style={{
                  flex: 1,
                  borderBottom: "1px dashed var(--border)",
                  height: 1,
                }}
              />
            </div>
            {items.length === 0 && (
              <div style={{ color: "var(--text-3)", paddingLeft: 4 }}>
                │ <span style={{ fontStyle: "italic" }}>// empty</span>
              </div>
            )}
            {items.map((c) => (
              <TerminalRow
                key={c.id}
                card={c}
                selected={selectedCardId === c.id}
                onClick={() => selectCard(c.id === selectedCardId ? null : c.id)}
                isAgentWorking={
                  c.assignee_agent
                    ? agentTelemetry(c.assignee_agent)?.status === "working"
                    : false
                }
                userHandle={c.assignee_id > 0 ? userHandle(c.assignee_id) : undefined}
                prefix={prefix}
              />
            ))}
          </div>
        );
      })}

      <div style={{ marginTop: 16, color: "var(--text-3)", fontSize: 11 }}>
        <span style={{ color: "var(--green)" }}>$</span> _
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 14,
            background: "var(--accent)",
            marginLeft: 2,
            verticalAlign: "middle",
            animation: "blink 1s steps(1, end) infinite",
          }}
        />
      </div>
    </div>
  );
}
