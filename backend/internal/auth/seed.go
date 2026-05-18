package auth

import (
	"log"

	"gorm.io/gorm"
)

// SeedAdmin creates an admin user from the given email/password if no users exist.
// `usedDefaults` indicates whether the caller fell back to default creds; if true,
// the credentials are logged for visibility.
func SeedAdmin(db *gorm.DB, email, password string, usedDefaults bool) error {
	var count int64
	if err := db.Model(&User{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	hash, err := HashPassword(password)
	if err != nil {
		return err
	}
	u := User{
		Email:        email,
		PasswordHash: hash,
		DisplayName:  "Administrator",
		IsAdmin:      true,
	}
	if err := db.Create(&u).Error; err != nil {
		return err
	}
	if usedDefaults {
		log.Printf("seeded default admin user — email=%s password=%s — CHANGE IMMEDIATELY", email, password)
	} else {
		log.Printf("seeded admin user — email=%s", email)
	}
	return nil
}
