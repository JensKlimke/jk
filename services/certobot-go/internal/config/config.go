// Package config provides configuration handling for the certobot service
package config

import (
	"os"
	"time"

	"github.com/sirupsen/logrus"
)

// Config holds the configuration for the certobot service
type Config struct {
	// Path to the certificates directory
	CertsPath string
	// Path to the file tracking removed domains
	RemovedDomainsFile string
	// Path to the webroot directory
	WebrootPath string
	// Default domain name
	DefaultDomain string
	// Default certificate common name
	DefaultCertCN string
	// Interval for certificate renewal checks
	RenewalInterval time.Duration
	// Interval for certificate cleanup
	CleanupInterval time.Duration
	// Email address for certificate registration
	Email string
}

// New creates a new Config instance with default values
func New() (*Config, error) {
	// Get EMAIL from environment variable
	email := os.Getenv("EMAIL")
	if email == "" {
		logrus.Error("EMAIL environment variable is not set. Cannot proceed with certificate operations.")
		return nil, ErrEmailNotSet
	}

	return &Config{
		CertsPath:          "/etc/letsencrypt/live",
		RemovedDomainsFile: "/tmp/removed_domains.txt",
		WebrootPath:        "/var/www/certbot",
		DefaultDomain:      "default",
		DefaultCertCN:      "default.local",
		RenewalInterval:    12 * time.Hour,
		CleanupInterval:    24 * time.Hour,
		Email:              email,
	}, nil
}

// Error definitions
var (
	ErrEmailNotSet = NewError("EMAIL environment variable is not set")
)

// Error represents a configuration error
type Error struct {
	Message string
}

// NewError creates a new Error
func NewError(message string) *Error {
	return &Error{Message: message}
}

// Error returns the error message
func (e *Error) Error() string {
	return e.Message
}
