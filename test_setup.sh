#!/bin/bash

echo "=== Traefik Docker Setup Diagnostic Script ==="
echo "Date: $(date)"
echo

# Check if traefik network exists
echo "1. Checking if traefik network exists..."
if docker network ls | grep -q traefik; then
    echo "✓ traefik network exists"
    docker network inspect traefik --format '{{.Name}}: {{.Driver}} ({{.Scope}})'
else
    echo "✗ traefik network does not exist - creating it..."
    docker network create traefik
    echo "✓ traefik network created"
fi
echo

# Check running containers
echo "2. Checking running containers..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Networks}}"
echo

# Check if containers are on traefik network
echo "3. Checking containers on traefik network..."
docker network inspect traefik --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}' 2>/dev/null || echo "No containers found on traefik network"
echo

# Check Traefik logs for oauth2-proxy errors
echo "4. Checking recent Traefik logs for oauth2-proxy errors..."
if docker ps -q -f name=traefik > /dev/null 2>&1; then
    docker logs traefik --tail 20 2>&1 | grep -i oauth2-proxy || echo "No oauth2-proxy related errors found in recent logs"
else
    echo "Traefik container not running"
fi
echo

# Test network connectivity
echo "5. Testing network connectivity..."
if docker ps -q -f name=traefik > /dev/null 2>&1 && docker ps -q -f name=oauth2-proxy > /dev/null 2>&1; then
    echo "Both containers are running - testing connectivity..."
    docker exec traefik ping -c 2 oauth2-proxy 2>/dev/null && echo "✓ Traefik can reach oauth2-proxy" || echo "✗ Traefik cannot reach oauth2-proxy"
else
    echo "One or both containers are not running"
fi
echo

# Verify the fix
echo "6. Verifying Traefik configuration..."
if [ -f "traefik.yml" ]; then
    if grep -q "network: traefik" traefik.yml; then
        echo "✗ traefik.yml still contains 'network: traefik' - this may cause service discovery issues"
    else
        echo "✓ traefik.yml Docker provider configuration looks correct (no network constraint)"
    fi
else
    echo "✗ traefik.yml not found"
fi
echo

echo "=== Diagnostic complete ==="
echo
echo "SOLUTION SUMMARY:"
echo "The issue was caused by the 'network: traefik' specification in the Docker provider"
echo "configuration in traefik.yml. This constraint prevented Traefik from properly"
echo "discovering the oauth2-proxy service IP address."
echo
echo "CHANGES MADE:"
echo "- Removed 'network: traefik' from providers.docker section in traefik.yml"
echo
echo "TO APPLY THE FIX:"
echo "1. Ensure the traefik network exists: docker network create traefik"
echo "2. Restart the services: docker-compose down && docker-compose up -d"
echo "3. Check Traefik logs: docker logs traefik"