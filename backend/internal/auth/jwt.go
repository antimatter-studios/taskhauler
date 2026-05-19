package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	accessTokenTTL  = time.Hour
	refreshTokenTTL = 30 * 24 * time.Hour

	tokenTypeAccess  = "access"
	tokenTypeRefresh = "refresh"

	ServiceTokenPrefix = "tha_"
)

// Claims is the JWT payload for access and refresh tokens.
type Claims struct {
	Email     string `json:"email,omitempty"`
	IsAdmin   bool   `json:"is_admin,omitempty"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

// Issuer mints and validates JWTs. The secret is required.
type Issuer struct {
	secret []byte
}

// NewIssuer constructs an Issuer. Panics if secret is empty so misconfig is loud.
func NewIssuer(secret string) *Issuer {
	if secret == "" {
		panic("auth: JWT secret must not be empty")
	}
	return &Issuer{secret: []byte(secret)}
}

// IssueAccess returns a signed access token for the given user.
func (i *Issuer) IssueAccess(u *User) (string, error) {
	return i.sign(u, tokenTypeAccess, accessTokenTTL)
}

// IssueRefresh returns a signed refresh token for the given user.
func (i *Issuer) IssueRefresh(u *User) (string, error) {
	return i.sign(u, tokenTypeRefresh, refreshTokenTTL)
}

func (i *Issuer) sign(u *User, typ string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		Email:     u.Email,
		IsAdmin:   u.IsAdmin,
		TokenType: typ,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", u.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(i.secret)
}

// Parse validates a JWT and returns its claims. Token-type is NOT checked here.
func (i *Issuer) Parse(tokenStr string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return i.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// ParseAccess validates a JWT and rejects refresh-type tokens.
func (i *Issuer) ParseAccess(tokenStr string) (*Claims, error) {
	c, err := i.Parse(tokenStr)
	if err != nil {
		return nil, err
	}
	if c.TokenType != tokenTypeAccess && c.TokenType != "" {
		// Empty TokenType is treated as access for backward compat.
		return nil, errors.New("expected access token")
	}
	return c, nil
}

// ParseRefresh validates a JWT and requires refresh-type.
func (i *Issuer) ParseRefresh(tokenStr string) (*Claims, error) {
	c, err := i.Parse(tokenStr)
	if err != nil {
		return nil, err
	}
	if c.TokenType != tokenTypeRefresh {
		return nil, errors.New("expected refresh token")
	}
	return c, nil
}

// HashPassword bcrypts a plaintext password.
func HashPassword(plain string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

// CheckPassword reports whether plain matches the stored bcrypt hash.
func CheckPassword(hash, plain string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain)) == nil
}

// GenerateServiceToken returns a new opaque token prefixed with "tha_".
func GenerateServiceToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return ServiceTokenPrefix + hex.EncodeToString(buf), nil
}

// HashServiceToken returns the sha256 hex of a token, used for lookup.
func HashServiceToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
