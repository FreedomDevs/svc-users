package user

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type User struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Name         string         `json:"name" gorm:"uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"not null"`
	Roles        pq.StringArray `json:"roles" gorm:"type:text[]"`
	CreatedAt    time.Time      `json:"created_at" gorm:"default:now()"`
}

type CreateUserRequest struct {
	Name     string   `json:"name"`
	Password string   `json:"password"`
	Roles    []string `json:"roles"`
}

type UpdateRolesRequest struct {
	Add    []string `json:"add"`
	Remove []string `json:"remove"`
	Set    []string `json:"set"`
}
