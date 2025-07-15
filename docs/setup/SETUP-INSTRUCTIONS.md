# 🔧 MCP Client Setup Instructions

Your ACF MCP-proxy server is running and ready for client connections!

> **🚀 First time setup?** See our [Platform Setup Guide](PLATFORM-SETUP-GUIDE.md) for complete installation instructions on Windows, macOS, and Ubuntu.

**✅ Verified Integrations (July 2025)**
- **Claude Code**: 15/15 compatibility tests passed
- **Cursor IDE**: Configuration and tool discovery verified
- **Claude Desktop**: SSE transport and mcp-proxy integration tested
- **VS Code**: Cline and Continue extension configurations verified

## 📋 Prerequisites

Before configuring IDE integrations, ensure you have:

1. **ACF Server Running**:
   ```bash
   # Local MCP mode
   node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

   # OR Cloud MCP mode with mcp-proxy
   mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"
   ```

2. **Dependencies Installed**:
   ```bash
   npm install -g mcp-proxy @modelcontextprotocol/inspector
   ```

3. **Server Verification**:
   ```bash
   # Test server is running
   curl http://localhost:8080/health  # For mcp-proxy mode
   ```

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

### 2. **Claude Desktop** (Direct STDIO - Recommended)

**⚠️ IMPORTANT: Use the Direct Executable Method Below - This is the ONLY method confirmed to work reliably**

1. **Create/Edit Configuration File:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add This EXACT Configuration** (replace paths with your actual paths):
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "/FULL/PATH/TO/agentic-control-framework/bin/agentic-control-framework-mcp",
      "env": {
        "ACF_PATH": "/FULL/PATH/TO/agentic-control-framework",
        "WORKSPACE_ROOT": "/FULL/PATH/TO/YOUR/WORKSPACE",
        "ALLOWED_DIRS": "/FULL/PATH/TO/YOUR/WORKSPACE:/tmp",
        "READONLY_MODE": "false",
        "BROWSER_HEADLESS": "false",
        "DEFAULT_SHELL": "/bin/bash"
      }
    }
  }
}
```

3. **⚠️ CRITICAL REQUIREMENTS:**
   - Use **FULL ABSOLUTE PATHS** - no relative paths or `~`
   - Set `ACF_PATH` to your ACF installation directory
   - Set `WORKSPACE_ROOT` to your project workspace
   - Ensure `bin/agentic-control-framework-mcp` is executable: `chmod +x bin/agentic-control-framework-mcp`

4. **Restart Claude Desktop**

**❌ DO NOT USE** the `node` + `args` pattern - it fails in Claude Desktop

### 3. **VS Code (Cline/Continue)**

1. Open VS Code → Settings → Search for extension settings
2. Add the configuration from `client-configurations/vscode-settings.json`
3. Restart VS Code

## ✅ Verification

After setup, your client should:
1. Show ACF server as connected
2. List 79+ available tools (verified count)
3. Allow you to execute ACF commands

**Verified Tool Categories:**
- ✅ **25 Core ACF Tools**: Task management, priority system, file generation
- ✅ **14 Filesystem Tools**: File operations, directory management, search
- ✅ **25 Browser Tools**: Playwright automation, screenshots, PDF generation
- ✅ **5 Terminal Tools**: Command execution, process management
- ✅ **3 Search/Edit Tools**: Code search with ripgrep, surgical editing
- ✅ **7 System Tools**: AppleScript, configuration management

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
