import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import extract from 'extract-zip';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

export interface ArtifactInfo {
  url: string;
  repository: string;
  commit: string;
  webapp: string;
}

export class ArtifactService {
  private tempDir: string;
  private webRoot: string;

  constructor() {
    this.tempDir = path.resolve(process.env.TEMP_DIR || './temp');
    this.webRoot = path.resolve(process.env.WEB_ROOT || '/var/www');
    
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Process an artifact by downloading and extracting it
   */
  public async processArtifact(artifactInfo: ArtifactInfo): Promise<string> {
    try {
      logger.info(`Processing artifact for ${artifactInfo.webapp}`, { artifactInfo });
      
      // Create unique filename for the artifact
      const filename = `${artifactInfo.repository.replace('/', '-')}-${artifactInfo.commit}.zip`;
      const tempFilePath = path.join(this.tempDir, filename);
      
      // Download the artifact
      await this.downloadArtifact(artifactInfo.url, tempFilePath);
      
      // Extract the artifact
      const extractPath = await this.extractArtifact(tempFilePath, artifactInfo.webapp);
      
      // Clean up temp file
      await fs.remove(tempFilePath);
      
      return extractPath;
    } catch (error) {
      logger.error('Error processing artifact', { error, artifactInfo });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Failed to process artifact: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Download an artifact from a URL to a local file
   */
  private async downloadArtifact(url: string, outputPath: string): Promise<void> {
    try {
      logger.info(`Downloading artifact from ${url}`);
      
      // Make a GET request to the artifact URL
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });
      
      // Create write stream
      const writer = fs.createWriteStream(outputPath);
      
      // Pipe the response data to the file
      response.data.pipe(writer);
      
      // Return a promise that resolves when the download is complete
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      logger.error('Error downloading artifact', { error, url });
      throw new AppError(`Failed to download artifact: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Extract a zip file to the webapp directory
   */
  private async extractArtifact(zipPath: string, webapp: string): Promise<string> {
    try {
      logger.info(`Extracting artifact to webapp ${webapp}`);
      
      // Create the target directory path
      const targetDir = path.join(this.webRoot, webapp);
      
      // Ensure the target directory exists
      await fs.ensureDir(targetDir);
      
      // Extract the zip file
      await extract(zipPath, { dir: targetDir });
      
      logger.info(`Artifact extracted successfully to ${targetDir}`);
      
      return targetDir;
    } catch (error) {
      logger.error('Error extracting artifact', { error, zipPath, webapp });
      throw new AppError(`Failed to extract artifact: ${(error as Error).message}`, 500);
    }
  }
}