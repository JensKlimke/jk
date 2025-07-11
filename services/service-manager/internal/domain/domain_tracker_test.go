package domain

import (
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/jens/service-manager/internal/certificate"
	"github.com/jens/service-manager/internal/config"
)

// createTestConfig creates a test configuration
func createTestConfig(tmpDir string) *config.Config {
	return &config.Config{
		CertsPath:          filepath.Join(tmpDir, "certs"),
		RemovedDomainsFile: filepath.Join(tmpDir, "removed_domains.txt"),
		WebrootPath:        filepath.Join(tmpDir, "webroot"),
		DefaultDomain:      "default",
		DefaultCertCN:      "default.local",
		Email:              "test@example.com",
		CleanupInterval:    24 * time.Hour,
	}
}

func TestNewTracker(t *testing.T) {
	cfg := &config.Config{
		CertsPath:          "/tmp/certs",
		RemovedDomainsFile: "/tmp/removed_domains.txt",
	}
	certManager := &certificate.Manager{Config: cfg}

	tracker := NewTracker(cfg, certManager)
	if tracker == nil {
		t.Fatal("Expected tracker to be created, got nil")
	}

	if tracker.Config != cfg {
		t.Errorf("Expected tracker.Config to be %v, got %v", cfg, tracker.Config)
	}

	if tracker.CertManager != certManager {
		t.Errorf("Expected tracker.CertManager to be %v, got %v", certManager, tracker.CertManager)
	}
}

func TestInitialize(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir, err := os.MkdirTemp("", "domain-tracker-test")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create a config with the temporary directory
	removedDomainsFile := filepath.Join(tmpDir, "removed_domains.txt")
	cfg := &config.Config{
		CertsPath:          filepath.Join(tmpDir, "certs"),
		RemovedDomainsFile: removedDomainsFile,
	}
	certManager := &certificate.Manager{Config: cfg}
	tracker := NewTracker(cfg, certManager)

	// Test Initialize
	if err := tracker.Initialize(); err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that the removed domains file was created
	if _, err := os.Stat(removedDomainsFile); os.IsNotExist(err) {
		t.Errorf("Expected removed domains file to exist")
	}
}

func TestContainsDomain(t *testing.T) {
	domains := []string{"example.com", "test.com"}

	// Test domain that is in the list
	if !containsDomain(domains, "example.com") {
		t.Errorf("Expected containsDomain to return true for example.com")
	}

	// Test domain that is not in the list
	if containsDomain(domains, "nonexistent.com") {
		t.Errorf("Expected containsDomain to return false for nonexistent.com")
	}
}

func TestAddAndRemoveDomainFromFile(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir, err := os.MkdirTemp("", "domain-tracker-test")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create a config with the temporary directory
	removedDomainsFile := filepath.Join(tmpDir, "removed_domains.txt")
	cfg := &config.Config{
		CertsPath:          filepath.Join(tmpDir, "certs"),
		RemovedDomainsFile: removedDomainsFile,
	}
	certManager := &certificate.Manager{Config: cfg}
	tracker := NewTracker(cfg, certManager)

	// Initialize the tracker
	if err := tracker.Initialize(); err != nil {
		t.Fatalf("Failed to initialize tracker: %v", err)
	}

	// Test adding a domain
	if err := tracker.addDomainToFile("example.com"); err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that the domain was added
	tracked, err := tracker.isDomainTracked("example.com")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if !tracked {
		t.Errorf("Expected domain to be tracked")
	}

	// Test removing a domain
	if err := tracker.removeDomainFromFile("example.com"); err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that the domain was removed
	tracked, err = tracker.isDomainTracked("example.com")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if tracked {
		t.Errorf("Expected domain to not be tracked")
	}
}

// mockCertManager is a mock implementation of certificate.Manager for testing
type mockCertManager struct {
	Config *config.Config
	DeletedDomains []string
}

func (m *mockCertManager) CheckDefaultCert() error {
	return nil
}

func (m *mockCertManager) ObtainCert(domain string, forceRenewal bool) error {
	return nil
}

func (m *mockCertManager) ProcessDomains(domains []string) error {
	return nil
}

func (m *mockCertManager) DeleteCert(domain string) error {
	m.DeletedDomains = append(m.DeletedDomains, domain)
	return nil
}

func TestGetDomainsToCleanup(t *testing.T) {
	// Create a temporary directory for testing
	tmpDir, err := os.MkdirTemp("", "domain-tracker-test")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Create a config
	cfg := createTestConfig(tmpDir)

	// Create a mock certificate manager
	mockCertManager := &mockCertManager{
		Config: cfg,
		DeletedDomains: []string{},
	}

	// Create a test tracker with the mock
	tracker := &Tracker{
		Config:      cfg,
		CertManager: mockCertManager,
	}

	// Initialize the tracker
	if err := tracker.Initialize(); err != nil {
		t.Fatalf("Failed to initialize tracker: %v", err)
	}

	// Add domains with different timestamps
	currentTime := time.Now().Unix()
	oldTime := currentTime - int64(25*time.Hour.Seconds()) // Older than cleanup interval

	file, err := os.OpenFile(cfg.RemovedDomainsFile, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		t.Fatalf("Failed to open removed domains file: %v", err)
	}

	if _, err := file.WriteString("old.com:" + strconv.FormatInt(oldTime, 10) + "\n"); err != nil {
		t.Fatalf("Failed to write to removed domains file: %v", err)
	}

	if _, err := file.WriteString("new.com:" + strconv.FormatInt(currentTime, 10) + "\n"); err != nil {
		t.Fatalf("Failed to write to removed domains file: %v", err)
	}

	file.Close()

	// Create a directory for the old.com certificate to simulate its existence
	oldCertDir := filepath.Join(cfg.CertsPath, "old.com")
	if err := os.MkdirAll(oldCertDir, 0755); err != nil {
		t.Fatalf("Failed to create certificate directory: %v", err)
	}

	// Run the cleanup
	if err := tracker.CleanupCertificates(); err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that the mock DeleteCert was called with the expected domain
	if len(mockCertManager.DeletedDomains) != 1 {
		t.Errorf("Expected DeleteCert to be called once, got %d calls", len(mockCertManager.DeletedDomains))
	}

	if len(mockCertManager.DeletedDomains) > 0 && mockCertManager.DeletedDomains[0] != "old.com" {
		t.Errorf("Expected DeleteCert to be called with old.com, got %s", mockCertManager.DeletedDomains[0])
	}
}
