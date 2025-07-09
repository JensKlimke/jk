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
 * Authentication configuration for a service
 */
interface AuthConfig {
  service: string;
  headers: boolean;
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
 * Gets services configuration based on Docker containers
 * @returns ServicesJson object with array of service configurations
 */
export async function getDockerServices(): Promise<ServicesJson> {
  // Get all containers with VIRTUAL_HOST environment variable
  const containers = await getContainersWithVirtualHost();

  if (containers.length === 0) {
    console.warn('No containers with VIRTUAL_HOST found');
  }

  const services: ServiceConfig[] = [];

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

    services.push(serviceConfig);
  }

  return { services };
}

// Export the getContainersWithVirtualHost function for testing
export { getContainersWithVirtualHost };
