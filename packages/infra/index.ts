import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as dotenv from "dotenv";

dotenv.config();

// Load environment variables from .env file
const imageName = process.env.IMAGE_NAME;

if (!imageName) {
    throw new Error("IMAGE_NAME is not defined in the .env file");
}

// Create an EKS cluster
const cluster = new eks.Cluster("jk-cluster", {
    instanceType: "t3.medium",
    desiredCapacity: 2,
    minSize: 1,
    maxSize: 3,
});

// Export the kubeconfig
export const kubeconfig = cluster.kubeconfig;

// Deploy NGINX using the custom image
const appLabels = { app: "nginx" };

const deployment = new k8s.apps.v1.Deployment("nginx", {
    metadata: {
        namespace: "default",
    },
    spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [
                    {
                        name: "nginx",
                        image: imageName,
                        ports: [{ containerPort: 80 }],
                    },
                ],
            },
        },
    },
}, { provider: cluster.provider });

// Expose the deployment with a LoadBalancer
const service = new k8s.core.v1.Service("nginx-service", {
    metadata: {
        labels: appLabels,
    },
    spec: {
        type: "LoadBalancer",
        selector: appLabels,
        ports: [
            {
                port: 80,
                targetPort: 80,
            },
        ],
    },
}, { provider: cluster.provider });

export const serviceIp = service.status.loadBalancer.ingress[0].hostname;
export const deploymentName = deployment.metadata.name;
