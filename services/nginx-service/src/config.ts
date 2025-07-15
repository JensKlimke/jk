/**
 * Configuration for the API
 */
export interface Config {
  // Certificate configuration
  certsPath: string;
  webrootPath: string;
  defaultDomain: string;
  defaultCertCN: string;
  email: string;
}

/**
 * Get configuration from environment variables
 * @returns Configuration object
 */
export function getConfig(): Config {
  return {
    certsPath: process.env.CERTS_PATH || '/etc/letsencrypt/live',
    webrootPath: process.env.WEBROOT_PATH || '/var/www/html',
    defaultDomain: process.env.DEFAULT_DOMAIN || 'default',
    defaultCertCN: process.env.DEFAULT_CERT_CN || 'default.local',
    email: process.env.EMAIL || 'admin@example.com',
  };
}