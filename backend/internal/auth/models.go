package auth

import (
	"gorm.io/gorm"
)

// User is the authenticated identity for both humans and service accounts.
type User struct {
	ID               uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Email            string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash     string         `gorm:"column:password_hash" json:"-"`
	DisplayName      string         `json:"display_name"`
	IsAdmin          bool           `gorm:"default:false" json:"is_admin"`
	IsServiceAccount bool           `gorm:"default:false" json:"is_service_account"`
	CreatedAt        int64          `gorm:"autoCreateTime:milli" json:"created_at"`
	UpdatedAt        int64          `gorm:"autoUpdateTime:milli" json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}

// ServiceAccountToken stores hashes of long-lived bearer tokens (`tha_*`).
type ServiceAccountToken struct {
	ID         uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint           `gorm:"index;not null" json:"user_id"`
	Name       string         `json:"name"`
	TokenHash  string         `gorm:"uniqueIndex;not null" json:"-"`
	LastUsedAt *int64         `json:"last_used_at"`
	CreatedAt  int64          `gorm:"autoCreateTime:milli" json:"created_at"`
	RevokedAt  *int64         `json:"revoked_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}

// AutoMigrate runs schema migrations for the auth tables.
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(&User{}, &ServiceAccountToken{})
}

// FormatName returns the display name with email fallback. Mirrors usercache.UserInfo.
func (u *User) FormatName() string {
	if u == nil {
		return ""
	}
	if u.DisplayName != "" {
		return u.DisplayName + " (" + u.Email + ")"
	}
	return u.Email
}
