import winston from 'winston';

// Define logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'webhook-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Setup logger with environment-specific configuration
export const setupLogger = () => {
  // If we're in production, log to a file as well
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
    logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
  }

  // Set log level based on environment
  logger.level = process.env.LOG_LEVEL || 'info';

  logger.info('Logger initialized');
};
