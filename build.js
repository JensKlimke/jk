const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define the order of packages to build
const buildOrder = [
  '@jk/models',
  '@jk/api-server',
  '@jk/api',
  '@jk/whois',
  '@jk/app'
];

console.log('Building packages in order...');

// Build each package in order
buildOrder.forEach(packageName => {
  console.log(`\nBuilding ${packageName}...`);
  try {
    execSync(`npm run build --workspace=${packageName}`, { stdio: 'inherit' });
    console.log(`Successfully built ${packageName}`);
  } catch (error) {
    console.error(`Error building ${packageName}:`, error.message);
    process.exit(1);
  }
});

console.log('\nAll packages built successfully!');