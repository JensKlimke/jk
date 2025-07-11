// Package docker provides functionality for interacting with Docker containers
package docker

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"

	"github.com/sirupsen/logrus"
)

// Variable to allow mocking exec.Command in tests
var execCommand = exec.Command

// GetDomainsFromContainers retrieves domains from containers with VIRTUAL_HOST environment variable
func GetDomainsFromContainers() ([]string, error) {
	containers, err := getRunningContainers()
	if err != nil {
		return nil, err
	}

	var domains []string
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

// getVirtualHost retrieves the VIRTUAL_HOST environment variable from a container
func getVirtualHost(container string) (string, error) {
	inspectFormat := `{{range .Config.Env}}{{if eq (index (split . "=") 0) "VIRTUAL_HOST"}}{{index (split . "=") 1}}{{end}}{{end}}`
	cmd := execCommand("docker", "inspect", "--format", inspectFormat, container)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		errMsg := stderr.String()
		logrus.Warnf("Docker inspect command failed for container %s: %s", container, errMsg)
		return "", fmt.Errorf("docker inspect command failed for container %s: %s", container, errMsg)
	}

	virtualHost := strings.TrimSpace(stdout.String())
	if virtualHost == "" {
		logrus.Debugf("Container %s does not have VIRTUAL_HOST environment variable", container)
		return "", nil
	}

	return virtualHost, nil
}
