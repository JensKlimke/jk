// Package nginx provides functionality for generating Nginx configuration files
package nginx

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"github.com/cbroglie/mustache"
	"github.com/jens/service-manager/internal/config"
	"github.com/jens/service-manager/internal/docker"
	"github.com/sirupsen/logrus"
)

// Generator handles Nginx configuration generation
type Generator struct {
	Config *config.Config
	lastConfig string
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

// NewGenerator creates a new Nginx configuration generator
func NewGenerator(cfg *config.Config) *Generator {
	return &Generator{
		Config: cfg,
	}
}

// ReadTemplate reads a template file
func (g *Generator) ReadTemplate(templatePath string) (string, error) {
	data, err := ioutil.ReadFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to read template file: %w", err)
	}
	return string(data), nil
}

// RenderTemplate renders a template with the provided data
func (g *Generator) RenderTemplate(template string, data interface{}) (string, error) {
	rendered, err := mustache.Render(template, data)
	if err != nil {
		return "", fmt.Errorf("failed to render template: %w", err)
	}
	return rendered, nil
}

// WriteConfig writes the rendered configuration to a file
func (g *Generator) WriteConfig(outputPath string, content string) error {
	// Ensure the directory exists
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Write the configuration file
	if err := ioutil.WriteFile(outputPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write configuration file: %w", err)
	}

	return nil
}

// HasConfigChanged checks if the config has changed from the last saved version
func (g *Generator) HasConfigChanged(newConfig string) bool {
	return g.lastConfig != newConfig
}

// SaveLastConfig saves the current config as the last config
func (g *Generator) SaveLastConfig(config string) {
	g.lastConfig = config

	// Also save to file for persistence across restarts
	lastConfigPath := filepath.Join(g.Config.LogsDir, "last_config.txt")

	// Ensure the directory exists
	if err := os.MkdirAll(g.Config.LogsDir, 0755); err != nil {
		logrus.Errorf("Failed to create logs directory: %v", err)
		return
	}

	if err := ioutil.WriteFile(lastConfigPath, []byte(config), 0644); err != nil {
		logrus.Errorf("Failed to save last config: %v", err)
	}
}

// LogConfig logs the config to a timestamped file
func (g *Generator) LogConfig(config string) error {
	// Create timestamp for filename
	now := time.Now()
	timestamp := now.Format("2006-01-02T15-04-05")
	logFilePath := filepath.Join(g.Config.LogsDir, fmt.Sprintf("config_%s.log", timestamp))

	// Ensure the directory exists
	if err := os.MkdirAll(g.Config.LogsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %w", err)
	}

	// Write config to log file
	if err := ioutil.WriteFile(logFilePath, []byte(config), 0644); err != nil {
		return fmt.Errorf("failed to write log file: %w", err)
	}

	logrus.Infof("Config logged to %s", logFilePath)
	return nil
}

// GenerateConfig generates a configuration file from a template and Docker services
func (g *Generator) GenerateConfig() error {
	// Read the template
	template, err := g.ReadTemplate(g.Config.TemplatePath)
	if err != nil {
		return fmt.Errorf("failed to read template: %w", err)
	}

	// Get services configuration
	servicesConfig, err := docker.GetServicesConfig()
	if err != nil {
		return fmt.Errorf("failed to get services configuration: %w", err)
	}

	// Render the template
	rendered, err := g.RenderTemplate(template, servicesConfig)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	// Check if config file exists
	configExists, _ := fileExists(g.Config.OutputPath)

	// Check if config has changed or file doesn't exist
	if g.HasConfigChanged(rendered) || !configExists {
		// Log the new config
		if err := g.LogConfig(rendered); err != nil {
			logrus.Warnf("Failed to log config: %v", err)
		}

		// Save as last config
		g.SaveLastConfig(rendered)

		// Write the configuration file
		if err := g.WriteConfig(g.Config.OutputPath, rendered); err != nil {
			return fmt.Errorf("failed to write config: %w", err)
		}

		logrus.Info("Nginx configuration updated successfully")

		// Restart Nginx to apply the new configuration
		if err := docker.RestartNginx(); err != nil {
			logrus.Warnf("Failed to restart Nginx: %v", err)
		}
	} else {
		logrus.Debug("Nginx configuration unchanged")
	}

	return nil
}

// LoadLastConfig loads the last config from file
func (g *Generator) LoadLastConfig() {
	lastConfigPath := filepath.Join(g.Config.LogsDir, "last_config.txt")

	data, err := ioutil.ReadFile(lastConfigPath)
	if err != nil {
		if !os.IsNotExist(err) {
			logrus.Warnf("Failed to read last config: %v", err)
		}
		return
	}

	g.lastConfig = string(data)
}
