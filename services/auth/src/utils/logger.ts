import winston from 'winston';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Create custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors (but not in test environment)
    if (stack && process.env.NODE_ENV !== 'test') {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add stack trace for errors (but not in test environment)
    if (stack && process.env.NODE_ENV !== 'test') {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create test format that suppresses stack traces
const testFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: false }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Remove stack from metadata if present
    const { stack: _, ...cleanMeta } = meta;
    
    // Add metadata if present (but keep it minimal for tests and exclude stack)
    if (Object.keys(cleanMeta).length > 0) {
      log += ` ${JSON.stringify(cleanMeta)}`;
    }
    
    return log;
  })
);

// Determine log level based on environment
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL;
  
  if (logLevel && ['error', 'warn', 'info', 'debug'].includes(logLevel)) {
    return logLevel;
  }
  
  return env === 'production' ? 'info' : 'debug';
};

// Get appropriate format based on environment
const getFormat = () => {
  const env = process.env.NODE_ENV;
  if (env === 'test') {
    return testFormat;
  } else if (env === 'production') {
    return logFormat;
  } else {
    return consoleFormat;
  }
};

// Create transports
const transports: winston.transport[] = [
  new winston.transports.Console({
    level: getLogLevel(),
    format: getFormat(),
  }),
];

// Add file transport for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: logFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  );
  
  logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' })
  );
}

export default logger;