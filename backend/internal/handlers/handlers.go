package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/antimatter-studios/taskhauler/backend/internal/events"
	"github.com/antimatter-studios/taskhauler/backend/internal/storage"
	"github.com/antimatter-studios/taskhauler/backend/internal/users"
)

// derivePrefix produces a short uppercase prefix from a board name. Strategy:
// multi-word names use first letters of each word ("Infrastructure Platform"
// → "IP"); single-word names take the first 4 letters ("Roadmap" → "ROAD").
// Returns "" if the name has no usable letters/digits.
func derivePrefix(name string) string {
	stop := map[string]bool{"the": true, "a": true, "an": true, "of": true, "for": true, "and": true}
	words := strings.FieldsFunc(name, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	kept := make([]string, 0, len(words))
	for _, w := range words {
		if !stop[strings.ToLower(w)] {
			kept = append(kept, w)
		}
	}
	if len(kept) == 0 {
		return ""
	}
	var prefix string
	if len(kept) == 1 {
		w := kept[0]
		if len(w) > 4 {
			w = w[:4]
		}
		prefix = w
	} else {
		var b strings.Builder
		for _, w := range kept {
			if len(w) > 0 {
				b.WriteByte(w[0])
				if b.Len() >= 5 {
					break
				}
			}
		}
		prefix = b.String()
	}
	return strings.ToUpper(prefix)
}

// uniqueBoardPrefix returns prefix unchanged if no live board already uses it;
// otherwise appends 2, 3, … until a free slot is found. Empty input returns "".
func (h *Handler) uniqueBoardPrefix(prefix string) string {
	if prefix == "" {
		return ""
	}
	boards, err := h.db.ListBoards()
	if err != nil {
		return prefix
	}
	taken := make(map[string]bool, len(boards))
	for _, b := range boards {
		if b.Prefix != "" {
			taken[b.Prefix] = true
		}
	}
	if !taken[prefix] {
		return prefix
	}
	for i := 2; i < 1000; i++ {
		candidate := fmt.Sprintf("%s%d", prefix, i)
		if !taken[candidate] {
			return candidate
		}
	}
	return prefix
}

// Handler is the HTTP handler set for the task-tracker API + MCP endpoints.
type Handler struct {
	db        *storage.DB
	events    events.EventEmitter
	userCache *users.Cache
}

// New constructs a Handler.
func New(db *storage.DB, ev events.EventEmitter, cache *users.Cache) *Handler {
	return &Handler{db: db, events: ev, userCache: cache}
}

// ── Response types with resolved user names ──────────────────────────────────

type CardResponse struct {
	storage.Card
	AssigneeName string `json:"assignee_name"`
	StatusName   string `json:"status_name"`
}

type CommentResponse struct {
	storage.Comment
	AuthorName string `json:"author_name"`
}

func (h *Handler) enrichCard(ctx context.Context, card *storage.Card) CardResponse {
	resp := CardResponse{Card: *card}
	if card.AssigneeID != 0 {
		if u, err := h.userCache.Get(ctx, card.AssigneeID); err == nil && u != nil {
			resp.AssigneeName = u.FormatName()
		}
	} else if card.AssigneeAgent != "" {
		resp.AssigneeName = card.AssigneeAgent
	}
	if col, err := h.db.GetColumn(card.ColumnID); err == nil && col != nil {
		resp.StatusName = col.Name
	}
	return resp
}

func (h *Handler) enrichCards(ctx context.Context, cards []storage.Card) []CardResponse {
	ids := make(map[uint]bool)
	colIDs := make(map[string]bool)
	for _, c := range cards {
		if c.AssigneeID != 0 {
			ids[c.AssigneeID] = true
		}
		if c.ColumnID != "" {
			colIDs[c.ColumnID] = true
		}
	}
	idSlice := make([]uint, 0, len(ids))
	for id := range ids {
		idSlice = append(idSlice, id)
	}
	resolved := h.userCache.GetMany(ctx, idSlice)

	colNames := make(map[string]string, len(colIDs))
	for cid := range colIDs {
		if col, err := h.db.GetColumn(cid); err == nil && col != nil {
			colNames[cid] = col.Name
		}
	}

	result := make([]CardResponse, len(cards))
	for i, c := range cards {
		result[i] = CardResponse{Card: c}
		if c.AssigneeID != 0 {
			if u, ok := resolved[c.AssigneeID]; ok {
				result[i].AssigneeName = u.FormatName()
			}
		} else if c.AssigneeAgent != "" {
			result[i].AssigneeName = c.AssigneeAgent
		}
		if name, ok := colNames[c.ColumnID]; ok {
			result[i].StatusName = name
		}
	}
	return result
}

func (h *Handler) enrichComment(ctx context.Context, comment *storage.Comment) CommentResponse {
	resp := CommentResponse{Comment: *comment}
	if comment.AuthorID != 0 {
		if u, err := h.userCache.Get(ctx, comment.AuthorID); err == nil && u != nil {
			resp.AuthorName = u.FormatName()
		}
	}
	return resp
}

func (h *Handler) enrichComments(ctx context.Context, comments []storage.Comment) []CommentResponse {
	ids := make(map[uint]bool)
	for _, c := range comments {
		if c.AuthorID != 0 {
			ids[c.AuthorID] = true
		}
	}
	idSlice := make([]uint, 0, len(ids))
	for id := range ids {
		idSlice = append(idSlice, id)
	}
	resolved := h.userCache.GetMany(ctx, idSlice)

	result := make([]CommentResponse, len(comments))
	for i, c := range comments {
		result[i] = CommentResponse{Comment: c}
		if c.AuthorID != 0 {
			if u, ok := resolved[c.AuthorID]; ok {
				result[i].AuthorName = u.FormatName()
			}
		}
	}
	return result
}

// getUserID reads the authenticated user id stashed on the gin context by RequireAuth.
func getUserID(c *gin.Context) uint {
	v, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	id, ok := v.(uint)
	if !ok {
		return 0
	}
	return id
}

func (h *Handler) emitAssign(ctx context.Context, card *storage.Card) {
	if (card.AssigneeID == 0 && card.AssigneeAgent == "") || h.events == nil {
		return
	}
	assigneeName := card.AssigneeAgent
	if card.AssigneeID != 0 {
		if u, err := h.userCache.Get(ctx, card.AssigneeID); err == nil && u != nil {
			assigneeName = u.FormatName()
		}
	}
	detail, _ := json.Marshal(map[string]interface{}{
		"card_id":        card.ID,
		"board_id":       card.BoardID,
		"title":          card.Title,
		"assignee_id":    card.AssigneeID,
		"assignee_agent": card.AssigneeAgent,
		"assignee_name":  assigneeName,
	})
	h.events.PublishEvent("task-tracking:assign", string(detail))
}

func (h *Handler) emitComment(card *storage.Card, comment *storage.Comment) {
	if h.events == nil || card.AssigneeAgent == "" || comment.AuthorID == 0 {
		return
	}
	detail, _ := json.Marshal(map[string]interface{}{
		"card_id":        card.ID,
		"board_id":       card.BoardID,
		"author_id":      comment.AuthorID,
		"body":           comment.Body,
		"assignee_agent": card.AssigneeAgent,
	})
	h.events.PublishEvent("task-tracking:comment", string(detail))
}

// Health returns service liveness.
// @Summary Service health probe
// @Description Liveness/readiness endpoint. Returns 200 if the API is up.
// @Tags health
// @Produce json
// @Success 200 {object} handlers.HealthResponse "OK"
// @Router /api/v1/health [get]
func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ── Boards ────────────────────────────────────────────────────────────────────

// ListBoards returns every board.
// @Summary List boards
// @Description Returns all boards in creation order.
// @Tags boards
// @Produce json
// @Success 200 {array} storage.Board "Boards"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards [get]
func (h *Handler) ListBoards(c *gin.Context) {
	boards, err := h.db.ListBoards()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, boards)
}

// CreateBoard creates a new board.
// @Summary Create board
// @Description Creates a new board.
// @Tags boards
// @Produce json
// @Param body body handlers.CreateBoardRequest true "Board payload"
// @Success 201 {object} storage.Board "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards [post]
func (h *Handler) CreateBoard(c *gin.Context) {
	var req CreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prefix := strings.TrimSpace(strings.ToUpper(req.Prefix))
	if prefix == "" {
		prefix = derivePrefix(req.Name)
	}
	prefix = h.uniqueBoardPrefix(prefix)
	b := &storage.Board{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Prefix:      prefix,
		Description: req.Description,
	}
	if err := h.db.CreateBoard(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, b)
}

// GetBoard returns one board by ID.
// @Summary Get board
// @Description Fetch a board by its ID.
// @Tags boards
// @Produce json
// @Param id path string true "Board ID"
// @Success 200 {object} storage.Board "Board"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id} [get]
func (h *Handler) GetBoard(c *gin.Context) {
	b, err := h.db.GetBoard(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", c.Param("id"))})
		return
	}
	c.JSON(http.StatusOK, b)
}

// UpdateBoard mutates a board's fields.
// @Summary Update board
// @Description Partial update of a board.
// @Tags boards
// @Produce json
// @Param id path string true "Board ID"
// @Param body body handlers.UpdateBoardRequest true "Update payload"
// @Success 200 {object} storage.Board "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id} [put]
func (h *Handler) UpdateBoard(c *gin.Context) {
	b, err := h.db.GetBoard(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", c.Param("id"))})
		return
	}
	var req UpdateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Name != nil {
		b.Name = *req.Name
	}
	if req.Prefix != nil {
		b.Prefix = *req.Prefix
	}
	if req.Description != nil {
		b.Description = *req.Description
	}
	if err := h.db.UpdateBoard(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

// DeleteBoard removes a board with cascade.
// @Summary Delete board
// @Description Deletes a board and cascades to columns, epics, cards.
// @Tags boards
// @Produce json
// @Param id path string true "Board ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id} [delete]
func (h *Handler) DeleteBoard(c *gin.Context) {
	if err := h.db.DeleteBoard(c.Param("id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Columns ───────────────────────────────────────────────────────────────────

// ListColumns returns all columns for a board.
// @Summary List columns
// @Tags columns
// @Produce json
// @Param id path string true "Board ID"
// @Success 200 {array} storage.Column "Columns"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/columns [get]
func (h *Handler) ListColumns(c *gin.Context) {
	cols, err := h.db.ListColumns(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cols)
}

// CreateColumn appends a new column to a board.
// @Summary Create column
// @Tags columns
// @Produce json
// @Param id path string true "Board ID"
// @Param body body handlers.CreateColumnRequest true "Column payload"
// @Success 201 {object} storage.Column "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Board not found"
// @Router /api/v1/boards/{id}/columns [post]
func (h *Handler) CreateColumn(c *gin.Context) {
	boardID := c.Param("id")
	if _, err := h.db.GetBoard(boardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", boardID)})
		return
	}
	var req CreateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	col := &storage.Column{
		ID:       uuid.New().String(),
		BoardID:  boardID,
		Name:     req.Name,
		Position: req.Position,
	}
	if err := h.db.CreateColumn(col); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, col)
}

// UpdateColumn renames or repositions a column.
// @Summary Update column
// @Tags columns
// @Produce json
// @Param id path string true "Board ID"
// @Param cid path string true "Column ID"
// @Param body body handlers.UpdateColumnRequest true "Update payload"
// @Success 200 {object} storage.Column "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id}/columns/{cid} [put]
func (h *Handler) UpdateColumn(c *gin.Context) {
	col, err := h.db.GetColumn(c.Param("cid"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("column %q not found", c.Param("cid"))})
		return
	}
	var req UpdateColumnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Name != nil {
		col.Name = *req.Name
	}
	if req.Position != nil {
		col.Position = *req.Position
	}
	if err := h.db.UpdateColumn(col); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, col)
}

// DeleteColumn drops a column and its cards.
// @Summary Delete column
// @Tags columns
// @Produce json
// @Param id path string true "Board ID"
// @Param cid path string true "Column ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/columns/{cid} [delete]
func (h *Handler) DeleteColumn(c *gin.Context) {
	if err := h.db.DeleteColumn(c.Param("cid")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Epics ─────────────────────────────────────────────────────────────────────

// ListEpics returns all epics for a board.
// @Summary List epics
// @Tags epics
// @Produce json
// @Param id path string true "Board ID"
// @Success 200 {array} storage.Epic "Epics"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/epics [get]
func (h *Handler) ListEpics(c *gin.Context) {
	epics, err := h.db.ListEpics(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, epics)
}

// CreateEpic creates a new epic on a board.
// @Summary Create epic
// @Tags epics
// @Produce json
// @Param id path string true "Board ID"
// @Param body body handlers.CreateEpicRequest true "Epic payload"
// @Success 201 {object} storage.Epic "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Board not found"
// @Router /api/v1/boards/{id}/epics [post]
func (h *Handler) CreateEpic(c *gin.Context) {
	boardID := c.Param("id")
	if _, err := h.db.GetBoard(boardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", boardID)})
		return
	}
	var req CreateEpicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	epic := &storage.Epic{
		ID:          uuid.New().String(),
		BoardID:     boardID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Position:    req.Position,
	}
	if err := h.db.CreateEpic(epic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, epic)
}

// UpdateEpic mutates an epic.
// @Summary Update epic
// @Tags epics
// @Produce json
// @Param id path string true "Board ID"
// @Param eid path string true "Epic ID"
// @Param body body handlers.UpdateEpicRequest true "Update payload"
// @Success 200 {object} storage.Epic "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id}/epics/{eid} [put]
func (h *Handler) UpdateEpic(c *gin.Context) {
	epic, err := h.db.GetEpic(c.Param("eid"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("epic %q not found", c.Param("eid"))})
		return
	}
	var req UpdateEpicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Name != nil {
		epic.Name = *req.Name
	}
	if req.Description != nil {
		epic.Description = *req.Description
	}
	if req.Color != nil {
		epic.Color = *req.Color
	}
	if req.Position != nil {
		epic.Position = *req.Position
	}
	if err := h.db.UpdateEpic(epic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, epic)
}

// DeleteEpic removes an epic; cards are unlinked.
// @Summary Delete epic
// @Tags epics
// @Produce json
// @Param id path string true "Board ID"
// @Param eid path string true "Epic ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/epics/{eid} [delete]
func (h *Handler) DeleteEpic(c *gin.Context) {
	if err := h.db.DeleteEpic(c.Param("eid")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Cards ─────────────────────────────────────────────────────────────────────

// ListCards returns enriched cards for a board.
// @Summary List cards
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Success 200 {array} handlers.CardResponse "Cards"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/cards [get]
func (h *Handler) ListCards(c *gin.Context) {
	cards, err := h.db.ListCards(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.enrichCards(c.Request.Context(), cards))
}

// CreateCard creates a new card on a board.
// @Summary Create card
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Param body body handlers.CreateCardRequest true "Card payload"
// @Success 201 {object} handlers.CardResponse "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Board not found"
// @Router /api/v1/boards/{id}/cards [post]
func (h *Handler) CreateCard(c *gin.Context) {
	boardID := c.Param("id")
	if _, err := h.db.GetBoard(boardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", boardID)})
		return
	}
	var req CreateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	card := &storage.Card{
		ID:            uuid.New().String(),
		Number:        h.db.NextCardNumber(boardID),
		BoardID:       boardID,
		ColumnID:      req.ColumnID,
		EpicID:        req.EpicID,
		Title:         req.Title,
		Description:   req.Description,
		CardType:      req.CardType,
		Priority:      req.Priority,
		AssigneeID:    req.AssigneeID,
		AssigneeAgent: req.AssigneeAgent,
		Labels:        req.Labels,
		DueDate:       req.DueDate,
		Position:      req.Position,
	}
	if err := h.db.CreateCard(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.emitAssign(c.Request.Context(), card)
	c.JSON(http.StatusCreated, h.enrichCard(c.Request.Context(), card))
}

// UpdateCard partially updates a card.
// @Summary Update card
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Param cid path string true "Card ID"
// @Param body body handlers.UpdateCardRequest true "Update payload"
// @Success 200 {object} handlers.CardResponse "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id}/cards/{cid} [put]
func (h *Handler) UpdateCard(c *gin.Context) {
	card, err := h.db.GetCard(c.Param("cid"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", c.Param("cid"))})
		return
	}
	oldAssigneeID := card.AssigneeID
	oldAssigneeAgent := card.AssigneeAgent

	var req UpdateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.ColumnID != nil {
		card.ColumnID = *req.ColumnID
	}
	if req.ClearEpic {
		card.EpicID = ""
	} else if req.EpicID != nil {
		card.EpicID = *req.EpicID
	}
	if req.Title != nil {
		card.Title = *req.Title
	}
	if req.Description != nil {
		card.Description = *req.Description
	}
	if req.CardType != nil {
		card.CardType = *req.CardType
	}
	if req.Priority != nil {
		card.Priority = *req.Priority
	}
	if req.ClearAssignee {
		card.AssigneeID = 0
		card.AssigneeAgent = ""
	} else {
		if req.AssigneeID != nil {
			card.AssigneeID = *req.AssigneeID
			card.AssigneeAgent = ""
		}
		if req.AssigneeAgent != nil {
			card.AssigneeAgent = *req.AssigneeAgent
			card.AssigneeID = 0
		}
	}
	if req.Labels != nil {
		card.Labels = *req.Labels
	}
	if req.ClearDue {
		card.DueDate = nil
	} else if req.DueDate != nil {
		card.DueDate = req.DueDate
	}
	if req.Position != nil {
		card.Position = *req.Position
	}
	if err := h.db.UpdateCard(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if card.AssigneeID != oldAssigneeID || card.AssigneeAgent != oldAssigneeAgent {
		h.emitAssign(c.Request.Context(), card)
	}
	c.JSON(http.StatusOK, h.enrichCard(c.Request.Context(), card))
}

// SearchCards substring-matches cards by title/description/labels.
// @Summary Search cards
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Param q query string true "Search query (substring)"
// @Success 200 {array} handlers.CardResponse "Matches"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/cards/search [get]
func (h *Handler) SearchCards(c *gin.Context) {
	boardID := c.Param("id")
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}
	cards, err := h.db.SearchCards(boardID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.enrichCards(c.Request.Context(), cards))
}

// GetCard fetches a card by ID.
// @Summary Get card
// @Tags cards
// @Produce json
// @Param cid path string true "Card ID"
// @Success 200 {object} handlers.CardResponse "Card"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/cards/{cid} [get]
func (h *Handler) GetCard(c *gin.Context) {
	card, err := h.db.GetCard(c.Param("cid"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", c.Param("cid"))})
		return
	}
	c.JSON(http.StatusOK, h.enrichCard(c.Request.Context(), card))
}

// GetCardByNumber fetches a card by its board-local number.
// @Summary Get card by number
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Param num path integer true "Card number"
// @Success 200 {object} handlers.CardResponse "Card"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/boards/{id}/cards/number/{num} [get]
func (h *Handler) GetCardByNumber(c *gin.Context) {
	boardID := c.Param("id")
	num, err := strconv.ParseUint(c.Param("num"), 10, 64)
	if err != nil || num == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid card number"})
		return
	}
	card, err := h.db.GetCardByNumber(boardID, uint(num))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card #%d not found in board %q", num, boardID)})
		return
	}
	c.JSON(http.StatusOK, h.enrichCard(c.Request.Context(), card))
}

// DeleteCard removes a card and its comments.
// @Summary Delete card
// @Tags cards
// @Produce json
// @Param id path string true "Board ID"
// @Param cid path string true "Card ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/boards/{id}/cards/{cid} [delete]
func (h *Handler) DeleteCard(c *gin.Context) {
	if err := h.db.DeleteCard(c.Param("cid")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── Comments ──────────────────────────────────────────────────────────────────

// ListComments returns enriched comments for a card.
// @Summary List comments
// @Tags comments
// @Produce json
// @Param cid path string true "Card ID"
// @Success 200 {array} handlers.CommentResponse "Comments"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/cards/{cid}/comments [get]
func (h *Handler) ListComments(c *gin.Context) {
	comments, err := h.db.ListComments(c.Param("cid"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.enrichComments(c.Request.Context(), comments))
}

// CreateComment adds a comment to a card.
// @Summary Create comment
// @Tags comments
// @Produce json
// @Param cid path string true "Card ID"
// @Param body body handlers.CreateCommentRequest true "Comment payload"
// @Success 201 {object} handlers.CommentResponse "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/cards/{cid}/comments [post]
func (h *Handler) CreateComment(c *gin.Context) {
	cardID := c.Param("cid")
	card, err := h.db.GetCard(cardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", cardID)})
		return
	}
	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	authorID := getUserID(c)
	comment := &storage.Comment{
		ID:       uuid.New().String(),
		CardID:   cardID,
		AuthorID: authorID,
		Body:     req.Body,
	}
	if err := h.db.CreateComment(comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.emitComment(card, comment)
	c.JSON(http.StatusCreated, h.enrichComment(c.Request.Context(), comment))
}

// DeleteComment removes a comment.
// @Summary Delete comment
// @Tags comments
// @Produce json
// @Param cid path string true "Card ID"
// @Param cmid path string true "Comment ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/cards/{cid}/comments/{cmid} [delete]
func (h *Handler) DeleteComment(c *gin.Context) {
	if err := h.db.DeleteComment(c.Param("cmid")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// ── MCP tools ─────────────────────────────────────────────────────────────────

func (h *Handler) ToolDefs() interface{} {
	return []gin.H{
		{
			"name":        "list_boards",
			"description": "List all kanban boards with their columns",
			"endpoint":    "/mcp/list_boards",
			"parameters": gin.H{
				"type":       "object",
				"properties": gin.H{},
			},
		},
		{
			"name":        "create_board",
			"description": "Create a new kanban board with default columns (To Do, In Progress, Review, Done)",
			"endpoint":    "/mcp/create_board",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"name":        gin.H{"type": "string", "description": "Board name"},
					"prefix":      gin.H{"type": "string", "description": "Short prefix for card numbers (e.g. PROJ)"},
					"description": gin.H{"type": "string", "description": "Board description"},
					"columns":     gin.H{"type": "array", "items": gin.H{"type": "string"}, "description": "Custom column names (defaults to To Do, In Progress, Review, Done)"},
				},
				"required": []string{"name"},
			},
		},
		{
			"name":        "rename_board",
			"description": "Rename a board and optionally update its prefix or description",
			"endpoint":    "/mcp/rename_board",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id":    gin.H{"type": "string", "description": "ID of the board"},
					"name":        gin.H{"type": "string", "description": "New board name"},
					"prefix":      gin.H{"type": "string", "description": "New prefix"},
					"description": gin.H{"type": "string", "description": "New description"},
				},
				"required": []string{"board_id"},
			},
		},
		{
			"name":        "delete_board",
			"description": "Delete a board and all its columns, epics, and tasks",
			"endpoint":    "/mcp/delete_board",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id": gin.H{"type": "string", "description": "ID of the board to delete"},
				},
				"required": []string{"board_id"},
			},
		},
		{
			"name":        "list_tasks",
			"description": "List all tasks on a board, grouped by status (column)",
			"endpoint":    "/mcp/list_tasks",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id": gin.H{"type": "string", "description": "ID of the board"},
				},
				"required": []string{"board_id"},
			},
		},
		{
			"name":        "list_tasks_by_status",
			"description": "List tasks in a specific status (column)",
			"endpoint":    "/mcp/list_tasks_by_status",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"column_id": gin.H{"type": "string", "description": "ID of the status column"},
				},
				"required": []string{"column_id"},
			},
		},
		{
			"name":        "list_epics",
			"description": "List all epics on a board",
			"endpoint":    "/mcp/list_epics",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id": gin.H{"type": "string", "description": "ID of the board"},
				},
				"required": []string{"board_id"},
			},
		},
		{
			"name":        "create_epic",
			"description": "Create a new epic to group tasks on a board",
			"endpoint":    "/mcp/create_epic",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id":    gin.H{"type": "string", "description": "ID of the board"},
					"name":        gin.H{"type": "string", "description": "Epic name"},
					"description": gin.H{"type": "string", "description": "Epic description"},
					"color":       gin.H{"type": "string", "description": "Hex color e.g. #4A90D9"},
				},
				"required": []string{"board_id", "name"},
			},
		},
		{
			"name":        "update_epic",
			"description": "Update an existing epic",
			"endpoint":    "/mcp/update_epic",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"epic_id":     gin.H{"type": "string", "description": "ID of the epic"},
					"name":        gin.H{"type": "string", "description": "New name"},
					"description": gin.H{"type": "string", "description": "New description"},
					"color":       gin.H{"type": "string", "description": "New hex color"},
				},
				"required": []string{"epic_id"},
			},
		},
		{
			"name":        "delete_epic",
			"description": "Delete an epic (cards are unlinked, not deleted)",
			"endpoint":    "/mcp/delete_epic",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"epic_id": gin.H{"type": "string", "description": "ID of the epic to delete"},
				},
				"required": []string{"epic_id"},
			},
		},
		{
			"name":        "create_task",
			"description": "Create a new task (card) in a kanban board column",
			"endpoint":    "/mcp/create_task",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id":       gin.H{"type": "string", "description": "ID of the board"},
					"column_id":      gin.H{"type": "string", "description": "ID of the column (state) to place the task in"},
					"epic_id":        gin.H{"type": "string", "description": "ID of the epic to group this task under (optional)"},
					"title":          gin.H{"type": "string", "description": "Task title"},
					"description":    gin.H{"type": "string", "description": "Task description"},
					"card_type":      gin.H{"type": "string", "description": "Card type: task or bug", "enum": []string{"task", "bug"}},
					"priority":       gin.H{"type": "string", "description": "Priority: low, medium, high, urgent", "enum": []string{"", "low", "medium", "high", "urgent"}},
					"assignee_id":    gin.H{"type": "integer", "description": "User ID of assignee"},
					"assignee_agent": gin.H{"type": "string", "description": "Agent alias to assign (e.g. @relay)"},
					"labels":         gin.H{"type": "string", "description": "Comma-separated labels"},
				},
				"required": []string{"board_id", "column_id", "title"},
			},
		},
		{
			"name":        "set_task_state",
			"description": "Move a task to a different column (change its state)",
			"endpoint":    "/mcp/set_task_state",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"card_id":   gin.H{"type": "string", "description": "ID of the task/card"},
					"column_id": gin.H{"type": "string", "description": "ID of the target column"},
				},
				"required": []string{"card_id", "column_id"},
			},
		},
		{
			"name":        "update_task",
			"description": "Update fields on an existing task",
			"endpoint":    "/mcp/update_task",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"card_id":        gin.H{"type": "string", "description": "ID of the task/card"},
					"title":          gin.H{"type": "string", "description": "New title"},
					"description":    gin.H{"type": "string", "description": "New description"},
					"card_type":      gin.H{"type": "string", "description": "Card type: task or bug", "enum": []string{"task", "bug"}},
					"priority":       gin.H{"type": "string", "description": "Priority: low, medium, high, urgent", "enum": []string{"", "low", "medium", "high", "urgent"}},
					"assignee_id":    gin.H{"type": "integer", "description": "User ID of assignee"},
					"assignee_agent": gin.H{"type": "string", "description": "Agent alias to assign (e.g. @relay)"},
					"labels":         gin.H{"type": "string", "description": "Comma-separated labels"},
					"column_id":      gin.H{"type": "string", "description": "Move to this column"},
					"epic_id":        gin.H{"type": "string", "description": "Move to this epic (empty string to unlink)"},
				},
				"required": []string{"card_id"},
			},
		},
		{
			"name":        "search_tasks",
			"description": "Search tasks by title, description, or labels substring",
			"endpoint":    "/mcp/search_tasks",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"board_id": gin.H{"type": "string", "description": "ID of the board"},
					"query":    gin.H{"type": "string", "description": "Search substring to match against title, description, and labels"},
				},
				"required": []string{"board_id", "query"},
			},
		},
		{
			"name":        "add_comment",
			"description": "Add a comment to a task",
			"endpoint":    "/mcp/add_comment",
			"parameters": gin.H{
				"type": "object",
				"properties": gin.H{
					"card_id":   gin.H{"type": "string", "description": "ID of the task/card"},
					"body":      gin.H{"type": "string", "description": "Comment text"},
					"author_id": gin.H{"type": "integer", "description": "User ID of author (defaults to caller)"},
				},
				"required": []string{"card_id", "body"},
			},
		},
	}
}

// GetTools lists the MCP-style tool definitions.
// @Summary MCP tool discovery
// @Tags mcp
// @Produce json
// @Success 200 {object} handlers.ToolsResponse "Tools"
// @Router /api/v1/mcp [get]
func (h *Handler) GetTools(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"tools": h.ToolDefs()})
}

// MCPListBoards lists every board with its columns embedded.
// @Summary MCP list boards
// @Tags mcp
// @Produce json
// @Success 200 {array} handlers.MCPListBoardsItem "Boards with columns"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/list_boards [post]
func (h *Handler) MCPListBoards(c *gin.Context) {
	boards, err := h.db.ListBoards()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	type boardWithColumns struct {
		storage.Board
		Columns []storage.Column `json:"columns"`
	}
	result := make([]boardWithColumns, 0, len(boards))
	for _, b := range boards {
		cols, err := h.db.ListColumns(b.ID)
		if err != nil {
			cols = []storage.Column{}
		}
		result = append(result, boardWithColumns{Board: b, Columns: cols})
	}
	c.JSON(http.StatusOK, result)
}

// MCPCreateBoard creates a board with optional custom columns.
// @Summary MCP create board
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPCreateBoardRequest true "Create-board payload"
// @Success 201 {object} handlers.MCPCreateBoardResponse "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/create_board [post]
func (h *Handler) MCPCreateBoard(c *gin.Context) {
	var req MCPCreateBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	prefix := strings.TrimSpace(strings.ToUpper(req.Prefix))
	if prefix == "" {
		prefix = derivePrefix(req.Name)
	}
	prefix = h.uniqueBoardPrefix(prefix)

	b := &storage.Board{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Prefix:      prefix,
		Description: req.Description,
	}
	if err := h.db.CreateBoard(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	colNames := req.Columns
	if len(colNames) == 0 {
		colNames = []string{"To Do", "In Progress", "Review", "Done"}
	}
	cols := make([]storage.Column, 0, len(colNames))
	for i, name := range colNames {
		col := &storage.Column{
			ID:       uuid.New().String(),
			BoardID:  b.ID,
			Name:     name,
			Position: float64(i),
		}
		if err := h.db.CreateColumn(col); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		cols = append(cols, *col)
	}

	c.JSON(http.StatusCreated, gin.H{
		"board":   b,
		"columns": cols,
	})
}

// MCPRenameBoard updates a board's name/prefix/description.
// @Summary MCP rename board
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPRenameBoardRequest true "Rename payload"
// @Success 200 {object} storage.Board "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/mcp/rename_board [post]
func (h *Handler) MCPRenameBoard(c *gin.Context) {
	var req MCPRenameBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b, err := h.db.GetBoard(req.BoardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", req.BoardID)})
		return
	}
	if req.Name != nil {
		b.Name = *req.Name
	}
	if req.Prefix != nil {
		b.Prefix = *req.Prefix
	}
	if req.Description != nil {
		b.Description = *req.Description
	}
	if err := h.db.UpdateBoard(b); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

// MCPDeleteBoard deletes a board with cascade.
// @Summary MCP delete board
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPDeleteBoardRequest true "Delete payload"
// @Success 200 {object} handlers.DeletedResponse "Deleted"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/mcp/delete_board [post]
func (h *Handler) MCPDeleteBoard(c *gin.Context) {
	var req MCPDeleteBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if _, err := h.db.GetBoard(req.BoardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", req.BoardID)})
		return
	}
	if err := h.db.DeleteBoard(req.BoardID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": req.BoardID})
}

// MCPListEpics lists epics on a board.
// @Summary MCP list epics
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPListEpicsRequest true "Board reference"
// @Success 200 {array} storage.Epic "Epics"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/list_epics [post]
func (h *Handler) MCPListEpics(c *gin.Context) {
	var req MCPListEpicsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	epics, err := h.db.ListEpics(req.BoardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, epics)
}

// MCPCreateEpic creates an epic.
// @Summary MCP create epic
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPCreateEpicRequest true "Epic payload"
// @Success 201 {object} storage.Epic "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Board not found"
// @Router /api/v1/mcp/create_epic [post]
func (h *Handler) MCPCreateEpic(c *gin.Context) {
	var req MCPCreateEpicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if _, err := h.db.GetBoard(req.BoardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", req.BoardID)})
		return
	}
	epic := &storage.Epic{
		ID:          uuid.New().String(),
		BoardID:     req.BoardID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
		Position:    req.Position,
	}
	if err := h.db.CreateEpic(epic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, epic)
}

// MCPUpdateEpic mutates an epic.
// @Summary MCP update epic
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPUpdateEpicRequest true "Update payload"
// @Success 200 {object} storage.Epic "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found"
// @Router /api/v1/mcp/update_epic [post]
func (h *Handler) MCPUpdateEpic(c *gin.Context) {
	var req MCPUpdateEpicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	epic, err := h.db.GetEpic(req.EpicID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("epic %q not found", req.EpicID)})
		return
	}
	if req.Name != nil {
		epic.Name = *req.Name
	}
	if req.Description != nil {
		epic.Description = *req.Description
	}
	if req.Color != nil {
		epic.Color = *req.Color
	}
	if err := h.db.UpdateEpic(epic); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, epic)
}

// MCPDeleteEpic deletes an epic.
// @Summary MCP delete epic
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPDeleteEpicRequest true "Delete payload"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Epic not found"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/delete_epic [post]
func (h *Handler) MCPDeleteEpic(c *gin.Context) {
	var req MCPDeleteEpicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if _, err := h.db.GetEpic(req.EpicID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("epic %q not found", req.EpicID)})
		return
	}
	if err := h.db.DeleteEpic(req.EpicID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// MCPListTasks groups cards by status column.
// @Summary MCP list tasks
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPListTasksRequest true "Board reference"
// @Success 200 {array} handlers.MCPTaskStatusGroup "Tasks grouped by status"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/list_tasks [post]
func (h *Handler) MCPListTasks(c *gin.Context) {
	var req MCPListTasksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cols, err := h.db.ListColumns(req.BoardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	cards, err := h.db.ListCards(req.BoardID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	enriched := h.enrichCards(c.Request.Context(), cards)
	byColumn := make(map[string][]CardResponse)
	for _, cr := range enriched {
		byColumn[cr.ColumnID] = append(byColumn[cr.ColumnID], cr)
	}
	type statusGroup struct {
		StatusID   string         `json:"status_id"`
		StatusName string         `json:"status_name"`
		Tasks      []CardResponse `json:"tasks"`
	}
	groups := make([]statusGroup, 0, len(cols))
	for _, col := range cols {
		tasks := byColumn[col.ID]
		if tasks == nil {
			tasks = []CardResponse{}
		}
		groups = append(groups, statusGroup{
			StatusID:   col.ID,
			StatusName: col.Name,
			Tasks:      tasks,
		})
	}
	c.JSON(http.StatusOK, groups)
}

// MCPListTasksByStatus returns tasks in a single column.
// @Summary MCP list tasks by status
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPListTasksByStatusRequest true "Column reference"
// @Success 200 {object} handlers.MCPTasksByStatusResponse "Tasks in column"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Column not found"
// @Router /api/v1/mcp/list_tasks_by_status [post]
func (h *Handler) MCPListTasksByStatus(c *gin.Context) {
	var req MCPListTasksByStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	col, err := h.db.GetColumn(req.ColumnID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("status %q not found", req.ColumnID)})
		return
	}
	cards, err := h.db.ListCardsByColumn(req.ColumnID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status_id":   col.ID,
		"status_name": col.Name,
		"tasks":       h.enrichCards(c.Request.Context(), cards),
	})
}

// MCPCreateTask creates a card.
// @Summary MCP create task
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPCreateTaskRequest true "Task payload"
// @Success 201 {object} handlers.CardResponse "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Board not found"
// @Router /api/v1/mcp/create_task [post]
func (h *Handler) MCPCreateTask(c *gin.Context) {
	var req MCPCreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if _, err := h.db.GetBoard(req.BoardID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("board %q not found", req.BoardID)})
		return
	}
	card := &storage.Card{
		ID:            uuid.New().String(),
		Number:        h.db.NextCardNumber(req.BoardID),
		BoardID:       req.BoardID,
		ColumnID:      req.ColumnID,
		EpicID:        req.EpicID,
		Title:         req.Title,
		Description:   req.Description,
		CardType:      req.CardType,
		Priority:      req.Priority,
		AssigneeID:    req.AssigneeID,
		AssigneeAgent: req.AssigneeAgent,
		Labels:        req.Labels,
		DueDate:       req.DueDate,
		Position:      req.Position,
	}
	if err := h.db.CreateCard(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.emitAssign(c.Request.Context(), card)
	c.JSON(http.StatusCreated, h.enrichCard(c.Request.Context(), card))
}

// MCPSetTaskState moves a card to another column.
// @Summary MCP set task state
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPSetTaskStateRequest true "Move payload"
// @Success 200 {object} handlers.CardResponse "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Card not found"
// @Router /api/v1/mcp/set_task_state [post]
func (h *Handler) MCPSetTaskState(c *gin.Context) {
	var req MCPSetTaskStateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	card, err := h.db.GetCard(req.CardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", req.CardID)})
		return
	}
	card.ColumnID = req.ColumnID
	if err := h.db.UpdateCard(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.enrichCard(c.Request.Context(), card))
}

// MCPUpdateTask mutates fields on a card.
// @Summary MCP update task
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPUpdateTaskRequest true "Update payload"
// @Success 200 {object} handlers.CardResponse "Updated"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Card not found"
// @Router /api/v1/mcp/update_task [post]
func (h *Handler) MCPUpdateTask(c *gin.Context) {
	var req MCPUpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	card, err := h.db.GetCard(req.CardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", req.CardID)})
		return
	}
	oldAssigneeID := card.AssigneeID
	oldAssigneeAgent := card.AssigneeAgent

	// Field-update semantics mirror REST UpdateCard exactly so MCP callers see
	// the same Clear-flag behaviour. See handlers.UpdateCard for the source.
	if req.ColumnID != nil {
		card.ColumnID = *req.ColumnID
	}
	if req.ClearEpic {
		card.EpicID = ""
	} else if req.EpicID != nil {
		card.EpicID = *req.EpicID
	}
	if req.Title != nil {
		card.Title = *req.Title
	}
	if req.Description != nil {
		card.Description = *req.Description
	}
	if req.CardType != nil {
		card.CardType = *req.CardType
	}
	if req.Priority != nil {
		card.Priority = *req.Priority
	}
	if req.ClearAssignee {
		card.AssigneeID = 0
		card.AssigneeAgent = ""
	} else {
		if req.AssigneeID != nil {
			card.AssigneeID = *req.AssigneeID
			card.AssigneeAgent = ""
		}
		if req.AssigneeAgent != nil {
			card.AssigneeAgent = *req.AssigneeAgent
			card.AssigneeID = 0
		}
	}
	if req.Labels != nil {
		card.Labels = *req.Labels
	}
	if req.ClearDue {
		card.DueDate = nil
	} else if req.DueDate != nil {
		card.DueDate = req.DueDate
	}
	if req.Position != nil {
		card.Position = *req.Position
	}
	if err := h.db.UpdateCard(card); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if card.AssigneeID != oldAssigneeID || card.AssigneeAgent != oldAssigneeAgent {
		h.emitAssign(c.Request.Context(), card)
	}
	c.JSON(http.StatusOK, h.enrichCard(c.Request.Context(), card))
}

// MCPSearchTasks searches a board for cards matching a substring.
// @Summary MCP search tasks
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPSearchTasksRequest true "Search payload"
// @Success 200 {array} handlers.CardResponse "Matches"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/mcp/search_tasks [post]
func (h *Handler) MCPSearchTasks(c *gin.Context) {
	var req MCPSearchTasksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cards, err := h.db.SearchCards(req.BoardID, req.Query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.enrichCards(c.Request.Context(), cards))
}

// MCPAddComment adds a comment to a card.
// @Summary MCP add comment
// @Tags mcp
// @Produce json
// @Param body body handlers.MCPAddCommentRequest true "Comment payload"
// @Success 201 {object} handlers.CommentResponse "Created"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Card not found"
// @Router /api/v1/mcp/add_comment [post]
func (h *Handler) MCPAddComment(c *gin.Context) {
	var req MCPAddCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	card, err := h.db.GetCard(req.CardID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("card %q not found", req.CardID)})
		return
	}
	// Author is always the authenticated caller — no client override (closes
	// the MCP author-spoofing path that REST CreateComment never had).
	comment := &storage.Comment{
		ID:       uuid.New().String(),
		CardID:   req.CardID,
		AuthorID: getUserID(c),
		Body:     req.Body,
	}
	if err := h.db.CreateComment(comment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.emitComment(card, comment)
	c.JSON(http.StatusCreated, h.enrichComment(c.Request.Context(), comment))
}
