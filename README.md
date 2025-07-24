# Traefik with OAuth2 Proxy

This project sets up Traefik as a reverse proxy with OAuth2 authentication via GitHub.

## Setup Instructions

### 1. Register a GitHub OAuth Application

1. Go to your GitHub account settings -> Developer settings -> OAuth Apps -> New OAuth App
2. Set the following values:
   - Application name: `Marlene Cloud Auth`
   - Homepage URL: `https://auth.marlene.cloud`
   - Authorization callback URL: `https://auth.marlene.cloud/oauth2/callback`
3. Register the application and note the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Copy the provided `.env` file and fill in the GitHub credentials:
   ```
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

2. Generate a random cookie secret (32 characters) and add it to the `.env` file:
   ```bash
   openssl rand -base64 32
   ```

3. Update the `GITHUB_ALLOWED_USERS` variable with the GitHub usernames that should have access.

### 3. Create the Docker Network

```bash
docker network create traefik
```

### 4. Start the Services

```bash
docker-compose up -d
```

### 5. Access the Application

Navigate to `https://whoami.marlene.cloud`. You will be redirected to GitHub for authentication.

## Configuration Options

- To allow entire GitHub organizations, uncomment and set the `GITHUB_ALLOWED_ORGS` variable
- To allow specific teams, uncomment and set the `GITHUB_ALLOWED_TEAMS` variable
