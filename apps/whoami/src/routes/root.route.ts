import express, { Request, Response, Router } from 'express';
import { WhoamiService } from '../services/whoami.service';
import logger from '../utils/logger';

export function createRootRouter(whoamiService: WhoamiService, apiId: string): Router {
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const whoamiInfo = whoamiService.getWhoamiInfo(req, apiId);

      // Check if the client accepts JSON
      const acceptHeader = req.headers.accept || '';
      const responseType = acceptHeader.includes('application/json') ? 'json' : 'text';

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
      } else {
        // Format as text for browsers and other clients
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
      if (acceptHeader.includes('application/json')) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(500).type('text/plain').send('Internal server error');
      }
    }
  });

  return router;
}
