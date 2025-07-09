import * as fs from 'fs';
import * as path from 'path';
import * as Mustache from 'mustache';
import { getDockerServices } from './getDockerServices';

/**
 * Configuration Generator for Nginx
 * Renders Mustache templates with JSON data to generate Nginx configuration files
 */
export class ConfigGenerator {
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
   * Generates a configuration file from a template and JSON data
   * @param templatePath Path to the template file
   * @param outputPath Path to write the output file
   * @param authService Optional name of the authentication service (only used when jsonPath is 'docker')
   * @returns The rendered configuration
   */
  public async generateConfig(
    templatePath: string,
    outputPath: string,
    authService?: string
  ): Promise<string> {
    const template = await this.readTemplate(templatePath);
    const data = await getDockerServices(authService);
    const rendered = this.renderTemplate(template, data);

    if (outputPath) {
      await this.writeConfig(outputPath, rendered);
    }

    return rendered;
  }
}
