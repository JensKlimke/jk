// Package config provides configuration handling for the service-manager
package config

import (
	"os"
	"time"

	"github.com/sirupsen/logrus"
)

// Config holds the configuration for the service-manager
type Config struct {
	CertsPath       string        // Path to the certificates directory
	WebrootPath     string        // Path to the webroot directory
	DefaultDomain   string        // Default domain name
	DefaultCertCN   string        // Default certificate common name
	RenewalInterval time.Duration // Interval for certificate renewal checks
	Email           string        // Email address for certificate registration

	// Configuration generation settings
	TemplatePath    string        // Path to the Nginx template file
	OutputPath      string        // Path to write the generated configuration
	ConfigInterval  time.Duration // Interval for configuration generation checks
	LogsDir         string        // Directory to store configuration logs
}

// New creates a new Config instance with default values
func New() (*Config, error) {
	email := os.Getenv("EMAIL")
	if email == "" {
		logrus.Error("EMAIL environment variable is not set. Cannot proceed with certificate operations.")
		return nil, ErrEmailNotSet
	}

	// Get template path from environment variable or use default
	templatePath := os.Getenv("TEMPLATE_PATH")
	if templatePath == "" {
		templatePath = "/app/template/service.conf.mustache"
	}

	// Get output path from environment variable or use default
	outputPath := os.Getenv("OUTPUT_PATH")
	if outputPath == "" {
		outputPath = "/app/output/services.conf"
	}

	// Get logs directory from environment variable or use default
	logsDir := os.Getenv("LOGS_DIR")
	if logsDir == "" {
		logsDir = "/app/logs/nginx-conf"
	}

	// Parse config interval from environment variable or use default
	configIntervalStr := os.Getenv("CONFIG_INTERVAL")
	configInterval := 30 * time.Second // Default to 30 seconds
	if configIntervalStr != "" {
		if interval, err := time.ParseDuration(configIntervalStr); err == nil {
			configInterval = interval
		} else {
			logrus.Warnf("Invalid CONFIG_INTERVAL format: %s, using default", configIntervalStr)
		}
	}

	return &Config{
		CertsPath:       "/etc/letsencrypt/live",
		WebrootPath:     "/var/www/certbot",
		DefaultDomain:   "default",
		DefaultCertCN:   "default.local",
		RenewalInterval: 12 * time.Hour,
		Email:           email,

		// Configuration generation settings
		TemplatePath:    templatePath,
		OutputPath:      outputPath,
		ConfigInterval:  configInterval,
		LogsDir:         logsDir,
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
