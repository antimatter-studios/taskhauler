import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Maximize2, X, Sparkles, Trash2 } from "lucide-react";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { MOCK_ACTIVITY } from "@/mock/activity";
import type { ActivityEvent } from "@/mock/activity";
import { MOCK_SUGGESTIONS } from "@/mock/suggestions";
import { MOCK_TELEMETRY } from "@/mock/telemetry";
import { MOCK_USERS } from "@/mock/users";
import { fmtDue, fmtAgo } from "@/lib/time";
import type { Card, Comment } from "@/api/types";
import AssigneeChip from "../primitives/AssigneeChip";
import PriorityIndicator from "../primitives/PriorityIndicator";
import EpicChip from "../primitives/EpicChip";
import KeyHint from "../primitives/KeyHint";
import { ActivityRow } from "./ActivityRail";

interface CardDetailPanelProps {
  cardId: string;
}

/**
 * Deterministic mock estimate — mirrors the same hash used by KanbanCard so
 * the value is stable across renders without needing real estimate data.
 */
function mockEstimate(card: Card): number {
  let h = 0;
  for (let i = 0; i < card.id.length; i++) {
    h = (h * 31 + card.id.charCodeAt(i)) >>> 0;
  }
  // Common point values
  const buckets = [1, 2, 3, 5, 8, 13];
  return buckets[h % buckets.length];
}

/**
 * Sort cards by `number` ascending so mock-card-N → real card mapping is stable.
 */
function indexCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
}

/** Resolve a mock placeholder card_id to a real card. */
function resolveCardFromMock(
  mockId: string | undefined,
  sortedCards: Card[],
): Card | undefined {
  if (!mockId) return undefined;
  const m = /^mock-card-(\d+)$/.exec(mockId);
  if (!m) return sortedCards.find((c) => c.id === mockId);
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return sortedCards[n - 1];
}

/**
 * Reverse mapping: given a real card, find the mock placeholder id that
 * resolves to it ("mock-card-N" where N is the 1-based position in
 * `sortedCards`). Returns the real card id if it isn't a mock alias.
 *
 * We need this so we can look up MOCK_ACTIVITY and MOCK_SUGGESTIONS, which key
 * by `mock-card-N`, against the currently selected real card.
 */
function reverseMockId(
  card: Card | undefined,
  sortedCards: Card[],
): string | undefined {
  if (!card) return undefined;
  const idx = sortedCards.findIndex((c) => c.id === card.id);
  if (idx < 0) return card.id;
  return `mock-card-${idx + 1}`;
}

// ── CardDetailPanel ──────────────────────────────────────────────────────

export default function CardDetailPanel({ cardId }: CardDetailPanelProps) {
  const cards = useKanbanStore((s) => s.cards);
  const columns = useKanbanStore((s) => s.columns);
  const epics = useKanbanStore((s) => s.epics);
  const boards = useKanbanStore((s) => s.boards);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const listComments = useKanbanStore((s) => s.listComments);
  const createComment = useKanbanStore((s) => s.createComment);
  const deleteComment = useKanbanStore((s) => s.deleteComment);

  const selectCard = useBoardUIStore((s) => s.selectCard);
  const focusCard = useBoardUIStore((s) => s.focusCard);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const cardPrefix = (activeBoard?.prefix || "TH").toUpperCase();

  const sortedCards = useMemo(() => indexCards(cards), [cards]);
  const card = cards.find((c) => c.id === cardId);

  // ── Comments: real, from /api/v1/cards/:cid/comments ────────────────────
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) {
      setComments([]);
      return;
    }
    let alive = true;
    setCommentsError(null);
    listComments(cardId)
      .then((list) => {
        if (alive) setComments(list);
      })
      .catch((e) => {
        if (alive) setCommentsError(String(e?.message ?? e));
      });
    return () => {
      alive = false;
    };
  }, [cardId, listComments]);

  async function handleAddComment(): Promise<void> {
    const body = draft.trim();
    if (!body || !cardId) return;
    setPostingComment(true);
    try {
      const created = await createComment(cardId, body);
      setComments((prev) => [...prev, created]);
      setDraft("");
    } catch (e) {
      setCommentsError(String((e as Error)?.message ?? e));
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string): Promise<void> {
    if (!cardId) return;
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteComment(cardId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      setCommentsError(String((e as Error)?.message ?? e));
    }
  }

  if (!card) {
    return (
      <div
        style={{
          padding: 16,
          color: "var(--text-3)",
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Card not found.</span>
          <button
            type="button"
            onClick={() => selectCard(null)}
            style={{
              height: 24,
              padding: "0 8px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--bg)",
              color: "var(--text-2)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const column = columns.find((c) => c.id === card.column_id);
  const epic = epics.find((e) => e.id === card.epic_id);
  const due = fmtDue(card.due_date);
  const estimate = mockEstimate(card);
  const labelList = (card.labels || "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  // Telemetry: is the assigned agent working?
  const agentTelemetry = card.assignee_agent
    ? MOCK_TELEMETRY.find((t) => t.name === card.assignee_agent)
    : undefined;
  const agentWorking = agentTelemetry?.status === "working";

  // Resolved name for the assignee.
  const assigneeUser = card.assignee_id
    ? MOCK_USERS.find((u) => u.id === card.assignee_id)
    : undefined;
  const assigneeName = card.assignee_agent
    ? `@${card.assignee_agent}`
    : assigneeUser?.display_name || card.assignee_name || "Unassigned";

  // Activity events for this card. We accept matches against either the real
  // card id OR the mock placeholder id that maps to this card.
  const mockAlias = reverseMockId(card, sortedCards);
  const cardActivity = MOCK_ACTIVITY.filter(
    (a) => a.card_id === card.id || (mockAlias && a.card_id === mockAlias),
  );

  // AI suggestion for this card.
  const suggestion = MOCK_SUGGESTIONS.find(
    (s) =>
      s.card_id === card.id || (mockAlias && s.card_id === mockAlias),
  );

  const sectionHeaderStyle: CSSProperties = {
    fontSize: 10,
    color: "var(--text-3)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: "var(--mono)",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          height: 44,
          padding: "0 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: "0 0 44px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--text-3)",
          }}
        >
          {cardPrefix}-{card.number}
        </span>
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            gap: 4,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => focusCard(card.id)}
            title="Focus mode (F)"
            style={{
              height: 24,
              padding: "0 8px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--surface)",
              color: "var(--text-2)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Maximize2 size={11} />
            Focus
            <KeyHint>F</KeyHint>
          </button>
          <button
            type="button"
            onClick={() => selectCard(null)}
            title="Close"
            style={{
              height: 24,
              padding: "0 8px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--bg)",
              color: "var(--text-2)",
              fontSize: 11,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <X size={11} />
            Close
          </button>
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minHeight: 0,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: -0.2,
            color: "var(--text)",
          }}
        >
          {card.title}
        </h3>

        {/* Metadata grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr",
            rowGap: 8,
            columnGap: 12,
            fontSize: 12,
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--text-3)" }}>Status</span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: "var(--accent)",
                flex: "0 0 auto",
              }}
            />
            <span>{column?.name ?? "—"}</span>
          </span>

          <span style={{ color: "var(--text-3)" }}>Priority</span>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <PriorityIndicator priority={card.priority} />
            <span>
              {card.priority
                ? card.priority[0].toUpperCase() + card.priority.slice(1)
                : "—"}
            </span>
          </span>

          <span style={{ color: "var(--text-3)" }}>Assignee</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            {card.assignee_id || card.assignee_agent ? (
              <>
                <AssigneeChip
                  userId={card.assignee_id || undefined}
                  agentName={card.assignee_agent || undefined}
                  size={18}
                  working={agentWorking}
                />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {assigneeName}
                </span>
                {agentWorking && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--green)",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      flex: "0 0 auto",
                      letterSpacing: 0.4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 99,
                        background: "var(--green)",
                        animation: "presence-pulse 1.6s infinite",
                      }}
                    />
                    WORKING
                  </span>
                )}
              </>
            ) : (
              <span style={{ color: "var(--text-3)" }}>Unassigned</span>
            )}
          </span>

          <span style={{ color: "var(--text-3)" }}>Epic</span>
          <span>
            {epic ? (
              <EpicChip epic={epic} />
            ) : (
              <span style={{ color: "var(--text-3)" }}>—</span>
            )}
          </span>

          <span style={{ color: "var(--text-3)" }}>Due</span>
          <span
            style={{
              color: due.overdue ? "var(--red)" : "var(--text)",
              fontWeight: due.overdue ? 700 : 400,
            }}
          >
            {due.txt || "—"}
          </span>

          <span style={{ color: "var(--text-3)" }}>Estimate</span>
          <span style={{ fontFamily: "var(--mono)" }}>{estimate} pt</span>

          <span style={{ color: "var(--text-3)" }}>Labels</span>
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {labelList.length === 0 ? (
              <span style={{ color: "var(--text-3)" }}>—</span>
            ) : (
              labelList.map((l) => (
                <span
                  key={l}
                  style={{
                    fontSize: 10.5,
                    padding: "1px 6px",
                    border: "1px solid var(--border)",
                    borderRadius: 3,
                    color: "var(--text-2)",
                  }}
                >
                  {l}
                </span>
              ))
            )}
          </span>
        </div>

        {cardActivity.length > 0 && (
          <div>
            <div style={sectionHeaderStyle}>Agent activity</div>
            <div
              style={{
                position: "relative",
                marginLeft: -12,
                marginRight: -12,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 24,
                  top: 8,
                  bottom: 8,
                  width: 1,
                  background: "var(--border)",
                }}
              />
              {cardActivity.map((it: ActivityEvent) => (
                <ActivityRow
                  key={it.id}
                  item={it}
                  isNewest={false}
                  resolvedCard={resolveCardFromMock(it.card_id, sortedCards)}
                  onOpenCard={selectCard}
                />
              ))}
            </div>
          </div>
        )}

        {/* Real comments from /api/v1/cards/:cid/comments */}
        <div>
          <div style={sectionHeaderStyle}>
            Comments {comments.length > 0 && <span style={{ color: "var(--text-2)", marginLeft: 4 }}>· {comments.length}</span>}
          </div>
          {commentsError && (
            <div
              style={{
                fontSize: 11,
                color: "var(--red)",
                padding: 8,
                border: "1px solid var(--red)",
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              {commentsError}
            </div>
          )}
          {comments.length === 0 ? (
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              No comments yet.
            </span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 10,
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg)",
                    fontSize: 12,
                    color: "var(--text)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                      fontSize: 10.5,
                      color: "var(--text-3)",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "var(--text-2)" }}>
                      {c.author_name || `user #${c.author_id}` || "unknown"}
                    </span>
                    <span title={new Date(c.created_at).toLocaleString()}>
                      {fmtAgo(c.created_at)} ago
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      title="Delete comment"
                      style={{
                        marginLeft: "auto",
                        height: 20,
                        padding: "0 4px",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-3)",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{c.body}</div>
                </div>
              ))}
            </div>
          )}

          {/* Add-comment composer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="Write a comment…"
              rows={3}
              style={{
                resize: "vertical",
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                padding: 8,
                border: "1px solid var(--border)",
                borderRadius: 4,
                background: "var(--surface)",
                color: "var(--text)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>⌘/Ctrl + Enter</span>
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!draft.trim() || postingComment}
                style={{
                  marginLeft: "auto",
                  height: 24,
                  padding: "0 10px",
                  border: "1px solid var(--accent)",
                  borderRadius: 4,
                  background: !draft.trim() ? "var(--bg)" : "var(--accent)",
                  color: !draft.trim() ? "var(--text-3)" : "var(--accent-fg)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: !draft.trim() || postingComment ? "not-allowed" : "pointer",
                  opacity: !draft.trim() || postingComment ? 0.6 : 1,
                }}
              >
                {postingComment ? "Posting…" : "Add comment"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div style={sectionHeaderStyle}>AI suggested</div>
          {suggestion ? (
            <SuggestionRow text={suggestion.text} />
          ) : (
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              No suggestions for this card.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({ text }: { text: string }): ReactNode {
  const handleApply = () => {
    // eslint-disable-next-line no-alert
    alert(`Apply suggestion would execute server-side; not yet wired.\n\n${text}`);
  };
  return (
    <button
      type="button"
      onClick={handleApply}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: 10,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "var(--bg)",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--text)",
        fontFamily: "var(--font)",
      }}
    >
      <Sparkles size={14} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{text}</span>
      <span
        style={{
          marginLeft: "auto",
          color: "var(--accent)",
          fontWeight: 600,
          fontSize: 11,
          flex: "0 0 auto",
        }}
      >
        Apply
      </span>
    </button>
  );
}
