package config

import (
	"os"
	"testing"
	"time"
)

func TestNewWithEmail(t *testing.T) {
	// Set the EMAIL environment variable
	os.Setenv("EMAIL", "test@example.com")
	defer os.Unsetenv("EMAIL")

	// Create a new Config
	cfg, err := New()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Check that the values are as expected
	if cfg.Email != "test@example.com" {
		t.Errorf("Expected Email to be test@example.com, got %s", cfg.Email)
	}
	if cfg.DefaultDomain != "default" {
		t.Errorf("Expected DefaultDomain to be default, got %s", cfg.DefaultDomain)
	}
	if cfg.DefaultCertCN != "default.local" {
		t.Errorf("Expected DefaultCertCN to be default.local, got %s", cfg.DefaultCertCN)
	}
	if cfg.RenewalInterval != 12*time.Hour {
		t.Errorf("Expected RenewalInterval to be 12h, got %v", cfg.RenewalInterval)
	}
}

func TestNewWithoutEmail(t *testing.T) {
	// Ensure the EMAIL environment variable is not set
	os.Unsetenv("EMAIL")

	// Create a new Config
	cfg, err := New()
	if err == nil {
		t.Fatalf("Expected an error, got nil")
	}
	if err != ErrEmailNotSet {
		t.Errorf("Expected error to be ErrEmailNotSet, got %v", err)
	}
	if cfg != nil {
		t.Errorf("Expected cfg to be nil, got %v", cfg)
	}
}
