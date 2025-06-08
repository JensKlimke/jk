# Service Controller API

A TypeScript API server for processing Nginx configuration templates.

## Overview

The Service Controller is an API server that processes Nginx configuration templates by replacing placeholders with actual values. It provides RESTful endpoints to trigger template processing and check the service health.

## Features

- RESTful API for processing Nginx configuration templates
- Health check endpoint to verify service status
- Processes Nginx configuration templates by replacing `{{ domain }}` placeholders with the actual domain
- Special handling for secure configuration files (*.sec.conf) with SSL certificates
- Checks if the oauth2-proxy service is running before processing secure configuration files
- Checks if certificate files exist before processing secure configuration files
- Restarts Nginx after processing templates
- OpenAPI documentation for the API endpoints

## Configuration

The service can be configured using the following environment variables:

- `PORT`: The port on which the API server will listen (default: 3000)
- `DOMAIN`: The domain name to use in templates (default: 'localhost')
- `TEMPLATE_DIR`: The directory containing template files (default: '/etc/nginx/conf.d.tmpl')
- `OUTPUT_DIR`: The directory where processed files will be written (default: '/etc/nginx/conf.d')
- `CERTS_DIR`: The directory containing SSL certificates (default: '/etc/nginx/certs')

## API Documentation

The API provides the following endpoints:

### GET /health

Health check endpoint to verify the service is running.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /api/process-templates

Processes Nginx configuration templates and restarts Nginx.

**Response (success):**
```json
{
  "status": "success",
  "message": "Templates processed and nginx restarted successfully"
}
```

**Response (Nginx not running):**
```json
{
  "status": "error",
  "message": "Nginx is not running"
}
```

**Response (error):**
```json
{
  "status": "error",
  "message": "Error message details"
}
```

The API documentation is also available at `/api-docs` when the server is running.

## Usage

### Running with Docker Compose

The service is designed to be run as part of a Docker Compose setup. Here's an example configuration:

```yaml
services:
  controller:
    build:
      context: .
      dockerfile: packages/services/controller/Dockerfile
    container_name: controller
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./.nginx-conf.d:/etc/nginx/conf.d
      - ./nginx/conf.d.tmpl:/etc/nginx/conf.d.tmpl
      - ./test/certs:/etc/nginx/certs:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - PORT=3000
      - DOMAIN=${DOMAIN:-localhost}
      - TEMPLATE_DIR=/etc/nginx/conf.d.tmpl
      - OUTPUT_DIR=/etc/nginx/conf.d
      - CERTS_DIR=/etc/nginx/certs
    depends_on:
      - nginx-proxy
```

### Development

To run the service in development mode:

```bash
npm run dev --workspace=@jk/controller
```

### Building

To build the service:

```bash
npm run build --workspace=@jk/controller
```

### Testing

To run the tests:

```bash
npm test --workspace=@jk/controller
```

## Architecture

The service is built using a service-oriented architecture with the following components:

- **Express Server**: Provides the RESTful API endpoints
- **ConfigService**: Handles configuration settings
- **DockerService**: Handles Docker-related operations
- **NginxService**: Handles Nginx-related operations
- **TemplateService**: Handles template processing operations

The server is implemented using Express.js and follows RESTful API principles. It uses Swagger UI to provide interactive API documentation.

## License

MIT
