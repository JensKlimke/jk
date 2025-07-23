# OAuth Providers Configuration

This guide covers setting up OAuth2 authentication with different providers for use with the infrastructure.

## Supported Providers

The OAuth2 Proxy supports multiple providers, including:

- GitHub
- Google
- Microsoft Azure
- Facebook
- GitLab
- LinkedIn
- And many others

Full list: [OAuth2 Proxy Providers](https://oauth2-proxy.github.io/oauth2-proxy/docs/configuration/oauth_provider)

## General Configuration

For any OAuth provider, you'll need to set these environment variables in your `.env` file:

```bash
OAUTH2_SUBDOMAIN=auth
OAUTH2_PROVIDER=<provider_name>
OAUTH2_CLIENT_ID=<your_client_id>
OAUTH2_CLIENT_SECRET=<your_client_secret>
OAUTH2_COOKIE_SECRET=<random_32_char_string>
```

The cookie secret should be a random string at least 32 characters long. You can generate one using the `generate-secrets.sh` script.

## Provider-Specific Setup

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: Your app name
   - Homepage URL: `https://public.yourdomain.com`
   - Authorization callback URL: `https://auth.yourdomain.com/oauth2/callback`
4. Register the application
5. You'll receive a Client ID and can generate a Client Secret
6. Update your `.env` file:

```bash
OAUTH2_PROVIDER=github
OAUTH2_CLIENT_ID=<your_github_client_id>
OAUTH2_CLIENT_SECRET=<your_github_client_secret>
```

### Google

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URIs: `https://auth.yourdomain.com/oauth2/callback`
8. Create the client
9. You'll receive a Client ID and Client Secret
10. Update your `.env` file:

```bash
OAUTH2_PROVIDER=google
OAUTH2_CLIENT_ID=<your_google_client_id>
OAUTH2_CLIENT_SECRET=<your_google_client_secret>
```

### Microsoft Azure

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Enter a name for your application
5. Set the redirect URI as Web platform: `https://auth.yourdomain.com/oauth2/callback`
6. Register the application
7. Go to "Certificates & secrets" and create a new client secret
8. Update your `.env` file:

```bash
OAUTH2_PROVIDER=azure
OAUTH2_CLIENT_ID=<your_azure_client_id>
OAUTH2_CLIENT_SECRET=<your_azure_client_secret>
```

### GitLab

1. Go to GitLab and navigate to your profile settings
2. Select "Applications"
3. Create a new application with:
   - Name: Your app name
   - Redirect URI: `https://auth.yourdomain.com/oauth2/callback`
   - Scopes: `read_user` and `openid`
4. Submit the application
5. You'll receive an Application ID and Secret
6. Update your `.env` file:

```bash
OAUTH2_PROVIDER=gitlab
OAUTH2_CLIENT_ID=<your_gitlab_application_id>
OAUTH2_CLIENT_SECRET=<your_gitlab_secret>
```

## Advanced Configuration

### Restricting Access by Email Domain

To restrict access to specific email domains, add to your `docker-compose.yml` in the oauth2-proxy service:

```yaml
environment:
  - OAUTH2_PROXY_EMAIL_DOMAINS=yourdomain.com,anotherdomain.com
```

Replace `yourdomain.com,anotherdomain.com` with your allowed domains.

### Allowing Specific Email Addresses

To restrict access to specific email addresses, create a file `allowed-emails.txt` with one email per line, then update your `docker-compose.yml`:

```yaml
volumes:
  - ./allowed-emails.txt:/etc/oauth2-proxy/allowed-emails.txt:ro
environment:
  - OAUTH2_PROXY_AUTHENTICATED_EMAILS_FILE=/etc/oauth2-proxy/allowed-emails.txt
```

### Custom Scopes

To request additional scopes from the OAuth provider, add to your `docker-compose.yml`:

```yaml
environment:
  - OAUTH2_PROXY_SCOPE=user:email,read:org
```

The specific scopes available depend on the provider you're using.

## Troubleshooting

### Authentication Loop

If you're stuck in an authentication loop (continuously redirecting to the login page):

1. Check that your callback URL is correctly configured in both the OAuth provider and your environment variables
2. Verify the cookie secret is at least 32 characters long
3. Ensure cookies are being set correctly (check browser developer tools)
4. Try clearing cookies and cache for your domain

### "Invalid Redirect URI" Error

If you receive an "invalid redirect URI" error:

1. Double-check the redirect URI in your OAuth provider settings matches exactly: `https://auth.yourdomain.com/oauth2/callback`
2. Ensure your `DOMAIN` environment variable is set correctly

### "Access Denied" After Authentication

If authentication succeeds but you still see "Access Denied":

1. Check if you've restricted access by email domain or specific emails
2. Verify the authenticated email matches your restrictions
3. Look at the OAuth2 Proxy logs: `make logs-oauth2-proxy`

## Provider-Specific Options

Some providers require additional configuration. Check the [OAuth2 Proxy documentation](https://oauth2-proxy.github.io/oauth2-proxy/docs/configuration/oauth_provider) for your specific provider.

You can add any additional configuration options to the oauth2-proxy service in your `docker-compose.yml` file.
