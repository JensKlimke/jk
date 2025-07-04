# K3s Server Setup Guide

This guide provides instructions for setting up k3s on an Ubuntu server with root access. The server has a static IP address with your domain linked to it via a DNS entry.

## Prerequisites

- Ubuntu server with root access
- Static IP address
- Domain name with DNS entry pointing to your server's IP

## Installation Steps

### 1. Update and Upgrade System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install k3s

k3s is a lightweight Kubernetes distribution perfect for edge, IoT, and development environments.

```bash
curl -sfL https://get.k3s.io | sh -s - --disable=traefik
```

This command downloads and runs the k3s installation script with traefik disabled. Traefik is the default ingress controller for K3s, but we're disabling it as we'll be using nginx as a reverse proxy instead.

### 3. Verify Installation

Check if k3s service is running:

```bash
sudo systemctl status k3s
```

Verify that Kubernetes nodes are available:

```bash
sudo k3s kubectl get nodes
```

### 4. Access Kubernetes Configuration

The k3s configuration file is located at:

```bash
/etc/rancher/k3s/k3s.yaml
```

You can copy this file to use with kubectl on your local machine:

```bash
sudo cat /etc/rancher/k3s/k3s.yaml
```

Remember to replace the server address in the configuration file with your domain name when using it remotely.

## Next Steps

Future updates to this repository will include:
- Web application configurations
- Additional Kubernetes resources
- Deployment guides

Stay tuned for more configurations and setup instructions.
