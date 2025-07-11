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
		} else if len(args) > 0 && args[0] == "inspect" {
			// Mock docker inspect command
			if len(args) > 1 && args[len(args)-1] == "container1" {
				os.Stdout.WriteString("example.com")
			} else if len(args) > 1 && args[len(args)-1] == "container2" {
				os.Stdout.WriteString("test.com")
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

