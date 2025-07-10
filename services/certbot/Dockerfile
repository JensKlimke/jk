FROM certbot/certbot:latest

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Keep the original entrypoint
ENTRYPOINT ["/bin/sh"]