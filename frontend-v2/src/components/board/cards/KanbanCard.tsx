// KanbanCard — the dense, default card used in both KanbanView and DispatchView.
//
// The same visual specced once, two callsites. Per-view differences flow through
// props (e.g. DispatchView doesn't pass `presenceForCard`, KanbanView does).
//
// The card is a drag source via `@dnd-kit`'s `useDraggable`. Drop targets are
// owned by the parent view (column, section).

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { Card, Epic } from "@/api/types";
import { fmtDue } from "@/lib/time";
import AssigneeChip from "@/components/board/primitives/AssigneeChip";
import EpicChip from "@/components/board/primitives/EpicChip";
import PresenceCluster, {
  type PresenceEntry,
} from "@/components/board/primitives/PresenceCluster";
import PriorityIndicator from "@/components/board/primitives/PriorityIndicator";

export type { PresenceEntry };

export interface KanbanCardProps {
  card: Card;
  epic?: Epic;
  selected: boolean;
  onClick: () => void;
  presenceForCard?: PresenceEntry[];
  isAgentWorking?: boolean;
  /** Board prefix for HAUL-N. Defaults to "HAUL". */
  prefix?: string;
}

// Deterministic mock estimate from card id (1..13pt). Real estimates aren't in
// the API yet; this keeps the UI populated without per-card flicker.
function mockEstimate(id: string): number {
  const tail = id.slice(-2);
  const n = parseInt(tail, 16);
  if (Number.isNaN(n)) return 3;
  return (n % 13) + 1;
}

// Deterministic mock progress (0..1). Returns 0 for ~half of cards so the
// progress bar isn't omnipresent. Only renders bar when 0 < p < 1.
function mockProgress(id: string): number {
  const tail = id.slice(-2);
  const n = parseInt(tail, 16);
  if (Number.isNaN(n)) return 0;
  if (n % 3 === 0) return 0;
  return ((n % 10) + 1) / 12;
}

export function KanbanCard({
  card,
  epic,
  selected,
  onClick,
  presenceForCard,
  isAgentWorking,
  prefix = "HAUL",
}: KanbanCardProps) {
  const due = fmtDue(card.due_date);
  const estimate = mockEstimate(card.id);
  const progress = mockProgress(card.id);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: "card", card },
  });

  const style: CSSProperties = {
    background: "var(--surface)",
    border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
    boxShadow: selected
      ? "0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)"
      : "var(--shadow-rest)",
    borderRadius: "var(--radius)",
    padding: "8px 10px",
    cursor: isDragging ? "grabbing" : "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    color: "var(--text)",
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : "transform 120ms, box-shadow 120ms",
    userSelect: "none",
  };

  const dueColor = due.overdue
    ? "var(--red)"
    : due.soon
      ? "var(--amber)"
      : "var(--text-3)";

  const presence = (presenceForCard || []).filter(
    (p) => !(p.kind === "agent" && p.name === card.assignee_agent),
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isDragging || selected) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "var(--shadow-hover)";
      }}
      onMouseLeave={(e) => {
        if (isDragging || selected) return;
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "var(--shadow-rest)";
      }}
      {...listeners}
      {...attributes}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <PriorityIndicator priority={card.priority} />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--text-3)",
            letterSpacing: 0.2,
          }}
        >
          {prefix}-{card.number}
        </span>
        {card.card_type === "bug" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: "var(--red)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 99,
                background: "var(--red)",
              }}
            />
            BUG
          </span>
        )}
        {/* blocked icon — Card type has no blocked_by field yet, so omitted. */}
        <span
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {presence.length > 0 && (
            <PresenceCluster entries={presence} maxShown={3} size={14} />
          )}
          {/* comment count omitted — Card type has no count field yet. */}
          {(card.assignee_agent || card.assignee_id > 0) && (
            <AssigneeChip
              agentName={card.assignee_agent || undefined}
              userId={card.assignee_id || undefined}
              size={18}
              working={isAgentWorking}
            />
          )}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontWeight: 500,
          color: "var(--text)",
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {card.title}
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          marginTop: 1,
        }}
      >
        {epic && <EpicChip epic={epic} />}
        <span
          style={{
            fontSize: 10.5,
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {estimate}pt
        </span>
        {due.txt && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 500,
              color: dueColor,
              marginLeft: "auto",
            }}
          >
            {due.txt}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {progress > 0 && progress < 1 && (
        <div
          style={{
            height: 2,
            borderRadius: 99,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>
      )}
    </div>
  );
}
