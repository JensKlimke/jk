#!/usr/bin/env node

import { ConfigGenerator } from './controllers/configGenerator';

/**
 * Main entry point for the Nginx configuration generator
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.length < 1) {
      console.error('Usage: nginx-conf-gen <template-path> [output-path] [auth-service]');
      process.exit(1);
    }

    const templatePath = args[0];
    const outputPath = args[1] || '';
    const authService = args[2]; // Optional auth service name

    // Create a new config generator
    const generator = new ConfigGenerator();

    // Generate the configuration
    const result = await generator.generateConfig(templatePath, outputPath, authService);

    // If no output path was provided, print the result to stdout
    if (!outputPath) {
      console.log(result);
    } else {
      console.log(`Configuration generated successfully: ${outputPath}`);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

// Export the ConfigGenerator class for use as a library
export { ConfigGenerator };
