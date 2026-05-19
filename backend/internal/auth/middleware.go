package auth

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Middleware bundles dependencies needed by auth gin handlers/middleware.
type Middleware struct {
	DB     *gorm.DB
	Issuer *Issuer
}

// NewMiddleware constructs a Middleware.
func NewMiddleware(db *gorm.DB, issuer *Issuer) *Middleware {
	return &Middleware{DB: db, Issuer: issuer}
}

// RequireAuth validates the Authorization header (JWT or service-account token)
// and sets user_id / is_admin / email on the gin context.
func (m *Middleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := c.GetHeader("Authorization")
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing Authorization header"})
			return
		}
		parts := strings.SplitN(raw, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid Authorization header"})
			return
		}
		token := strings.TrimSpace(parts[1])
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "empty token"})
			return
		}

		if strings.HasPrefix(token, ServiceTokenPrefix) {
			uid, isAdmin, email, err := m.lookupServiceToken(token)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			c.Set("user_id", uid)
			c.Set("is_admin", isAdmin)
			c.Set("email", email)
			c.Next()
			return
		}

		claims, err := m.Issuer.ParseAccess(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token: " + err.Error()})
			return
		}
		uid64, err := strconv.ParseUint(claims.Subject, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid subject"})
			return
		}
		c.Set("user_id", uint(uid64))
		c.Set("is_admin", claims.IsAdmin)
		c.Set("email", claims.Email)
		c.Next()
	}
}

// RequireAdmin must be chained AFTER RequireAuth.
//
// Reads is_admin from the live User row, not the JWT claim. Without this, a
// user demoted from admin between token-issue and token-use would keep admin
// rights for the remainder of the token's 1h TTL. Service-account tokens
// already verify is_admin live in lookupServiceToken; this closes the
// asymmetry for JWT-authenticated callers. The extra DB read only fires on
// admin-gated routes, which are rare.
func (m *Middleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get("user_id")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		uid, ok := raw.(uint)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		var user User
		if err := m.DB.First(&user, "id = ?", uid).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		if !user.IsAdmin {
			// Update the gin context so downstream handlers see the live value
			// rather than the (possibly stale) JWT claim.
			c.Set("is_admin", false)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin required"})
			return
		}
		c.Set("is_admin", true)
		c.Next()
	}
}

// lookupServiceToken hashes the token, finds an un-revoked row, updates
// last_used_at, and returns the owning user's id+admin flag+email.
func (m *Middleware) lookupServiceToken(token string) (uint, bool, string, error) {
	hash := HashServiceToken(token)
	var row ServiceAccountToken
	if err := m.DB.Where("token_hash = ? AND revoked_at IS NULL", hash).First(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, false, "", errors.New("invalid service token")
		}
		return 0, false, "", err
	}
	var user User
	if err := m.DB.First(&user, "id = ?", row.UserID).Error; err != nil {
		return 0, false, "", errors.New("service token user missing")
	}
	now := time.Now().UnixMilli()
	m.DB.Model(&row).Update("last_used_at", now)
	return user.ID, user.IsAdmin, user.Email, nil
}
