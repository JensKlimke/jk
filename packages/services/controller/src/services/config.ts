/**
 * Service for handling configuration settings
 */
export class ConfigService {
  private readonly domain: string;
  private readonly templateDir: string;
  private readonly outputDir: string;
  private readonly certsDir: string;

  constructor() {
    // Get configuration from environment variables or use defaults
    this.domain = process.env.DOMAIN || 'localhost';
    this.templateDir = process.env.TEMPLATE_DIR || '/etc/nginx/conf.d.tmpl';
    this.outputDir = process.env.OUTPUT_DIR || '/etc/nginx/conf.d';
    this.certsDir = process.env.CERTS_DIR || '/etc/nginx/certs';
  }

  /**
   * Get the domain name
   */
  getDomain(): string {
    return this.domain;
  }

  /**
   * Get the template directory
   */
  getTemplateDir(): string {
    return this.templateDir;
  }

  /**
   * Get the output directory
   */
  getOutputDir(): string {
    return this.outputDir;
  }

  /**
   * Get the certificates directory
   */
  getCertsDir(): string {
    return this.certsDir;
  }
}
