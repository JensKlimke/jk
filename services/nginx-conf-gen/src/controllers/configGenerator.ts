import * as fs from 'fs-extra';
import * as path from 'path';
import * as Mustache from 'mustache';

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
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read template file: ${error}`);
    }
  }

  /**
   * Reads a JSON configuration file
   * @param jsonPath Path to the JSON file
   * @returns The parsed JSON data
   */
  public async readConfig(jsonPath: string): Promise<any> {
    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf8');
      return JSON.parse(jsonContent);
    } catch (error) {
      throw new Error(`Failed to read or parse JSON file: ${error}`);
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
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write configuration file: ${error}`);
    }
  }

  /**
   * Generates a configuration file from a template and JSON data
   * @param templatePath Path to the template file
   * @param jsonPath Path to the JSON data file
   * @param outputPath Path to write the output file
   * @returns The rendered configuration
   */
  public async generateConfig(
    templatePath: string,
    jsonPath: string,
    outputPath: string
  ): Promise<string> {
    const template = await this.readTemplate(templatePath);
    const data = await this.readConfig(jsonPath);
    const rendered = this.renderTemplate(template, data);
    
    if (outputPath) {
      await this.writeConfig(outputPath, rendered);
    }
    
    return rendered;
  }
}