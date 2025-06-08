import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import * as fs from 'fs-extra';

import { ConfigService } from './config';

const execAsync = promisify(exec);

/**
 * Service for processing Nginx configuration templates
 */
export class TemplateService {
  private configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * Process all template files
   */
  async processTemplates(): Promise<void> {
    console.log(`Processing templates at ${new Date().toISOString()}`);

    const templateDir = this.configService.getTemplateDir();
    const outputDir = this.configService.getOutputDir();
    const domain = this.configService.getDomain();
    // const certsDir = this.configService.getCertsDir();

    // Ensure the output directory exists
    await fs.ensureDir(outputDir);

    try {
      // Get all .conf and .incl files in the template directory
      const files = await fs.readdir(templateDir);
      const templateFiles = files.filter(file => file.endsWith('.conf') || file.endsWith('.incl'));

      for (const filename of templateFiles) {
        const filePath = path.join(templateDir, filename);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          // Check if this is a secure config file (.sec.conf)
          if (filename.endsWith('.sec.conf')) {
            // Read the file content
            const content = await fs.readFile(filePath, 'utf8');

            // Extract server_name from the file
            const serverNameMatch = content.match(/server_name\s+([^;]+);/);
            if (!serverNameMatch) {
              console.error(`Could not extract server_name from ${filename}, skipping`);
              continue;
            }

            const serverName = serverNameMatch[1].replace(/{{ domain }}/g, domain);

            // Check if oauth2-proxy service is running
            console.log(`Checking if oauth2-proxy service is running for ${filename}...`);
            try {
              const { stdout } = await execAsync(
                `docker ps --format '{{.Names}}' | grep -q "oauth2-proxy" && echo "running" || echo "stopped"`,
              );
              if (stdout.trim() !== 'running') {
                console.log(`oauth2-proxy service is not running, skipping ${filename}`);
                continue;
              }
            } catch (error) {
              console.error(`Error checking if oauth2-proxy service is running:`, error);
              continue;
            }

            // Extract certificate paths and replace domain placeholder
            const certPathMatch = content.match(/ssl_certificate\s+([^;]+);/);
            const keyPathMatch = content.match(/ssl_certificate_key\s+([^;]+);/);

            if (!certPathMatch || !keyPathMatch) {
              console.error(`Could not extract certificate paths from ${filename}, skipping`);
              continue;
            }

            const certPath = certPathMatch[1].replace(/{{ domain }}/g, domain);
            const keyPath = keyPathMatch[1].replace(/{{ domain }}/g, domain);

            console.log(`Checking certificate files for ${serverName}:`);
            console.log(`  - Certificate: ${certPath}`);
            console.log(`  - Key: ${keyPath}`);

            // Check if both certificate files exist
            if ((await fs.pathExists(certPath)) && (await fs.pathExists(keyPath))) {
              console.log(`Certificate files found, processing ${filename}`);
              const processedContent = content.replace(/{{ domain }}/g, domain);
              await fs.writeFile(path.join(outputDir, filename), processedContent);
            } else {
              console.log(`Certificate files not found for ${serverName}, skipping ${filename}`);
            }
          } else {
            // Process regular config files normally
            console.log(`Processing ${filename}, replacing {{ domain }} with ${domain}`);
            const content = await fs.readFile(filePath, 'utf8');
            const processedContent = content.replace(/{{ domain }}/g, domain);
            await fs.writeFile(path.join(outputDir, filename), processedContent);
          }
        }
      }

      console.log('Configuration files have been processed and placed in the output directory');
    } catch (error) {
      console.error('Error processing templates:', error);
      throw error;
    }
  }

  /**
   * Check if templates should be processed
   * This happens when:
   * 1. The output directory doesn't exist
   * 2. The output directory is empty
   * 3. Any template file is newer than the corresponding output file
   */
  async shouldProcessTemplates(): Promise<boolean> {
    const templateDir = this.configService.getTemplateDir();
    const outputDir = this.configService.getOutputDir();

    // Check if output directory exists
    if (!(await fs.pathExists(outputDir))) {
      return true;
    }

    // Check if output directory is empty
    const outputFiles = await fs.readdir(outputDir);
    if (outputFiles.length === 0) {
      return true;
    }

    // Check if any template file is newer than the corresponding output file
    const templateFiles = await fs.readdir(templateDir);
    for (const filename of templateFiles) {
      if (filename.endsWith('.conf') || filename.endsWith('.incl')) {
        const templatePath = path.join(templateDir, filename);
        const outputPath = path.join(outputDir, filename);

        // If output file doesn't exist, we should process
        if (!(await fs.pathExists(outputPath))) {
          return true;
        }

        // Check if template file is newer than output file
        const templateStat = await fs.stat(templatePath);
        const outputStat = await fs.stat(outputPath);
        if (templateStat.mtime > outputStat.mtime) {
          return true;
        }
      }
    }

    return false;
  }
}
