// Domain types — ported verbatim from teamagentica/packages/api-client/src/tasks.ts
// and adapted for taskhauler.

export interface Board {
  id: string;
  name: string;
  prefix: string;
  description: string;
  created_at: number;
  updated_at: number;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  created_at: number;
  updated_at: number;
}

export interface Epic {
  id: string;
  board_id: string;
  name: string;
  description: string;
  color: string;
  position: number;
  created_at: number;
  updated_at: number;
}

export interface Card {
  id: string;
  number: number;          // auto-incrementing per board
  board_id: string;
  column_id: string;
  epic_id: string;             // epic grouping ("" = ungrouped)
  title: string;
  description: string;
  card_type: "task" | "bug" | "";
  priority: "low" | "medium" | "high" | "urgent" | "";
  assignee_id: number;       // user ID (0 = unassigned)
  assignee_agent: string;    // agent alias ("" = none)
  assignee_name: string;     // resolved display name from server
  labels: string;            // comma-separated
  due_date: number | null;
  position: number;
  created_at: number;
  updated_at: number;
}

export interface Comment {
  id: string;
  card_id: string;
  author_id: number;       // user ID
  author_name: string;     // resolved display name from server
  body: string;
  created_at: number;
}

// Auth types — matches taskhauler backend
export interface User {
  id: number;
  email: string;
  display_name: string;
  is_admin: boolean;
  is_service_account: boolean;
  created_at: number;
  updated_at: number;
}

export interface UserDetails {
  id: number | string;
  email: string;
  display_name: string;
}

export interface RegistryAlias {
  name: string;
  type: "agent" | "tool_agent" | "tool";
  plugin: string;
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface CreateCardRequest {
  column_id: string;
  epic_id?: string;
  title: string;
  description?: string;
  card_type?: string;
  priority?: string;
  assignee_id?: number;
  assignee_agent?: string;
  labels?: string;
  due_date?: number | null;
  position?: number;
}

export interface UpdateCardRequest {
  column_id?: string;
  epic_id?: string;
  clear_epic?: boolean;
  title?: string;
  description?: string;
  card_type?: string;
  priority?: string;
  assignee_id?: number;
  assignee_agent?: string;
  clear_assignee?: boolean;
  labels?: string;
  due_date?: number | null;
  clear_due?: boolean;
  position?: number;
}
