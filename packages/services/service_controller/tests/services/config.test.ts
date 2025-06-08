import { ConfigService } from '../../src/services/config';

describe('ConfigService', () => {
  // Save original environment
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment after all tests
    process.env = originalEnv;
  });

  it('should use default values when environment variables are not set', () => {
    // Clear relevant environment variables
    delete process.env.DOMAIN;
    delete process.env.TEMPLATE_DIR;
    delete process.env.OUTPUT_DIR;
    delete process.env.CERTS_DIR;

    const configService = new ConfigService();

    expect(configService.getDomain()).toBe('localhost');
    expect(configService.getTemplateDir()).toBe('/etc/nginx/conf.d.tmpl');
    expect(configService.getOutputDir()).toBe('/etc/nginx/conf.d');
    expect(configService.getCertsDir()).toBe('/etc/nginx/certs');
  });

  it('should use environment variables when they are set', () => {
    // Set environment variables
    process.env.DOMAIN = 'example.com';
    process.env.TEMPLATE_DIR = '/custom/template/dir';
    process.env.OUTPUT_DIR = '/custom/output/dir';
    process.env.CERTS_DIR = '/custom/certs/dir';

    const configService = new ConfigService();

    expect(configService.getDomain()).toBe('example.com');
    expect(configService.getTemplateDir()).toBe('/custom/template/dir');
    expect(configService.getOutputDir()).toBe('/custom/output/dir');
    expect(configService.getCertsDir()).toBe('/custom/certs/dir');
  });
});
