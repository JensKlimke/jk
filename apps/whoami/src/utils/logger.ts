import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Determine where logs should be output based on environment variable
const logOutput = process.env.LOG_OUTPUT || 'both'; // Default to 'both' if not specified

// Create transports array based on LOG_OUTPUT
const transports: winston.transport[] = [];

// Add console transport if LOG_OUTPUT is 'console' or 'both'
if (logOutput === 'console' || logOutput === 'both') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// Add file transports if LOG_OUTPUT is 'file' or 'both'
if (logOutput === 'file' || logOutput === 'both') {
  transports.push(
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to combined.log
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

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

export default logger;
