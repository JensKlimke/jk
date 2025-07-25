# Makefile for jk-traefik project
# Manages Docker Compose services for Traefik reverse proxy setup

.PHONY: build start-prod start-dev stop restart help

# Default target
help:
	@echo "Available targets:"
	@echo "  build      - Build all services"
	@echo "  start-prod - Start services in production mode"
	@echo "  start-dev  - Start services in development mode"
	@echo "  stop       - Stop all services"
	@echo "  restart    - Restart all services"
	@echo "  help       - Show this help message"

# Build all services
build:
	@echo "Building all services..."
	docker-compose build

# Start services in production mode (without override file)
start-prod:
	@echo "Starting services in production mode..."
	docker-compose -f docker-compose.yml up -d

# Start services in development mode (with override file)
start-dev:
	@echo "Starting services in development mode..."
	docker-compose up -d

# Stop all services
stop:
	@echo "Stopping all services..."
	docker-compose down

# Restart all services (maintains current mode - dev or prod)
restart:
	@echo "Restarting services..."
	docker-compose restart