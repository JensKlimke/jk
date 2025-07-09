import { generateServicesJson } from './generateServicesJson';

/**
 * Test script to verify the generateServicesJson functionality
 */
async function testGenerateServicesJson() {
  try {
    console.log('Testing generateServicesJson...');

    // Get command line arguments
    const args = process.argv.slice(2);
    const authService = args[0]; // Optional auth service name

    console.log(`Testing generateServicesJson${authService ? ` with auth service: ${authService}` : ''}`);

    // Generate services.json with provided parameters
    const servicesJson = await generateServicesJson(authService);

    // Print the result
    console.log('Generated services.json:');
    console.log(JSON.stringify(servicesJson, null, 2));

    console.log(`Found ${servicesJson.services.length} services with VIRTUAL_HOST`);

    // Print each service
    servicesJson.services.forEach(service => {
      console.log(`- ${service.host} -> ${service.service}:${service.port}`);
      if (service.auth) {
        console.log(`  (Protected by ${service.auth.name} on port ${service.auth.port})`);
      }
    });
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the test
testGenerateServicesJson();
