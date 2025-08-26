package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"gorm.io/gorm/logger"

	"svc-users/internal/config"
	"svc-users/internal/db"
	"svc-users/internal/user"
)

func main() {
	cfg, err := config.Load("configs/config.yaml")
	if err != nil {
		panic(err)
	}

	gormLevel := logger.Silent
	if cfg.App.Env == "dev" {
		gormLevel = logger.Info
	}

	ctx := context.Background()
	dbConn, err := db.Open(ctx, cfg.Postgres.DSN(), gormLevel)
	if err != nil {
		panic(err)
	}

	dbConn.AutoMigrate(&user.User{})

	repo := user.NewRepository(dbConn)
	svc := user.NewService(repo)
	handler := user.NewHTTPHandler(svc)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	r.Mount("/users", handler.Routes())

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.App.Port),
		Handler: r,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			panic(err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit

	ctxShut, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctxShut)
}
