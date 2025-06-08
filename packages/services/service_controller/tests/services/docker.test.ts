import { DockerService } from '../../src/services/docker';
import { exec } from 'child_process';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('DockerService', () => {
  let dockerService: DockerService;

  beforeEach(() => {
    dockerService = new DockerService();
    jest.clearAllMocks();
  });

  describe('isContainerRunning', () => {
    it('should return true when container is running', async () => {
      // Mock exec to return 'running'
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'running\n', stderr: '' });
      });

      const result = await dockerService.isContainerRunning('nginx-proxy');

      expect(result).toBe(true);
      expect(exec).toHaveBeenCalledWith(expect.stringContaining('docker ps'), expect.any(Function));
    });

    it('should return false when container is not running', async () => {
      // Mock exec to return 'stopped'
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'stopped\n', stderr: '' });
      });

      const result = await dockerService.isContainerRunning('nginx-proxy');

      expect(result).toBe(false);
    });

    it('should return false when exec throws an error', async () => {
      // Mock exec to throw an error
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Command failed'), { stdout: '', stderr: 'Error' });
      });

      const result = await dockerService.isContainerRunning('nginx-proxy');

      expect(result).toBe(false);
    });
  });

  describe('executeCommand', () => {
    it('should return success and output when command succeeds', async () => {
      // Mock exec to return success
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'Command output', stderr: '' });
      });

      const result = await dockerService.executeCommand('nginx-proxy', 'nginx -t');

      expect(result).toEqual({ success: true, output: 'Command output' });
      expect(exec).toHaveBeenCalledWith('docker exec nginx-proxy nginx -t', expect.any(Function));
    });

    it('should return failure and error message when command fails', async () => {
      // Mock exec to throw an error
      const error = new Error('Command failed');
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(error, { stdout: '', stderr: 'Error output' });
      });

      const result = await dockerService.executeCommand('nginx-proxy', 'nginx -t');

      expect(result).toEqual({ success: false, output: 'Command failed' });
    });
  });

  describe('restartContainer', () => {
    it('should return true when restart succeeds', async () => {
      // Mock exec to return success
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const result = await dockerService.restartContainer('nginx-proxy');

      expect(result).toBe(true);
      expect(exec).toHaveBeenCalledWith('docker restart nginx-proxy', expect.any(Function));
    });

    it('should return false when restart fails', async () => {
      // Mock exec to throw an error
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Restart failed'), { stdout: '', stderr: 'Error' });
      });

      const result = await dockerService.restartContainer('nginx-proxy');

      expect(result).toBe(false);
    });
  });
});
