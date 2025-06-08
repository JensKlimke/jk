import * as cron from 'node-cron';

import { ConfigService } from './services/config';
import { DockerService } from './services/docker';
import { NginxService } from './services/nginx';
import { TemplateService } from './services/template';

// Initialize services
const configService = new ConfigService();
const dockerService = new DockerService();
const templateService = new TemplateService(configService);
const nginxService = new NginxService(dockerService);

/**
 * Main function to start the template processor
 */
export async function startTemplateProcessor(): Promise<void> {
  try {
    // Wait for nginx to start
    console.log('Waiting for nginx to be fully started...');
    await nginxService.waitForNginx();

    // Initial processing
    console.log('Performing initial template processing...');
    await templateService.processTemplates();

    // Restart nginx
    await nginxService.restartNginx();

    // Keep the container running and monitor for changes
    console.log('Template processor completed initial run. Monitoring for changes...');

    // Monitor for changes every 10 seconds
    cron.schedule('*/10 * * * * *', async () => {
      try {
        // Check if nginx-proxy container is running
        if (await dockerService.isContainerRunning('nginx-proxy')) {
          // Check if any template files have changed or if processed files don't exist
          if (await templateService.shouldProcessTemplates()) {
            console.log(
              "Template files have changed or processed files don't exist. Processing...",
            );
            await templateService.processTemplates();
            await nginxService.restartNginx();
          }
        } else {
          console.log('Nginx is not running. Waiting...');
          await nginxService.waitForNginx();
        }
      } catch (error) {
        console.error('Error in scheduled task:', error);
      }
    });
  } catch (error) {
    console.error('Error in template processor:', error);
    throw error;
  }
}
