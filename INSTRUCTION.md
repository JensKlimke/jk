# Docker Infrastructure Setup - Coding Agent Instructions

## Overview
Create a complete Docker Compose infrastructure repository with Traefik reverse proxy, automatic SSL certificates, OAuth2 authentication, and API token-based access. All configuration should be environment-driven through .env files.

## Project Structure to Create
```
docker-infrastructure/
├── .env.template
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml
├── docker-compose.override.yml.template
├── setup.sh
├── Makefile
├── traefik/
│   ├── traefik.yml
│   └── dynamic.yml
├── services/
│   ├── api-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── server.js
│   │   └── .dockerignore
│   └── web-apps/
│       ├── protected/
│       │   └── index.html
│       └── public/
│           └── index.html
├── scripts/
│   ├── generate-secrets.sh
│   ├── backup.sh
│   └── update.sh
├── docs/
│   ├── SETUP.md
│   ├── OAUTH_PROVIDERS.md
│   └── API_USAGE.md
└── monitoring/
    └── docker-compose.monitoring.yml.template
```

## Files to Create

### 1. .env.template
Create with all configurable variables and clear descriptions:
```bash
# Domain Configuration
DOMAIN=yourdomain.com
EMAIL=your-email@example.com

# Traefik Dashboard
TRAEFIK_DASHBOARD_SUBDOMAIN=traefik
TRAEFIK_DASHBOARD_USER=admin
TRAEFIK_DASHBOARD_PASSWORD_HASH=

# OAuth2 Configuration
OAUTH2_SUBDOMAIN=auth
OAUTH2_PROVIDER=github
OAUTH2_CLIENT_ID=
OAUTH2_CLIENT_SECRET=
OAUTH2_COOKIE_SECRET=

# API Configuration
API_SUBDOMAIN=api
API_TOKEN=
JWT_SECRET=

# Service Subdomains
PROTECTED_APP_SUBDOMAIN=protected
PUBLIC_APP_SUBDOMAIN=public
ADMIN_SUBDOMAIN=admin

# Database Configuration
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=

# Redis Configuration
REDIS_PASSWORD=

# Network Configuration
TRAEFIK_NETWORK=traefik
INTERNAL_NETWORK=internal

# SSL Configuration
ACME_STORAGE=/certificates/acme.json
ACME_CA_SERVER=https://acme-v02.api.letsencrypt.org/directory

# Security
ALLOWED_IPS=127.0.0.1/32,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12

# Monitoring (Optional)
ENABLE_MONITORING=false
GRAFANA_ADMIN_PASSWORD=
```

### 2. .env.example
Copy of .env.template with example values filled in

### 3. docker-compose.yml
Main compose file using environment variables for all configuration. Include:
- Traefik service with dynamic configuration
- OAuth2 Proxy service
- Example protected web app
- Example public web app
- API service with token auth
- PostgreSQL database
- Redis cache
- All services using env vars for domains, credentials, etc.

### 4. traefik/traefik.yml
Static Traefik configuration using environment variables for:
- Certificate resolver email
- ACME storage path
- API dashboard settings
- Entry points configuration

### 5. traefik/dynamic.yml
Dynamic configuration with middlewares for:
- OAuth2 authentication
- API token validation
- Rate limiting
- CORS headers
- Security headers
- IP whitelisting
- All using environment variables where applicable

### 6. services/api-service/
Complete Node.js API service with:
- Express server with token-based auth
- Protected and public endpoints
- Environment-driven configuration
- Health check endpoints
- Proper error handling
- Dockerfile optimized for production

### 7. setup.sh
Bash script that:
- Creates necessary directories
- Sets up Docker networks
- Generates missing secrets if not provided
- Sets proper file permissions
- Validates environment configuration
- Provides setup status and next steps
- Makes the script executable

### 8. Makefile
Include targets for:
- `make setup` - Run initial setup
- `make start` - Start all services
- `make stop` - Stop all services
- `make restart` - Restart services
- `make logs` - Show logs
- `make update` - Update services
- `make backup` - Backup data
- `make clean` - Clean up containers and volumes
- `make generate-secrets` - Generate secure secrets

### 9. scripts/generate-secrets.sh
Script to generate:
- OAuth2 cookie secret (32 chars)
- API tokens (64 chars hex)
- JWT secrets (64 chars)
- Database passwords (32 chars)
- Traefik dashboard password hash

### 10. README.md
Comprehensive documentation including:
- Quick start guide
- Prerequisites
- Configuration instructions
- Service overview
- Troubleshooting
- Security considerations
- Adding new services examples

### 11. docs/ directory
Create separate documentation files:
- SETUP.md: Detailed setup instructions
- OAUTH_PROVIDERS.md: OAuth provider configuration guides
- API_USAGE.md: API usage examples and authentication

### 12. .gitignore
Include:
```
.env
certificates/
data/
logs/
backups/
*.log
.DS_Store
```

## Key Requirements

### Environment Variable Usage
- ALL configuration must be driven by environment variables
- No hardcoded domains, emails, passwords, or tokens
- Use sensible defaults where possible
- Clear variable naming with prefixes (OAUTH2_, API_, DB_, etc.)

### Security Best Practices
- Generate secure random secrets by default
- Use proper file permissions (600 for certificates)
- Implement proper network segmentation
- Include security headers middleware
- Provide IP whitelisting options

### Service Discovery
- All services use Traefik labels with env vars
- Dynamic subdomain configuration
- Automatic SSL certificate generation
- Health checks where applicable

### Flexibility
- Easy to add new services via compose files
- Configurable authentication per service
- Support for both OAuth2 and token-based auth
- Optional monitoring stack
- Multiple environment support (dev/staging/prod)

### Documentation
- Clear setup instructions
- Examples for common use cases
- Troubleshooting guides
- Security recommendations

## Docker Compose Service Requirements

### Traefik Service
- Use environment variables for all configuration
- Mount dynamic config directory
- Proper network configuration
- Dashboard with configurable subdomain
- Let's Encrypt integration with env-driven email

### OAuth2 Proxy Service
- Support multiple providers via env vars
- Configurable redirect URLs using domain env var
- Secure cookie configuration
- Proper upstream configuration

### API Service
- Token-based authentication middleware
- Both protected and public endpoints
- Environment-driven token configuration
- Proper error responses
- Health check endpoints

### Example Web Apps
- Simple HTML apps for testing
- One protected (OAuth2)
- One public (no auth)
- Configurable via subdomains

### Database Services
- PostgreSQL with env-driven credentials
- Redis with optional password
- Proper volume mounting
- Network security (internal only)

## Scripts Requirements

### setup.sh
- Check prerequisites (Docker, Docker Compose)
- Create networks if not exist
- Generate secrets if missing
- Set file permissions
- Validate configuration
- Provide clear success/error messages

### Makefile
- Common operations as simple commands
- Environment validation
- Logging helpers
- Backup/restore functionality

## Final Deliverable
The agent should create a complete, production-ready infrastructure repository that:
1. Can be cloned and set up with minimal configuration
2. Uses environment variables for all customization
3. Includes comprehensive documentation
4. Provides example services for testing
5. Follows Docker and security best practices
6. Is easily extensible for new services

After running the setup script and configuring the .env file, users should have a fully functional infrastructure with automatic SSL, authentication, and service discovery.