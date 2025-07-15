import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { CertificateManager } from '../src/controllers/certificateManager';
import { Config } from '../src/config';

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rm: jest.fn()
  }
}));

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('CertificateManager', () => {
  let certManager: CertificateManager;
  let mockConfig: Config;

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();

    // Create mock config
    mockConfig = {
      certsPath: '/etc/letsencrypt/live',
      webrootPath: '/var/www/html',
      defaultDomain: 'default',
      defaultCertCN: 'default.local',
      email: 'test@example.com'
    };

    // Create certificate manager with mock config
    certManager = new CertificateManager(mockConfig);

    // Mock exec to return a resolved promise
    (exec as unknown as jest.Mock).mockImplementation((command, callback) => {
      if (callback) {
        callback(null, { stdout: 'Success', stderr: '' });
      }
      return {
        stdout: 'Success',
        stderr: ''
      };
    });
  });

  describe('checkDefaultCert', () => {
    test('should create default certificate if it does not exist', async () => {
      // Mock fs.promises.stat to simulate files not existing
      (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      await certManager.checkDefaultCert();

      // Check that mkdir was called to create the directory
      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        path.join(mockConfig.certsPath, mockConfig.defaultDomain),
        { recursive: true }
      );

      // Check that exec was called to create the certificate
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('openssl'),
        expect.any(Function)
      );

      // Check that writeFile was called to copy the certificate
      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });

    test('should not create default certificate if it already exists', async () => {
      // Mock fs.promises.stat to simulate files existing
      (fs.promises.stat as jest.Mock).mockResolvedValue({ isFile: () => true });

      await certManager.checkDefaultCert();

      // Check that mkdir was not called
      expect(fs.promises.mkdir).not.toHaveBeenCalled();

      // Check that exec was not called
      expect(exec).not.toHaveBeenCalled();

      // Check that writeFile was not called
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('obtainCert', () => {
    test('should handle localhost domains with self-signed certificates', async () => {
      // Mock fs.promises.stat to simulate files not existing
      (fs.promises.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

      await certManager.obtainCert('localhost', false);

      // Check that mkdir was called to create the directory
      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        path.join(mockConfig.certsPath, 'localhost'),
        { recursive: true }
      );

      // Check that exec was called to create the certificate
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('openssl'),
        expect.any(Function)
      );
    });

    test('should handle remote domains with certbot', async () => {
      await certManager.obtainCert('example.com', false);

      // Check that exec was called with certbot
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('certbot'),
        expect.any(Function)
      );
    });

    test('should force renewal when specified', async () => {
      await certManager.obtainCert('example.com', true);

      // Check that exec was called with force-renewal
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('--force-renewal'),
        expect.any(Function)
      );
    });
  });

  describe('processDomains', () => {
    test('should process multiple domains', async () => {
      // Mock fs.promises.stat to simulate some files existing and some not
      (fs.promises.stat as jest.Mock).mockImplementation((path) => {
        if (path.includes('example.com')) {
          return Promise.resolve({ isFile: () => true });
        }
        return Promise.reject(new Error('File not found'));
      });

      await certManager.processDomains(['example.com', 'test.com']);

      // Check that obtainCert was called for both domains
      expect(exec).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteCert', () => {
    test('should delete localhost certificates by removing directory', async () => {
      await certManager.deleteCert('localhost');

      // Check that rm was called to remove the directory
      expect(fs.promises.rm).toHaveBeenCalledWith(
        path.join(mockConfig.certsPath, 'localhost'),
        { recursive: true, force: true }
      );
    });

    test('should delete remote certificates using certbot', async () => {
      await certManager.deleteCert('example.com');

      // Check that exec was called with certbot delete
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('certbot delete'),
        expect.any(Function)
      );
    });
  });
});