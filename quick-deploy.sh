#!/bin/bash

# ACF MCP-Proxy Quick Deployment Script
# One-click deployment to multiple cloud platforms

set -e

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

# Configuration
PLATFORMS=("gcp" "railway" "fly" "local")

show_banner() {
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                 ACF MCP-Proxy Deployment                 ║"
    echo "║                                                           ║"
    echo "║  🚀 Deploy Agentic Control Framework to the Cloud        ║"
    echo "║  🔗 Convert STDIO to HTTP/SSE with zero code changes     ║"
    echo "║  ⚡ Get your 64+ tools running in under 1 hour          ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_menu() {
    echo ""
    echo "Choose deployment platform:"
    echo ""
    echo "1) 🏆 Google Cloud Run (Recommended)"
    echo "   - Serverless scaling"
    echo "   - Pay per request" 
    echo "   - Enterprise ready"
    echo ""
    echo "2) 🚂 Railway (Simplest)"
    echo "   - Easiest deployment"
    echo "   - Great for testing"
    echo "   - $5/month hobby plan"
    echo ""
    echo "3) ✈️  Fly.io (Performance)"
    echo "   - Edge locations"
    echo "   - Good performance"
    echo "   - Free tier available"
    echo ""
    echo "4) 🖥️  Local Testing"
    echo "   - Test before deploying"
    echo "   - Verify configuration"
    echo "   - Generate Claude config"
    echo ""
    echo "5) 📋 Show status"
    echo "6) 🧹 Cleanup"
    echo "7) ❌ Exit"
    echo ""
}

get_platform_choice() {
    while true; do
        read -p "Enter your choice (1-7): " choice
        case $choice in
            1) echo "gcp"; break ;;
            2) echo "railway"; break ;;
            3) echo "fly"; break ;;
            4) echo "local"; break ;;
            5) echo "status"; break ;;
            6) echo "cleanup"; break ;;
            7) echo "exit"; break ;;
            *) echo "Invalid choice. Please enter 1-7." ;;
        esac
    done
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    success "Prerequisites check passed"
}

test_locally() {
    log "Running local tests..."
    
    if [ -f "./test-mcp-proxy.sh" ]; then
        ./test-mcp-proxy.sh
    else
        error "Local test script not found. Are you in the right directory?"
    fi
}

deploy_gcp() {
    log "Deploying to Google Cloud Run..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first."
    fi
    
    # Check project ID
    if [ -z "$GCP_PROJECT_ID" ]; then
        read -p "Enter your Google Cloud Project ID: " GCP_PROJECT_ID
        export GCP_PROJECT_ID
    fi
    
    if [ -f "./deployment/cloud-run/deploy.sh" ]; then
        ./deployment/cloud-run/deploy.sh
    else
        error "Cloud Run deployment script not found."
    fi
}

deploy_railway() {
    log "Deploying to Railway..."
    
    # Check if railway is installed
    if ! command -v railway &> /dev/null; then
        log "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Check authentication
    if ! railway status &> /dev/null; then
        log "Please authenticate with Railway..."
        railway login
    fi
    
    log "Deploying to Railway..."
    railway up
    
    success "Deployed to Railway!"
    log "Getting service URL..."
    railway status
}

deploy_fly() {
    log "Deploying to Fly.io..."
    
    # Check if fly is installed
    if ! command -v fly &> /dev/null; then
        log "Installing Fly CLI..."
        curl -L https://fly.io/install.sh | sh
        export PATH="$HOME/.fly/bin:$PATH"
    fi
    
    # Check authentication
    if ! fly status &> /dev/null; then
        log "Please authenticate with Fly.io..."
        fly auth login
    fi
    
    # Copy fly.toml to root if it doesn't exist
    if [ ! -f "./fly.toml" ] && [ -f "./deployment/fly/fly.toml" ]; then
        cp ./deployment/fly/fly.toml ./fly.toml
    fi
    
    log "Launching on Fly.io..."
    fly launch --dockerfile Dockerfile.proxy
    
    success "Deployed to Fly.io!"
}

show_status() {
    log "Checking deployment status..."
    
    echo ""
    echo "🔍 Deployment Status:"
    echo "===================="
    
    # Check Google Cloud Run
    if command -v gcloud &> /dev/null && [ -n "$GCP_PROJECT_ID" ]; then
        echo ""
        echo "Google Cloud Run:"
        gcloud run services list --filter="metadata.name:acf-mcp-proxy" --format="table(metadata.name,status.url,status.conditions[0].status)" 2>/dev/null || echo "  No services found"
    fi
    
    # Check Railway
    if command -v railway &> /dev/null; then
        echo ""
        echo "Railway:"
        railway status 2>/dev/null || echo "  Not deployed or not authenticated"
    fi
    
    # Check Fly.io
    if command -v fly &> /dev/null; then
        echo ""
        echo "Fly.io:"
        fly status 2>/dev/null || echo "  Not deployed or not authenticated"
    fi
    
    echo ""
}

cleanup() {
    log "Cleaning up..."
    
    # Remove generated files
    rm -f claude-desktop-config.json
    rm -f fly.toml
    
    # Clean Docker images
    docker rmi acf-mcp-proxy-test 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    
    success "Cleanup completed"
}

generate_final_config() {
    local platform=$1
    local url=$2
    
    echo ""
    success "Deployment completed! 🎉"
    echo ""
    echo "📋 Claude Desktop Configuration:"
    echo "=============================="
    
    cat > claude-desktop-config.json << EOF
{
  "mcpServers": {
    "acf-${platform}": {
      "url": "${url}/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer acf-demo-token-2024"
      }
    }
  }
}
EOF
    
    echo "Configuration saved to: claude-desktop-config.json"
    echo ""
    cat claude-desktop-config.json
    echo ""
    echo "🔗 Service URL: $url"
    echo "🔑 Demo Token: acf-demo-token-2024"
    echo ""
    echo "Next steps:"
    echo "1. Add the configuration above to Claude Desktop"
    echo "2. Test the integration"
    echo "3. Set up production authentication"
}

main() {
    show_banner
    check_prerequisites
    
    while true; do
        show_menu
        platform=$(get_platform_choice)
        
        case $platform in
            "gcp")
                deploy_gcp
                ;;
            "railway")
                deploy_railway
                ;;
            "fly")
                deploy_fly
                ;;
            "local")
                test_locally
                ;;
            "status")
                show_status
                ;;
            "cleanup")
                cleanup
                ;;
            "exit")
                echo "Goodbye! 👋"
                exit 0
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Handle command line arguments
if [ $# -gt 0 ]; then
    case $1 in
        "gcp"|"google")
            check_prerequisites
            deploy_gcp
            ;;
        "railway")
            check_prerequisites
            deploy_railway
            ;;
        "fly")
            check_prerequisites
            deploy_fly
            ;;
        "local"|"test")
            check_prerequisites
            test_locally
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [platform]"
            echo ""
            echo "Platforms:"
            echo "  gcp      Deploy to Google Cloud Run"
            echo "  railway  Deploy to Railway"
            echo "  fly      Deploy to Fly.io"
            echo "  local    Test locally"
            echo "  status   Show deployment status"
            echo "  cleanup  Clean up resources"
            echo ""
            echo "Interactive mode: $0 (no arguments)"
            ;;
        *)
            error "Unknown platform: $1. Use 'help' for available options."
            ;;
    esac
else
    main
fi 