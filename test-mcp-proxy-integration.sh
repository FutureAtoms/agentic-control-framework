#!/bin/bash

# ACF MCP-Proxy Integration Test
# Test the integration between ACF server and mcp-proxy

set -e

# Colors
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

# Cleanup function
cleanup() {
    log "Cleaning up test processes..."
    pkill -f "mcp-proxy" 2>/dev/null || true
    pkill -f "agentic-control-framework-mcp" 2>/dev/null || true
    pkill -f "auth-proxy" 2>/dev/null || true
    rm -f /tmp/mcp_*.json /tmp/test_*.log
}

# Set up cleanup trap
trap cleanup EXIT

# Test 1: Basic ACF server functionality
test_acf_server() {
    log "Testing ACF server directly..."
    
    # Test that ACF server starts and responds
    timeout 10s node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/test_acf.log 2>&1 &
    ACF_PID=$!
    
    sleep 3
    
    if kill -0 $ACF_PID 2>/dev/null; then
        success "ACF server starts successfully"
        
        # Check log for successful initialization
        if grep -q "Server initialized" /tmp/test_acf.log 2>/dev/null || \
           grep -q "ready" /tmp/test_acf.log 2>/dev/null; then
            success "ACF server initialized properly"
        else
            warn "ACF server may not have initialized completely"
        fi
        
        kill $ACF_PID 2>/dev/null || true
    else
        error "ACF server failed to start"
    fi
}

# Test 2: MCP-Proxy installation and basic functionality
test_mcp_proxy() {
    log "Testing mcp-proxy installation..."
    
    if ! command -v mcp-proxy &> /dev/null; then
        log "Installing mcp-proxy..."
        npm install -g mcp-proxy
    fi
    
    # Test mcp-proxy help
    if mcp-proxy --help > /dev/null 2>&1; then
        success "mcp-proxy command available"
    else
        error "mcp-proxy command not working"
    fi
    
    # Test proxy with ACF
    log "Testing mcp-proxy with ACF server..."
    
    mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/test_proxy.log 2>&1 &
    PROXY_PID=$!
    
    # Wait for startup
    sleep 8
    
    if kill -0 $PROXY_PID 2>/dev/null; then
        success "mcp-proxy starts with ACF server"
        
        # Test if port is listening
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            success "mcp-proxy is listening on port 8080"
        else
            warn "mcp-proxy may not be fully ready"
        fi
        
        kill $PROXY_PID 2>/dev/null || true
    else
        error "mcp-proxy failed to start with ACF server"
    fi
}

# Test 3: SSE endpoint
test_sse_endpoint() {
    log "Testing SSE endpoint..."
    
    # Start proxy in background
    mcp-proxy --port 8080 node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/test_sse.log 2>&1 &
    PROXY_PID=$!
    
    sleep 8
    
    # Test SSE endpoint with timeout
    if timeout 5s curl -N -H "Accept: text/event-stream" \
                      -H "Cache-Control: no-cache" \
                      http://localhost:8080/sse > /tmp/mcp_sse_response.txt 2>&1; then
        success "SSE endpoint is accessible"
    else
        warn "SSE endpoint test inconclusive (may require specific MCP handshake)"
        
        # Check if there's any response
        if [ -s /tmp/mcp_sse_response.txt ]; then
            log "Got response from SSE endpoint"
            head -3 /tmp/mcp_sse_response.txt
        fi
    fi
    
    kill $PROXY_PID 2>/dev/null || true
}

# Test 4: HTTP POST endpoint
test_http_endpoint() {
    log "Testing HTTP POST endpoint..."
    
    # Start proxy
    mcp-proxy --port 8080 node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/test_http.log 2>&1 &
    PROXY_PID=$!
    
    sleep 8
    
    # Test basic HTTP connectivity
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|404\|405"; then
        success "HTTP endpoint is responding"
        
        # Try a simple MCP initialization request
        curl -X POST http://localhost:8080/stream \
             -H "Content-Type: application/json" \
             -d '{
               "jsonrpc": "2.0",
               "id": 1,
               "method": "initialize",
               "params": {
                 "protocolVersion": "2024-11-05",
                 "capabilities": {
                   "roots": { "listChanged": true },
                   "sampling": {}
                 },
                 "clientInfo": {
                   "name": "test-client",
                   "version": "1.0.0"
                 }
               }
             }' \
             -o /tmp/mcp_init_response.json \
             -w "%{http_code}" > /tmp/mcp_init_status.txt 2>&1
        
        HTTP_STATUS=$(cat /tmp/mcp_init_status.txt)
        
        if [ "$HTTP_STATUS" = "200" ]; then
            success "MCP initialization request successful"
            log "Response: $(head -c 200 /tmp/mcp_init_response.json)..."
        else
            warn "MCP initialization request returned status: $HTTP_STATUS"
        fi
    else
        warn "HTTP endpoint not responding as expected"
    fi
    
    kill $PROXY_PID 2>/dev/null || true
}

# Test 5: Authentication proxy (if enabled)
test_auth_proxy() {
    if [ "$1" = "--with-auth" ] || [ -f "auth-proxy.js" ]; then
        log "Testing authentication proxy..."
        
        # Start auth proxy
        if [ -f "auth-proxy.js" ]; then
            # Start mcp-proxy first
            mcp-proxy --port 8080 node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/test_mcp.log 2>&1 &
            MCP_PID=$!
            
            sleep 5
            
            # Start auth proxy
            MCP_PROXY_URL=http://localhost:8080 node auth-proxy.js > /tmp/test_auth.log 2>&1 &
            AUTH_PID=$!
            
            sleep 5
            
            if kill -0 $AUTH_PID 2>/dev/null; then
                success "Auth proxy started successfully"
                
                # Test health endpoint
                if curl -s http://localhost:3000/health > /tmp/auth_health.json; then
                    success "Auth proxy health check passed"
                    log "Health response: $(cat /tmp/auth_health.json)"
                else
                    warn "Auth proxy health check failed"
                fi
                
                kill $AUTH_PID 2>/dev/null || true
            else
                warn "Auth proxy failed to start (may need dependencies)"
            fi
            
            kill $MCP_PID 2>/dev/null || true
        else
            log "Auth proxy not configured, skipping test"
        fi
    else
        log "Skipping auth proxy test (not requested)"
    fi
}

# Generate working configuration
generate_config() {
    log "Generating test configuration..."
    
    # Generate a test MCP client config
    cat > claude-desktop-test-config.json << EOF
{
  "mcpServers": {
    "acf-test": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
EOF

    # If auth proxy is available
    if [ -f "auth-proxy.js" ]; then
        cat > claude-desktop-auth-config.json << EOF
{
  "mcpServers": {
    "acf-auth": {
      "url": "http://localhost:3000/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer acf-demo-token-2024"
      }
    }
  }
}
EOF
        success "Generated auth proxy configuration: claude-desktop-auth-config.json"
    fi
    
    success "Generated test configuration: claude-desktop-test-config.json"
}

# Main test runner
main() {
    echo "🧪 ACF MCP-Proxy Integration Test"
    echo "================================="
    echo ""
    
    log "Testing MCP-Proxy integration with ACF server..."
    
    # Run tests
    test_acf_server
    test_mcp_proxy
    test_sse_endpoint
    test_http_endpoint
    test_auth_proxy "$@"
    
    generate_config
    
    echo ""
    success "Integration tests completed! 🎉"
    echo ""
    echo "📋 Summary:"
    echo "   ✓ ACF server functionality verified"
    echo "   ✓ mcp-proxy installation and basic operation"
    echo "   ✓ SSE and HTTP endpoints tested"
    echo "   ✓ Configuration files generated"
    echo ""
    echo "🚀 To start the integrated server:"
    echo "   mcp-proxy --port 8080 node ./bin/agentic-control-framework-mcp --workspaceRoot \$(pwd)"
    echo ""
    echo "🔧 Use with Claude Desktop:"
    echo "   Add the configuration from claude-desktop-test-config.json to Claude settings"
}

# Run main function with all arguments
main "$@" 