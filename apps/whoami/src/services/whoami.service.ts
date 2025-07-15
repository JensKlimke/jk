import { Request } from 'express';
import { networkInterfaces } from 'os';
import logger from '../utils/logger';

export interface WhoamiInfo {
  hostname: string;
  ips: string[];
  remoteAddr: string;
  headers: Record<string, string | string[] | undefined>;
  apiId: string;
}

export class WhoamiService {
  /**
   * Get information about the server and the request
   * @param req Express request object
   * @param apiId Unique application ID
   * @returns WhoamiInfo object with server and request information
   */
  getWhoamiInfo(req: Request, apiId: string): WhoamiInfo {
    logger.info('Getting whoami information', { 
      url: req.url, 
      method: req.method, 
      ip: req.ip 
    });

    const info = {
      hostname: this.getHostname(),
      ips: this.getIPs(),
      remoteAddr: this.getRemoteAddr(req),
      headers: this.getHeaders(req),
      apiId
    };

    logger.debug('Whoami information retrieved', { 
      hostname: info.hostname,
      remoteAddr: info.remoteAddr,
      apiId: info.apiId
    });

    return info;
  }

  /**
   * Get the hostname of the server
   * @returns Hostname
   */
  private getHostname(): string {
    return process.env.HOSTNAME || 'unknown';
  }

  /**
   * Get all IP addresses of the server
   * @returns Array of IP addresses
   */
  private getIPs(): string[] {
    try {
      const interfaces = networkInterfaces();
      const ips: string[] = [];

      Object.values(interfaces).forEach(iface => {
        if (iface) {
          iface.forEach(addr => {
            ips.push(addr.address);
          });
        }
      });

      logger.debug('Retrieved server IP addresses', { count: ips.length });
      return ips;
    } catch (error) {
      logger.error('Error retrieving server IP addresses', error);
      return ['unknown'];
    }
  }

  /**
   * Get the remote address of the client
   * @param req Express request object
   * @returns Remote address
   */
  private getRemoteAddr(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const remoteAddress = req.socket.remoteAddress;

    if (typeof xForwardedFor === 'string') {
      return `${xForwardedFor}:${req.socket.remotePort || 'unknown'}`;
    }

    return `${remoteAddress || 'unknown'}:${req.socket.remotePort || 'unknown'}`;
  }

  /**
   * Get all headers from the request
   * @param req Express request object
   * @returns Object with all headers
   */
  private getHeaders(req: Request): Record<string, string | string[] | undefined> {
    return {
      ...req.headers,
      method: req.method,
      url: req.url,
      httpVersion: req.httpVersion
    };
  }
}
