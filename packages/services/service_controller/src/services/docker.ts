import { exec } from 'child_process';
import { promisify } from 'util';

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
}
