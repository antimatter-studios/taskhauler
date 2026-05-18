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
// URL routing — /<board-prefix>/<card-number> e.g. /TH/45 or just /TH.
// Card segment may optionally include the prefix (TH-45 form); the parser
// extracts the trailing number either way so deep-links from other tools
// (Slack, GH issues) work whether they write /TH/45 or /TH/TH-45.
function parseUrl(pathname: string): {
  boardPrefix: string | null;
  cardNumber: number | null;
} {
  const parts = pathname.split("/").filter(Boolean);
  const boardPrefix = parts[0] ? parts[0].toUpperCase() : null;
  let cardNumber: number | null = null;
  if (parts[1]) {
    const m = /(\d+)$/.exec(parts[1]);
    if (m) cardNumber = Number(m[1]);
  }
  return { boardPrefix, cardNumber };
}

function buildUrl(prefix: string, cardNumber?: number | null): string {
  const p = (prefix || "BOARD").toUpperCase();
  return cardNumber ? `/${p}/${cardNumber}` : `/${p}`;
}

export default function Board() {
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const focusedCardId = useBoardUIStore((s) => s.focusedCardId);
  const selectCard = useBoardUIStore((s) => s.selectCard);
  const setFocusedCardId = useBoardUIStore((s) => s.focusCard);
  const fetchBoards = useKanbanStore((s) => s.fetchBoards);
  const fetchBoard = useKanbanStore((s) => s.fetchBoard);
  const setActiveBoard = useKanbanStore((s) => s.setActiveBoard);
  const activeBoardId = useKanbanStore((s) => s.activeBoardId);
  const boards = useKanbanStore((s) => s.boards);
  const cards = useKanbanStore((s) => s.cards);

  // Restore theme before first paint.
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  // On mount: read URL → choose board to make active (matches by prefix,
  // falls back to first). The card selection happens once cards have loaded
  // (separate effect below).
  useEffect(() => {
    const { boardPrefix } = parseUrl(window.location.pathname);
    fetchBoards()
      .then((bs) => {
        if (bs.length === 0) return;
        const match = boardPrefix
          ? bs.find((b) => (b.prefix || "").toUpperCase() === boardPrefix)
          : null;
        setActiveBoard((match ?? bs[0]).id);
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

  // Once cards have loaded for the active board, pick up the card number
  // from the URL (if any) and select it. Runs only when cards transition
  // from empty → populated.
  useEffect(() => {
    if (!activeBoardId || cards.length === 0) return;
    const { cardNumber } = parseUrl(window.location.pathname);
    if (cardNumber == null) return;
    const card = cards.find(
      (c) => c.board_id === activeBoardId && c.number === cardNumber
    );
    if (card && card.id !== selectedCardId) {
      selectCard(card.id);
    }
    // intentionally only depends on activeBoardId + cards.length — selecting
    // a card later shouldn't re-trigger this URL-restoration step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoardId, cards.length]);

  // History sync: whenever activeBoard or selectedCard changes, mirror the
  // state into the URL via replaceState so it's shareable but doesn't clog
  // the back stack on every click.
  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;
    const card = selectedCardId
      ? cards.find((c) => c.id === selectedCardId)
      : null;
    const url = buildUrl(board.prefix || "", card?.number ?? null);
    if (window.location.pathname !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [activeBoardId, selectedCardId, boards, cards]);

  // Back/forward: re-read the URL and propagate to stores.
  useEffect(() => {
    function onPop() {
      const { boardPrefix, cardNumber } = parseUrl(window.location.pathname);
      const target = boardPrefix
        ? boards.find((b) => (b.prefix || "").toUpperCase() === boardPrefix)
        : null;
      if (target && target.id !== activeBoardId) {
        setActiveBoard(target.id);
      }
      if (cardNumber != null) {
        const card = cards.find(
          (c) =>
            c.board_id === (target?.id ?? activeBoardId) &&
            c.number === cardNumber
        );
        if (card && card.id !== selectedCardId) selectCard(card.id);
      } else if (selectedCardId) {
        selectCard(null);
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [boards, cards, activeBoardId, selectedCardId, setActiveBoard, selectCard]);

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
