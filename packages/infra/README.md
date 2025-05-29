# Infrastructure Setup

## Server Setup Guide

### Prerequisites
- Ubuntu/Debian server
- Domain name pointing to your server

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JensKlimke/jk /root/jk
   cd /root/jk
   ```

2. **Run the setup script to install Docker and Docker Compose**
   ```bash
   # Make the script executable
   chmod +x packages/infra/setup.sh

   # Run the setup script
   ./packages/infra/setup.sh
   ```

3. **Create Docker network**
   ```bash
   docker network create jk-net
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file with required variables in the infra directory
   cat > packages/infra/.env << EOF
   DOMAIN=yourdomain.com
   EMAIL=your.email@example.com

   # OAuth2 Proxy configuration
   OAUTH2_PROXY_CLIENT_ID=your_github_client_id
   OAUTH2_PROXY_CLIENT_SECRET=your_github_client_secret
   OAUTH2_PROXY_COOKIE_SECRET=random_32_character_string
   EOF
   ```

   To generate a random cookie secret:
   ```bash
   openssl rand -base64 32 | tr -- '+/' '-_'
   ```

5. **Copy service configuration file**
   ```bash
   # Copy the service configuration file to systemd
   sudo cp packages/infra/docker-compose-app.service /etc/systemd/system/
   ```

6. **Enable and start the service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable docker-compose-app
   sudo systemctl start docker-compose-app
   ```

7. **Verify setup**
   ```bash
   # Check if services are running
   docker ps

   # Test the setup by visiting:
   # - https://whoami.yourdomain.com
   ```

### Environment Variables

- **DOMAIN**: Your domain name (e.g., example.com). Used for configuring virtual hosts for services.
- **EMAIL**: Your email address for SSL certificate notifications from Let's Encrypt.
- **OAUTH2_PROXY_CLIENT_ID**: GitHub OAuth App client ID.
- **OAUTH2_PROXY_CLIENT_SECRET**: GitHub OAuth App client secret.
- **OAUTH2_PROXY_COOKIE_SECRET**: Random string used to encrypt cookies.

### GitHub OAuth Setup

To set up GitHub authentication:

1. **Register a new OAuth application on GitHub**:
   - Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
   - Set the Application name (e.g., "My Server Auth")
   - Set the Homepage URL to your domain (e.g., https://example.com)
   - Set the Authorization callback URL to https://auth.example.com/oauth2/callback
   - Click "Register application"

2. **Get the Client ID and Client Secret**:
   - After registration, GitHub will provide a Client ID
   - Generate a new Client Secret
   - Add these values to your .env file:
     ```
     OAUTH2_PROXY_CLIENT_ID=your_github_client_id
     OAUTH2_PROXY_CLIENT_SECRET=your_github_client_secret
     ```

### Services

- **nginx-proxy**: Reverse proxy with automatic SSL
- **oauth2-proxy**: Authentication service
- **whoami**: Test service at whoami.yourdomain.com (protected with authentication)

### Setting Up a New Service with Authentication

To add a new service with authentication protection:

1. **Add the service to docker-compose.yml**:
   ```yaml
   # Example service with authentication
   myservice:
     image: myservice/image
     container_name: myservice
     environment:
       - VIRTUAL_HOST=myservice.${DOMAIN}
       - LETSENCRYPT_HOST=myservice.${DOMAIN}
       # Add authentication configuration
       - NGINX_PROXY_CUSTOM_VHOST_CONFIG=location / { auth_request /oauth2/auth; error_page 401 = /oauth2/sign_in; auth_request_set $$user $$upstream_http_x_auth_request_user; auth_request_set $$email $$upstream_http_x_auth_request_email; proxy_set_header X-User $$user; proxy_set_header X-Email $$email; }
     restart: always
     networks:
       - jk-net
   ```

2. **Alternatively, create a custom vhost configuration file**:

   Create a file in `nginx-custom` directory named after your domain:
   ```bash
   # Create directory if it doesn't exist
   mkdir -p nginx-custom

   # Create vhost configuration file
   cat > nginx-custom/myservice.example.com << EOF
   # Apply authentication to all locations
   location / {
       # Request authentication
       auth_request /oauth2/auth;

       # Pass user information to the upstream service
       auth_request_set \$user \$upstream_http_x_auth_request_user;
       auth_request_set \$email \$upstream_http_x_auth_request_email;

       # Set headers for the upstream service
       proxy_set_header X-User \$user;
       proxy_set_header X-Email \$email;
   }
   EOF
   ```

3. **Restart the services**:
   ```bash
   sudo systemctl restart docker-compose-app
   ```

4. **Access your service**:
   - Visit https://myservice.yourdomain.com
   - You will be redirected to GitHub for authentication
   - After authentication, you will be redirected back to your service
   - Your service will receive the user information in the X-User and X-Email headers

### Authentication Architecture

This infrastructure uses a robust authentication system based on OAuth2 Proxy integrated with nginx-proxy.

#### Architecture Overview

```
                                  ┌─────────────────┐
                                  │                 │
                                  │  GitHub OAuth   │
                                  │                 │
                                  └────────┬────────┘
                                           │
                                           │ OAuth2 Flow
                                           │
                                           ▼
┌─────────────┐     ┌─────────────┐    ┌────────────────┐     ┌─────────────────┐
│             │     │             │    │                │     │                 │
│   User      │────▶│  nginx-proxy│───▶│  OAuth2 Proxy  │────▶│ Protected       │
│             │     │             │    │                │     │ Services        │
└─────────────┘     └─────────────┘    └────────────────┘     └─────────────────┘
```

#### How It Works

1. **Request Flow**:
   - User attempts to access a protected service (e.g., whoami.example.com)
   - nginx-proxy receives the request and applies the auth_request directive
   - The auth_request directive forwards the authentication check to OAuth2 Proxy
   - If the user is not authenticated, they are redirected to GitHub
   - After GitHub authentication, the user is redirected back to the original service
   - User information is passed to the service via HTTP headers

2. **Components**:
   - **nginx-proxy**: Handles routing and SSL termination
   - **OAuth2 Proxy**: Manages authentication with GitHub
   - **GitHub OAuth**: External identity provider

3. **Security Features**:
   - All communication is encrypted with HTTPS
   - Cookies are secure and HTTP-only
   - Authentication state is maintained via encrypted cookies
   - User information is passed securely to backend services

4. **Customization Options**:
   - Restrict access by email domain (--email-domain flag)
   - Restrict access by GitHub organization (--github-org flag)
   - Configure public paths that bypass authentication (--skip-auth-route flag)
   - Adjust cookie settings for session duration
