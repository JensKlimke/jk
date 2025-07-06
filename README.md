# Single Page Website on k3s with Pulumi

This repository contains a minimal Pulumi setup for deploying a single-page website on a public server with k3s installed. The website is served over HTTPS using SSL/TLS certificates obtained from Let's Encrypt using Certbot.

## Quick Start

1. Ensure you have the prerequisites: k3s server, domain name, Node.js, npm, Pulumi CLI, and kubectl
2. Clone the repository and install dependencies
3. Update the domain name in the configuration
4. Deploy using Pulumi

## Documentation

Detailed documentation is available in the `docs` folder:

- [Deployment Guide](docs/deployment.md) - How to deploy the website
- [Certbot Configuration](docs/certbot.md) - How to set up SSL/TLS certificates

## License

See the [LICENSE](LICENSE) file for details.
