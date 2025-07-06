import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as fs from "fs";
import * as path from "path";

export function createWebsite(provider: k8s.Provider) {
    // Create a namespace for our application
    const namespace = new k8s.core.v1.Namespace("website", {
        metadata: {
            name: "website",
        },
    }, { provider });

    // Create a ConfigMap for our HTML content
    // Read the HTML content from the index.html file
    const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

    const websiteConfigMap = new k8s.core.v1.ConfigMap("website-content", {
        metadata: {
            namespace: namespace.metadata.name,
        },
        data: {
            "index.html": htmlContent,
        },
    }, { provider });

    // Create a Deployment for the nginx web server
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
                        ports: [{
                            containerPort: 80,
                            name: "http",
                        }],
                        volumeMounts: [{
                            name: "website-content",
                            mountPath: "/usr/share/nginx/html",
                        }],
                        resources: {
                            limits: {
                                cpu: "100m",
                                memory: "128Mi",
                            },
                            requests: {
                                cpu: "50m",
                                memory: "64Mi",
                            },
                        },
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
    }, { provider });

    // Create a Service to expose the deployment
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
    }, { provider });

    // Create an Ingress to route traffic from the domain
    const ingress = new k8s.networking.v1.Ingress("website", {
        metadata: {
            namespace: namespace.metadata.name,
            annotations: {
                "kubernetes.io/ingress.class": "traefik", // k3s uses Traefik by default
                "cert-manager.io/cluster-issuer": "letsencrypt-prod", // Use cert-manager for automatic certificate management
            },
        },
        spec: {
            tls: [{
                hosts: ["marlene.cloud"],
                secretName: "marlene-cloud-tls", // This secret will be created by cert-manager
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
    }, { provider });

    // Return the website URL
    return {
        url: pulumi.interpolate`https://${ingress.spec.rules[0].host}`,
    };
}
