#!/bin/sh

# Default domain is localhost if not provided via environment
DOMAIN=${DOMAIN:-localhost}

# Function to process templates
process_templates() {
  echo "Processing templates at $(date)"

  # Ensure the conf.d directory exists
  mkdir -p /etc/nginx/conf.d

  # Process all files in conf.d.tmpl
  for file in /etc/nginx/conf.d.tmpl/*.conf /etc/nginx/conf.d.tmpl/*.incl; do
    if [ -f "$file" ]; then
      filename=$(basename "$file")

      # Check if this is a secure config file (.sec.conf)
      if [[ "$filename" == *.sec.conf ]]; then
        # Extract server_name from the file
        server_name=$(grep "server_name" "$file" | head -1 | sed -E 's/.*server_name[[:space:]]+([^;]+);.*/\1/' | sed "s/{{ domain }}/$DOMAIN/g")

        # Check if this is a .sec.conf file and skip it if oauth2-proxy is not running
        echo "Checking if oauth2-proxy service is running for $filename..."
        if ! docker ps --format '{{.Names}}' | grep -q "oauth2-proxy"; then
          echo "oauth2-proxy service is not running, skipping $filename"
          continue
        fi

        # Extract certificate paths and replace domain placeholder
        cert_path=$(grep "ssl_certificate " "$file" | head -1 | sed -E 's/.*ssl_certificate[[:space:]]+([^;]+);.*/\1/' | sed "s/{{ domain }}/$DOMAIN/g")
        key_path=$(grep "ssl_certificate_key" "$file" | head -1 | sed -E 's/.*ssl_certificate_key[[:space:]]+([^;]+);.*/\1/' | sed "s/{{ domain }}/$DOMAIN/g")

        echo "Checking certificate files for $server_name:"
        echo "  - Certificate: $cert_path"
        echo "  - Key: $key_path"

        # Check if both certificate files exist
        if [ -f "$cert_path" ] && [ -f "$key_path" ]; then
          echo "Certificate files found, processing $filename"
          sed "s/{{ domain }}/$DOMAIN/g" "$file" > "/etc/nginx/conf.d/$filename"
        else
          echo "Certificate files not found for $server_name, skipping $filename"
        fi
      else
        # Process regular config files normally
        echo "Processing $filename, replacing {{ domain }} with $DOMAIN"
        sed "s/{{ domain }}/$DOMAIN/g" "$file" > "/etc/nginx/conf.d/$filename"
      fi
    fi
  done

  echo "Configuration files have been processed and placed in /etc/nginx/conf.d/"
}

# Function to restart nginx
restart_nginx() {
  echo "Attempting to restart nginx container..."

  # Use docker command to restart the nginx-proxy container
  if docker restart nginx-proxy; then
    echo "Nginx container restart initiated"

    # Wait for nginx to be ready after restart
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
      attempt=$((attempt + 1))

      # Check if nginx-proxy container is running
      if docker ps --format '{{.Names}}' | grep -q "nginx-proxy"; then
        # Check if nginx is ready to accept connections
        if docker exec nginx-proxy nginx -t > /dev/null 2>&1; then
          echo "Nginx container restarted successfully and configuration is valid"
          return 0
        fi
      fi

      echo "Waiting for nginx to be ready after restart (attempt $attempt/$max_attempts)..."
      sleep 1
    done

    echo "Nginx did not become ready after restart"
    return 1
  else
    echo "Failed to restart nginx container"
    return 1
  fi
}

# Function to wait for nginx to start
wait_for_nginx() {
  echo "Waiting for nginx to be fully started..."
  max_attempts=60
  attempt=0

  while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))

    # Check if nginx-proxy container is running
    if docker ps --format '{{.Names}}' | grep -q "nginx-proxy"; then
      # Check if nginx is ready to accept connections
      if docker exec nginx-proxy nginx -t > /dev/null 2>&1; then
        echo "Nginx is running and configuration is valid"
        return 0
      fi
    fi

    echo "Waiting for nginx to start (attempt $attempt/$max_attempts)..."
    sleep 1
  done

  echo "Nginx did not start after $max_attempts attempts"
  return 1
}

# Main execution

# Wait for nginx to start
echo "Starting template processor service..."
wait_for_nginx

# Initial processing
echo "Performing initial template processing..."
process_templates

# Restart nginx
restart_nginx

# Keep the container running and monitor for changes
echo "Template processor completed initial run. Monitoring for changes..."

# Monitor for changes every 10 seconds
while true; do
  sleep 10

  # Check if nginx-proxy container is running
  if docker ps --format '{{.Names}}' | grep -q "nginx-proxy"; then
    # Check if any template files have changed or if processed files don't exist
    if [ ! -d "/etc/nginx/conf.d" ] || [ -z "$(ls -A /etc/nginx/conf.d)" ] || [ -n "$(find /etc/nginx/conf.d.tmpl -type f -newer /etc/nginx/conf.d/)" ]; then
      echo "Template files have changed or processed files don't exist. Processing..."
      process_templates
      restart_nginx
    fi
  else
    echo "Nginx is not running. Waiting..."
    wait_for_nginx
  fi
done
