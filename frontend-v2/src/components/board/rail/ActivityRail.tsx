import { useMemo, useState, type CSSProperties } from "react";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { MOCK_ACTIVITY } from "@/mock/activity";
import type { ActivityEvent, ActivityKind } from "@/mock/activity";
import { MOCK_USERS } from "@/mock/users";
import { fmtAgo } from "@/lib/time";
import type { Card } from "@/api/types";
import UserChip from "../primitives/UserChip";
import AgentChip from "../primitives/AgentChip";

// Two-level filter: maps the UI chip ID to a predicate over ActivityKind.
type FilterId = "all" | "agent" | "comment" | "ship";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agents" },
  { id: "comment", label: "Comments" },
  { id: "ship", label: "Ships" },
];

function eventMatchesFilter(e: ActivityEvent, f: FilterId): boolean {
  if (f === "all") return true;
  return e.kind === f;
}

interface KindMeta {
  color: string;
  label: string;
}

function kindMeta(kind: ActivityKind): KindMeta {
  switch (kind) {
    case "agent":
      return { color: "var(--accent)", label: "AGENT" };
    case "comment":
      return { color: "var(--text-2)", label: "NOTE" };
    case "move":
      return { color: "var(--green)", label: "MOVE" };
    case "assign":
      return { color: "var(--amber)", label: "ASSIGN" };
    case "create":
      return { color: "var(--text-2)", label: "NEW" };
    case "ship":
      return { color: "var(--green)", label: "SHIP" };
    case "label":
      return { color: "var(--text-3)", label: "LABEL" };
    case "priority":
      return { color: "var(--red)", label: "PRIORITY" };
    default:
      return { color: "var(--text-3)", label: "" };
  }
}

function resolveCard(
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

// ── ActivityRow ──────────────────────────────────────────────────────────

interface ActivityRowProps {
  item: ActivityEvent;
  isNewest: boolean;
  resolvedCard: Card | undefined;
  onOpenCard: (cardId: string) => void;
}

export function ActivityRow({
  item,
  isNewest,
  resolvedCard,
  onOpenCard,
}: ActivityRowProps) {
  const isAgent = !!item.agent_name;
  const actorName = isAgent
    ? `@${item.agent_name}`
    : MOCK_USERS.find((u) => u.id === item.user_id)?.display_name || "Unknown";
  const meta = kindMeta(item.kind);

  const containerStyle: CSSProperties = {
    display: "flex",
    gap: 10,
    padding: "8px 12px",
    position: "relative",
    animation: isNewest
      ? "fade-in 320ms cubic-bezier(.2,.7,.3,1)"
      : "none",
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: "relative", zIndex: 1, flex: "0 0 auto" }}>
        {isAgent ? (
          <AgentChip name={item.agent_name ?? "?"} size={22} />
        ) : (
          <UserChip
            user={
              MOCK_USERS.find((u) => u.id === item.user_id) ?? {
                display_name: actorName,
              }
            }
            size={22}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              fontSize: 11.5,
              color: "var(--text)",
              fontFamily: isAgent ? "var(--mono)" : "var(--font)",
            }}
          >
            {actorName}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: meta.color,
              letterSpacing: 0.5,
              padding: "1px 5px",
              border: `1px solid color-mix(in srgb, ${meta.color} 33%, transparent)`,
              borderRadius: 3,
              fontFamily: "var(--mono)",
            }}
          >
            {meta.label}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "var(--text-3)",
              fontFamily: "var(--mono)",
            }}
          >
            {fmtAgo(item.at)} ago
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-2)",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {item.text}
        </div>
        {resolvedCard && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenCard(resolvedCard.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenCard(resolvedCard.id);
              }
            }}
            style={{
              marginTop: 4,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "1px 6px",
              border: "1px solid var(--border)",
              borderRadius: 3,
              background: "var(--bg)",
              fontSize: 10,
              color: "var(--text-3)",
              fontFamily: "var(--mono)",
              cursor: "pointer",
              maxWidth: "100%",
            }}
          >
            HAUL-{resolvedCard.number}
            <span
              style={{
                color: "var(--text-2)",
                fontFamily: "var(--font)",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              · {resolvedCard.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActivityRail ─────────────────────────────────────────────────────────

/**
 * Chronological activity feed for the right rail.
 *
 * - Top filter row (All / Agents / Comments / Ships)
 * - Body grouped into Just now (<0.5h) / Earlier today (0.5–8h) / Yesterday+
 *   with a subtle 1px vertical connector line at x=24 per group.
 */
export default function ActivityRail() {
  const [filter, setFilter] = useState<FilterId>("all");
  const cards = useKanbanStore((s) => s.cards);
  const selectCard = useBoardUIStore((s) => s.selectCard);

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    [cards],
  );

  const items = useMemo(() => {
    return [...MOCK_ACTIVITY]
      .filter((e) => eventMatchesFilter(e, filter))
      .sort((a, b) => b.at - a.at);
  }, [filter]);

  const groups = useMemo(() => {
    const now = Date.now();
    const g: Record<"now" | "today" | "earlier", ActivityEvent[]> = {
      now: [],
      today: [],
      earlier: [],
    };
    for (const it of items) {
      const diffH = (now - it.at) / 3_600_000;
      if (diffH < 0.5) g.now.push(it);
      else if (diffH < 8) g.today.push(it);
      else g.earlier.push(it);
    }
    return g;
  }, [items]);

  const groupDefs: { key: "now" | "today" | "earlier"; label: string }[] = [
    { key: "now", label: "JUST NOW" },
    { key: "today", label: "EARLIER TODAY" },
    { key: "earlier", label: "YESTERDAY+" },
  ];

  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Filter chip row */}
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flex: "0 0 auto",
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                height: 22,
                padding: "0 9px",
                borderRadius: 99,
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-2)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font)",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Groups */}
      {groupDefs.map(({ key, label }) => {
        const list = groups[key];
        if (!list.length) return null;
        return (
          <div key={key}>
            <div
              style={{
                padding: "10px 12px 4px",
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                borderBottom: "1px solid var(--border)",
                background: "var(--bg)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-3)",
                  fontWeight: 700,
                  letterSpacing: 1.3,
                  fontFamily: "var(--mono)",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  fontFamily: "var(--font)",
                }}
              >
                {list.length} {list.length === 1 ? "event" : "events"}
              </span>
            </div>
            <div style={{ padding: "4px 0", position: "relative" }}>
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
              {list.map((it, idx) => (
                <ActivityRow
                  key={it.id}
                  item={it}
                  isNewest={key === "now" && idx === 0}
                  resolvedCard={resolveCard(it.card_id, sortedCards)}
                  onOpenCard={selectCard}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
