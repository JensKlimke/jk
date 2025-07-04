# Webapp Helm Chart

This Helm chart deploys a web application with Nginx as a reverse proxy.

## Introduction

This chart deploys a simple static website served by Nginx on Kubernetes. It includes:

- A namespace for the application
- A ConfigMap for the website content
- A ConfigMap for the Nginx configuration
- A Deployment for Nginx
- A Service for Nginx
- An Ingress for external access

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- An Ingress controller installed in the cluster (e.g., nginx-ingress)

## Installing the Chart

To install the chart with the release name `webapp`:

```bash
helm install webapp ./helm/webapp
```

## Uninstalling the Chart

To uninstall/delete the `webapp` deployment:

```bash
helm uninstall webapp
```

## Configuration

The following table lists the configurable parameters of the chart and their default values.

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.domain` | Domain name for the website | `example.com` |
| `global.namespace` | Kubernetes namespace | `webapp` |
| `nginx.image` | Nginx image | `nginx:1.21` |
| `nginx.replicas` | Number of Nginx replicas | `1` |
| `nginx.service.type` | Kubernetes service type | `ClusterIP` |
| `nginx.service.port` | Kubernetes service port | `80` |
| `nginx.ingress.enabled` | Enable Ingress | `true` |
| `nginx.ingress.className` | Ingress class name | `nginx` |
| `website.enabled` | Enable website | `true` |
| `website.title` | Website title | `Welcome to DOMAIN` |
| `website.content.heading` | Website heading | `Welcome to DOMAIN` |
| `website.content.paragraphs` | Website paragraphs | See `values.yaml` |

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example:

```bash
helm install webapp ./helm/webapp --set global.domain=mydomain.com --set nginx.replicas=2
```

Alternatively, a YAML file that specifies the values for the parameters can be provided while installing the chart. For example:

```bash
helm install webapp ./helm/webapp -f values.yaml
```

## Adding More Webapps

To add more webapps:

1. Update the `values.yaml` file to include configuration for the new webapp
2. Create templates for the new webapp in the `templates` directory
3. Update the Nginx configuration to include the new webapp

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