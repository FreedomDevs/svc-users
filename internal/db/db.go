package db

import (
	"context"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Open(ctx context.Context, dsn string, logLevel logger.LogLevel) (*gorm.DB, error) {
	cfg := &gorm.Config{Logger: logger.Default.LogMode(logLevel)}
	db, err := gorm.Open(postgres.Open(dsn), cfg)
	if err != nil {
		return nil, err
	}

	sqldb, _ := db.DB()
	sqldb.SetMaxOpenConns(25)
	sqldb.SetMaxIdleConns(25)
	sqldb.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := sqldb.PingContext(ctx); err != nil {
		return nil, err
	}

	return db, nil
}
