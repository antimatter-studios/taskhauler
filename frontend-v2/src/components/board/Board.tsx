import { useEffect } from "react";
import { useBoardUIStore } from "@/stores/boardUIStore";
import { useKanbanStore } from "@/stores/kanbanStore";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import BoardSidebar from "./BoardSidebar";
import BoardTopBar from "./BoardTopBar";
import BoardFilterRow from "./BoardFilterRow";
import BoardAISuggestionStrip from "./BoardAISuggestionStrip";
import BoardRightRail from "./BoardRightRail";
import FocusModal from "./overlays/FocusModal";
import { ViewSwitcher } from "./views/ViewSwitcher";

/**
 * Top-level board shell.
 * Layout: sidebar | main column (top bar, filter row, AI strip, view slot) | right rail
 * Mounts theme restoration + global keyboard shortcuts.
 */
export default function Board() {
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const focusedCardId = useBoardUIStore((s) => s.focusedCardId);
  const setFocusedCardId = useBoardUIStore((s) => (s as any).setFocusedCardId);
  const fetchBoards = useKanbanStore((s) => s.fetchBoards);
  const fetchBoard = useKanbanStore((s) => s.fetchBoard);
  const setActiveBoard = useKanbanStore((s) => s.setActiveBoard);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);

  // Restore theme before first paint.
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  // Load boards on mount; pick the first one as active.
  useEffect(() => {
    fetchBoards()
      .then((boards) => {
        if (boards.length > 0 && !activeBoardId) {
          setActiveBoard(boards[0].id);
        }
      })
      .catch((e) => console.error("fetchBoards failed:", e));
    // intentionally empty deps — only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the active board changes, load its columns/epics/cards.
  useEffect(() => {
    if (activeBoardId) {
      fetchBoard(activeBoardId).catch((e) =>
        console.error("fetchBoard failed:", e)
      );
    }
  }, [activeBoardId, fetchBoard]);

  // Global keyboard shortcuts: F (focus), Esc (clear focus), C (new issue), ⌘K (search).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "Escape" && focusedCardId != null) {
        e.preventDefault();
        setFocusedCardId?.(null);
        return;
      }

      if (isInput) return;

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        console.log("[shortcut] ⌘K search (no-op)");
        return;
      }

      if (e.key === "f" || e.key === "F") {
        if (selectedCardId != null && focusedCardId == null) {
          e.preventDefault();
          setFocusedCardId?.(selectedCardId);
        }
        return;
      }

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        console.log("[shortcut] C new issue (no-op)");
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCardId, focusedCardId, setFocusedCardId]);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font)",
        fontSize: 13,
      }}
    >
      <BoardSidebar />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <BoardTopBar />
        <BoardFilterRow />
        <BoardAISuggestionStrip />
        <div
          id="view-slot"
          className="flex-1 overflow-auto"
          style={{ background: "var(--bg)" }}
        >
          <ViewSwitcher activeBoardId={activeBoardId} />
        </div>
      </div>

      <BoardRightRail />

      <FocusModal />
    </div>
  );
}
