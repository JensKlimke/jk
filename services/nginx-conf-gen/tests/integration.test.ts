import * as path from 'path';
import * as fs from 'fs-extra';
import { ConfigGenerator } from '../src';

// This test uses the actual template and JSON files
describe('Integration Test', () => {
  let generator: ConfigGenerator;
  const templatePath = path.resolve(__dirname, '../templates/service.conf.mustache');
  const jsonPath = path.resolve(__dirname, '../templates/service.conf.json');

  // Sample expected output for auth.marlene.cloud.conf
  const expectedAuthConfSnippet = 'server_name auth.marlene.cloud;';

  // Sample expected output for whoami.marlene.cloud.conf
  const expectedWhoamiConfSnippet = 'server_name whoami.marlene.cloud;';

  beforeEach(() => {
    // Create a new instance of ConfigGenerator
    generator = new ConfigGenerator();
  });

  // Skip this test in CI environments where the files might not exist
  test('should render the actual template with the actual JSON', async () => {
    // Check if the files exist before running the test
    const templateExists = await fs.pathExists(templatePath);
    const jsonExists = await fs.pathExists(jsonPath);

    if (!templateExists || !jsonExists) {
      console.warn(`Skipping integration test: Template or JSON file not found.
        Template path: ${templatePath}
        JSON path: ${jsonPath}`);
      return;
    }

    // Generate the configuration
    const result = await generator.generateConfig(templatePath, jsonPath, '');

    // Verify that the output contains expected content for both services
    expect(result).toContain(expectedAuthConfSnippet);
    expect(result).toContain(expectedWhoamiConfSnippet);

    // Verify SSL configuration
    expect(result).toContain('ssl_certificate');
    expect(result).toContain('ssl_certificate_key');

    // Verify auth configuration for whoami service
    expect(result).toContain('auth_request /oauth2/auth');
    expect(result).toContain('proxy_set_header X-User');

    // Verify proxy_pass configuration
    expect(result).toContain('proxy_pass http://oauth2-proxy:4180/');
    expect(result).toContain('proxy_pass http://whoami:80/');
  });
});
