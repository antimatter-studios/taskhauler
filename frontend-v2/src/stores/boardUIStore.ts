// Board-level UI state: which view is active, which rail tab is open,
// whether the console is collapsed, search query, etc.
//
// **NOT** card data — that's in kanbanStore. **NOT** auth — that's authStore.
// This store owns the ephemeral, presentation-only flags that drive layout
// chrome in the board shell.
//
// Two pieces are persisted to localStorage:
//   • consoleOpen → "taskhauler.console-open"
//   • railTab     → "taskhauler.rail-tab"
//
// Everything else (selection, focus, search, grouping, filter) resets on
// reload — those are session-scoped.

import { create } from "zustand";

export type ViewName = "kanban" | "timeline" | "terminal" | "dispatch";
export type GroupingMode = "col" | "priority" | "epic" | "assignee" | "due";
export type FilterMode = "all" | "mine" | "agents";
export type RailTab = "console" | "activity" | "plans";

const CONSOLE_KEY = "taskhauler.console-open";
const RAIL_KEY = "taskhauler.rail-tab";

function readConsoleOpen(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    const raw = localStorage.getItem(CONSOLE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function writeConsoleOpen(v: boolean): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CONSOLE_KEY, String(v));
  } catch {
    // ignore
  }
}

function readRailTab(): RailTab {
  if (typeof localStorage === "undefined") return "console";
  try {
    const raw = localStorage.getItem(RAIL_KEY);
    if (raw === "console" || raw === "activity" || raw === "plans") return raw;
  } catch {
    // fall through
  }
  return "console";
}

function writeRailTab(v: RailTab): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RAIL_KEY, v);
  } catch {
    // ignore
  }
}

interface BoardUIState {
  view: ViewName;
  grouping: GroupingMode;
  filterAssignee: FilterMode;
  consoleOpen: boolean;
  railTab: RailTab;
  selectedCardId: string | null;
  focusedCardId: string | null;
  searchQuery: string;

  setView: (v: ViewName) => void;
  setGrouping: (g: GroupingMode) => void;
  setFilter: (f: FilterMode) => void;
  setConsoleOpen: (b: boolean) => void;
  toggleConsole: () => void;
  setRailTab: (t: RailTab) => void;
  selectCard: (id: string | null) => void;
  focusCard: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useBoardUIStore = create<BoardUIState>((set, get) => ({
  view: "kanban",
  grouping: "col",
  filterAssignee: "all",
  consoleOpen: readConsoleOpen(),
  railTab: readRailTab(),
  selectedCardId: null,
  focusedCardId: null,
  searchQuery: "",

  setView: (view) => set({ view }),
  setGrouping: (grouping) => set({ grouping }),
  setFilter: (filterAssignee) => set({ filterAssignee }),
  setConsoleOpen: (consoleOpen) => {
    writeConsoleOpen(consoleOpen);
    set({ consoleOpen });
  },
  toggleConsole: () => {
    const next = !get().consoleOpen;
    writeConsoleOpen(next);
    set({ consoleOpen: next });
  },
  setRailTab: (railTab) => {
    writeRailTab(railTab);
    set({ railTab });
  },
  selectCard: (selectedCardId) => set({ selectedCardId }),
  focusCard: (focusedCardId) => set({ focusedCardId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
