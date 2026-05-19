import { create } from "zustand";
import { apiClient } from "../api/client";
import type { UserDetails } from "../api/types";

interface UserStore {
  users: UserDetails[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

// Backed by GET /api/v1/users — but the endpoint may not exist yet.
// If it 404s/501s we just return [], which means the assignee autocomplete
// falls back to free-form typing.
export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true });
    try {
      const users = await apiClient.users.listUsers();
      set({ users, error: null, loading: false });
    } catch {
      // 404/501 from a not-yet-implemented endpoint isn't an error path the UI
      // surfaces — fall back to an empty list silently.
      set({ users: [], error: null, loading: false });
    }
  },
}));
