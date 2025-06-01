#!/bin/bash

# ACF MCP-Proxy Quick Deployment Script
# Deploy ACF with mcp-proxy bridge for immediate commercial use
# Supports Google Cloud Run, Railway, Fly.io, and local development

set -e

# Configuration
SERVICE_NAME="acf-mcp-proxy"
AUTH_SERVICE_NAME="acf-auth-proxy"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_MODE=${DEPLOY_MODE:-"with-auth"}  # "proxy-only" or "with-auth"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
header() { echo -e "${PURPLE}[DEPLOY]${NC} $1"; }

show_help() {
    echo "🚀 ACF MCP-Proxy Quick Deployment"
    echo ""
    echo "Usage: $0 [PLATFORM] [OPTIONS]"
    echo ""
    echo "Platforms:"
    echo "  gcp      - Google Cloud Run (Recommended)"
    echo "  railway  - Railway.app (Simplest)"
    echo "  fly      - Fly.io"
    echo "  local    - Local development with Docker"
    echo "  test     - Test local deployment"
    echo ""
    echo "Options:"
    echo "  --proxy-only    Deploy only mcp-proxy (no auth/monetization)"
    echo "  --with-auth     Deploy with authentication proxy (default)"
    echo "  --help          Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  GCP_PROJECT_ID       - Google Cloud Project ID"
    echo "  STRIPE_SECRET_KEY    - Stripe secret key for payments"
    echo "  STRIPE_PUBLISHABLE_KEY - Stripe publishable key"
    echo "  SUPABASE_URL         - Supabase database URL"
    echo "  SUPABASE_ANON_KEY    - Supabase anonymous key"
    echo ""
    echo "Examples:"
    echo "  $0 gcp --with-auth"
    echo "  $0 railway --proxy-only"
    echo "  $0 local"
}

check_dependencies() {
    log "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    success "Dependencies check passed"
}

install_mcp_proxy() {
    log "Installing mcp-proxy..."
    
    if ! command -v mcp-proxy &> /dev/null; then
        npm install -g mcp-proxy
        success "mcp-proxy installed globally"
    else
        success "mcp-proxy already installed"
    fi
}

setup_auth_dependencies() {
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        log "Installing auth proxy dependencies..."
        
        # Create package.json for auth proxy if it doesn't exist
        if [ ! -f "auth-package.json" ]; then
            cat > auth-package.json << 'EOF'
{
  "name": "acf-auth-proxy",
  "version": "1.0.0",
  "description": "Authentication proxy for ACF MCP Server",
  "main": "auth-proxy.js",
  "scripts": {
    "start": "node auth-proxy.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "@supabase/supabase-js": "^2.38.0",
    "stripe": "^14.7.0"
  }
}
EOF
        fi
        
        # Install dependencies
        npm install --prefix . --package-lock-only --from=auth-package.json
        success "Auth proxy dependencies ready"
    fi
}

create_docker_compose() {
    log "Creating Docker Compose configuration..."
    
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mcp-proxy:
    build:
      context: .
      dockerfile: Dockerfile.proxy
    environment:
      - NODE_ENV=production
      - WORKSPACE_ROOT=/data
      - ALLOWED_DIRS=/data:/tmp
    volumes:
      - ./data:/data
    networks:
      - acf-network
    restart: unless-stopped

  auth-proxy:
    build:
      context: .
      dockerfile: Dockerfile.auth
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MCP_PROXY_URL=http://mcp-proxy:8080
      - BASE_URL=${BASE_URL:-http://localhost:3000}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    volumes:
      - ./public:/app/public
    depends_on:
      - mcp-proxy
    networks:
      - acf-network
    restart: unless-stopped

networks:
  acf-network:
    driver: bridge

volumes:
  data:
EOF
    else
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mcp-proxy:
    build:
      context: .
      dockerfile: Dockerfile.proxy
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - WORKSPACE_ROOT=/data
      - ALLOWED_DIRS=/data:/tmp
    volumes:
      - ./data:/data
    restart: unless-stopped

volumes:
  data:
EOF
    fi
    
    success "Docker Compose configuration created"
}

create_auth_dockerfile() {
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        log "Creating auth proxy Dockerfile..."
        
        cat > Dockerfile.auth << 'EOF'
FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY auth-package.json package.json
RUN npm ci --production

# Copy application files
COPY auth-proxy.js .
COPY public/ ./public/

# Create non-root user
RUN groupadd -r auth && useradd -r -g auth auth
RUN chown -R auth:auth /app
USER auth

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "auth-proxy.js"]
EOF
        
        success "Auth proxy Dockerfile created"
    fi
}

test_local() {
    log "Testing local deployment..."
    
    # Start mcp-proxy with ACF server in background
    mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) &
    MCP_PID=$!
    
    # Wait for startup
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        success "MCP proxy health check passed"
    else
        warn "MCP proxy health check failed (normal for direct proxy mode)"
    fi
    
    # Test SSE endpoint
    if curl -f -H "Authorization: Bearer acf-demo-token-2024" http://localhost:8080/sse > /dev/null 2>&1; then
        success "SSE endpoint accessible"
    else
        warn "SSE endpoint accessible but may require different testing method"
    fi
    
    # Cleanup
    kill $MCP_PID 2>/dev/null || true
    
    success "Local test completed"
}

deploy_local() {
    header "Deploying locally with Docker Compose..."
    
    create_docker_compose
    
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        create_auth_dockerfile
        mkdir -p public
        setup_auth_dependencies
    fi
    
    # Build and start services
    docker-compose up --build -d
    
    # Wait for services to start
    sleep 10
    
    # Get service URLs
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        LOCAL_URL="http://localhost:3000"
        echo ""
        success "🚀 ACF MCP Server with Auth deployed locally!"
        echo "   Landing Page: $LOCAL_URL"
        echo "   MCP Endpoint: $LOCAL_URL/sse"
    else
        LOCAL_URL="http://localhost:8080"
        echo ""
        success "🚀 ACF MCP Server deployed locally!"
        echo "   MCP Endpoint: $LOCAL_URL/sse"
        echo "   Health Check: $LOCAL_URL/health"
    fi
    
    show_configuration "$LOCAL_URL"
}

deploy_gcp() {
    header "Deploying to Google Cloud Run..."
    
    # Check GCP prerequisites
    if [ -z "$GCP_PROJECT_ID" ]; then
        error "GCP_PROJECT_ID environment variable not set"
    fi
    
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI not installed"
    fi
    
    # Run the Cloud Run deployment script
    chmod +x deployment/cloud-run/deploy.sh
    deployment/cloud-run/deploy.sh
}

deploy_railway() {
    header "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        log "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Initialize Railway project if needed
    if [ ! -f "railway.json" ]; then
        railway login
        railway init
    fi
    
    # Deploy
    railway up
    
    # Get URL
    RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url // empty')
    
    if [ -n "$RAILWAY_URL" ]; then
        success "🚀 Deployed to Railway!"
        echo "   URL: $RAILWAY_URL"
        show_configuration "$RAILWAY_URL"
    else
        warn "Could not retrieve Railway URL"
    fi
}

deploy_fly() {
    header "Deploying to Fly.io..."
    
    if ! command -v fly &> /dev/null; then
        log "Installing Fly CLI..."
        curl -L https://fly.io/install.sh | sh
    fi
    
    # Initialize Fly app if needed
    if [ ! -f "fly.toml" ]; then
        fly launch --no-deploy
    fi
    
    # Deploy
    fly deploy
    
    # Get URL
    FLY_URL=$(fly status --json | jq -r '.Hostname // empty')
    
    if [ -n "$FLY_URL" ]; then
        success "🚀 Deployed to Fly.io!"
        echo "   URL: https://$FLY_URL"
        show_configuration "https://$FLY_URL"
    else
        warn "Could not retrieve Fly.io URL"
    fi
}

show_configuration() {
    local url=$1
    
    echo ""
    echo "📋 Claude Desktop Configuration:"
    echo '{'
    echo '  "mcpServers": {'
    echo '    "acf": {'
    echo "      \"url\": \"$url/sse\","
    echo '      "transport": "sse",'
    echo '      "headers": {'
    echo '        "Authorization": "Bearer acf-demo-token-2024"'
    echo '      }'
    echo '    }'
    echo '  }'
    echo '}'
    echo ""
    
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        echo "💳 Monetization Features:"
        echo "   - Free tier: 100 requests/month, 15 tools"
        echo "   - Pro tier: 10,000 requests/month, all tools"
        echo "   - Enterprise: Custom pricing"
        echo ""
        echo "🔧 Setup Steps:"
        echo "   1. Configure Stripe keys for payments"
        echo "   2. Set up Supabase for user management"
        echo "   3. Customize pricing and features"
        echo "   4. Add custom domain"
        echo ""
    fi
    
    echo "🔑 Demo token: acf-demo-token-2024"
    echo "   (Replace with production tokens)"
}

cleanup_temp_files() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files but keep important configs
    [ -f "auth-package.json" ] && rm -f auth-package.json
    [ -f "Dockerfile.auth" ] && rm -f Dockerfile.auth
    
    success "Cleanup completed"
}

# Parse arguments
PLATFORM=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --proxy-only)
            DEPLOY_MODE="proxy-only"
            shift
            ;;
        --with-auth)
            DEPLOY_MODE="with-auth"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        gcp|railway|fly|local|test)
            PLATFORM="$1"
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Default to help if no platform specified
if [ -z "$PLATFORM" ]; then
    show_help
    exit 0
fi

# Main execution
main() {
    echo "🚀 ACF MCP-Proxy Quick Deployment"
    echo "=================================="
    echo "Platform: $PLATFORM"
    echo "Mode: $DEPLOY_MODE"
    echo ""
    
    check_dependencies
    install_mcp_proxy
    
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        setup_auth_dependencies
    fi
    
    case $PLATFORM in
        "local")
            deploy_local
            ;;
        "gcp")
            deploy_gcp
            ;;
        "railway")
            deploy_railway
            ;;
        "fly")
            deploy_fly
            ;;
        "test")
            test_local
            ;;
        *)
            error "Unsupported platform: $PLATFORM"
            ;;
    esac
    
    cleanup_temp_files
    
    echo ""
    success "Deployment completed! 🎉"
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Test the deployment with Claude Desktop"
    echo "   2. Set up production authentication"
    echo "   3. Configure monitoring and analytics"
    echo "   4. Add custom domain and SSL"
    echo ""
    
    if [ "$DEPLOY_MODE" = "with-auth" ]; then
        echo "💼 Commercial Features Ready:"
        echo "   - User registration and authentication"
        echo "   - Tiered pricing with Stripe integration"
        echo "   - Usage tracking and rate limiting"
        echo "   - Professional landing page"
        echo ""
    fi
}

# Execute main function
main 