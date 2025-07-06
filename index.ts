import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { createWebsite } from "./app/website";

// Create a Kubernetes provider instance that uses kubeconfig from the local machine
const provider = new k8s.Provider("k3s", {
    context: "default", // Use the default context from kubeconfig
});

// Create the website app
const website = createWebsite(provider);

// Export the website URL
export const url = website.url;
