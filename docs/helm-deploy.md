# Helm Deployment Guide

This guide provides instructions for deploying the application using Helm.

## Prerequisites

- A server with k3s installed (follow the instructions in [setup.md](setup.md))
- `kubectl` configured to connect to your k3s server
- Helm 3 installed on your local machine

## Installing Helm

If you don't have Helm installed, you can install it by following the instructions at [https://helm.sh/docs/intro/install/](https://helm.sh/docs/intro/install/).

For Linux/macOS:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

For Windows, you can download the binary from the [Helm releases page](https://github.com/helm/helm/releases).

## Deployment Steps

1. **Clone this repository**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Deploy the application using Helm**

   ```bash
   helm install webapp ./helm/webapp
   ```

   This will deploy the application with the default configuration.

3. **Customize the deployment**

   You can customize the deployment by creating a values file:

   ```yaml
   # custom-values.yaml
   global:
     domain: your-domain.com
     namespace: your-namespace
   
   nginx:
     replicas: 2
   ```

   Then deploy with:

   ```bash
   helm install webapp ./helm/webapp -f custom-values.yaml
   ```

   Or you can override specific values directly:

   ```bash
   helm install webapp ./helm/webapp --set global.domain=your-domain.com --set nginx.replicas=2
   ```

4. **Verify the deployment**

   Check if the pods are running:
   ```bash
   kubectl get pods -n webapp
   ```

   Check if the service is created:
   ```bash
   kubectl get svc -n webapp
   ```

   Check if the ingress is configured:
   ```bash
   kubectl get ingress -n webapp
   ```

5. **Access the website**

   Once the deployment is complete and the ingress is configured, you should be able to access the website at:
   - http://your-domain.com
   - http://www.your-domain.com

   Note: Make sure your DNS is configured to point these domains to your server's IP address.

## Upgrading the Deployment

To upgrade the deployment after making changes:

```bash
helm upgrade webapp ./helm/webapp
```

Or with custom values:

```bash
helm upgrade webapp ./helm/webapp -f custom-values.yaml
```

## Uninstalling the Deployment

To uninstall the deployment:

```bash
helm uninstall webapp
```

## Adding More Webapps

The Helm chart is designed to be extensible. To add more webapps:

1. Update the values.yaml file to include configuration for the new webapp
2. Create templates for the new webapp in the templates directory
3. Update the nginx configuration to include the new webapp

## Troubleshooting

If you encounter issues:

1. Check the pod logs:
   ```bash
   kubectl logs -n <namespace> <pod-name>
   ```

2. Check the Helm release status:
   ```bash
   helm status webapp
   ```

3. Ensure your DNS is correctly configured to point to your server's IP address.