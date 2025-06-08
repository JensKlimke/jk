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

  describe('getAllContainers', () => {
    it('should return all containers with their information', async () => {
      // Mock exec for container list
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'abc123\tnginx-proxy\tnginx:latest\tUp 2 hours\t2023-06-15 10:30:45\t0.0.0.0:80->80/tcp\n' +
                      'def456\tapi\tnode:18\tUp 1 hour\t2023-06-15 11:30:45\t0.0.0.0:3000->3000/tcp\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for first container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NGINX_VERSION=1.21.0\nPROXY_MODE=production\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for second container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NODE_ENV=production\nPORT=3000\nAPI_KEY=secret123\n';
        callback(null, { stdout, stderr: '' });
      });

      const result = await dockerService.getAllContainers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'abc123',
        name: 'nginx-proxy',
        image: 'nginx:latest',
        status: 'Up 2 hours',
        created: '2023-06-15 10:30:45',
        ports: '0.0.0.0:80->80/tcp',
        env: {
          NGINX_VERSION: '1.21.0',
          PROXY_MODE: 'production'
        }
      });
      expect(result[1]).toEqual({
        id: 'def456',
        name: 'api',
        image: 'node:18',
        status: 'Up 1 hour',
        created: '2023-06-15 11:30:45',
        ports: '0.0.0.0:3000->3000/tcp',
        env: {
          NODE_ENV: 'production',
          PORT: '3000',
          API_KEY: 'secret123'
        }
      });
    });

    it('should filter containers by environment variables', async () => {
      // Mock exec for container list
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'abc123\tnginx-proxy\tnginx:latest\tUp 2 hours\t2023-06-15 10:30:45\t0.0.0.0:80->80/tcp\n' +
                      'def456\tapi\tnode:18\tUp 1 hour\t2023-06-15 11:30:45\t0.0.0.0:3000->3000/tcp\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for first container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NGINX_VERSION=1.21.0\nPROXY_MODE=production\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for second container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NODE_ENV=production\nPORT=3000\nAPI_KEY=secret123\n';
        callback(null, { stdout, stderr: '' });
      });

      // Filter for containers with NODE_ENV
      const result = await dockerService.getAllContainers('NODE_ENV');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('api');
    });

    it('should return an empty array when no containers match the filter', async () => {
      // Mock exec for container list
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'abc123\tnginx-proxy\tnginx:latest\tUp 2 hours\t2023-06-15 10:30:45\t0.0.0.0:80->80/tcp\n' +
                      'def456\tapi\tnode:18\tUp 1 hour\t2023-06-15 11:30:45\t0.0.0.0:3000->3000/tcp\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for first container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NGINX_VERSION=1.21.0\nPROXY_MODE=production\n';
        callback(null, { stdout, stderr: '' });
      });

      // Mock exec for second container env vars
      (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
        const stdout = 'NODE_ENV=production\nPORT=3000\nAPI_KEY=secret123\n';
        callback(null, { stdout, stderr: '' });
      });

      // Filter for non-existent env var
      const result = await dockerService.getAllContainers('NON_EXISTENT_VAR');

      expect(result).toHaveLength(0);
    });

    it('should return an empty array when exec throws an error', async () => {
      // Mock exec to throw an error
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(new Error('Command failed'), { stdout: '', stderr: 'Error' });
      });

      const result = await dockerService.getAllContainers();

      expect(result).toHaveLength(0);
    });
  });
});
