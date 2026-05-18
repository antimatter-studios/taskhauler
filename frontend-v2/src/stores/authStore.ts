import { create } from "zustand";
import { apiClient } from "../api/client";
import type { User } from "../api/types";

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.auth.login(email, password);
      set({ user: res.user, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      set({ user: null, loading: false, error: msg });
      throw err;
    }
  },

  logout: () => {
    apiClient.auth.logout();
    set({ user: null, error: null });
  },

  fetchMe: async () => {
    if (!apiClient.auth.isAuthenticated()) {
      set({ user: null, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const user = await apiClient.auth.me();
      set({ user, loading: false, error: null });
    } catch {
      // Token invalid; client already cleared storage on 401
      set({ user: null, loading: false });
    }
  },
}));
