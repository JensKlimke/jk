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
    services: [
      {
        host: 'example.com',
        service: 'app',
        port: '8080',
        cert: {
          file: '/path/to/cert.pem',
          key_file: '/path/to/key.pem'
        }
      },
      {
        host: 'another-example.com',
        service: 'api',
        port: '3000',
        cert: {
          file: '/path/to/another-cert.pem',
          key_file: '/path/to/another-key.pem'
        }
      }
    ],
    default_cert: {
      file: '/path/to/default-cert.pem',
      key_file: '/path/to/default-key.pem'
    }
  };

  const expectedServiceOutput = `
server {
    listen 80;
    server_name example.com;


    location / {
        proxy_pass http://app:8080/;
    }
}`;

  const expectedDefaultOutput = `
# Default server configuration
server {
    listen 80 default_server;
    server_name _;

    location / {
        return 404;
    }
}`;

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();

    // Create a new instance of ConfigGenerator
    generator = new ConfigGenerator();

    // Mock fs.promises.readFile for template and JSON
    (fs.promises.readFile as unknown as jest.Mock).mockImplementation((path: string, encoding: string) => {
      if (path === 'template.mustache' || path === 'service.mustache') {
        return Promise.resolve(sampleTemplate);
      } else if (path === 'default.mustache') {
        return Promise.resolve(`
# Default server configuration
server {
    listen 80 default_server;
    server_name _;

    location / {
        return 404;
    }
}`);
      } else if (path === 'config.json') {
        return Promise.resolve(JSON.stringify(sampleData));
      } else if (path.includes('last_config.txt')) {
        // Mock for last config file
        return Promise.resolve(expectedServiceOutput);
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
    // Create a data object with just the first service
    const serviceData = sampleData.services[0];
    const rendered = generator.renderTemplate(sampleTemplate, serviceData);
    expect(rendered).toBe(expectedServiceOutput);
  });

  test('writeConfig should write content to a file', async () => {
    await generator.writeConfig('output.conf', 'content');
    expect(fs.promises.mkdir).toHaveBeenCalledWith(path.dirname('output.conf'), { recursive: true });
    expect(fs.promises.writeFile).toHaveBeenCalledWith('output.conf', 'content', 'utf8');
  });

  test('generateDefaultConfig should generate a default config file', async () => {
    // Mock getDockerServices to return the sample data
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);

    const result = await generator.generateDefaultConfig('default.mustache', 'default.conf');
    expect(result).toBe(expectedDefaultOutput);
    expect(fs.promises.readFile).toHaveBeenCalledWith('default.mustache', 'utf8');
    expect(getDockerServices).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith('default.conf', expectedDefaultOutput, 'utf8');
  });

  test('generateServiceConfigs should generate config files for each service', async () => {
    // Mock getDockerServices to return the sample data
    (getDockerServices as jest.Mock).mockResolvedValue(sampleData);

    const results = await generator.generateServiceConfigs('service.mustache', '/output');
    expect(results.length).toBe(2); // Two services in the sample data
    expect(fs.promises.readFile).toHaveBeenCalledWith('service.mustache', 'utf8');
    expect(getDockerServices).toHaveBeenCalled();

    // Check that a file was written for each service
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join('/output', `service.${sampleData.services[0].host}.conf`),
      expect.any(String),
      'utf8'
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.join('/output', `service.${sampleData.services[1].host}.conf`),
      expect.any(String),
      'utf8'
    );
  });
});
