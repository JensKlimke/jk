# Nginx Configuration Generator

A TypeScript utility that automatically generates Nginx configuration files for Docker containers. It detects containers with the `VIRTUAL_HOST` environment variable, manages SSL certificates, and supports OAuth2 authentication.

## How It Works

1. **Container Detection**: Scans running Docker containers for those with the `VIRTUAL_HOST` environment variable
2. **Certificate Management**: 
   - Creates self-signed certificates for localhost domains
   - Uses Let's Encrypt (certbot) for production domains
   - Manages certificate renewal
3. **Configuration Generation**: 
   - Renders Nginx configuration files using Mustache templates
   - Supports SSL/TLS configuration
   - Configures OAuth2 authentication when specified

## Key Features

- **Automatic Discovery**: No manual configuration needed for new containers
- **SSL Support**: Automatic certificate management for secure connections
- **Authentication**: Optional OAuth2 integration with header passing
- **Template-Based**: Customizable configuration templates

## Usage

### Environment Variables

- `EMAIL`: Email for Let's Encrypt registration
- `AUTH_UPSTREAM_URL`: URL for the OAuth2 proxy service
- `DOMAIN`: Base domain for services (defaults to localhost)

### Docker Containers

To make a container work with this system, set these environment variables:

- `VIRTUAL_HOST`: Domain name for the service (required)
- `WITH_AUTH`: Set to "true" to enable authentication
- `WITH_AUTH_HEADERS`: Set to "true" to pass authentication headers to the service

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build
```

## License

MIT License - See LICENSE file for details
