import { Inbox, KanbanSquare, Sparkles, Filter, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useKanbanStore } from "@/stores/kanbanStore";
import { MOCK_INBOX } from "@/mock/inbox";
import { MOCK_SUGGESTIONS } from "@/mock/suggestions";
import UserChip from "./primitives/UserChip";

const SAVED_VIEWS = ["Urgent + overdue", "Agent work in flight", "This week"];

/**
 * Left rail — 200px wide, full height.
 * Workspace switcher → top-level nav → boards list → saved views → user chip.
 */
export default function BoardSidebar() {
  const user = useAuthStore((s) => s.user);
  const boards = useKanbanStore((s) => s.boards);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const setActiveBoard = useKanbanStore((s) => s.setActiveBoard);
  const cards = useKanbanStore((s) => s.cards);

  const myIssuesCount = user
    ? cards.filter((c) => c.assignee_id === user.id).length
    : 0;
  const inboxCount = (MOCK_INBOX as { length: number } | undefined)?.length ?? 0;
  const suggestionsCount = MOCK_SUGGESTIONS?.length ?? 0;

  return (
    <aside
      className="flex h-full flex-col gap-4 border-r"
      style={{
        width: 200,
        flex: "0 0 200px",
        background: "var(--bg)",
        borderColor: "var(--border)",
        padding: 12,
      }}
    >
      {/* Workspace switcher */}
      <button
        type="button"
        className="flex items-center gap-2 rounded text-left hover:opacity-90"
        style={{ padding: "2px 4px" }}
      >
        <span
          className="flex items-center justify-center font-extrabold"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: "linear-gradient(135deg, var(--accent), #7c3aed)",
            color: "#fff",
            fontSize: 12,
            fontFamily: "var(--mono)",
          }}
        >
          T
        </span>
        <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: -0.2 }}>
          Taskhauler
        </span>
        <ChevronDown size={12} style={{ color: "var(--text-3)" }} />
      </button>

      {/* Top-level nav */}
      <nav className="flex flex-col" style={{ gap: 1 }}>
        <NavRow icon={<Inbox size={13} />} label="Inbox" count={inboxCount} />
        <NavRow
          icon={<KanbanSquare size={13} />}
          label="My issues"
          count={myIssuesCount}
        />
        <NavRow
          icon={<Sparkles size={13} />}
          label="AI suggestions"
          count={suggestionsCount}
        />
      </nav>

      {/* Boards */}
      <div>
        <SectionHeader>Boards</SectionHeader>
        {boards.length === 0 && (
          <div
            className="px-2 py-1"
            style={{ fontSize: 11, color: "var(--text-3)" }}
          >
            No boards yet
          </div>
        )}
        {boards.map((b) => {
          const active = b.id === activeBoardId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveBoard(b.id)}
              className="flex w-full items-center gap-2 text-left"
              style={{
                padding: "5px 8px",
                fontSize: 12,
                color: active ? "var(--text)" : "var(--text-2)",
                background: active ? "var(--surface)" : "transparent",
                border: active ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: active ? "var(--accent)" : "var(--border-hi)",
                  flex: "0 0 auto",
                }}
              />
              <span
                className="truncate"
                style={{ fontWeight: active ? 600 : 400 }}
              >
                {b.name}
              </span>
              <span
                className="ml-auto"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--text-3)",
                }}
              >
                {b.prefix}
              </span>
            </button>
          );
        })}
      </div>

      {/* Saved views */}
      <div>
        <SectionHeader>Saved views</SectionHeader>
        {SAVED_VIEWS.map((label) => (
          <button
            key={label}
            type="button"
            className="flex w-full items-center gap-2 rounded text-left"
            style={{
              padding: "5px 8px",
              fontSize: 12,
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            <Filter size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Current user */}
      <div
        className="mt-auto flex items-center gap-2"
        style={{ padding: "6px 4px", color: "var(--text-3)", fontSize: 11 }}
      >
        {user && (
          <UserChip
            user={{
              id: user.id,
              display_name: user.display_name || user.email,
            }}
            size={20}
          />
        )}
        <span className="truncate">
          {user?.display_name || user?.email || "—"}
        </span>
      </div>
    </aside>
  );
}

function NavRow({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded text-left hover:bg-[var(--hover)]"
      style={{
        padding: "5px 8px",
        fontSize: 12,
        color: "var(--text-2)",
        cursor: "pointer",
      }}
    >
      <span style={{ color: "var(--text-2)" }}>{icon}</span>
      <span>{label}</span>
      <span
        className="ml-auto"
        style={{ fontSize: 10.5, color: "var(--text-3)" }}
      >
        {count}
      </span>
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        padding: "4px 8px",
      }}
    >
      {children}
    </div>
  );
}
