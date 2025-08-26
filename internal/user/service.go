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
	UpdateRoles(ctx context.Context, id uuid.UUID, req UpdateRolesRequest) (*User, error)
	HasRolesAll(ctx context.Context, id uuid.UUID, roles []string) (bool, error)
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
	u := &User{Name: strings.TrimSpace(req.Name), PasswordHash: string(hash), Roles: req.Roles}
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

func (s *service) UpdateRoles(ctx context.Context, id uuid.UUID, req UpdateRolesRequest) (*User, error) {
	if len(req.Set) > 0 {
		if err := s.repo.SetRoles(id, req.Set); err != nil {
			return nil, err
		}
	} else {
		if len(req.Add) > 0 {
			if err := s.repo.AddRoles(id, req.Add); err != nil {
				return nil, err
			}
		}
		if len(req.Remove) > 0 {
			if err := s.repo.RemoveRoles(id, req.Remove); err != nil {
				return nil, err
			}
		}
	}
	return s.repo.GetByID(id)
}

func (s *service) HasRolesAll(ctx context.Context, id uuid.UUID, roles []string) (bool, error) {
	return s.repo.HasRolesAll(id, roles)
}
