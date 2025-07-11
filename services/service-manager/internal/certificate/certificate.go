// Package certificate provides functionality for managing SSL certificates
package certificate

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/jens/service-manager/internal/config"
	"github.com/sirupsen/logrus"
)

// CertificateManager defines the interface for certificate operations
type CertificateManager interface {
	CheckDefaultCert() error
	ObtainCert(domain string, forceRenewal bool) error
	ProcessDomains(domains []string) error
	DeleteCert(domain string) error
}

// Manager handles certificate operations
type Manager struct {
	Config *config.Config
}

// NewManager creates a new certificate manager
func NewManager(cfg *config.Config) *Manager {
	return &Manager{
		Config: cfg,
	}
}

// CheckDefaultCert checks if default certificate exists and creates it if not
func (m *Manager) CheckDefaultCert() error {
	defaultCertDir := filepath.Join(m.Config.CertsPath, m.Config.DefaultDomain)
	defaultCertPath := filepath.Join(defaultCertDir, "fullchain.pem")
	defaultKeyPath := filepath.Join(defaultCertDir, "privkey.pem")

	// Check if both certificate and key exist
	certExists, _ := fileExists(defaultCertPath)
	keyExists, _ := fileExists(defaultKeyPath)

	if !certExists || !keyExists {
		logrus.Info("Default certificate does not exist. Creating self-signed certificate...")

		if err := os.MkdirAll(defaultCertDir, 0755); err != nil {
			return fmt.Errorf("failed to create default certificate directory: %w", err)
		}

		if err := m.createSelfSignedCert(defaultKeyPath, defaultCertPath, m.Config.DefaultCertCN); err != nil {
			return fmt.Errorf("failed to create self-signed default certificate: %w", err)
		}

		// Copy certificate files
		if err := copyFile(defaultCertPath, filepath.Join(defaultCertDir, "chain.pem")); err != nil {
			return fmt.Errorf("failed to copy default certificate to chain.pem: %w", err)
		}
		if err := copyFile(defaultCertPath, filepath.Join(defaultCertDir, "cert.pem")); err != nil {
			return fmt.Errorf("failed to copy default certificate to cert.pem: %w", err)
		}

		logrus.Info("Self-signed default certificate created successfully.")
	} else {
		logrus.Info("Default certificate already exists.")
	}

	return nil
}

// ObtainCert obtains or renews certificate for a specific domain
func (m *Manager) ObtainCert(domain string, forceRenewal bool) error {
	logrus.Infof("Processing certificate for %s...", domain)

	certDir := filepath.Join(m.Config.CertsPath, domain)
	certPath := filepath.Join(certDir, "fullchain.pem")
	keyPath := filepath.Join(certDir, "privkey.pem")

	// Check if domain is localhost or contains localhost
	if strings.Contains(domain, "localhost") {
		return m.handleLocalDomain(domain, certDir, certPath, keyPath, forceRenewal)
	}

	// For non-localhost domains, use certbot
	return m.handleRemoteDomain(domain, forceRenewal)
}

// handleLocalDomain creates self-signed certificates for localhost domains
func (m *Manager) handleLocalDomain(domain, certDir, certPath, keyPath string, forceRenewal bool) error {
	logrus.Infof("Domain %s contains 'localhost'. Creating self-signed certificate...", domain)

	if err := os.MkdirAll(certDir, 0755); err != nil {
		return fmt.Errorf("failed to create certificate directory for %s: %w", domain, err)
	}

	// Only create new certificate if it doesn't exist or force renewal is true
	certExists, _ := fileExists(certPath)
	if !certExists || forceRenewal {
		if err := m.createSelfSignedCert(keyPath, certPath, domain); err != nil {
			return fmt.Errorf("failed to create self-signed certificate for %s: %w", domain, err)
		}

		// Copy certificate files
		if err := copyFile(certPath, filepath.Join(certDir, "chain.pem")); err != nil {
			return fmt.Errorf("failed to copy certificate to chain.pem for %s: %w", domain, err)
		}
		if err := copyFile(certPath, filepath.Join(certDir, "cert.pem")); err != nil {
			return fmt.Errorf("failed to copy certificate to cert.pem for %s: %w", domain, err)
		}

		logrus.Infof("Self-signed certificate for %s created successfully.", domain)
	} else {
		logrus.Infof("Self-signed certificate for %s already exists.", domain)
	}

	return nil
}

// handleRemoteDomain obtains certificates for non-localhost domains using certbot
func (m *Manager) handleRemoteDomain(domain string, forceRenewal bool) error {
	args := []string{
		"certonly",
		"--webroot",
		fmt.Sprintf("--webroot-path=%s", m.Config.WebrootPath),
		"--email", m.Config.Email,
		"--agree-tos",
		"--no-eff-email",
		"-d", domain,
	}

	if forceRenewal {
		logrus.Infof("Forcing renewal for %s...", domain)
		args = append(args, "--force-renewal")
	} else {
		logrus.Infof("Standard renewal check for %s...", domain)
		args = append(args, "--keep")
	}

	cmd := exec.Command("certbot", args...)
	output, err := cmd.CombinedOutput()
	if err != nil {
		outputStr := string(output)
		logrus.Warnf("Certificate operation for %s failed: %s", domain, outputStr)
		return fmt.Errorf("certificate operation for %s failed: %s", domain, outputStr)
	}

	logrus.Infof("Certificate operation for %s completed successfully.", domain)
	return nil
}

// ProcessDomains processes all domains for certificate operations
func (m *Manager) ProcessDomains(domains []string) error {
	for _, domain := range domains {
		certPath := filepath.Join(m.Config.CertsPath, domain, "fullchain.pem")
		certExists, _ := fileExists(certPath)

		if !certExists {
			logrus.Infof("Certificate for %s does not exist. Obtaining immediately...", domain)
			if err := m.ObtainCert(domain, true); err != nil {
				logrus.Errorf("Failed to obtain certificate for %s: %v", domain, err)
				continue
			}
		} else {
			logrus.Infof("Certificate for %s already exists. Setting up renewal schedule...", domain)
			if err := m.ObtainCert(domain, false); err != nil {
				logrus.Errorf("Failed to renew certificate for %s: %v", domain, err)
				continue
			}
		}
	}

	return nil
}

// DeleteCert deletes a certificate for a domain
func (m *Manager) DeleteCert(domain string) error {
	certDir := filepath.Join(m.Config.CertsPath, domain)

	// Check if domain is localhost or contains localhost
	if strings.Contains(domain, "localhost") {
		logrus.Infof("Removing self-signed certificate for %s...", domain)
		if err := os.RemoveAll(certDir); err != nil {
			return fmt.Errorf("failed to remove certificate directory for %s: %w", domain, err)
		}
	} else {
		// For non-localhost domains, use certbot
		cmd := exec.Command("certbot", "delete", "--cert-name", domain, "--non-interactive")
		output, err := cmd.CombinedOutput()
		if err != nil {
			outputStr := string(output)
			logrus.Warnf("Failed to delete certificate for %s: %s", domain, outputStr)
			return fmt.Errorf("failed to delete certificate for %s: %s", domain, outputStr)
		}
	}

	logrus.Infof("Certificate for %s deleted successfully.", domain)
	return nil
}

// createSelfSignedCert creates a self-signed certificate
func (m *Manager) createSelfSignedCert(keyPath, certPath, domain string) error {
	cmd := exec.Command(
		"openssl",
		"req", "-x509", "-nodes", "-newkey", "rsa:2048", "-days", "3650",
		"-keyout", keyPath,
		"-out", certPath,
		"-subj", fmt.Sprintf("/CN=%s", domain),
		"-addext", fmt.Sprintf("subjectAltName=DNS:%s", domain),
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		outputStr := string(output)
		logrus.Errorf("Failed to create self-signed certificate for %s: %s", domain, outputStr)
		return fmt.Errorf("failed to create self-signed certificate for %s: %s", domain, outputStr)
	}

	return nil
}

// fileExists checks if a file exists and is not a directory
func fileExists(filename string) (bool, error) {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return !info.IsDir(), nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	return os.WriteFile(dst, input, 0644)
}
