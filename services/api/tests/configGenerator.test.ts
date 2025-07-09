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

  test('readConfig should read and parse a JSON file', async () => {
    const config = await generator.readConfig('config.json');
    expect(config).toEqual(sampleData);
    expect(fs.promises.readFile).toHaveBeenCalledWith('config.json', 'utf8');
  });

  test('readConfig should use getDockerServices when jsonPath is "docker"', async () => {
    const mockServicesData = {
      services: [
        {
          host: 'example.com',
          cert: {
            file: '/path/to/cert.pem',
            key_file: '/path/to/key.pem'
          },
          service: 'app',
          port: '8080'
        }
      ]
    };

    (getDockerServices as jest.Mock).mockResolvedValue(mockServicesData);

    const config = await generator.readConfig('docker', 'auth-service');

    expect(config).toEqual(mockServicesData);
    expect(getDockerServices).toHaveBeenCalledWith('auth-service');
    expect(fs.promises.readFile).not.toHaveBeenCalled();
  });

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
    const result = await generator.generateConfig('template.mustache', 'config.json', 'output.conf');
    expect(result).toBe(expectedOutput);
    expect(fs.promises.readFile).toHaveBeenCalledWith('template.mustache', 'utf8');
    expect(fs.promises.readFile).toHaveBeenCalledWith('config.json', 'utf8');
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.conf', expectedOutput, 'utf8');
  });

  test('generateConfig should use getDockerServices when jsonPath is "docker"', async () => {
    // Create mock data that matches the sample data used in other tests
    const mockServicesData = {
      services: [
        {
          host: 'example.com',
          cert: {
            file: '/path/to/cert.pem',
            key_file: '/path/to/key.pem'
          },
          service: 'app',
          port: '8080'
        }
      ]
    };

    // Mock getDockerServices to return data that will match the expected output
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);

    // Mock readFile to return the sample template
    (fs.promises.readFile as jest.Mock).mockResolvedValueOnce(sampleTemplate);

    const result = await generator.generateConfig('template.mustache', 'docker', 'output.conf', 'auth-service');

    expect(result).toBe(expectedOutput);
    expect(fs.promises.readFile).toHaveBeenCalledWith('template.mustache', 'utf8');
    expect(getDockerServices).toHaveBeenCalledWith('auth-service');
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.conf', expectedOutput, 'utf8');
  });

  test('generateConfig should handle errors', async () => {
    // Mock readFile to throw an error
    (fs.promises.readFile as unknown as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

    await expect(generator.generateConfig('nonexistent.mustache', 'config.json', 'output.conf'))
      .rejects.toThrow('Failed to read template file: Error: File not found');
  });
});
