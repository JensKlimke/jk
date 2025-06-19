import { exec } from 'child_process';
import { promisify } from 'util';

import { Container } from './container';
import logger from '../utils/logger';

const execAsync = promisify(exec);

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
      logger.error(`Error checking if container ${containerName} is running:`, error instanceof Error ? error : new Error(String(error)));
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
      logger.error(`Error executing command in container ${containerName}:`, error instanceof Error ? error : new Error(String(error)));
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
      logger.error(`Error restarting container ${containerName}:`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Get all containers with their information
   * @param envFilter Optional environment variable to filter containers by
   * @returns Array of container information
   */
  async getAllContainers(envFilter?: string): Promise<Container[]> {
    try {
      // Get basic container information
      const { stdout: containerList } = await execAsync(
        'docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.CreatedAt}}\\t{{.Ports}}"'
      );

      const containers: Container[] = [];

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
        // Split by newline (handles both \n and \\n)
        envOutput.trim().split(/\\n|\n/).forEach(envVar => {
          if (!envVar) return;
          const [key, ...valueParts] = envVar.split('=');
          if (key) {
            env[key] = valueParts.join('=');
          }
        });

        // Create container info object
        const containerInfo = new Container(
          id,
          name,
          image,
          status,
          created,
          ports || '',
          env
        );

        containers.push(containerInfo);
      }

      // Filter containers by environment variable if specified
      if (envFilter) {
        return containers.filter(container => 
          Object.keys(container.env).includes(envFilter)
        );
      }

      return containers;
    } catch (error) {
      logger.error('Error getting container information:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
}
