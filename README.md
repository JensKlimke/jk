# Docker Infrastructure

A complete Docker Compose infrastructure with Traefik reverse proxy, automatic SSL certificates, OAuth2 authentication, and API token-based access.

## Features

- **Traefik Reverse Proxy** with automatic SSL certificate generation
- **OAuth2 Authentication** for protected services
- **API Token Authentication** for service-to-service communication
- **PostgreSQL** and **Redis** for data persistence
- **Environment-driven Configuration** via .env files
- **Automatic Secret Generation** for secure deployments
- **Network Segmentation** for enhanced security
- **Monitoring** capabilities (optional)

## Quick Start

1. Clone this repository
2. Copy `.env.template` to `.env` and configure variables
3. Run the setup script: `./setup.sh`
4. Start the services: `make start`

## Prerequisites

- Docker (20.10.0+)
- Docker Compose (v2.0.0+)
- A domain name with DNS configured to point to your server
- For OAuth2: Application credentials from your provider (GitHub, Google, etc.)

## Configuration

All configuration is handled through environment variables defined in the `.env` file.

1. Create your `.env` file:
   ```bash
   cp .env.template .env
   ```

2. Edit the `.env` file to set your:
   - Domain name
   - Email address (for Let's Encrypt)
   - OAuth2 provider credentials
   - Database credentials
   - Secret keys and tokens (or let the setup script generate them)

3. Run the setup script to validate your configuration and generate any missing secrets:
   ```bash
   ./setup.sh
   ```

## Services Overview

### Traefik

Traefik acts as the entry point for all requests, handling SSL termination, routing, and middleware chains.

- Dashboard available at: `https://traefik.yourdomain.com`
- Protected by basic auth (credentials in `.env`)

### OAuth2 Proxy

Provides authentication for protected services.

- Login at: `https://auth.yourdomain.com`
- Supports multiple providers (GitHub, Google, etc.)

### API Service

Example API service with token-based authentication.

- Accessible at: `https://api.yourdomain.com`
- Protected endpoints require `Authorization: Bearer TOKEN` header
- Health check at: `https://api.yourdomain.com/health`

### Web Applications

- Protected app: `https://protected.yourdomain.com` (requires OAuth2 login)
- Public app: `https://public.yourdomain.com` (no authentication)

### Databases

- PostgreSQL: Only accessible from internal network
- Redis: Only accessible from internal network

## Common Tasks

The Makefile provides shortcuts for common operations:

- `make setup` - Run initial setup
- `make start` - Start all services
- `make stop` - Stop all services
- `make restart` - Restart services
- `make logs` - Show logs
- `make update` - Update services
- `make backup` - Backup data
- `make clean` - Clean up containers and volumes
- `make generate-secrets` - Generate secure secrets

## Adding New Services

To add a new service to the infrastructure:

1. Add service configuration to `docker-compose.yml` or create a new compose file
2. Configure Traefik labels for routing and middleware
3. Add any necessary environment variables to `.env.template`
4. Update documentation as needed

Example of adding a new web service:

```yaml
  new-service:
    image: nginx:alpine
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.new-service.rule=Host(`new-service.${DOMAIN}`)"
      - "traefik.http.routers.new-service.entrypoints=websecure"
      - "traefik.http.routers.new-service.tls.certresolver=letsencrypt"
      # Add OAuth2 protection
      - "traefik.http.routers.new-service.middlewares=oauth2-auth@file"
    networks:
      - traefik
```

## Troubleshooting

### SSL Certificate Issues

- Ensure your domain's DNS is properly configured
- Check Traefik logs: `docker-compose logs traefik`
- Verify the email address in `.env` is valid
- Check that Let's Encrypt rate limits haven't been reached

### OAuth2 Login Problems

- Verify client ID and secret in `.env`
- Ensure redirect URIs are properly configured in your OAuth provider
- Check OAuth2 proxy logs: `docker-compose logs oauth2-proxy`

### Network Connectivity

- Ensure services are on the correct networks
- Check that internal services are not exposed externally
- Verify Traefik is routing requests correctly

## Security Considerations

- Always change default passwords and tokens
- Use the `generate-secrets.sh` script to create strong secrets
- Regularly update images to include security patches
- Limit access to the Traefik dashboard
- Consider IP whitelisting for sensitive endpoints
- Use separate networks for public-facing and internal services

## Additional Documentation

See the `docs/` directory for detailed guides:

- [Setup Guide](docs/SETUP.md)
- [OAuth Providers Configuration](docs/OAUTH_PROVIDERS.md)
- [API Usage](docs/API_USAGE.md)

## License

MIT
