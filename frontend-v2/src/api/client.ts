// Local fetch-based API client for the taskhauler backend.
// Base URL is same-origin: requests go to `/api/v1/...`.
// JWT access token is stored in localStorage. On 401 the client attempts
// to refresh using the stored refresh token; on persistent failure it
// clears storage and the auth store reflects logged-out state.

import type {
  AuthResponse,
  Board,
  Card,
  Column,
  Comment,
  CreateCardRequest,
  Epic,
  UpdateCardRequest,
  User,
  UserDetails,
} from "./types";

const TOKEN_KEY = "taskhauler_token";
const REFRESH_KEY = "taskhauler_refresh_token";
// Full URL of the v1 API. v2 is served from a different origin than the API
// (taskhauler-v2.localhost vs. taskhauler.localhost/api/v1), so this must be
// an absolute URL — same-origin fetches would only work via the vite dev
// proxy and would break under prod nginx.
const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://taskhauler.localhost/api/v1";

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string | null) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}
function getRefresh(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
function setRefresh(t: string | null) {
  try {
    if (t) localStorage.setItem(REFRESH_KEY, t);
    else localStorage.removeItem(REFRESH_KEY);
  } catch { /* ignore */ }
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const r = getRefresh();
  if (!r) return null;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: r }),
      });
      if (!res.ok) return null;
      const body = await res.json() as { access_token: string };
      setToken(body.access_token);
      return body.access_token;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function clearAuth() {
  setToken(null);
  setRefresh(null);
}

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  const tok = getToken();
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, init);

  if (res.status === 401 && !retried && getRefresh()) {
    const fresh = await doRefresh();
    if (fresh) return request<T>(method, path, body, true);
    clearAuth();
    throw new ApiError("unauthorized", 401);
  }

  if (res.status === 401) {
    clearAuth();
    throw new ApiError("unauthorized", 401);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j && typeof j === "object" && "error" in j) msg = String((j as { error: string }).error);
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }

  if (res.status === 204) return undefined as T;
  // tolerate empty bodies
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

const http = {
  get: <T,>(p: string) => request<T>("GET", p),
  post: <T,>(p: string, body?: unknown) => request<T>("POST", p, body),
  put: <T,>(p: string, body?: unknown) => request<T>("PUT", p, body),
  delete: <T = void,>(p: string) => request<T>("DELETE", p),
};

// ── Tasks API ────────────────────────────────────────────────────────────────

const tasks = {
  // Boards
  listBoards: () => http.get<Board[]>(`/boards`),
  createBoard: (data: { name: string; prefix?: string; description?: string }) =>
    http.post<Board>(`/boards`, data),
  getBoard: (id: string) => http.get<Board>(`/boards/${id}`),
  updateBoard: (id: string, data: { name?: string; prefix?: string; description?: string }) =>
    http.put<Board>(`/boards/${id}`, data),
  deleteBoard: (id: string) => http.delete<void>(`/boards/${id}`),

  // Columns
  listColumns: (boardId: string) => http.get<Column[]>(`/boards/${boardId}/columns`),
  createColumn: (boardId: string, data: { name: string; position?: number }) =>
    http.post<Column>(`/boards/${boardId}/columns`, data),
  updateColumn: (boardId: string, colId: string, data: { name?: string; position?: number }) =>
    http.put<Column>(`/boards/${boardId}/columns/${colId}`, data),
  deleteColumn: (boardId: string, colId: string) =>
    http.delete<void>(`/boards/${boardId}/columns/${colId}`),

  // Epics
  listEpics: (boardId: string) => http.get<Epic[]>(`/boards/${boardId}/epics`),
  createEpic: (boardId: string, data: {
    name: string;
    description?: string;
    color?: string;
    position?: number;
  }) => http.post<Epic>(`/boards/${boardId}/epics`, data),
  updateEpic: (boardId: string, epicId: string, data: {
    name?: string;
    description?: string;
    color?: string;
    position?: number;
  }) => http.put<Epic>(`/boards/${boardId}/epics/${epicId}`, data),
  deleteEpic: (boardId: string, epicId: string) =>
    http.delete<void>(`/boards/${boardId}/epics/${epicId}`),

  // Cards
  listCards: (boardId: string) => http.get<Card[]>(`/boards/${boardId}/cards`),
  getCardByNumber: (boardId: string, number: number) =>
    http.get<Card>(`/boards/${boardId}/cards/number/${number}`),
  searchCards: (boardId: string, query: string) =>
    http.get<Card[]>(`/boards/${boardId}/cards/search?q=${encodeURIComponent(query)}`),
  createCard: (boardId: string, data: CreateCardRequest) =>
    http.post<Card>(`/boards/${boardId}/cards`, data),
  updateCard: (boardId: string, cardId: string, data: UpdateCardRequest) =>
    http.put<Card>(`/boards/${boardId}/cards/${cardId}`, data),
  deleteCard: (boardId: string, cardId: string) =>
    http.delete<void>(`/boards/${boardId}/cards/${cardId}`),

  // Comments
  listComments: (cardId: string) => http.get<Comment[]>(`/cards/${cardId}/comments`),
  createComment: (cardId: string, body: string) =>
    http.post<Comment>(`/cards/${cardId}/comments`, { body }),
  deleteComment: (cardId: string, commentId: string) =>
    http.delete<void>(`/cards/${cardId}/comments/${commentId}`),
};

// ── Auth API ─────────────────────────────────────────────────────────────────

const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        if (j && typeof j === "object" && "error" in j) msg = String((j as { error: string }).error);
      } catch { /* ignore */ }
      throw new ApiError(msg, res.status);
    }
    const body = await res.json() as AuthResponse;
    setToken(body.access_token);
    setRefresh(body.refresh_token);
    return body;
  },

  me: () => http.get<User>(`/auth/me`),

  logout() {
    clearAuth();
    // fire-and-forget; backend logout is stateless
    fetch(`${API_BASE}/auth/logout`, { method: "POST" }).catch(() => {});
  },

  isAuthenticated: () => Boolean(getToken()),
};

// ── Users (optional — may not exist in v1 backend) ──────────────────────────

const users = {
  listUsers: () => http.get<UserDetails[]>(`/users`),
};

export const apiClient = {
  tasks,
  auth,
  users,
};
