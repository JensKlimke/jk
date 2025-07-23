#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Docker Infrastructure Secret Generator ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo 

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found. Creating from template...${NC}"
  if [ -f .env.template ]; then
    cp .env.template .env
    echo -e "${GREEN}Created .env file from template${NC}"
  else
    echo -e "${RED}Error: .env.template not found!${NC}"
    exit 1
  fi
fi

# Function to generate random strings
generate_random() {
  local length=$1
  local type=$2

  if [ "$type" = "hex" ]; then
    openssl rand -hex $((length/2))
  else
    # Generate base64 and make URL safe
    openssl rand -base64 $((length*3/4)) | tr '+/' '-_' | tr -d '=' | cut -c 1-$length
  fi
}

# Function to generate bcrypt hash for Traefik
generate_bcrypt_hash() {
  local password=$1
  if command -v htpasswd > /dev/null; then
    htpasswd -nbB user "$password" | cut -d ":" -f 2
  else
    # If htpasswd is not available, use Docker
    docker run --rm httpd:alpine htpasswd -nbB user "$password" | cut -d ":" -f 2
  fi
}

# Load current .env file
source .env

# Initialize an array to store the changes
declare -a changes

# Generate and update OAuth2 cookie secret if empty
if [ -z "$OAUTH2_COOKIE_SECRET" ]; then
  OAUTH2_COOKIE_SECRET=$(generate_random 32)
  sed -i.bak "s/^OAUTH2_COOKIE_SECRET=.*/OAUTH2_COOKIE_SECRET=${OAUTH2_COOKIE_SECRET}/" .env
  changes+=("OAuth2 Cookie Secret")
fi

# Generate and update API token if empty
if [ -z "$API_TOKEN" ]; then
  API_TOKEN=$(generate_random 64 "hex")
  sed -i.bak "s/^API_TOKEN=.*/API_TOKEN=${API_TOKEN}/" .env
  changes+=("API Token")
fi

# Generate and update JWT secret if empty
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(generate_random 64)
  sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
  changes+=("JWT Secret")
fi

# Generate and update PostgreSQL password if empty
if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD=$(generate_random 32)
  sed -i.bak "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" .env
  changes+=("PostgreSQL Password")
fi

# Generate and update Redis password if empty
if [ -z "$REDIS_PASSWORD" ]; then
  REDIS_PASSWORD=$(generate_random 32)
  sed -i.bak "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASSWORD}/" .env
  changes+=("Redis Password")
fi

# Generate and update Traefik dashboard password hash if empty
if [ -z "$TRAEFIK_DASHBOARD_PASSWORD_HASH" ]; then
  # Generate a random password
  TRAEFIK_DASHBOARD_PASSWORD=$(generate_random 16)
  TRAEFIK_DASHBOARD_PASSWORD_HASH=$(generate_bcrypt_hash "$TRAEFIK_DASHBOARD_PASSWORD")

  # Escape special characters for sed
  ESCAPED_HASH=$(echo "$TRAEFIK_DASHBOARD_PASSWORD_HASH" | sed 's/[&/\]/\\&/g')

  sed -i.bak "s/^TRAEFIK_DASHBOARD_PASSWORD_HASH=.*/TRAEFIK_DASHBOARD_PASSWORD_HASH=${ESCAPED_HASH}/" .env
  changes+=("Traefik Dashboard Password")
  echo -e "${YELLOW}Traefik dashboard generated password: ${TRAEFIK_DASHBOARD_PASSWORD}${NC}"
  echo -e "${YELLOW}Please save this password securely!${NC}"
fi

# Generate and update Grafana admin password if empty and monitoring enabled
if [ "$ENABLE_MONITORING" = "true" ] && [ -z "$GRAFANA_ADMIN_PASSWORD" ]; then
  GRAFANA_ADMIN_PASSWORD=$(generate_random 16)
  sed -i.bak "s/^GRAFANA_ADMIN_PASSWORD=.*/GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}/" .env
  changes+=("Grafana Admin Password")
  echo -e "${YELLOW}Grafana admin generated password: ${GRAFANA_ADMIN_PASSWORD}${NC}"
  echo -e "${YELLOW}Please save this password securely!${NC}"
fi

# Remove backup file
rm -f .env.bak

echo 

# Report what was generated
if [ ${#changes[@]} -eq 0 ]; then
  echo -e "${GREEN}No new secrets needed to be generated. All required secrets are already set.${NC}"
else
  echo -e "${GREEN}Successfully generated the following secrets:${NC}"
  for change in "${changes[@]}"; do
    echo -e "  ${BLUE}✓${NC} $change"
  done
fi

echo 
echo -e "${GREEN}Secret generation complete! Your .env file has been updated.${NC}"
echo -e "${YELLOW}Important: Keep your .env file secure and never commit it to version control.${NC}"
echo 
