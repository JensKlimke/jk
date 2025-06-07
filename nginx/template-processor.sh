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

# Function to reload nginx configuration
reload_nginx() {
  echo "Attempting to reload nginx configuration..."
  nginx_pid=$(pgrep -f "nginx: master")

  if [ -n "$nginx_pid" ]; then
    # Send SIGHUP to nginx to reload configuration
    if kill -0 $nginx_pid 2>/dev/null; then
      echo "Sending SIGHUP to nginx (PID: $nginx_pid)..."
      kill -HUP $nginx_pid

      # Verify reload was successful
      sleep 2
      if kill -0 $nginx_pid 2>/dev/null; then
        echo "Nginx configuration reload successful"
        return 0
      else
        echo "Nginx process no longer exists after reload attempt"
        return 1
      fi
    else
      echo "Nginx process exists but cannot send signal"
      return 1
    fi
  else
    echo "Nginx master process not found"
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

    if pgrep -f "nginx: master" > /dev/null; then
      echo "Nginx is running"
      return 0
    else
      echo "Waiting for nginx to start (attempt $attempt/$max_attempts)..."
      sleep 1
    fi
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

# Reload nginx configuration
reload_nginx

# Keep the container running and monitor for changes
echo "Template processor completed initial run. Monitoring for changes..."

# Monitor for changes every 10 seconds
while true; do
  sleep 10

  # Check if nginx is running
  if pgrep -f "nginx: master" > /dev/null; then
    # Check if any template files have changed
    if [ -n "$(find /etc/nginx/conf.d.tmpl -type f -newer /etc/nginx/conf.d/)" ]; then
      echo "Template files have changed. Reprocessing..."
      process_templates
      reload_nginx
    fi
  else
    echo "Nginx is not running. Waiting..."
    wait_for_nginx
  fi
done
