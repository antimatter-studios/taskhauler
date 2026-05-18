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
    try {
      const users = await apiClient.users.listUsers();
      set({ users, error: null });
    } catch {
      set({ users: [], error: null });
    }
  },
}));
