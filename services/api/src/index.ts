#!/usr/bin/env node

import * as path from 'path';
import { ConfigGenerator } from './controllers/configGenerator';
import { CertificateManager } from './controllers/certificateManager';
import { getConfig } from './config';
import { getDockerServices } from './controllers/getDockerServices';

/**
 * Main entry point for the Nginx configuration generator and certificate manager
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'config';

    // Get configuration
    const config = getConfig();

    if (command === 'config') {
      // Handle config generation
      if (args.length < 2) {
        console.error('Usage: nginx-conf-gen config <default-template-path> <service-template-path> <output-dir>');
        process.exit(1);
      }

      const defaultTemplatePath = args[1];
      const serviceTemplatePath = args[2];
      const outputDir = args[3] || '';

      if (!outputDir) {
        console.error('Output directory is required');
        process.exit(1);
      }

      // Create a new config generator
      const generator = new ConfigGenerator();

      // Generate the default configuration
      const defaultOutputPath = path.join(outputDir, 'default.conf');
      const defaultResult = await generator.generateDefaultConfig(defaultTemplatePath, defaultOutputPath);
      console.log(`Default configuration generated successfully: ${defaultOutputPath}`);

      // Generate the service configurations
      const serviceResults = await generator.generateServiceConfigs(serviceTemplatePath, outputDir);
      console.log(`${serviceResults.length} service configurations generated successfully in ${outputDir}`);
    } else if (command === 'cert') {
      // Handle certificate operations
      if (args.length < 2) {
        console.error('Usage: nginx-conf-gen cert <check|obtain|process|delete> [domain] [force]');
        process.exit(1);
      }

      const certCommand = args[1];
      const domain = args[2] || '';
      const force = args[3] === 'force';

      // Create a new certificate manager
      const certManager = new CertificateManager(config);

      if (certCommand === 'check') {
        // Check default certificate
        await certManager.checkDefaultCert();
        console.log('Default certificate check completed.');
      } else if (certCommand === 'obtain' && domain) {
        // Obtain certificate for a domain
        await certManager.obtainCert(domain, force);
        console.log(`Certificate for ${domain} obtained/renewed.`);
      } else if (certCommand === 'process') {
        // Process all domains from Docker services
        const services = await getDockerServices();
        const domains = services.services.map(service => service.host);
        await certManager.processDomains(domains);
        console.log('All domains processed.');
      } else if (certCommand === 'delete' && domain) {
        // Delete certificate for a domain
        await certManager.deleteCert(domain);
        console.log(`Certificate for ${domain} deleted.`);
      } else {
        console.error('Invalid certificate command or missing domain.');
        process.exit(1);
      }
    } else {
      console.error('Usage: nginx-conf-gen <config|cert> [options]');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

// Export classes for use as a library
export { ConfigGenerator, CertificateManager };
