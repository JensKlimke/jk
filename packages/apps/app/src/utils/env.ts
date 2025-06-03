/**
 * Environment variables for the application
 * 
 * These are loaded from Vite's import.meta.env
 * with fallback to default values for local development
 */

// API URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const WHOIS_URL = import.meta.env.VITE_WHOIS_URL || 'http://localhost:3002/api';
