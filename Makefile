# Makefile for jk-traefik project
# Manages Docker Compose services for Traefik reverse proxy setup

.PHONY: build start-prod start-dev stop restart clean install help

# Default target
help:
	@echo "Available targets:"
	@echo "  build      - Build all services"
	@echo "  start-prod - Start services in production mode"
	@echo "  start-dev  - Start services in development mode"
	@echo "  stop       - Stop all services"
	@echo "  restart    - Restart all services"
	@echo "  clean      - Clean up all Docker artifacts"
	@echo "  install    - Install systemd service for auto-start"
	@echo "  help       - Show this help message"

# Build all services
build:
	@echo "Building all services..."
	docker-compose build

# Start services in production mode (without override file)
start-prod:
	@echo "Creating Docker network if it doesn't exist..."
	docker network create traefik 2>/dev/null || true
	@echo "Starting services in production mode..."
	docker-compose -f docker-compose.yml up -d

# Start services in development mode (with override file)
start-dev:
	@echo "Creating Docker network if it doesn't exist..."
	docker network create traefik 2>/dev/null || true
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

# Clean up all Docker artifacts
clean:
	@echo "Cleaning up Docker artifacts..."
	@echo "Stopping and removing containers..."
	docker-compose down --remove-orphans 2>/dev/null || true
	@echo "Removing project images..."
	docker rmi jk-traefik-auth jk-traefik-cookie-middleware 2>/dev/null || true
	@echo "Removing traefik network..."
	docker network rm traefik 2>/dev/null || true
	@echo "Pruning unused Docker resources..."
	docker system prune -f
	@echo "Docker cleanup completed!"

# Install systemd service for auto-start
install:
	@echo "Installing systemd service..."
	@if [ "$$EUID" -ne 0 ]; then \
		echo "Error: This command must be run as root (use sudo)"; \
		exit 1; \
	fi
	@echo "Creating systemd service file..."
	@echo "[Unit]" > /etc/systemd/system/jk-traefik.service
	@echo "Description=JK Traefik Docker Services" >> /etc/systemd/system/jk-traefik.service
	@echo "Requires=docker.service" >> /etc/systemd/system/jk-traefik.service
	@echo "After=docker.service" >> /etc/systemd/system/jk-traefik.service
	@echo "" >> /etc/systemd/system/jk-traefik.service
	@echo "[Service]" >> /etc/systemd/system/jk-traefik.service
	@echo "Type=oneshot" >> /etc/systemd/system/jk-traefik.service
	@echo "RemainAfterExit=yes" >> /etc/systemd/system/jk-traefik.service
	@echo "WorkingDirectory=$(shell pwd)" >> /etc/systemd/system/jk-traefik.service
	@echo "ExecStart=/usr/bin/make start-prod" >> /etc/systemd/system/jk-traefik.service
	@echo "ExecStop=/usr/bin/make stop" >> /etc/systemd/system/jk-traefik.service
	@echo "TimeoutStartSec=0" >> /etc/systemd/system/jk-traefik.service
	@echo "" >> /etc/systemd/system/jk-traefik.service
	@echo "[Install]" >> /etc/systemd/system/jk-traefik.service
	@echo "WantedBy=multi-user.target" >> /etc/systemd/system/jk-traefik.service
	@echo "Reloading systemd daemon..."
	systemctl daemon-reload
	@echo "Service installed! Use the following commands:"
	@echo "  sudo systemctl enable jk-traefik  - Enable auto-start on boot"
	@echo "  sudo systemctl start jk-traefik   - Start the service now"
	@echo "  sudo systemctl stop jk-traefik    - Stop the service"
	@echo "  sudo systemctl disable jk-traefik - Disable auto-start"