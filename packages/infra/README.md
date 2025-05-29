# Infrastructure Setup

## Server Setup Guide

### Prerequisites
- Ubuntu/Debian server
- Domain name pointing to your server

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JensKlimke/jk /root/jk-server
   cd /root/jk-server
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
   # Create .env file with required variables
   cat > .env << EOF
   DOMAIN=yourdomain.com
   EMAIL=your.email@example.com
   EOF
   ```

5. **Copy configuration files**
   ```bash
   # Copy the configuration files to their respective locations
   cp packages/infra/docker-compose.yml .
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

### Services

- **nginx-proxy**: Reverse proxy with automatic SSL
- **whoami**: Test service at whoami.yourdomain.com
