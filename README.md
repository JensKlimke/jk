# Helm Deployment Project

This project demonstrates how to deploy a simple web application using Helm charts.

## Overview

The project includes:

- A simple static website served by Nginx
- A Helm chart for simplified deployment and management

## Deployment

For deployment using Helm, follow the instructions in [helm-deploy.md](docs/helm-deploy.md).

Using Helm provides the following benefits:
- Centralized configuration (including domain name)
- Simplified deployment and upgrades
- Easy customization
- Better management of multiple applications

## Setup

Before deploying, you need to set up a Kubernetes cluster. Follow the instructions in [setup.md](docs/setup.md) to set up a k3s cluster.

## Project Structure

```
.
├── docs/                  # Documentation
│   ├── helm-deploy.md     # Helm deployment guide
│   └── setup.md           # Cluster setup guide
└── helm/                  # Helm charts
    └── webapp/            # Web application Helm chart
        ├── Chart.yaml     # Chart metadata
        ├── README.md      # Chart documentation
        ├── templates/     # Chart templates
        └── values.yaml    # Default values
```

## License

This project is licensed under the terms of the LICENSE file included in the repository.
