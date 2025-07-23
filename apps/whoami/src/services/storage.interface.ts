/**
 * Common interface for storage services
 * This ensures both DatabaseService and FileStorageService have the same methods
 */
export interface StorageService {
  /**
   * Connect to the storage
   */
  connect(): Promise<void>;
  
  /**
   * Connect to the storage with retry mechanism
   * @param maxRetries Maximum number of retries
   * @param retryInterval Interval between retries in milliseconds
   */
  connectWithRetry(maxRetries?: number, retryInterval?: number): Promise<void>;
  
  /**
   * Get or create a unique API ID
   * @returns Promise resolving to the API ID
   */
  getOrCreateApiId(): Promise<string>;
  
  /**
   * Close the connection to the storage
   */
  close(): Promise<void>;
}