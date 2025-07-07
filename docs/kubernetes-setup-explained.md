# Kubernetes Setup Explained in Detail

This document provides a comprehensive explanation of the Kubernetes setup used in this project. It's designed for users who are new to Kubernetes and need to understand how all the components work together, with special attention to cert-manager.

## Table of Contents

1. [Kubernetes Basics](#kubernetes-basics)
2. [Our Kubernetes Architecture](#our-kubernetes-architecture)
3. [K3s: Lightweight Kubernetes](#k3s-lightweight-kubernetes)
4. [Cert-Manager Explained](#cert-manager-explained)
5. [Components in Our Setup](#components-in-our-setup)
6. [How Everything Works Together](#how-everything-works-together)
7. [Troubleshooting](#troubleshooting)

## Kubernetes Basics

Kubernetes (often abbreviated as K8s) is an open-source platform for automating deployment, scaling, and management of containerized applications. Here are the fundamental concepts:

### Core Concepts

- **Containers**: Lightweight, standalone executable packages that include everything needed to run an application
- **Pods**: The smallest deployable units in Kubernetes that can contain one or more containers
- **Nodes**: Physical or virtual machines that run your containers
- **Cluster**: A set of nodes that run containerized applications

### Key Resources

- **Deployments**: Define the desired state for your application, including which container images to use and how many replicas to run
- **Services**: Abstract way to expose applications running on pods
- **ConfigMaps**: Store non-confidential configuration data as key-value pairs
- **Namespaces**: Virtual clusters that provide a way to divide cluster resources
- **Ingress**: Manages external access to services in a cluster, typically HTTP/HTTPS

## Our Kubernetes Architecture

Our setup uses the following architecture:

1. **K3s** as the lightweight Kubernetes distribution
2. **Traefik** (included with K3s) as the ingress controller
3. **Cert-Manager** for automated TLS certificate management
4. **Nginx** containers to serve our website content

## K3s: Lightweight Kubernetes

K3s is a certified Kubernetes distribution designed for production workloads in unattended, resource-constrained, remote locations, or inside IoT appliances.

### Key Features of K3s

- **Lightweight**: Smaller binary size (~50MB) compared to standard Kubernetes
- **Single binary**: Simplified installation and maintenance
- **Low resource requirements**: Can run on machines with limited CPU and memory
- **Includes Traefik**: Built-in ingress controller
- **Simplified setup**: Easier to deploy and manage

### Default Components in K3s

- **CoreDNS**: For cluster DNS services
- **Traefik**: For ingress (routing external traffic)
- **Local storage provider**: For persistent volumes
- **Metrics Server**: For resource metrics

## Cert-Manager Explained

Cert-Manager is a Kubernetes add-on that automates the management and issuance of TLS certificates. It's particularly useful for obtaining certificates from Let's Encrypt and other certificate authorities.

### What is Cert-Manager?

Cert-Manager is a native Kubernetes certificate management controller that helps with:
- Issuing certificates from various sources (Let's Encrypt, HashiCorp Vault, Venafi, self-signed, etc.)
- Ensuring certificates are valid and up-to-date
- Renewing certificates at a configured time before expiry
- Securing Kubernetes Ingress resources with TLS without manual intervention

### Cert-Manager Architecture

Cert-Manager consists of several components that work together:

1. **Controller Manager**: The main component that processes certificate requests and manages the certificate lifecycle
2. **Webhook**: Provides dynamic admission control for cert-manager resources, validating and defaulting resource fields
3. **CA Injector**: Automatically injects CA bundles into webhook configurations
4. **Custom Resource Definitions (CRDs)**: Extend the Kubernetes API with cert-manager specific resources

### Key Custom Resources

Cert-Manager extends Kubernetes with the following custom resources:

1. **Certificate**: Represents a request for a TLS certificate
   - Defines the desired certificate
   - References an issuer that will issue the certificate
   - Specifies where the resulting secret should be stored

2. **Issuer/ClusterIssuer**: Represents a certificate authority that can issue certificates
   - **Issuer**: Namespaced resource, can only issue certificates in its own namespace
   - **ClusterIssuer**: Cluster-wide resource, can issue certificates across all namespaces
   - Supports multiple issuer types (ACME, CA, Vault, Self-Signed, Venafi, etc.)

3. **CertificateRequest**: Lower-level resource used by Certificate resources
   - Contains the actual certificate signing request (CSR)
   - Used internally by Certificate resources

4. **Order/Challenge**: Used internally for ACME challenges
   - **Order**: Represents an order with an ACME server
   - **Challenge**: Represents a challenge to prove domain ownership

### Certificate Issuance Process

The certificate issuance process follows these steps:

1. **Request Initiation**:
   - You create an Issuer or ClusterIssuer resource that defines which Certificate Authority to use
   - You create a Certificate resource that references the Issuer
   - Alternatively, you can annotate an Ingress resource to automatically create a Certificate

2. **Processing**:
   - Cert-Manager controller observes the Certificate resource
   - It creates a CertificateRequest resource with the appropriate CSR
   - The issuer controller processes the CertificateRequest

3. **Validation** (for ACME issuers):
   - The ACME issuer creates Order and Challenge resources
   - Cert-Manager completes the challenges to prove domain ownership
   - For HTTP01: Creates a temporary pod/service to serve the challenge response
   - For DNS01: Updates DNS records via configured DNS providers

4. **Certificate Storage**:
   - Once issued, the certificate is stored in a Kubernetes Secret
   - The Secret is named according to the Certificate spec
   - Contains the certificate, private key, and CA certificate

5. **Renewal**:
   - Cert-Manager continuously monitors certificate expiration
   - Typically initiates renewal when 2/3 of the certificate's lifetime has passed
   - The renewal process follows the same steps as the initial issuance

### ACME Protocol Explained

For Let's Encrypt and other ACME-compatible CAs, cert-manager uses the ACME protocol (Automated Certificate Management Environment):

1. **Account Registration**:
   - Cert-Manager registers with the ACME server using the provided email
   - The private key for this account is stored in a Secret referenced by the Issuer

2. **Domain Validation Methods**:
   - **HTTP01 challenge**:
     - Places a file at a specific URL on your domain (/.well-known/acme-challenge/TOKEN)
     - Requires port 80 to be accessible from the internet
     - Works well with Ingress controllers like Traefik, Nginx, etc.
     - Doesn't work for wildcard certificates

   - **DNS01 challenge**:
     - Requires adding a specific TXT record to your domain's DNS
     - Works for wildcard certificates
     - Doesn't require your server to be publicly accessible
     - Requires configuration of DNS providers (Route53, CloudFlare, etc.)

3. **Challenge Completion**:
   - After setting up the challenge response, cert-manager tells the ACME server to verify
   - The ACME server checks the challenge response
   - If successful, the ACME server issues the certificate

### Our Cert-Manager Configuration

In our setup:

1. **Installation**: We deploy cert-manager using the official YAML manifest, which creates:
   - The cert-manager namespace
   - All necessary CRDs
   - Controller, webhook, and CA injector deployments
   - Associated service accounts and RBAC permissions

2. **ClusterIssuer**: We create a ClusterIssuer for Let's Encrypt's production environment:
   ```typescript
   const clusterIssuer = new k8s.apiextensions.CustomResource("letsencrypt-prod", {
       apiVersion: "cert-manager.io/v1",
       kind: "ClusterIssuer",
       metadata: {
           name: "letsencrypt-prod",
       },
       spec: {
           acme: {
               server: "https://acme-v02.api.letsencrypt.org/directory",
               email: email,
               privateKeySecretRef: {
                   name: "letsencrypt-prod",
               },
               solvers: [{
                   http01: {
                       ingress: {
                           class: "traefik",
                       },
                   },
               }],
           },
       },
   });
   ```

3. **HTTP01 Challenge Configuration**: We configure HTTP01 challenges using Traefik as the ingress controller
   - The `solvers` section in the ClusterIssuer specifies how challenges should be solved
   - We use the `ingress` solver with `class: "traefik"` to integrate with our ingress controller

4. **Ingress Annotation**: We add annotations to our Ingress resources to request certificates automatically:
   ```typescript
   const ingress = new k8s.networking.v1.Ingress("website", {
       metadata: {
           namespace: namespace.metadata.name,
           annotations: {
               "kubernetes.io/ingress.class": "traefik",
               "cert-manager.io/cluster-issuer": "letsencrypt-prod",
           },
       },
       // ...
   });
   ```

5. **Robust Waiting Mechanism**: Our code includes a robust waiting mechanism to ensure cert-manager is fully operational before attempting to create certificates:
   - We create a Job that checks for the existence of cert-manager CRDs
   - We create another Job that checks if cert-manager controllers are ready
   - Only after both checks pass do we create the ClusterIssuer

## Components in Our Setup

### 1. Namespace

We create a dedicated namespace called "website" to isolate our application resources.

```typescript
const namespace = new k8s.core.v1.Namespace("website", {
    metadata: {
        name: "website",
    },
});
```

### 2. ConfigMap

We use a ConfigMap to store the HTML content of our website.

```typescript
const websiteConfigMap = new k8s.core.v1.ConfigMap("website-content", {
    metadata: {
        namespace: namespace.metadata.name,
    },
    data: {
        "index.html": htmlContent,
    },
});
```

### 3. Deployment

We create a Deployment that runs an nginx container to serve our website content.

```typescript
const deployment = new k8s.apps.v1.Deployment("website", {
    metadata: {
        namespace: namespace.metadata.name,
    },
    spec: {
        selector: {
            matchLabels: {
                app: "website",
            },
        },
        replicas: 1,
        template: {
            metadata: {
                labels: {
                    app: "website",
                },
            },
            spec: {
                containers: [{
                    name: "nginx",
                    image: "nginx:stable-alpine",
                    // ... configuration ...
                }],
                volumes: [{
                    name: "website-content",
                    configMap: {
                        name: websiteConfigMap.metadata.name,
                    },
                }],
            },
        },
    },
});
```

### 4. Service

We create a Service to expose our Deployment within the cluster.

```typescript
const service = new k8s.core.v1.Service("website", {
    metadata: {
        namespace: namespace.metadata.name,
    },
    spec: {
        selector: {
            app: "website",
        },
        ports: [{
            port: 80,
            targetPort: 80,
            protocol: "TCP",
        }],
        type: "ClusterIP",
    },
});
```

### 5. Ingress

We create an Ingress to route external traffic to our Service and configure TLS.

```typescript
const ingress = new k8s.networking.v1.Ingress("website", {
    metadata: {
        namespace: namespace.metadata.name,
        annotations: {
            "kubernetes.io/ingress.class": "traefik",
            "cert-manager.io/cluster-issuer": "letsencrypt-prod",
        },
    },
    spec: {
        tls: [{
            hosts: ["marlene.cloud"],
            secretName: "marlene-cloud-tls",
        }],
        rules: [{
            host: "marlene.cloud",
            http: {
                paths: [{
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                        service: {
                            name: service.metadata.name,
                            port: {
                                number: 80,
                            },
                        },
                    },
                }],
            },
        }],
    },
});
```

### 6. ClusterIssuer

We create a ClusterIssuer for Let's Encrypt to issue TLS certificates.

```typescript
const clusterIssuer = new k8s.apiextensions.CustomResource("letsencrypt-prod", {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
        name: "letsencrypt-prod",
    },
    spec: {
        acme: {
            server: "https://acme-v02.api.letsencrypt.org/directory",
            email: email,
            privateKeySecretRef: {
                name: "letsencrypt-prod",
            },
            solvers: [{
                http01: {
                    ingress: {
                        class: "traefik",
                    },
                },
            }],
        },
    },
});
```

## How Everything Works Together

Here's how all these components work together:

1. **Deployment Process**:
   - Pulumi deploys cert-manager to the cluster
   - Pulumi waits for cert-manager to be fully operational
   - Pulumi creates a ClusterIssuer for Let's Encrypt
   - Pulumi creates the website namespace, ConfigMap, Deployment, Service, and Ingress

2. **Runtime Process**:
   - External traffic arrives at your domain (e.g., marlene.cloud)
   - Traefik (the ingress controller) routes the traffic based on the Ingress rules
   - The traffic is directed to the website Service
   - The Service forwards the traffic to the nginx pod
   - Nginx serves the HTML content from the mounted ConfigMap

3. **Certificate Process**:
   - When the Ingress is created with the cert-manager annotation, cert-manager detects it
   - Cert-manager creates a Certificate resource based on the Ingress TLS configuration
   - Cert-manager uses the ClusterIssuer to request a certificate from Let's Encrypt
   - Let's Encrypt issues a challenge to verify domain ownership
   - Cert-manager completes the challenge using HTTP01 validation
   - Let's Encrypt issues the certificate
   - Cert-manager stores the certificate in a Kubernetes Secret
   - Traefik uses the Secret to terminate TLS connections

4. **Certificate Renewal**:
   - Cert-manager automatically monitors certificate expiration
   - Before a certificate expires, cert-manager initiates the renewal process
   - The renewal follows the same process as the initial issuance
   - The new certificate replaces the old one in the Secret

## Troubleshooting

### Common Issues with Cert-Manager

1. **Certificate Not Issued**:
   - Check cert-manager pods are running: `kubectl get pods -n cert-manager`
   - Check certificate status: `kubectl get certificate -n website`
   - Check certificate request: `kubectl get certificaterequest -n website`
   - Check challenges: `kubectl get challenge -n website`
   - Check events: `kubectl get events -n website`

2. **HTTP01 Challenge Failures**:
   - Ensure your domain points to your server's IP address
   - Verify Traefik is properly configured
   - Check that port 80 is accessible from the internet

3. **ClusterIssuer Issues**:
   - Verify the ClusterIssuer exists: `kubectl get clusterissuer`
   - Check its status: `kubectl describe clusterissuer letsencrypt-prod`

### Debugging Commands

```bash
# Check cert-manager components
kubectl get pods -n cert-manager

# Check certificate status
kubectl get certificate -n website

# View detailed certificate information
kubectl describe certificate -n website

# Check ingress configuration
kubectl describe ingress -n website

# View cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Check if Let's Encrypt can reach your server
# (Run this on your local machine)
curl -Ik https://marlene.cloud
```

By understanding these components and how they interact, you should now have a better grasp of how our Kubernetes setup works, especially the role of cert-manager in providing automated TLS certificates.
