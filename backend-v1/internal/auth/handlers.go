package auth

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler hosts gin handlers for /auth and /service-accounts.
type Handler struct {
	DB     *gorm.DB
	Issuer *Issuer
}

// NewHandler builds a Handler.
func NewHandler(db *gorm.DB, issuer *Issuer) *Handler {
	return &Handler{DB: db, Issuer: issuer}
}

// @schema
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// @schema
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

// Login validates credentials and returns access + refresh tokens.
// @Summary Log in (password grant)
// @Tags auth
// @Produce json
// @Param body body auth.LoginRequest true "Email + password"
// @Success 200 {object} auth.TokenPair "Tokens + user"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 401 {object} handlers.ErrorResponse "Invalid credentials"
// @Router /api/v1/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var user User
	if err := h.DB.Where("email = ? AND is_service_account = ?", req.Email, false).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if !CheckPassword(user.PasswordHash, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	access, err := h.Issuer.IssueAccess(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	refresh, err := h.Issuer.IssueRefresh(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, TokenPair{AccessToken: access, RefreshToken: refresh, User: &user})
}

// @schema
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh swaps a refresh token for a fresh access token.
// @Summary Refresh access token
// @Tags auth
// @Produce json
// @Param body body auth.RefreshRequest true "Refresh token"
// @Success 200 {object} handlers.RefreshAccessTokenResponse "New access token"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 401 {object} handlers.ErrorResponse "Invalid token"
// @Router /api/v1/auth/refresh [post]
func (h *Handler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	claims, err := h.Issuer.ParseRefresh(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}
	uid64, err := strconv.ParseUint(claims.Subject, 10, 64)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid subject"})
		return
	}
	var user User
	if err := h.DB.First(&user, "id = ?", uint(uid64)).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	access, err := h.Issuer.IssueAccess(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"access_token": access})
}

// Me returns the current authenticated user from the bearer token's user_id.
// @Summary Get current user
// @Tags auth
// @Produce json
// @Success 200 {object} auth.User "Current user"
// @Failure 401 {object} handlers.ErrorResponse "Not authenticated"
// @Failure 404 {object} handlers.ErrorResponse "User not found"
// @Router /api/v1/auth/me [get]
func (h *Handler) Me(c *gin.Context) {
	uidAny, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no user in context"})
		return
	}
	uid, ok := uidAny.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "bad user id type"})
		return
	}
	var user User
	if err := h.DB.First(&user, "id = ?", uid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

// Logout is a no-op since the server is stateless; clients drop their tokens.
// @Summary Log out
// @Tags auth
// @Produce json
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Router /api/v1/auth/logout [post]
func (h *Handler) Logout(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

// ── Service accounts ─────────────────────────────────────────────────────────

// @schema
type ServiceAccountWithTokens struct {
	User
	Tokens []ServiceAccountToken `json:"tokens"`
}

// ListServiceAccounts returns every is_service_account=true user with token metadata.
// @Summary List service accounts
// @Tags service-accounts
// @Produce json
// @Success 200 {array} auth.ServiceAccountWithTokens "Accounts with token metadata"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/service-accounts [get]
func (h *Handler) ListServiceAccounts(c *gin.Context) {
	var users []User
	if err := h.DB.Where("is_service_account = ?", true).Order("created_at asc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := make([]ServiceAccountWithTokens, 0, len(users))
	for _, u := range users {
		var tokens []ServiceAccountToken
		h.DB.Where("user_id = ?", u.ID).Order("created_at asc").Find(&tokens)
		result = append(result, ServiceAccountWithTokens{User: u, Tokens: tokens})
	}
	c.JSON(http.StatusOK, result)
}

// @schema
type CreateServiceAccountRequest struct {
	Name        string `json:"name" binding:"required"`
	DisplayName string `json:"display_name,omitempty"`
}

// CreateServiceAccount creates a new service-account user and issues the first token.
// @Summary Create service account
// @Tags service-accounts
// @Produce json
// @Param body body auth.CreateServiceAccountRequest true "Service-account payload"
// @Success 201 {object} handlers.CreateServiceAccountResponse "Account + initial token"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 500 {object} handlers.ErrorResponse "Server error"
// @Router /api/v1/service-accounts [post]
func (h *Handler) CreateServiceAccount(c *gin.Context) {
	var req CreateServiceAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	displayName := req.DisplayName
	if displayName == "" {
		displayName = req.Name
	}
	email := req.Name + "@service.taskhauler.localhost"

	user := User{
		Email:            email,
		DisplayName:      displayName,
		IsServiceAccount: true,
	}
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	plain, err := GenerateServiceToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	row := ServiceAccountToken{
		UserID:    user.ID,
		Name:      req.Name,
		TokenHash: HashServiceToken(plain),
	}
	if err := h.DB.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"user": user, "token": plain, "token_id": row.ID})
}

// @schema
type IssueTokenRequest struct {
	Name string `json:"name" binding:"required"`
}

// IssueToken mints an additional token for an existing service account.
// @Summary Issue token for service account
// @Tags service-accounts
// @Produce json
// @Param id path string true "Service account user ID"
// @Param body body auth.IssueTokenRequest true "Token payload"
// @Success 201 {object} handlers.IssueTokenResponse "New token"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Service account not found"
// @Router /api/v1/service-accounts/{id}/tokens [post]
func (h *Handler) IssueToken(c *gin.Context) {
	idStr := c.Param("id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var user User
	if err := h.DB.First(&user, "id = ? AND is_service_account = ?", uint(id64), true).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "service account not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var req IssueTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	plain, err := GenerateServiceToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	row := ServiceAccountToken{
		UserID:    user.ID,
		Name:      req.Name,
		TokenHash: HashServiceToken(plain),
	}
	if err := h.DB.Create(&row).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"token": plain, "token_id": row.ID, "user_id": user.ID})
}

// RevokeToken sets revoked_at on the given token.
// @Summary Revoke service-account token
// @Tags service-accounts
// @Produce json
// @Param token_id path string true "Token ID"
// @Success 204 {object} handlers.ErrorResponse "No content"
// @Failure 400 {object} handlers.ErrorResponse "Bad request"
// @Failure 404 {object} handlers.ErrorResponse "Not found or already revoked"
// @Router /api/v1/service-accounts/tokens/{token_id} [delete]
func (h *Handler) RevokeToken(c *gin.Context) {
	idStr := c.Param("token_id")
	id64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid token id"})
		return
	}
	now := time.Now().UnixMilli()
	res := h.DB.Model(&ServiceAccountToken{}).
		Where("id = ? AND revoked_at IS NULL", uint(id64)).
		Update("revoked_at", now)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "token not found or already revoked"})
		return
	}
	c.Status(http.StatusNoContent)
}
