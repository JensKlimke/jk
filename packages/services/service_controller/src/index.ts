import { startTemplateProcessor } from './templateProcessor';

// Start the template processor
console.log('Starting Nginx Template Processor...');
startTemplateProcessor().catch(error => {
  console.error('Error starting template processor:', error);
  process.exit(1);
});
