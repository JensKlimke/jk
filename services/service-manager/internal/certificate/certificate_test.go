package certificate

import (
	"os"
	"testing"

	"github.com/jens/service-manager/internal/config"
)

func TestNewManager(t *testing.T) {
	cfg := &config.Config{
		CertsPath:          "/tmp/certs",
		RemovedDomainsFile: "/tmp/removed_domains.txt",
		WebrootPath:        "/tmp/webroot",
		DefaultDomain:      "default",
		DefaultCertCN:      "default.local",
		Email:              "test@example.com",
	}

	manager := NewManager(cfg)
	if manager == nil {
		t.Fatal("Expected manager to be created, got nil")
	}

	if manager.Config != cfg {
		t.Errorf("Expected manager.Config to be %v, got %v", cfg, manager.Config)
	}
}

func TestFileExists(t *testing.T) {
	// Create a temporary file
	tmpFile, err := os.CreateTemp("", "test-file")
	if err != nil {
		t.Fatalf("Failed to create temporary file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	// Test existing file
	exists, err := fileExists(tmpFile.Name())
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if !exists {
		t.Errorf("Expected file to exist")
	}

	// Test non-existing file
	exists, err = fileExists(tmpFile.Name() + ".nonexistent")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if exists {
		t.Errorf("Expected file to not exist")
	}

	// Create a temporary directory
	tmpDir, err := os.MkdirTemp("", "test-dir")
	if err != nil {
		t.Fatalf("Failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Test directory (should return false as it's not a file)
	exists, err = fileExists(tmpDir)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if exists {
		t.Errorf("Expected directory to not be considered a file")
	}
}

func TestCopyFile(t *testing.T) {
	// Create a temporary file with content
	content := []byte("test content")
	srcFile, err := os.CreateTemp("", "test-src")
	if err != nil {
		t.Fatalf("Failed to create source file: %v", err)
	}
	defer os.Remove(srcFile.Name())

	if _, err := srcFile.Write(content); err != nil {
		t.Fatalf("Failed to write to source file: %v", err)
	}
	srcFile.Close()

	// Create destination path
	dstFile := srcFile.Name() + ".copy"
	defer os.Remove(dstFile)

	// Test copying file
	if err := copyFile(srcFile.Name(), dstFile); err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify content
	dstContent, err := os.ReadFile(dstFile)
	if err != nil {
		t.Fatalf("Failed to read destination file: %v", err)
	}

	if string(dstContent) != string(content) {
		t.Errorf("Expected content %q, got %q", string(content), string(dstContent))
	}

	// Test copying non-existent file
	if err := copyFile(srcFile.Name()+".nonexistent", dstFile); err == nil {
		t.Errorf("Expected error when copying non-existent file, got nil")
	}
}
