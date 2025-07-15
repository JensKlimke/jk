import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Config } from '../config';

const execAsync = promisify(exec);

/**
 * Certificate Manager for handling SSL certificates
 * Provides functionality for checking, obtaining, and processing certificates
 */
export class CertificateManager {
  private config: Config;

  /**
   * Create a new CertificateManager
   * @param config Configuration object
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Check if default certificate exists and create it if not
   */
  public async checkDefaultCert(): Promise<void> {
    const defaultCertDir = path.join(this.config.certsPath, this.config.defaultDomain);
    const defaultCertPath = path.join(defaultCertDir, 'fullchain.pem');
    const defaultKeyPath = path.join(defaultCertDir, 'privkey.pem');

    // Check if both certificate and key exist
    const certExists = await this.fileExists(defaultCertPath);
    const keyExists = await this.fileExists(defaultKeyPath);

    if (!certExists || !keyExists) {
      console.log('Default certificate does not exist. Creating self-signed certificate...');

      // Create directory if it doesn't exist
      await fs.promises.mkdir(defaultCertDir, { recursive: true });

      // Create self-signed certificate
      await this.createSelfSignedCert(defaultKeyPath, defaultCertPath, this.config.defaultCertCN);

      // Copy certificate files
      await this.copyFile(defaultCertPath, path.join(defaultCertDir, 'chain.pem'));
      await this.copyFile(defaultCertPath, path.join(defaultCertDir, 'cert.pem'));

      console.log('Self-signed default certificate created successfully.');
    } else {
      console.log('Default certificate already exists.');
    }
  }

  /**
   * Obtain or renew certificate for a specific domain
   * @param domain Domain to obtain certificate for
   * @param forceRenewal Force renewal even if certificate is not expired
   */
  public async obtainCert(domain: string, forceRenewal: boolean = false): Promise<void> {
    console.log(`Processing certificate for ${domain}...`);

    const certDir = path.join(this.config.certsPath, domain);
    const certPath = path.join(certDir, 'fullchain.pem');
    const keyPath = path.join(certDir, 'privkey.pem');

    // Check if domain is localhost or contains localhost
    if (domain.includes('localhost')) {
      await this.handleLocalDomain(domain, certDir, certPath, keyPath, forceRenewal);
    } else {
      // For non-localhost domains, use certbot
      await this.handleRemoteDomain(domain, forceRenewal);
    }
  }

  /**
   * Process multiple domains for certificate operations
   * @param domains Array of domains to process
   */
  public async processDomains(domains: string[]): Promise<void> {
    for (const domain of domains) {
      const certPath = path.join(this.config.certsPath, domain, 'fullchain.pem');
      const certExists = await this.fileExists(certPath);

      if (!certExists) {
        console.log(`Certificate for ${domain} does not exist. Obtaining immediately...`);
        try {
          await this.obtainCert(domain, true);
        } catch (error) {
          console.error(`Failed to obtain certificate for ${domain}: ${error}`);
          continue;
        }
      } else {
        console.log(`Certificate for ${domain} already exists. Setting up renewal schedule...`);
        try {
          await this.obtainCert(domain, false);
        } catch (error) {
          console.error(`Failed to renew certificate for ${domain}: ${error}`);
          continue;
        }
      }
    }
  }

  /**
   * Delete certificate for a domain
   * @param domain Domain to delete certificate for
   */
  public async deleteCert(domain: string): Promise<void> {
    const certDir = path.join(this.config.certsPath, domain);

    // Check if domain is localhost or contains localhost
    if (domain.includes('localhost')) {
      console.log(`Removing self-signed certificate for ${domain}...`);
      try {
        await fs.promises.rm(certDir, { recursive: true, force: true });
      } catch (error) {
        throw new Error(`Failed to remove certificate directory for ${domain}: ${error}`);
      }
    } else {
      // For non-localhost domains, use certbot
      try {
        const { stdout, stderr } = await execAsync(`certbot delete --cert-name ${domain} --non-interactive`);
        if (stderr) {
          console.warn(`Warning while deleting certificate for ${domain}: ${stderr}`);
        }
      } catch (error) {
        throw new Error(`Failed to delete certificate for ${domain}: ${error}`);
      }
    }

    console.log(`Certificate for ${domain} deleted successfully.`);
  }

  /**
   * Create a self-signed certificate
   * @param keyPath Path to write the key file
   * @param certPath Path to write the certificate file
   * @param domain Domain for the certificate
   */
  private async createSelfSignedCert(keyPath: string, certPath: string, domain: string): Promise<void> {
    try {
      const command = [
        'openssl',
        'req', '-x509', '-nodes', '-newkey', 'rsa:2048', '-days', '3650',
        '-keyout', keyPath,
        '-out', certPath,
        '-subj', `/CN=${domain}`,
        '-addext', `subjectAltName=DNS:${domain}`
      ].join(' ');

      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.warn(`Warning while creating self-signed certificate for ${domain}: ${stderr}`);
      }
    } catch (error) {
      throw new Error(`Failed to create self-signed certificate for ${domain}: ${error}`);
    }
  }

  /**
   * Handle certificate for localhost domains
   * @param domain Domain to handle
   * @param certDir Directory to store certificate
   * @param certPath Path to write the certificate file
   * @param keyPath Path to write the key file
   * @param forceRenewal Force renewal even if certificate is not expired
   */
  private async handleLocalDomain(
    domain: string,
    certDir: string,
    certPath: string,
    keyPath: string,
    forceRenewal: boolean
  ): Promise<void> {
    console.log(`Domain ${domain} contains 'localhost'. Creating self-signed certificate...`);

    // Create directory if it doesn't exist
    await fs.promises.mkdir(certDir, { recursive: true });

    // Only create new certificate if it doesn't exist or force renewal is true
    const certExists = await this.fileExists(certPath);
    if (!certExists || forceRenewal) {
      await this.createSelfSignedCert(keyPath, certPath, domain);

      // Copy certificate files
      await this.copyFile(certPath, path.join(certDir, 'chain.pem'));
      await this.copyFile(certPath, path.join(certDir, 'cert.pem'));

      console.log(`Self-signed certificate for ${domain} created successfully.`);
    } else {
      console.log(`Self-signed certificate for ${domain} already exists.`);
    }
  }

  /**
   * Handle certificate for remote domains using certbot
   * @param domain Domain to handle
   * @param forceRenewal Force renewal even if certificate is not expired
   */
  private async handleRemoteDomain(domain: string, forceRenewal: boolean): Promise<void> {
    try {
      const args = [
        'certonly',
        '--webroot',
        `--webroot-path=${this.config.webrootPath}`,
        '--email', this.config.email,
        '--agree-tos',
        '--no-eff-email',
        '-d', domain
      ];

      if (forceRenewal) {
        console.log(`Forcing renewal for ${domain}...`);
        args.push('--force-renewal');
      } else {
        console.log(`Standard renewal check for ${domain}...`);
        args.push('--keep');
      }

      const command = `certbot ${args.join(' ')}`;
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.warn(`Warning while obtaining certificate for ${domain}: ${stderr}`);
      }

      console.log(`Certificate operation for ${domain} completed successfully.`);
    } catch (error) {
      throw new Error(`Certificate operation for ${domain} failed: ${error}`);
    }
  }

  /**
   * Check if a file exists
   * @param filename Path to the file
   * @returns True if the file exists, false otherwise
   */
  private async fileExists(filename: string): Promise<boolean> {
    try {
      const stat = await fs.promises.stat(filename);
      return stat.isFile();
    } catch (error) {
      return false;
    }
  }

  /**
   * Copy a file from source to destination
   * @param src Source file path
   * @param dst Destination file path
   */
  private async copyFile(src: string, dst: string): Promise<void> {
    try {
      const data = await fs.promises.readFile(src);
      await fs.promises.writeFile(dst, data);
    } catch (error) {
      throw new Error(`Failed to copy file from ${src} to ${dst}: ${error}`);
    }
  }
}