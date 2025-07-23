#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Docker Infrastructure Setup Script    ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo 

# Check for docker and docker-compose
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Check if running as root or with sudo
if [ "$(id -u)" != "0" ]; then
  echo -e "${YELLOW}Warning: This script is not running as root.${NC}"
  echo -e "${YELLOW}Some operations might fail due to insufficient permissions.${NC}"
  echo -e "${YELLOW}Consider running with sudo if you encounter permission issues.${NC}"
  echo 
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p certificates
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p logs
mkdir -p services/web-apps/protected
mkdir -p services/web-apps/public
mkdir -p backups

echo -e "${GREEN}✓ Directories created${NC}"

# Set proper permissions for certificates directory
chmod 700 certificates
echo -e "${GREEN}✓ Certificate directory permissions set${NC}"

# Check and create .env file if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.template ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.template .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo -e "${YELLOW}Please edit the .env file with your configuration!${NC}"
  else
    echo -e "${RED}Error: .env.template not found!${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Load environment variables
source .env

# Check if domain is set
if [ "$DOMAIN" = "yourdomain.com" ]; then
  echo -e "${YELLOW}Warning: Default domain detected in .env file.${NC}"
  echo -e "${YELLOW}Please update the DOMAIN value in your .env file.${NC}"
fi

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/*.sh
echo -e "${GREEN}✓ Scripts are now executable${NC}"

# Create Docker networks if they don't exist
echo -e "${YELLOW}Setting up Docker networks...${NC}"

if ! docker network inspect "$TRAEFIK_NETWORK" &>/dev/null; then
  echo -e "Creating $TRAEFIK_NETWORK network..."
  docker network create "$TRAEFIK_NETWORK"
else
  echo -e "$TRAEFIK_NETWORK network already exists"
fi

if ! docker network inspect "$INTERNAL_NETWORK" &>/dev/null; then
  echo -e "Creating $INTERNAL_NETWORK network..."
  docker network create "$INTERNAL_NETWORK"
else
  echo -e "$INTERNAL_NETWORK network already exists"
fi

echo -e "${GREEN}✓ Docker networks are set up${NC}"

# Generate secrets
echo -e "${YELLOW}Generating missing secrets...${NC}"
./scripts/generate-secrets.sh

# Create docker-compose.override.yml if it doesn't exist
if [ ! -f docker-compose.override.yml ] && [ -f docker-compose.override.yml.template ]; then
  echo -e "${YELLOW}Creating docker-compose.override.yml from template...${NC}"
  cp docker-compose.override.yml.template docker-compose.override.yml
  echo -e "${GREEN}✓ Created docker-compose.override.yml from template${NC}"
fi

# Validate environment configuration
echo -e "${YELLOW}Validating environment configuration...${NC}"

validation_errors=0

# Check required variables
required_vars=("DOMAIN" "EMAIL" "TRAEFIK_DASHBOARD_USER" "TRAEFIK_DASHBOARD_PASSWORD_HASH" \
              "OAUTH2_PROVIDER" "API_TOKEN" "JWT_SECRET" "POSTGRES_PASSWORD" "REDIS_PASSWORD")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo -e "${RED}Error: $var is not set in .env file${NC}"
    validation_errors=$((validation_errors+1))
  fi
done

# Check OAuth2 variables if provider is set
if [ "$OAUTH2_PROVIDER" != "" ] && [ "$OAUTH2_PROVIDER" != "internal" ]; then
  if [ -z "$OAUTH2_CLIENT_ID" ] || [ -z "$OAUTH2_CLIENT_SECRET" ]; then
    echo -e "${RED}Error: OAuth2 provider is set but OAUTH2_CLIENT_ID or OAUTH2_CLIENT_SECRET is missing${NC}"
    validation_errors=$((validation_errors+1))
  fi

  if [ -z "$OAUTH2_COOKIE_SECRET" ]; then
    echo -e "${RED}Error: OAUTH2_COOKIE_SECRET is required for OAuth2 authentication${NC}"
    validation_errors=$((validation_errors+1))
  fi
fi

if [ $validation_errors -eq 0 ]; then
  echo -e "${GREEN}✓ Environment configuration is valid${NC}"
else
  echo -e "${RED}Found $validation_errors validation errors. Please fix them before continuing.${NC}"
fi

echo 
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Setup completed!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo 
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit the .env file if you haven't done so already"
echo -e "2. Start the services with: make start"
echo -e "3. Check the services status with: make status"
echo -e "4. View logs with: make logs"
echo 
echo -e "${YELLOW}Your infrastructure will be available at:${NC}"
echo -e "- Traefik Dashboard: https://${TRAEFIK_DASHBOARD_SUBDOMAIN}.${DOMAIN}"
echo -e "- Protected App: https://${PROTECTED_APP_SUBDOMAIN}.${DOMAIN}"
echo -e "- Public App: https://${PUBLIC_APP_SUBDOMAIN}.${DOMAIN}"
echo -e "- API: https://${API_SUBDOMAIN}.${DOMAIN}"
echo 
echo -e "${YELLOW}For more information, refer to the README.md and docs/ directory${NC}"
echo 
