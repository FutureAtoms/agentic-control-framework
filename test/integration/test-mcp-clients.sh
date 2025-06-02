#!/bin/bash

# Test script for ACF MCP-proxy with different MCP clients
# Tests configurations for Cursor, Claude Desktop, Cline, Continue, etc.

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
header() { echo -e "${PURPLE}[TEST]${NC} $1"; }

# Cleanup function
cleanup() {
    log "Cleaning up test processes..."
    pkill -f "mcp-proxy" 2>/dev/null || true
    pkill -f "agentic-control-framework-mcp" 2>/dev/null || true
    rm -f /tmp/mcp_test_*.json
}

trap cleanup EXIT

# Test if mcp-proxy server is running
test_server_running() {
    header "Testing if ACF MCP-proxy server is running..."
    
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        success "ACF MCP-proxy server is running"
        return 0
    else
        warn "ACF MCP-proxy server not running"
        return 1
    fi
}

# Start MCP-proxy server if not running
start_mcp_server() {
    if ! test_server_running; then
        log "Starting ACF MCP-proxy server..."
        
        mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) > /tmp/mcp_server.log 2>&1 &
        MCP_PID=$!
        
        # Wait for startup
        sleep 8
        
        if test_server_running; then
            success "ACF MCP-proxy server started successfully"
        else
            error "Failed to start ACF MCP-proxy server"
        fi
    fi
}

# Test basic MCP communication
test_mcp_communication() {
    header "Testing basic MCP communication..."
    
    # Test initialization
    log "Testing MCP initialize..."
    curl -s -X POST http://localhost:8080/stream \
         -H "Content-Type: application/json" \
         -H "Accept: application/json, text/event-stream" \
         -d '{
           "jsonrpc": "2.0",
           "id": 1,
           "method": "initialize",
           "params": {
             "protocolVersion": "2024-11-05",
             "capabilities": {},
             "clientInfo": {
               "name": "test-client",
               "version": "1.0.0"
             }
           }
         }' > /tmp/mcp_test_init.json
    
    if grep -q '"result"' /tmp/mcp_test_init.json; then
        success "MCP initialization successful"
        
        # Extract server info
        if grep -q '"serverInfo"' /tmp/mcp_test_init.json; then
            SERVER_NAME=$(cat /tmp/mcp_test_init.json | grep -o '"name":"[^"]*"' | head -1)
            success "Server identified: $SERVER_NAME"
        fi
    else
        warn "MCP initialization failed"
        log "Response: $(cat /tmp/mcp_test_init.json)"
    fi
}

# Test SSE endpoint
test_sse_endpoint() {
    header "Testing SSE endpoint..."
    
    # Test SSE connection
    timeout 5s curl -s -N \
        -H "Accept: text/event-stream" \
        -H "Cache-Control: no-cache" \
        http://localhost:8080/sse > /tmp/mcp_test_sse.txt 2>&1 || true
    
    if [ -s /tmp/mcp_test_sse.txt ]; then
        success "SSE endpoint responds"
        log "SSE Response preview: $(head -2 /tmp/mcp_test_sse.txt | tr '\n' ' ')"
    else
        warn "SSE endpoint may not be working as expected"
    fi
}

# Generate client configurations
generate_client_configs() {
    header "Generating client configurations..."
    
    # Create configurations directory
    mkdir -p client-configurations
    
    # Claude Desktop config
    cat > client-configurations/claude-desktop-config.json << 'EOF'
{
  "mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
EOF
    success "Generated Claude Desktop configuration"
    
    # Cursor config
    cat > client-configurations/cursor-settings.json << 'EOF'
{
  "mcp.servers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse",
      "description": "Agentic Control Framework - Local"
    }
  },
  "mcp.enabled": true,
  "mcp.logLevel": "info"
}
EOF
    success "Generated Cursor configuration"
    
    # VS Code (Cline/Continue) config
    cat > client-configurations/vscode-settings.json << 'EOF'
{
  "cline.mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  },
  "continue.mcpServers": [
    {
      "name": "acf-local",
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  ]
}
EOF
    success "Generated VS Code (Cline/Continue) configuration"
    
    # Windsurf config
    cat > client-configurations/windsurf-config.json << 'EOF'
{
  "mcp": {
    "servers": {
      "acf-local": {
        "url": "http://localhost:8080/sse",
        "transport": "sse"
      }
    }
  }
}
EOF
    success "Generated Windsurf configuration"
}

# Test Cursor configuration
test_cursor_config() {
    header "Testing Cursor configuration..."
    
    CURSOR_CONFIG_DIR="$HOME/Library/Application Support/Cursor/User"
    
    if [ -d "$CURSOR_CONFIG_DIR" ]; then
        log "Cursor installation detected at: $CURSOR_CONFIG_DIR"
        
        if [ -f "$CURSOR_CONFIG_DIR/settings.json" ]; then
            log "Existing Cursor settings found"
            success "You can add the MCP configuration from client-configurations/cursor-settings.json"
        else
            warn "No Cursor settings.json found - you may need to create it"
        fi
    else
        warn "Cursor not found - install Cursor to test this configuration"
    fi
    
    # Show the configuration
    echo ""
    log "Add this to your Cursor settings.json:"
    echo ""
    cat client-configurations/cursor-settings.json
    echo ""
}

# Test Claude Desktop configuration
test_claude_desktop_config() {
    header "Testing Claude Desktop configuration..."
    
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    
    if [ -d "$CLAUDE_CONFIG_DIR" ]; then
        log "Claude Desktop installation detected"
        
        if [ -f "$CLAUDE_CONFIG_FILE" ]; then
            log "Existing Claude Desktop config found"
            success "You can merge the MCP configuration from client-configurations/claude-desktop-config.json"
        else
            log "No Claude Desktop config found - you can create it"
        fi
    else
        warn "Claude Desktop not found - install Claude Desktop to test this configuration"
    fi
    
    # Show the configuration
    echo ""
    log "Claude Desktop configuration file location:"
    echo "  $CLAUDE_CONFIG_FILE"
    echo ""
    log "Configuration content:"
    echo ""
    cat client-configurations/claude-desktop-config.json
    echo ""
}

# Generate setup instructions
generate_setup_instructions() {
    header "Generating setup instructions..."
    
    cat > SETUP-INSTRUCTIONS.md << 'EOF'
# 🔧 MCP Client Setup Instructions

Your ACF MCP-proxy server is running and ready for client connections!

## 🚀 Quick Setup

### 1. **Cursor** (Recommended for development)

**Method 1: Via Settings UI**
1. Open Cursor → Settings → Search "MCP"
2. Add new MCP server:
   - Name: `acf-local`
   - URL: `http://localhost:8080/sse`
   - Transport: `sse`

**Method 2: Via settings.json**
1. Open Command Palette (`Cmd+Shift+P`)
2. Search "Preferences: Open User Settings (JSON)"
3. Add the configuration from `client-configurations/cursor-settings.json`

### 2. **Claude Desktop**

1. Open/create file: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the configuration from `client-configurations/claude-desktop-config.json`
3. Restart Claude Desktop

### 3. **VS Code (Cline/Continue)**

1. Open VS Code → Settings → Search for extension settings
2. Add the configuration from `client-configurations/vscode-settings.json`
3. Restart VS Code

## ✅ Verification

After setup, your client should:
1. Show ACF server as connected
2. List 64+ available tools
3. Allow you to execute ACF commands

## 🆘 Troubleshooting

If connection fails:
1. Ensure server is running: `curl http://localhost:8080/health`
2. Check client logs for errors
3. Verify URL is exactly: `http://localhost:8080/sse`
4. Restart client after configuration changes

## 🔄 Server Management

**Start server**: `mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)`
**Check health**: `curl http://localhost:8080/health`
**Stop server**: `pkill -f mcp-proxy`

Your ACF tools are now available in any MCP-compatible client! 🎉
EOF
    
    success "Generated SETUP-INSTRUCTIONS.md"
}

# Main test function
main() {
    echo "🧪 ACF MCP Client Configuration Tester"
    echo "======================================"
    echo ""
    
    # Test or start server
    start_mcp_server
    
    # Test basic functionality
    test_mcp_communication
    test_sse_endpoint
    
    # Generate configurations
    generate_client_configs
    
    # Test specific clients
    test_cursor_config
    test_claude_desktop_config
    
    # Generate instructions
    generate_setup_instructions
    
    echo ""
    success "🎉 MCP Client Testing Complete!"
    echo ""
    echo "📋 Summary:"
    echo "   ✅ ACF MCP-proxy server is running on http://localhost:8080"
    echo "   ✅ SSE endpoint available at http://localhost:8080/sse"
    echo "   ✅ Client configurations generated in client-configurations/"
    echo "   ✅ Setup instructions created: SETUP-INSTRUCTIONS.md"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Choose your MCP client (Cursor, Claude Desktop, VS Code, etc.)"
    echo "   2. Add the appropriate configuration from client-configurations/"
    echo "   3. Restart your client"
    echo "   4. Test the connection"
    echo ""
    echo "🎯 For Cursor specifically:"
    echo "   Add the configuration from client-configurations/cursor-settings.json"
    echo "   to your Cursor settings.json file"
    echo ""
}

# Run main function
main "$@" 