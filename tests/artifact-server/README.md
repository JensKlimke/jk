# Artifact Server

A simple HTTP server to serve the `index.html.zip` file as an artifact.

## Overview

This server provides access to the `index.html.zip` file located in the `tests` directory. It serves the file with appropriate headers for downloading.

## Usage

### Starting the Server

To start the artifact server:

```bash
# Navigate to the artifact-server directory
cd tests/artifact-server

# Start the server
node server.js
```

By default, the server runs on port 3000. You can configure a different port using the `PORT` environment variable:

```bash
PORT=8080 node server.js
```

### Accessing the Artifact

Once the server is running, you can access the artifact at:

- http://localhost:3000/
- http://localhost:3000/artifact

Both URLs will serve the `index.html.zip` file as a downloadable artifact.

## Configuration

The server can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT     | The port on which the server listens | 3000 |

## Error Handling

The server handles the following error cases:

- File not found: Returns a 404 status code
- Server errors: Returns a 500 status code
- Port already in use: Logs an error message

## Stopping the Server

To stop the server, press `Ctrl+C` in the terminal where it's running.