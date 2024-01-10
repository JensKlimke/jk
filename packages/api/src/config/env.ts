import dotenv from 'dotenv';
import process from "process";

// configure dotenv
dotenv.config();


// port, host and paths
export const PORT = process.env.PORT || 3003;
export const HOST_URL = process.env.API_URL || `http://localhost:${PORT}`;
export const CODE_KEY = process.env.CODE_KEY || 'code';
export const AUTH_URL = process.env.AUTH_URL || `${HOST_URL}/v1/auth/${CODE_KEY}`


// secrets
export const STATE_SECRET = process.env.STATE_SECRET || 'neAmWOyc5dAsPYWa00y';
export const SESSION_SECRET = process.env.SESSION_SECRET || 'o0k37373sp3fe893jvf';


// create host, port and finally url from env
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = process.env.REDIS_PORT || '6379';


// get github constants
export const GITHUB_AUTHORIZE_URL = process.env.AUTH_GITHUB_AUTHORIZE_URL || 'https://github.com/login/oauth/authorize';
export const GITHUB_TOKEN_URL = process.env.AUTH_GITHUB_TOKEN_URL || 'https://github.com/login/oauth/access_token';
export const GITHUB_USER_URL = process.env.AUTH_GITHUB_USER_URL || 'https://api.github.com/user';
export const GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_CLIENT_SECRET || '';

export const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || null;


// database numbers
export const DATABASE_DEBUG = Number.parseInt(process.env.DATABASE_INDEX_DEBUG || '0');
export const DATABASE_AUTH = Number.parseInt(process.env.DATABASE_INDEX_AUTH || '1');
export const DATABASE_FINANCE = Number.parseInt(process.env.DATABASE_INDEX_FINACE || '2');


// table keys
export const AUTH_DB_KEY = process.env.AUTH_DB_KEY || 'auth';
export const USER_DB_KEY = process.env.USER_DB_KEY || 'users';


export const API_ENV = process.env.API_ENV || 'prod';


export const LOG_DIR = process.env.LOG_DIR || '/tmp/log';

export const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
