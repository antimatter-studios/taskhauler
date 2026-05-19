// DispatchView — ops dashboard. Fleet bar at top, 4 prioritised sections below.
//
// Sections:
//   • Hot     (red,    read-only) — overdue + not done
//   • InFlight(accent, drop-able) — column matched by name ~ "in progress" or position 1
//   • Ready   (green,  drop-able) — column matched by name ~ "review"
//   • Queue   (text-3, drop-able) — column matched by name ~ "backlog" or position 0
//
// Drop targets update card.column_id. Reuses the dense KanbanCard.

import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Card, Column, Epic } from "@/api/types";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { useAuthStore } from "@/stores/authStore";
import { fmtDue } from "@/lib/time";
import { positionAfter } from "@/lib/positions";
import { KanbanCard } from "@/components/board/cards/KanbanCard";
import { DispatchAgentTile } from "@/components/board/cards/DispatchAgentTile";
import { MOCK_AGENTS } from "@/mock/agents";
import { MOCK_TELEMETRY } from "@/mock/telemetry";

function agentTelemetry(name: string) {
  return MOCK_TELEMETRY.find((t) => t.name === name);
}

interface Section {
  id: string;
  label: string;
  sub: string;
  accent: string;
  cards: Card[];
  /** Target column id when dropped (undefined = read-only). */
  targetColumnId?: string;
}

function findColumn(columns: Column[], matchers: RegExp[]): Column | undefined {
  for (const re of matchers) {
    const col = columns.find((c) => re.test(c.name));
    if (col) return col;
  }
  return undefined;
}

function SectionDropZone({
  section,
  children,
}: {
  section: Section;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${section.id}`,
    data: { targetColumnId: section.targetColumnId },
    disabled: !section.targetColumnId,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        flex: "1 1 0",
        minWidth: 180,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: isOver ? "var(--accent-bg)" : "transparent",
        borderRadius: 8,
        padding: 6,
        transition: "background 120ms",
      }}
    >
      {children}
    </div>
  );
}

export function DispatchView() {
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const epics = useKanbanStore((s) => s.epics);
  const boards = useKanbanStore((s) => s.boards);
  const updateCard = useKanbanStore((s) => s.updateCard);

  const filterAssignee = useBoardUIStore((s) => s.filterAssignee);
  const searchQuery = useBoardUIStore((s) => s.searchQuery);
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const selectCard = useBoardUIStore((s) => s.selectCard);

  const me = useAuthStore((s) => s.user);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const prefix = activeBoard?.prefix || "HAUL";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

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

  // Resolve named columns (best-effort by name match; fall back to position).
  const sortedCols = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns],
  );
  const doneCol = findColumn(sortedCols, [/^done$/i, /done/i, /shipped/i]);
  const backlogCol =
    findColumn(sortedCols, [/^backlog$/i, /backlog/i, /queue/i]) ?? sortedCols[0];
  const inProgressCol =
    findColumn(sortedCols, [/in.?progress/i, /^doing$/i, /working/i]) ?? sortedCols[1];
  const reviewCol =
    findColumn(sortedCols, [/review/i, /qa/i]) ?? sortedCols[2];

  const sections: Section[] = useMemo(() => {
    const hot = filtered.filter(
      (c) => fmtDue(c.due_date).overdue && c.column_id !== doneCol?.id,
    );
    return [
      {
        id: "hot",
        label: "Hot",
        sub: "overdue + urgent",
        accent: "var(--red)",
        cards: hot,
      },
      {
        id: "inFlight",
        label: "In Flight",
        sub: "being worked",
        accent: "var(--accent)",
        cards: inProgressCol
          ? filtered.filter((c) => c.column_id === inProgressCol.id)
          : [],
        targetColumnId: inProgressCol?.id,
      },
      {
        id: "ready",
        label: "Ready",
        sub: "in review",
        accent: "var(--green)",
        cards: reviewCol
          ? filtered.filter((c) => c.column_id === reviewCol.id)
          : [],
        targetColumnId: reviewCol?.id,
      },
      {
        id: "queue",
        label: "Queue",
        sub: "backlog",
        accent: "var(--text-3)",
        cards: backlogCol
          ? filtered.filter((c) => c.column_id === backlogCol.id)
          : [],
        targetColumnId: backlogCol?.id,
      },
    ];
  }, [filtered, inProgressCol, reviewCol, backlogCol, doneCol]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || !activeBoardId) return;
    const cardId = String(e.active.id);
    const overData = e.over.data.current as { targetColumnId?: string } | undefined;
    const targetColumnId = overData?.targetColumnId;
    if (!targetColumnId) return;
    const targetCards = cards.filter(
      (c) => c.column_id === targetColumnId && c.id !== cardId,
    );
    const position = positionAfter(targetCards);
    void updateCard(activeBoardId, cardId, {
      column_id: targetColumnId,
      position,
    });
  };

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;
  const epicById = (id: string): Epic | undefined => epics.find((e) => e.id === id);

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 14px",
        }}
      >
        {/* Fleet bar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflowX: "auto",
            flexShrink: 0,
            minHeight: 76,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 1,
              paddingRight: 10,
              borderRight: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: "var(--text-3)",
                fontFamily: "var(--font-mono)",
              }}
            >
              FLEET
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: -0.5,
              }}
            >
              {MOCK_AGENTS.length}
            </span>
          </div>
          {MOCK_AGENTS.map((agent) => {
            const t = agentTelemetry(agent.name);
            const onCard = t?.current_card_id
              ? cards.find((c) => c.id === t.current_card_id)
              : cards.find(
                  (c) =>
                    c.assignee_agent === agent.name &&
                    c.column_id === inProgressCol?.id,
                );
            return (
              <DispatchAgentTile
                key={agent.name}
                agent={agent}
                telemetry={
                  t
                    ? {
                        status: t.status,
                        load: t.load,
                        cardId: t.current_card_id,
                      }
                    : undefined
                }
                cardTitle={onCard?.title}
                cardNumber={onCard?.number}
                prefix={prefix}
              />
            );
          })}
        </div>

        {/* 4 sections */}
        <div style={{ display: "flex", gap: 6, flex: 1, minHeight: 0 }}>
          {sections.map((sec) => (
            <SectionDropZone key={sec.id} section={sec}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "2px 4px 6px",
                  borderBottom: `1px solid ${sec.accent}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: sec.accent,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                  {sec.label}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    color: "var(--text-3)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {sec.cards.length}
                </span>
                <span style={{ marginLeft: 4, fontSize: 10, color: "var(--text-3)" }}>
                  · {sec.sub}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  overflow: "auto",
                  flex: 1,
                }}
              >
                {sec.cards.map((c) => (
                  <KanbanCard
                    key={c.id}
                    card={c}
                    epic={c.epic_id ? epicById(c.epic_id) : undefined}
                    selected={selectedCardId === c.id}
                    onClick={() =>
                      selectCard(c.id === selectedCardId ? null : c.id)
                    }
                    isAgentWorking={
                      c.assignee_agent
                        ? agentTelemetry(c.assignee_agent)?.status === "working"
                        : false
                    }
                    prefix={prefix}
                  />
                ))}
                {sec.cards.length === 0 && (
                  <div
                    style={{
                      padding: "16px 8px",
                      textAlign: "center",
                      border: "1px dashed var(--border)",
                      borderRadius: 6,
                      color: "var(--text-3)",
                      fontSize: 11,
                    }}
                  >
                    —
                  </div>
                )}
              </div>
            </SectionDropZone>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <div style={{ opacity: 0.95, pointerEvents: "none" }}>
            <KanbanCard
              card={activeCard}
              epic={activeCard.epic_id ? epicById(activeCard.epic_id) : undefined}
              selected={false}
              onClick={() => {}}
              prefix={prefix}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
