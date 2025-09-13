package user

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name         string    `json:"name" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Permissions  int64     `json:"permissions" gorm:"not null;default:0"`
	CreatedAt    time.Time `json:"created_at" gorm:"default:now()"`
}

// API REQUESTS

type CreateUserRequest struct {
	Name        string   `json:"name"`
	Password    string   `json:"password"`
	Permissions []string `json:"permissions,omitempty"`
}

type UpdatePermissionsRequest struct {
	Add    []string `json:"add"`
	Remove []string `json:"remove"`
	Set    []string `json:"set"`
}

// API RESPONSE

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
