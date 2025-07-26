# Project Guidelines
    

## Project overview

A production-ready Traefik reverse proxy setup with GitHub OAuth authentication middleware and automatic HTTPS certificates. Supports both development and production environments with Docker Compose orchestration.


## Folder Structure

```
├── .junie/                     # Project guidelines and documentation
├── services/                   # Microservices directory
│   └── auth/                   # GitHub OAuth authentication service
├── traefik/                    # Traefik reverse proxy configuration
├── docker-compose.yml          # Production Docker services configuration
├── docker-compose.override.yml # Development overrides (dashboard, HTTP)
├── traefik.prod.yml           # Production Traefik static configuration
├── traefik.dev.yml            # Development Traefik static configuration
├── Makefile                   # Build and deployment automation
├── README.md                  # Project documentation and setup guide
└── .env                       # Environment variables (domain, OAuth secrets)
```

### Key Components

- **Traefik**: Reverse proxy with automatic HTTPS and load balancing
- **Auth Service**: Node.js/TypeScript service providing GitHub OAuth authentication
- **Configuration**: Separate configs for development (HTTP, dashboard) and production (HTTPS, Let's Encrypt)
- **Docker Compose**: Orchestrates all services with proper networking and volumes

## Instructions

- Do not run ```make install```. The service shall not be installed locally.