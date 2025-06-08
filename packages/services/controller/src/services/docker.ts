import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Interface representing container information
 */
export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  created: string;
  ports: string;
  env: Record<string, string>;
}

/**
 * Service for interacting with Docker
 */
export class DockerService {
  /**
   * Check if a container is running
   * @param containerName The name of the container to check
   */
  async isContainerRunning(containerName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker ps --format '{{.Names}}' | grep -q "${containerName}" && echo "running" || echo "stopped"`,
      );
      return stdout.trim() === 'running';
    } catch (error) {
      console.error(`Error checking if container ${containerName} is running:`, error);
      return false;
    }
  }

  /**
   * Execute a command in a container
   * @param containerName The name of the container
   * @param command The command to execute
   */
  async executeCommand(
    containerName: string,
    command: string,
  ): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout } = await execAsync(`docker exec ${containerName} ${command}`);
      return { success: true, output: stdout };
    } catch (error) {
      console.error(`Error executing command in container ${containerName}:`, error);
      return { success: false, output: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Restart a container
   * @param containerName The name of the container to restart
   */
  async restartContainer(containerName: string): Promise<boolean> {
    try {
      await execAsync(`docker restart ${containerName}`);
      return true;
    } catch (error) {
      console.error(`Error restarting container ${containerName}:`, error);
      return false;
    }
  }

  /**
   * Get all containers with their information
   * @param envFilter Optional regex pattern to filter containers by environment variables
   * @returns Array of container information
   */
  async getAllContainers(envFilter?: string): Promise<ContainerInfo[]> {
    try {
      // Get basic container information
      const { stdout: containerList } = await execAsync(
        'docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.CreatedAt}}\\t{{.Ports}}"'
      );

      const containers: ContainerInfo[] = [];

      // Process each container
      for (const containerLine of containerList.trim().split('\n')) {
        if (!containerLine) continue;

        const [id, name, image, status, created, ports] = containerLine.split('\t');

        // Get environment variables for this container
        const { stdout: envOutput } = await execAsync(
          `docker inspect --format '{{range .Config.Env}}{{.}}\\n{{end}}' ${id}`
        );

        // Parse environment variables into a record
        const env: Record<string, string> = {};
        envOutput.trim().split('\n').forEach(envVar => {
          if (!envVar) return;
          const [key, ...valueParts] = envVar.split('=');
          if (key) {
            env[key] = valueParts.join('=');
          }
        });

        // Create container info object
        const containerInfo: ContainerInfo = {
          id,
          name,
          image,
          status,
          created,
          ports: ports || '',
          env
        };

        // Apply environment variable filter if provided
        if (envFilter) {
          const regex = new RegExp(envFilter);
          let matchFound = false;

          // Check if any environment variable matches the regex
          for (const [key, value] of Object.entries(env)) {
            if (regex.test(key) || regex.test(value)) {
              matchFound = true;
              break;
            }
          }

          if (!matchFound) continue;
        }

        containers.push(containerInfo);
      }

      return containers;
    } catch (error) {
      console.error('Error getting container information:', error);
      return [];
    }
  }
}
