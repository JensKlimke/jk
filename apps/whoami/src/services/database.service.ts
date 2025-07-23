import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {ApiInfoModel} from "../models/apiInfo.model";
import logger from '../utils/logger';
import { StorageService } from './storage.interface';

const MONGO_ACCESS_URL = `mongodb://${process.env.MONGO_WEB_USER || 'web'}:${process.env.MONGO_WEB_PASSWORD || 'webpassword'}@${process.env.MONGO_UPSTREAM_URL || 'mongodb:27017'}/web?authSource=admin`

export class DatabaseService implements StorageService {
  private apiId: string | null = null;
  private readonly instanceKey: string;

  constructor(
    private readonly uri: string = MONGO_ACCESS_URL
  ) {
    this.instanceKey = this.getInstanceKey();
    logger.info('Using MongoDB for storage');
  }
  
  private getInstanceKey(): string {
    // Use INSTANCE_KEY environment variable if provided, otherwise use hostname
    const instanceKey = process.env.INSTANCE_KEY || require('os').hostname();
    logger.info('Using instance key:', { instanceKey });
    return instanceKey;
  }

  async connect(): Promise<void> {
    try {
      // Connect directly to maintain the original error message for tests
      await mongoose.connect(this.uri);
      logger.info('Connected to MongoDB using Mongoose');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async connectWithRetry(maxRetries: number = Infinity, retryInterval: number = 1000): Promise<void> {
    let retries = 0;
    while (maxRetries === Infinity || retries < maxRetries) {
      try {
        await mongoose.connect(this.uri);
        logger.info('Connected to MongoDB using Mongoose after retries');
        return;
      } catch (error) {
        retries++;
        logger.warn(`Failed to connect to MongoDB (attempt ${retries}). Retrying in ${retryInterval}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
  }

  async getOrCreateApiId(): Promise<string> {
    if (this.apiId) {
      return this.apiId;
    }

    try {
      // Try to find an existing app ID for this instance
      const apiInfo = await ApiInfoModel.findOne({ _id: this.instanceKey });

      if (apiInfo) {
        this.apiId = apiInfo.apiId;
        logger.info('Retrieved existing app ID:', { apiId: this.apiId, instanceKey: this.instanceKey });
      } else {
        // Create a new app ID if none exists for this instance
        this.apiId = uuidv4();
        await ApiInfoModel.create({
          _id: this.instanceKey,
          apiId: this.apiId,
          createdAt: new Date()
        });
        logger.info('Created new app ID:', { apiId: this.apiId, instanceKey: this.instanceKey });
      }

      return this.apiId;
    } catch (error) {
      logger.error('Error getting or creating app ID:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info('Disconnected from MongoDB');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }
}
