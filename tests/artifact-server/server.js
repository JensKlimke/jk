const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const ZIP_FILE_PATH = path.resolve(__dirname, '../index.html.zip');

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Only serve the zip file for now
  if (req.url === '/artifact' || req.url === '/') {
    // Check if file exists
    if (!fs.existsSync(ZIP_FILE_PATH)) {
      console.error(`File not found: ${ZIP_FILE_PATH}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Artifact not found');
      return;
    }

    try {
      // Get file stats
      const stat = fs.statSync(ZIP_FILE_PATH);
      
      // Set appropriate headers
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="index.html.zip"',
        'Content-Length': stat.size
      });
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(ZIP_FILE_PATH);
      fileStream.pipe(res);
      
      // Handle errors in the stream
      fileStream.on('error', (err) => {
        console.error('Error streaming file:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
      
      console.log(`Serving artifact: ${ZIP_FILE_PATH}`);
    } catch (err) {
      console.error('Error serving file:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    // Handle other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Artifact server running at http://localhost:${PORT}`);
  console.log(`Serving zip file from: ${ZIP_FILE_PATH}`);
  console.log(`Access the artifact at: http://localhost:${PORT}/artifact`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port.`);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});