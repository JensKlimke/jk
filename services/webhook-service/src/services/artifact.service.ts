import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import extract from 'extract-zip';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export interface ArtifactInfo {
  platform: string;
  repository: string;
  artifact_id: string;
  digest?: string;
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
      logger.info(`Processing artifact for ${artifactInfo.webapp}`, { 
        platform: artifactInfo.platform,
        repository: artifactInfo.repository,
        artifact_id: artifactInfo.artifact_id,
        digest: artifactInfo.digest,
        webapp: artifactInfo.webapp
      });
      
      // Create unique filename for the artifact
      const filename = `artifact-${uuidv4()}.zip`;
      const tempFilePath = path.join(this.tempDir, filename);
      
      // Download the artifact
      await this.downloadArtifact(artifactInfo, tempFilePath);
      
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
   * Download an artifact from GitHub to a local file
   */
  private async downloadArtifact(artifactInfo: ArtifactInfo, outputPath: string): Promise<void> {
    try {
      // Ensure we're dealing with GitHub artifacts
      if (artifactInfo.platform !== 'github.com') {
        throw new AppError(`Unsupported platform: ${artifactInfo.platform}. Only github.com is supported.`, 400);
      }
      
      // Construct the GitHub API URL
      const url = `https://api.github.com/repos/${artifactInfo.repository}/actions/artifacts/${artifactInfo.artifact_id}/zip`;
      
      logger.info(`Downloading artifact from ${url}`);
      
      // Get GitHub token from environment variables
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new AppError('GitHub token is not configured', 500);
      }
      
      // Make a GET request to the GitHub API
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
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
      logger.error('Error downloading artifact', { error, artifactInfo });
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