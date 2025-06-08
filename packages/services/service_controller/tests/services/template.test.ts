import { TemplateService } from '../../src/services/template';
import { ConfigService } from '../../src/services/config';
import * as fs from 'fs-extra';
import { exec } from 'child_process';

// Mock dependencies
jest.mock('../../src/services/config');
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
    mockConfigService.getDomain.mockReturnValue('example.com');
    mockConfigService.getTemplateDir.mockReturnValue('/template/dir');
    mockConfigService.getOutputDir.mockReturnValue('/output/dir');
    mockConfigService.getCertsDir.mockReturnValue('/certs/dir');

    // Create TemplateService with the mock ConfigService
    templateService = new TemplateService(mockConfigService);
  });

  describe('processTemplates', () => {
    it('should process regular config files', async () => {
      // Mock fs.readdir to return template files
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['regular.conf', 'another.incl']);

      // Mock fs.stat to indicate they are files
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });

      // Mock fs.ensureDir to do nothing
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);

      // Mock fs.readFile to return template content
      (fs.readFile as unknown as jest.Mock).mockResolvedValue('server_name {{ domain }};\nsome other content');

      // Mock fs.writeFile to do nothing
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await templateService.processTemplates();

      // Verify output directory was created
      expect(fs.ensureDir).toHaveBeenCalledWith('/output/dir');

      // Verify template files were read
      expect(fs.readdir).toHaveBeenCalledWith('/template/dir');

      // Verify file content was read and written with replacements
      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/dir/regular.conf',
        'server_name example.com;\nsome other content',
      );
    });

    it('should process secure config files when oauth2-proxy is running and certificates exist', async () => {
      // Mock fs.readdir to return a secure config file
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['secure.sec.conf']);

      // Mock fs.stat to indicate it is a file
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });

      // Mock fs.ensureDir to do nothing
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);

      // Mock fs.readFile to return template content with certificate paths
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(
        'server_name secure.{{ domain }};\n' +
          'ssl_certificate /etc/nginx/certs/secure.{{ domain }}/fullchain.pem;\n' +
          'ssl_certificate_key /etc/nginx/certs/secure.{{ domain }}/privkey.pem;',
      );

      // Mock exec to indicate oauth2-proxy is running
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'running\n', stderr: '' });
      });

      // Mock fs.pathExists to indicate certificate files exist
      (fs.pathExists as jest.Mock).mockResolvedValue(true);

      // Mock fs.writeFile to do nothing
      (fs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

      await templateService.processTemplates();

      // Verify oauth2-proxy check was performed
      expect(exec).toHaveBeenCalledWith(expect.stringContaining('docker ps'), expect.any(Function));

      // Verify certificate paths were checked
      expect(fs.pathExists).toHaveBeenCalledTimes(2);

      // Verify file was written with replacements
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/dir/secure.sec.conf',
        'server_name secure.example.com;\n' +
          'ssl_certificate /etc/nginx/certs/secure.example.com/fullchain.pem;\n' +
          'ssl_certificate_key /etc/nginx/certs/secure.example.com/privkey.pem;',
      );
    });

    it('should skip secure config files when oauth2-proxy is not running', async () => {
      // Mock fs.readdir to return a secure config file
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['secure.sec.conf']);

      // Mock fs.stat to indicate it is a file
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });

      // Mock fs.ensureDir to do nothing
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);

      // Mock fs.readFile to return template content
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(
        'server_name secure.{{ domain }};\n' +
          'ssl_certificate /etc/nginx/certs/secure.{{ domain }}/fullchain.pem;\n' +
          'ssl_certificate_key /etc/nginx/certs/secure.{{ domain }}/privkey.pem;',
      );

      // Mock exec to indicate oauth2-proxy is not running
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'stopped\n', stderr: '' });
      });

      await templateService.processTemplates();

      // Verify oauth2-proxy check was performed
      expect(exec).toHaveBeenCalledWith(expect.stringContaining('docker ps'), expect.any(Function));

      // Verify no file was written
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should skip secure config files when certificates do not exist', async () => {
      // Mock fs.readdir to return a secure config file
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['secure.sec.conf']);

      // Mock fs.stat to indicate it is a file
      (fs.stat as unknown as jest.Mock).mockResolvedValue({ isFile: () => true });

      // Mock fs.ensureDir to do nothing
      (fs.ensureDir as unknown as jest.Mock).mockResolvedValue(undefined);

      // Mock fs.readFile to return template content
      (fs.readFile as unknown as jest.Mock).mockResolvedValue(
        'server_name secure.{{ domain }};\n' +
          'ssl_certificate /etc/nginx/certs/secure.{{ domain }}/fullchain.pem;\n' +
          'ssl_certificate_key /etc/nginx/certs/secure.{{ domain }}/privkey.pem;',
      );

      // Mock exec to indicate oauth2-proxy is running
      (exec as unknown as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'running\n', stderr: '' });
      });

      // Mock fs.pathExists to indicate certificate files do not exist
      (fs.pathExists as unknown as jest.Mock).mockResolvedValue(false);

      await templateService.processTemplates();

      // Verify certificate paths were checked
      expect(fs.pathExists).toHaveBeenCalledTimes(1);

      // Verify no file was written
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('shouldProcessTemplates', () => {
    it('should return true when output directory does not exist', async () => {
      // Mock fs.pathExists to indicate output directory does not exist
      (fs.pathExists as unknown as jest.Mock).mockResolvedValueOnce(false);

      const result = await templateService.shouldProcessTemplates();

      expect(result).toBe(true);
      expect(fs.pathExists).toHaveBeenCalledWith('/output/dir');
    });

    it('should return true when output directory is empty', async () => {
      // Mock fs.pathExists to indicate output directory exists
      (fs.pathExists as unknown as jest.Mock).mockResolvedValueOnce(true);

      // Mock fs.readdir to return empty array
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce([]);

      const result = await templateService.shouldProcessTemplates();

      expect(result).toBe(true);
      expect(fs.readdir).toHaveBeenCalledWith('/output/dir');
    });

    it('should return true when a template file is newer than output file', async () => {
      // Mock fs.pathExists to indicate output directory and file exist
      (fs.pathExists as unknown as jest.Mock).mockResolvedValue(true);

      // Mock fs.readdir for output directory
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['file.conf']);

      // Mock fs.readdir for template directory
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['file.conf']);

      // Mock fs.stat to indicate template file is newer
      (fs.stat as unknown as jest.Mock)
        .mockResolvedValueOnce({ mtime: new Date(2023, 1, 2) }) // template file
        .mockResolvedValueOnce({ mtime: new Date(2023, 1, 1) }); // output file

      const result = await templateService.shouldProcessTemplates();

      expect(result).toBe(true);
      expect(fs.stat).toHaveBeenCalledTimes(2);
    });

    it('should return false when all template files are older than output files', async () => {
      // Mock fs.pathExists to indicate output directory and file exist
      (fs.pathExists as unknown as jest.Mock).mockResolvedValue(true);

      // Mock fs.readdir for output directory
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['file.conf']);

      // Mock fs.readdir for template directory
      (fs.readdir as unknown as jest.Mock).mockResolvedValueOnce(['file.conf']);

      // Mock fs.stat to indicate template file is older
      (fs.stat as unknown as jest.Mock)
        .mockResolvedValueOnce({ mtime: new Date(2023, 1, 1) }) // template file
        .mockResolvedValueOnce({ mtime: new Date(2023, 1, 2) }); // output file

      const result = await templateService.shouldProcessTemplates();

      expect(result).toBe(false);
      expect(fs.stat).toHaveBeenCalledTimes(2);
    });
  });
});
