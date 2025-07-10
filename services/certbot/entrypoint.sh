#!/bin/sh

# These variables must be set:
# - DOMAINS: all domains to be processed
# - EMAIL: email address of the admin

# List of domains to obtain certificates for
CERTS_PATH="/etc/letsencrypt/live"

# Function to obtain/renew certificate for a specific domain
obtain_cert() {
    local domain=$1
    local option=$2
    echo "Processing certificate for $domain..."
    certbot certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $domain $option
}

# Function to check if default certificate exists and create it if not
check_default_cert() {
    local default_cert_dir="$CERTS_PATH/default"
    local default_cert_path="$default_cert_dir/fullchain.pem"
    local default_key_path="$default_cert_dir/privkey.pem"

    # Check if default certificate exists
    if [ ! -f "$default_cert_path" ] || [ ! -f "$default_key_path" ]; then
        echo "Default certificate does not exist. Creating self-signed certificate..."

        # Create directory structure
        mkdir -p "$default_cert_dir"

        # Generate self-signed certificate with the same structure as Let's Encrypt
        openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
            -keyout "$default_key_path" \
            -out "$default_cert_path" \
            -subj "/CN=default.local" \
            -addext "subjectAltName=DNS:default.local"

        # Create chain.pem (same as fullchain.pem for self-signed)
        cp "$default_cert_path" "$default_cert_dir/chain.pem"

        # Create cert.pem (same as fullchain.pem for self-signed)
        cp "$default_cert_path" "$default_cert_dir/cert.pem"

        echo "Self-signed default certificate created successfully."
    else
        echo "Default certificate already exists."
    fi
}

# Function to clean up certificates for domains no longer in the DOMAINS list
cleanup_certificates() {
    echo "Checking for certificates to clean up..."

    # Get all certificate directories
    for cert_dir in $CERTS_PATH/*; do
        # Skip if not a directory
        [ -d "$cert_dir" ] || continue

        # Extract domain name from directory path
        domain=$(basename "$cert_dir")

        # Skip the default certificate
        if [ "$domain" = "default" ]; then
            echo "Skipping default certificate"
            continue
        fi

        # Check if domain is in the DOMAINS list
        if ! echo "$DOMAINS" | grep -q -w "$domain"; then
            echo "Certificate for $domain exists but domain is no longer in the list. Deleting..."
            certbot delete --cert-name "$domain" --non-interactive
        fi
    done
}

# Process each domain
process_domains() {
    local option=$1
    for domain in $DOMAINS; do
        local cert_path="$CERTS_PATH/$domain/fullchain.pem"

        # Check if certificate exists for this domain
        if [ ! -f "$cert_path" ]; then
            echo "Certificate for $domain does not exist. Obtaining immediately..."
            obtain_cert "$domain" "--force-renewal"
        else
            echo "Certificate for $domain already exists. Setting up renewal schedule..."
            obtain_cert "$domain" "$option"
        fi
    done
}

# Check for default certificate first
check_default_cert

# Clean up certificates for domains no longer in the list
cleanup_certificates

# Initial processing of all domains
process_domains "--keep"

# Set up the renewal schedule
trap exit TERM
while :; do

    # Sleep for 12 hours before attempting renewal
    echo "Waiting 12 hours before next certificate renewal check..."
    sleep 12h & wait $!

    # Clean up certificates for domains no longer in the list
    cleanup_certificates

    # Let certbot decide if renewal is necessary based on expiration date
    # (certificates are typically renewed when they're within 30 days of expiry)
    echo "Checking certificate renewal for all domains..."
    process_domains "--keep"

done
