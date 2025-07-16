import { Request, Response } from 'express';
import { WhoamiService, WhoamiInfo } from '../services/whoami.service';
import { TemplateService } from '../services/template.service';
import logger from '../utils/logger';

export class WhoamiController {
  private apiId: string;

  constructor(
    private whoamiService: WhoamiService,
    private templateService: TemplateService,
    apiId: string
  ) {
    this.apiId = apiId;
    logger.info('Whoami controller initialized');
  }

  /**
   * Handle whoami info request
   * @param req Express request object
   * @param res Express response object
   */
  getWhoamiInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get whoami information from service
      const whoamiInfo = this.whoamiService.getWhoamiInfo(req, this.apiId);

      // Determine response type based on content negotiation
      const responseType = this.determineResponseType(req);
      
      // Send response in appropriate format
      await this.sendResponse(res, whoamiInfo, responseType);
    } catch (error) {
      this.handleError(req, res, error);
    }
  }

  /**
   * Determine response type based on Accept header and User-Agent
   * @param req Express request object
   * @returns Response type (json, html, or text)
   */
  private determineResponseType(req: Request): string {
    const acceptHeader = req.headers.accept || '';
    const userAgent = req.headers['user-agent'] || '';

    if (acceptHeader.includes('application/json')) {
      return 'json';
    } else if (acceptHeader.includes('text/html') || 
               userAgent.includes('Mozilla') || 
               userAgent.includes('Chrome') || 
               userAgent.includes('Safari')) {
      return 'html';
    }
    return 'text';
  }

  /**
   * Send response in appropriate format
   * @param res Express response object
   * @param whoamiInfo Whoami information
   * @param responseType Response type (json, html, or text)
   */
  private async sendResponse(res: Response, whoamiInfo: WhoamiInfo, responseType: string): Promise<void> {
    logger.info('Processing whoami request', { 
      ip: res.req.ip, 
      method: res.req.method, 
      path: res.req.path,
      responseType
    });

    if (responseType === 'json') {
      res.json(whoamiInfo);
      logger.debug('Sent JSON response');
    } else if (responseType === 'html') {
      const html = await this.templateService.renderWhoamiInfo(whoamiInfo);
      res.type('text/html').send(html);
      logger.debug('Sent HTML response');
    } else {
      this.sendTextResponse(res, whoamiInfo);
    }
  }

  /**
   * Send text response
   * @param res Express response object
   * @param whoamiInfo Whoami information
   */
  private sendTextResponse(res: Response, whoamiInfo: WhoamiInfo): void {
    let textResponse = `Hostname: ${whoamiInfo.hostname}\n`;
    textResponse += `IPs: ${whoamiInfo.ips.join(', ')}\n`;
    textResponse += `Remote Address: ${whoamiInfo.remoteAddr}\n`;
    textResponse += `App ID: ${whoamiInfo.apiId}\n\n`;
    textResponse += `Headers:\n`;

    Object.entries(whoamiInfo.headers).forEach(([key, value]) => {
      textResponse += `  ${key}: ${value}\n`;
    });

    res.type('text/plain').send(textResponse);
    logger.debug('Sent text response');
  }

  /**
   * Handle errors
   * @param req Express request object
   * @param res Express response object
   * @param error Error object
   */
  private handleError(req: Request, res: Response, error: any): void {
    logger.error('Error handling request:', error);
    const acceptHeader = req.headers.accept || '';
    const userAgent = req.headers['user-agent'] || '';

    if (acceptHeader.includes('application/json')) {
      res.status(500).json({ error: 'Internal server error' });
    } else if (acceptHeader.includes('text/html') || 
               userAgent.includes('Mozilla') || 
               userAgent.includes('Chrome') || 
               userAgent.includes('Safari')) {
      res.status(500).type('text/html').send('<h1>Internal Server Error</h1><p>Something went wrong.</p>');
    } else {
      res.status(500).type('text/plain').send('Internal server error');
    }
  }
}