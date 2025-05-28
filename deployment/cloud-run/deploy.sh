#!/bin/bash

# ACF MCP-Proxy Deployment Script for Google Cloud Run
# Deploys Agentic Control Framework with mcp-proxy bridge

set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
SERVICE_NAME="acf-mcp-proxy"
REGION=${GCP_REGION:-"us-central1"}
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
MEMORY=${MEMORY:-"1Gi"}
CPU=${CPU:-"1"}
MAX_INSTANCES=${MAX_INSTANCES:-"10"}
MIN_INSTANCES=${MIN_INSTANCES:-"1"}
TIMEOUT=${TIMEOUT:-"300"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install it first."
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install it first."
    fi
    
    # Check if project ID is set
    if [ "$PROJECT_ID" = "your-project-id" ]; then
        error "Please set GCP_PROJECT_ID environment variable or update PROJECT_ID in script"
    fi
    
    # Check authentication
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "Not authenticated with gcloud. Run 'gcloud auth login'"
    fi
    
    success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log "Building Docker image..."
    
    # Navigate to project root
    cd "$(dirname "$0")/../.."
    
    # Build the image
    docker build -f Dockerfile.proxy -t "$IMAGE_NAME:latest" .
    
    success "Docker image built successfully"
}

# Push image to Google Container Registry
push_image() {
    log "Pushing image to Google Container Registry..."
    
    # Configure Docker for GCR
    gcloud auth configure-docker --quiet
    
    # Push the image
    docker push "$IMAGE_NAME:latest"
    
    success "Image pushed to GCR"
}

# Deploy to Cloud Run
deploy_service() {
    log "Deploying to Google Cloud Run..."
    
    # Set the project
    gcloud config set project "$PROJECT_ID"
    
    # Deploy the service
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME:latest" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --memory "$MEMORY" \
        --cpu "$CPU" \
        --max-instances "$MAX_INSTANCES" \
        --min-instances "$MIN_INSTANCES" \
        --timeout "$TIMEOUT" \
        --port 8080 \
        --set-env-vars "NODE_ENV=production,WORKSPACE_ROOT=/data,ALLOWED_DIRS=/data:/tmp" \
        --labels "app=acf,version=mcp-proxy" \
        --quiet
    
    success "Service deployed to Cloud Run"
}

# Get service URL
get_service_url() {
    log "Getting service URL..."
    
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --format 'value(status.url)')
    
    if [ -n "$SERVICE_URL" ]; then
        success "Service deployed successfully!"
        echo ""
        echo "🚀 Your ACF MCP Server is live at:"
        echo "   $SERVICE_URL"
        echo ""
        echo "📋 Claude Desktop Configuration:"
        echo '   {
     "mcpServers": {
       "acf": {
         "url": "'"$SERVICE_URL"'/sse",
         "transport": "sse",
         "headers": {
           "Authorization": "Bearer acf-demo-token-2024"
         }
       }
     }
   }'
        echo ""
        echo "🔧 Available endpoints:"
        echo "   Health Check: $SERVICE_URL/health"
        echo "   SSE Stream:   $SERVICE_URL/sse"
        echo "   Messages:     $SERVICE_URL/messages"
        echo ""
        echo "🔑 Demo token: acf-demo-token-2024"
        echo "   (Change this in production!)"
    else
        error "Failed to get service URL"
    fi
}

# Test deployment
test_deployment() {
    if [ -n "$SERVICE_URL" ]; then
        log "Testing deployment..."
        
        # Test health endpoint
        if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
            success "Health check passed"
        else
            warn "Health check failed - service may still be starting"
        fi
        
        # Test SSE endpoint (just check if it responds)
        if curl -f "$SERVICE_URL/sse" > /dev/null 2>&1; then
            success "SSE endpoint accessible"
        else
            warn "SSE endpoint not accessible - check authentication"
        fi
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up local Docker images..."
    docker rmi "$IMAGE_NAME:latest" 2>/dev/null || true
}

# Main deployment flow
main() {
    echo "🚀 ACF MCP-Proxy Cloud Deployment"
    echo "=================================="
    echo "Project ID: $PROJECT_ID"
    echo "Service:    $SERVICE_NAME"
    echo "Region:     $REGION"
    echo "Memory:     $MEMORY"
    echo "CPU:        $CPU"
    echo ""
    
    check_prerequisites
    build_image
    push_image
    deploy_service
    get_service_url
    test_deployment
    
    # Ask about cleanup
    read -p "Clean up local Docker image? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
    
    echo ""
    success "Deployment complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Add the Claude Desktop configuration above to your settings"
    echo "2. Set up production authentication tokens"
    echo "3. Configure monitoring and logging"
    echo "4. Set up CI/CD for automatic deployments"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "cleanup")
        cleanup
        ;;
    "url")
        get_service_url
        ;;
    "test")
        get_service_url
        test_deployment
        ;;
    *)
        echo "Usage: $0 [deploy|cleanup|url|test]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  cleanup  - Remove local Docker images"
        echo "  url      - Get service URL and configuration"
        echo "  test     - Test deployed service"
        exit 1
        ;;
esac 