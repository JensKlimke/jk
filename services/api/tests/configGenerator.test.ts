import * as path from 'path';
import * as fs from 'fs';
import { ConfigGenerator } from '../src';
import { getDockerServices } from '../src/controllers/getDockerServices';

// Mock fs.promises to avoid actual file operations during tests
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn()
  }
}));

// Mock getDockerServices to avoid actual Docker calls during tests
jest.mock('../src/controllers/getDockerServices', () => ({
  getDockerServices: jest.fn()
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('ConfigGenerator', () => {
  let generator: ConfigGenerator;

  // Sample template and data for testing
  const sampleTemplate = `
server {
    listen 80;
    server_name {{host}};

    {{#ssl}}
    # SSL configuration
    ssl_certificate {{{cert_file}}};
    ssl_certificate_key {{{key_file}}};
    {{/ssl}}

    location / {
        proxy_pass http://{{service}}:{{port}}/;
    }
}`;

  const sampleData = {
    host: 'example.com',
    ssl: true,
    cert_file: '/path/to/cert.pem',
    key_file: '/path/to/key.pem',
    service: 'app',
    port: '8080'
  };

  const expectedOutput = `
server {
    listen 80;
    server_name example.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://app:8080/;
    }
}`;

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();

    // Create a new instance of ConfigGenerator
    generator = new ConfigGenerator();

    // Mock fs.promises.readFile for template and JSON
    (fs.promises.readFile as unknown as jest.Mock).mockImplementation((path: string, encoding: string) => {
      if (path === 'template.mustache') {
        return Promise.resolve(sampleTemplate);
      } else if (path === 'config.json') {
        return Promise.resolve(JSON.stringify(sampleData));
      } else if (path.includes('last_config.txt')) {
        // Mock for last config file
        return Promise.resolve(expectedOutput);
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    // Mock fs.promises.writeFile
    (fs.promises.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);

    // Mock fs.promises.mkdir
    (fs.promises.mkdir as unknown as jest.Mock).mockResolvedValue(undefined);
  });

  test('readTemplate should read a template file', async () => {
    const template = await generator.readTemplate('template.mustache');
    expect(template).toBe(sampleTemplate);
    expect(fs.promises.readFile).toHaveBeenCalledWith('template.mustache', 'utf8');
  });

  // Tests for readConfig method have been removed as the method no longer exists

  test('renderTemplate should render a template with data', () => {
    const rendered = generator.renderTemplate(sampleTemplate, sampleData);
    expect(rendered).toBe(expectedOutput);
  });

  test('writeConfig should write content to a file', async () => {
    await generator.writeConfig('output.conf', 'content');
    expect(fs.promises.mkdir).toHaveBeenCalledWith(path.dirname('output.conf'), { recursive: true });
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.conf', 'content', 'utf8');
  });

  test('generateConfig should generate a config file', async () => {
    // Mock getDockerServices to return the sample data
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);
    
    // Mock hasConfigChanged to return true (config has changed)
    (fs.promises.readFile as unknown as jest.Mock).mockImplementation((path: string, encoding: string) => {
      if (path === 'template.mustache') {
        return Promise.resolve(sampleTemplate);
      } else if (path.includes('last_config.txt')) {
        // Return a different config to simulate a change
        return Promise.resolve('different config');
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    const result = await generator.generateConfig('template.mustache', 'output.conf');
    expect(result).toBe(expectedOutput);
    expect(fs.promises.readFile).toHaveBeenCalledWith('template.mustache', 'utf8');
    expect(getDockerServices).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.conf', expectedOutput, 'utf8');
    
    // Check that the config was logged and saved
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/config_'),
      expectedOutput,
      'utf8'
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/last_config.txt'),
      expectedOutput,
      'utf8'
    );
  });

  test('generateConfig should not log if config has not changed', async () => {
    // Mock getDockerServices to return the sample data
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);
    
    // Mock hasConfigChanged to return false (config has not changed)
    (fs.promises.readFile as unknown as jest.Mock).mockImplementation((path: string, encoding: string) => {
      if (path === 'template.mustache') {
        return Promise.resolve(sampleTemplate);
      } else if (path.includes('last_config.txt')) {
        // Return the same config to simulate no change
        return Promise.resolve(expectedOutput);
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    const result = await generator.generateConfig('template.mustache', 'output.conf');
    expect(result).toBe(expectedOutput);
    
    // Check that the config was not logged
    expect(fs.promises.writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/config_'),
      expectedOutput,
      'utf8'
    );
    // Check that the last config was not updated
    expect(fs.promises.writeFile).not.toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/last_config.txt'),
      expectedOutput,
      'utf8'
    );
  });

  test('generateConfig should handle errors', async () => {
    // Mock readFile to throw an error
    (fs.promises.readFile as unknown as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

    await expect(generator.generateConfig('nonexistent.mustache', 'output.conf'))
      .rejects.toThrow('Failed to read template file: Error: File not found');
  });

  test('generateConfig should handle errors when checking if config has changed', async () => {
    // Mock getDockerServices to return the sample data
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);
    
    // Mock readFile to throw an error when reading last_config.txt
    (fs.promises.readFile as unknown as jest.Mock).mockImplementation((path: string, encoding: string) => {
      if (path === 'template.mustache') {
        return Promise.resolve(sampleTemplate);
      } else if (path.includes('last_config.txt')) {
        return Promise.reject(new Error('File not found'));
      }
      return Promise.reject(new Error(`File not found: ${path}`));
    });

    const result = await generator.generateConfig('template.mustache', 'output.conf');
    expect(result).toBe(expectedOutput);
    
    // Check that the config was logged and saved (since file not found is treated as config changed)
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/config_'),
      expectedOutput,
      'utf8'
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('/app/logs/last_config.txt'),
      expectedOutput,
      'utf8'
    );
  });
});