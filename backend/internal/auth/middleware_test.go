package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// makeAuthRouter wires the real RequireAuth middleware followed by a stub
// 200-handler. Tests that need to inspect ctx values do so via per-test
// closures (see capturedUID / capturedAdmin / capturedEmail patterns below) —
// the gin.Context can't be value-copied because it holds a sync.RWMutex.
func makeAuthRouter(m *Middleware) *gin.Engine {
	r := gin.New()
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func makeAdminRouter(m *Middleware) *gin.Engine {
	r := gin.New()
	r.GET("/admin-only", m.RequireAuth(), m.RequireAdmin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})
	return r
}

func createUser(t *testing.T, db *gorm.DB, email string, isAdmin, isSA bool) *User {
	t.Helper()
	u := &User{Email: email, DisplayName: email, IsAdmin: isAdmin, IsServiceAccount: isSA}
	require.NoError(t, db.Create(u).Error)
	return u
}

func createServiceToken(t *testing.T, db *gorm.DB, userID uint, name string) (string, *ServiceAccountToken) {
	t.Helper()
	plain, err := GenerateServiceToken()
	require.NoError(t, err)
	row := &ServiceAccountToken{UserID: userID, Name: name, TokenHash: HashServiceToken(plain)}
	require.NoError(t, db.Create(row).Error)
	return plain, row
}

func TestRequireAuth_MissingHeader_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "missing Authorization header")
}

func TestRequireAuth_MalformedHeader_NoBearerPrefix_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Token abc.def.ghi")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid Authorization header")
}

func TestRequireAuth_MalformedHeader_SingleWord_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid Authorization header")
}

func TestRequireAuth_BearerWithEmptyToken_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer    ")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "empty token")
}

func TestRequireAuth_ExpiredJWT_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	now := time.Now()
	claims := Claims{
		Email:     "x@y.z",
		TokenType: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "1",
			IssuedAt:  jwt.NewNumericDate(now.Add(-2 * time.Hour)),
			ExpiresAt: jwt.NewNumericDate(now.Add(-time.Hour)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(testSecret))
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid token")
}

func TestRequireAuth_InvalidSignatureJWT_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	// Sign with a different secret.
	other := NewIssuer("totally-different-secret")
	tok, err := other.IssueAccess(testUser())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid token")
}

func TestRequireAuth_TamperedClaims_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	tok, err := issuer.IssueAccess(testUser())
	require.NoError(t, err)

	// Flip one byte in the middle (payload section) so the signature won't verify.
	bs := []byte(tok)
	mid := len(bs) / 2
	if bs[mid] == 'A' {
		bs[mid] = 'B'
	} else {
		bs[mid] = 'A'
	}
	tampered := string(bs)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tampered)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid token")
}

func TestRequireAuth_RefreshTokenRejected_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	refresh, err := issuer.IssueRefresh(testUser())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+refresh)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid token")
}

func TestRequireAuth_ValidJWT_200_SetsContext(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)

	// Capture context from inside the chained handler.
	var capturedUID any
	var capturedAdmin any
	var capturedEmail any
	r := gin.New()
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		capturedUID, _ = c.Get("user_id")
		capturedAdmin, _ = c.Get("is_admin")
		capturedEmail, _ = c.Get("email")
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	u := &User{ID: 99, Email: "valid@example.com", IsAdmin: true}
	tok, err := issuer.IssueAccess(u)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, uint(99), capturedUID)
	assert.Equal(t, true, capturedAdmin)
	assert.Equal(t, "valid@example.com", capturedEmail)
}

func TestRequireAuth_BearerCaseInsensitive_200(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	tok, err := issuer.IssueAccess(testUser())
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "bearer "+tok) // lowercase
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequireAuth_ValidServiceToken_200_SetsContext(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)

	sa := createUser(t, db, "bot@service.taskhauler.localhost", false, true)
	plain, row := createServiceToken(t, db, sa.ID, "ci-bot")

	var capturedUID any
	var capturedAdmin any
	var capturedEmail any
	r := gin.New()
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		capturedUID, _ = c.Get("user_id")
		capturedAdmin, _ = c.Get("is_admin")
		capturedEmail, _ = c.Get("email")
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+plain)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())
	assert.Equal(t, sa.ID, capturedUID)
	assert.Equal(t, false, capturedAdmin)
	assert.Equal(t, sa.Email, capturedEmail)

	// Sanity check: last_used_at was bumped on the row.
	var fresh ServiceAccountToken
	require.NoError(t, db.First(&fresh, row.ID).Error)
	require.NotNil(t, fresh.LastUsedAt, "last_used_at should be set after auth")
	assert.Greater(t, *fresh.LastUsedAt, int64(0))
}

func TestRequireAuth_RevokedServiceToken_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	sa := createUser(t, db, "revoked-bot@service.taskhauler.localhost", false, true)
	plain, row := createServiceToken(t, db, sa.ID, "ci-bot")

	// Revoke.
	now := time.Now().UnixMilli()
	require.NoError(t, db.Model(&ServiceAccountToken{}).
		Where("id = ?", row.ID).Update("revoked_at", now).Error)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+plain)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid service token")
}

func TestRequireAuth_UnknownServiceToken_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	// Well-formed prefix but no DB row.
	bogus, err := GenerateServiceToken()
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+bogus)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid service token")
}

func TestRequireAuth_ServiceTokenOrphanedUser_401(t *testing.T) {
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))
	r := makeAuthRouter(m)

	sa := createUser(t, db, "ghost@service.taskhauler.localhost", false, true)
	plain, _ := createServiceToken(t, db, sa.ID, "ghost-token")

	// Hard-delete the owning user so the token's user is missing.
	require.NoError(t, db.Unscoped().Delete(&User{}, sa.ID).Error)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+plain)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "service token user missing")
}

func TestRequireAuth_ServiceTokenAdminUser_SetsAdminFlag(t *testing.T) {
	// Service-account tokens inherit the user's is_admin flag — confirm.
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))

	adminSA := createUser(t, db, "admin-bot@service.taskhauler.localhost", true, true)
	plain, _ := createServiceToken(t, db, adminSA.ID, "admin-ci")

	var capturedAdmin any
	r := gin.New()
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		capturedAdmin, _ = c.Get("is_admin")
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+plain)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, true, capturedAdmin)
}

func TestRequireAuth_JWTWithNonNumericSubject_401(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAuthRouter(m)

	now := time.Now()
	claims := Claims{
		Email:     "x@y.z",
		TokenType: tokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "not-a-number",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString([]byte(testSecret))
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+signed)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "invalid subject")
}

func TestRequireAdmin_NonAdminUser_403(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAdminRouter(m)

	nonAdmin := createUser(t, db, "joe@example.com", false, false)
	tok, err := issuer.IssueAccess(nonAdmin)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "admin required")
}

func TestRequireAdmin_AdminUser_200(t *testing.T) {
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAdminRouter(m)

	admin := createUser(t, db, "alice@example.com", true, false)
	tok, err := issuer.IssueAccess(admin)
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRequireAdmin_DemotedAdmin_LiveDBCheckRejects(t *testing.T) {
	// Regression: previously RequireAdmin trusted the is_admin JWT claim, so a
	// user demoted from admin between token-issue and token-use kept admin
	// rights until the token expired (1h). RequireAdmin now re-reads is_admin
	// from the DB and rejects with 403 even though the claim still says true.
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAdminRouter(m)

	user := createUser(t, db, "ex-admin@example.com", true, false)
	tok, err := issuer.IssueAccess(user) // claim is_admin=true
	require.NoError(t, err)

	// Demote in the DB after the token was issued.
	require.NoError(t, db.Model(&User{}).Where("id = ?", user.ID).Update("is_admin", false).Error)

	req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code,
		"demoted admin must be rejected even with a still-valid admin JWT claim")
}

func TestRequireAdmin_DeletedUser_403(t *testing.T) {
	// If the user is deleted between token-issue and token-use, RequireAdmin
	// fails the DB lookup and returns 403 (not 500).
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	m := NewMiddleware(db, issuer)
	r := makeAdminRouter(m)

	user := createUser(t, db, "deleted@example.com", true, false)
	tok, err := issuer.IssueAccess(user)
	require.NoError(t, err)

	require.NoError(t, db.Delete(&User{}, user.ID).Error)

	req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestRequireAdmin_NoAuthCalled_403(t *testing.T) {
	// RequireAdmin alone (no RequireAuth) should treat the missing flag as not-admin.
	db := newAuthTestDB(t)
	m := NewMiddleware(db, NewIssuer(testSecret))

	r := gin.New()
	r.GET("/admin-only", m.RequireAdmin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	req := httptest.NewRequest(http.MethodGet, "/admin-only", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

// sanity: ensure GenerateServiceToken always produces the documented prefix —
// the middleware dispatches on it.
func TestGenerateServiceToken_HasPrefix(t *testing.T) {
	tok, err := GenerateServiceToken()
	require.NoError(t, err)
	assert.True(t, len(tok) > len(ServiceTokenPrefix))
	assert.Equal(t, ServiceTokenPrefix, tok[:len(ServiceTokenPrefix)])
	// hash is deterministic
	assert.Equal(t, HashServiceToken(tok), HashServiceToken(tok))
	assert.NotEqual(t, HashServiceToken(tok), HashServiceToken(tok+"x"))
	_ = fmt.Sprintf
}
