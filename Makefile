# Docker Infrastructure Makefile

# Include environment variables from .env file
-include .env

# ANSI colors
RESET = \033[0m
BLUE = \033[34m
GREEN = \033[32m
YELLOW = \033[33m
RED = \033[31m

.PHONY: setup start stop restart status logs update backup clean generate-secrets help

# Default target when running just 'make'
help:
	@echo "$(BLUE)Docker Infrastructure Management$(RESET)"
	@echo "$(BLUE)=============================$(RESET)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(RESET)"
	@echo "  $(GREEN)make setup$(RESET)            - Run initial setup"
	@echo "  $(GREEN)make start$(RESET)            - Start all services"
	@echo "  $(GREEN)make stop$(RESET)             - Stop all services"
	@echo "  $(GREEN)make restart$(RESET)          - Restart services"
	@echo "  $(GREEN)make status$(RESET)           - Show status of all services"
	@echo "  $(GREEN)make logs$(RESET)             - Show logs from all services"
	@echo "  $(GREEN)make logs-service$(RESET)     - Show logs for a specific service (e.g., make logs-traefik)"
	@echo "  $(GREEN)make update$(RESET)           - Update services"
	@echo "  $(GREEN)make backup$(RESET)           - Backup data"
	@echo "  $(GREEN)make clean$(RESET)            - Clean up containers and volumes"
	@echo "  $(GREEN)make generate-secrets$(RESET) - Generate secure secrets"
	@echo "  $(GREEN)make help$(RESET)             - Show this help message"

# Setup the infrastructure
setup:
	@echo "$(BLUE)Running setup script...$(RESET)"
	@chmod +x ./setup.sh
	@./setup.sh

# Start all services
start:
	@echo "$(BLUE)Starting all services...$(RESET)"
	@docker-compose up -d
	@echo "$(GREEN)Services started successfully!$(RESET)"
	@echo "$(YELLOW)Your infrastructure is available at:$(RESET)"
	@echo "- Traefik Dashboard: https://$(TRAEFIK_DASHBOARD_SUBDOMAIN).$(DOMAIN)"
	@echo "- Protected App: https://$(PROTECTED_APP_SUBDOMAIN).$(DOMAIN)"
	@echo "- Public App: https://$(PUBLIC_APP_SUBDOMAIN).$(DOMAIN)"
	@echo "- API: https://$(API_SUBDOMAIN).$(DOMAIN)"

# Stop all services
stop:
	@echo "$(BLUE)Stopping all services...$(RESET)"
	@docker-compose down
	@echo "$(GREEN)Services stopped successfully!$(RESET)"

# Restart services
restart: stop start

# Show status of all services
status:
	@echo "$(BLUE)Current services status:$(RESET)"
	@docker-compose ps

# Show logs from all services
logs:
	@docker-compose logs --tail=100 -f

# Show logs for a specific service
logs-%:
	@service=$$(echo $@ | sed 's/logs-//'); \
	docker-compose logs --tail=100 -f $$service

# Update services
update:
	@echo "$(BLUE)Updating services...$(RESET)"
	@chmod +x ./scripts/update.sh
	@./scripts/update.sh

# Backup data
backup:
	@echo "$(BLUE)Backing up data...$(RESET)"
	@chmod +x ./scripts/backup.sh
	@./scripts/backup.sh

# Clean up containers and volumes
clean:
	@echo "$(YELLOW)Warning: This will remove all containers, networks, and volumes!$(RESET)"
	@echo "$(YELLOW)Data loss may occur. Make sure you have backups.$(RESET)"
	@read -p "Are you sure you want to continue? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down -v; \
		docker system prune -f; \
		echo "$(GREEN)Cleanup completed successfully!$(RESET)"; \
	else \
		echo "$(BLUE)Cleanup aborted.$(RESET)"; \
	fi

# Generate secure secrets
generate-secrets:
	@echo "$(BLUE)Generating secure secrets...$(RESET)"
	@chmod +x ./scripts/generate-secrets.sh
	@./scripts/generate-secrets.sh
