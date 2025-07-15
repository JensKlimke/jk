#!/bin/sh

# Set default intervals if not defined
CONFIG_INTERVAL=${GENERATOR_INTERVAL:-10}
CERT_INTERVAL=${CERT_INTERVAL:-3600}  # Default to 1 hour for certificates

# Flag to control the main loop
RUNNING=true

# Counters for intervals
CONFIG_COUNTER=0
# Initialize CERT_COUNTER to (CERT_INTERVAL - 60) to delay first certificate processing by 60 seconds
CERT_COUNTER=$((CERT_INTERVAL - 60))

# Handle termination signals
trap 'echo "Received termination signal. Shutting down..."; RUNNING=false' TERM INT

echo "Starting service with config interval: ${CONFIG_INTERVAL}s, certificate interval: ${CERT_INTERVAL}s"

# Check default certificate on startup
echo "Checking default certificate..."
node dist/index.js cert check

# Run in a loop until container is stopped
while $RUNNING; do
  # Check if it's time to generate config
  if [ $CONFIG_COUNTER -eq 0 ]; then
    echo "Generating nginx configuration..."
    node dist/index.js config /app/template/default.conf.mustache /app/template/service.conf.mustache /app/output

    # Reload nginx if NGINX_SERVICE is defined
    if [ -n "$NGINX_SERVICE" ]; then
      echo "Reloading nginx service: $NGINX_SERVICE"
      docker exec nginx-reverse-proxy nginx -s reload || echo "Failed to reload nginx"
    fi
  fi

  # Check if it's time to process certificates
  if [ $CERT_COUNTER -eq 0 ]; then
    echo "Processing certificates..."
    node dist/index.js cert process
  fi

  # Increment counters
  CONFIG_COUNTER=$((CONFIG_COUNTER + 1))
  CERT_COUNTER=$((CERT_COUNTER + 1))

  # Reset counters if they reach the interval
  if [ $CONFIG_COUNTER -ge $CONFIG_INTERVAL ]; then
    CONFIG_COUNTER=0
  fi
  if [ $CERT_COUNTER -ge $CERT_INTERVAL ]; then
    CERT_COUNTER=0
  fi

  if $RUNNING; then
    sleep 1
  fi
done

echo "Service stopped gracefully"
