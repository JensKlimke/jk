import log from "loglevel";

export const LOG_SYSTEM_KEY = process.env.REACT_APP_LOG_SYSTEM_KEY || 'app';

export const logger = log.getLogger(LOG_SYSTEM_KEY);
