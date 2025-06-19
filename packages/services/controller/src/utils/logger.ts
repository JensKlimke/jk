import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Determine the current environment
const env = process.env.NODE_ENV || 'development';
const isTest = env === 'test';

// Ensure logs directory exists for test environment
const logsDir = path.join(process.cwd(), 'logs');
if (isTest && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston logger configuration that handles different formats for test vs dev/prod environments
 *
 * In test environment:
 * - Only logs the error message (no stack trace)
 * - Logs are written to a file instead of console
 * - Uses minimal formatting to avoid noisy output in tests
 *
 * In development/production:
 * - Includes timestamp, log level, message and stack traces
 * - Uses colorized output for better readability
 * - Logs are written to the console
 */
const logger = winston.createLogger({
  level: isTest ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: !isTest }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'controller-service' },
  transports: isTest
    ? [
        // For test environment, use File transport
        new winston.transports.File({
          filename: path.join(logsDir, 'test.log'),
          format: winston.format.printf(({ level, message }) => {
            return `${level}: ${message}`;
          }),
        }),
      ]
    : [
        // For dev/prod environments, use Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ level, message, timestamp, stack }) => {
              return stack
                ? `${timestamp} ${level}: ${message}\n${stack}`
                : `${timestamp} ${level}: ${message}`;
            })
          ),
        }),
      ],
});

// Export convenience methods
export default {
  error: (message: string, error?: Error) => {
    if (error) {
      logger.error({ message, stack: error.stack });
    } else {
      logger.error(message);
    }
  },
  warn: (message: string) => logger.warn(message),
  info: (message: string) => logger.info(message),
  http: (message: string) => logger.http(message),
  debug: (message: string) => logger.debug(message),
};
