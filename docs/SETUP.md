# Detailed Setup Guide

This document provides detailed instructions for setting up the Docker infrastructure.

## Prerequisites

Before you begin, ensure you have the following installed on your server:

- Docker (20.10.0+)
- Docker Compose (v2.0.0+)
- A domain name with DNS configured to point to your server
- For OAuth2: Application credentials from your provider (GitHub, Google, etc.)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/docker-infrastructure.git
cd docker-infrastructure
```

### 2. Configure Environment Variables

```bash
cp .env.template .env
```

Edit the `.env` file with your configuration. At minimum, set the following:

- `DOMAIN`: Your domain name
- `EMAIL`: Your email address (for Let's Encrypt)
- `OAUTH2_PROVIDER`, `OAUTH2_CLIENT_ID`, and `OAUTH2_CLIENT_SECRET`: OAuth2 provider credentials

### 3. Run the Setup Script

```bash
./setup.sh
```

This will:
- Create necessary directories
- Set up Docker networks
- Generate missing secrets
- Validate your configuration

### 4. Start the Services

```bash
make start
```

## DNS Configuration

Ensure your domain and subdomains point to your server's IP address. You need DNS records for:

- `yourdomain.com`
- `traefik.yourdomain.com`
- `auth.yourdomain.com`
- `api.yourdomain.com`
- `protected.yourdomain.com`
- `public.yourdomain.com`

The simplest approach is to create a wildcard DNS record (`*.yourdomain.com`) pointing to your server's IP address.

## OAuth2 Configuration

See [OAuth Providers Configuration](OAUTH_PROVIDERS.md) for detailed instructions on setting up OAuth2 with different providers.

## Firewall Configuration

Ensure your firewall allows incoming connections on the following ports:

- 80/TCP (HTTP)
- 443/TCP (HTTPS)

You can use UFW (Uncomplicated Firewall) on Ubuntu:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Checking Service Status

After starting the services, you can check their status:

```bash
make status
```

View logs with:

```bash
make logs
```

View logs for a specific service with:

```bash
make logs-traefik
make logs-api-service
# etc.
```

## Setting Up a Production Server

For production deployments, additional considerations include:

### Server Hardening

1. **Disable root SSH access**
2. **Use SSH keys instead of passwords**
3. **Set up automatic security updates**

### Let's Encrypt Rate Limits

Be aware of Let's Encrypt's [rate limits](https://letsencrypt.org/docs/rate-limits/). In testing environments, consider using the staging ACME server by changing in your `.env`:

```
ACME_CA_SERVER=https://acme-staging-v02.api.letsencrypt.org/directory
```

### Monitoring and Alerts

For production, consider enabling the monitoring stack:

```
ENABLE_MONITORING=true
```

And configure an alert system to notify you of service outages.

## Common Issues

### Certificates Not Being Issued

- Verify your domain's DNS records are correct
- Ensure your email address is valid
- Check Traefik logs: `make logs-traefik`
- Make sure ports 80 and 443 are open and not used by other services

### Services Not Starting

- Check logs: `make logs`
- Verify all required environment variables are set
- Ensure Docker has enough resources (CPU, memory, disk space)

### OAuth2 Login Problems

- Verify client ID and secret in `.env`
- Ensure redirect URIs are properly configured in your OAuth provider
- Check OAuth2 proxy logs: `make logs-oauth2-proxy`

## Updating the Infrastructure

To update all services to their latest versions:

```bash
make update
```

This will:
- Create a backup
- Pull the latest Docker images
- Rebuild custom services
- Restart services with minimal downtime
- Clean up unused resources

## Backing Up Data

To back up all data:

```bash
make backup
```

Backups are stored in the `backups/` directory. Consider setting up a cron job to run this regularly and transfer backups to a secure off-site location.

## Next Steps

After completing the setup:

1. Explore the Traefik dashboard at `https://traefik.yourdomain.com`
2. Test the protected app at `https://protected.yourdomain.com`
3. Verify the API is working at `https://api.yourdomain.com/health`
4. Review the API documentation at [API Usage](API_USAGE.md)
