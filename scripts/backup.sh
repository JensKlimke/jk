#!/bin/bash

set -e

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Docker Infrastructure Backup Script   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo 

# Load environment variables
if [ -f .env ]; then
  source .env
else
  echo -e "${RED}Error: .env file not found!${NC}"
  exit 1
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup PostgreSQL database
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
if docker-compose ps -q postgres > /dev/null 2>&1; then
  docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"
  echo -e "${GREEN}PostgreSQL backup created: ${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz${NC}"
else
  echo -e "${RED}PostgreSQL container is not running, skipping database backup${NC}"
fi

# Backup Redis data (if needed)
echo -e "${YELLOW}Backing up Redis data...${NC}"
if docker-compose ps -q redis > /dev/null 2>&1; then
  # Trigger Redis to create an RDB snapshot
  docker-compose exec -T redis redis-cli -a "$REDIS_PASSWORD" SAVE

  # Create a temporary directory for Redis backup
  TEMP_DIR=$(mktemp -d)

  # Copy the dump.rdb file from the Redis container
  docker cp $(docker-compose ps -q redis):/data/dump.rdb "$TEMP_DIR/dump.rdb"

  # Compress the Redis dump
  tar -czf "$BACKUP_DIR/redis_${TIMESTAMP}.tar.gz" -C "$TEMP_DIR" dump.rdb

  # Clean up temporary directory
  rm -rf "$TEMP_DIR"

  echo -e "${GREEN}Redis backup created: ${BACKUP_DIR}/redis_${TIMESTAMP}.tar.gz${NC}"
else
  echo -e "${RED}Redis container is not running, skipping Redis backup${NC}"
fi

# Backup environment configuration
echo -e "${YELLOW}Backing up environment configuration...${NC}"
cp .env "$BACKUP_DIR/env_${TIMESTAMP}.backup"
echo -e "${GREEN}Environment backup created: ${BACKUP_DIR}/env_${TIMESTAMP}.backup${NC}"

# Backup Traefik certificates
echo -e "${YELLOW}Backing up Traefik certificates...${NC}"
if [ -d "./certificates" ]; then
  tar -czf "$BACKUP_DIR/certificates_${TIMESTAMP}.tar.gz" -C "./certificates" .
  echo -e "${GREEN}Certificates backup created: ${BACKUP_DIR}/certificates_${TIMESTAMP}.tar.gz${NC}"
else
  echo -e "${YELLOW}No certificates directory found, skipping certificates backup${NC}"
fi

# Create a manifest file with backup information
MANIFEST_FILE="$BACKUP_DIR/backup_${TIMESTAMP}_manifest.txt"
echo "Backup created at: $(date)" > "$MANIFEST_FILE"
echo "Domain: $DOMAIN" >> "$MANIFEST_FILE"
echo "PostgreSQL Database: $POSTGRES_DB" >> "$MANIFEST_FILE"
echo "Files:" >> "$MANIFEST_FILE"
find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f | sort >> "$MANIFEST_FILE"

echo 
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}Backup files stored in: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}Manifest file: ${MANIFEST_FILE}${NC}"
echo 
echo -e "${YELLOW}Remember to store these backups in a secure, off-site location.${NC}"
echo 
