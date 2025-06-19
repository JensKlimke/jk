import * as path from 'path';

import * as fs from 'fs-extra';
import * as mustache from 'mustache';
import logger from '../utils/logger';

import {ConfigService} from './config';
import {Container} from './container';
import {DockerService} from './docker';

/**
 * Interface representing a service for Nginx configuration
 */
export interface Service {
  service: string;
  host: string;
  port: number;
  cert: boolean;
  auth: boolean;
  auth_headers: boolean;
  certificate_file?: string;
  certificate_key_file?: string;
}

/**
 * Service for processing Nginx configuration templates
 */
export class TemplateService {
  private configService: ConfigService;
  private dockerService: DockerService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.dockerService = new DockerService();
  }

  /**
   * Create a service object from container information
   * @param container The container information
   * @returns A service object for the mustache template
   */
  private createServiceObject(container: Container): Service {
    // Extract the service name from the container name
    const service = container.name;

    // Extract the port from the VIRTUAL_PORT environment variable, or use the first exposed port, or use a default
    let port = 80; // Default port
    if (container.env.VIRTUAL_PORT) {
      port = parseInt(container.env.VIRTUAL_PORT, 10);
    } else {
      const exposedPort = container.getFirstExposedPort();
      if (exposedPort !== null) {
        port = exposedPort;
      }
    }

    // Extract the host from the VIRTUAL_HOST environment variable or use service name
    // Make sure to extract only the hostname part without any newlines or other environment variables
    let host = '';
    if (container.env.VIRTUAL_HOST) {
      // Extract only the first line and remove any trailing characters
      host = container.env.VIRTUAL_HOST.split('\n')[0].trim();
    } else {
      host = service;
    }

    // Check if certificates exist
    const certsDir = this.configService.getCertsDir();
    const certificateFile = path.join(certsDir, host, 'fullchain.pem');
    const certificateKeyFile = path.join(certsDir, host, 'privkey.pem');

    // Create the service object
    return {
      service,
      host,
      port,
      cert: fs.existsSync(certificateFile) && fs.existsSync(certificateKeyFile),
      auth: container.env.REQUIRE_AUTH === 'true',
      auth_headers: container.env.REQUIRE_AUTH === 'true',
      certificate_file: certificateFile,
      certificate_key_file: certificateKeyFile
    };
  }



  /**
   * Process all template files
   */
  async processTemplates(): Promise<void> {
    logger.info(`Processing templates at ${new Date().toISOString()}`);

    const templateDir = this.configService.getTemplateDir();
    const outputDir = this.configService.getOutputDir();

    // Ensure the output directory exists
    await fs.ensureDir(outputDir);

    try {
      // Get all files in the template directory
      const files = await fs.readdir(templateDir);

      // Process mustache templates
      const mustacheFiles = files.filter(file => file.endsWith('.mustache'));

      // Get all running containers
      const containers = await this.dockerService.getAllContainers();

      // Create an array of service objects for all valid containers
      // This is moved outside the loop since it doesn't change depending on the template file
      const services: Service[] = [];
      for (const container of containers) {
        // Skip containers without VIRTUAL_HOST
        logger.debug(`Processing container ${container.name} ${container.env.VIRTUAL_HOST}`);
        if (!container.env.VIRTUAL_HOST) {
          continue;
        }

        // Create service object
        const serviceObject = this.createServiceObject(container);
        services.push(serviceObject);
      }

      // Find the auth service from the services array
      let authService = process.env.AUTH_SERVICE || 'oauth2-proxy';
      let authPort = 4180; // Default port for oauth2-proxy
      let authHost = `auth.${process.env.DOMAIN || 'localhost'}`;

      // Look for the auth service in the containers
      const authContainer = containers.find(container => 
        container.name === authService || container.name.includes('auth') || container.name.includes('oauth')
      );

      if (authContainer) {
        authService = authContainer.name;
        authPort = authContainer.env.VIRTUAL_PORT ? parseInt(authContainer.env.VIRTUAL_PORT, 10) : authPort;
        authHost = authContainer.env.VIRTUAL_HOST ? 
          authContainer.env.VIRTUAL_HOST.split('\n')[0].trim() : 
          authHost;
        logger.info(`Found auth service: ${authService}, port: ${authPort}, host: ${authHost}`);
      } else {
        logger.info(`Auth service not found in containers, using defaults: ${authService}, port: ${authPort}, host: ${authHost}`);
      }

      // Create a configuration object with services array and general configuration
      const config = {
        services,
        auth: {
          name: authService,
          port: authPort,
          host: authHost
        }
      };

      // Update the container count file for change detection
      const containerCountPath = path.join(outputDir, '.container-count');
      await fs.writeFile(containerCountPath, services.length.toString());

      for (const filename of mustacheFiles) {
        const filePath = path.join(templateDir, filename);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          logger.info(`Processing mustache template ${filename}`);

          // Read the template content
          const templateContent = await fs.readFile(filePath, 'utf8');

          // Generate the output filename
          const outputFilename = filename.replace('.mustache', '');

          // Render the template with the configuration object
          const renderedContent = mustache.render(templateContent, config);

          // Write the output file
          await fs.writeFile(path.join(outputDir, outputFilename), renderedContent);
          logger.info(`Generated ${outputFilename}`);
        }
      }

      logger.info('Configuration files have been processed and placed in the output directory');
    } catch (error) {
      logger.error('Error processing templates:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  /**
   * Copy default configuration files from template directory to output directory
   */
  copyDefaultConfigs(): void {
    try {
      const templateDir = this.configService.getTemplateDir();
      const outputDir = this.configService.getOutputDir();

      // Ensure the output directory exists
      fs.ensureDirSync(outputDir);

      // Get all .conf files in the template directory
      const files = fs.readdirSync(templateDir);
      const confFiles = files.filter(file => file.endsWith('.conf'));

      // Copy each .conf file to the output directory
      for (const file of confFiles) {
        const sourcePath = path.join(templateDir, file);
        const destPath = path.join(outputDir, file);

        // Check if it's a file before copying
        if (fs.statSync(sourcePath).isFile()) {
          fs.copySync(sourcePath, destPath);
          logger.info(`Copied default config: ${file}`);
        }
      }

      logger.info('Default configuration files have been copied to the output directory');
    } catch (error) {
      logger.error('Error copying default configuration files:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}
