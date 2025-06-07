#!/bin/sh

# Default domain is localhost if not provided via environment
DOMAIN=${DOMAIN:-localhost}

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

# Continue with nginx startup
exec "$@"
