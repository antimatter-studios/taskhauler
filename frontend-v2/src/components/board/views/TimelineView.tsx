// TimelineView — lanes-by-hauler timeline with day axis.
//
// Each lane is a unique assignee (agent name or user id) plus "unassigned".
// Cards are absolutely positioned in their lane based on due_date and a
// mock estimate-based width. Rows packed greedily via lib/pack-rows.
//
// Drag-drop:
//   • DndContext mounted at view root, pointer sensor with 6px threshold.
//   • Each lane track is a `useDroppable` zone keyed by lane id.
//   • On drop we read the lane id (assignee target) and pointer x (day offset).
//     The day offset is captured at drop time by reading the lane container's
//     bounding rect and the pointer x from the DragEndEvent.
//
// Lane sources: deterministic from the cards list — agents with cards or in
// MOCK_AGENTS, users with cards, plus an "unassigned" lane.

import { useMemo, useRef, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Card, Epic } from "@/api/types";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { useAuthStore } from "@/stores/authStore";
import { packRows } from "@/lib/pack-rows";
import { TimelineBar } from "@/components/board/cards/TimelineBar";
import AgentChip from "@/components/board/primitives/AgentChip";
import UserChip from "@/components/board/primitives/UserChip";
import { MOCK_AGENTS } from "@/mock/agents";
import { MOCK_USERS } from "@/mock/users";
import { MOCK_TELEMETRY } from "@/mock/telemetry";

function agentTelemetry(name: string) {
  return MOCK_TELEMETRY.find((t) => t.name === name);
}

const DAY_W = 64;
const ROW_H = 36;
const LANE_PAD = 8;
const LANE_LABEL_W = 200;
const START = -2;
const END = 14;
const MS_PER_DAY = 86_400_000;

function days(): number[] {
  return Array.from({ length: END - START + 1 }, (_, i) => START + i);
}

function todayUtcMidnight(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function offsetToDate(off: number): Date {
  return new Date(todayUtcMidnight() + off * MS_PER_DAY);
}

function tsToX(ts: number | null): number {
  if (ts === null) return 0;
  const offDays = (ts - todayUtcMidnight()) / MS_PER_DAY;
  return (offDays - START) * DAY_W;
}

function cardWidth(estimate: number): number {
  return Math.max(80, Math.min(200, estimate * 14));
}

function mockEstimate(id: string): number {
  const tail = id.slice(-2);
  const n = parseInt(tail, 16);
  if (Number.isNaN(n)) return 3;
  return (n % 13) + 1;
}

interface Lane {
  id: string;
  kind: "user" | "agent" | "none";
  data?: {
    name: string;
    sub?: string;
    plugin?: string;
    hue?: number;
    handle?: string;
    avatar?: string;
    userId?: number;
    working?: boolean;
  };
}

function laneKeyForCard(c: Card): string {
  if (c.assignee_agent) return `a:${c.assignee_agent}`;
  if (c.assignee_id > 0) return `u:${c.assignee_id}`;
  return "none";
}

export function TimelineView() {
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

  // Done column id (so we can skip done cards on the timeline).
  const doneColumnId = useMemo(() => {
    const done = columns.find((c) => /done/i.test(c.name));
    return done?.id;
  }, [columns]);

  // Track lane rects keyed by lane id for x→day computation on drop.
  const laneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((c) => {
      if (filterAssignee === "mine" && me) {
        if (c.assignee_id !== me.id) return false;
      } else if (filterAssignee === "agents") {
        if (!c.assignee_agent) return false;
      }
      if (q && !`${c.title} ${c.description}`.toLowerCase().includes(q)) return false;
      if (c.column_id === doneColumnId) return false;
      return true;
    });
  }, [cards, filterAssignee, searchQuery, me, doneColumnId]);

  // Build lanes: every agent in MOCK_AGENTS, every user with cards, then unassigned.
  const lanes: Lane[] = useMemo(() => {
    const out: Lane[] = [];
    const agentSet = new Set<string>();
    for (const a of MOCK_AGENTS) {
      out.push({
        id: `a:${a.name}`,
        kind: "agent",
        data: {
          name: `@${a.name}`,
          sub: `${a.plugin ?? "agent"} · agent`,
          plugin: a.plugin,
          working: agentTelemetry(a.name)?.status === "working",
        },
      });
      agentSet.add(a.name);
    }
    // Surface ad-hoc agents (referenced by a card but not in MOCK_AGENTS)
    for (const c of filtered) {
      if (c.assignee_agent && !agentSet.has(c.assignee_agent)) {
        out.push({
          id: `a:${c.assignee_agent}`,
          kind: "agent",
          data: { name: `@${c.assignee_agent}`, sub: "agent" },
        });
        agentSet.add(c.assignee_agent);
      }
    }
    const userIds = new Set<number>();
    for (const c of filtered) {
      if (c.assignee_id > 0) userIds.add(c.assignee_id);
    }
    for (const uid of userIds) {
      const u = MOCK_USERS.find((x) => x.id === uid);
      const display =
        u?.display_name ||
        filtered.find((c) => c.assignee_id === uid)?.assignee_name ||
        `User ${uid}`;
      out.push({
        id: `u:${uid}`,
        kind: "user",
        data: {
          name: display,
          sub: u?.handle ? `@${u.handle}` : undefined,
          hue: u?.hue,
          handle: u?.handle,
          avatar: u?.avatar,
          userId: uid,
        },
      });
    }
    out.push({ id: "none", kind: "none" });
    return out;
  }, [filtered]);

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || !activeBoardId) return;
    const cardId = String(e.active.id);
    const overData = e.over.data.current as { laneId?: string } | undefined;
    const laneId = overData?.laneId;
    if (!laneId) return;

    // Compute day offset from pointer location.
    let dayOffset = 0;
    const laneEl = laneRefs.current.get(laneId);
    const activatorEvent = e.activatorEvent as PointerEvent | undefined;
    const pointerX =
      typeof window !== "undefined" &&
      activatorEvent &&
      "clientX" in activatorEvent
        ? activatorEvent.clientX + (e.delta?.x ?? 0)
        : null;
    if (laneEl && pointerX !== null) {
      const rect = laneEl.getBoundingClientRect();
      const localX = pointerX - rect.left + laneEl.scrollLeft;
      dayOffset = Math.round(localX / DAY_W) + START;
    }

    const dueTs = todayUtcMidnight() + dayOffset * MS_PER_DAY;

    const patch: Record<string, unknown> = { due_date: dueTs };
    if (laneId === "none") {
      patch.clear_assignee = true;
    } else if (laneId.startsWith("a:")) {
      patch.assignee_agent = laneId.slice(2);
      patch.assignee_id = 0;
    } else if (laneId.startsWith("u:")) {
      patch.assignee_id = Number(laneId.slice(2));
      patch.assignee_agent = "";
    }
    void updateCard(activeBoardId, cardId, patch);
  };

  const trackW = (END - START + 1) * DAY_W;
  const todayX = tsToX(todayUtcMidnight());
  const dayList = days();

  const epicById = (id: string): Epic | undefined => epics.find((e) => e.id === id);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        {/* Sticky day header */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            position: "sticky",
            top: 0,
            zIndex: 4,
          }}
        >
          <div
            style={{
              width: LANE_LABEL_W,
              padding: "8px 14px",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-3)",
              letterSpacing: 1.5,
              flexShrink: 0,
              borderRight: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
            }}
          >
            HAULER · {lanes.length}
          </div>
          <div style={{ flex: 1, overflowX: "auto" }}>
            <div style={{ display: "flex", width: trackW, height: 42 }}>
              {dayList.map((off) => {
                const d = offsetToDate(off);
                const isToday = off === 0;
                const dow = d.getUTCDay();
                const weekend = dow === 0 || dow === 6;
                return (
                  <div
                    key={off}
                    style={{
                      width: DAY_W,
                      padding: "5px 8px",
                      borderRight: "1px solid var(--border)",
                      background: isToday
                        ? "var(--accent-bg)"
                        : weekend
                          ? "var(--bg)"
                          : "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9.5,
                        color: isToday ? "var(--accent)" : "var(--text-3)",
                        fontWeight: 700,
                        letterSpacing: 1,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {d
                        .toLocaleDateString(undefined, {
                          weekday: "short",
                          timeZone: "UTC",
                        })
                        .toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isToday ? "var(--text)" : "var(--text-2)",
                      }}
                    >
                      {d.getUTCDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lanes */}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {lanes.map((lane) => (
            <LaneRow
              key={lane.id}
              lane={lane}
              cards={filtered.filter((c) => laneKeyForCard(c) === lane.id)}
              trackW={trackW}
              days={dayList}
              todayX={todayX}
              selectedCardId={selectedCardId}
              onSelect={(id) => selectCard(id === selectedCardId ? null : id)}
              epicById={epicById}
              prefix={prefix}
              registerRef={(el) => {
                if (el) laneRefs.current.set(lane.id, el);
                else laneRefs.current.delete(lane.id);
              }}
            />
          ))}
          <div style={{ height: 30 }} />
        </div>
      </div>
    </DndContext>
  );
}

function LaneRow({
  lane,
  cards,
  trackW,
  days: dayList,
  todayX,
  selectedCardId,
  onSelect,
  epicById,
  prefix,
  registerRef,
}: {
  lane: Lane;
  cards: Card[];
  trackW: number;
  days: number[];
  todayX: number;
  selectedCardId: string | null;
  onSelect: (id: string) => void;
  epicById: (id: string) => Epic | undefined;
  prefix: string;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  // Compute per-card box (x = right edge, width = estimate-derived)
  const boxes = useMemo(() => {
    return cards.map((c) => {
      const w = cardWidth(mockEstimate(c.id));
      const xRight =
        c.due_date !== null ? tsToX(c.due_date) : tsToX(todayUtcMidnight());
      const x = Math.max(2, xRight - w);
      return { card: c, x, width: w };
    });
  }, [cards]);
  const rows = useMemo(() => packRows(boxes), [boxes]);
  const rowCount = Math.max(1, rows.reduce((m, r) => Math.max(m, r + 1), 0));
  const laneH = rowCount * ROW_H + LANE_PAD * 2;
  const minH = Math.max(58, laneH);

  const sumPts = cards.reduce((s, c) => s + mockEstimate(c.id), 0);
  const cap = 21;
  const pct = Math.min(1, sumPts / cap);
  const loadColor =
    sumPts > cap ? "var(--red)" : sumPts > cap * 0.7 ? "var(--amber)" : "var(--green)";

  const { setNodeRef, isOver } = useDroppable({
    id: `lane:${lane.id}`,
    data: { laneId: lane.id },
  });

  const setBoth = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    registerRef(el);
  };

  // Label slot
  let chip: ReactNode;
  let name: string;
  let sub: string;
  if (lane.kind === "agent") {
    const bareName = lane.data?.name?.replace(/^@/, "") ?? "";
    chip = (
      <AgentChip name={bareName} size={26} working={lane.data?.working ?? false} />
    );
    name = lane.data?.name ?? "@?";
    sub = lane.data?.sub ?? "";
  } else if (lane.kind === "user") {
    const userObj = MOCK_USERS.find((u) => u.id === lane.data?.userId);
    chip = userObj ? (
      <UserChip user={userObj} size={26} />
    ) : (
      <UserChip
        user={{
          id: lane.data?.userId ?? 0,
          display_name: lane.data?.name ?? "?",
          hue: lane.data?.hue,
        }}
        size={26}
      />
    );
    name = lane.data?.name ?? "?";
    sub = lane.data?.sub ?? "";
  } else {
    chip = (
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 99,
          border: "1.5px dashed var(--border-hi)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-3)",
          fontSize: 12,
        }}
      >
        ?
      </div>
    );
    name = "Unassigned";
    sub = "needs hauler";
  }

  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--border)",
        minHeight: minH,
        background:
          lane.kind === "agent" ? "var(--accent-bg)" : "var(--surface)",
      }}
    >
      <div
        style={{
          width: LANE_LABEL_W,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {chip}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 12.5,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily:
                  lane.kind === "agent" ? "var(--font-mono)" : "var(--font-sans)",
              }}
            >
              {name}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{sub}</span>
          </div>
          {lane.data?.working && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "var(--green)",
                boxShadow: "0 0 0 2px color-mix(in srgb, var(--green) 33%, transparent)",
                animation: "presence-pulse 1.6s ease-in-out infinite",
              }}
            />
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-3)",
              fontFamily: "var(--font-mono)",
              minWidth: 56,
            }}
          >
            {cards.length}t · {sumPts}pt
          </span>
          <span
            style={{
              flex: 1,
              height: 3,
              background: "var(--bg)",
              borderRadius: 99,
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                display: "block",
                height: "100%",
                width: `${pct * 100}%`,
                background: loadColor,
              }}
            />
          </span>
        </div>
      </div>

      <div
        ref={setBoth}
        style={{
          position: "relative",
          width: trackW,
          minHeight: minH,
          flexShrink: 0,
          background: isOver ? "color-mix(in srgb, var(--accent) 8%, transparent)" : undefined,
          transition: "background 120ms",
        }}
      >
        {/* day stripes */}
        {dayList.map((off, i) => {
          const d = offsetToDate(off);
          const dow = d.getUTCDay();
          const weekend = dow === 0 || dow === 6;
          const isToday = off === 0;
          return (
            <div
              key={off}
              style={{
                position: "absolute",
                left: i * DAY_W,
                top: 0,
                bottom: 0,
                width: DAY_W,
                background: isToday
                  ? "var(--accent-bg)"
                  : weekend
                    ? "var(--bg)"
                    : "transparent",
                borderRight: "1px solid var(--border)",
              }}
            />
          );
        })}
        {/* today line */}
        <div
          style={{
            position: "absolute",
            left: todayX,
            top: 0,
            bottom: 0,
            width: 2,
            background: "var(--amber)",
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--amber) 33%, transparent)",
            pointerEvents: "none",
          }}
        />
        {cards.length === 0 && (
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 11,
              color: "var(--text-3)",
              fontStyle: "italic",
            }}
          >
            no haul scheduled — drop a card to assign
          </div>
        )}
        {boxes.map((b, i) => (
          <TimelineBar
            key={b.card.id}
            card={b.card}
            epic={b.card.epic_id ? epicById(b.card.epic_id) : undefined}
            selected={selectedCardId === b.card.id}
            onClick={() => onSelect(b.card.id)}
            isAgentWorking={
              b.card.assignee_agent
                ? agentTelemetry(b.card.assignee_agent)?.status === "working"
                : false
            }
            left={b.x}
            width={b.width}
            top={LANE_PAD + rows[i] * ROW_H}
            height={ROW_H - 4}
            prefix={prefix}
          />
        ))}
      </div>
    </div>
  );
}
