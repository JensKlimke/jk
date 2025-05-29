#!/bin/bash

# Exit on error
set -e

echo "Installing Docker and Docker Compose..."

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
echo "Verifying installation..."
docker --version
docker-compose --version

echo "Docker and Docker Compose have been successfully installed!"