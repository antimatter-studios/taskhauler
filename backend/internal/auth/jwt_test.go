package auth

import (
	"fmt"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

const testSecret = "test-secret-do-not-use-in-prod"

func testUser() *User {
	return &User{ID: 42, Email: "alice@example.com", IsAdmin: true}
}

func TestIssueAccessToken_HasCorrectClaims(t *testing.T) {
	issuer := NewIssuer(testSecret)
	u := testUser()
	before := time.Now()
	tok, err := issuer.IssueAccess(u)
	after := time.Now()
	require.NoError(t, err)
	require.NotEmpty(t, tok)

	claims, err := issuer.Parse(tok)
	require.NoError(t, err)
	assert.Equal(t, fmt.Sprintf("%d", u.ID), claims.Subject)
	assert.Equal(t, u.Email, claims.Email)
	assert.True(t, claims.IsAdmin)
	assert.Equal(t, tokenTypeAccess, claims.TokenType)

	require.NotNil(t, claims.ExpiresAt)
	exp := claims.ExpiresAt.Time
	expectedMin := before.Add(accessTokenTTL).Add(-2 * time.Second)
	expectedMax := after.Add(accessTokenTTL).Add(2 * time.Second)
	assert.WithinRange(t, exp, expectedMin, expectedMax, "access exp should be ~1h out")
}

func TestIssueRefreshToken_HasCorrectClaims(t *testing.T) {
	issuer := NewIssuer(testSecret)
	u := testUser()
	before := time.Now()
	tok, err := issuer.IssueRefresh(u)
	after := time.Now()
	require.NoError(t, err)

	claims, err := issuer.Parse(tok)
	require.NoError(t, err)
	assert.Equal(t, tokenTypeRefresh, claims.TokenType)

	require.NotNil(t, claims.ExpiresAt)
	exp := claims.ExpiresAt.Time
	expectedMin := before.Add(refreshTokenTTL).Add(-2 * time.Second)
	expectedMax := after.Add(refreshTokenTTL).Add(2 * time.Second)
	assert.WithinRange(t, exp, expectedMin, expectedMax, "refresh exp should be ~30d out")
}

func TestParseValidAccessToken(t *testing.T) {
	issuer := NewIssuer(testSecret)
	u := testUser()
	tok, err := issuer.IssueAccess(u)
	require.NoError(t, err)

	c, err := issuer.ParseAccess(tok)
	require.NoError(t, err)
	assert.Equal(t, u.Email, c.Email)
	assert.Equal(t, u.IsAdmin, c.IsAdmin)
	assert.Equal(t, fmt.Sprintf("%d", u.ID), c.Subject)
}

func TestParseRefreshTokenAsAccess_Fails(t *testing.T) {
	issuer := NewIssuer(testSecret)
	tok, err := issuer.IssueRefresh(testUser())
	require.NoError(t, err)

	_, err = issuer.ParseAccess(tok)
	assert.Error(t, err, "refresh token must not validate as an access token")
}

func TestParseExpiredToken_Fails(t *testing.T) {
	issuer := NewIssuer(testSecret)
	// Hand-roll an expired token using the same Claims struct.
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
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(testSecret))
	require.NoError(t, err)

	_, err = issuer.Parse(signed)
	assert.Error(t, err, "expired token must be rejected")
}

func TestParseInvalidSignature_Fails(t *testing.T) {
	issuer := NewIssuer(testSecret)
	tok, err := issuer.IssueAccess(testUser())
	require.NoError(t, err)
	// Flip the last byte of the signature.
	tampered := tok[:len(tok)-1]
	if tok[len(tok)-1] == 'A' {
		tampered += "B"
	} else {
		tampered += "A"
	}
	_, err = issuer.Parse(tampered)
	assert.Error(t, err, "tampered signature must be rejected")
}

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("hunter2")
	require.NoError(t, err)
	require.NotEmpty(t, hash)
	assert.True(t, CheckPassword(hash, "hunter2"))
}

func TestCheckPassword_WrongPassword_Fails(t *testing.T) {
	hash, err := HashPassword("hunter2")
	require.NoError(t, err)
	assert.False(t, CheckPassword(hash, "wrong-password"))
}

func TestImportedBcryptHash_StillVerifies(t *testing.T) {
	// Simulate a hash created by TA's importer at cost 12 (TH-10/TH-16 claim
	// is that imported bcrypt hashes are still verifiable by CheckPassword,
	// which uses x/crypto/bcrypt regardless of cost).
	raw, err := bcrypt.GenerateFromPassword([]byte("imported-pw"), 12)
	require.NoError(t, err)
	assert.True(t, CheckPassword(string(raw), "imported-pw"))
	assert.False(t, CheckPassword(string(raw), "not-the-password"))
}
