# HTTPS Setup with Let's Encrypt

This guide explains how to use HTTPS with Let's Encrypt certificates in the JK project.

## Overview

The JK project now supports HTTPS using Let's Encrypt certificates. This setup includes:

- Automatic certificate issuance and renewal using Certbot
- HTTPS configuration for all services (app, api, whois)
- HTTP to HTTPS redirection
- Self-signed certificates for initial startup

## Requirements

To use HTTPS with Let's Encrypt, you need:

1. A domain name pointing to your server
2. Port 80 and 443 open on your server
3. Email address for Let's Encrypt notifications

## Configuration

### Environment Variables

The following environment variables can be used to configure the HTTPS setup:

- `DOMAIN`: The domain name to use for the services (default: localhost)
- `EMAIL`: The email address to use for Let's Encrypt notifications (default: admin@example.com)
- `CERTBOT_STAGING`: Set to empty string to use production Let's Encrypt servers (default: --staging)

### Example Usage

```bash
# Use staging Let's Encrypt servers (for testing)
DOMAIN=example.com EMAIL=admin@example.com docker-compose up -d

# Use production Let's Encrypt servers (for real certificates)
DOMAIN=example.com EMAIL=admin@example.com CERTBOT_STAGING= docker-compose up -d
```

## How It Works

1. When the stack starts, the nginx container automatically installs openssl if needed
2. Nginx creates self-signed certificates for initial startup using openssl
3. Certbot obtains Let's Encrypt certificates using the webroot method
4. Nginx serves the services over HTTPS using the Let's Encrypt certificates
5. Certbot renews the certificates automatically every 12 hours if needed

## Troubleshooting

### Certificate Issuance Fails

If certificate issuance fails, check:

1. DNS configuration: Make sure your domain points to your server
2. Firewall: Make sure ports 80 and 443 are open
3. Logs: Check the Certbot logs for more information

```bash
docker-compose logs certbot
```

### Using with localhost

Let's Encrypt doesn't issue certificates for localhost. For local development:

1. Use the default self-signed certificates
2. Add an entry to your hosts file to use a custom domain
3. Use a service like ngrok to expose your local server

## Next Steps

- Learn how to [configure service URLs](configuration.md)
- Learn how to [build and run with Docker](usage.md)
- Return to the [main documentation](../README.md)
