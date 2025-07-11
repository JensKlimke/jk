// Package docker provides functionality for interacting with Docker containers
package docker

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/sirupsen/logrus"
)

// GetDomainsFromContainers gets domains from containers with VIRTUAL_HOST environment variable
func GetDomainsFromContainers() ([]string, error) {
	// Get list of running containers
	containers, err := getRunningContainers()
	if err != nil {
		return nil, err
	}

	var domains []string

	// For each container, check if it has VIRTUAL_HOST environment variable
	for _, container := range containers {
		virtualHost, err := getVirtualHost(container)
		if err != nil {
			logrus.Warnf("Failed to get VIRTUAL_HOST for container %s: %v", container, err)
			continue
		}

		if virtualHost != "" {
			logrus.Debugf("Found VIRTUAL_HOST=%s for container %s", virtualHost, container)
			domains = append(domains, virtualHost)
		}
	}

	return domains, nil
}

// getRunningContainers gets a list of running containers
func getRunningContainers() ([]string, error) {
	cmd := exec.Command("docker", "ps", "--format", "{{.Names}}")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		logrus.Errorf("Docker ps command failed: %s", stderr.String())
		return nil, fmt.Errorf("docker ps command failed: %s", stderr.String())
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

// getVirtualHost gets the VIRTUAL_HOST environment variable from a container
func getVirtualHost(container string) (string, error) {
	cmd := exec.Command(
		"docker",
		"inspect",
		"--format",
		`{{range .Config.Env}}{{if eq (index (split . "=") 0) "VIRTUAL_HOST"}}{{index (split . "=") 1}}{{end}}{{end}}`,
		container,
	)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		logrus.Warnf("Docker inspect command failed for container %s: %s", container, stderr.String())
		return "", fmt.Errorf("docker inspect command failed for container %s: %s", container, stderr.String())
	}

	virtualHost := strings.TrimSpace(stdout.String())
	if virtualHost == "" {
		logrus.Debugf("Container %s does not have VIRTUAL_HOST environment variable", container)
		return "", nil
	}

	return virtualHost, nil
}
