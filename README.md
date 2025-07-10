# JK Server Infrastructure

## Server

- V-Host with static IP and DNS entry
- Ubuntu 24.04.2 LTS (GNU/Linux 6.8.0-63-generic x86_64)
- SSH root access via certificate

## Docker Setup

This project uses Docker Compose to run an Nginx reverse proxy.

### Components

- **Nginx**: Acts as a reverse proxy for web applications (to be added later)

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

The Nginx server is configured as a reverse proxy. Currently, it serves a placeholder page, but it's ready to be configured to proxy requests to web applications that will be added later.

# TODO

- [ ] Automatic config generation instead of services.json
- [ ] Split dockerfiles up into build and run sections
- [ ] Security measures (nginx conf, middleware, ...)
- [ ] Export (by central log volume) and collect all log files and make them accessible 
