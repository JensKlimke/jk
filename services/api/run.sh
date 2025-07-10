#!/bin/sh

# Set default interval to 10 seconds if GENERATOR_INTERVAL is not defined
INTERVAL=${GENERATOR_INTERVAL:-10}

# Flag to control the main loop
RUNNING=true

# Handle termination signals
trap 'echo "Received termination signal. Shutting down..."; RUNNING=false' TERM INT

echo "Starting config generator with interval: ${INTERVAL} seconds"

# Run in a loop until container is stopped
while $RUNNING; do
  echo "Generating configuration..."
  node dist/index.js /app/template/service.conf.mustache /app/output/services.conf

  # Reload nginx if NGINX_SERVICE is defined
  if [ -n "$NGINX_SERVICE" ]; then
    echo "Reloading nginx service: $NGINX_SERVICE"
    docker exec nginx-reverse-proxy nginx -s reload || echo "Failed to reload nginx"
  fi

  if $RUNNING; then
    echo "Sleeping for ${INTERVAL} seconds..."
    # Sleep in small increments to respond quickly to termination signals
    # Using a while loop instead of seq for better compatibility with BusyBox/Alpine
    i=0
    while [ $i -lt $INTERVAL ] && $RUNNING; do
      sleep 1
      i=$((i+1))
    done
  fi
done

echo "Config generator stopped gracefully"
