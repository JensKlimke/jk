import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';
import { StorageService } from './storage.interface';

export class FileStorageService implements StorageService {
  private apiId: string | null = null;
  private readonly instanceKey: string;
  private readonly dataFolder: string;
  private readonly filePath: string;

  constructor() {
    this.instanceKey = this.getInstanceKey();
    
    // Use a test-friendly path when running in test environment
    if (process.env.NODE_ENV === 'test') {
      this.dataFolder = process.env.DATA_FOLDER || './test-data';
    } else {
      this.dataFolder = process.env.DATA_FOLDER || '/var/data';
    }
    
    this.filePath = path.join(this.dataFolder, this.instanceKey);
    
    // Ensure data folder exists
    this.ensureDataFolderExists();
  }
  
  private getInstanceKey(): string {
    // Use INSTANCE_KEY environment variable if provided, otherwise use hostname
    const instanceKey = process.env.INSTANCE_KEY || require('os').hostname();
    logger.info('Using instance key for file storage:', { instanceKey });
    return instanceKey;
  }

  private ensureDataFolderExists(): void {
    try {
      if (!fs.existsSync(this.dataFolder)) {
        fs.mkdirSync(this.dataFolder, { recursive: true });
        logger.info(`Created data folder: ${this.dataFolder}`);
      }
    } catch (error) {
      logger.error(`Failed to create data folder: ${this.dataFolder}`, error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    // No connection needed for file storage
    logger.info('File storage initialized');
    return Promise.resolve();
  }

  async connectWithRetry(maxRetries: number = 3, retryInterval: number = 1000): Promise<void> {
    // No connection needed for file storage, but we'll try to ensure the data folder exists
    let retries = 0;
    while (retries < maxRetries) {
      try {
        this.ensureDataFolderExists();
        logger.info('File storage initialized after retries');
        return Promise.resolve();
      } catch (error) {
        retries++;
        logger.warn(`Failed to initialize file storage (attempt ${retries}). Retrying in ${retryInterval}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    throw new Error(`Failed to initialize file storage after ${maxRetries} attempts`);
  }

  async getOrCreateApiId(): Promise<string> {
    if (this.apiId) {
      return this.apiId;
    }

    try {
      // Try to read existing data from file
      const data = await this.readFromFile();
      
      if (data && data.apiId) {
        this.apiId = data.apiId;
        logger.info('Retrieved existing app ID from file:', { apiId: this.apiId, instanceKey: this.instanceKey });
      } else {
        // Create a new app ID if none exists
        this.apiId = uuidv4();
        await this.writeToFile({
          apiId: this.apiId,
          createdAt: new Date()
        });
        logger.info('Created new app ID in file:', { apiId: this.apiId, instanceKey: this.instanceKey });
      }

      return this.apiId!;
    } catch (error) {
      logger.error('Error getting or creating app ID in file:', error);
      throw error;
    }
  }

  private async readFromFile(): Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        if (err) {
          // If file doesn't exist, return null (not an error)
          if (err.code === 'ENOENT') {
            resolve(null);
          } else {
            logger.error(`Error reading file: ${this.filePath}`, err);
            reject(err);
          }
          return;
        }

        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (parseError) {
          logger.error(`Error parsing JSON from file: ${this.filePath}`, parseError);
          reject(parseError);
        }
      });
    });
  }

  private async writeToFile(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFile(this.filePath, jsonData, 'utf8', (err) => {
        if (err) {
          logger.error(`Error writing to file: ${this.filePath}`, err);
          reject(err);
          return;
        }
        logger.debug(`Successfully wrote to file: ${this.filePath}`);
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    // No connection to close for file storage
    logger.info('File storage closed');
    return Promise.resolve();
  }
}