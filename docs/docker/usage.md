# Building and Running with Docker

This guide explains how to build and run the JK project using Docker.

## Overview

The JK project uses Docker Compose to orchestrate all services, making it easy to build and run the entire system with a few commands.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Building All Services

To build all services:

```bash
docker-compose build
```

This command will:
1. Build the API service
2. Build the WHOIS service
3. Build the frontend app

The build process may take a few minutes the first time, as it needs to download base images and install dependencies.

## Running All Services

To run all services in the background:

```bash
docker-compose up -d
```

This command will:
1. Start the API service
2. Start the WHOIS service
3. Start the frontend app
4. Start the Nginx reverse proxy

The `-d` flag runs the containers in detached mode (in the background).

## Viewing Logs

To view the logs from all services:

```bash
docker-compose logs -f
```

The `-f` flag follows the logs, showing new log entries as they are generated.

To view logs for a specific service:

```bash
docker-compose logs -f app
docker-compose logs -f api
docker-compose logs -f whois
docker-compose logs -f nginx
```

## Stopping All Services

To stop all services:

```bash
docker-compose down
```

This command stops and removes all containers defined in the `docker-compose.yml` file.

## Building and Running Individual Services

You can also build and run individual services:

```bash
# Build and run just the frontend app
docker-compose up -d app

# Build and run just the API service
docker-compose up -d api

# Build and run just the WHOIS service
docker-compose up -d whois
```

Note that some services depend on others, so you may need to start multiple services for everything to work correctly.

## Accessing the Services

Once the containers are running, you can access the services through the Nginx reverse proxy using the configured subdomains:

- **Frontend App**: http://app.${DOMAIN}
- **API Service**: http://api.${DOMAIN}
- **WHOIS Service**: http://whois.${DOMAIN}

Where `${DOMAIN}` is the value of the DOMAIN environment variable (defaults to `localhost` if not set).

For local development, you may need to add entries to your hosts file to map the subdomains to your local IP address. See the [configuration guide](configuration.md) for details.

## Rebuilding Services

If you make changes to the code, you'll need to rebuild the affected services:

```bash
# Rebuild and restart the frontend app
docker-compose up -d --build app

# Rebuild and restart the API service
docker-compose up -d --build api

# Rebuild and restart the WHOIS service
docker-compose up -d --build whois
```

## Cleaning Up

To remove all containers, networks, and volumes created by Docker Compose:

```bash
docker-compose down -v
```

The `-v` flag also removes volumes, which can be useful for a clean start.

To remove all images built by Docker Compose:

```bash
docker-compose down --rmi all
```

## Troubleshooting

### Container Fails to Start

If a container fails to start, check the logs:

```bash
docker-compose logs <service-name>
```

Common issues include:
- Port conflicts: Make sure the required ports are not already in use
- Missing environment variables: Check that all required environment variables are set
- Build errors: Check for errors during the build process

### Services Can't Communicate

If services can't communicate with each other:
- Check that all services are running: `docker-compose ps`
- Check that the service URLs are configured correctly: See the [configuration guide](configuration.md)
- Check the Docker network: `docker network inspect jk-network`

### Slow Shutdown

If services take a long time to shut down when running `docker-compose down`:
- This is often due to services not handling the SIGTERM signal properly
- The JK project implements graceful shutdown for all services, but if you're experiencing slow shutdowns, check the [graceful shutdown documentation](../operations/graceful-shutdown.md)

## Next Steps

- Learn about [configuring service URLs](configuration.md)
- Return to [Docker setup](setup.md)
- Return to the [main documentation](../README.md)