#!/bin/sh

# Set default interval to 10 seconds if GENERATOR_INTERVAL is not defined
INTERVAL=${GENERATOR_INTERVAL:-10}

echo "Starting config generator with interval: ${INTERVAL} seconds"

# Run in a loop until container is stopped
while true; do
  echo "Generating configuration..."
  node dist/index.js /app/template/service.conf.mustache /app/output/services.conf
  echo "Sleeping for ${INTERVAL} seconds..."
  sleep ${INTERVAL}
done
