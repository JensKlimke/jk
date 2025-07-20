const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;
const WEB_ROOT = process.env.WEB_ROOT || '/var/www';

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the web root directory
app.use(express.static(WEB_ROOT));

// Start the server
app.listen(PORT, () => {
  console.log(`Artifact server running on port ${PORT}`);
  console.log(`Serving files from ${WEB_ROOT}`);
});
