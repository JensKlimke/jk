import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import extract from 'extract-zip';
import { ArtifactService, ArtifactInfo } from '../src/services/artifact.service';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('axios');
jest.mock('extract-zip');

describe('ArtifactService', () => {
  let artifactService: ArtifactService;
  const mockTempDir = '/tmp';
  const mockWebRoot = '/var/www';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock environment variables
    process.env.TEMP_DIR = mockTempDir;
    process.env.WEB_ROOT = mockWebRoot;

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
      })
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    (fs.remove as jest.Mock).mockResolvedValue(undefined);

    // Mock axios
    (axios as unknown as jest.Mock).mockResolvedValue({
      data: {
        pipe: jest.fn()
      }
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
        url: 'https://github.com/owner/repo/actions/runs/run-id',
        repository: 'owner/repo',
        commit: 'commit-sha',
        webapp: 'test-app'
      };

      // Act
      const result = await artifactService.processArtifact(artifactInfo);

      // Assert
      // Check that temp directory was created
      expect(fs.ensureDirSync).toHaveBeenCalledWith(mockTempDir);

      // Check that axios was called with the correct URL
      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: artifactInfo.url,
        responseType: 'stream'
      });

      // Check that the target directory was created
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(mockWebRoot, artifactInfo.webapp));

      // Check that extract-zip was called with the correct paths
      const expectedZipPath = path.join(mockTempDir, `${artifactInfo.repository.replace('/', '-')}-${artifactInfo.commit}.zip`);
      expect(extract).toHaveBeenCalledWith(expectedZipPath, {
        dir: path.join(mockWebRoot, artifactInfo.webapp)
      });

      // Check that the temp file was removed
      expect(fs.remove).toHaveBeenCalledWith(expectedZipPath);

      // Check the return value
      expect(result).toBe(path.join(mockWebRoot, artifactInfo.webapp));
    });

    it('should handle download errors', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        url: 'https://github.com/owner/repo/actions/runs/run-id',
        repository: 'owner/repo',
        commit: 'commit-sha',
        webapp: 'test-app'
      };

      // Mock axios to throw an error
      (axios as unknown as jest.Mock).mockRejectedValue(new Error('Download failed'));

      // Act & Assert
      await expect(artifactService.processArtifact(artifactInfo)).rejects.toThrow('Failed to download artifact');
    });

    it('should handle extraction errors', async () => {
      // Arrange
      const artifactInfo: ArtifactInfo = {
        url: 'https://github.com/owner/repo/actions/runs/run-id',
        repository: 'owner/repo',
        commit: 'commit-sha',
        webapp: 'test-app'
      };

      // Mock extract-zip to throw an error
      (extract as unknown as jest.Mock).mockRejectedValue(new Error('Extraction failed'));

      // Act & Assert
      await expect(artifactService.processArtifact(artifactInfo)).rejects.toThrow('Failed to extract artifact');
    });
  });
});
