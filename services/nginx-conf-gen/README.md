# Nginx Configuration Generator

A TypeScript utility for generating Nginx configuration files from Mustache templates and JSON data.

## Docker Integration

This utility is designed to be run as a Docker container that generates Nginx configuration files from templates and JSON data.

### Using with Docker

The included Dockerfile builds an image that:
1. Installs dependencies and builds the TypeScript code
2. Sets up directories for templates, input JSON, and output configuration
3. Runs the generator using the provided run.sh script

```bash
# Build the Docker image
docker build -t nginx-conf-gen .

# Run the container
docker run -v /path/to/template.mustache:/app/template/service.conf.mustache:ro \
           -v /path/to/services.json:/app/services.json:ro \
           -v /path/to/output:/app/output \
           nginx-conf-gen
```

### Docker Compose Integration

In a docker-compose.yml file, you can integrate this service as follows:

```yaml
services:
  nginx-conf-gen:
    build:
      context: ./services/nginx-conf-gen
    volumes:
      - ./nginx/tmpl/service.conf.mustache:/app/template/service.conf.mustache:ro
      - ./services.json:/app/services.json:ro
      - ./nginx/conf.d:/app/output
    restart: "no"

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - nginx-conf-gen
```

## Local Development

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Usage

```bash
# Generate a configuration file
node dist/index.js <template-path> <json-path> <output-path>
```

If no output path is provided, the generated configuration will be printed to stdout.

## Template Format

The template uses Mustache syntax for variable substitution and conditional rendering:

```mustache
server {
    listen 80;
    server_name {{host}};

    {{#ssl}}
    # SSL configuration
    ssl_certificate {{cert_file}};
    ssl_certificate_key {{key_file}};
    {{/ssl}}

    location / {
        proxy_pass http://{{service}}:{{port}}/;
    }
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
