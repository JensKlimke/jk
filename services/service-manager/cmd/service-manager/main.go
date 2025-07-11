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
	"github.com/sirupsen/logrus"
)

func main() {
	initializeLogger()
	logrus.Info("Starting service-manager...")

	// Load configuration
	cfg, err := config.New()
	if err != nil {
		logrus.Fatalf("Failed to load configuration: %v", err)
	}

	// Create and initialize components
	certManager := setupComponents(cfg)

	// Get and process initial domains
	domains := getInitialDomains(certManager)

	// Run the main service loop
	runServiceLoop(cfg, certManager, domains)
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

// setupComponents initializes the certificate manager
func setupComponents(cfg *config.Config) *certificate.Manager {
	certManager := certificate.NewManager(cfg)

	logrus.Info("Initializing the system...")

	if err := certManager.CheckDefaultCert(); err != nil {
		logrus.Fatalf("Failed to check default certificate: %v", err)
	}

	return certManager
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
func runServiceLoop(cfg *config.Config, certManager *certificate.Manager, initialDomains []string) {
	// Initialize timestamps for interval checks
	lastRenewalCheck := time.Now()
	domains := initialDomains

	// Set up signal handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Log main loop information
	logrus.Info("Starting main loop with different intervals for each process:")
	logrus.Info("- Domain list checking: every second")
	logrus.Infof("- Certificate renewal checking: every %v", cfg.RenewalInterval)

	// Main loop
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			domains = processDomainUpdates(certManager, domains)
			lastRenewalCheck = checkCertificateRenewal(certManager, cfg, domains, lastRenewalCheck)

		case <-stop:
			logrus.Info("Received termination signal. Shutting down...")
			return
		}
	}
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
