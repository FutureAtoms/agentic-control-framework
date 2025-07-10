# 🔧 MCP Client Setup Instructions

Your ACF MCP-proxy server is running and ready for client connections!

## 🚀 Quick Setup

### 1. **Claude Code** (Recommended - Best Integration)

**Why Claude Code?**
- Native MCP support with excellent tool discovery
- Built-in debugging and validation
- Real-time streaming performance
- Official Anthropic support

**Setup Method 1: Using Pre-configured File (Easiest)**
```bash
# Add ACF server to Claude Code
claude mcp add acf-server \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="your-project-directory" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "your-project-directory"

# Start Claude Code
claude
```

**Setup Method 2: Quick Script Setup**
```bash
# Navigate to your project
cd /path/to/your/project

# Create configuration (replace paths as needed)
cat > claude-mcp-config.json << EOF
{
  "type": "stdio",
  "command": "node",
  "args": [
    "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
    "--workspaceRoot",
    "$(pwd)"
  ],
  "env": {
    "ACF_PATH": "/path/to/agentic-control-framework",
    "WORKSPACE_ROOT": "$(pwd)",
    "READONLY_MODE": "false",
    "BROWSER_HEADLESS": "false",
    "DEFAULT_SHELL": "/bin/bash",
    "NODE_ENV": "production"
  }
}
EOF

# Start Claude Code
claude
```

**Setup Method 3: Via MCP-Proxy (Remote)**
```bash
# Start MCP proxy
mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Configure Claude Code for remote access
cat > claude-remote-config.json << EOF
{
  "mcpServers": {
    "agentic-control-framework": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8080/sse"
      }
    }
  }
}
EOF

# Use remote configuration
claude
```

### 2. **Cursor** (Great for development)

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
2. List 83+ available tools
3. Allow you to execute ACF commands

### Test Your Setup

**For Claude Code:**
```bash
# Test configuration
claude --test-tools

# Interactive test
claude
# Then try: "List all available tools"
```

**For other MCP clients:**
```bash
# Test server health
curl http://localhost:8080/health

# Test tool listing
curl -H "Accept: text/event-stream" http://localhost:8080/sse
```

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
