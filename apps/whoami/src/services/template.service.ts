import * as Mustache from 'mustache';
import * as fs from 'fs';
import * as path from 'path';
import { WhoamiInfo } from './whoami.service';
import logger from '../utils/logger';

export class TemplateService {
  private readonly templatesDir: string;

  /**
   * Create a new TemplateService
   * @param templatesDir Directory containing the templates (default: ../templates)
   */
  constructor(templatesDir: string = path.join(__dirname, '../templates')) {
    this.templatesDir = templatesDir;
    logger.info('Template service initialized', { templatesDir: this.templatesDir });
  }

  /**
   * Render HTML using a mustache template
   * @param templateName Name of the template file (without extension)
   * @param data Data to be rendered in the template
   * @returns Rendered HTML string
   */
  async renderHtml(templateName: string, data: any): Promise<string> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.mustache`);
      logger.debug('Loading template', { templatePath });
      
      const template = await fs.promises.readFile(templatePath, 'utf-8');
      logger.debug('Template loaded successfully');
      
      return Mustache.render(template, data);
    } catch (error) {
      logger.error('Error rendering template', { templateName, error });
      throw new Error(`Failed to render template ${templateName}: ${error}`);
    }
  }

  /**
   * Render whoami information as HTML
   * @param whoamiInfo WhoamiInfo object
   * @returns Rendered HTML string
   */
  async renderWhoamiInfo(whoamiInfo: WhoamiInfo): Promise<string> {
    logger.debug('Rendering whoami info as HTML');
    
    // Transform headers object into array for mustache template
    const headersArray = Object.entries(whoamiInfo.headers).map(([key, value]) => ({
      key,
      value: value?.toString() || ''
    }));
    
    // Add 'last' property to ips array for proper comma formatting
    const ipsWithLast = whoamiInfo.ips.map((ip, index, array) => ({
      value: ip,
      last: index === array.length - 1
    }));
    
    // Prepare data for template
    const templateData = {
      ...whoamiInfo,
      ips: ipsWithLast,
      headers: headersArray
    };
    
    return this.renderHtml('whoami', templateData);
  }
}