#!/usr/bin/env node

/**
 * Test script for the webhook service
 * 
 * This script:
 * 1. Starts the artifact server
 * 2. Triggers the webhook service with the artifact URL
 * 3. Verifies the webhook service processes the artifact correctly
 */

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const https = require('https');

// Configuration
const ARTIFACT_SERVER_PORT = process.env.ARTIFACT_SERVER_PORT || 3002; // Changed from 3000 to avoid port conflicts
const ARTIFACT_SERVER_HOST = process.env.ARTIFACT_SERVER_HOST || 'host.docker.internal';
const WEBHOOK_SERVICE_HOST = process.env.WEBHOOK_SERVICE_HOST || 'deploy.localhost';
const WEBAPP_NAME = process.env.WEBAPP_NAME || 'test-app';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''; // Secret for webhook authentication
const WEBHOOK_URL = `https://${WEBHOOK_SERVICE_HOST}/${WEBAPP_NAME}`;
const ARTIFACT_URL = `http://${ARTIFACT_SERVER_HOST}:${ARTIFACT_SERVER_PORT}/artifact`;

// Paths
const artifactServerPath = path.join(__dirname, 'artifact-server', 'server.js');
const zipFilePath = path.join(__dirname, 'index.html.zip');

// Check if the zip file exists
if (!fs.existsSync(zipFilePath)) {
  console.error(`Error: Zip file not found at ${zipFilePath}`);
  process.exit(1);
}

// Function to start the artifact server
function startArtifactServer() {
  console.log('Starting artifact server...');
  
  // Set environment variable for the port
  const env = { ...process.env, PORT: ARTIFACT_SERVER_PORT };
  
  // Spawn the server process
  const server = spawn('node', [artifactServerPath], { 
    env,
    stdio: 'pipe' // Capture stdout and stderr
  });
  
  // Handle server output
  server.stdout.on('data', (data) => {
    console.log(`[Artifact Server] ${data.toString().trim()}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`[Artifact Server Error] ${data.toString().trim()}`);
  });
  
  // Handle server exit
  server.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`Artifact server exited with code ${code}`);
    }
  });
  
  return server;
}

// Function to trigger the webhook
async function triggerWebhook() {
  console.log(`Triggering webhook at ${WEBHOOK_URL} with artifact URL: ${ARTIFACT_URL}`);
  
  try {
    // Wait a moment to ensure the artifact server is ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a custom https agent that ignores certificate validation
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // Ignore certificate validation (only for testing)
    });

    // Make the POST request to the webhook service
    const response = await axios.post(WEBHOOK_URL, {
      artifact_url: ARTIFACT_URL
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}` // Add authorization header with the webhook secret
      },
      httpsAgent // Add the custom https agent to ignore certificate validation
    });
    
    console.log('Webhook response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error triggering webhook:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Main function
async function main() {
  let server;
  
  try {
    // Start the artifact server
    server = startArtifactServer();
    
    // Wait for the server to start
    console.log('Waiting for artifact server to start...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trigger the webhook
    await triggerWebhook();
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up: kill the artifact server
    if (server) {
      console.log('Shutting down artifact server...');
      server.kill();
    }
  }
}

// Run the main function
main();