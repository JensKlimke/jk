import { app } from '../src/server';
import {ContainerInfo, DockerService} from '../src/services/docker';
import { TemplateService } from '../src/services/template';
import { NginxService } from '../src/services/nginx';
import request from "supertest";

// Mock the services
jest.mock('../src/services/docker');
jest.mock('../src/services/template');
jest.mock('../src/services/nginx');

describe('API Server', () => {
  let mockDockerService: jest.Mocked<DockerService>;
  let mockTemplateService: jest.Mocked<TemplateService>;
  let mockNginxService: jest.Mocked<NginxService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get the mocked instances
    mockDockerService = DockerService.prototype as jest.Mocked<DockerService>;
    mockTemplateService = TemplateService.prototype as jest.Mocked<TemplateService>;
    mockNginxService = NginxService.prototype as jest.Mocked<NginxService>;
  });

  describe('GET /health', () => {
    it('should return 200 OK with status "ok"', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /api/process-templates', () => {
    it('should process templates and restart nginx when nginx is running', async () => {
      // Mock the services to return success
      mockDockerService.isContainerRunning.mockResolvedValue(true);
      mockTemplateService.processTemplates.mockResolvedValue();
      mockNginxService.restartNginx.mockResolvedValue();

      const response = await request(app).post('/api/process-templates');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        message: 'Templates processed and nginx restarted successfully'
      });

      // Verify that the services were called
      expect(mockDockerService.isContainerRunning).toHaveBeenCalledWith('nginx-proxy');
      expect(mockTemplateService.processTemplates).toHaveBeenCalled();
      expect(mockNginxService.restartNginx).toHaveBeenCalled();
    });

    it('should return 503 Service Unavailable when nginx is not running', async () => {
      // Mock the docker service to indicate nginx is not running
      mockDockerService.isContainerRunning.mockResolvedValue(false);

      const response = await request(app).post('/api/process-templates');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Nginx is not running'
      });

      // Verify that only the docker service was called
      expect(mockDockerService.isContainerRunning).toHaveBeenCalledWith('nginx-proxy');
      expect(mockTemplateService.processTemplates).not.toHaveBeenCalled();
      expect(mockNginxService.restartNginx).not.toHaveBeenCalled();
    });

    it('should return 500 Internal Server Error when an error occurs', async () => {
      // Mock the docker service to throw an error
      mockDockerService.isContainerRunning.mockRejectedValue(new Error('Test error'));

      const response = await request(app).post('/api/process-templates');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Test error'
      });
    });
  });

  describe('GET /api/containers', () => {
    it('should return all containers', async () => {
      // Mock container data
      const mockContainers : ContainerInfo[] = [
        {
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
        },
        {
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
        }
      ];

      // Mock the docker service to return containers
      mockDockerService.getAllContainers.mockResolvedValue(mockContainers);

      const response = await request(app).get('/api/containers');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        count: 2,
        data: mockContainers
      });

      // Verify that the docker service was called without a filter
      expect(mockDockerService.getAllContainers).toHaveBeenCalledWith(undefined);
    });

    it('should filter containers by environment variables', async () => {
      // Mock filtered container data
      const mockFilteredContainers = [
        {
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
        }
      ];

      // Mock the docker service to return filtered containers
      mockDockerService.getAllContainers.mockResolvedValue(mockFilteredContainers);

      const response = await request(app).get('/api/containers').query({ envFilter: 'NODE_ENV' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        count: 1,
        data: mockFilteredContainers
      });

      // Verify that the docker service was called with the filter
      expect(mockDockerService.getAllContainers).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should return empty data when no containers match the filter', async () => {
      // Mock the docker service to return empty array
      mockDockerService.getAllContainers.mockResolvedValue([]);

      const response = await request(app).get('/api/containers').query({ envFilter: 'NON_EXISTENT_VAR' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        count: 0,
        data: []
      });

      // Verify that the docker service was called with the filter
      expect(mockDockerService.getAllContainers).toHaveBeenCalledWith('NON_EXISTENT_VAR');
    });

    it('should return 500 Internal Server Error when an error occurs', async () => {
      // Mock the docker service to throw an error
      mockDockerService.getAllContainers.mockRejectedValue(new Error('Test error'));

      const response = await request(app).get('/api/containers');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 'error',
        message: 'Test error'
      });
    });
  });

  describe('GET /api/user', () => {
    it('should return user information from headers', async () => {
      // Create a request with mock oauth2-proxy headers
      const response = await request(app)
        .get('/api/user')
        .set('x-user', 'johndoe')
        .set('x-email', 'john.doe@example.com')
        .set('x-groups', 'developers,admins')
        .set('x-access-token', 'gho_16C7e42F292c6912E7710c838347Ae178B4a')
        .set('x-requested-with', 'XMLHttpRequest');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: 'johndoe',
          email: 'john.doe@example.com',
          groups: ['developers', 'admins'],
          accessToken: 'gho_16C7e42F292c6912E7710c838347Ae178B4a',
          requestedWith: 'XMLHttpRequest'
        }
      });
    });

    it('should handle missing headers gracefully', async () => {
      // Create a request without oauth2-proxy headers
      const response = await request(app).get('/api/user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: null,
          email: null,
          groups: [],
          accessToken: null,
          requestedWith: null
        }
      });
    });

    it('should handle partial headers', async () => {
      // Create a request with only some oauth2-proxy headers
      const response = await request(app)
        .get('/api/user')
        .set('x-user', 'johndoe')
        .set('x-email', 'john.doe@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: 'johndoe',
          email: 'john.doe@example.com',
          groups: [],
          accessToken: null,
          requestedWith: null
        }
      });
    });
  });
});
