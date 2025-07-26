# Traefik Docker Setup

A production-ready Traefik reverse proxy setup with authentication middleware and automatic HTTPS certificates.

## Prerequisites

- Docker and Docker Compose
- Domain name (for production)
- GitHub OAuth App (for authentication)

## Quick Start

### Development/Testing

```bash
# Create external network
docker network create traefik

# Start services (automatically uses docker-compose.override.yml)
docker-compose up -d
```

**Access:**
- Traefik Dashboard: http://localhost:8080
- Auth Service: http://auth.localhost
- Example App: http://whoami.localhost (requires auth)

### Production

```bash
# Create external network
docker network create traefik

# Set your domain in .env file
DOMAIN=yourdomain.com

# Start production services
docker-compose up -d
```

**Access:**
- Auth Service: https://auth.yourdomain.com
- Example App: https://whoami.yourdomain.com (requires auth)

## Environment Variables

Copy `.env` and configure:

```bash
DOMAIN=yourdomain.com              # Your domain (localhost for dev)
EMAIL=your-email@example.com       # For Let's Encrypt certificates
GITHUB_CLIENT_ID=your_id      # GitHub OAuth App ID
GITHUB_CLIENT_SECRET=your_secret     # GitHub OAuth App Secret
COOKIE_SECRET=random_secret_key    # Session cookie secret
```

## Key Differences

| Feature | Development | Production |
|---------|-------------|------------|
| HTTPS | Disabled | Enabled (Let's Encrypt) |
| Dashboard | Exposed on :8080 | Disabled |
| Domain | localhost fallback | Required |
| Certificates | None | Automatic SSL |

## Services

- **Traefik**: Reverse proxy with automatic HTTPS
- **Auth**: GitHub OAuth authentication middleware
- **Whoami**: Example protected application