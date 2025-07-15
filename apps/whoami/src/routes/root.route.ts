import express, { Request, Response, Router } from 'express';
import { WhoamiService } from '../services/whoami.service';
import { TemplateService } from '../services/template.service';
import logger from '../utils/logger';

export function createRootRouter(whoamiService: WhoamiService, templateService: TemplateService, apiId: string): Router {
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const whoamiInfo = whoamiService.getWhoamiInfo(req, apiId);

      // Content negotiation
      const acceptHeader = req.headers.accept || '';
      const userAgent = req.headers['user-agent'] || '';

      // Determine response type based on Accept header and User-Agent
      let responseType = 'text';
      if (acceptHeader.includes('application/json')) {
        responseType = 'json';
      } else if (acceptHeader.includes('text/html') || userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
        responseType = 'html';
      }

      logger.info('Processing whoami request', { 
        ip: req.ip, 
        method: req.method, 
        path: req.path,
        responseType
      });

      if (responseType === 'json') {
        // Return JSON response
        res.json(whoamiInfo);
        logger.debug('Sent JSON response');
      } else if (responseType === 'html') {
        // Render HTML using template
        const html = await templateService.renderWhoamiInfo(whoamiInfo);
        res.type('text/html').send(html);
        logger.debug('Sent HTML response');
      } else {
        // Format as text for non-browser clients
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
    } catch (error) {
      logger.error('Error handling request:', error);
      const acceptHeader = req.headers.accept || '';
      const userAgent = req.headers['user-agent'] || '';

      // Determine error response format
      if (acceptHeader.includes('application/json')) {
        res.status(500).json({ error: 'Internal server error' });
      } else if (acceptHeader.includes('text/html') || userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
        res.status(500).type('text/html').send('<h1>Internal Server Error</h1><p>Something went wrong.</p>');
      } else {
        res.status(500).type('text/plain').send('Internal server error');
      }
    }
  });

  return router;
}
