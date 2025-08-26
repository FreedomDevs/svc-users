package config

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type AppCfg struct {
	Name string `yaml:"name"`
	Env  string `yaml:"env"`
	Port int    `yaml:"port"`
}

type LogCfg struct {
	Level string `yaml:"level"`
}

type PgCfg struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	DBName   string `yaml:"dbname"`
	SSLMode  string `yaml:"sslmode"`
}

type PromCfg struct {
	Enabled bool   `yaml:"enabled"`
	Path    string `yaml:"path"`
}

type Config struct {
	App        AppCfg  `yaml:"app"`
	Log        LogCfg  `yaml:"log"`
	Postgres   PgCfg   `yaml:"postgres"`
	Prometheus PromCfg `yaml:"prometheus"`
}

func Load(path string) (*Config, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var c Config
	if err := yaml.Unmarshal(b, &c); err != nil {
		return nil, err
	}

	if dsn := os.Getenv("POSTGRES_DSN"); dsn != "" {
		os.Setenv("POSTGRES_DSN", dsn)
	}
	if v := os.Getenv("APP_ENV"); v != "" {
		c.App.Env = v
	}
	if v := os.Getenv("LOG_LEVEL"); v != "" {
		c.Log.Level = v
	}
	return &c, nil
}

func (p PgCfg) DSN() string {
	if dsn := os.Getenv("POSTGRES_DSN"); dsn != "" {
		return dsn
	}
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		p.Host, p.Port, p.User, p.Password, p.DBName, p.SSLMode,
	)
}
