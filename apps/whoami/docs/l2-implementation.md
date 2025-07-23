# Whoami Service - Implementation Tasks & Detailed Design

## IMPL-1: Component Implementation Details

### IMPL-1.1: Express Application (COMP-1)
**File**: `src/index.ts`

**Description**: The main entry point that initializes the Express application, connects to the database, and sets up routes and error handlers.

**Implementation Tasks**:
- TASK-1.1.1: Initialize Express application ✓
- TASK-1.1.2: Configure middleware ✓
- TASK-1.1.3: Initialize services ✓
- TASK-1.1.4: Connect to database ✓
- TASK-1.1.5: Set up routes ✓
- TASK-1.1.6: Implement graceful shutdown ✓
- TASK-1.1.7: Start HTTP server ✓

**Design Details**:
```typescript
// Express initialization
const app = express();
const port = process.env.PORT || 3000;

// Service initialization
const databaseService = new DatabaseService();
const whoamiService = new WhoamiService();

// Database connection with retry
await databaseService.connectWithRetry();

// Get or create API ID
const apiId = await databaseService.getOrCreateApiId();

// Route setup
app.use('/', createRootRouter(whoamiService, apiId));

// Server startup
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await databaseService.close();
  process.exit(0);
});
```

### IMPL-1.2: Database Service (COMP-2)
**File**: `src/services/database.service.ts`

**Description**: Manages database connections, retries, and API ID persistence.

**Implementation Tasks**:
- TASK-1.2.1: Implement database connection ✓
- TASK-1.2.2: Implement connection retry mechanism ✓
- TASK-1.2.3: Implement API ID retrieval and creation ✓
- TASK-1.2.4: Implement connection closing ✓
- TASK-1.2.5: Update database name to "meta"
- TASK-1.2.6: Implement instance key retrieval from environment variable or hostname
- TASK-1.2.7: Use instance key as document _id in database

**Design Details**:
```typescript
export class DatabaseService {
  private apiId: string | null = null;

  constructor(
    private readonly uri: string = MONGO_ACCESS_URL
  ) {}

  // Connect to MongoDB
  async connect(): Promise<void> { ... }

  // Connect with retry mechanism
  async connectWithRetry(maxRetries: number = Infinity, retryInterval: number = 1000): Promise<void> { ... }

  // Get or create API ID
  async getOrCreateApiId(): Promise<string> { ... }

  // Close connection
  async close(): Promise<void> { ... }
}
```

### IMPL-1.3: Whoami Service (COMP-3)
**File**: `src/services/whoami.service.ts`

**Description**: Provides information about the server and the request.

**Implementation Tasks**:
- TASK-1.3.1: Implement main information retrieval method ✓
- TASK-1.3.2: Implement hostname retrieval ✓
- TASK-1.3.3: Implement IP addresses retrieval ✓
- TASK-1.3.4: Implement remote address retrieval ✓
- TASK-1.3.5: Implement headers retrieval ✓

**Design Details**:
```typescript
export class WhoamiService {
  // Main method to get all information
  getWhoamiInfo(req: Request, apiId: string): WhoamiInfo { ... }

  // Get hostname
  private getHostname(): string { ... }

  // Get server IP addresses
  private getIPs(): string[] { ... }

  // Get client remote address
  private getRemoteAddr(req: Request): string { ... }

  // Get request headers
  private getHeaders(req: Request): Record<string, string | string[] | undefined> { ... }
}
```

### IMPL-1.4: Router (COMP-4)
**File**: `src/routes/root.route.ts`

**Description**: Defines API endpoints and routes requests to the controller.

**Implementation Tasks**:
- TASK-1.4.1: Create router factory function ✓
- TASK-1.4.2: Implement root endpoint ✓
- TASK-1.4.3: Route requests to the controller ✓

**Design Details**:
```typescript
import express, { Router } from 'express';
import { WhoamiController } from '../controllers/whoami.controller';
import logger from '../utils/logger';

export function createRootRouter(whoamiController: WhoamiController): Router {
  const router = express.Router();

  logger.info('Setting up root router');

  // Route requests to the controller
  router.get('/', whoamiController.getWhoamiInfo);

  return router;
}
```

### IMPL-1.5: Logger (COMP-5)
**File**: `src/utils/logger.ts`

**Description**: Provides structured logging capabilities.

**Implementation Tasks**:
- TASK-1.5.1: Configure log formats ✓
- TASK-1.5.2: Set up log transports ✓
- TASK-1.5.3: Create logger instance ✓
- TASK-1.5.4: Configure environment-specific settings ✓

**Design Details**:
```typescript
// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'whoami' },
  transports
});

// Set log level based on environment
if (process.env.NODE_ENV !== 'production') {
  logger.level = process.env.LOG_LEVEL || 'debug';
}
```

### IMPL-1.6: Data Models (COMP-6)
**File**: `src/models/apiInfo.model.ts`

**Description**: Defines database schemas for the application.

**Implementation Tasks**:
- TASK-1.6.1: Define API Info interface ✓
- TASK-1.6.2: Create Mongoose schema ✓
- TASK-1.6.3: Create and export model ✓

### IMPL-1.7: Template Renderer (COMP-7)
**File**: `src/services/template.service.ts`

**Description**: Renders HTML templates for browser display.

**Implementation Tasks**:
- TASK-1.7.1: Create template service ✓
- TASK-1.7.2: Implement HTML template rendering ✓
- TASK-1.7.3: Create mustache template for whoami information ✓
- TASK-1.7.4: Configure build process to copy template files to dist directory ✓

### IMPL-1.8: Whoami Controller (COMP-8)
**File**: `src/controllers/whoami.controller.ts`

**Description**: Handles HTTP requests, content negotiation, and coordinates services.

**Implementation Tasks**:
- TASK-1.8.1: Create controller class ✓
- TASK-1.8.2: Implement getWhoamiInfo method to handle requests ✓
- TASK-1.8.3: Implement content negotiation logic ✓
- TASK-1.8.4: Implement response formatting for different content types ✓
- TASK-1.8.5: Implement error handling ✓

**Design Details**:
```typescript
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
    logger.info('Sending response', { responseType });

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
```

**Build Configuration**:
To ensure template files are available in the production build, the build script in package.json is configured to copy the templates directory to the dist directory:

```json
"scripts": {
  "build": "tsc && cp -r src/templates dist/"
}
```

This is necessary because TypeScript's compiler only processes TypeScript files and doesn't copy non-TypeScript files (like .mustache templates) to the output directory.

## IMPL-2: Cross-Cutting Concerns

### IMPL-2.1: Error Handling
**Description**: Centralized error handling strategy.

**Implementation Tasks**:
- TASK-2.1.1: Implement try-catch blocks in controller methods ✓
- TASK-2.1.2: Log errors with appropriate context ✓
- TASK-2.1.3: Return appropriate error responses based on Accept header and User-Agent ✓

### IMPL-2.2: Logging
**Description**: Comprehensive logging strategy.

**Implementation Tasks**:
- TASK-2.2.1: Log application startup and shutdown ✓
- TASK-2.2.2: Log database operations ✓
- TASK-2.2.3: Log request handling ✓
- TASK-2.2.4: Log errors with stack traces ✓

### IMPL-2.3: Configuration
**Description**: Environment-based configuration.

**Implementation Tasks**:
- TASK-2.3.1: Define environment variables ✓
- TASK-2.3.2: Provide sensible defaults ✓
- TASK-2.3.3: Apply configuration in components ✓

## IMPL-3: Dependencies

| Component | Dependencies |
|-----------|--------------|
| Express Application | Database Service, Whoami Service, Template Renderer, Router, Whoami Controller, Logger |
| Database Service | MongoDB, Logger, Data Models |
| Whoami Service | Logger |
| Router | Whoami Controller, Logger |
| Whoami Controller | Whoami Service, Template Renderer, Logger |
| Logger | None |
| Data Models | MongoDB |
| Template Renderer | Whoami Service |

## IMPL-4: Traceability Matrix

| Requirement | Component | Implementation Task |
|-------------|-----------|---------------------|
| PRD-3.1 | COMP-3 | TASK-1.3.1, TASK-1.3.2, TASK-1.3.3 |
| PRD-3.2 | COMP-3, COMP-8 | TASK-1.3.4, TASK-1.3.5, TASK-1.8.2 |
| PRD-3.3 | COMP-7, COMP-8 | TASK-1.7.1, TASK-1.7.2, TASK-1.7.3, TASK-1.8.3, TASK-1.8.4 |
| PRD-4.1 | COMP-2, COMP-6 | TASK-1.2.3, TASK-1.6.1, TASK-1.6.2, TASK-1.6.3 |
| PRD-4.2 | COMP-5 | TASK-1.5.1, TASK-1.5.2, TASK-1.5.3, TASK-1.5.4 |
| PRD-4.3 | COMP-8 | TASK-1.8.5, TASK-2.1.1, TASK-2.1.2, TASK-2.1.3 |
| PRD-4.4 | COMP-2 | TASK-1.2.2 |
