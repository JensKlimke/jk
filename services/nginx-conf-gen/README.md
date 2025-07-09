# Nginx Configuration Generator

A TypeScript utility for generating Nginx configuration files from Mustache templates and JSON data.

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd services/nginx-conf-gen

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### As a Command Line Tool

```bash
# Generate a configuration file
node dist/index.js <template-path> <json-path> <output-path>

# Example
node dist/index.js templates/service.conf.mustache templates/service.conf.json output/nginx.conf
```

If no output path is provided, the generated configuration will be printed to stdout.

### As a Library

```typescript
import { ConfigGenerator } from 'nginx-conf-gen';

async function generateConfig() {
  const generator = new ConfigGenerator();
  
  // Generate a configuration file
  const result = await generator.generateConfig(
    'templates/service.conf.mustache',
    'templates/service.conf.json',
    'output/nginx.conf'
  );
  
  console.log('Configuration generated successfully!');
}

generateConfig().catch(console.error);
```

## Project Structure

```
nginx-conf-gen/
├── dist/               # Compiled JavaScript files
├── src/                # TypeScript source code
│   ├── configGenerator.ts  # Main configuration generator class
│   └── index.ts        # Entry point and CLI interface
├── templates/          # Mustache templates and JSON data
│   ├── service.conf.json
│   └── service.conf.mustache
├── tests/              # Test files
│   ├── configGenerator.test.ts
│   └── integration.test.ts
├── package.json        # Project metadata and dependencies
├── tsconfig.json       # TypeScript configuration
└── jest.config.js      # Jest test configuration
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

### Building the Project

```bash
# Build the project
npm run build
```

## Template Format

The template uses Mustache syntax for variable substitution and conditional rendering. Here's an example:

```mustache
server {
    listen 80;
    server_name {{host}};
    
    {{#ssl}}
    # SSL configuration
    ssl_certificate {{cert_file}};
    ssl_certificate_key {{key_file}};
    {{/ssl}}
    
    location / {
        proxy_pass http://{{service}}:{{port}}/;
    }
}
```

## JSON Format

The JSON file should match the structure expected by the template. Here's an example:

```json
{
  "services": [
    {
      "host": "example.com",
      "ssl": true,
      "cert_file": "/path/to/cert.pem",
      "key_file": "/path/to/key.pem",
      "service": "app",
      "port": "8080"
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.