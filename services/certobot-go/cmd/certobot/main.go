// Package main provides the entry point for the certobot-go application
package main

import (
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jens/certobot-go/internal/certificate"
	"github.com/jens/certobot-go/internal/config"
	"github.com/jens/certobot-go/internal/docker"
	"github.com/jens/certobot-go/internal/domain"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize logger
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

	logrus.Info("Starting certobot-go...")

	// Load configuration
	cfg, err := config.New()
	if err != nil {
		logrus.Fatalf("Failed to load configuration: %v", err)
	}

	// Create certificate manager and domain tracker
	certManager := certificate.NewManager(cfg)
	domainTracker := domain.NewTracker(cfg, certManager)

	// Initialize the system
	logrus.Info("Initializing the system...")
	if err := certManager.CheckDefaultCert(); err != nil {
		logrus.Fatalf("Failed to check default certificate: %v", err)
	}
	if err := domainTracker.Initialize(); err != nil {
		logrus.Fatalf("Failed to initialize domain tracker: %v", err)
	}

	// Get initial domains
	domains, err := docker.GetDomainsFromContainers()
	if err != nil {
		logrus.Fatalf("Failed to get domains from containers: %v", err)
	}
	logrus.Infof("Starting up with domains: %v", domains)

	// Process initial domains
	if err := certManager.ProcessDomains(domains); err != nil {
		logrus.Errorf("Failed to process domains: %v", err)
	}

	// Initialize timestamps for interval checks
	lastRenewalCheck := time.Now()
	lastCleanupCheck := time.Now()

	// Set up signal handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Main loop information
	logrus.Info("Starting main loop with different intervals for each process:")
	logrus.Info("- Domain list checking: every second")
	logrus.Infof("- Certificate renewal checking: every %v", cfg.RenewalInterval)
	logrus.Infof("- Certificate cleanup: every %v", cfg.CleanupInterval)

	// Main loop
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Store previous domains for comparison
			previousDomains := domains

			// Get current domains
			newDomains, err := docker.GetDomainsFromContainers()
			if err != nil {
				logrus.Errorf("Failed to get domains from containers: %v", err)
				continue
			}
			domains = newDomains

			// Check if domain list has changed
			if !equalStringSlices(previousDomains, domains) {
				logrus.Info("Domain list has changed. Processing new domains immediately...")
				logrus.Infof("Domain list: %v", domains)

				if err := certManager.ProcessDomains(domains); err != nil {
					logrus.Errorf("Failed to process domains: %v", err)
				}

				if err := domainTracker.TrackRemovedDomains(domains); err != nil {
					logrus.Errorf("Failed to track removed domains: %v", err)
				}
			}

			// Certificate renewal check (every 12 hours)
			now := time.Now()
			if now.Sub(lastRenewalCheck) >= cfg.RenewalInterval {
				logrus.Info("Performing certificate renewal check...")

				if err := certManager.ProcessDomains(domains); err != nil {
					logrus.Errorf("Failed to renew certificates: %v", err)
				}

				lastRenewalCheck = now
			}

			// Certificate cleanup check (every 24 hours)
			if now.Sub(lastCleanupCheck) >= cfg.CleanupInterval {
				logrus.Info("Performing certificate cleanup check...")

				if err := domainTracker.CleanupCertificates(); err != nil {
					logrus.Errorf("Failed to clean up certificates: %v", err)
				}

				lastCleanupCheck = now
			}

		case <-stop:
			logrus.Info("Received termination signal. Shutting down...")
			return
		}
	}
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