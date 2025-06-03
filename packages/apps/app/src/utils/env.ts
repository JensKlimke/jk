/**
 * Environment variables for the application
 *
 * These are loaded from Vite's import.meta.env
 * with fallback to default values for local development
 */

// Check if import.meta.env is available (it won't be in test environment)
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
const env = isTestEnv
  ? { VITE_API_URL: 'http://localhost:3001/api', VITE_WHOIS_URL: 'http://localhost:3002/api' }
  : import.meta.env;

// API URLs
export const API_URL = env.VITE_API_URL || 'http://localhost:3001/api';
export const WHOIS_URL = env.VITE_WHOIS_URL || 'http://localhost:3002/api';
