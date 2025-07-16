import * as fs from 'fs';
import * as path from 'path';
import { WhoamiInfo } from '../src/services/whoami.service';

// Mock winston before importing any module that uses it
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  default: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

import { TemplateService } from '../src/services/template.service';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  },
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

describe('TemplateService', () => {
  let templateService: TemplateService;
  const mockTemplatesDir = '/mock/templates';

  beforeEach(() => {
    // Create a new instance with a mock templates directory
    templateService = new TemplateService(mockTemplatesDir);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default templates directory if not provided', () => {
      // Create a new instance without specifying templatesDir
      const defaultTemplateService = new TemplateService();

      // Verify that the default path is used (contains '../templates')
      expect((defaultTemplateService as any).templatesDir).toContain('templates');
    });
  });

  describe('renderHtml', () => {
    it('should render HTML using a mustache template', async () => {
      // Mock template content
      const mockTemplate = '<html><body><h1>{{hostname}}</h1><p>{{apiId}}</p></body></html>';

      // Mock fs.promises.readFile to return the mock template
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockTemplate);

      // Test data
      const data = {
        hostname: 'test-host',
        apiId: 'test-id'
      };

      // Call the method
      const result = await templateService.renderHtml('test-template', data);

      // Verify fs.promises.readFile was called with the correct path
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        path.join(mockTemplatesDir, 'test-template.mustache'),
        'utf-8'
      );

      // Verify the rendered HTML
      expect(result).toBe('<html><body><h1>test-host</h1><p>test-id</p></body></html>');
    });

    it('should throw an error if template file cannot be read', async () => {
      // Mock fs.promises.readFile to throw an error
      const mockError = new Error('File not found');
      (fs.promises.readFile as jest.Mock).mockRejectedValue(mockError);

      // Call the method and expect it to throw
      await expect(templateService.renderHtml('non-existent', {}))
        .rejects
        .toThrow('Failed to render template non-existent: Error: File not found');
    });
  });

  describe('renderWhoamiInfo', () => {
    it('should transform and render whoami info as HTML', async () => {
      // Mock renderHtml method
      const renderHtmlSpy = jest.spyOn(templateService, 'renderHtml').mockResolvedValue('<html>mocked</html>');

      // Mock whoami info
      const mockWhoamiInfo: WhoamiInfo = {
        hostname: 'test-host',
        ips: ['192.168.1.1', '127.0.0.1'],
        remoteAddr: '10.0.0.1:12345',
        headers: {
          'user-agent': 'test-agent',
          'host': 'example.com'
        },
        apiId: 'test-api-id'
      };

      // Call the method
      const result = await templateService.renderWhoamiInfo(mockWhoamiInfo);

      // Verify renderHtml was called with the correct template name
      expect(renderHtmlSpy).toHaveBeenCalledWith('whoami', expect.objectContaining({
        hostname: 'test-host',
        apiId: 'test-api-id',
        headers: expect.arrayContaining([
          expect.objectContaining({ key: 'user-agent', value: 'test-agent' }),
          expect.objectContaining({ key: 'host', value: 'example.com' })
        ]),
        ips: expect.arrayContaining([
          expect.objectContaining({ value: '192.168.1.1', last: false }),
          expect.objectContaining({ value: '127.0.0.1', last: true })
        ])
      }));

      // Verify the result
      expect(result).toBe('<html>mocked</html>');
    });

    it('should handle null or undefined header values', async () => {
      // Mock renderHtml method
      const renderHtmlSpy = jest.spyOn(templateService, 'renderHtml').mockResolvedValue('<html>mocked</html>');

      // Mock whoami info with null and undefined header values
      const mockWhoamiInfo: WhoamiInfo = {
        hostname: 'test-host',
        ips: ['192.168.1.1'],
        remoteAddr: '10.0.0.1:12345',
        headers: {
          'null-header': null as any,
          'undefined-header': undefined
        },
        apiId: 'test-api-id'
      };

      // Call the method
      const result = await templateService.renderWhoamiInfo(mockWhoamiInfo);

      // Verify renderHtml was called with empty strings for null/undefined values
      expect(renderHtmlSpy).toHaveBeenCalledWith('whoami', expect.objectContaining({
        headers: expect.arrayContaining([
          expect.objectContaining({ key: 'null-header', value: '' }),
          expect.objectContaining({ key: 'undefined-header', value: '' })
        ])
      }));

      // Verify the result
      expect(result).toBe('<html>mocked</html>');
    });
  });
});
