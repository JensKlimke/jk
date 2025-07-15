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

**Description**: Defines API endpoints and handles requests.

**Implementation Tasks**:
- TASK-1.4.1: Create router factory function ✓
- TASK-1.4.2: Implement root endpoint ✓
- TASK-1.4.3: Implement content negotiation ✓
- TASK-1.4.4: Implement error handling ✓
- TASK-1.4.5: Implement HTML response format using Template Renderer ✓

**Design Details**:
```typescript
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

      // Log the response type
      logger.info('Processing whoami request', { 
        ip: req.ip, 
        method: req.method, 
        path: req.path,
        responseType
      });

      // Send response in appropriate format
      if (responseType === 'json') {
        res.json(whoamiInfo);
        logger.debug('Sent JSON response');
      } else if (responseType === 'html') {
        // Render HTML using template
        const html = await templateService.renderWhoamiInfo(whoamiInfo);
        res.type('text/html').send(html);
        logger.debug('Sent HTML response');
      } else {
        // Format as text
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
      // Error handling
      logger.error('Error handling request:', error);
      const acceptHeader = req.headers.accept || '';
      if (acceptHeader.includes('application/json')) {
        res.status(500).json({ error: 'Internal server error' });
      } else if (acceptHeader.includes('text/html')) {
        res.status(500).type('text/html').send('<h1>Internal Server Error</h1><p>Something went wrong.</p>');
      } else {
        res.status(500).type('text/plain').send('Internal server error');
      }
    }
  });

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

**Design Details**:
```typescript
import * as Mustache from 'mustache';
import * as fs from 'fs';
import * as path from 'path';
import { WhoamiInfo } from './whoami.service';

export class TemplateService {
  private readonly templatesDir: string;

  constructor(templatesDir: string = path.join(__dirname, '../templates')) {
    this.templatesDir = templatesDir;
  }

  /**
   * Render HTML using a mustache template
   * @param templateName Name of the template file (without extension)
   * @param data Data to be rendered in the template
   * @returns Rendered HTML string
   */
  async renderHtml(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.mustache`);
    const template = await fs.promises.readFile(templatePath, 'utf-8');
    return Mustache.render(template, data);
  }

  /**
   * Render whoami information as HTML
   * @param whoamiInfo WhoamiInfo object
   * @returns Rendered HTML string
   */
  async renderWhoamiInfo(whoamiInfo: WhoamiInfo): Promise<string> {
    return this.renderHtml('whoami', whoamiInfo);
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
- TASK-2.1.1: Implement try-catch blocks in route handlers ✓
- TASK-2.1.2: Log errors with appropriate context ✓
- TASK-2.1.3: Return appropriate error responses based on Accept header ✓

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
| Express Application | Database Service, Whoami Service, Template Renderer, Router, Logger |
| Database Service | MongoDB, Logger, Data Models |
| Whoami Service | Logger |
| Router | Whoami Service, Template Renderer, Logger |
| Logger | None |
| Data Models | MongoDB |
| Template Renderer | Whoami Service |

## IMPL-4: Traceability Matrix

| Requirement | Component | Implementation Task |
|-------------|-----------|---------------------|
| PRD-3.1 | COMP-3 | TASK-1.3.1, TASK-1.3.2, TASK-1.3.3 |
| PRD-3.2 | COMP-3, COMP-4 | TASK-1.3.4, TASK-1.3.5, TASK-1.4.2 |
| PRD-3.3 | COMP-4, COMP-7 | TASK-1.4.3, TASK-1.4.5, TASK-1.7.1, TASK-1.7.2, TASK-1.7.3 |
| PRD-4.1 | COMP-2, COMP-6 | TASK-1.2.3, TASK-1.6.1, TASK-1.6.2, TASK-1.6.3 |
| PRD-4.2 | COMP-5 | TASK-1.5.1, TASK-1.5.2, TASK-1.5.3, TASK-1.5.4 |
| PRD-4.3 | COMP-4 | TASK-1.4.4, TASK-2.1.1, TASK-2.1.2, TASK-2.1.3 |
| PRD-4.4 | COMP-2 | TASK-1.2.2 |
