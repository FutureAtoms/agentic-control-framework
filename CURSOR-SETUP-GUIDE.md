# 🎯 Cursor MCP Setup Guide for ACF

Quick guide to get your Agentic Control Framework working with Cursor via MCP-proxy.

## ✅ Prerequisites

1. **Cursor IDE** installed
2. **ACF MCP-proxy** running (see verification below)

## 🚀 Quick Setup (5 minutes)

### Step 1: Verify ACF Server is Running

```bash
# Start the server (if not already running)
mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# In another terminal, verify it's working
curl -s http://localhost:8080/health
# Should return: OK
```

### Step 2: Configure Cursor

**Method 1: Via Cursor Settings UI** (Recommended)
1. Open Cursor
2. Press `Cmd+,` (or `Ctrl+,` on Windows) to open Settings
3. Search for "MCP" in the settings search bar
4. Add new MCP server with these details:
   - **Name**: `acf-local`
   - **URL**: `http://localhost:8080/sse`
   - **Transport**: `sse`

**Method 2: Via settings.json**
1. In Cursor, open Command Palette (`Cmd+Shift+P`)
2. Search "Preferences: Open User Settings (JSON)"
3. Add this configuration:

```json
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
```

### Step 3: Restart Cursor

Close and reopen Cursor to load the new MCP configuration.

### Step 4: Verify Connection

1. Look for MCP server connection status in Cursor
2. You should see "acf-local" connected
3. Try asking Cursor to use ACF tools

## 🧪 Test the Integration

Try these commands in Cursor:

1. **"List all available tools"** - Should show 64+ ACF tools
2. **"Use the file search tool to find Python files"** - Should use ACF's search functionality
3. **"Create a new directory called 'test'"** - Should use ACF's directory creation tool

## 📁 Files Reference

- **Configuration**: `client-configurations/cursor-settings.json`
- **Setup Instructions**: `SETUP-INSTRUCTIONS.md` 
- **Full Guide**: `client-configurations/README.md`

## 🔍 Troubleshooting

### Common Issues

**1. Cursor can't connect to MCP server**
```bash
# Check if server is running
curl http://localhost:8080/health

# If not running, start it
mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

**2. Server starts but tools don't work**
- Check the URL is exactly: `http://localhost:8080/sse`
- Verify transport is set to: `sse`
- Try restarting Cursor

**3. Configuration not loading**
- Ensure JSON syntax is correct
- Check Cursor logs/console for errors
- Try the UI method instead of manual JSON editing

**4. Tools not appearing**
- Wait a few seconds after connection
- Check MCP server logs for errors
- Verify ACF server is responding to tool requests

### Debug Commands

```bash
# Check server health
curl -v http://localhost:8080/health

# Test MCP initialization manually
curl -X POST http://localhost:8080/stream \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'

# Check for running processes
ps aux | grep mcp-proxy
```

## 🎉 Success!

When working correctly, you should see:
- ✅ **MCP Status**: Connected in Cursor
- ✅ **Tool Access**: 64+ ACF tools available
- ✅ **Functionality**: Can execute file operations, searches, etc.
- ✅ **Real-time**: Streaming responses from ACF

## 🚀 Production Setup

For production deployment, replace the URL:

```json
{
  "mcp.servers": {
    "acf-production": {
      "url": "https://your-deployment.com/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_PRODUCTION_TOKEN"
      }
    }
  }
}
```

Deploy using: `./quick-deploy.sh gcp --with-auth`

Your ACF tools are now available directly in Cursor! 🎯 