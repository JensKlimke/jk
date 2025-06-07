#!/bin/sh

# Default domain is localhost if not provided via environment
DOMAIN=${DOMAIN:-localhost}

# Ensure the conf.d directory exists
mkdir -p /etc/nginx/conf.d

# Process all files in conf.d.tmpl
for file in /etc/nginx/conf.d.tmpl/*.conf /etc/nginx/conf.d.tmpl/*.incl; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "Processing $filename, replacing {{ domain }} with $DOMAIN"
    sed "s/{{ domain }}/$DOMAIN/g" "$file" > "/etc/nginx/conf.d/$filename"
  fi
done

echo "Configuration files have been processed and placed in /etc/nginx/conf.d/"

# Continue with nginx startup
exec "$@"
