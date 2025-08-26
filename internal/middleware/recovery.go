package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
)

func Recoverer(next http.Handler) http.Handler                { return middleware.Recoverer(next) }
func Timeout(d time.Duration) func(http.Handler) http.Handler { return middleware.Timeout(d) }
func RealIP() func(http.Handler) http.Handler                 { return middleware.RealIP }
func WithRequestID() func(http.Handler) http.Handler          { return middleware.RequestID }
