# 🔌 MCP Client Configurations for ACF

This guide shows how to configure different MCP clients to work with your ACF server via mcp-proxy.

## ✅ Prerequisites

1. **Start your ACF MCP-proxy server**:
   ```bash
   mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
   ```

2. **Verify it's working**:
   ```bash
   curl -s http://localhost:8080/health
   ```

## 🎯 Client Configurations

### 1. **Claude Desktop** (Desktop App)

**Location**: 
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration**:
```json
{
  "mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
```

**For Production Deployment**:
```json
{
  "mcpServers": {
    "acf-production": {
      "url": "https://your-deployment.com/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### 2. **Cursor** (IDE)

**Location**: 
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` or via settings
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\state.vscdb`

**Method 1: Via Settings UI**
1. Open Cursor → Settings → Extensions → MCP
2. Add new server:
   - **Name**: `acf-local`
   - **URL**: `http://localhost:8080/sse`
   - **Transport**: `sse`

**Method 2: Via Configuration File**
Create or edit: `~/.cursor/mcp_config.json`
```json
{
  "mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
```

**Method 3: Via Cursor Settings JSON**
1. Open Command Palette (`Cmd+Shift+P`)
2. Search "Preferences: Open User Settings (JSON)"
3. Add:
```json
{
  "mcp.servers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
```

### 3. **Cline (VS Code Extension)**

**Location**: VS Code settings or extension configuration

**Method 1: Via VS Code Settings**
1. Open VS Code → Settings → Extensions → Cline
2. Edit `settings.json`:
```json
{
  "cline.mcpServers": {
    "acf-local": {
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  }
}
```

**Method 2: Via Cline Configuration**
In your workspace, create `.vscode/settings.json`:
```json
{
  "cline.mcp": {
    "servers": {
      "acf-local": {
        "url": "http://localhost:8080/sse",
        "transport": "sse"
      }
    }
  }
}
```

### 4. **Continue (VS Code Extension)**

**Configuration**: Add to VS Code `settings.json`
```json
{
  "continue.mcpServers": [
    {
      "name": "acf-local",
      "url": "http://localhost:8080/sse",
      "transport": "sse"
    }
  ]
}
```

### 5. **Windsurf** (Codeium IDE)

**Location**: Windsurf settings

**Configuration**:
```json
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
```

### 6. **Generic MCP Client**

For any MCP-compatible client:
```json
{
  "server": {
    "url": "http://localhost:8080/sse",
    "transport": "sse",
    "protocol": "2024-11-05"
  }
}
```

## 🔧 Configuration Options

### Basic Configuration
```json
{
  "url": "http://localhost:8080/sse",
  "transport": "sse"
}
```

### With Authentication (Production)
```json
{
  "url": "https://your-deployment.com/sse",
  "transport": "sse", 
  "headers": {
    "Authorization": "Bearer your-token-here"
  }
}
```

### With Custom Timeout
```json
{
  "url": "http://localhost:8080/sse",
  "transport": "sse",
  "timeout": 30000
}
```

### With CORS Headers (if needed)
```json
{
  "url": "http://localhost:8080/sse",
  "transport": "sse",
  "headers": {
    "Origin": "http://localhost:3000"
  }
}
```

## 🧪 Testing Your Configuration

### 1. **Verify Server is Running**
```bash
curl -s http://localhost:8080/health
# Should return: OK
```

### 2. **Test SSE Endpoint**
```bash
curl -H "Accept: text/event-stream" http://localhost:8080/sse
# Should show SSE connection
```

### 3. **Test MCP Initialize**
```bash
curl -X POST http://localhost:8080/stream \
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
  }'
```

## 🔍 Troubleshooting

### Common Issues

**1. Connection Refused**
- ✅ Check if mcp-proxy is running: `ps aux | grep mcp-proxy`
- ✅ Verify port 8080 is listening: `lsof -i :8080`
- ✅ Check firewall settings

**2. SSE Not Working**
- ✅ Ensure client supports SSE transport
- ✅ Check Accept headers in client requests
- ✅ Verify URL is `http://localhost:8080/sse` (not `/stream`)

**3. Authentication Errors**
- ✅ Check token format: `Bearer your-token`
- ✅ Verify token is valid and not expired
- ✅ Check server logs for auth errors

**4. Client Can't Find Server**
- ✅ Check URL is correct (`/sse` for SSE, `/stream` for HTTP)
- ✅ Verify client MCP configuration syntax
- ✅ Restart client after config changes

### Debug Commands

```bash
# Check if server is running
curl -v http://localhost:8080/health

# Test SSE connection
curl -v -H "Accept: text/event-stream" http://localhost:8080/sse

# Check server logs
tail -f /path/to/mcp-proxy.log
```

## 🚀 Production Deployment

For production use, replace `localhost:8080` with your deployed URL:

```json
{
  "mcpServers": {
    "acf-production": {
      "url": "https://your-app.run.app/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer prod-token-here"
      }
    }
  }
}
```

## ✅ Verification

After configuration, your MCP client should:

1. ✅ **Connect**: Show ACF server as connected
2. ✅ **List Tools**: Display all 64+ ACF tools  
3. ✅ **Execute**: Run ACF commands successfully
4. ✅ **Stream**: Receive real-time responses

## 🎯 Next Steps

1. **Test with your preferred client**
2. **Deploy to production** using `./quick-deploy.sh`
3. **Add authentication** for commercial use
4. **Monitor usage** via metrics endpoint

Your ACF server is now accessible via HTTP/SSE to any MCP client! 🎉 