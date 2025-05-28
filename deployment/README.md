# ACF MCP-Proxy Cloud Deployment

This directory contains everything you need to deploy the Agentic Control Framework (ACF) to the cloud using mcp-proxy as a bridge. This approach converts your existing STDIO-based ACF server to HTTP/SSE without modifying any existing code.

## 🚀 Quick Start

1. **Test locally**: `./test-mcp-proxy.sh`
2. **Deploy to Google Cloud Run**: `./cloud-run/deploy.sh`
3. **Use with Claude Desktop**: Copy the generated configuration

## Why mcp-proxy?

- ✅ **Zero code changes** to your existing ACF server
- ✅ **Deploy in under 1 hour** 
- ✅ **Full functionality** - all 64+ tools work immediately
- ✅ **Bridge solution** - use this while building full cloud implementation
- ✅ **Production ready** - mcp-proxy is battle-tested

## Architecture

```
┌─────────────┐     HTTP/SSE    ┌─────────────┐     STDIO    ┌─────────────┐
│   Claude/   │ ◄─────────────► │  mcp-proxy  │ ◄──────────► │  Your ACF   │
│   Client    │                 │  (Bridge)   │              │   Server    │
└─────────────┘                 └─────────────┘              └─────────────┘
                                       ▲
                                       │ Deploy to
                                       ▼
                                ┌─────────────┐
                                │ Cloud Platform│
                                │ (GCP/Railway)│
                                └─────────────┘
```

## Deployment Options

### 🏆 Google Cloud Run (Recommended)

**Pros:**
- Serverless scaling
- Pay per request
- Easy SSL/HTTPS
- Built-in monitoring

**Deploy:**
```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Deploy
./cloud-run/deploy.sh
```

**Cost:** ~$5-20/month for moderate usage

### 🚂 Railway (Simplest)

**Pros:**
- Easiest deployment
- Great for testing
- Automatic SSL

**Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

**Cost:** ~$5/month for hobby plan

### ✈️ Fly.io (Good Performance)

**Pros:**
- Edge locations
- Good performance
- Generous free tier

**Deploy:**
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Cost:** Free tier available, ~$5-10/month

## Files Overview

```
deployment/
├── README.md                   # This file
├── cloud-run/
│   └── deploy.sh              # Google Cloud Run deployment
├── railway/
│   └── railway.json          # Railway configuration  
├── fly/
│   └── fly.toml              # Fly.io configuration
├── mcp-proxy-config.yaml     # mcp-proxy configuration
├── Dockerfile.proxy          # Docker image for all platforms
└── test-mcp-proxy.sh         # Local testing script
```

## Configuration

### Authentication

The deployment uses bearer token authentication. Default tokens:
- `acf-demo-token-2024` - For testing
- `acf-free-tier-token` - For free tier users

**Production:** Set environment variable `AUTH_TOKENS="token1,token2,token3"`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WORKSPACE_ROOT` | Container workspace directory | `/data` |
| `ALLOWED_DIRS` | Directories ACF can access | `/data:/tmp` |
| `ACF_PATH` | Path to ACF installation | `/app` |
| `NODE_ENV` | Node environment | `production` |
| `AUTH_TOKENS` | Comma-separated auth tokens | (from config) |

## Claude Desktop Configuration

After deployment, add this to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "acf": {
      "url": "https://your-deployed-url.com/sse",
      "transport": "sse", 
      "headers": {
        "Authorization": "Bearer your-token-here"
      }
    }
  }
}
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check |
| `/sse` | Server-Sent Events stream |
| `/messages` | HTTP message endpoint |

## Testing

### Local Testing

```bash
# Test everything locally
./test-mcp-proxy.sh

# Test specific components
mcp-proxy --config mcp-proxy-config.yaml  # Start proxy
curl http://localhost:8080/health          # Test health
curl http://localhost:8080/sse             # Test SSE
```

### Production Testing

```bash
# Test deployed service
curl https://your-url.com/health

# Test with authentication
curl -H "Authorization: Bearer your-token" \
     https://your-url.com/sse
```

## Monitoring

### Health Checks

All platforms include automatic health checks on `/health` endpoint.

### Logs

View logs using platform-specific commands:

```bash
# Google Cloud Run
gcloud run services logs tail acf-mcp-proxy --region us-central1

# Railway
railway logs

# Fly.io
fly logs
```

### Metrics

Basic metrics available through platform dashboards:
- Request count
- Response times
- Error rates
- Resource usage

## Scaling

### Automatic Scaling

All platforms support automatic scaling:

| Platform | Min Instances | Max Instances | Scale Trigger |
|----------|---------------|---------------|---------------|
| Cloud Run | 1 | 10 | HTTP requests |
| Railway | 1 | 5 | CPU/Memory |
| Fly.io | 1 | Variable | Traffic |

### Manual Scaling

```bash
# Google Cloud Run
gcloud run services update acf-mcp-proxy \
  --max-instances 20 --region us-central1

# Fly.io  
fly scale count 3

# Railway - through dashboard
```

## Security

### HTTPS/SSL

All platforms provide automatic HTTPS/SSL certificates.

### Authentication

Bearer token authentication is enabled by default. Tokens can be:
1. Set in `mcp-proxy-config.yaml`
2. Provided via `AUTH_TOKENS` environment variable
3. Managed through external auth service

### CORS

CORS is configured to allow:
- `https://claude.ai`
- `https://cursor.sh`
- `https://codeium.com`
- `*` (for development only)

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker run acf-mcp-proxy-test  # Test locally
```

**Health check fails:**
```bash
# Verify ACF server
node ./bin/agentic-control-framework-mcp
```

**Authentication errors:**
```bash
# Check token in request
curl -v -H "Authorization: Bearer token" URL
```

**Tools not working:**
```bash
# Verify tools list
curl -X POST URL/messages \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Getting Help

1. **Check logs** first using platform-specific commands
2. **Test locally** with `./test-mcp-proxy.sh`
3. **Verify configuration** in `mcp-proxy-config.yaml`
4. **Check ACF server** directly with bin script

## Performance Optimization

### Memory Settings

Adjust memory based on usage:
```yaml
# mcp-proxy-config.yaml
performance:
  maxConnections: 10      # Concurrent connections
  connectionTimeout: 30000 # 30 seconds
  requestTimeout: 120000   # 2 minutes
```

### Container Resources

Platform-specific resource settings:

```bash
# Cloud Run
--memory 1Gi --cpu 1

# Fly.io (fly.toml)
memory = "1gb"
cpus = 1

# Railway (railway.json)
"memory": 1024, "cpu": 1000
```

## Next Steps

1. **Deploy and test** with demo tokens
2. **Set up production authentication**
3. **Configure monitoring and alerting**
4. **Add custom domain** (optional)
5. **Set up CI/CD** for automatic deployments
6. **Plan migration** to full cloud-native implementation

## Migration Path

This mcp-proxy deployment is designed as a bridge solution:

1. **Phase 1:** Deploy with mcp-proxy (immediate)
2. **Phase 2:** Add monitoring and analytics 
3. **Phase 3:** Build native cloud implementation
4. **Phase 4:** Migrate traffic to native version
5. **Phase 5:** Deprecate mcp-proxy bridge

The mcp-proxy approach lets you start monetizing immediately while building the full solution. 