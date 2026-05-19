// ViewSwitcher — picks the right board view based on boardUIStore.view.
//
// Mounted inside Board.tsx's main-area slot (the shell agent wires this up
// during integration). The `activeBoardId` prop is unused here but kept in
// the signature so the shell can pass it in without churn later.

import { useBoardUIStore } from "@/stores/boardUIStore";
import { KanbanView } from "./KanbanView";
import { TimelineView } from "./TimelineView";
import { TerminalView } from "./TerminalView";
import { DispatchView } from "./DispatchView";

export interface ViewSwitcherProps {
  activeBoardId: string | null;
}

export function ViewSwitcher(_props: ViewSwitcherProps) {
  const view = useBoardUIStore((s) => s.view);
  if (view === "kanban") return <KanbanView />;
  if (view === "timeline") return <TimelineView />;
  if (view === "terminal") return <TerminalView />;
  if (view === "dispatch") return <DispatchView />;
  return null;
}
