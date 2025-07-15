# JK Server Infrastructure

## Server

- V-Host with static IP and DNS entry
- Ubuntu 24.04.2 LTS (GNU/Linux 6.8.0-63-generic x86_64)
- SSH root access via certificate

## Docker Setup

This project uses Docker Compose to run an Nginx reverse proxy.

### Components

- **Nginx**: Acts as a reverse proxy for web applications (to be added later)
- **Certbot**: Manages SSL certificates for domains specified by containers with VIRTUAL_HOST environment variables
- **Nginx Config Generator**: Generates Nginx configuration files based on running containers with VIRTUAL_HOST environment variables
- **InfluxDB**: Time series database for storing metrics

### Directory Structure

```
.
├── docker-compose.yml    # Docker Compose configuration
├── nginx/                # Nginx configuration files
│   ├── conf.d/           # Virtual host configurations
│   │   └── default.conf  # Default server configuration
│   └── nginx.conf        # Main Nginx configuration
```

### Usage

To start the services:

```bash
docker-compose up -d
```

To stop the services:

```bash
docker-compose down
```

To view logs:

```bash
docker-compose logs -f
```

### Nginx Configuration

The Nginx server is configured as a reverse proxy. The configuration is automatically generated based on running containers with the VIRTUAL_HOST environment variable.

### SSL Certificates

SSL certificates are automatically managed by Certbot. The certbot service scans all running containers for the VIRTUAL_HOST environment variable and obtains/renews certificates for those domains.

### Adding a New Service

To add a new service to the infrastructure:

1. Add a new service to the docker-compose.yml file
2. Set the VIRTUAL_HOST environment variable to the domain name for the service
3. Expose the port that the service listens on
4. Start the service with `docker-compose up -d`

Example:

```yaml
my-service:
  image: my-service-image
  container_name: my-service
  environment:
    VIRTUAL_HOST: "my-service.example.com"
  expose:
    - "8080"
```

The Nginx configuration will be automatically generated, and an SSL certificate will be obtained for the domain.

# TODO

- [x] Automatic config generation based on containers with VIRTUAL_HOST
- [x] Automatic SSL certificate management based on containers with VIRTUAL_HOST
- [ ] Integrations: influxdb/Grafana/mongodb
- [ ] Keycloak integration
- [ ] Split dockerfiles up into build and run sections
- [ ] Security measures (nginx conf, middleware, ...) → see SECURITY.md
- [ ] Merge services
- [ ] Export (by central log volume) and collect all log files and make them accessible 
