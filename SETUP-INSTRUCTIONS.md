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
