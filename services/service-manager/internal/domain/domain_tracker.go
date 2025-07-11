// Package domain provides functionality for tracking domains and cleaning up certificates
package domain

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/jens/service-manager/internal/certificate"
	"github.com/jens/service-manager/internal/config"
	"github.com/sirupsen/logrus"
)

// Tracker handles domain tracking and cleanup
type Tracker struct {
	Config       *config.Config
	CertManager  *certificate.Manager
}

// NewTracker creates a new domain tracker
func NewTracker(cfg *config.Config, certManager *certificate.Manager) *Tracker {
	return &Tracker{
		Config:      cfg,
		CertManager: certManager,
	}
}

// Initialize initializes the removed domains file
func (t *Tracker) Initialize() error {
	// Create the removed domains file if it doesn't exist
	if _, err := os.Stat(t.Config.RemovedDomainsFile); os.IsNotExist(err) {
		logrus.Infof("Initializing removed domains file at %s", t.Config.RemovedDomainsFile)
		file, err := os.Create(t.Config.RemovedDomainsFile)
		if err != nil {
			return fmt.Errorf("failed to create removed domains file: %w", err)
		}
		file.Close()
	}

	return nil
}

// TrackRemovedDomains tracks domains that are no longer in the domains list
func (t *Tracker) TrackRemovedDomains(domains []string) error {
	logrus.Info("Tracking domains that are no longer in the list...")

	// Get all certificate directories
	certDirs, err := t.getCertificateDirectories()
	if err != nil {
		return err
	}

	for _, certDir := range certDirs {
		domain := filepath.Base(certDir)

		// Skip the default domain
		if domain == t.Config.DefaultDomain {
			continue
		}

		// Check if the domain is in the current domains list
		domainInList := false
		for _, d := range domains {
			if d == domain {
				domainInList = true
				break
			}
		}

		if !domainInList {
			// Domain is not in the list, check if it's already being tracked
			tracked, err := t.isDomainTracked(domain)
			if err != nil {
				logrus.Errorf("Failed to check if domain %s is tracked: %v", domain, err)
				continue
			}

			if !tracked {
				// Add domain to the removed domains file
				if err := t.updateRemovedDomainsFile(domain, "add"); err != nil {
					logrus.Errorf("Failed to add domain %s to removed domains file: %v", domain, err)
				}
			}
		} else {
			// Domain is in the list, check if it's being tracked
			tracked, err := t.isDomainTracked(domain)
			if err != nil {
				logrus.Errorf("Failed to check if domain %s is tracked: %v", domain, err)
				continue
			}

			if tracked {
				// Remove domain from the removed domains file
				if err := t.updateRemovedDomainsFile(domain, "remove"); err != nil {
					logrus.Errorf("Failed to remove domain %s from removed domains file: %v", domain, err)
				}
			}
		}
	}

	return nil
}

// isDomainTracked checks if a domain is being tracked for removal
func (t *Tracker) isDomainTracked(domain string) (bool, error) {
	file, err := os.Open(t.Config.RemovedDomainsFile)
	if err != nil {
		return false, fmt.Errorf("failed to open removed domains file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, fmt.Sprintf("%s:", domain)) {
			return true, nil
		}
	}

	if err := scanner.Err(); err != nil {
		return false, fmt.Errorf("failed to read removed domains file: %w", err)
	}

	return false, nil
}

// updateRemovedDomainsFile updates the removed domains file
func (t *Tracker) updateRemovedDomainsFile(domain, action string) error {
	switch action {
	case "add":
		currentTime := time.Now().Unix()
		logrus.Infof("Domain %s is no longer in the list. Tracking for removal...", domain)

		file, err := os.OpenFile(t.Config.RemovedDomainsFile, os.O_APPEND|os.O_WRONLY, 0644)
		if err != nil {
			return fmt.Errorf("failed to open removed domains file for appending: %w", err)
		}
		defer file.Close()

		if _, err := fmt.Fprintf(file, "%s:%d\n", domain, currentTime); err != nil {
			return fmt.Errorf("failed to write to removed domains file: %w", err)
		}

	case "remove":
		logrus.Infof("Domain %s is back in the list. Removing from tracking...", domain)

		file, err := os.Open(t.Config.RemovedDomainsFile)
		if err != nil {
			return fmt.Errorf("failed to open removed domains file: %w", err)
		}

		tempFilePath := t.Config.RemovedDomainsFile + ".tmp"
		tempFile, err := os.Create(tempFilePath)
		if err != nil {
			file.Close()
			return fmt.Errorf("failed to create temporary file: %w", err)
		}

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := scanner.Text()
			if !strings.HasPrefix(line, fmt.Sprintf("%s:", domain)) {
				if _, err := fmt.Fprintln(tempFile, line); err != nil {
					file.Close()
					tempFile.Close()
					return fmt.Errorf("failed to write to temporary file: %w", err)
				}
			}
		}

		file.Close()
		tempFile.Close()

		if err := scanner.Err(); err != nil {
			return fmt.Errorf("failed to read removed domains file: %w", err)
		}

		if err := os.Rename(tempFilePath, t.Config.RemovedDomainsFile); err != nil {
			return fmt.Errorf("failed to rename temporary file: %w", err)
		}

	default:
		return fmt.Errorf("invalid action: %s", action)
	}

	return nil
}

// CleanupCertificates cleans up certificates for domains that have been missing for at least the cleanup interval
func (t *Tracker) CleanupCertificates() error {
	logrus.Info("Checking for certificates to clean up...")

	currentTime := time.Now().Unix()

	file, err := os.Open(t.Config.RemovedDomainsFile)
	if err != nil {
		return fmt.Errorf("failed to open removed domains file: %w", err)
	}
	defer file.Close()

	var domainsToRemove []string

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.Split(line, ":")

		if len(parts) != 2 {
			logrus.Warnf("Invalid line in removed domains file: %s", line)
			continue
		}

		domain := parts[0]
		timestamp, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			logrus.Warnf("Failed to parse timestamp for domain %s: %v", domain, err)
			continue
		}

		timeDiff := currentTime - timestamp
		cleanupIntervalSeconds := int64(t.Config.CleanupInterval.Seconds())

		if timeDiff >= cleanupIntervalSeconds {
			logrus.Infof("Certificate for %s has been missing for at least %d hours. Deleting...",
				domain, cleanupIntervalSeconds/3600)

			// Delete the certificate
			if err := t.CertManager.DeleteCert(domain); err != nil {
				logrus.Errorf("Failed to delete certificate for %s: %v", domain, err)
				continue
			}

			// Mark domain for removal from the tracking file
			domainsToRemove = append(domainsToRemove, domain)
		} else {
			hoursLeft := (cleanupIntervalSeconds - timeDiff) / 3600
			logrus.Infof("Certificate for %s will be deleted in approximately %d hours.", domain, hoursLeft)
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("failed to read removed domains file: %w", err)
	}

	// Remove domains from the tracking file
	for _, domain := range domainsToRemove {
		if err := t.updateRemovedDomainsFile(domain, "remove"); err != nil {
			logrus.Errorf("Failed to remove domain %s from tracking file: %v", domain, err)
		}
	}

	return nil
}

// getCertificateDirectories gets all certificate directories
func (t *Tracker) getCertificateDirectories() ([]string, error) {
	var certDirs []string

	if _, err := os.Stat(t.Config.CertsPath); os.IsNotExist(err) {
		return certDirs, nil
	}

	entries, err := os.ReadDir(t.Config.CertsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read certificate directory: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			certDirs = append(certDirs, filepath.Join(t.Config.CertsPath, entry.Name()))
		}
	}

	return certDirs, nil
}
