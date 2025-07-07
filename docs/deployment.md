# Deployment Guide for Single Page Website on k3s with Pulumi

This guide explains how to deploy a single-page website on a public server with k3s installed using Pulumi.

## Prerequisites

- A server with k3s installed
- A domain name pointing to your server's IP address
- Node.js and npm installed on your local machine
- Pulumi CLI installed on your local machine
- kubectl configured to access your k3s cluster

## Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Pulumi to use your k3s cluster:
   - Ensure your kubeconfig is properly set up to connect to your k3s cluster
   - By default, the Pulumi program uses the "default" context from your kubeconfig

## Deployment

1. Initialize a new Pulumi stack:
   ```bash
   pulumi stack init dev
   ```

2. Deploy the website:
   ```bash
   pulumi up
   ```

3. After deployment, Pulumi will output the URL of your website. You can also get it with:
   ```bash
   pulumi stack output url
   ```

## How It Works

This setup creates the following Kubernetes resources:

1. A namespace called "website" to organize all resources
2. A ConfigMap containing the HTML content for the single-page website
3. A Deployment running a nginx container that serves the HTML content
4. A Service that exposes the nginx deployment
5. An Ingress that routes traffic from your domain to the service and handles TLS termination

The nginx container is configured with resource limits to ensure efficient resource usage.

## SSL/TLS Configuration

The Ingress is configured to use TLS certificates for HTTPS. The Pulumi deployment automatically installs cert-manager in your cluster for automatic certificate management and creates a ClusterIssuer for Let's Encrypt.

## Customization

- To modify the website content, update the HTML in the ConfigMap in `index.ts`
- To change resource limits, modify the values in the Deployment specification
- For additional configuration, refer to the Pulumi Kubernetes documentation

## Cleanup

To remove all deployed resources:

```bash
pulumi destroy
```

## Troubleshooting

- If the website is not accessible, check that your domain is correctly pointing to your server's IP address
- Verify that Traefik (the default ingress controller in k3s) is properly configured
- Check the logs of the nginx pod for any errors:
  ```bash
  kubectl logs -n website -l app=website
  ```
