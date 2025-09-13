package user

import (
	"encoding/json"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"net/http"
	"strings"
	"time"
)

type Handler struct{ svc Service }

func NewHTTPHandler(s Service) *Handler { return &Handler{svc: s} }

func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/", h.createUser)
	r.Get("/", h.listUsers)
	r.Get("/{id}", h.getUser)
	r.Delete("/{id}", h.deleteUser)
	r.Patch("/{id}/permissions", h.updatePermissions)
	r.Get("/{id}/has-perms/{perms}", h.hasPermissions)
	return r
}

func (h *Handler) createUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.svc.Create(r.Context(), req)
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, http.StatusCreated, u)
}

func (h *Handler) listUsers(w http.ResponseWriter, r *http.Request) {
	if q := r.URL.Query().Get("name"); q != "" {
		list, err := h.svc.GetByName(r.Context(), q)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err)
			return
		}
		writeJSON(w, http.StatusOK, list)
		return
	}
	list, err := h.svc.List(r.Context())
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) getUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h *Handler) deleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeErr(w, http.StatusNotFound, err)
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}

func (h *Handler) updatePermissions(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	var req UpdatePermissionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	u, err := h.svc.UpdatePermissions(r.Context(), id, req)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h *Handler) hasPermissions(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeErr(w, http.StatusBadRequest, err)
		return
	}
	permsParam := chi.URLParam(r, "perms")
	perms := strings.Split(permsParam, ",")
	ok, err := h.svc.HasPermissions(r.Context(), id, perms)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": ok})
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	var resp ApiResponse

	switch u := v.(type) {
	case *User:
		atomicPerms := PermissionsToAtomicStrings(u.Permissions)

		resp = ApiResponse{Success: true, Data: struct {
			ID          uuid.UUID `json:"id"`
			Name        string    `json:"name"`
			Permissions []string  `json:"permissions"`
			CreatedAt   time.Time `json:"created_at"`
		}{
			ID:          u.ID,
			Name:        u.Name,
			Permissions: atomicPerms,
			CreatedAt:   u.CreatedAt,
		}}
	case []User:
		users := make([]struct {
			ID          uuid.UUID `json:"id"`
			Name        string    `json:"name"`
			Permissions []string  `json:"permissions"`
			CreatedAt   time.Time `json:"created_at"`
		}, len(u))

		for i, usr := range u {
			users[i] = struct {
				ID          uuid.UUID `json:"id"`
				Name        string    `json:"name"`
				Permissions []string  `json:"permissions"`
				CreatedAt   time.Time `json:"created_at"`
			}{
				ID:          usr.ID,
				Name:        usr.Name,
				Permissions: PermissionsToAtomicStrings(usr.Permissions),
				CreatedAt:   usr.CreatedAt,
			}
		}

		resp = ApiResponse{Success: true, Data: users}
	default:
		resp = ApiResponse{Success: true, Data: v}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(resp)
}

func writeErr(w http.ResponseWriter, code int, err error) {
	resp := ApiResponse{Success: false, Error: err.Error()}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(resp)
}

