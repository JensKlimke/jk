# Traefik Migration Plan

## Overall Goal

Migrate the current nginx-based reverse proxy infrastructure to Traefik to achieve:
- **Simplified architecture**: Replace nginx-reverse-proxy + nginx-services with a single Traefik container
- **Dynamic service discovery**: Replace VIRTUAL_HOST environment variables with Docker labels
- **Built-in SSL management**: Replace custom Let's Encrypt integration with Traefik's ACME support
- **Middleware-based authentication**: Replace nginx auth configuration with Traefik middleware
- **Improved operational simplicity**: Eliminate custom configuration generation and template processing

## Current Architecture Summary

**Services using VIRTUAL_HOST:**
- `webhook-service`: deploy.${DOMAIN}
- `oauth2-proxy`: auth.${DOMAIN}
- `whoami`: whoami.${DOMAIN} (WITH_AUTH_HEADERS: true)
- `shorty-webserver`: shorty.${DOMAIN} (WITH_AUTH: true)
- `influxdb`: influx.${DOMAIN} (WITH_AUTH: true)
- `mongo-express`: mongo.${DOMAIN} (WITH_AUTH: true)

**Current Components to Replace:**
- nginx-reverse-proxy container (ports 80/443)
- nginx-services container (TypeScript configuration generator)
- nginx configuration volumes and templates
- Custom Let's Encrypt certificate management

## Migration Phases

### Phase 1: Preparation and Backup ⬜

#### 1.1 Create Backup of Current Configuration ⬜
- [ ] **TASK-1.1.1**: Backup current docker-compose files
  ```bash
  cp docker-compose.yml docker-compose.yml.backup
  cp docker-compose.apps.yml docker-compose.apps.yml.backup
  cp docker-compose.db.yml docker-compose.db.yml.backup
  ```
  **Goal**: Ensure rollback capability
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-1.1.2**: Backup nginx configuration and certificates
  ```bash
  docker run --rm -v letsencrypt:/source -v $(pwd)/backup:/backup alpine tar czf /backup/letsencrypt-backup.tar.gz -C /source .
  docker run --rm -v nginx:/source -v $(pwd)/backup:/backup alpine tar czf /backup/nginx-config-backup.tar.gz -C /source .
  ```
  **Goal**: Preserve existing SSL certificates and configurations
  **Documentation**: _[To be filled after completion]_

#### 1.2 Document Current Service Mappings ⬜
- [ ] **TASK-1.2.1**: Create service mapping document
  ```bash
  # Document current VIRTUAL_HOST mappings
  echo "Current Service Mappings:" > current-mappings.txt
  docker-compose config | grep -A 5 -B 5 VIRTUAL_HOST >> current-mappings.txt
  ```
  **Goal**: Reference for Traefik label conversion
  **Documentation**: _[To be filled after completion]_

#### 1.3 Test Current System ⬜
- [ ] **TASK-1.3.1**: Verify all services are accessible
  ```bash
  # Test each service endpoint
  curl -I https://deploy.${DOMAIN}/health || echo "webhook-service: FAIL"
  curl -I https://auth.${DOMAIN}/ping || echo "oauth2-proxy: FAIL"
  curl -I https://whoami.${DOMAIN}/ || echo "whoami: FAIL"
  curl -I https://shorty.${DOMAIN}/ || echo "shorty-webserver: FAIL"
  curl -I https://influx.${DOMAIN}/ || echo "influxdb: FAIL"
  curl -I https://mongo.${DOMAIN}/ || echo "mongo-express: FAIL"
  ```
  **Goal**: Establish baseline functionality
  **Documentation**: _[To be filled after completion]_

### Phase 2: Traefik Container Setup ⬜

#### 2.1 Create Traefik Configuration ⬜
- [ ] **TASK-2.1.1**: Create Traefik static configuration file
  ```yaml
  # Create traefik/traefik.yml
  api:
    dashboard: true
    insecure: false
  
  entryPoints:
    web:
      address: ":80"
      http:
        redirections:
          entrypoint:
            to: websecure
            scheme: https
    websecure:
      address: ":443"
  
  providers:
    docker:
      endpoint: "unix:///var/run/docker.sock"
      exposedByDefault: false
      network: "default"
  
  certificatesResolvers:
    letsencrypt:
      acme:
        email: ${EMAIL}
        storage: /letsencrypt/acme.json
        httpChallenge:
          entryPoint: web
  
  log:
    level: INFO
  
  accessLog: {}
  ```
  **Goal**: Configure Traefik with ACME and Docker provider
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-2.1.2**: Create Traefik service in docker-compose.yml
  ```yaml
  # Add to docker-compose.yml
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard (temporary for testing)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/etc/traefik/traefik.yml:ro
      - traefik-letsencrypt:/letsencrypt
    environment:
      - EMAIL=${EMAIL}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.tls=true"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.service=api@internal"
  ```
  **Goal**: Add Traefik container alongside existing nginx
  **Documentation**: _[To be filled after completion]_

#### 2.2 Initial Traefik Deployment ⬜
- [ ] **TASK-2.2.1**: Add Traefik volume to docker-compose.yml
  ```yaml
  volumes:
    traefik-letsencrypt:
    # ... existing volumes
  ```
  **Goal**: Prepare storage for Traefik certificates
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-2.2.2**: Start Traefik container (parallel to nginx)
  ```bash
  # Temporarily change nginx ports to avoid conflict
  sed -i 's/"80:80"/"8080:80"/g' docker-compose.yml
  sed -i 's/"443:443"/"8443:443"/g' docker-compose.yml
  
  docker-compose up -d traefik
  ```
  **Goal**: Deploy Traefik without disrupting current services
  **Documentation**: _[To be filled after completion]_

#### 2.3 Test Traefik Dashboard ⬜
- [ ] **TASK-2.3.1**: Verify Traefik dashboard access
  ```bash
  # Wait for certificate generation
  sleep 30
  curl -I https://traefik.${DOMAIN}/ || echo "Traefik dashboard: FAIL"
  ```
  **Goal**: Confirm Traefik is running and ACME is working
  **Documentation**: _[To be filled after completion]_

### Phase 3: Service Migration ⬜

#### 3.1 Migrate OAuth2-Proxy (Authentication Service) ⬜
- [ ] **TASK-3.1.1**: Add Traefik labels to oauth2-proxy service
  ```yaml
  # Update docker-compose.yml oauth2-proxy service
  oauth2-proxy:
    # ... existing configuration
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.oauth2-proxy.rule=Host(`auth.${DOMAIN}`)"
      - "traefik.http.routers.oauth2-proxy.tls=true"
      - "traefik.http.routers.oauth2-proxy.tls.certresolver=letsencrypt"
      - "traefik.http.services.oauth2-proxy.loadbalancer.server.port=4180"
  ```
  **Goal**: Make oauth2-proxy accessible through Traefik
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-3.1.2**: Test oauth2-proxy through Traefik
  ```bash
  docker-compose up -d oauth2-proxy
  sleep 10
  curl -I https://auth.${DOMAIN}/ping || echo "OAuth2-proxy via Traefik: FAIL"
  ```
  **Goal**: Verify authentication service works with Traefik
  **Documentation**: _[To be filled after completion]_

#### 3.2 Create Authentication Middleware ⬜
- [ ] **TASK-3.2.1**: Define OAuth2 middleware in docker-compose.yml
  ```yaml
  # Add to oauth2-proxy service labels
  - "traefik.http.middlewares.oauth2-auth.forwardauth.address=http://oauth2-proxy:4180/oauth2/auth"
  - "traefik.http.middlewares.oauth2-auth.forwardauth.trustForwardHeader=true"
  - "traefik.http.middlewares.oauth2-auth.forwardauth.authResponseHeaders=X-Auth-Request-User,X-Auth-Request-Email,X-Auth-Request-Access-Token"
  ```
  **Goal**: Create reusable authentication middleware
  **Documentation**: _[To be filled after completion]_

#### 3.3 Migrate Webhook Service (No Auth) ⬜
- [ ] **TASK-3.3.1**: Add Traefik labels to webhook-service
  ```yaml
  # Update docker-compose.yml webhook-service
  webhook-service:
    # ... existing configuration
    # Remove: VIRTUAL_HOST: "deploy.${DOMAIN}"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.webhook-service.rule=Host(`deploy.${DOMAIN}`)"
      - "traefik.http.routers.webhook-service.tls=true"
      - "traefik.http.routers.webhook-service.tls.certresolver=letsencrypt"
      - "traefik.http.services.webhook-service.loadbalancer.server.port=3000"
  ```
  **Goal**: Migrate first service to validate basic routing
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-3.3.2**: Test webhook-service through Traefik
  ```bash
  docker-compose up -d webhook-service
  sleep 10
  curl -I https://deploy.${DOMAIN}/health || echo "Webhook-service via Traefik: FAIL"
  ```
  **Goal**: Verify service routing works
  **Documentation**: _[To be filled after completion]_

#### 3.4 Migrate Whoami Service (With Auth Headers) ⬜
- [ ] **TASK-3.4.1**: Add Traefik labels to whoami service
  ```yaml
  # Update docker-compose.apps.yml whoami service
  whoami:
    # ... existing configuration
    # Remove: VIRTUAL_HOST: "whoami.${DOMAIN}"
    # Remove: WITH_AUTH_HEADERS: true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whoami.rule=Host(`whoami.${DOMAIN}`)"
      - "traefik.http.routers.whoami.tls=true"
      - "traefik.http.routers.whoami.tls.certresolver=letsencrypt"
      - "traefik.http.routers.whoami.middlewares=oauth2-auth"
      - "traefik.http.services.whoami.loadbalancer.server.port=3000"
  ```
  **Goal**: Test authentication middleware with header passing
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-3.4.2**: Test whoami service authentication
  ```bash
  docker-compose up -d whoami
  sleep 10
  # Test unauthenticated access (should redirect to auth)
  curl -I https://whoami.${DOMAIN}/ | grep -E "(302|401)" || echo "Whoami auth redirect: FAIL"
  ```
  **Goal**: Verify authentication is working
  **Documentation**: _[To be filled after completion]_

#### 3.5 Migrate Remaining Services ⬜
- [ ] **TASK-3.5.1**: Migrate shorty-webserver
  ```yaml
  # Update docker-compose.apps.yml
  shorty-webserver:
    # Remove: VIRTUAL_HOST: "shorty.${DOMAIN}"
    # Remove: WITH_AUTH: true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.shorty.rule=Host(`shorty.${DOMAIN}`)"
      - "traefik.http.routers.shorty.tls=true"
      - "traefik.http.routers.shorty.tls.certresolver=letsencrypt"
      - "traefik.http.routers.shorty.middlewares=oauth2-auth"
      - "traefik.http.services.shorty.loadbalancer.server.port=80"
  ```
  **Goal**: Migrate static file service
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-3.5.2**: Migrate influxdb
  ```yaml
  # Update docker-compose.db.yml
  influxdb:
    # Remove: VIRTUAL_HOST: "influx.${DOMAIN}"
    # Remove: WITH_AUTH: true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.influxdb.rule=Host(`influx.${DOMAIN}`)"
      - "traefik.http.routers.influxdb.tls=true"
      - "traefik.http.routers.influxdb.tls.certresolver=letsencrypt"
      - "traefik.http.routers.influxdb.middlewares=oauth2-auth"
      - "traefik.http.services.influxdb.loadbalancer.server.port=8086"
  ```
  **Goal**: Migrate database web interface
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-3.5.3**: Migrate mongo-express
  ```yaml
  # Update docker-compose.db.yml
  mongo-express:
    # Remove: VIRTUAL_HOST: "mongo.${DOMAIN}"
    # Remove: WITH_AUTH: true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mongo-express.rule=Host(`mongo.${DOMAIN}`)"
      - "traefik.http.routers.mongo-express.tls=true"
      - "traefik.http.routers.mongo-express.tls.certresolver=letsencrypt"
      - "traefik.http.routers.mongo-express.middlewares=oauth2-auth"
      - "traefik.http.services.mongo-express.loadbalancer.server.port=8081"
  ```
  **Goal**: Complete service migration
  **Documentation**: _[To be filled after completion]_

#### 3.6 Test All Migrated Services ⬜
- [ ] **TASK-3.6.1**: Comprehensive service testing
  ```bash
  # Restart all services to ensure clean state
  docker-compose up -d
  sleep 30
  
  # Test all services through Traefik
  echo "Testing services via Traefik..."
  curl -I https://deploy.${DOMAIN}/health || echo "webhook-service: FAIL"
  curl -I https://auth.${DOMAIN}/ping || echo "oauth2-proxy: FAIL"
  curl -I https://whoami.${DOMAIN}/ | grep -E "(200|302|401)" || echo "whoami: FAIL"
  curl -I https://shorty.${DOMAIN}/ | grep -E "(200|302|401)" || echo "shorty: FAIL"
  curl -I https://influx.${DOMAIN}/ | grep -E "(200|302|401)" || echo "influx: FAIL"
  curl -I https://mongo.${DOMAIN}/ | grep -E "(200|302|401)" || echo "mongo: FAIL"
  ```
  **Goal**: Verify all services work through Traefik
  **Documentation**: _[To be filled after completion]_

### Phase 4: SSL Certificate Migration ⬜

#### 4.1 Verify Traefik Certificate Generation ⬜
- [ ] **TASK-4.1.1**: Check Traefik ACME certificates
  ```bash
  # Check if Traefik generated new certificates
  docker exec traefik ls -la /letsencrypt/
  docker exec traefik cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[].domain'
  ```
  **Goal**: Confirm Traefik is managing certificates
  **Documentation**: _[To be filled after completion]_

#### 4.2 Certificate Validation ⬜
- [ ] **TASK-4.2.1**: Validate SSL certificates for all domains
  ```bash
  # Check certificate validity for each domain
  for domain in deploy auth whoami shorty influx mongo traefik; do
    echo "Checking ${domain}.${DOMAIN}..."
    echo | openssl s_client -servername ${domain}.${DOMAIN} -connect ${domain}.${DOMAIN}:443 2>/dev/null | openssl x509 -noout -dates
  done
  ```
  **Goal**: Ensure all certificates are valid and properly issued
  **Documentation**: _[To be filled after completion]_

### Phase 5: Switch Traffic to Traefik ⬜

#### 5.1 Update Port Mappings ⬜
- [ ] **TASK-5.1.1**: Switch ports from nginx to Traefik
  ```bash
  # Stop nginx containers
  docker-compose stop nginx-reverse-proxy nginx-services
  
  # Update docker-compose.yml to give Traefik the standard ports
  sed -i 's/"8080:80"/"80:80"/g' docker-compose.yml  # If we used temp ports
  sed -i 's/"8443:443"/"443:443"/g' docker-compose.yml  # If we used temp ports
  
  # Remove dashboard port (security)
  sed -i '/"8080:8080"/d' docker-compose.yml
  
  # Restart Traefik with correct ports
  docker-compose up -d traefik
  ```
  **Goal**: Make Traefik the primary reverse proxy
  **Documentation**: _[To be filled after completion]_

#### 5.2 Final Service Test ⬜
- [ ] **TASK-5.2.1**: Complete end-to-end testing
  ```bash
  # Wait for services to stabilize
  sleep 30
  
  # Test all services on standard ports
  echo "Final testing on standard ports..."
  curl -I https://deploy.${DOMAIN}/health || echo "webhook-service: FAIL"
  curl -I https://auth.${DOMAIN}/ping || echo "oauth2-proxy: FAIL"
  curl -I https://whoami.${DOMAIN}/ || echo "whoami: FAIL"
  curl -I https://shorty.${DOMAIN}/ || echo "shorty: FAIL"
  curl -I https://influx.${DOMAIN}/ || echo "influx: FAIL"
  curl -I https://mongo.${DOMAIN}/ || echo "mongo: FAIL"
  
  # Test authentication flow
  echo "Testing authentication..."
  curl -L -c cookies.txt -b cookies.txt https://whoami.${DOMAIN}/ | grep -i "authentication" || echo "Auth flow: WORKING"
  ```
  **Goal**: Confirm complete system functionality
  **Documentation**: _[To be filled after completion]_

### Phase 6: Cleanup and Removal ⬜

#### 6.1 Remove Nginx Components ⬜
- [ ] **TASK-6.1.1**: Remove nginx services from docker-compose.yml
  ```bash
  # Remove nginx-reverse-proxy and nginx-services from docker-compose.yml
  # This should be done manually to avoid accidental deletion
  echo "Manually remove nginx-reverse-proxy and nginx-services sections from docker-compose.yml"
  ```
  **Goal**: Clean up obsolete services
  **Documentation**: _[To be filled after completion]_

- [ ] **TASK-6.1.2**: Remove nginx volumes and configurations
  ```bash
  # Stop and remove nginx containers
  docker-compose rm -f nginx-reverse-proxy nginx-services
  
  # Remove nginx volumes (after confirming everything works)
  docker volume rm jk_nginx jk_certbot
  
  # Remove nginx configuration files
  rm -rf nginx/tmpl/
  rm -f nginx/nginx.conf
  ```
  **Goal**: Remove obsolete infrastructure
  **Documentation**: _[To be filled after completion]_

#### 6.2 Remove nginx-service Code ⬜
- [ ] **TASK-6.2.1**: Remove nginx-service directory
  ```bash
  # Remove the entire nginx-service implementation
  rm -rf services/nginx-service/
  ```
  **Goal**: Clean up custom configuration generator
  **Documentation**: _[To be filled after completion]_

#### 6.3 Update Documentation ⬜
- [ ] **TASK-6.3.1**: Update README and documentation
  ```bash
  # Update README.md to reflect Traefik usage
  # Update any deployment documentation
  # Document new service onboarding process using labels
  ```
  **Goal**: Ensure documentation reflects new architecture
  **Documentation**: _[To be filled after completion]_

### Phase 7: Final Validation and Monitoring ⬜

#### 7.1 Performance Testing ⬜
- [ ] **TASK-7.1.1**: Load testing
  ```bash
  # Basic load test on key endpoints
  for i in {1..10}; do
    curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://whoami.${DOMAIN}/
  done
  ```
  **Goal**: Verify performance is acceptable
  **Documentation**: _[To be filled after completion]_

#### 7.2 Monitoring Setup ⬜
- [ ] **TASK-7.2.1**: Configure Traefik metrics (optional)
  ```yaml
  # Add to traefik.yml if monitoring is needed
  metrics:
    prometheus:
      addEntryPointsLabels: true
      addServicesLabels: true
  ```
  **Goal**: Enable monitoring capabilities
  **Documentation**: _[To be filled after completion]_

#### 7.3 Backup New Configuration ⬜
- [ ] **TASK-7.3.1**: Create backup of final configuration
  ```bash
  # Backup final docker-compose files
  cp docker-compose.yml docker-compose.yml.final
  cp docker-compose.apps.yml docker-compose.apps.yml.final
  cp docker-compose.db.yml docker-compose.db.yml.final
  
  # Backup Traefik certificates
  docker run --rm -v traefik-letsencrypt:/source -v $(pwd)/backup:/backup alpine tar czf /backup/traefik-certificates-final.tar.gz -C /source .
  ```
  **Goal**: Preserve working configuration
  **Documentation**: _[To be filled after completion]_

## Working Guidelines

### How to Use This Plan

1. **Sequential Execution**: Complete phases in order. Each phase builds on the previous one.

2. **Checkpoint System**: 
   - Mark each task as completed with ✓ when done
   - Document any issues or deviations in the "Documentation" field
   - Test thoroughly before proceeding to the next phase

3. **Interruption and Resumption**:
   - The plan can be stopped at any phase boundary
   - To resume, review the last completed phase and continue from the next unchecked task
   - Always run the test commands to verify the current state before proceeding

4. **Rollback Procedures**:
   - **Before Phase 5**: Simply stop Traefik and restart nginx services
   - **After Phase 5**: Restore from backups created in Phase 1
   - **Emergency rollback**: `docker-compose -f docker-compose.yml.backup up -d`

5. **Testing Strategy**:
   - Test after each major task
   - Use curl commands provided to verify functionality
   - Check both authenticated and unauthenticated endpoints
   - Verify SSL certificates are working

6. **Documentation Requirements**:
   - Fill in the "Documentation" field for each completed task
   - Note any deviations from the plan
   - Record any issues encountered and their solutions
   - Update with actual commands used if different from examples

### Key Success Criteria

- [ ] All services accessible via HTTPS with valid certificates
- [ ] Authentication working correctly for protected services
- [ ] No nginx containers running
- [ ] Traefik dashboard accessible (if enabled)
- [ ] All VIRTUAL_HOST environment variables removed
- [ ] All services using Traefik labels instead

### Emergency Contacts and Resources

- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Docker Labels Reference**: https://doc.traefik.io/traefik/routing/providers/docker/
- **ACME/Let's Encrypt**: https://doc.traefik.io/traefik/https/acme/

---

**Migration Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed | ❌ Failed

**Last Updated**: [Date to be filled when starting migration]
**Estimated Duration**: 4-6 hours (depending on testing thoroughness)
**Risk Level**: Medium (rollback procedures available)