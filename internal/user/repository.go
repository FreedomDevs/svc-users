package user

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	Create(u *User) error
	GetByID(id uuid.UUID) (*User, error)
	GetByName(name string) ([]User, error)
	List() ([]User, error)
	Delete(id uuid.UUID) error
	SetPermissions(id uuid.UUID, mask int64) error
}

type repo struct{ db *gorm.DB }

func NewRepository(db *gorm.DB) Repository { return &repo{db: db} }

func (r *repo) Create(u *User) error { return r.db.Create(u).Error }

func (r *repo) GetByID(id uuid.UUID) (*User, error) {
	var u User
	if err := r.db.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *repo) GetByName(name string) ([]User, error) {
	var list []User
	if err := r.db.Where("LOWER(name) LIKE LOWER(?)", "%"+name+"%").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repo) List() ([]User, error) {
	var list []User
	if err := r.db.Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *repo) Delete(id uuid.UUID) error {
	res := r.db.Delete(&User{}, "id = ?", id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *repo) SetPermissions(id uuid.UUID, mask int64) error {
	return r.db.Model(&User{}).Where("id = ?", id).Update("permissions", mask).Error
}
