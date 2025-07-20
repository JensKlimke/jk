# Webhook Service for CI/CD Deployment

## Overview
The Webhook Service provides an endpoint for CI/CD systems to trigger deployments of web applications. When triggered, the service downloads artifact zip files containing HTML content, extracts them, and places the content in the appropriate web server directory.

## Features
- Secure webhook endpoint with Bearer token authentication
- Support for multiple web applications (configurable via URL path)
- Automatic artifact download from GitHub Actions
- Extraction of zip files to the appropriate web server directory
- Logging of deployment activities

## Architecture
The service is built using Node.js, Express, and TypeScript, following the same patterns as other services in this repository.

## Endpoint
- **URL**: `https://deploy.{domain}.{tld}/{webapp}`
- **Method**: POST
- **Authentication**: Bearer token in Authorization header
- **Payload**: JSON with deployment information

## Payload Example
```json
{
  "deployment_status": "success",
  "repository": "owner/repo",
  "commit": "commit-sha",
  "ref": "refs/heads/main",
  "event": "push",
  "artifact_url": "https://github.com/owner/repo/actions/runs/run-id"
}
```

## Workflow
1. CI/CD system sends a POST request to the webhook endpoint
2. Service authenticates the request using the Bearer token
3. Service downloads the artifact from the provided URL
4. Service extracts the artifact to the appropriate directory (var/www/{webapp})
5. Service returns a success response

## Configuration
The service is configured using environment variables:
- `WEBHOOK_SECRET`: Secret token for authentication
- `DOMAIN`: Domain for the webhook URL
- `WEB_ROOT`: Root directory for web applications (default: /var/www)

## Deployment
The service is deployed as a Docker container and integrated with the existing nginx reverse proxy.