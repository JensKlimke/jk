import { DockerService } from './docker';

/**
 * Service for interacting with Nginx
 */
export class NginxService {
  private dockerService: DockerService;
  private readonly nginxContainerName = 'nginx-proxy';
  private readonly maxAttempts = 60;
  private readonly maxRestartAttempts = 30;
  private readonly attemptDelay = 1000; // 1 second

  constructor(dockerService: DockerService) {
    this.dockerService = dockerService;
  }

  /**
   * Wait for Nginx to start and be ready
   */
  async waitForNginx(): Promise<void> {
    console.log('Waiting for nginx to be fully started...');
    let attempt = 0;

    while (attempt < this.maxAttempts) {
      attempt++;

      // Check if nginx-proxy container is running
      if (await this.dockerService.isContainerRunning(this.nginxContainerName)) {
        // Check if nginx is ready to accept connections
        const { success } = await this.dockerService.executeCommand(
          this.nginxContainerName,
          'nginx -t',
        );
        if (success) {
          console.log('Nginx is running and configuration is valid');
          return;
        }
      }

      console.log(`Waiting for nginx to start (attempt ${attempt}/${this.maxAttempts})...`);
      await this.delay(this.attemptDelay);
    }

    throw new Error(`Nginx did not start after ${this.maxAttempts} attempts`);
  }

  /**
   * Restart Nginx
   */
  async restartNginx(): Promise<void> {
    console.log('Attempting to restart nginx container...');

    // Use docker command to restart the nginx-proxy container
    const success = await this.dockerService.restartContainer(this.nginxContainerName);
    if (!success) {
      throw new Error('Failed to restart nginx container');
    }

    console.log('Nginx container restart initiated');

    // Wait for nginx to be ready after restart
    let attempt = 0;

    while (attempt < this.maxRestartAttempts) {
      attempt++;

      // Check if nginx-proxy container is running
      if (await this.dockerService.isContainerRunning(this.nginxContainerName)) {
        // Check if nginx is ready to accept connections
        const { success } = await this.dockerService.executeCommand(
          this.nginxContainerName,
          'nginx -t',
        );
        if (success) {
          console.log('Nginx container restarted successfully and configuration is valid');
          return;
        }
      }

      console.log(
        `Waiting for nginx to be ready after restart (attempt ${attempt}/${this.maxRestartAttempts})...`,
      );
      await this.delay(this.attemptDelay);
    }

    throw new Error('Nginx did not become ready after restart');
  }

  /**
   * Helper method to create a delay
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
