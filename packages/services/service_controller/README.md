# Nginx Template Processor

A TypeScript service for processing Nginx configuration templates.

## Overview

The Nginx Template Processor is a service that processes Nginx configuration templates by replacing placeholders with actual values. It monitors template files for changes and automatically reprocesses them when needed.

## Features

- Processes Nginx configuration templates by replacing `{{ domain }}` placeholders with the actual domain
- Special handling for secure configuration files (*.sec.conf) with SSL certificates
- Checks if the oauth2-proxy service is running before processing secure configuration files
- Checks if certificate files exist before processing secure configuration files
- Monitors template files for changes and reprocesses them when needed
- Restarts Nginx after processing templates

## Configuration

The service can be configured using the following environment variables:

- `DOMAIN`: The domain name to use in templates (default: 'localhost')
- `TEMPLATE_DIR`: The directory containing template files (default: '/etc/nginx/conf.d.tmpl')
- `OUTPUT_DIR`: The directory where processed files will be written (default: '/etc/nginx/conf.d')
- `CERTS_DIR`: The directory containing SSL certificates (default: '/etc/nginx/certs')

## Usage

### Running with Docker Compose

The service is designed to be run as part of a Docker Compose setup. Here's an example configuration:

```yaml
services:
  service_controller:
    build:
      context: .
      dockerfile: packages/services/service_controller/Dockerfile
    container_name: service_controller
    restart: unless-stopped
    volumes:
      - ./.nginx-conf.d:/etc/nginx/conf.d
      - ./nginx/conf.d.tmpl:/etc/nginx/conf.d.tmpl
      - ./test/certs:/etc/nginx/certs:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
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
npm run dev --workspace=@jk/service_controller
```

### Building

To build the service:

```bash
npm run build --workspace=@jk/service_controller
```

### Testing

To run the tests:

```bash
npm test --workspace=@jk/service_controller
```

## Architecture

The service is built using a service-oriented architecture with the following components:

- **ConfigService**: Handles configuration settings
- **DockerService**: Handles Docker-related operations
- **NginxService**: Handles Nginx-related operations
- **TemplateService**: Handles template processing operations

## License

MIT