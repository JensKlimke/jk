// Package main provides the entry point for the service-manager application
package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jens/service-manager/internal/certificate"
	"github.com/jens/service-manager/internal/config"
	"github.com/jens/service-manager/internal/docker"
	"github.com/jens/service-manager/internal/nginx"
	"github.com/sirupsen/logrus"
)

func main() {
	initializeLogger()
	logrus.Info("Starting service-manager...")

    // Load the configuration
    configuration := loadConfiguration()

	// Create and initialize components
	certManager, nginxGenerator := setupComponents(configuration)

	// Get and process initial domains
	domains := getInitialDomains(certManager)

	// Generate initial Nginx configuration
	generateInitialNginxConfig(nginxGenerator)

	// Run the main service loop
	runServiceLoop(configuration, certManager, nginxGenerator, domains)
}

// initializeLogger sets up the logging configuration
func initializeLogger() {
	logrus.SetFormatter(&logrus.TextFormatter{
		FullTimestamp: true,
	})

	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}

	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		logrus.Warnf("Invalid log level %s, defaulting to info", logLevel)
		level = logrus.InfoLevel
	}

	logrus.SetLevel(level)
}

func loadConfiguration() *config.Config {
    // Load configuration
	cfg, err := config.New()

	if err != nil {
		logrus.Fatalf("Failed to load configuration: %v", err)
	}

    return cfg
}

// setupComponents initializes the certificate manager and nginx generator
func setupComponents(cfg *config.Config) (*certificate.Manager, *nginx.Generator) {
	certManager := certificate.NewManager(cfg)
	nginxGenerator := nginx.NewGenerator(cfg)

	logrus.Info("Initializing the system...")

	if err := certManager.CheckDefaultCert(); err != nil {
		logrus.Fatalf("Failed to check default certificate: %v", err)
	}

	// Load the last Nginx configuration
	nginxGenerator.LoadLastConfig()

	return certManager, nginxGenerator
}

// generateInitialNginxConfig generates the initial Nginx configuration
func generateInitialNginxConfig(nginxGenerator *nginx.Generator) {
	logrus.Info("Generating initial Nginx configuration...")

	if err := nginxGenerator.GenerateConfig(); err != nil {
		logrus.Errorf("Failed to generate initial Nginx configuration: %v", err)
	} else {
		logrus.Info("Initial Nginx configuration generated successfully")
	}
}

// getInitialDomains retrieves and processes the initial domains
func getInitialDomains(certManager *certificate.Manager) []string {
	domains, err := docker.GetDomainsFromContainers()
	if err != nil {
		logrus.Fatalf("Failed to get domains from containers: %v", err)
	}

	logrus.Infof("Starting up with domains: %v", domains)

	if err := certManager.ProcessDomains(domains); err != nil {
		logrus.Errorf("Failed to process domains: %v", err)
	}

	return domains
}

// runServiceLoop runs the main service loop
func runServiceLoop(cfg *config.Config, certManager *certificate.Manager, nginxGenerator *nginx.Generator, initialDomains []string) {
	// Initialize timestamps for interval checks
	lastRenewalCheck := time.Now()
	lastConfigCheck := time.Now()
	domains := initialDomains

	// Set up signal handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Log main loop information
	logrus.Info("Starting main loop with different intervals for each process:")
	logrus.Info("- Domain list checking: every second")
	logrus.Infof("- Certificate renewal checking: every %v", cfg.RenewalInterval)
	logrus.Infof("- Nginx configuration checking: every %v", cfg.ConfigInterval)

	// Main loop
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			domains = processDomainUpdates(certManager, domains)
			lastRenewalCheck = checkCertificateRenewal(certManager, cfg, domains, lastRenewalCheck)
			lastConfigCheck = checkNginxConfiguration(nginxGenerator, cfg, lastConfigCheck)

		case <-stop:
			logrus.Info("Received termination signal. Shutting down...")
			return
		}
	}
}

// checkNginxConfiguration checks if Nginx configuration needs to be updated
func checkNginxConfiguration(nginxGenerator *nginx.Generator, cfg *config.Config, lastCheck time.Time) time.Time {
	now := time.Now()
	if now.Sub(lastCheck) >= cfg.ConfigInterval {
		logrus.Debug("Checking Nginx configuration...")

		if err := nginxGenerator.GenerateConfig(); err != nil {
			logrus.Errorf("Failed to generate Nginx configuration: %v", err)
		}

		return now
	}

	return lastCheck
}

// processDomainUpdates checks for domain changes and processes them
func processDomainUpdates(certManager *certificate.Manager, currentDomains []string) []string {
	// Store previous domains for comparison
	previousDomains := currentDomains

	// Get current domains
	newDomains, err := docker.GetDomainsFromContainers()
	if err != nil {
		logrus.Errorf("Failed to get domains from containers: %v", err)
		return currentDomains
	}

	// Check if domain list has changed
	if !equalStringSlices(previousDomains, newDomains) {
		logrus.Info("Domain list has changed. Processing new domains immediately...")
		logrus.Infof("Domain list: %v", newDomains)

		if err := certManager.ProcessDomains(newDomains); err != nil {
			logrus.Errorf("Failed to process domains: %v", err)
		}
	}

	return newDomains
}

// checkCertificateRenewal performs certificate renewal if needed
func checkCertificateRenewal(certManager *certificate.Manager, cfg *config.Config, domains []string, lastCheck time.Time) time.Time {
	now := time.Now()
	if now.Sub(lastCheck) >= cfg.RenewalInterval {
		logrus.Info("Performing certificate renewal check...")

		if err := certManager.ProcessDomains(domains); err != nil {
			logrus.Errorf("Failed to renew certificates: %v", err)
		}

		return now
	}

	return lastCheck
}


// equalStringSlices checks if two string slices are equal
func equalStringSlices(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}

	for i, v := range a {
		if v != b[i] {
			return false
		}
	}

	return true
}
