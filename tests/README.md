# Test Scripts

This directory contains test scripts for various components of the JK project.

## Artifact Server

The artifact server (`artifact-server/server.js`) is a simple HTTP server that serves a zip file containing web artifacts. It's used for testing the webhook service's ability to download and process artifacts.

## Test Scripts

### test-webhook.js

This script tests the integration between the artifact server and the webhook service running in the docker-compose stack. It:

1. Starts the artifact server on the host machine
2. Triggers the webhook service in the docker-compose stack with the artifact URL
3. Verifies the webhook service processes the artifact correctly

#### Prerequisites

- Node.js installed
- The docker-compose stack must be running (`docker-compose up -d`)
- The `index.html.zip` file must exist in the `tests` directory
- The `axios` npm package must be installed

#### Usage

```bash
# Basic usage (uses default configuration)
./test-webhook.js

# With custom configuration
ARTIFACT_SERVER_PORT=4000 WEBHOOK_SERVICE_HOST=custom.domain WEBAPP_NAME=my-app ./test-webhook.js
```

#### Configuration

The script can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ARTIFACT_SERVER_PORT` | Port for the artifact server | 3000 |
| `ARTIFACT_SERVER_HOST` | Hostname for the artifact server (accessible from docker) | host.docker.internal |
| `WEBHOOK_SERVICE_HOST` | Hostname for the webhook service | deploy.localhost |
| `WEBAPP_NAME` | Name of the webapp to deploy to | test-app |

#### Expected Output

When the script runs successfully, you should see output similar to:

```
Starting artifact server...
Waiting for artifact server to start...
[Artifact Server] Artifact server running at http://localhost:3000
[Artifact Server] Serving zip file from: /path/to/index.html.zip
[Artifact Server] Access the artifact at: http://localhost:3000/artifact
Triggering webhook at http://deploy.localhost/test-app with artifact URL: http://host.docker.internal:3000/artifact
Webhook response: { status: 'success', message: 'Deployment successful for test-app', ... }
Test completed successfully!
Shutting down artifact server...
```

#### Troubleshooting

- **Error: Zip file not found**: Ensure the `index.html.zip` file exists in the `tests` directory
- **Connection refused**: Ensure the docker-compose stack is running (`docker-compose up -d`)
- **Name resolution error**: If host.docker.internal doesn't work, try using your machine's actual IP address for ARTIFACT_SERVER_HOST
- **Authentication error**: The webhook service may require authentication that isn't configured in the test script
- **Timeout**: Increase the wait time in the script if the servers take longer to start

## Running the Tests

To run all tests:

1. Start the docker-compose stack:
   ```bash
   cd /path/to/jk
   docker-compose up -d
   ```

2. In a separate terminal, run the test script:
   ```bash
   cd /path/to/jk
   ./tests/test-webhook.js
   ```

3. To test with a custom configuration:
   ```bash
   ARTIFACT_SERVER_HOST=192.168.1.100 WEBHOOK_SERVICE_HOST=deploy.localhost WEBAPP_NAME=my-app ./tests/test-webhook.js
   ```