import { useBoardUIStore } from "@/stores/boardUIStore";
import CardDetailPanel from "./rail/CardDetailPanel";
import RailTabs from "./rail/RailTabs";
import ConsoleRail from "./rail/ConsoleRail";
import ActivityRail from "./rail/ActivityRail";
import PlansRail from "./rail/PlansRail";

/**
 * Right rail — 340px wide, full main-area height.
 * Visible when consoleOpen OR a card is selected.
 *
 * If a card is selected: shows CardDetailPanel (with optional "Back to console"
 * link when console is also open). Otherwise: shows RailTabs + the active tab's
 * subcomponent.
 */
export default function BoardRightRail() {
  const selectedCardId = useBoardUIStore((s) => s.selectedCardId);
  const consoleOpen = useBoardUIStore((s) => s.consoleOpen);
  const setSelectedCardId = useBoardUIStore(
    (s) => (s as any).setSelectedCardId
  );
  const railTab = useBoardUIStore((s) => s.railTab) as string;

  if (!consoleOpen && selectedCardId == null) return null;

  return (
    <aside
      className="flex h-full flex-col overflow-hidden border-l"
      style={{
        width: 340,
        flex: "0 0 340px",
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {selectedCardId != null ? (
        <>
          {consoleOpen && (
            <button
              type="button"
              onClick={() => setSelectedCardId?.(null)}
              className="flex items-center gap-2 text-left transition-colors hover:bg-[var(--hover)]"
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--accent)",
                fontSize: 11.5,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                borderBottomWidth: 1,
                borderBottomStyle: "solid",
                borderBottomColor: "var(--border)",
              }}
            >
              ← Back to console
            </button>
          )}
          <CardDetailPanel cardId={selectedCardId} />
        </>
      ) : (
        <>
          <RailTabs />
          {railTab === "console" && <ConsoleRail />}
          {railTab === "activity" && <ActivityRail />}
          {railTab === "plans" && <PlansRail />}
        </>
      )}
    </aside>
  );
}
