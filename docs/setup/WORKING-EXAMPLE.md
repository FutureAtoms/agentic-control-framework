# 🚀 Working Example: ACF + mcp-proxy

This is a **working example** to test the ACF MCP-proxy integration immediately on your local machine.

## ✅ Prerequisites

- Node.js 22+ (LTS) 
- npm
- Your Agentic Control Framework project

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Install mcp-proxy

```bash
npm install -g mcp-proxy
```

### 2. Start ACF with mcp-proxy

```bash
# From your ACF project directory
mcp-proxy --port 8080 --debug node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

### 3. Test the integration

In another terminal:

```bash
# Test SSE endpoint
curl -H "Accept: text/event-stream" http://localhost:8080/sse

# Test health (if available)
curl http://localhost:8080/health
```

### 4. Configure Claude Desktop

Add this to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "acf-proxy": {
      "url": "http://localhost:8080/sse", 
      "transport": "sse"
    }
  }
}
```

## 🎯 What This Does

1. **mcp-proxy** converts your STDIO-based ACF server to HTTP/SSE
2. **No code changes** needed to your existing ACF server
3. **All 64+ tools** work immediately through the HTTP bridge
4. **Claude Desktop** can connect via SSE transport

## 🔧 Advanced Configuration

### With Authentication

If you want to add authentication and monetization:

```bash
# Start with auth proxy (requires additional setup)
./quick-deploy.sh local --with-auth
```

### Production Deployment

```bash
# Deploy to Google Cloud Run
export GCP_PROJECT_ID="your-project-id"
./quick-deploy.sh gcp --with-auth

# Deploy to Railway (simplest)
./quick-deploy.sh railway --proxy-only
```

## ✅ Verification

If everything works, you should:

1. ✅ See mcp-proxy start and connect to ACF
2. ✅ Be able to curl the SSE endpoint
3. ✅ See your ACF tools available in Claude Desktop
4. ✅ Execute ACF commands through Claude

## 🆘 Troubleshooting

### mcp-proxy not found
```bash
npm install -g mcp-proxy
# or
npm install -g @modelcontextprotocol/sdk
```

### ACF server won't start
```bash
# Test ACF directly first
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) --help
```

### Port already in use
```bash
# Kill existing processes
lsof -ti:8080 | xargs kill -9

# Or use different port
mcp-proxy --port 8081 node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

### Claude Desktop can't connect
1. Make sure mcp-proxy is running
2. Check the URL in Claude settings
3. Verify SSE endpoint responds to curl

## 🎉 Success!

Once this works, you have:
- ✅ **Zero-code bridge** from STDIO to HTTP/SSE
- ✅ **Full ACF functionality** via web protocols  
- ✅ **Claude Desktop integration** ready
- ✅ **Foundation for cloud deployment** established

## 🚀 Next Steps

1. **Add authentication**: Use `./quick-deploy.sh local --with-auth`
2. **Deploy to cloud**: Choose GCP, Railway, or Fly.io  
3. **Enable monetization**: Configure Stripe and user management
4. **Scale up**: Move to production infrastructure

This working example proves the mcp-proxy bridge concept works perfectly! 🎯 