import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { MOCK_SUBTASKS } from "@/mock/subtasks";
import type { Subtask } from "@/mock/subtasks";
import { MOCK_TELEMETRY } from "@/mock/telemetry";
import { MOCK_AGENTS } from "@/mock/agents";
import { MOCK_USERS } from "@/mock/users";
import { fmtDue } from "@/lib/time";
import type { Card } from "@/api/types";
import AssigneeChip from "../primitives/AssigneeChip";

// ── localStorage helpers ─────────────────────────────────────────────────

function storageKey(cardId: string): string {
  return `taskhauler.subtasks.${cardId}`;
}

function indexCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
}

function reverseMockId(
  card: Card | undefined,
  sortedCards: Card[],
): string | undefined {
  if (!card) return undefined;
  const idx = sortedCards.findIndex((c) => c.id === card.id);
  if (idx < 0) return card.id;
  return `mock-card-${idx + 1}`;
}

function loadSubtasks(card: Card, sortedCards: Card[]): Subtask[] {
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(storageKey(card.id));
      if (raw) {
        const parsed = JSON.parse(raw) as Subtask[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through to seed
    }
  }

  // Seed from MOCK_SUBTASKS via the mock alias (mock-card-N).
  const alias = reverseMockId(card, sortedCards);
  const seed = (alias && MOCK_SUBTASKS[alias]) || MOCK_SUBTASKS[card.id] || [];
  // Clone so toggles don't mutate the mock module.
  return seed.map((s) => ({ ...s, card_id: card.id }));
}

function persistSubtasks(cardId: string, subtasks: Subtask[]) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(cardId), JSON.stringify(subtasks));
  } catch {
    // ignore
  }
}

// ── FocusModal ───────────────────────────────────────────────────────────

/**
 * Fullscreen Focus mode. Triggered by the F key (when a card is selected) or
 * the Focus button in CardDetailPanel. Renders nothing when no card is focused.
 */
export default function FocusModal() {
  const focusedCardId = useBoardUIStore((s) => s.focusedCardId);
  const focusCard = useBoardUIStore((s) => s.focusCard);
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const epics = useKanbanStore((s) => s.epics);
  const boards = useKanbanStore((s) => s.boards);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const updateCard = useKanbanStore((s) => s.updateCard);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const cardPrefix = (activeBoard?.prefix || "TH").toUpperCase();

  const sortedCards = useMemo(() => indexCards(cards), [cards]);
  const card = useMemo(
    () => cards.find((c) => c.id === focusedCardId),
    [cards, focusedCardId],
  );

  const close = useCallback(() => focusCard(null), [focusCard]);

  // Esc key closes (registered only while modal is open).
  useEffect(() => {
    if (!focusedCardId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedCardId, close]);

  // Subtasks — keyed on the real card id, persisted to localStorage on change.
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  useEffect(() => {
    if (!card) {
      setSubtasks([]);
      return;
    }
    setSubtasks(loadSubtasks(card, sortedCards));
  }, [card?.id, sortedCards]);

  // Find the "Done" column for the ship action. Heuristic: last column by
  // position, or one named "Done" (case-insensitive). Hoisted above the
  // early return below so hook order stays stable across renders.
  const doneColumn = useMemo(() => {
    const byName = columns.find((c) => c.name.toLowerCase() === "done");
    if (byName) return byName;
    const sorted = [...columns].sort((a, b) => a.position - b.position);
    return sorted[sorted.length - 1];
  }, [columns]);

  if (!focusedCardId || !card) return null;

  const epic = epics.find((e) => e.id === card.epic_id);
  const due = fmtDue(card.due_date);
  const isBug = card.card_type === "bug";

  const agentTelemetry = card.assignee_agent
    ? MOCK_TELEMETRY.find((t) => t.name === card.assignee_agent)
    : undefined;
  const agentWorking = agentTelemetry?.status === "working";

  const assigneeUser = card.assignee_id
    ? MOCK_USERS.find((u) => u.id === card.assignee_id)
    : undefined;
  const assigneeName = card.assignee_agent
    ? `@${card.assignee_agent}`
    : assigneeUser?.display_name || card.assignee_name || "";

  const handleMarkShipped = () => {
    if (!doneColumn || !activeBoardId) return;
    void updateCard(activeBoardId, card.id, { column_id: doneColumn.id });
    close();
  };

  const doneN = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length ? doneN / subtasks.length : 0;

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => {
      const next = prev.map((s) =>
        s.id === id ? { ...s, done: !s.done } : s,
      );
      persistSubtasks(card.id, next);
      return next;
    });
  };

  const stopPropagation = (e: ReactMouseEvent<HTMLDivElement>) =>
    e.stopPropagation();

  const priorityLabel = card.priority
    ? card.priority[0].toUpperCase() + card.priority.slice(1)
    : "—";

  const backdrop: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "color-mix(in srgb, var(--bg) 94%, transparent)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "fade-in 200ms",
  };

  const modal: CSSProperties = {
    width: "min(720px, 92vw)",
    maxHeight: "92vh",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "32px 36px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
    color: "var(--text)",
    fontFamily: "var(--font)",
    overflow: "auto",
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      style={backdrop}
      onClick={close}
    >
      <div onClick={stopPropagation} style={modal}>
        {/* Meta strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "var(--text-3)",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--mono)",
              fontWeight: 700,
              color: "var(--accent)",
            }}
          >
            {cardPrefix}-{card.number}
          </span>
          {isBug && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--red)",
                padding: "1px 6px",
                background: "color-mix(in srgb, var(--red) 13%, transparent)",
                borderRadius: 3,
                letterSpacing: 0.4,
              }}
            >
              BUG
            </span>
          )}
          {epic && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 99,
                  background: epic.color,
                }}
              />
              {epic.name}
            </span>
          )}
          {card.priority && (
            <>
              <span>·</span>
              <span>{priorityLabel} priority</span>
            </>
          )}
          {due.txt && (
            <>
              <span>·</span>
              <span
                style={{
                  color: due.overdue ? "var(--red)" : "var(--text-3)",
                  fontWeight: due.overdue ? 700 : 400,
                }}
              >
                due {due.txt}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={close}
            style={{
              marginLeft: "auto",
              height: 24,
              padding: "0 8px",
              border: "1px solid var(--border)",
              borderRadius: 5,
              background: "var(--bg)",
              color: "var(--text-2)",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "var(--font)",
            }}
          >
            Esc · close
          </button>
        </div>

        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: -0.5,
            color: "var(--text)",
          }}
        >
          {card.title}
        </h1>

        {/* Assignee + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {(card.assignee_id || card.assignee_agent) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
              }}
            >
              <AssigneeChip
                userId={card.assignee_id || undefined}
                agentName={card.assignee_agent || undefined}
                size={28}
                working={agentWorking}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {assigneeName}
                </div>
                {agentWorking ? (
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--green)",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 99,
                        background: "var(--green)",
                        animation: "presence-pulse 1.4s infinite",
                      }}
                    />
                    working alongside you ·{" "}
                    {MOCK_AGENTS.find(
                      (a) => a.name === card.assignee_agent,
                    )?.plugin ?? "agent"}
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={handleMarkShipped}
              disabled={!doneColumn || !activeBoardId}
              style={{
                height: 32,
                padding: "0 14px",
                border: "none",
                borderRadius: 7,
                background: "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: doneColumn ? "pointer" : "not-allowed",
                fontFamily: "var(--font)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: doneColumn ? 1 : 0.6,
              }}
            >
              <Check size={13} strokeWidth={2.4} />
              Mark shipped
            </button>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--text-2)",
              whiteSpace: "pre-wrap",
            }}
          >
            {card.description}
          </div>
        )}

        {/* Progress */}
        {subtasks.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "var(--bg)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
                fontFamily: "var(--mono)",
              }}
            >
              {doneN}
              <span style={{ color: "var(--text-3)" }}>/{subtasks.length}</span>
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-3)",
                  marginBottom: 4,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  fontFamily: "var(--mono)",
                }}
              >
                Subtasks complete
              </div>
              <div
                style={{
                  height: 5,
                  background: "var(--surface)",
                  borderRadius: 99,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: "var(--accent)",
                    transition: "width 240ms",
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                fontFamily: "var(--mono)",
              }}
            >
              {Math.round(pct * 100)}%
            </span>
          </div>
        )}

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {subtasks.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSubtask(s.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "9px 8px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  borderRadius: 6,
                  fontFamily: "var(--font)",
                  width: "100%",
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    marginTop: 1,
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `1.5px solid ${
                      s.done ? "var(--accent)" : "var(--border-hi)"
                    }`,
                    background: s.done ? "var(--accent)" : "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-fg)",
                    transition: "all 160ms",
                  }}
                >
                  {s.done && <Check size={12} strokeWidth={2.6} />}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.4,
                    color: s.done ? "var(--text-3)" : "var(--text)",
                    textDecoration: s.done ? "line-through" : "none",
                  }}
                >
                  {s.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
