// Mock for Vite's import.meta.env
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001/api',
      VITE_WHOIS_URL: 'http://localhost:3002/api',
      MODE: 'test',
      DEV: false,
      PROD: true
    }
  }
};