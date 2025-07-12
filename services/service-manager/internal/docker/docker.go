// Package docker provides functionality for interacting with Docker containers
package docker

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/sirupsen/logrus"
)

// Variables to allow mocking in tests
var execCommand = exec.Command
var fileExistsFunc = defaultFileExists

// AuthType represents the authentication type for a container
type AuthType string

const (
	// AuthTypeNone indicates no authentication
	AuthTypeNone AuthType = "NONE"
	// AuthTypeWithHeaders indicates authentication with headers
	AuthTypeWithHeaders AuthType = "WITH_HEADERS"
	// AuthTypeWithoutHeaders indicates authentication without headers
	AuthTypeWithoutHeaders AuthType = "WITHOUT_HEADERS"
)

// ContainerInfo represents information about a Docker container
type ContainerInfo struct {
	Name        string
	VirtualHost string
	Ports       []string
	AuthType    AuthType
}

// CertConfig represents certificate configuration for a service
type CertConfig struct {
	File    string `json:"file"`
	KeyFile string `json:"key_file"`
}

// AuthConfig represents authentication configuration for a service
type AuthConfig struct {
	Service string `json:"service"`
	Headers bool   `json:"headers"`
}

// ServiceConfig represents configuration for a single service
type ServiceConfig struct {
	Host    string      `json:"host"`
	Cert    *CertConfig `json:"cert,omitempty"`
	Service string      `json:"service"`
	Port    string      `json:"port"`
	Auth    *AuthConfig `json:"auth,omitempty"`
}

// ServicesConfig represents the complete services configuration
type ServicesConfig struct {
	Services    []ServiceConfig `json:"services"`
	DefaultCert *CertConfig     `json:"default_cert,omitempty"`
}

// GetDomainsFromContainers retrieves domains from containers with VIRTUAL_HOST environment variable
func GetDomainsFromContainers() ([]string, error) {
	containers, err := getContainersWithVirtualHost()
	if err != nil {
		return nil, err
	}

	var domains []string
	for _, container := range containers {
		domains = append(domains, container.VirtualHost)
	}

	return domains, nil
}

// GetServicesConfig retrieves service configuration for Nginx based on Docker containers
func GetServicesConfig() (*ServicesConfig, error) {
	// Get all containers with VIRTUAL_HOST environment variable
	containers, err := getContainersWithVirtualHost()
	if err != nil {
		return nil, fmt.Errorf("failed to get containers with virtual host: %w", err)
	}

	if len(containers) == 0 {
		logrus.Warn("No containers with VIRTUAL_HOST found")
	}

	// Get AUTH_SERVICE from environment variable
	authService := os.Getenv("AUTH_SERVICE")

	// Create services configuration
	services := make([]ServiceConfig, 0, len(containers))
	for _, container := range containers {
		host := container.VirtualHost

		// Default to port 80 if no port is found
		port := "80"
		if len(container.Ports) > 0 {
			port = container.Ports[0]
		}

		// Create the basic service configuration
		serviceConfig := ServiceConfig{
			Host:    host,
			Service: container.Name,
			Port:    port,
		}

		// Check if certificate files exist before setting them
		certFile := fmt.Sprintf("/etc/letsencrypt/live/%s/fullchain.pem", host)
		keyFile := fmt.Sprintf("/etc/letsencrypt/live/%s/privkey.pem", host)

		certExists, _ := fileExistsFunc(certFile)
		keyExists, _ := fileExistsFunc(keyFile)

		if certExists && keyExists {
			serviceConfig.Cert = &CertConfig{
				File:    certFile,
				KeyFile: keyFile,
			}
		}

		// Add auth configuration if authType is not NONE and AUTH_SERVICE is defined
		if authService != "" && container.AuthType != AuthTypeNone {
			serviceConfig.Auth = &AuthConfig{
				Service: authService,
				Headers: container.AuthType == AuthTypeWithHeaders,
			}
		}

		services = append(services, serviceConfig)
	}

	// Create the result
	result := &ServicesConfig{
		Services: services,
	}

	// Check if default certificate files exist
	defaultCertFile := "/etc/letsencrypt/live/default/fullchain.pem"
	defaultKeyFile := "/etc/letsencrypt/live/default/privkey.pem"

	defaultCertExists, _ := fileExistsFunc(defaultCertFile)
	defaultKeyExists, _ := fileExistsFunc(defaultKeyFile)

	// Only add default_cert if both files exist
	if defaultCertExists && defaultKeyExists {
		result.DefaultCert = &CertConfig{
			File:    defaultCertFile,
			KeyFile: defaultKeyFile,
		}
	}

	return result, nil
}

// defaultFileExists is the default implementation of fileExistsFunc
func defaultFileExists(filename string) (bool, error) {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return !info.IsDir(), nil
}

// getContainersWithVirtualHost retrieves information about containers with VIRTUAL_HOST environment variable
func getContainersWithVirtualHost() ([]ContainerInfo, error) {
	// Get all running containers
	containerNames, err := getRunningContainers()
	if err != nil {
		return nil, err
	}

	var containersWithVirtualHost []ContainerInfo

	// For each container, check if it has VIRTUAL_HOST environment variable
	for _, name := range containerNames {
		containerInfo, err := getContainerInfo(name)
		if err != nil {
			logrus.Warnf("Error processing container %s: %v", name, err)
			continue
		}

		if containerInfo.VirtualHost != "" {
			containersWithVirtualHost = append(containersWithVirtualHost, containerInfo)
		}
	}

	return containersWithVirtualHost, nil
}

// getRunningContainers retrieves a list of running container names
func getRunningContainers() ([]string, error) {
	cmd := execCommand("docker", "ps", "--format", "{{.Names}}")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := stderr.String()
		logrus.Errorf("Docker ps command failed: %s", errMsg)
		return nil, fmt.Errorf("docker ps command failed: %s", errMsg)
	}

	var containers []string
	for _, line := range strings.Split(stdout.String(), "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			containers = append(containers, line)
		}
	}

	logrus.Debugf("Found %d running containers", len(containers))
	return containers, nil
}

// getContainerInfo retrieves detailed information about a container
func getContainerInfo(containerName string) (ContainerInfo, error) {
	// Initialize container info
	containerInfo := ContainerInfo{
		Name:     containerName,
		AuthType: AuthTypeNone,
	}

	// Get container information using docker inspect
	cmd := execCommand("docker", "inspect", containerName)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := stderr.String()
		return containerInfo, fmt.Errorf("docker inspect command failed for container %s: %s", containerName, errMsg)
	}

	// Extract environment variables
	virtualHost, err := getEnvVar(containerName, "VIRTUAL_HOST")
	if err != nil {
		return containerInfo, err
	}
	containerInfo.VirtualHost = virtualHost

	// If no VIRTUAL_HOST, return early
	if virtualHost == "" {
		return containerInfo, nil
	}

	// Extract ports
	ports, err := getContainerPorts(containerName)
	if err != nil {
		logrus.Warnf("Failed to get ports for container %s: %v", containerName, err)
	}
	containerInfo.Ports = ports

	// Extract authentication settings
	withAuthHeaders, err := getEnvVarBool(containerName, "WITH_AUTH_HEADERS")
	if err != nil {
		logrus.Warnf("Failed to get WITH_AUTH_HEADERS for container %s: %v", containerName, err)
	}

	withAuth, err := getEnvVarBool(containerName, "WITH_AUTH")
	if err != nil {
		logrus.Warnf("Failed to get WITH_AUTH for container %s: %v", containerName, err)
	}

	// Determine auth type
	if withAuthHeaders {
		containerInfo.AuthType = AuthTypeWithHeaders
	} else if withAuth {
		containerInfo.AuthType = AuthTypeWithoutHeaders
	}

	return containerInfo, nil
}

// getEnvVar retrieves an environment variable from a container
func getEnvVar(containerName, varName string) (string, error) {
	inspectFormat := fmt.Sprintf(`{{range .Config.Env}}{{if eq (index (split . "=") 0) "%s"}}{{index (split . "=") 1}}{{end}}{{end}}`, varName)
	cmd := execCommand("docker", "inspect", "--format", inspectFormat, containerName)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := stderr.String()
		return "", fmt.Errorf("docker inspect command failed for container %s: %s", containerName, errMsg)
	}

	value := strings.TrimSpace(stdout.String())
	return value, nil
}

// getEnvVarBool retrieves a boolean environment variable from a container
func getEnvVarBool(containerName, varName string) (bool, error) {
	value, err := getEnvVar(containerName, varName)
	if err != nil {
		return false, err
	}

	return strings.ToLower(value) == "true", nil
}

// getContainerPorts retrieves exposed ports from a container
func getContainerPorts(containerName string) ([]string, error) {
	inspectFormat := `{{range $port, $_ := .Config.ExposedPorts}}{{$port}}{{"\n"}}{{end}}`
	cmd := execCommand("docker", "inspect", "--format", inspectFormat, containerName)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := stderr.String()
		return nil, fmt.Errorf("docker inspect command failed for container %s: %s", containerName, errMsg)
	}

	var ports []string
	for _, line := range strings.Split(stdout.String(), "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			// Extract port number from "port/protocol" format
			port := strings.Split(line, "/")[0]
			ports = append(ports, port)
		}
	}

	return ports, nil
}
