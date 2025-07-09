# Services JSON Generator

This directory contains scripts for generating the `services.json` file used by the Nginx configuration generator.

## generateServicesJson.ts

This script automatically generates the `services.json` file by scanning Docker containers and identifying those with the `VIRTUAL_HOST` environment variable set.

### How it works

1. The script uses Docker CLI commands to list all running containers
2. It identifies containers that have the `VIRTUAL_HOST` environment variable set
3. For each container, it extracts:
   - The service name (container name)
   - The exposed port
   - The host (from VIRTUAL_HOST)
4. It generates a `services.json` file with the proper structure, including:
   - SSL certificate configuration
   - Authentication configuration (if an auth service is specified)

### Usage

```bash
# Compile TypeScript
npm run build

# Run the script with default options (outputs to ./services.json)
node dist/services/generateServicesJson.js

# Run with custom output path
node dist/services/generateServicesJson.js /path/to/services.json

# Run with custom output path and auth service
node dist/services/generateServicesJson.js /path/to/services.json auth-service
```

### Command-line arguments

1. `outputPath` (optional): Path where the services.json file will be written (default: ./services.json)
2. `authService` (optional): Name of the container to use as authentication service. If specified, all other services will be configured to use this service for authentication.

### Example output

```json
{
  "services": [
    {
      "host": "auth.example.com",
      "cert": {
        "file": "/etc/letsencrypt/live/auth.example.com/fullchain.pem",
        "key_file": "/etc/letsencrypt/live/auth.example.com/privkey.pem"
      },
      "service": "auth-service",
      "port": "8080"
    },
    {
      "host": "app.example.com",
      "cert": {
        "file": "/etc/letsencrypt/live/app.example.com/fullchain.pem",
        "key_file": "/etc/letsencrypt/live/app.example.com/privkey.pem"
      },
      "auth": {
        "name": "auth-service",
        "port": "8080",
        "auth_headers": true
      },
      "service": "app-service",
      "port": "80"
    }
  ]
}
```

## Testing

A test script is provided to verify the functionality:

```bash
# Compile TypeScript
npm run build

# Run the test script with default parameters
node dist/services/test-generate.js

# Run the test script with an auth service
node dist/services/test-generate.js auth-service
```

This will generate the services.json content based on your running Docker containers and display the result without writing to a file. The test script accepts the same parameters as the main script (except for the output path).
