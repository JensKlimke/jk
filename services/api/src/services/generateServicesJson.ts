import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Certificate configuration for a service
 */
interface CertConfig {
  file: string;
  key_file: string;
}

/**
 * Authentication service configuration
 */
interface AuthConfig {
  name: string;
  port: string;
  auth_headers: boolean;
}

/**
 * Configuration for a single service
 */
interface ServiceConfig {
  host: string;
  cert: CertConfig;
  service: string;
  port: string;
  auth?: AuthConfig;
}

/**
 * Structure of the services.json file
 */
interface ServicesJson {
  services: ServiceConfig[];
}

/**
 * Container information with virtual host and ports
 */
interface ContainerInfo {
  name: string;
  virtualHost: string;
  ports: string[];
}

/**
 * Gets all Docker containers with VIRTUAL_HOST environment variable
 * @returns Array of container information with name, virtualHost, and ports
 */
async function getContainersWithVirtualHost(): Promise<ContainerInfo[]> {
  try {
    // Get all running containers
    const { stdout } = await execAsync('docker ps --format "{{.Names}}"');
    const containerNames = stdout.trim().split('\n').filter(name => name.trim() !== '');

    const containersWithVirtualHost: ContainerInfo[] = [];

    // For each container, check if it has VIRTUAL_HOST environment variable
    for (const name of containerNames) {
      try {
        // Get container information using docker inspect
        const { stdout: envOutput } = await execAsync(`docker inspect "${name}"`);

        // Parse the JSON output from docker inspect
        const containerInfo = JSON.parse(envOutput)[0];

        if (!containerInfo || !containerInfo.Config) {
          console.warn(`Invalid container info for ${name}`);
          continue;
        }

        // Extract VIRTUAL_HOST from environment variables
        const envVars = containerInfo.Config.Env || [];
        const virtualHostVar = envVars.find((env: string) => env.startsWith('VIRTUAL_HOST='));
        const virtualHost = virtualHostVar ? virtualHostVar.split('=')[1] : '';

        // Only include containers with a VIRTUAL_HOST
        if (virtualHost) {
          // Extract exposed ports
          const exposedPorts = containerInfo.Config.ExposedPorts || {};
          const ports = Object.keys(exposedPorts).map(p => p.split('/')[0]);

          containersWithVirtualHost.push({
            name,
            virtualHost,
            ports
          });
        }
      } catch (containerError) {
        console.warn(`Error processing container ${name}: ${containerError}`);
        // Continue with next container instead of failing the entire operation
      }
    }

    return containersWithVirtualHost;
  } catch (error) {
    console.error(`Error getting containers: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Generates services.json content based on Docker containers
 * @param authService Optional name of the authentication service
 * @returns ServicesJson object with array of service configurations
 */
async function generateServicesJson(authService?: string): Promise<ServicesJson> {
  // Get all containers with VIRTUAL_HOST environment variable
  const containers = await getContainersWithVirtualHost();

  if (containers.length === 0) {
    console.warn('No containers with VIRTUAL_HOST found');
  }

  const services: ServiceConfig[] = [];

  // Find the auth container if authService is specified
  const authContainer = authService 
    ? containers.find(container => container.name === authService)
    : undefined;

  if (authService && !authContainer) {
    console.warn(`Specified auth service "${authService}" not found among containers`);
  }

  // Process each container to create service configurations
  for (const container of containers) {
    const host = container.virtualHost;
    // Default to port 80 if no port is found
    const port = container.ports.length > 0 ? container.ports[0] : '80';

    // Create the basic service configuration
    const serviceConfig: ServiceConfig = {
      host,
      cert: {
        file: `/etc/letsencrypt/live/${host}/fullchain.pem`,
        key_file: `/etc/letsencrypt/live/${host}/privkey.pem`
      },
      service: container.name,
      port
    };

    // Add auth configuration if this is not the auth service and auth service exists
    if (authContainer && container.name !== authContainer.name) {
      serviceConfig.auth = {
        name: authContainer.name,
        // Default to port 80 if no port is found for auth container
        port: authContainer.ports.length > 0 ? authContainer.ports[0] : '80',
        auth_headers: true
      };
    }

    services.push(serviceConfig);
  }

  return { services };
}

/**
 * Main function to generate and save services.json
 * Parses command line arguments and handles the generation process
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const outputPath = args[0] || './services.json';
    const authService = args[1]; // Optional auth service name

    console.log(`Generating services.json${authService ? ` with auth service: ${authService}` : ''}`);
    console.log(`Output will be saved to: ${outputPath}`);

    // Generate the services.json content
    const servicesJson = await generateServicesJson(authService);

    if (servicesJson.services.length === 0) {
      console.warn('No services were found. The output file will contain an empty services array.');
    }

    try {
      // Write to file with pretty formatting (2 spaces indentation)
      fs.writeFileSync(outputPath, JSON.stringify(servicesJson, null, 2));
      console.log(`Services JSON generated successfully at: ${outputPath}`);
    } catch (writeError) {
      console.error(`Failed to write to ${outputPath}: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
      process.exit(1);
    }

    // Print summary information
    console.log(`Found ${servicesJson.services.length} services with VIRTUAL_HOST`);

    // Print the services for verification
    if (servicesJson.services.length > 0) {
      console.log('Services:');
      servicesJson.services.forEach(service => {
        let serviceInfo = `- ${service.host} -> ${service.service}:${service.port}`;
        if (service.auth) {
          serviceInfo += ` (Protected by ${service.auth.name})`;
        }
        console.log(serviceInfo);
      });
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

// Export functions for testing or use as a library
export {
  generateServicesJson,
  getContainersWithVirtualHost,
};
