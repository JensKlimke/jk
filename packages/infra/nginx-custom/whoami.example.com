# Virtual Host Configuration for Whoami with OAuth2 Authentication
# Place this file in the vhost.d directory with the name matching your domain
# e.g., /etc/nginx/vhost.d/whoami.example.com

# Apply authentication to all locations
location / {
    # Request authentication
    auth_request /oauth2/auth;
    
    # Pass user information to the upstream service
    auth_request_set $user $upstream_http_x_auth_request_user;
    auth_request_set $email $upstream_http_x_auth_request_email;
    auth_request_set $token $upstream_http_x_auth_request_access_token;
    
    # Set headers for the upstream service
    proxy_set_header X-User $user;
    proxy_set_header X-Email $email;
    proxy_set_header X-Access-Token $token;
    
    # Standard proxy settings
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Allow access to public resources without authentication
# Uncomment and modify as needed
# location /public/ {
#     # No auth_request here, so this location is public
#     proxy_pass http://whoami/public/;
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
# }