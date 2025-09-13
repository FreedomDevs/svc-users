package user

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Create(ctx context.Context, req CreateUserRequest) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByName(ctx context.Context, name string) ([]User, error)
	List(ctx context.Context) ([]User, error)
	Delete(ctx context.Context, id uuid.UUID) error
	UpdatePermissions(ctx context.Context, id uuid.UUID, req UpdatePermissionsRequest) (*User, error)
	HasPermissions(ctx context.Context, id uuid.UUID, perms []string) (bool, error)
}

type service struct{ repo Repository }

func NewService(r Repository) Service { return &service{repo: r} }

func (s *service) Create(ctx context.Context, req CreateUserRequest) (*User, error) {
	if strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Password) == "" {
		return nil, errors.New("name and password required")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	mask := ResolvePermissions(req.Permissions)

	if mask == 0 {
		mask = Groups["Default"]
	}

	u := &User{
		Name:         strings.TrimSpace(req.Name),
		PasswordHash: string(hash),
		Permissions:  mask,
	}

	if err := s.repo.Create(u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return s.repo.GetByID(id)
}
func (s *service) GetByName(ctx context.Context, name string) ([]User, error) {
	return s.repo.GetByName(name)
}
func (s *service) List(ctx context.Context) ([]User, error)       { return s.repo.List() }
func (s *service) Delete(ctx context.Context, id uuid.UUID) error { return s.repo.Delete(id) }

func (s *service) UpdatePermissions(ctx context.Context, id uuid.UUID, req UpdatePermissionsRequest) (*User, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if len(req.Set) > 0 {
		u.Permissions = ResolvePermissions(req.Set)
	} else {
		if len(req.Add) > 0 {
			u.Permissions = AddPermissions(u.Permissions, req.Add)
		}
		if len(req.Remove) > 0 {
			u.Permissions = RemovePermissions(u.Permissions, req.Remove)
		}
	}

	if err := s.repo.SetPermissions(id, u.Permissions); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *service) HasPermissions(ctx context.Context, id uuid.UUID, perms []string) (bool, error) {
	u, err := s.repo.GetByID(id)
	if err != nil {
		return false, err
	}
	return HasPermissions(u.Permissions, perms), nil
}
