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

	certExists := true
	keyExists := true

	if _, err := os.Stat(defaultCertPath); os.IsNotExist(err) {
		certExists = false
	}

	if _, err := os.Stat(defaultKeyPath); os.IsNotExist(err) {
		keyExists = false
	}

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
		logrus.Infof("Domain %s contains 'localhost'. Creating self-signed certificate...", domain)

		if err := os.MkdirAll(certDir, 0755); err != nil {
			return fmt.Errorf("failed to create certificate directory for %s: %w", domain, err)
		}

		// Only create new certificate if it doesn't exist or force renewal is true
		if _, err := os.Stat(certPath); os.IsNotExist(err) || forceRenewal {
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
	} else {
		// For non-localhost domains, use certbot
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
			logrus.Warnf("Certificate operation for %s failed: %s", domain, string(output))
			return fmt.Errorf("certificate operation for %s failed: %s", domain, string(output))
		}

		logrus.Infof("Certificate operation for %s completed successfully.", domain)
	}

	return nil
}

// ProcessDomains processes all domains for certificate operations
func (m *Manager) ProcessDomains(domains []string) error {
	for _, domain := range domains {
		certPath := filepath.Join(m.Config.CertsPath, domain, "fullchain.pem")

		if _, err := os.Stat(certPath); os.IsNotExist(err) {
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
			logrus.Warnf("Failed to delete certificate for %s: %s", domain, string(output))
			return fmt.Errorf("failed to delete certificate for %s: %s", domain, string(output))
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
		logrus.Errorf("Failed to create self-signed certificate for %s: %s", domain, string(output))
		return fmt.Errorf("failed to create self-signed certificate for %s: %s", domain, string(output))
	}

	return nil
}

// copyFile copies a file from src to dst
func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	err = os.WriteFile(dst, input, 0644)
	if err != nil {
		return err
	}

	return nil
}
