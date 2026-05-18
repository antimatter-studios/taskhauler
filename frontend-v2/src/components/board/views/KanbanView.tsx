// KanbanView — the default board view. Renders 1..N columns based on the
// current grouping mode (col / priority / epic / assignee / due).
//
// Drag-drop:
//   • One DndContext per view (mounted here).
//   • Each card is a draggable (declared inside KanbanCard).
//   • Each column body is a `useDroppable` zone.
//   • On drop, the field updated depends on grouping:
//       col      → column_id
//       priority → priority
//       epic     → epic_id
//       assignee → assignee_id / assignee_agent
//       due      → due_date (mapped from bucket)
//   • Position uses positionAfter from lib/positions.

import { useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, MoreHorizontal } from "lucide-react";
import type { Card, Epic } from "@/api/types";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { useAuthStore } from "@/stores/authStore";
import { positionAfter } from "@/lib/positions";
import { KanbanCard } from "@/components/board/cards/KanbanCard";

interface Group {
  key: string;
  label: string;
  accent: string;
  cards: Card[];
  /** Field-update payload to apply on drop. */
  onDropPayload?: () => Record<string, unknown>;
}

const MS_PER_DAY = 86_400_000;

function dueBucket(ts: number | null): "overdue" | "today" | "week" | "later" | "none" {
  if (ts === null || ts === undefined) return "none";
  const days = (ts - Date.now()) / MS_PER_DAY;
  if (days < 0) return "overdue";
  if (days < 1) return "today";
  if (days < 7) return "week";
  return "later";
}

function bucketTargetTs(bucket: string): number | null {
  const now = Date.now();
  switch (bucket) {
    case "overdue":
      return now - MS_PER_DAY;
    case "today":
      return now + Math.floor(MS_PER_DAY / 2);
    case "week":
      return now + 3 * MS_PER_DAY;
    case "later":
      return now + 14 * MS_PER_DAY;
    default:
      return null;
  }
}

function ColumnDropZone({
  group,
  children,
}: {
  group: Group;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${group.key}`,
    data: { groupKey: group.key, payload: group.onDropPayload },
    disabled: !group.onDropPayload,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 80,
        borderRadius: 6,
        padding: 4,
        background: isOver ? "var(--accent-bg)" : "transparent",
        transition: "background 120ms",
      }}
    >
      {children}
    </div>
  );
}

export function KanbanView() {
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const epics = useKanbanStore((s) => s.epics);
  const boards = useKanbanStore((s) => s.boards);
  const updateCard = useKanbanStore((s) => s.updateCard);

  const grouping = useBoardUIStore((s) => s.grouping);
  const filterAssignee = useBoardUIStore((s) => s.filterAssignee);
  const searchQuery = useBoardUIStore((s) => s.searchQuery);
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const selectCard = useBoardUIStore((s) => s.selectCard);

  const me = useAuthStore((s) => s.user);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const prefix = activeBoard?.prefix || "HAUL";

  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Filter pipeline
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((c) => {
      if (filterAssignee === "mine" && me) {
        if (c.assignee_id !== me.id) return false;
      } else if (filterAssignee === "agents") {
        if (!c.assignee_agent) return false;
      }
      if (q) {
        const hay = `${c.title} ${c.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, filterAssignee, searchQuery, me]);

  // Group derivation
  const groups: Group[] = useMemo(() => {
    if (grouping === "col") {
      const sorted = [...columns].sort((a, b) => a.position - b.position);
      return sorted.map<Group>((col, i) => ({
        key: col.id,
        label: col.name,
        accent:
          i === 1
            ? "var(--accent)"
            : i === 2
              ? "#a855f7"
              : i === sorted.length - 1
                ? "var(--green)"
                : "var(--text-3)",
        cards: filtered.filter((c) => c.column_id === col.id),
        onDropPayload: () => ({ column_id: col.id }),
      }));
    }
    if (grouping === "priority") {
      const order = [
        { id: "urgent", label: "Urgent", color: "var(--red)" },
        { id: "high", label: "High", color: "var(--amber)" },
        { id: "medium", label: "Medium", color: "var(--accent)" },
        { id: "low", label: "Low", color: "var(--text-3)" },
      ];
      return order.map<Group>((p) => ({
        key: p.id,
        label: p.label,
        accent: p.color,
        cards: filtered.filter((c) => c.priority === p.id),
        onDropPayload: () => ({ priority: p.id }),
      }));
    }
    if (grouping === "epic") {
      const buckets: Group[] = [...epics]
        .sort((a, b) => a.position - b.position)
        .map<Group>((e) => ({
          key: e.id,
          label: e.name,
          accent: e.color || "var(--text-3)",
          cards: filtered.filter((c) => c.epic_id === e.id),
          onDropPayload: () => ({ epic_id: e.id }),
        }));
      buckets.push({
        key: "_none",
        label: "No epic",
        accent: "var(--text-3)",
        cards: filtered.filter((c) => !c.epic_id),
        onDropPayload: () => ({ clear_epic: true }),
      });
      return buckets;
    }
    if (grouping === "assignee") {
      const agentKeys = new Map<string, Card[]>();
      const userKeys = new Map<number, Card[]>();
      const unassigned: Card[] = [];
      for (const c of filtered) {
        if (c.assignee_agent) {
          const list = agentKeys.get(c.assignee_agent) ?? [];
          list.push(c);
          agentKeys.set(c.assignee_agent, list);
        } else if (c.assignee_id > 0) {
          const list = userKeys.get(c.assignee_id) ?? [];
          list.push(c);
          userKeys.set(c.assignee_id, list);
        } else {
          unassigned.push(c);
        }
      }
      const out: Group[] = [];
      // Agents first
      for (const [name, list] of agentKeys) {
        out.push({
          key: `a:${name}`,
          label: `@${name}`,
          accent: "#0ea5e9",
          cards: list,
          onDropPayload: () => ({
            assignee_agent: name,
            assignee_id: 0,
            clear_assignee: false,
          }),
        });
      }
      for (const [uid, list] of userKeys) {
        const display = list[0]?.assignee_name || `user ${uid}`;
        out.push({
          key: `u:${uid}`,
          label: display,
          accent: "var(--accent)",
          cards: list,
          onDropPayload: () => ({
            assignee_id: uid,
            assignee_agent: "",
          }),
        });
      }
      if (unassigned.length > 0 || out.length === 0) {
        out.push({
          key: "_none",
          label: "Unassigned",
          accent: "var(--text-3)",
          cards: unassigned,
          onDropPayload: () => ({ clear_assignee: true }),
        });
      }
      return out;
    }
    if (grouping === "due") {
      const buckets = {
        overdue: [] as Card[],
        today: [] as Card[],
        week: [] as Card[],
        later: [] as Card[],
        none: [] as Card[],
      };
      filtered.forEach((c) => buckets[dueBucket(c.due_date)].push(c));
      return [
        {
          key: "overdue",
          label: "Overdue",
          accent: "var(--red)",
          cards: buckets.overdue,
          onDropPayload: () => ({ due_date: bucketTargetTs("overdue") }),
        },
        {
          key: "today",
          label: "Today",
          accent: "var(--amber)",
          cards: buckets.today,
          onDropPayload: () => ({ due_date: bucketTargetTs("today") }),
        },
        {
          key: "week",
          label: "This week",
          accent: "var(--accent)",
          cards: buckets.week,
          onDropPayload: () => ({ due_date: bucketTargetTs("week") }),
        },
        {
          key: "later",
          label: "Later",
          accent: "var(--text-3)",
          cards: buckets.later,
          onDropPayload: () => ({ due_date: bucketTargetTs("later") }),
        },
        {
          key: "none",
          label: "No due date",
          accent: "var(--text-3)",
          cards: buckets.none,
          onDropPayload: () => ({ clear_due: true }),
        },
      ];
    }
    return [];
  }, [filtered, grouping, columns, epics]);

  // Drag handlers
  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || !activeBoardId) return;
    const cardId = String(e.active.id);
    const overData = e.over.data.current as
      | { groupKey: string; payload?: () => Record<string, unknown> }
      | undefined;
    if (!overData?.payload) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const targetGroup = groups.find((g) => g.key === overData.groupKey);
    if (!targetGroup) return;

    // Compute position: append to end of target group's cards
    const position = positionAfter(targetGroup.cards.filter((c) => c.id !== cardId));
    const patch = { ...overData.payload(), position };
    void updateCard(activeBoardId, cardId, patch);
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
          padding: "12px 10px",
          display: "flex",
          gap: 4,
        }}
      >
        {groups.map((g) => (
          <ColumnSection
            key={g.key}
            group={g}
            prefix={prefix}
            selectedCardId={selectedCardId}
            onSelect={(id) => selectCard(id === selectedCardId ? null : id)}
            epicById={epicById}
          />
        ))}
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

function ColumnSection({
  group,
  prefix,
  selectedCardId,
  onSelect,
  epicById,
}: {
  group: Group;
  prefix: string;
  selectedCardId: string | null;
  onSelect: (id: string) => void;
  epicById: (id: string) => Epic | undefined;
}) {
  const sorted = useMemo(
    () => [...group.cards].sort((a, b) => a.position - b.position),
    [group.cards],
  );

  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        borderRadius: 8,
        padding: 6,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: group.accent,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{group.label}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{group.cards.length}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 2 }}>
          <button
            style={{
              width: 20,
              height: 20,
              border: "none",
              borderRadius: 4,
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Add card"
          >
            <Plus size={12} />
          </button>
          <button
            style={{
              width: 20,
              height: 20,
              border: "none",
              borderRadius: 4,
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="More"
          >
            <MoreHorizontal size={12} />
          </button>
        </span>
      </div>
      <ColumnDropZone group={group}>
        {sorted.map((c) => (
          <KanbanCard
            key={c.id}
            card={c}
            epic={c.epic_id ? epicById(c.epic_id) : undefined}
            selected={selectedCardId === c.id}
            onClick={() => onSelect(c.id)}
            prefix={prefix}
          />
        ))}
        {sorted.length === 0 && (
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 6,
              padding: "16px 8px",
              textAlign: "center",
              fontSize: 11,
              color: "var(--text-3)",
            }}
          >
            Drop or <span style={{ color: "var(--accent)", fontWeight: 600 }}>+ add</span>
          </div>
        )}
      </ColumnDropZone>
    </div>
  );
}
