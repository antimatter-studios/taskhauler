import { Search, Plus } from "lucide-react";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { MOCK_PRESENCE } from "@/mock/presence";
import { MOCK_AGENTS } from "@/mock/agents";
import { applyTheme, persistTheme, getStoredTheme } from "@/lib/theme";
import PresenceCluster from "./primitives/PresenceCluster";
import KeyHint from "./primitives/KeyHint";
import { useState } from "react";

/**
 * Top bar — 44px tall. Breadcrumb left, presence + theme + search + actions right.
 */
export default function BoardTopBar() {
  const boards = useKanbanStore((s) => s.boards);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const cards = useKanbanStore((s) => s.cards);
  const consoleOpen = useBoardUIStore((s) => s.consoleOpen);
  const setConsoleOpen = useBoardUIStore((s) => (s as any).setConsoleOpen);
  const searchQuery = useBoardUIStore((s) => s.searchQuery);
  const setSearchQuery = useBoardUIStore((s) => (s as any).setSearchQuery);

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const filtered = cards; // filter logic lives in the views layer
  const total = cards.length;

  const workingAgents = (MOCK_AGENTS || []).filter(
    (a) => (a as { status?: string }).status === "working"
  ).length;
  const totalAgents = (MOCK_AGENTS || []).length;

  const presenceEntries = (MOCK_PRESENCE || []).slice(0, 5);

  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 44,
        padding: "0 14px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flex: "0 0 44px",
      }}
    >
      {/* Breadcrumb */}
      <span style={{ fontWeight: 600, fontSize: 13 }}>
        {activeBoard?.name || "Board"}
      </span>
      <span style={{ color: "var(--text-3)" }}>/</span>
      <span style={{ fontSize: 12, color: "var(--text-2)" }}>All issues</span>
      <span
        style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 4 }}
      >
        · {filtered.length} of {total}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <PresenceCluster entries={presenceEntries as any} size={24} showLabel />

        <ThemeSwitcher />

        <SearchPill value={searchQuery} onChange={setSearchQuery} />

        <button
          type="button"
          className="inline-flex items-center gap-2 transition-colors hover:bg-[var(--hover)]"
          style={{
            height: 28,
            padding: "0 10px",
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--surface)",
            color: "var(--text)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Plus size={12} />
          New issue
          <KeyHint>C</KeyHint>
        </button>

        <button
          type="button"
          onClick={() => setConsoleOpen?.(!consoleOpen)}
          title={consoleOpen ? "Hide console" : "Show console"}
          className="inline-flex items-center gap-2 transition-colors"
          style={{
            height: 28,
            padding: "0 10px",
            border: `1px solid ${
              consoleOpen ? "var(--accent)" : "var(--border)"
            }`,
            borderRadius: 6,
            background: consoleOpen ? "var(--accent-bg)" : "var(--surface)",
            color: consoleOpen ? "var(--accent)" : "var(--text-2)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              position: "relative",
              width: 8,
              height: 8,
              borderRadius: 99,
              background: "var(--green)",
              boxShadow: "0 0 0 2px color-mix(in srgb, var(--green) 20%, transparent)",
              animation: "presence-pulse 1.6s ease-in-out infinite",
              display: "inline-block",
            }}
          />
          Console
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: consoleOpen ? "var(--accent)" : "var(--text-3)",
            }}
          >
            {workingAgents}/{totalAgents}
          </span>
        </button>
      </div>
    </div>
  );
}

function SearchPill({
  value,
  onChange,
}: {
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 28,
        padding: "0 8px",
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "var(--bg)",
        color: "var(--text-3)",
        fontSize: 12,
        width: 220,
      }}
    >
      <Search size={12} />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search or jump to…"
        className="flex-1 bg-transparent outline-none"
        style={{ color: "var(--text)", fontSize: 12, minWidth: 0 }}
      />
      <KeyHint>⌘K</KeyHint>
    </div>
  );
}

/**
 * 3-swatch theme switcher (Day / Mono / Paper). Each swatch is 22×22 with a
 * 14×14 mini-square showing that theme's bg + an accent dot. Active swatch
 * has a filled outer ring.
 */
function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(() => getStoredTheme());

  const onClick = (name: string) => {
    persistTheme(name as any);
    applyTheme(name as any);
    setTheme(name);
  };

  // THEMES from @/lib/theme is just the name list (string[]); we need the
  // swatch palette here, so define it inline.
  const themes: { name: string; bg: string; accent: string; surface: string }[] = [
    { name: "day", bg: "#fafaf9", accent: "#5b5bd6", surface: "#ffffff" },
    { name: "mono", bg: "#0c0c0a", accent: "#facc15", surface: "#15140f" },
    { name: "paper", bg: "#f5f0e2", accent: "#9a3412", surface: "#fbf7e9" },
  ];

  return (
    <div
      title="Theme"
      className="flex items-center"
      style={{
        gap: 2,
        height: 28,
        padding: 2,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "var(--bg)",
      }}
    >
      {themes.map((t: any) => {
        const active = theme === t.name;
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => onClick(t.name)}
            title={(t.name as string).replace(/^./, (s) => s.toUpperCase())}
            className="flex items-center justify-center transition-colors"
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background: active ? t.accent : "transparent",
              padding: 0,
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: t.bg,
                border: `1.5px solid ${active ? t.surface : t.accent}`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: t.accent,
                }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
