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

**Design Details**:
```typescript
export function createRootRouter(whoamiService: WhoamiService, apiId: string): Router {
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const whoamiInfo = whoamiService.getWhoamiInfo(req, apiId);
      
      // Content negotiation
      const acceptHeader = req.headers.accept || '';
      const responseType = acceptHeader.includes('application/json') ? 'json' : 'text';
      
      // Send response in appropriate format
      if (responseType === 'json') {
        res.json(whoamiInfo);
      } else {
        // Format as text
        let textResponse = `Hostname: ${whoamiInfo.hostname}\n`;
        // ... other formatting
        res.type('text/plain').send(textResponse);
      }
    } catch (error) {
      // Error handling
      // ...
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

**Design Details**:
```typescript
// Interface representing the ApiInfo document
export interface IApiInfo extends Document {
  _id: string;
  apiId: string;
  createdAt: Date;
}

// Schema definition for the ApiInfo model
const ApiInfoSchema: Schema = new Schema({
  _id: { type: String, required: true },
  apiId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export the model
export const ApiInfoModel = mongoose.model<IApiInfo>('ApiInfo', ApiInfoSchema, 'api_info');
```

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
| Express Application | Database Service, Whoami Service, Router, Logger |
| Database Service | MongoDB, Logger, Data Models |
| Whoami Service | Logger |
| Router | Whoami Service, Logger |
| Logger | None |
| Data Models | MongoDB |

## IMPL-4: Traceability Matrix

| Requirement | Component | Implementation Task |
|-------------|-----------|---------------------|
| PRD-3.1 | COMP-3 | TASK-1.3.1, TASK-1.3.2, TASK-1.3.3 |
| PRD-3.2 | COMP-3, COMP-4 | TASK-1.3.4, TASK-1.3.5, TASK-1.4.2 |
| PRD-3.3 | COMP-4 | TASK-1.4.3 |
| PRD-4.1 | COMP-2, COMP-6 | TASK-1.2.3, TASK-1.6.1, TASK-1.6.2, TASK-1.6.3 |
| PRD-4.2 | COMP-5 | TASK-1.5.1, TASK-1.5.2, TASK-1.5.3, TASK-1.5.4 |
| PRD-4.3 | COMP-4 | TASK-1.4.4, TASK-2.1.1, TASK-2.1.2, TASK-2.1.3 |
| PRD-4.4 | COMP-2 | TASK-1.2.2 |