# 🌐 Remote Client Setup Guide

This guide covers setting up various MCP clients to connect to ACF via mcp-proxy for remote access.

## ✅ Prerequisites

1. **ACF with mcp-proxy running**:
   ```bash
   mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
   ```

2. **Network access** to the mcp-proxy server (localhost:8080 for local, or your deployed URL)

## 🖥️ Client Configurations

### Claude Desktop

**⚠️ NOTE**: For local development, the **Direct STDIO method** is recommended over mcp-proxy. See the main setup documentation for the working direct executable configuration.

**Remote Development via mcp-proxy:**
```json
{
  "mcpServers": {
    "acf-remote": {
      "url": "http://localhost:8080/sse",
      "transport": "sse",
      "description": "Agentic Control Framework - Remote via mcp-proxy"
    }
  }
}
```

**Cloud Deployment:**
```json
{
  "mcpServers": {
    "acf-cloud": {
      "url": "https://your-domain.com/sse",
      "transport": "sse",
      "description": "Agentic Control Framework - Cloud Deployment",
      "headers": {
        "Authorization": "Bearer your-api-token"
      }
    }
  }
}
```

### Cursor IDE

**Local Development:**
```json
{
  "mcp.servers": {
    "acf-remote": {
      "url": "http://localhost:8080/sse",
      "transport": "sse",
      "description": "Agentic Control Framework - Remote via mcp-proxy",
      "timeout": 30000
    }
  },
  "mcp.enabled": true,
  "mcp.logLevel": "info",
  "mcp.retryAttempts": 3,
  "mcp.retryDelay": 1000
}
```

### Claude Code

**Local Development:**
```json
{
  "mcpServers": {
    "agentic-control-framework-remote": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:8080/sse"
      },
      "description": "Agentic Control Framework - Remote via mcp-proxy",
      "timeout": 30000
    }
  }
}
```

## 🚀 Setup Instructions

### 1. Start mcp-proxy Server

```bash
# From your ACF directory
mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

### 2. Verify Server is Running

```bash
# Test SSE endpoint
curl -H "Accept: text/event-stream" http://localhost:8080/sse

# Should return SSE connection events
```

### 3. Configure Your Client

Choose the appropriate configuration from above and add it to your client's MCP settings.

### 4. Test Connection

1. Restart your MCP client
2. Verify ACF tools are available
3. Test a simple command like listing tasks

## 🔧 Advanced Configuration

### Authentication

For production deployments, add authentication headers:

```json
{
  "headers": {
    "Authorization": "Bearer your-api-token",
    "X-API-Key": "your-api-key"
  }
}
```

### Timeout Settings

Adjust timeouts for slower networks:

```json
{
  "timeout": 60000,
  "retryAttempts": 5,
  "retryDelay": 2000
}
```

### CORS Configuration

For web-based clients, ensure CORS is properly configured in mcp-proxy.

## 🌍 Cloud Deployment URLs

Replace `localhost:8080` with your deployed URL:

- **Google Cloud Run**: `https://your-service-hash-region.a.run.app/sse`
- **Railway**: `https://your-app.railway.app/sse`
- **Fly.io**: `https://your-app.fly.dev/sse`
- **Custom Domain**: `https://your-domain.com/sse`

## ✅ Verification

After setup, you should see:

1. ✅ MCP client connects successfully
2. ✅ ACF tools appear in the client
3. ✅ Commands execute without errors
4. ✅ Real-time communication works

## 🆘 Troubleshooting

### Connection Issues

1. **Check mcp-proxy is running**:
   ```bash
   curl http://localhost:8080/sse
   ```

2. **Verify network connectivity**:
   ```bash
   telnet localhost 8080
   ```

3. **Check client logs** for connection errors

### Authentication Issues

1. Verify API tokens are correct
2. Check authorization headers format
3. Ensure tokens have proper permissions

### Performance Issues

1. Increase timeout values
2. Check network latency
3. Monitor server resources

## 📁 Configuration Files

All tested configurations are available in the `client-configurations/` directory:

- `claude-desktop-remote.json` - Claude Desktop remote setup
- `cursor-remote.json` - Cursor IDE remote setup  
- `claude-code-remote.json` - Claude Code remote setup

## 🎉 Success!

Once configured, you'll have:

- ✅ **Remote access** to all ACF tools
- ✅ **Real-time communication** via SSE
- ✅ **Multiple client support** 
- ✅ **Cloud deployment ready**
