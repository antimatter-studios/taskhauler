import { create } from "zustand";
import type { RegistryAlias } from "../api/types";

interface AgentStore {
  aliases: RegistryAlias[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

// Taskhauler has no agent registry — return empty list so the assignee
// autocomplete falls back to free-form typing.
export const useAgentStore = create<AgentStore>((set) => ({
  aliases: [],
  loading: false,
  error: null,
  fetch: async () => { set({ aliases: [] }); },
}));
