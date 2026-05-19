package handlers

// This file contains named request/response struct types extracted from the
// anonymous structs that used to live inline inside handler bodies. The
// extraction is purely so go-oapifly can resolve `@Param body … {ref}` and
// `@Success … {object} handlers.X` annotations via AST lookup; runtime
// behaviour is identical to the previous inline structs.

// ── Board requests ───────────────────────────────────────────────────────────

// @schema
type CreateBoardRequest struct {
	Name        string `json:"name" binding:"required"`
	Prefix      string `json:"prefix,omitempty"`
	Description string `json:"description,omitempty"`
}

// @schema
type UpdateBoardRequest struct {
	Name        *string `json:"name,omitempty"`
	Prefix      *string `json:"prefix,omitempty"`
	Description *string `json:"description,omitempty"`
}

// ── Column requests ──────────────────────────────────────────────────────────

// @schema
type CreateColumnRequest struct {
	Name     string  `json:"name" binding:"required"`
	Position float64 `json:"position,omitempty"`
}

// @schema
type UpdateColumnRequest struct {
	Name     *string  `json:"name,omitempty"`
	Position *float64 `json:"position,omitempty"`
}

// ── Epic requests ────────────────────────────────────────────────────────────

// @schema
type CreateEpicRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description,omitempty"`
	Color       string  `json:"color,omitempty"`
	Position    float64 `json:"position,omitempty"`
}

// @schema
type UpdateEpicRequest struct {
	Name        *string  `json:"name,omitempty"`
	Description *string  `json:"description,omitempty"`
	Color       *string  `json:"color,omitempty"`
	Position    *float64 `json:"position,omitempty"`
}

// ── Card requests ────────────────────────────────────────────────────────────

// @schema
type CreateCardRequest struct {
	ColumnID      string  `json:"column_id" binding:"required"`
	EpicID        string  `json:"epic_id,omitempty"`
	Title         string  `json:"title" binding:"required"`
	Description   string  `json:"description,omitempty"`
	CardType      string  `json:"card_type,omitempty"`
	Priority      string  `json:"priority,omitempty"`
	AssigneeID    uint    `json:"assignee_id,omitempty"`
	AssigneeAgent string  `json:"assignee_agent,omitempty"`
	Labels        string  `json:"labels,omitempty"`
	DueDate       *int64  `json:"due_date,omitempty"`
	Position      float64 `json:"position,omitempty"`
}

// @schema
type UpdateCardRequest struct {
	ColumnID      *string  `json:"column_id,omitempty"`
	EpicID        *string  `json:"epic_id,omitempty"`
	ClearEpic     bool     `json:"clear_epic,omitempty"`
	Title         *string  `json:"title,omitempty"`
	Description   *string  `json:"description,omitempty"`
	CardType      *string  `json:"card_type,omitempty"`
	Priority      *string  `json:"priority,omitempty"`
	AssigneeID    *uint    `json:"assignee_id,omitempty"`
	AssigneeAgent *string  `json:"assignee_agent,omitempty"`
	ClearAssignee bool     `json:"clear_assignee,omitempty"`
	Labels        *string  `json:"labels,omitempty"`
	DueDate       *int64   `json:"due_date,omitempty"`
	ClearDue      bool     `json:"clear_due,omitempty"`
	Position      *float64 `json:"position,omitempty"`
}

// ── Comment requests ─────────────────────────────────────────────────────────

// @schema
type CreateCommentRequest struct {
	Body string `json:"body" binding:"required"`
}

// ── MCP requests ─────────────────────────────────────────────────────────────

// @schema
type MCPCreateBoardRequest struct {
	Name        string   `json:"name" binding:"required"`
	Prefix      string   `json:"prefix,omitempty"`
	Description string   `json:"description,omitempty"`
	Columns     []string `json:"columns,omitempty"`
}

// @schema
type MCPRenameBoardRequest struct {
	BoardID     string  `json:"board_id" binding:"required"`
	Name        *string `json:"name,omitempty"`
	Prefix      *string `json:"prefix,omitempty"`
	Description *string `json:"description,omitempty"`
}

// @schema
type MCPDeleteBoardRequest struct {
	BoardID string `json:"board_id" binding:"required"`
}

// @schema
type MCPListEpicsRequest struct {
	BoardID string `json:"board_id" binding:"required"`
}

// @schema
type MCPCreateEpicRequest struct {
	BoardID     string  `json:"board_id" binding:"required"`
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description,omitempty"`
	Color       string  `json:"color,omitempty"`
	Position    float64 `json:"position,omitempty"`
}

// @schema
type MCPUpdateEpicRequest struct {
	EpicID      string  `json:"epic_id" binding:"required"`
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
	Color       *string `json:"color,omitempty"`
}

// @schema
type MCPDeleteEpicRequest struct {
	EpicID string `json:"epic_id" binding:"required"`
}

// @schema
type MCPListTasksRequest struct {
	BoardID string `json:"board_id" binding:"required"`
}

// @schema
type MCPListTasksByStatusRequest struct {
	ColumnID string `json:"column_id" binding:"required"`
}

// @schema
type MCPCreateTaskRequest struct {
	BoardID       string  `json:"board_id" binding:"required"`
	ColumnID      string  `json:"column_id" binding:"required"`
	EpicID        string  `json:"epic_id,omitempty"`
	Title         string  `json:"title" binding:"required"`
	Description   string  `json:"description,omitempty"`
	CardType      string  `json:"card_type,omitempty"`
	Priority      string  `json:"priority,omitempty"`
	AssigneeID    uint    `json:"assignee_id,omitempty"`
	AssigneeAgent string  `json:"assignee_agent,omitempty"`
	Labels        string  `json:"labels,omitempty"`
	DueDate       *int64  `json:"due_date,omitempty"`
	Position      float64 `json:"position,omitempty"`
}

// @schema
type MCPSetTaskStateRequest struct {
	CardID   string `json:"card_id" binding:"required"`
	ColumnID string `json:"column_id" binding:"required"`
}

// @schema
type MCPUpdateTaskRequest struct {
	CardID        string   `json:"card_id" binding:"required"`
	ColumnID      *string  `json:"column_id,omitempty"`
	EpicID        *string  `json:"epic_id,omitempty"`
	ClearEpic     bool     `json:"clear_epic,omitempty"`
	Title         *string  `json:"title,omitempty"`
	Description   *string  `json:"description,omitempty"`
	CardType      *string  `json:"card_type,omitempty"`
	Priority      *string  `json:"priority,omitempty"`
	AssigneeID    *uint    `json:"assignee_id,omitempty"`
	AssigneeAgent *string  `json:"assignee_agent,omitempty"`
	ClearAssignee bool     `json:"clear_assignee,omitempty"`
	Labels        *string  `json:"labels,omitempty"`
	DueDate       *int64   `json:"due_date,omitempty"`
	ClearDue      bool     `json:"clear_due,omitempty"`
	Position      *float64 `json:"position,omitempty"`
}

// @schema
type MCPSearchTasksRequest struct {
	BoardID string `json:"board_id" binding:"required"`
	Query   string `json:"query" binding:"required"`
}

// @schema
type MCPAddCommentRequest struct {
	CardID string `json:"card_id" binding:"required"`
	Body   string `json:"body" binding:"required"`
}

// ── Response envelopes ───────────────────────────────────────────────────────

// @schema
type ErrorResponse struct {
	Error string `json:"error"`
}

// @schema
type HealthResponse struct {
	Status string `json:"status"`
}

// @schema
type DeletedResponse struct {
	Deleted string `json:"deleted"`
}

// @schema
type MCPListBoardsItem struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Prefix      string `json:"prefix"`
	Description string `json:"description"`
	CreatedAt   int64  `json:"created_at"`
	UpdatedAt   int64  `json:"updated_at"`
	Columns     []ColumnSummary `json:"columns"`
}

// @schema
type ColumnSummary struct {
	ID       string  `json:"id"`
	BoardID  string  `json:"board_id"`
	Name     string  `json:"name"`
	Position float64 `json:"position"`
}

// @schema
type MCPCreateBoardResponse struct {
	Board   BoardSummary    `json:"board"`
	Columns []ColumnSummary `json:"columns"`
}

// @schema
type BoardSummary struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Prefix      string `json:"prefix"`
	Description string `json:"description"`
	CreatedAt   int64  `json:"created_at"`
	UpdatedAt   int64  `json:"updated_at"`
}

// @schema
type MCPTaskStatusGroup struct {
	StatusID   string         `json:"status_id"`
	StatusName string         `json:"status_name"`
	Tasks      []CardResponse `json:"tasks"`
}

// @schema
type MCPTasksByStatusResponse struct {
	StatusID   string         `json:"status_id"`
	StatusName string         `json:"status_name"`
	Tasks      []CardResponse `json:"tasks"`
}

// @schema
type ToolsResponse struct {
	Tools []ToolDef `json:"tools"`
}

// @schema
type ToolDef struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Endpoint    string                 `json:"endpoint"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// @schema
type RefreshAccessTokenResponse struct {
	AccessToken string `json:"access_token"`
}

// @schema
type CreateServiceAccountResponse struct {
	User    UserSummary `json:"user"`
	Token   string      `json:"token"`
	TokenID uint        `json:"token_id"`
}

// @schema
type UserSummary struct {
	ID               uint   `json:"id"`
	Email            string `json:"email"`
	DisplayName      string `json:"display_name"`
	IsAdmin          bool   `json:"is_admin"`
	IsServiceAccount bool   `json:"is_service_account"`
	CreatedAt        int64  `json:"created_at"`
	UpdatedAt        int64  `json:"updated_at"`
}

// @schema
type IssueTokenResponse struct {
	Token   string `json:"token"`
	TokenID uint   `json:"token_id"`
	UserID  uint   `json:"user_id"`
}
