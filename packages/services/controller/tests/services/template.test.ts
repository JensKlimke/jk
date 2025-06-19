import { TemplateService } from '../../src/services/template';
import { ConfigService } from '../../src/services/config';
import { DockerService } from '../../src/services/docker';
import { Container } from '../../src/services/container';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import logger from "../../src/utils/logger";

// Mock dependencies
jest.mock('../../src/services/config');
jest.mock('../../src/services/docker');
jest.mock('fs-extra');
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('TemplateService', () => {
  let templateService: TemplateService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock ConfigService
    mockConfigService = new ConfigService() as jest.Mocked<ConfigService>;

    // Set up mock ConfigService methods
    mockConfigService.getTemplateDir.mockReturnValue('/template/dir');
    mockConfigService.getOutputDir.mockReturnValue('/output/dir');
    mockConfigService.getCertsDir.mockReturnValue('/certs/dir');

    // Mock DockerService.getAllContainers to return an empty array
    (DockerService.prototype.getAllContainers as jest.Mock).mockResolvedValue([]);

    // Mock DockerService.isContainerRunning
    (DockerService.prototype.isContainerRunning as jest.Mock).mockResolvedValue(true);

    // Create TemplateService with the mock ConfigService
    templateService = new TemplateService(mockConfigService);
  });

  describe('processTemplates', () => {
    // Increase timeout for all tests in this describe block
    jest.setTimeout(30000);

    it('should process mustache templates', async () => {
      // Mock fs.readdir to return mustache template files
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['service.conf.mustache']);

      // Mock fs.stat to indicate they are files
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });

      // Mock fs.ensureDir to do nothing
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);

      // Mock fs.readFile to return template content with auth service information
      (fs.readFile as unknown as jest.Mock).mockResolvedValue('{{#services}}server_name {{host}};{{/services}} auth_name: {{auth.name}}, auth_port: {{auth.port}}, auth_host: {{auth.host}}');

      // Mock DockerService.getAllContainers to return some containers
      const mockContainers = [
        new Container(
          'container1',
          'service1',
          'image1',
          'running',
          '2023-01-01',
          '0.0.0.0:8080->80/tcp',
          {
            VIRTUAL_HOST: 'service1.example.com',
            VIRTUAL_PORT: '8080'
          }
        ),
        new Container(
          'container2',
          'service2',
          'image2',
          'running',
          '2023-01-02',
          '0.0.0.0:8081->80/tcp',
          {
            VIRTUAL_HOST: 'service2.example.com'
          }
        ),
        new Container(
          'container3',
          'oauth2-proxy',
          'oauth2-proxy/oauth2-proxy',
          'running',
          '2023-01-03',
          '0.0.0.0:4180->4180/tcp',
          {
            VIRTUAL_HOST: 'auth.example.com',
            VIRTUAL_PORT: '4180'
          }
        )
      ];
      (DockerService.prototype.getAllContainers as jest.Mock).mockResolvedValue(mockContainers);

      // Mock fs.writeFile to do nothing
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await templateService.processTemplates();

      // Verify output directory was created
      expect(fs.ensureDir).toHaveBeenCalledWith('/output/dir');

      // Verify template files were read
      expect(fs.readdir).toHaveBeenCalledWith('/template/dir');

      // Verify containers were retrieved
      expect(DockerService.prototype.getAllContainers).toHaveBeenCalled();

      // Verify template was read
      expect(fs.readFile).toHaveBeenCalledWith('/template/dir/service.conf.mustache', 'utf8');

      // Capture the rendered content
      const writeFileCalls = (fs.writeFile as unknown as jest.Mock).mock.calls;
      const outputFileCall = writeFileCalls.find(call => call[0] === '/output/dir/service.conf');
      const renderedContent = outputFileCall ? outputFileCall[1] : '';

      // Verify output file was written
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/dir/service.conf',
        expect.any(String)
      );

      // Verify the rendered content includes the correct auth service information
      expect(renderedContent).toContain('auth_name: oauth2-proxy');
      expect(renderedContent).toContain('auth_port: 4180');
      expect(renderedContent).toContain('auth_host: auth.example.com');

      // Verify container count was written
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/dir/.container-count',
        '3'
      );
    });
  });

  describe('copyDefaultConfigs', () => {
    it('should copy all .conf files from template directory to output directory', () => {
      // Mock fs.readdirSync to return some .conf files
      (fs.readdirSync as jest.Mock).mockReturnValue(['default.conf', 'service.conf', 'other.file']);

      // Mock fs.statSync to indicate they are files
      (fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true });

      // Mock fs.ensureDirSync to do nothing
      (fs.ensureDirSync as jest.Mock).mockReturnValue(undefined);

      // Mock fs.copySync to do nothing
      (fs.copySync as jest.Mock).mockReturnValue(undefined);

      // Call the function
      templateService.copyDefaultConfigs();

      // Verify output directory was created
      expect(fs.ensureDirSync).toHaveBeenCalledWith('/output/dir');

      // Verify template directory was read
      expect(fs.readdirSync).toHaveBeenCalledWith('/template/dir');

      // Verify each .conf file was copied
      expect(fs.copySync).toHaveBeenCalledWith('/template/dir/default.conf', '/output/dir/default.conf');
      expect(fs.copySync).toHaveBeenCalledWith('/template/dir/service.conf', '/output/dir/service.conf');

      // Verify non-.conf files were not copied
      expect(fs.copySync).not.toHaveBeenCalledWith('/template/dir/other.file', '/output/dir/other.file');
    });

    it('should handle errors when copying files', () => {
      // Mock fs.readdirSync to throw an error
      const mockError = new Error('Test error');
      (fs.readdirSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      // Mock console.error to capture the error
      const consoleErrorSpy = jest.spyOn(logger, 'error').mockImplementation();

      // Expect the function to throw the error
      expect(() => templateService.copyDefaultConfigs()).toThrow(mockError);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error copying default configuration files:', mockError);

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
