// Package nginx provides functionality for generating Nginx configuration files
package nginx

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/jens/service-manager/internal/config"
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