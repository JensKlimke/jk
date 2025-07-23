#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Docker Infrastructure Update Script   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo 

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}Error: docker-compose is not installed!${NC}"
  exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found!${NC}"
  exit 1
fi

# Create backup before updating
echo -e "${YELLOW}Creating backup before update...${NC}"
if [ -f ./scripts/backup.sh ]; then
  ./scripts/backup.sh
else
  echo -e "${RED}Warning: backup script not found, proceeding without backup${NC}"
fi

# Pull latest images
echo -e "${YELLOW}Pulling latest Docker images...${NC}"
docker-compose pull

# Rebuild any custom images
echo -e "${YELLOW}Rebuilding custom services...${NC}"
docker-compose build --pull api-service

# Restart services with zero downtime where possible
echo -e "${YELLOW}Restarting services...${NC}"

# First restart database services
echo -e "${BLUE}Restarting database services...${NC}"
docker-compose up -d --no-deps postgres redis

# Then restart API and other backend services
echo -e "${BLUE}Restarting API service...${NC}"
docker-compose up -d --no-deps api-service

# Wait for API to be healthy
echo -e "${BLUE}Waiting for API service to be healthy...${NC}"
attempts=0
max_attempts=10
until $(curl --output /dev/null --silent --fail http://localhost:3000/health) || [ $attempts -eq $max_attempts ]; do
  attempts=$((attempts+1))
  echo -e "${YELLOW}Waiting for API to be ready... ($attempts/$max_attempts)${NC}"
  sleep 5
done

if [ $attempts -eq $max_attempts ]; then
  echo -e "${YELLOW}Warning: API service health check timed out, but continuing with update${NC}"
fi

# Finally restart frontend services
echo -e "${BLUE}Restarting frontend services...${NC}"
docker-compose up -d --no-deps protected-app public-app

# Restart Traefik last
echo -e "${BLUE}Restarting Traefik...${NC}"
docker-compose up -d --no-deps traefik

# Check for unused resources and clean up
echo -e "${YELLOW}Cleaning up unused resources...${NC}"
docker system prune -f --filter "label=com.docker.compose.project"

# Verify all services are running
echo -e "${YELLOW}Verifying services...${NC}"
docker-compose ps

echo 
echo -e "${GREEN}Update completed successfully!${NC}"
echo -e "${YELLOW}Remember to check the logs for any errors:${NC} docker-compose logs"
echo 
