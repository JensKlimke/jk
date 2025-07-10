#!/bin/sh

# Configuration constants
CERTS_PATH="/etc/letsencrypt/live"
REMOVED_DOMAINS_FILE="/tmp/removed_domains.txt"
WEBROOT_PATH="/var/www/certbot"
DEFAULT_DOMAIN="default"
DEFAULT_CERT_CN="default.local"
RENEWAL_INTERVAL_SECONDS=$((12 * 60 * 60))  # 12 hours in seconds
CLEANUP_INTERVAL_SECONDS=$((24 * 60 * 60))  # 24 hours in seconds

# Validate required environment variables
if [ -z "$EMAIL" ]; then
    echo "ERROR: EMAIL environment variable is not set. Cannot proceed with certificate operations."
    exit 1
fi

# Initialize the removed domains file
touch "$REMOVED_DOMAINS_FILE"

# Function to get domains from containers with VIRTUAL_HOST environment variable
get_domains_from_containers() {
    local domain_list=""
    local containers
    local virtual_host

    containers=$(docker ps --format "{{.Names}}")

    for container in $containers; do
        virtual_host=$(docker inspect --format '{{range .Config.Env}}{{if eq (index (split . "=") 0) "VIRTUAL_HOST"}}{{index (split . "=") 1}}{{end}}{{end}}' "$container")

        if [ -n "$virtual_host" ]; then
            if [ -z "$domain_list" ]; then
                domain_list="$virtual_host"
            else
                domain_list="$domain_list $virtual_host"
            fi
        fi
    done

    DOMAINS="$domain_list"
}

# Function to obtain/renew certificate for a specific domain
obtain_cert() {
    local domain="$1"
    local force_renewal="$2"
    local cert_dir="$CERTS_PATH/$domain"
    local cert_path="$cert_dir/fullchain.pem"
    local key_path="$cert_dir/privkey.pem"

    echo "Processing certificate for $domain..."

    # Check if domain is localhost or contains localhost
    if echo "$domain" | grep -q "localhost"; then
        echo "Domain $domain contains 'localhost'. Creating self-signed certificate..."

        mkdir -p "$cert_dir"

        # Only create new certificate if it doesn't exist or force renewal is true
        if [ ! -f "$cert_path" ] || [ "$force_renewal" = "true" ]; then
            openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
                -keyout "$key_path" \
                -out "$cert_path" \
                -subj "/CN=$domain" \
                -addext "subjectAltName=DNS:$domain"

            cp "$cert_path" "$cert_dir/chain.pem"
            cp "$cert_path" "$cert_dir/cert.pem"

            echo "Self-signed certificate for $domain created successfully."
        else
            echo "Self-signed certificate for $domain already exists."
        fi
    else
        # For non-localhost domains, use certbot as before
        local certbot_cmd="certbot certonly --webroot --webroot-path=$WEBROOT_PATH --email $EMAIL --agree-tos --no-eff-email -d $domain"

        if [ "$force_renewal" = "true" ]; then
            echo "Forcing renewal for $domain..."
            $certbot_cmd --force-renewal || echo "WARNING: Certificate operation for $domain failed"
        else
            echo "Standard renewal check for $domain..."
            $certbot_cmd --keep || echo "WARNING: Certificate operation for $domain failed"
        fi
    fi
}

# Function to check if default certificate exists and create it if not
check_default_cert() {
    local default_cert_dir="$CERTS_PATH/$DEFAULT_DOMAIN"
    local default_cert_path="$default_cert_dir/fullchain.pem"
    local default_key_path="$default_cert_dir/privkey.pem"

    if [ ! -f "$default_cert_path" ] || [ ! -f "$default_key_path" ]; then
        echo "Default certificate does not exist. Creating self-signed certificate..."

        mkdir -p "$default_cert_dir"

        openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
            -keyout "$default_key_path" \
            -out "$default_cert_path" \
            -subj "/CN=$DEFAULT_CERT_CN" \
            -addext "subjectAltName=DNS:$DEFAULT_CERT_CN"

        cp "$default_cert_path" "$default_cert_dir/chain.pem"
        cp "$default_cert_path" "$default_cert_dir/cert.pem"

        echo "Self-signed default certificate created successfully."
    else
        echo "Default certificate already exists."
    fi
}

# Function to update the removed domains file
update_removed_domains_file() {
    local domain="$1"
    local action="$2"
    local current_time

    if [ "$action" = "add" ]; then
        current_time=$(date +%s)
        echo "Domain $domain is no longer in the list. Tracking for removal..."
        echo "$domain:$current_time" >> "$REMOVED_DOMAINS_FILE"
    elif [ "$action" = "remove" ]; then
        echo "Domain $domain is back in the list. Removing from tracking..."
        grep -v "^$domain:" "$REMOVED_DOMAINS_FILE" > "${REMOVED_DOMAINS_FILE}.tmp"
        mv "${REMOVED_DOMAINS_FILE}.tmp" "$REMOVED_DOMAINS_FILE"
    fi
}

# Function to track domains that are no longer in the DOMAINS list
track_removed_domains() {
    echo "Tracking domains that are no longer in the list..."
    local domain

    for cert_dir in "$CERTS_PATH"/*; do
        [ -d "$cert_dir" ] || continue

        domain=$(basename "$cert_dir")

        if [ "$domain" = "$DEFAULT_DOMAIN" ]; then
            continue
        fi

        if ! echo "$DOMAINS" | grep -q -w "$domain"; then
            if ! grep -q "^$domain:" "$REMOVED_DOMAINS_FILE"; then
                update_removed_domains_file "$domain" "add"
            fi
        else
            if grep -q "^$domain:" "$REMOVED_DOMAINS_FILE"; then
                update_removed_domains_file "$domain" "remove"
            fi
        fi
    done
}

# Function to clean up certificates for domains that have been missing for at least 24 hours
cleanup_certificates() {
    echo "Checking for certificates to clean up..."
    local current_time=$(date +%s)
    local domain
    local timestamp
    local time_diff
    local hours_left
    local cert_dir

    while IFS=: read -r domain timestamp; do
        [ -z "$domain" ] && continue

        time_diff=$((current_time - timestamp))
        cert_dir="$CERTS_PATH/$domain"

        if [ "$time_diff" -ge "$CLEANUP_INTERVAL_SECONDS" ]; then
            echo "Certificate for $domain has been missing for at least 24 hours. Deleting..."

            # Check if domain is localhost or contains localhost
            if echo "$domain" | grep -q "localhost"; then
                echo "Removing self-signed certificate for $domain..."
                rm -rf "$cert_dir"
            else
                # For non-localhost domains, use certbot
                certbot delete --cert-name "$domain" --non-interactive
            fi

            update_removed_domains_file "$domain" "remove"
        else
            hours_left=$(( (CLEANUP_INTERVAL_SECONDS - time_diff) / 3600 ))
            echo "Certificate for $domain will be deleted in approximately $hours_left hours."
        fi
    done < "$REMOVED_DOMAINS_FILE"
}

# Function to process each domain for certificate operations
process_domains() {
    local domain
    local cert_path

    for domain in $DOMAINS; do
        cert_path="$CERTS_PATH/$domain/fullchain.pem"

        if [ ! -f "$cert_path" ]; then
            echo "Certificate for $domain does not exist. Obtaining immediately..."
            obtain_cert "$domain" "true"
        else
            echo "Certificate for $domain already exists. Setting up renewal schedule..."
            obtain_cert "$domain" "false"
        fi
    done
}

# Function to handle certificate renewal (every 12 hours)
certificate_renewal_check() {
    local current_time=$(date +%s)

    if [ $((current_time - last_renewal_check)) -ge "$RENEWAL_INTERVAL_SECONDS" ]; then
        echo "Performing certificate renewal check..."
        echo "Checking certificate renewal for all domains..."
        process_domains
        last_renewal_check=$(date +%s)
    fi
}

# Function to handle certificate cleanup (every 24 hours)
certificate_cleanup_check() {
    local current_time=$(date +%s)

    if [ $((current_time - last_cleanup_check)) -ge "$CLEANUP_INTERVAL_SECONDS" ]; then
        echo "Performing certificate cleanup check..."
        cleanup_certificates
        last_cleanup_check=$(date +%s)
    fi
}

# Initialize the system
check_default_cert
get_domains_from_containers
process_domains

# Initialize timestamps for interval checks
last_renewal_check=$(date +%s)
last_cleanup_check=$(date +%s)

# Set up signal handling
trap exit TERM

# Main loop information
echo "Starting main loop with different intervals for each process:"
echo "- Domain list checking: every second"
echo "- Certificate renewal checking: every 12 hours"
echo "- Certificate cleanup: every 24 hours"

echo "Starting up with domains:"
echo $DOMAINS

# Main loop
while :; do
    previous_domains="$DOMAINS"
    get_domains_from_containers

    if [ "$previous_domains" != "$DOMAINS" ]; then
        echo "Domain list has changed. Processing new domains immediately..."
        echo "Domain list:"
        echo $DOMAINS

        process_domains
        track_removed_domains
    fi

    certificate_renewal_check
    certificate_cleanup_check

    sleep 1
done
