import { NginxService } from '../../src/services/nginx';
import { DockerService } from '../../src/services/docker';

// Mock DockerService
jest.mock('../../src/services/docker');

describe('NginxService', () => {
  let nginxService: NginxService;
  let mockDockerService: jest.Mocked<DockerService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock DockerService
    mockDockerService = new DockerService() as jest.Mocked<DockerService>;

    // Create NginxService with the mock DockerService
    nginxService = new NginxService(mockDockerService);

    // Mock the delay method to avoid waiting in tests
    jest.spyOn<any, any>(nginxService, 'delay').mockResolvedValue(undefined);
  });

  describe('waitForNginx', () => {
    it('should resolve when nginx is running and configuration is valid', async () => {
      // Mock isContainerRunning to return true
      mockDockerService.isContainerRunning.mockResolvedValueOnce(true);

      // Mock executeCommand to return success
      mockDockerService.executeCommand.mockResolvedValueOnce({ success: true, output: '' });

      await expect(nginxService.waitForNginx()).resolves.not.toThrow();

      expect(mockDockerService.isContainerRunning).toHaveBeenCalledWith('nginx-proxy');
      expect(mockDockerService.executeCommand).toHaveBeenCalledWith('nginx-proxy', 'nginx -t');
    });

    it('should retry until nginx is running and configuration is valid', async () => {
      // First attempt: container not running
      mockDockerService.isContainerRunning.mockResolvedValueOnce(false);

      // Second attempt: container running but config invalid
      mockDockerService.isContainerRunning.mockResolvedValueOnce(true);
      mockDockerService.executeCommand.mockResolvedValueOnce({
        success: false,
        output: 'Invalid config',
      });

      // Third attempt: success
      mockDockerService.isContainerRunning.mockResolvedValueOnce(true);
      mockDockerService.executeCommand.mockResolvedValueOnce({ success: true, output: '' });

      await expect(nginxService.waitForNginx()).resolves.not.toThrow();

      expect(mockDockerService.isContainerRunning).toHaveBeenCalledTimes(3);
      expect(mockDockerService.executeCommand).toHaveBeenCalledTimes(2);
    });

    it('should throw an error after max attempts', async () => {
      // Mock isContainerRunning to always return false
      mockDockerService.isContainerRunning.mockResolvedValue(false);

      // Override maxAttempts for faster test
      Object.defineProperty(nginxService, 'maxAttempts', { value: 3 });

      await expect(nginxService.waitForNginx()).rejects.toThrow(
        'Nginx did not start after 3 attempts',
      );

      expect(mockDockerService.isContainerRunning).toHaveBeenCalledTimes(3);
    });
  });

  describe('restartNginx', () => {
    it('should restart nginx and wait for it to be ready', async () => {
      // Mock restartContainer to return true
      mockDockerService.restartContainer.mockResolvedValueOnce(true);

      // Mock isContainerRunning to return true
      mockDockerService.isContainerRunning.mockResolvedValueOnce(true);

      // Mock executeCommand to return success
      mockDockerService.executeCommand.mockResolvedValueOnce({ success: true, output: '' });

      await expect(nginxService.restartNginx()).resolves.not.toThrow();

      expect(mockDockerService.restartContainer).toHaveBeenCalledWith('nginx-proxy');
      expect(mockDockerService.isContainerRunning).toHaveBeenCalledWith('nginx-proxy');
      expect(mockDockerService.executeCommand).toHaveBeenCalledWith('nginx-proxy', 'nginx -t');
    });

    it('should throw an error if restart fails', async () => {
      // Mock restartContainer to return false
      mockDockerService.restartContainer.mockResolvedValueOnce(false);

      await expect(nginxService.restartNginx()).rejects.toThrow(
        'Failed to restart nginx container',
      );

      expect(mockDockerService.restartContainer).toHaveBeenCalledWith('nginx-proxy');
    });

    it('should throw an error if nginx does not become ready after restart', async () => {
      // Mock restartContainer to return true
      mockDockerService.restartContainer.mockResolvedValueOnce(true);

      // Mock isContainerRunning to always return false
      mockDockerService.isContainerRunning.mockResolvedValue(false);

      // Override maxRestartAttempts for faster test
      Object.defineProperty(nginxService, 'maxRestartAttempts', { value: 3 });

      await expect(nginxService.restartNginx()).rejects.toThrow(
        'Nginx did not become ready after restart',
      );

      expect(mockDockerService.restartContainer).toHaveBeenCalledWith('nginx-proxy');
      expect(mockDockerService.isContainerRunning).toHaveBeenCalledTimes(3);
    });
  });
});
