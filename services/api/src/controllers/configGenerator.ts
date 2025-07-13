import * as fs from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import { getDockerServices } from './getDockerServices';

/**
 * Configuration Generator for Nginx
 * Renders Mustache templates with JSON data to generate Nginx configuration files
 */
export class ConfigGenerator {
  private readonly lastConfigPath = path.join('/app/logs', 'last_config.txt');
  private readonly logsDir = '/app/logs/nginx-conf';

  /**
   * Reads a template file
   * @param templatePath Path to the template file
   * @returns The template content as a string
   */
  public async readTemplate(templatePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read template file: ${error}`);
    }
  }

  /**
   * Renders a template with the provided data
   * @param template The template string
   * @param data The data to render the template with
   * @returns The rendered template
   */
  public renderTemplate(template: string, data: any): string {
    try {
      return Mustache.render(template, data);
    } catch (error) {
      throw new Error(`Failed to render template: ${error}`);
    }
  }

  /**
   * Writes the rendered configuration to a file
   * @param outputPath Path to write the output file
   * @param content The content to write
   */
  public async writeConfig(outputPath: string, content: string): Promise<void> {
    try {
      // Ensure the directory exists
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.promises.writeFile(outputPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write configuration file: ${error}`);
    }
  }

  /**
   * Checks if the config has changed from the last saved version
   * @param newConfig The new config to compare
   * @returns True if the config has changed, false otherwise
   */
  private async hasConfigChanged(newConfig: string): Promise<boolean> {
    try {
      // Ensure logs directory exists
      await fs.promises.mkdir(this.logsDir, { recursive: true });

      // Check if last config file exists
      try {
        const lastConfig = await fs.promises.readFile(this.lastConfigPath, 'utf8');
        return lastConfig !== newConfig;
      } catch (error) {
        // If file doesn't exist, consider it as changed
        return true;
      }
    } catch (error) {
      console.error(`Error checking if config changed: ${error}`);
      // If there's an error, assume it has changed to be safe
      return true;
    }
  }

  /**
   * Saves the current config as the last config
   * @param config The config to save
   */
  private async saveLastConfig(config: string): Promise<void> {
    try {
      await fs.promises.mkdir(this.logsDir, { recursive: true });
      await fs.promises.writeFile(this.lastConfigPath, config, 'utf8');
    } catch (error) {
      console.error(`Error saving last config: ${error}`);
    }
  }

  /**
   * Logs the config to a timestamped file
   * @param config The config to log
   */
  private async logConfig(config: string): Promise<void> {
    try {
      // Create timestamp for filename
      const now = new Date();
      const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const logFilePath = path.join(this.logsDir, `config_${timestamp}.log`);

      // Write config to log file
      await fs.promises.mkdir(this.logsDir, { recursive: true });
      await fs.promises.writeFile(logFilePath, config, 'utf8');
      console.log(`Config logged to ${logFilePath}`);
    } catch (error) {
      console.error(`Error logging config: ${error}`);
    }
  }

  /**
   * Generates a configuration file from a template and JSON data
   * @param templatePath Path to the template file
   * @param outputPath Path to write the output file
   * @returns The rendered configuration
   */
  public async generateConfig(
    templatePath: string,
    outputPath: string,
  ): Promise<string> {
    const template = await this.readTemplate(templatePath);
    const data = await getDockerServices();
    const rendered = this.renderTemplate(template, data);

    if (outputPath) {
      await this.writeConfig(outputPath, rendered);
    }

    // Check if config has changed and log it if it has
    const hasChanged = await this.hasConfigChanged(rendered);
    if (hasChanged) {
      await this.logConfig(rendered);
      await this.saveLastConfig(rendered);
    }

    return rendered;
  }

  /**
   * Generates the default configuration file
   * @param templatePath Path to the default template file
   * @param outputPath Path to write the default output file
   * @returns The rendered default configuration
   */
  public async generateDefaultConfig(
    templatePath: string,
    outputPath: string,
  ): Promise<string> {
    const template = await this.readTemplate(templatePath);
    const data = await getDockerServices();
    const rendered = this.renderTemplate(template, data);

    if (outputPath) {
      await this.writeConfig(outputPath, rendered);
    }

    return rendered;
  }

  /**
   * Generates individual configuration files for each service
   * @param templatePath Path to the service template file
   * @param outputDir Directory to write the service output files
   * @returns An array of the rendered service configurations
   */
  public async generateServiceConfigs(
    templatePath: string,
    outputDir: string,
  ): Promise<string[]> {
    const template = await this.readTemplate(templatePath);
    const data = await getDockerServices();
    const renderedConfigs: string[] = [];

    // Ensure the output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Generate a config file for each service
    for (const service of data.services) {
      // Create a data object with just this service
      const serviceData = {
        services: [service],
        default_cert: data.default_cert
      };

      // Render the template with just this service's data
      const rendered = this.renderTemplate(template, serviceData);

      // Skip empty configs
      if (rendered.trim() === '') {
        continue;
      }

      // Create a filename based on the service's host
      const filename = `service.${service.host}.conf`;
      const outputPath = path.join(outputDir, filename);

      // Write the config to a file
      await this.writeConfig(outputPath, rendered);
      renderedConfigs.push(rendered);
    }

    return renderedConfigs;
  }
}
