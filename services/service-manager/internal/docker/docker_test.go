package docker

import (
	"os"
	"os/exec"
	"testing"
)

// mockExecCommand is used to mock the exec.Command function for testing
func mockExecCommand(command string, args ...string) *exec.Cmd {
	cs := []string{"-test.run=TestHelperProcess", "--", command}
	cs = append(cs, args...)
	cmd := exec.Command(os.Args[0], cs...)
	cmd.Env = []string{"GO_WANT_HELPER_PROCESS=1"}
	return cmd
}

// TestHelperProcess is not a real test, it's used to mock exec.Command
func TestHelperProcess(t *testing.T) {
	if os.Getenv("GO_WANT_HELPER_PROCESS") != "1" {
		return
	}
	defer os.Exit(0)

	// Get the command and arguments that were passed to exec.Command
	args := os.Args
	for len(args) > 0 {
		if args[0] == "--" {
			args = args[1:]
			break
		}
		args = args[1:]
	}
	if len(args) == 0 {
		os.Exit(1)
	}

 // Mock different commands
	cmd, args := args[0], args[1:]
	switch cmd {
	case "docker":
		if len(args) > 0 && args[0] == "ps" {
			// Mock docker ps command
			os.Stdout.WriteString("container1\ncontainer2\n")
		} else if len(args) > 0 && args[0] == "restart" {
			// Mock docker restart command
			// Just return success, no output needed
		} else if len(args) > 0 && args[0] == "inspect" {
			// Mock docker inspect command
			if len(args) > 2 && args[1] == "--format" {
				// Handle format-specific inspect commands
				format := args[2]
				containerName := args[len(args)-1]

				if format == `{{range .Config.Env}}{{if eq (index (split . "=") 0) "VIRTUAL_HOST"}}{{index (split . "=") 1}}{{end}}{{end}}` {
					// VIRTUAL_HOST environment variable
					if containerName == "container1" {
						os.Stdout.WriteString("example.com")
					} else if containerName == "container2" {
						os.Stdout.WriteString("test.com")
					}
				} else if format == `{{range .Config.Env}}{{if eq (index (split . "=") 0) "WITH_AUTH_HEADERS"}}{{index (split . "=") 1}}{{end}}{{end}}` {
					// WITH_AUTH_HEADERS environment variable
					if containerName == "container1" {
						os.Stdout.WriteString("true")
					} else if containerName == "container2" {
						os.Stdout.WriteString("false")
					}
				} else if format == `{{range .Config.Env}}{{if eq (index (split . "=") 0) "WITH_AUTH"}}{{index (split . "=") 1}}{{end}}{{end}}` {
					// WITH_AUTH environment variable
					if containerName == "container1" {
						os.Stdout.WriteString("false")
					} else if containerName == "container2" {
						os.Stdout.WriteString("true")
					}
				} else if format == `{{range $port, $_ := .Config.ExposedPorts}}{{$port}}{{"\n"}}{{end}}` {
					// Exposed ports
					if containerName == "container1" {
						os.Stdout.WriteString("80/tcp\n443/tcp\n")
					} else if containerName == "container2" {
						os.Stdout.WriteString("8080/tcp\n")
					}
				}
			} else {
				// Regular inspect command
				containerName := args[len(args)-1]
				if containerName == "container1" {
					os.Stdout.WriteString("example.com")
				} else if containerName == "container2" {
					os.Stdout.WriteString("test.com")
				}
			}
		}
	default:
		os.Exit(1)
	}
}

func TestGetDomainsFromContainers(t *testing.T) {
	// Save the original exec.Command and restore it after the test
	origExecCommand := execCommand
	execCommand = mockExecCommand
	defer func() { execCommand = origExecCommand }()

	// Test GetDomainsFromContainers
	domains, err := GetDomainsFromContainers()
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that we got the expected domains
	expectedDomains := []string{"example.com", "test.com"}
	if len(domains) != len(expectedDomains) {
		t.Errorf("Expected %d domains, got %d", len(expectedDomains), len(domains))
	}

	for i, domain := range domains {
		if domain != expectedDomains[i] {
			t.Errorf("Expected domain %s, got %s", expectedDomains[i], domain)
		}
	}
}

func TestRestartNginx(t *testing.T) {
	// Save the original exec.Command and restore it after the test
	origExecCommand := execCommand

	// Track if docker restart was called with the right arguments
	restartCalled := false
	execCommand = func(command string, args ...string) *exec.Cmd {
		if command == "docker" && len(args) >= 2 && args[0] == "restart" && args[1] == "nginx" {
			restartCalled = true
		}
		return mockExecCommand(command, args...)
	}
	defer func() { execCommand = origExecCommand }()

	// Update the TestHelperProcess to handle docker restart
	// This is already handled by the existing implementation

	// Call RestartNginx
	err := RestartNginx()
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check if docker restart was called with the right arguments
	if !restartCalled {
		t.Error("Expected docker restart nginx to be called")
	}
}

func TestGetServicesConfig(t *testing.T) {
	// Save the original exec.Command and restore it after the test
	origExecCommand := execCommand
	execCommand = mockExecCommand
	defer func() { execCommand = origExecCommand }()

	// Set environment variable for auth service
	origAuthService := os.Getenv("AUTH_SERVICE")
	os.Setenv("AUTH_SERVICE", "oauth2-proxy:4180")
	defer os.Setenv("AUTH_SERVICE", origAuthService)

	// Mock fileExistsFunc function
	origFileExistsFunc := fileExistsFunc
	fileExistsFunc = func(filename string) (bool, error) {
		// Mock certificate files for example.com
		if filename == "/etc/letsencrypt/live/example.com/fullchain.pem" ||
			filename == "/etc/letsencrypt/live/example.com/privkey.pem" {
			return true, nil
		}
		// Mock default certificate files
		if filename == "/etc/letsencrypt/live/default/fullchain.pem" ||
			filename == "/etc/letsencrypt/live/default/privkey.pem" {
			return true, nil
		}
		return false, nil
	}
	defer func() { fileExistsFunc = origFileExistsFunc }()

	// Test GetServicesConfig
	config, err := GetServicesConfig()
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Check that we got the expected services
	if len(config.Services) != 2 {
		t.Errorf("Expected 2 services, got %d", len(config.Services))
	}

	// Check the first service
	if config.Services[0].Host != "example.com" {
		t.Errorf("Expected host example.com, got %s", config.Services[0].Host)
	}
	if config.Services[0].Service != "container1" {
		t.Errorf("Expected service container1, got %s", config.Services[0].Service)
	}
	if config.Services[0].Port != "80" {
		t.Errorf("Expected port 80, got %s", config.Services[0].Port)
	}
	if config.Services[0].Cert == nil {
		t.Error("Expected cert to be non-nil")
	} else {
		if config.Services[0].Cert.File != "/etc/letsencrypt/live/example.com/fullchain.pem" {
			t.Errorf("Expected cert file /etc/letsencrypt/live/example.com/fullchain.pem, got %s", config.Services[0].Cert.File)
		}
		if config.Services[0].Cert.KeyFile != "/etc/letsencrypt/live/example.com/privkey.pem" {
			t.Errorf("Expected cert key file /etc/letsencrypt/live/example.com/privkey.pem, got %s", config.Services[0].Cert.KeyFile)
		}
	}
	if config.Services[0].Auth == nil {
		t.Error("Expected auth to be non-nil")
	} else {
		if config.Services[0].Auth.Service != "oauth2-proxy:4180" {
			t.Errorf("Expected auth service oauth2-proxy:4180, got %s", config.Services[0].Auth.Service)
		}
		if !config.Services[0].Auth.Headers {
			t.Error("Expected auth headers to be true")
		}
	}

	// Check the second service
	if config.Services[1].Host != "test.com" {
		t.Errorf("Expected host test.com, got %s", config.Services[1].Host)
	}
	if config.Services[1].Service != "container2" {
		t.Errorf("Expected service container2, got %s", config.Services[1].Service)
	}
	if config.Services[1].Port != "8080" {
		t.Errorf("Expected port 8080, got %s", config.Services[1].Port)
	}
	if config.Services[1].Cert != nil {
		t.Error("Expected cert to be nil")
	}
	if config.Services[1].Auth == nil {
		t.Error("Expected auth to be non-nil")
	} else {
		if config.Services[1].Auth.Service != "oauth2-proxy:4180" {
			t.Errorf("Expected auth service oauth2-proxy:4180, got %s", config.Services[1].Auth.Service)
		}
		if config.Services[1].Auth.Headers {
			t.Error("Expected auth headers to be false")
		}
	}

	// Check the default certificate
	if config.DefaultCert == nil {
		t.Error("Expected default_cert to be non-nil")
	} else {
		if config.DefaultCert.File != "/etc/letsencrypt/live/default/fullchain.pem" {
			t.Errorf("Expected default cert file /etc/letsencrypt/live/default/fullchain.pem, got %s", config.DefaultCert.File)
		}
		if config.DefaultCert.KeyFile != "/etc/letsencrypt/live/default/privkey.pem" {
			t.Errorf("Expected default cert key file /etc/letsencrypt/live/default/privkey.pem, got %s", config.DefaultCert.KeyFile)
		}
	}
}
