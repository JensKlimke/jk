import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { createWebsite } from "./app/website";

// Create a Kubernetes provider instance that uses kubeconfig from the local machine
const provider = new k8s.Provider("k3s", {
    context: "default", // Use the default context from kubeconfig
});

// Deploy cert-manager
function deployCertManager(provider: k8s.Provider) {
    // Deploy cert-manager using YAML manifest from the official repository
    // Note: The YAML already contains the namespace definition
    const certManager = new k8s.yaml.ConfigGroup("cert-manager", {
        files: ["https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml"],
    }, { provider });

    // Create a more robust waiting mechanism for CRDs
    // First, create a delay ConfigMap
    const crdDelay = new k8s.core.v1.ConfigMap("cert-manager-crd-delay", {
        metadata: {
            name: "cert-manager-crd-delay",
            namespace: "default",
        },
        data: {
            "wait": "for-crds",
        },
    }, { provider, dependsOn: [certManager] });

    // Create a ServiceAccount for the waiting job
    const waitJobSa = new k8s.core.v1.ServiceAccount("cert-manager-wait-job-sa", {
        metadata: {
            name: "cert-manager-wait-job-sa",
            namespace: "default",
        },
    }, { provider, dependsOn: [crdDelay] });

    // Create a ClusterRole that allows checking for CRDs and pod status
    const waitJobRole = new k8s.rbac.v1.ClusterRole("cert-manager-wait-job-role", {
        metadata: {
            name: "cert-manager-wait-job-role",
        },
        rules: [
            {
                apiGroups: ["apiextensions.k8s.io"],
                resources: ["customresourcedefinitions"],
                verbs: ["get", "list"],
            },
            {
                apiGroups: [""],
                resources: ["pods", "services", "namespaces"],
                verbs: ["get", "list", "watch"],
            },
            {
                apiGroups: ["apps"],
                resources: ["deployments"],
                verbs: ["get", "list", "watch"],
            }
        ],
    }, { provider, dependsOn: [waitJobSa] });

    // Bind the ClusterRole to the ServiceAccount
    const waitJobRoleBinding = new k8s.rbac.v1.ClusterRoleBinding("cert-manager-wait-job-rolebinding", {
        metadata: {
            name: "cert-manager-wait-job-rolebinding",
        },
        subjects: [{
            kind: "ServiceAccount",
            name: waitJobSa.metadata.name,
            namespace: "default",
        }],
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "ClusterRole",
            name: waitJobRole.metadata.name,
        },
    }, { provider, dependsOn: [waitJobRole] });

    // Then create a Job that checks for the existence of the ClusterIssuer CRD
    const waitForCrdsJob = new k8s.batch.v1.Job("wait-for-cert-manager-crds", {
        metadata: {
            name: "wait-for-cert-manager-crds",
            namespace: "default",
        },
        spec: {
            template: {
                spec: {
                    containers: [{
                        name: "kubectl",
                        image: "bitnami/kubectl:latest",
                        command: [
                            "sh",
                            "-c",
                            // Check for multiple CRDs to ensure cert-manager is fully initialized
                            "until kubectl get crd clusterissuers.cert-manager.io && kubectl get crd certificates.cert-manager.io && kubectl get crd issuers.cert-manager.io; do echo 'Waiting for cert-manager CRDs...'; sleep 5; done"
                        ],
                    }],
                    restartPolicy: "OnFailure",
                    serviceAccountName: waitJobSa.metadata.name,
                },
            },
            backoffLimit: 20, // Increase backoff limit to give more time
            ttlSecondsAfterFinished: 100, // Clean up the job after it completes
        },
    }, { provider, dependsOn: [waitJobRoleBinding] });

    return waitForCrdsJob; // Return the job that waits for CRDs
}

// Create a ClusterIssuer for Let's Encrypt
function createClusterIssuer(provider: k8s.Provider, email: string, dependsOn?: pulumi.Resource[]) {
    // Add an additional delay to ensure cert-manager controllers are fully operational
    const controllerDelay = new k8s.core.v1.ConfigMap("cert-manager-controller-delay", {
        metadata: {
            name: "cert-manager-controller-delay",
            namespace: "default",
        },
        data: {
            "wait": "for-controllers",
        },
    }, { provider, dependsOn: dependsOn });

    // Create a Job to check if cert-manager controllers are ready
    const waitForControllersJob = new k8s.batch.v1.Job("wait-for-cert-manager-controllers", {
        metadata: {
            name: "wait-for-cert-manager-controllers",
            namespace: "default",
        },
        spec: {
            template: {
                spec: {
                    containers: [{
                        name: "kubectl",
                        image: "bitnami/kubectl:latest",
                        command: [
                            "sh",
                            "-c",
                            // Check if cert-manager pods are running and ready
                            "until kubectl get pods -n cert-manager -l app=cert-manager -o jsonpath='{.items[*].status.containerStatuses[0].ready}' | grep -q true && kubectl get pods -n cert-manager -l app=webhook -o jsonpath='{.items[*].status.containerStatuses[0].ready}' | grep -q true; do echo 'Waiting for cert-manager controllers and webhook to be ready...'; sleep 5; done"
                        ],
                    }],
                    restartPolicy: "OnFailure",
                    serviceAccountName: "cert-manager-wait-job-sa", // Reuse the same service account
                },
            },
            backoffLimit: 20,
            ttlSecondsAfterFinished: 100,
        },
    }, { provider, dependsOn: [controllerDelay] });

    // Now create the ClusterIssuer after ensuring controllers are ready
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
    }, { provider, dependsOn: [waitForControllersJob] });

    return clusterIssuer;
}

// Deploy cert-manager
const certManager = deployCertManager(provider);

// Create ClusterIssuer for Let's Encrypt
const clusterIssuer = createClusterIssuer(provider, "jens.klimke@rwth-aachen.de", [certManager]);

// Create the website app
const website = createWebsite(provider, [clusterIssuer]);

// Export the website URL
export const url = website.url;
