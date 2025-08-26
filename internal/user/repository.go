package user

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	Create(u *User) error
	GetByID(id uuid.UUID) (*User, error)
	GetByName(name string) ([]User, error)
	List() ([]User, error)
	Delete(id uuid.UUID) error
	SetRoles(id uuid.UUID, roles []string) error
	AddRoles(id uuid.UUID, roles []string) error
	RemoveRoles(id uuid.UUID, roles []string) error
	HasRolesAll(id uuid.UUID, roles []string) (bool, error)
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
	if err := r.db.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(name)+"%").Find(&list).Error; err != nil {
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

func uniqueStrings(in []string) []string {
	m := map[string]struct{}{}
	var out []string
	for _, v := range in {
		v = strings.TrimSpace(v)
		if v == "" {
			continue
		}
		if _, ok := m[v]; !ok {
			m[v] = struct{}{}
			out = append(out, v)
		}
	}
	return out
}

func (r *repo) SetRoles(id uuid.UUID, roles []string) error {
	roles = uniqueStrings(roles)
	return r.db.Model(&User{}).Where("id = ?", id).Update("roles", roles).Error
}

func (r *repo) AddRoles(id uuid.UUID, roles []string) error {
	if len(roles) == 0 {
		return nil
	}
	var u User
	if err := r.db.Select("id", "roles").First(&u, "id=?", id).Error; err != nil {
		return err
	}
	m := map[string]struct{}{}
	for _, r := range u.Roles {
		m[r] = struct{}{}
	}
	for _, r := range roles {
		if strings.TrimSpace(r) != "" {
			m[r] = struct{}{}
		}
	}
	var merged []string
	for k := range m {
		merged = append(merged, k)
	}
	return r.db.Model(&User{}).Where("id=?", id).Update("roles", merged).Error
}

func (r *repo) RemoveRoles(id uuid.UUID, roles []string) error {
	var u User
	if err := r.db.Select("id", "roles").First(&u, "id=?", id).Error; err != nil {
		return err
	}
	remove := map[string]struct{}{}
	for _, r := range roles {
		remove[strings.TrimSpace(r)] = struct{}{}
	}
	var keep []string
	for _, r := range u.Roles {
		if _, ok := remove[r]; !ok {
			keep = append(keep, r)
		}
	}
	return r.db.Model(&User{}).Where("id=?", id).Update("roles", keep).Error
}

func (r *repo) HasRolesAll(id uuid.UUID, roles []string) (bool, error) {
	if len(roles) == 0 {
		return false, errors.New("no roles provided")
	}
	var u User
	if err := r.db.Select("id", "roles").First(&u, "id=?", id).Error; err != nil {
		return false, err
	}
	set := map[string]struct{}{}
	for _, r := range u.Roles {
		set[r] = struct{}{}
	}
	for _, q := range roles {
		q = strings.TrimSpace(q)
		if q == "" {
			continue
		}
		if _, ok := set[q]; !ok {
			return false, nil
		}
	}
	return true, nil
}
