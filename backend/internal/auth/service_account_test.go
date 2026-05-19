package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

// makeSAHandlerRouter wires the real service-account handler routes onto a
// bare gin engine — no auth middleware (we test handler behaviour directly).
// Tests that need to verify middleware behaviour against issued tokens use a
// separate protected route on the same engine.
func makeSAHandlerRouter(h *Handler) *gin.Engine {
	r := gin.New()
	r.GET("/service-accounts", h.ListServiceAccounts)
	r.POST("/service-accounts", h.CreateServiceAccount)
	r.POST("/service-accounts/:id/tokens", h.IssueToken)
	r.DELETE("/service-accounts/tokens/:token_id", h.RevokeToken)
	return r
}

func newSATestEnv(t *testing.T) (*gorm.DB, *Handler, *Middleware) {
	t.Helper()
	db := newAuthTestDB(t)
	issuer := NewIssuer(testSecret)
	return db, NewHandler(db, issuer), NewMiddleware(db, issuer)
}

func postJSON(t *testing.T, r *gin.Engine, path string, payload any) *httptest.ResponseRecorder {
	t.Helper()
	var body []byte
	if payload != nil {
		var err error
		body, err = json.Marshal(payload)
		require.NoError(t, err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func deleteReq(t *testing.T, r *gin.Engine, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodDelete, path, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func getReq(t *testing.T, r *gin.Engine, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCreateServiceAccount_ReturnsTokenOnce_AndStoresHash(t *testing.T) {
	db, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{
		Name:        "ci-bot",
		DisplayName: "CI Bot",
	})
	require.Equal(t, http.StatusCreated, w.Code, "body: %s", w.Body.String())

	var resp struct {
		User    User   `json:"user"`
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))

	assert.True(t, resp.User.IsServiceAccount)
	assert.Equal(t, "CI Bot", resp.User.DisplayName)
	assert.Equal(t, "ci-bot@service.taskhauler.localhost", resp.User.Email)
	assert.True(t, strings.HasPrefix(resp.Token, ServiceTokenPrefix), "token must use tha_ prefix")
	assert.NotZero(t, resp.TokenID)

	// User payload exposes no password material — PasswordHash has json:"-".
	assert.NotContains(t, w.Body.String(), "password_hash")
	assert.NotContains(t, w.Body.String(), "PasswordHash")

	// Server should have stored the sha256 hash, NOT the plaintext.
	var row ServiceAccountToken
	require.NoError(t, db.First(&row, resp.TokenID).Error)
	assert.Equal(t, HashServiceToken(resp.Token), row.TokenHash)
	assert.NotEqual(t, resp.Token, row.TokenHash, "stored value must not be plaintext")
	assert.Nil(t, row.RevokedAt)
	assert.Nil(t, row.LastUsedAt)
}

func TestCreateServiceAccount_DefaultDisplayName(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "deploy-bot"})
	require.Equal(t, http.StatusCreated, w.Code)

	var resp struct {
		User User `json:"user"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "deploy-bot", resp.User.DisplayName)
}

func TestCreateServiceAccount_MissingName_400(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := postJSON(t, r, "/service-accounts", map[string]any{"display_name": "Nameless"})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCreateServiceAccount_DuplicateEmail_500(t *testing.T) {
	// Email is unique-indexed; a duplicate Name yields the same email and should error.
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	first := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, first.Code)

	dup := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	assert.Equal(t, http.StatusInternalServerError, dup.Code,
		"duplicate name should fail at the unique-index check; body: %s", dup.Body.String())
}

func TestIssuedToken_AuthenticatesViaMiddleware(t *testing.T) {
	_, h, m := newSATestEnv(t)
	r := makeSAHandlerRouter(h)
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		uid, _ := c.Get("user_id")
		c.JSON(http.StatusOK, gin.H{"user_id": uid})
	})

	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var resp struct {
		User  User   `json:"user"`
		Token string `json:"token"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &resp))

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+resp.Token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())
	var ctxResp map[string]any
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &ctxResp))
	assert.EqualValues(t, resp.User.ID, ctxResp["user_id"])
}

func TestIssueToken_ForExistingSA_AddsAdditionalValidToken(t *testing.T) {
	db, h, m := newSATestEnv(t)
	r := makeSAHandlerRouter(h)
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Create SA + first token.
	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var initial struct {
		User  User   `json:"user"`
		Token string `json:"token"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &initial))

	// Issue a second token.
	second := postJSON(t, r,
		fmt.Sprintf("/service-accounts/%d/tokens", initial.User.ID),
		IssueTokenRequest{Name: "secondary"},
	)
	require.Equal(t, http.StatusCreated, second.Code, "body: %s", second.Body.String())
	var issueResp struct {
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
		UserID  uint   `json:"user_id"`
	}
	require.NoError(t, json.Unmarshal(second.Body.Bytes(), &issueResp))
	assert.True(t, strings.HasPrefix(issueResp.Token, ServiceTokenPrefix))
	assert.Equal(t, initial.User.ID, issueResp.UserID)
	assert.NotEqual(t, initial.Token, issueResp.Token, "tokens must differ")

	// Both tokens authenticate.
	for _, tok := range []string{initial.Token, issueResp.Token} {
		req := httptest.NewRequest(http.MethodGet, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+tok)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code, "token should authenticate; body: %s", w.Body.String())
	}

	// DB has two un-revoked rows for this SA.
	var count int64
	require.NoError(t, db.Model(&ServiceAccountToken{}).
		Where("user_id = ? AND revoked_at IS NULL", initial.User.ID).Count(&count).Error)
	assert.EqualValues(t, 2, count)
}

func TestIssueToken_NonExistentSA_404(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := postJSON(t, r, "/service-accounts/9999/tokens", IssueTokenRequest{Name: "x"})
	assert.Equal(t, http.StatusNotFound, w.Code, "body: %s", w.Body.String())
	assert.Contains(t, w.Body.String(), "service account not found")
}

func TestIssueToken_NotAServiceAccountUser_404(t *testing.T) {
	// Issuing a token for a regular user (is_service_account = false) must 404.
	db, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	human := &User{Email: "human@example.com", IsServiceAccount: false}
	require.NoError(t, db.Create(human).Error)

	w := postJSON(t, r,
		fmt.Sprintf("/service-accounts/%d/tokens", human.ID),
		IssueTokenRequest{Name: "nope"},
	)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestIssueToken_InvalidIDParam_400(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := postJSON(t, r, "/service-accounts/not-a-number/tokens", IssueTokenRequest{Name: "x"})
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestIssueToken_MissingName_400(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	// Create a SA first so we get past the existence check.
	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var resp struct {
		User User `json:"user"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &resp))

	w := postJSON(t, r,
		fmt.Sprintf("/service-accounts/%d/tokens", resp.User.ID),
		map[string]any{},
	)
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRevokeToken_PreventsFurtherAuth(t *testing.T) {
	db, h, m := newSATestEnv(t)
	r := makeSAHandlerRouter(h)
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var resp struct {
		User    User   `json:"user"`
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &resp))

	// Sanity: token works before revoke.
	pre := httptest.NewRequest(http.MethodGet, "/protected", nil)
	pre.Header.Set("Authorization", "Bearer "+resp.Token)
	preW := httptest.NewRecorder()
	r.ServeHTTP(preW, pre)
	require.Equal(t, http.StatusOK, preW.Code)

	// Revoke.
	rev := deleteReq(t, r, fmt.Sprintf("/service-accounts/tokens/%d", resp.TokenID))
	require.Equal(t, http.StatusNoContent, rev.Code, "body: %s", rev.Body.String())

	// revoked_at populated.
	var row ServiceAccountToken
	require.NoError(t, db.First(&row, resp.TokenID).Error)
	require.NotNil(t, row.RevokedAt)
	assert.Greater(t, *row.RevokedAt, int64(0))

	// Token now rejected.
	post := httptest.NewRequest(http.MethodGet, "/protected", nil)
	post.Header.Set("Authorization", "Bearer "+resp.Token)
	postW := httptest.NewRecorder()
	r.ServeHTTP(postW, post)
	assert.Equal(t, http.StatusUnauthorized, postW.Code)
}

func TestRevokeToken_OnlyRevokesTargetedToken(t *testing.T) {
	_, h, m := newSATestEnv(t)
	r := makeSAHandlerRouter(h)
	r.GET("/protected", m.RequireAuth(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var initial struct {
		User    User   `json:"user"`
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &initial))

	second := postJSON(t, r,
		fmt.Sprintf("/service-accounts/%d/tokens", initial.User.ID),
		IssueTokenRequest{Name: "extra"},
	)
	require.Equal(t, http.StatusCreated, second.Code)
	var issued struct {
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(second.Body.Bytes(), &issued))

	// Revoke only the first token.
	rev := deleteReq(t, r, fmt.Sprintf("/service-accounts/tokens/%d", initial.TokenID))
	require.Equal(t, http.StatusNoContent, rev.Code)

	// First fails.
	req1 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req1.Header.Set("Authorization", "Bearer "+initial.Token)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusUnauthorized, w1.Code)

	// Second still works.
	req2 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req2.Header.Set("Authorization", "Bearer "+issued.Token)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code, "body: %s", w2.Body.String())
}

func TestRevokeToken_NonExistent_404(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := deleteReq(t, r, "/service-accounts/tokens/9999")
	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Contains(t, w.Body.String(), "token not found")
}

func TestRevokeToken_AlreadyRevoked_404(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	create := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "ci-bot"})
	require.Equal(t, http.StatusCreated, create.Code)
	var resp struct {
		TokenID uint `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(create.Body.Bytes(), &resp))

	first := deleteReq(t, r, fmt.Sprintf("/service-accounts/tokens/%d", resp.TokenID))
	require.Equal(t, http.StatusNoContent, first.Code)

	second := deleteReq(t, r, fmt.Sprintf("/service-accounts/tokens/%d", resp.TokenID))
	assert.Equal(t, http.StatusNotFound, second.Code)
}

func TestRevokeToken_InvalidIDParam_400(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := deleteReq(t, r, "/service-accounts/tokens/not-a-number")
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestListServiceAccounts_ReturnsTokensWithoutSecretMaterial(t *testing.T) {
	db, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	// Seed: one regular user + two service accounts (one with two tokens).
	require.NoError(t, db.Create(&User{Email: "human@example.com"}).Error)

	createA := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "alpha"})
	require.Equal(t, http.StatusCreated, createA.Code)
	var alpha struct {
		User    User   `json:"user"`
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(createA.Body.Bytes(), &alpha))

	createB := postJSON(t, r, "/service-accounts", CreateServiceAccountRequest{Name: "beta"})
	require.Equal(t, http.StatusCreated, createB.Code)
	var beta struct {
		User    User   `json:"user"`
		Token   string `json:"token"`
		TokenID uint   `json:"token_id"`
	}
	require.NoError(t, json.Unmarshal(createB.Body.Bytes(), &beta))

	// Extra token for alpha.
	extra := postJSON(t, r,
		fmt.Sprintf("/service-accounts/%d/tokens", alpha.User.ID),
		IssueTokenRequest{Name: "alpha-2"},
	)
	require.Equal(t, http.StatusCreated, extra.Code)
	var extraResp struct {
		Token string `json:"token"`
	}
	require.NoError(t, json.Unmarshal(extra.Body.Bytes(), &extraResp))

	w := getReq(t, r, "/service-accounts")
	require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())

	var list []ServiceAccountWithTokens
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &list))
	require.Len(t, list, 2, "should only return service accounts (not human user)")

	// Ordered by created_at asc → alpha first.
	assert.Equal(t, alpha.User.ID, list[0].ID)
	assert.True(t, list[0].IsServiceAccount)
	assert.Len(t, list[0].Tokens, 2, "alpha should have two tokens")

	assert.Equal(t, beta.User.ID, list[1].ID)
	assert.Len(t, list[1].Tokens, 1)

	// Crucially: response body must not contain any plaintext token or password material.
	body := w.Body.String()
	assert.NotContains(t, body, alpha.Token, "plaintext token must not be returned by list")
	assert.NotContains(t, body, beta.Token, "plaintext token must not be returned by list")
	assert.NotContains(t, body, extraResp.Token, "plaintext token must not be returned by list")
	assert.NotContains(t, body, "token_hash", "token hash must not be exposed")
	assert.NotContains(t, body, "TokenHash")
	assert.NotContains(t, body, "password_hash")
	assert.NotContains(t, body, "PasswordHash")
}

func TestListServiceAccounts_Empty(t *testing.T) {
	_, h, _ := newSATestEnv(t)
	r := makeSAHandlerRouter(h)

	w := getReq(t, r, "/service-accounts")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "[]", strings.TrimSpace(w.Body.String()))
}
