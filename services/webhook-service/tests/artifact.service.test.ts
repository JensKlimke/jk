import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import extract from 'extract-zip';
import { ArtifactService, ArtifactInfo } from '../src/services/artifact.service';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('axios');
jest.mock('extract-zip');
jest.mock('uuid');

describe('ArtifactService', () => {
  let artifactService: ArtifactService;
  const mockTempDir = '/tmp';
  const mockWebRoot = '/var/www';
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock environment variables
    process.env.TEMP_DIR = mockTempDir;
    process.env.WEB_ROOT = mockWebRoot;
    process.env.GITHUB_TOKEN = 'mock-github-token';

    // Mock uuid
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);

    // Mock fs-extra methods
    (fs.ensureDirSync as jest.Mock).mockImplementation(() => {});
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
    // Create a mock object with an 'on' method that returns itself
    const mockWriteStream = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return mockWriteStream;
      }),
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.remove as jest.Mock).mockResolvedValue(undefined);

    // Mock axios for download
    (axios as unknown as jest.Mock).mockImplementation(_config => {
      // It's a download request
      return Promise.resolve({
        data: {
          pipe: jest.fn(writeStream => {
            // Simulate successful download by triggering the 'finish' event
            setTimeout(() => {
              if (writeStream.on && typeof writeStream.on === 'function') {
                const finishCallback = writeStream.on.mock.calls.find(
                  (call: any[]) => call[0] === 'finish',
                )?.[1];
                if (finishCallback) finishCallback();
              }
            }, 10);
            return writeStream;
          }),
        },
      });
    });

    // Mock extract-zip
    (extract as unknown as jest.Mock).mockResolvedValue(undefined);

    // Create instance of ArtifactService
    artifactService = new ArtifactService();
  });

  describe('processArtifact', () => {
    it('should download and extract the artifact', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        platform: 'github.com',
        repository: 'owner/repo',
        artifact_id: 'sample123',
        digest: 'abc123',
        webapp: 'test-app',
      };

      // Act
      const result = await artifactService.processArtifact(artifactInfo);

      // Assert
      // Check that temp directory was created
      expect(fs.ensureDirSync).toHaveBeenCalledWith(mockTempDir);

      // Check that axios was called for download with correct GitHub API URL and headers
      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.github.com/repos/owner/repo/actions/artifacts/sample123/zip',
        responseType: 'stream',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer mock-github-token',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      // Check that the target directory was created
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockWebRoot, artifactInfo.webapp));

      // Check that extract-zip was called with the correct paths
      const expectedZipPath = path.join(mockTempDir, `artifact-${mockUuid}.zip`);
      expect(extract).toHaveBeenCalledWith(expectedZipPath, {
        dir: path.join(mockWebRoot, artifactInfo.webapp),
      });

      // Check that the temp file was removed
      expect(fs.remove).toHaveBeenCalledWith(expectedZipPath);

      // Check the return value
      expect(result).toBe(path.join(mockWebRoot, artifactInfo.webapp));
    });

    it('should handle download errors', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        platform: 'github.com',
        repository: 'owner/repo',
        artifact_id: 'sample123',
        digest: 'abc123',
        webapp: 'test-app',
      };

      // Mock axios to throw an error for download
      (axios as unknown as jest.Mock).mockRejectedValue(new Error('Download failed'));

      // Act & Assert
      await expect(artifactService.processArtifact(artifactInfo)).rejects.toThrow(
        'Failed to download artifact',
      );
    });

    it('should handle extraction errors', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        platform: 'github.com',
        repository: 'owner/repo',
        artifact_id: 'sample123',
        digest: 'abc123',
        webapp: 'test-app',
      };

      // Mock extract-zip to throw an error
      (extract as unknown as jest.Mock).mockRejectedValue(new Error('Extraction failed'));

      // Act & Assert
      await expect(artifactService.processArtifact(artifactInfo)).rejects.toThrow(
        'Failed to extract artifact',
      );
    });

    it('should throw an error for unsupported platforms', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        platform: 'gitlab.com', // Unsupported platform
        repository: 'owner/repo',
        artifact_id: 'sample123',
        digest: 'abc123',
        webapp: 'test-app',
      };

      // Act & Assert
      await expect(artifactService.processArtifact(artifactInfo)).rejects.toThrow(
        'Unsupported platform',
      );
    });
  });
});
