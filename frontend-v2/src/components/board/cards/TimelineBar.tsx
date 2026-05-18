// TimelineBar — slim 32px-tall card used in the Timeline view's lane track.
//
// Drag is wired via `@dnd-kit`'s useDraggable. The parent lane owns the drop
// logic (and the lane id + day offset on drop).

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { Card, Epic } from "@/api/types";
import { fmtDue } from "@/lib/time";

export interface TimelineBarProps {
  card: Card;
  epic?: Epic;
  selected: boolean;
  onClick: () => void;
  isAgentWorking?: boolean;
  /** Pre-computed left in px relative to the lane track. */
  left: number;
  /** Pre-computed width in px. */
  width: number;
  /** Top offset in px (lane-pad + row * row-h). */
  top: number;
  /** Card height (row-h - gap). Default 28. */
  height?: number;
  /** Board prefix for HAUL-N. */
  prefix?: string;
}

export function TimelineBar({
  card,
  epic,
  selected,
  onClick,
  isAgentWorking,
  left,
  width,
  top,
  height = 28,
  prefix = "HAUL",
}: TimelineBarProps) {
  const due = fmtDue(card.due_date);
  const stripeColor = epic?.color || "#777";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { type: "card", card },
  });

  const borderColor = selected
    ? "var(--accent)"
    : due.overdue
      ? "var(--red)"
      : stripeColor;

  const style: CSSProperties = {
    position: "absolute",
    left,
    width,
    top,
    height,
    background: "var(--surface)",
    border: `1.5px solid ${borderColor}`,
    borderRadius: 5,
    padding: "3px 6px 3px 9px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: isDragging ? "grabbing" : "grab",
    overflow: "hidden",
    boxShadow: selected
      ? `0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent), 0 2px 6px rgba(0,0,0,0.08)`
      : "0 1px 2px rgba(0,0,0,0.05)",
    fontFamily: "var(--font-sans)",
    color: "var(--text)",
    opacity: isDragging ? 0.5 : 1,
    transform: CSS.Translate.toString(transform),
    zIndex: selected ? 2 : 1,
    userSelect: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: stripeColor,
        }}
      />
      {isAgentWorking && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 99,
            background: "var(--green)",
            flexShrink: 0,
            animation: "presence-pulse 1.6s ease-in-out infinite",
          }}
        />
      )}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-3)",
          flexShrink: 0,
        }}
      >
        {prefix}-{card.number}
      </span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: "var(--text)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
          minWidth: 0,
        }}
      >
        {card.title}
      </span>
      {card.priority === "urgent" && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--red)",
            padding: "0 4px",
            background: "var(--surface)",
            border: "1px solid var(--red)",
            borderRadius: 3,
            flexShrink: 0,
          }}
        >
          P0
        </span>
      )}
    </div>
  );
}
