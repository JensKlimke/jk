import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

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
  cert?: CertConfig;
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
 * Authentication type for a container
 */
enum AuthType {
  WITH_HEADERS = 'WITH_HEADERS',
  WITHOUT_HEADERS = 'WITHOUT_HEADERS',
  NONE = 'NONE'
}

/**
 * Container information with virtual host and ports
 */
interface ContainerInfo {
  name: string;
  virtualHost: string;
  ports: string[];
  withAuth: AuthType;
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

          // Extract WITH_AUTH_HEADERS environment variable
          const withAuthHeadersVar = envVars.find((env: string) => env.startsWith('WITH_AUTH_HEADERS='));
          const withAuthHeaders = withAuthHeadersVar ?
            withAuthHeadersVar.split('=')[1].toLowerCase() === 'true' : false;

          // Extract WITH_AUTH environment variable
          const withAuthVar = envVars.find((env: string) => env.startsWith('WITH_AUTH='));
          const withAuth = withAuthVar ?
            withAuthVar.split('=')[1].toLowerCase() === 'true' : false;

          // Determine the auth type based on environment variables
          let authType = AuthType.NONE;
          if (withAuthHeaders) {
            authType = AuthType.WITH_HEADERS;
          } else if (withAuth) {
            authType = AuthType.WITHOUT_HEADERS;
          }

          containersWithVirtualHost.push({
            name,
            virtualHost,
            ports,
            withAuth: authType
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
 * Structure for default certificate configuration
 */
interface DefaultCertConfig {
  file: string;
  key_file: string;
}

/**
 * Extended structure of the services.json file with default certificate
 */
interface ServicesJsonWithDefault extends ServicesJson {
  default_cert?: DefaultCertConfig;
}

/**
 * Gets services configuration based on Docker containers
 * @returns ServicesJsonWithDefault object with array of service configurations and default certificate
 */
export async function getDockerServices(): Promise<ServicesJsonWithDefault> {
  // Get all containers with VIRTUAL_HOST environment variable
  const containers = await getContainersWithVirtualHost();

  if (containers.length === 0) {
    console.warn('No containers with VIRTUAL_HOST found');
  }

  const services: ServiceConfig[] = [];

  // Get AUTH_SERVICE from environment variable
  const authService = process.env.AUTH_SERVICE || '';

  // Process each container to create service configurations
  for (const container of containers) {
    const host = container.virtualHost;
    // Default to port 80 if no port is found
    const port = container.ports.length > 0 ? container.ports[0] : '80';

    // Create the basic service configuration
    const serviceConfig: ServiceConfig = {
      host,
      service: container.name,
      port
    };

    // Check if certificate files exist before setting them
    const certFile = `/etc/letsencrypt/live/${host}/fullchain.pem`;
    const keyFile = `/etc/letsencrypt/live/${host}/privkey.pem`;

    if (existsSync(certFile) && existsSync(keyFile)) {
      serviceConfig.cert = {
        file: certFile,
        key_file: keyFile
      };
    }

    // Add auth configuration if withAuth is not NONE and AUTH_SERVICE is defined
    if (authService && container.withAuth !== AuthType.NONE) {
      serviceConfig.auth = {
        service: authService,
        headers: container.withAuth === AuthType.WITH_HEADERS
      };
    }

    services.push(serviceConfig);
  }

  // Check if default certificate files exist
  const defaultCertFile = '/etc/letsencrypt/live/default/fullchain.pem';
  const defaultKeyFile = '/etc/letsencrypt/live/default/privkey.pem';

  const result: ServicesJsonWithDefault = { services };

  // Only add default_cert if both files exist
  if (existsSync(defaultCertFile) && existsSync(defaultKeyFile)) {
    result.default_cert = {
      file: defaultCertFile,
      key_file: defaultKeyFile
    };
  }

  return result;
}

// Export the getContainersWithVirtualHost function and AuthType enum for testing
export { getContainersWithVirtualHost, AuthType };
