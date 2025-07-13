// Package nginx provides functionality for generating Nginx configuration files
package nginx

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/jens/service-manager/internal/config"
	"github.com/jens/service-manager/internal/docker"
)

func TestReadTemplate(t *testing.T) {
	// Create a temporary template file
	tempDir := t.TempDir()
	templatePath := filepath.Join(tempDir, "test.mustache")
	templateContent := "Hello, {{name}}!"

	if err := os.WriteFile(templatePath, []byte(templateContent), 0644); err != nil {
		t.Fatalf("Failed to create test template file: %v", err)
	}

	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: templatePath,
		OutputPath:   filepath.Join(tempDir, "output.conf"),
		LogsDir:      tempDir,
	}
	generator := NewGenerator(cfg)

	// Test reading the template
	content, err := generator.ReadTemplate(templatePath)
	if err != nil {
		t.Fatalf("ReadTemplate failed: %v", err)
	}

	if content != templateContent {
		t.Errorf("Expected template content %q, got %q", templateContent, content)
	}
}

func TestRenderTemplate(t *testing.T) {
	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: "test.mustache",
		OutputPath:   "output.conf",
		LogsDir:      t.TempDir(),
	}
	generator := NewGenerator(cfg)

	// Test rendering a template
	template := "Hello, {{name}}!"
	data := map[string]string{"name": "World"}

	rendered, err := generator.RenderTemplate(template, data)
	if err != nil {
		t.Fatalf("RenderTemplate failed: %v", err)
	}

	expected := "Hello, World!"
	if rendered != expected {
		t.Errorf("Expected rendered content %q, got %q", expected, rendered)
	}
}

func TestWriteConfig(t *testing.T) {
	// Create a temporary directory for output
	tempDir := t.TempDir()
	outputPath := filepath.Join(tempDir, "output.conf")

	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: "test.mustache",
		OutputPath:   outputPath,
		LogsDir:      tempDir,
	}
	generator := NewGenerator(cfg)

	// Test writing a configuration
	content := "server { listen 80; }"

	if err := generator.WriteConfig(outputPath, content); err != nil {
		t.Fatalf("WriteConfig failed: %v", err)
	}

	// Read the written file
	written, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("Failed to read output file: %v", err)
	}

	if string(written) != content {
		t.Errorf("Expected written content %q, got %q", content, string(written))
	}
}

func TestHasConfigChanged(t *testing.T) {
	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: "test.mustache",
		OutputPath:   "output.conf",
		LogsDir:      t.TempDir(),
	}
	generator := NewGenerator(cfg)

	// Test with empty last config
	if !generator.HasConfigChanged("new config") {
		t.Error("Expected HasConfigChanged to return true for empty last config")
	}

	// Set last config and test with same config
	generator.SaveLastConfig("test config")
	if generator.HasConfigChanged("test config") {
		t.Error("Expected HasConfigChanged to return false for same config")
	}

	// Test with different config
	if !generator.HasConfigChanged("new config") {
		t.Error("Expected HasConfigChanged to return true for different config")
	}
}

func TestSaveAndLoadLastConfig(t *testing.T) {
	// Create a temporary directory for logs
	tempDir := t.TempDir()

	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: "test.mustache",
		OutputPath:   "output.conf",
		LogsDir:      tempDir,
	}
	generator := NewGenerator(cfg)

	// Save a config
	testConfig := "server { listen 80; }"
	generator.SaveLastConfig(testConfig)

	// Create a new generator and load the config
	newGenerator := NewGenerator(cfg)
	newGenerator.LoadLastConfig()

	// Check if the loaded config matches
	if !newGenerator.HasConfigChanged("different config") {
		t.Error("Expected HasConfigChanged to return true after loading last config")
	}

	if newGenerator.HasConfigChanged(testConfig) {
		t.Error("Expected HasConfigChanged to return false for same config after loading")
	}
}

func TestLogConfig(t *testing.T) {
	// Create a temporary directory for logs
	tempDir := t.TempDir()

	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: "test.mustache",
		OutputPath:   "output.conf",
		LogsDir:      tempDir,
	}
	generator := NewGenerator(cfg)

	// Log a config
	testConfig := "server { listen 80; }"
	if err := generator.LogConfig(testConfig); err != nil {
		t.Fatalf("LogConfig failed: %v", err)
	}

	// Check if a log file was created
	files, err := os.ReadDir(tempDir)
	if err != nil {
		t.Fatalf("Failed to read log directory: %v", err)
	}

	if len(files) == 0 {
		t.Error("Expected at least one log file to be created")
	}

	// Check the content of the log file
	logFile := filepath.Join(tempDir, files[0].Name())
	logContent, err := os.ReadFile(logFile)
	if err != nil {
		t.Fatalf("Failed to read log file: %v", err)
	}

	if string(logContent) != testConfig {
		t.Errorf("Expected log content %q, got %q", testConfig, string(logContent))
	}
}

func TestFileExists(t *testing.T) {
	// Create a temporary file
	tempDir := t.TempDir()
	existingFile := filepath.Join(tempDir, "existing.txt")
	nonExistingFile := filepath.Join(tempDir, "nonexisting.txt")

	// Create the existing file
	if err := os.WriteFile(existingFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Test existing file
	exists, err := fileExists(existingFile)
	if err != nil {
		t.Fatalf("fileExists failed for existing file: %v", err)
	}
	if !exists {
		t.Error("Expected fileExists to return true for existing file")
	}

	// Test non-existing file
	exists, err = fileExists(nonExistingFile)
	if err != nil {
		t.Fatalf("fileExists failed for non-existing file: %v", err)
	}
	if exists {
		t.Error("Expected fileExists to return false for non-existing file")
	}

	// Create a directory
	dirPath := filepath.Join(tempDir, "testdir")
	if err := os.Mkdir(dirPath, 0755); err != nil {
		t.Fatalf("Failed to create test directory: %v", err)
	}

	// Test directory (should return false as it's not a file)
	exists, err = fileExists(dirPath)
	if err != nil {
		t.Fatalf("fileExists failed for directory: %v", err)
	}
	if exists {
		t.Error("Expected fileExists to return false for directory")
	}
}

func TestGenerateConfig(t *testing.T) {
	// Create a temporary directory for output
	tempDir := t.TempDir()
	outputPath := filepath.Join(tempDir, "output.conf")

	// Create a generator with a test configuration
	cfg := &config.Config{
		TemplatePath: filepath.Join(tempDir, "template.mustache"),
		OutputPath:   outputPath,
		LogsDir:      tempDir,
	}

	// Create a template file
	templateContent := "server { listen 80; server_name {{host}}; }"
	if err := os.WriteFile(cfg.TemplatePath, []byte(templateContent), 0644); err != nil {
		t.Fatalf("Failed to create template file: %v", err)
	}

	// Create a generator
	generator := NewGenerator(cfg)

	// Mock GetServicesConfig to return a test configuration
	origGetServicesConfig := docker.GetServicesConfig
	docker.GetServicesConfig = func() (*docker.ServicesConfig, error) {
		return &docker.ServicesConfig{
			Services: []docker.ServiceConfig{
				{
					Host:    "example.com",
					Service: "test-service",
					Port:    "80",
				},
			},
		}, nil
	}
	defer func() { docker.GetServicesConfig = origGetServicesConfig }()

	// Mock RestartNginx to track if it was called
	restartCalled := false
	origRestartNginxFunc := docker.restartNginxFunc
	docker.restartNginxFunc = func() error {
		restartCalled = true
		return nil
	}
	defer func() { docker.restartNginxFunc = origRestartNginxFunc }()

	// Test GenerateConfig when file doesn't exist
	if err := generator.GenerateConfig(); err != nil {
		t.Fatalf("GenerateConfig failed: %v", err)
	}

	// Check if the file was created
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		t.Error("Expected output file to be created")
	}

	// Check if RestartNginx was called
	if !restartCalled {
		t.Error("Expected RestartNginx to be called")
	}

	// Reset the restart flag
	restartCalled = false

	// Test GenerateConfig when file exists but content is the same
	if err := generator.GenerateConfig(); err != nil {
		t.Fatalf("GenerateConfig failed on second call: %v", err)
	}

	// Check if RestartNginx was not called
	if restartCalled {
		t.Error("Expected RestartNginx not to be called when config is unchanged")
	}

	// Modify the template to change the generated config
	newTemplateContent := "server { listen 8080; server_name {{host}}; }"
	if err := os.WriteFile(cfg.TemplatePath, []byte(newTemplateContent), 0644); err != nil {
		t.Fatalf("Failed to update template file: %v", err)
	}

	// Test GenerateConfig when file exists but content has changed
	if err := generator.GenerateConfig(); err != nil {
		t.Fatalf("GenerateConfig failed on third call: %v", err)
	}

	// Check if RestartNginx was called
	if !restartCalled {
		t.Error("Expected RestartNginx to be called when config changed")
	}
}
