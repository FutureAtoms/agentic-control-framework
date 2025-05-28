#!/bin/bash

# Local testing script for ACF MCP-Proxy integration
# Tests the mcp-proxy bridge locally before cloud deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if mcp-proxy is installed
check_mcp_proxy() {
    log "Checking mcp-proxy installation..."
    
    if ! command -v mcp-proxy &> /dev/null; then
        warn "mcp-proxy not found, installing..."
        npm install -g @sparfenyuk/mcp-proxy
        success "mcp-proxy installed"
    else
        success "mcp-proxy is available"
    fi
}

# Test ACF server directly
test_acf_server() {
    log "Testing ACF server directly..."
    
    # Start ACF server in background and test basic functionality
    timeout 10s node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) &
    ACF_PID=$!
    
    sleep 3
    
    if kill -0 $ACF_PID 2>/dev/null; then
        success "ACF server starts successfully"
        kill $ACF_PID 2>/dev/null || true
    else
        error "ACF server failed to start"
    fi
}

# Test mcp-proxy with ACF
test_mcp_proxy_integration() {
    log "Testing mcp-proxy integration..."
    
    # Start mcp-proxy with ACF
    mcp-proxy --config mcp-proxy-config.yaml &
    PROXY_PID=$!
    
    # Wait for startup
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        success "Health endpoint responding"
    else
        warn "Health endpoint not responding"
    fi
    
    # Test SSE endpoint
    if curl -H "Authorization: Bearer acf-demo-token-2024" \
            -f http://localhost:8080/sse > /dev/null 2>&1; then
        success "SSE endpoint responding"
    else
        warn "SSE endpoint not responding (may need authentication)"
    fi
    
    # Test basic MCP communication
    log "Testing basic MCP communication..."
    
    # Send a simple MCP request to list tools
    curl -X POST http://localhost:8080/messages \
         -H "Content-Type: application/json" \
         -H "Authorization: Bearer acf-demo-token-2024" \
         -d '{
           "jsonrpc": "2.0",
           "id": 1,
           "method": "tools/list",
           "params": {}
         }' \
         -s > /tmp/mcp_response.json
    
    if grep -q "tools" /tmp/mcp_response.json; then
        success "MCP tools/list request successful"
        TOOL_COUNT=$(cat /tmp/mcp_response.json | grep -o '"name"' | wc -l)
        log "Found $TOOL_COUNT tools"
    else
        warn "MCP tools/list request failed"
        log "Response: $(cat /tmp/mcp_response.json)"
    fi
    
    # Cleanup
    kill $PROXY_PID 2>/dev/null || true
    rm -f /tmp/mcp_response.json
}

# Test Docker build
test_docker_build() {
    log "Testing Docker build..."
    
    if command -v docker &> /dev/null; then
        # Build the Docker image
        docker build -f Dockerfile.proxy -t acf-mcp-proxy-test .
        
        success "Docker build successful"
        
        # Test running the container
        log "Testing Docker container..."
        
        docker run -d --name acf-test -p 8081:8080 acf-mcp-proxy-test
        
        sleep 10
        
        # Test the containerized service
        if curl -f http://localhost:8081/health > /dev/null 2>&1; then
            success "Docker container health check passed"
        else
            warn "Docker container health check failed"
        fi
        
        # Cleanup
        docker stop acf-test
        docker rm acf-test
        docker rmi acf-mcp-proxy-test
        
        success "Docker test completed"
    else
        warn "Docker not available, skipping Docker test"
    fi
}

# Generate Claude Desktop configuration
generate_claude_config() {
    log "Generating Claude Desktop configuration..."
    
    cat > claude-desktop-config.json << EOF
{
  "mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer acf-demo-token-2024"
      }
    }
  }
}
EOF
    
    success "Claude Desktop configuration saved to claude-desktop-config.json"
    echo ""
    echo "To use with Claude Desktop:"
    echo "1. Start the local proxy: mcp-proxy --config mcp-proxy-config.yaml"
    echo "2. Add the configuration above to your Claude Desktop settings"
}

# Main test flow
main() {
    echo "🧪 ACF MCP-Proxy Local Testing"
    echo "=============================="
    echo ""
    
    check_mcp_proxy
    test_acf_server
    test_mcp_proxy_integration
    
    # Ask about Docker test
    read -p "Run Docker test? (requires Docker) (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_docker_build
    fi
    
    generate_claude_config
    
    echo ""
    success "All tests completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Run 'mcp-proxy --config mcp-proxy-config.yaml' to start locally"
    echo "2. Test with Claude Desktop using the generated configuration"
    echo "3. Deploy to cloud using './deployment/cloud-run/deploy.sh'"
}

# Handle cleanup on exit
cleanup() {
    log "Cleaning up test processes..."
    pkill -f "mcp-proxy" 2>/dev/null || true
    pkill -f "agentic-control-framework-mcp" 2>/dev/null || true
}

trap cleanup EXIT

main "$@" 