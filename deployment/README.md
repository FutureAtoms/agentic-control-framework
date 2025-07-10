# ACF MCP-Proxy Deployment Guide

Deploy your Agentic Control Framework (ACF) to the cloud in under 1 hour with zero code changes using mcp-proxy bridge.

## 🚀 Quick Start (Commercial Ready)

The fastest path to commercial deployment using mcp-proxy to convert your existing STDIO-based ACF server to HTTP/SSE:

```bash
# Deploy with authentication and monetization
./quick-deploy.sh gcp --with-auth

# Deploy proxy only (no auth)
./quick-deploy.sh railway --proxy-only

# Test locally first
./quick-deploy.sh local --with-auth
```

## 🏗️ Architecture

```
┌─────────────┐     HTTP/SSE    ┌─────────────┐     STDIO    ┌─────────────┐
│   Claude/   │ ◄─────────────► │  Auth Proxy │ ◄──────────► │ mcp-proxy   │ ◄─► │ Your ACF │
│   Client    │                 │ (Optional)  │              │  (Bridge)   │     │ Server   │
└─────────────┘                 └─────────────┘              └─────────────┘     └─────────┘
                                        ▲                            ▲
                                        │ Deploy to                  │
                                        ▼                            ▼
                                 ┌─────────────┐            ┌─────────────┐
                                 │  Cloud      │            │  Cloud      │
                                 │  Platform   │            │  Platform   │
                                 └─────────────┘            └─────────────┘
```

## 🎯 Features

### Core Features
- **Zero Code Changes**: Use your existing ACF server as-is
- **Full Functionality**: All 64+ tools work immediately
- **HTTP/SSE Bridge**: Convert STDIO to web-compatible protocols
- **Production Ready**: Battle-tested mcp-proxy foundation

### Commercial Features (with `--with-auth`)
- **User Authentication**: Token-based access control
- **Tiered Pricing**: Free, Pro, Enterprise tiers
- **Stripe Integration**: Automated payment processing
- **Usage Tracking**: Per-user request monitoring
- **Rate Limiting**: Prevent abuse and manage costs
- **Professional UI**: Landing page and user dashboard

## 📦 Supported Platforms

| Platform | Deployment Time | Cost | Best For |
|----------|----------------|------|----------|
| **Google Cloud Run** | 5 minutes | Pay-per-request | Production, Auto-scaling |
| **Railway** | 2 minutes | $5/month | Simple deployment |
| **Fly.io** | 3 minutes | Free tier available | Edge performance |
| **Local Docker** | 1 minute | Free | Development, Testing |

## 🔧 Prerequisites

- Node.js 22+ (LTS) and npm
- Docker and Docker Compose
- Platform-specific CLI (gcloud, railway, or fly)

## 🚀 Deployment Options

### Option 1: Google Cloud Run (Recommended)

Best for production with automatic scaling and pay-per-request pricing.

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Deploy with full commercial features
./quick-deploy.sh gcp --with-auth

# Or deploy proxy only
./quick-deploy.sh gcp --proxy-only
```

**Requirements:**
- Google Cloud account with billing enabled
- `gcloud` CLI installed and authenticated

### Option 2: Railway (Simplest)

Perfect for quick testing and simple deployments.

```bash
# Deploy to Railway
./quick-deploy.sh railway --with-auth
```

**Requirements:**
- Railway account (free tier available)
- `railway` CLI will be installed automatically

### Option 3: Fly.io (Performance)

Great for edge performance with global distribution.

```bash
# Deploy to Fly.io
./quick-deploy.sh fly --with-auth
```

**Requirements:**
- Fly.io account
- `fly` CLI will be installed automatically

### Option 4: Local Development

Test your deployment locally before going to production.

```bash
# Start local deployment with Docker Compose
./quick-deploy.sh local --with-auth

# Test proxy only
./quick-deploy.sh test
```

## 💰 Monetization Setup

When deploying with `--with-auth`, you get a complete commercial solution:

### 1. Configure Payment Processing

Set up Stripe for payment processing:

```bash
export STRIPE_SECRET_KEY="sk_test_..."
export STRIPE_PUBLISHABLE_KEY="pk_test_..."
export STRIPE_PRO_PRICE_ID="price_..."
export STRIPE_ENTERPRISE_PRICE_ID="price_..."
```

### 2. Set Up User Database

Configure Supabase for user management:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
```

### 3. Pricing Tiers

| Tier | Price | Requests/Month | Tools | Support |
|------|-------|----------------|-------|---------|
| **Free** | $0 | 100 | 15 basic tools | Community |
| **Pro** | $29 | 10,000 | All 64+ tools | Priority |
| **Enterprise** | $199 | 100,000 | All + Custom | 24/7 |

### 4. Landing Page

Professional landing page included at your deployed URL with:
- Feature showcase
- Pricing tiers
- User registration
- Payment processing
- Token management

## 🔐 Authentication & Security

### Token Management

The auth proxy handles token validation:

```javascript
// Free tier tokens
acf_free_1703123456_abc123

// Pro tier tokens
acf_pro_1703123456_def456

// Enterprise tokens  
acf_enterprise_1703123456_ghi789
```

### Rate Limiting

Per-tier rate limits:
- **Free**: 10 requests/minute
- **Pro**: 100 requests/minute  
- **Enterprise**: 1000 requests/minute

### CORS Configuration

Configured for major AI platforms:
- Claude Desktop
- Cursor IDE
- Continue IDE
- Codeium

## 📊 Monitoring & Analytics

### Health Checks

Monitor your deployment:

```bash
# Check service health
curl https://your-deployment.com/health

# Check metrics
curl https://your-deployment.com/metrics
```

### Usage Analytics

Built-in analytics track:
- Request counts per user
- Tool usage patterns
- Error rates
- Response times

## 🎛️ Configuration

### Environment Variables

#### Core Configuration
```bash
NODE_ENV=production
WORKSPACE_ROOT=/data
ALLOWED_DIRS=/data:/tmp:/workspace
```

#### Auth & Payments (Optional)
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database Configuration  
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...

# Service URLs
BASE_URL=https://your-domain.com
MCP_PROXY_URL=http://mcp-proxy:8080
```

### Custom Configuration

Modify `mcp-proxy-config.yaml` for custom settings:

```yaml
# Performance tuning
performance:
  maxConnections: 50
  requestTimeout: 300000
  
# Custom rate limits
rateLimit:
  requests: 2000
  window: 60000
```

## 🔧 Claude Desktop Integration

Add your deployed service to Claude Desktop:

```json
{
  "mcpServers": {
    "acf": {
      "url": "https://your-deployment.com/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Health Check Fails
```bash
# Check logs
docker logs acf-mcp-proxy

# Verify configuration
./quick-deploy.sh test
```

#### 2. Authentication Errors
```bash
# Verify token format
echo "Bearer acf-demo-token-2024" | base64

# Check CORS settings
curl -H "Origin: https://claude.ai" https://your-deployment.com/sse
```

#### 3. Rate Limiting
```bash
# Check usage limits
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-deployment.com/metrics
```

### Debug Mode

Enable debug logging:

```bash
# Local debugging
DEBUG=true ./quick-deploy.sh local

# Production debugging
export DEBUG=true
```

## 🚢 Production Deployment

### Security Checklist

- [ ] Replace demo tokens with production tokens
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Review and tighten CORS settings
- [ ] Set up log aggregation
- [ ] Configure secrets management

### Performance Optimization

1. **Enable CDN**: Use CloudFlare for static assets
2. **Database Scaling**: Upgrade Supabase plan as needed
3. **Caching**: Enable Redis for token caching
4. **Load Balancing**: Scale horizontally with multiple instances

### Monitoring Setup

1. **Uptime Monitoring**: Set up Pingdom/StatusCake
2. **Error Tracking**: Configure Sentry
3. **Analytics**: Set up Google Analytics
4. **Business Metrics**: Track revenue and usage

## 💡 Next Steps

### Immediate (Day 1)
1. Deploy to your preferred platform
2. Test with Claude Desktop
3. Set up basic monitoring

### Short Term (Week 1)
1. Configure custom domain
2. Set up production authentication
3. Add monitoring and alerting

### Long Term (Month 1)
1. Optimize performance
2. Add custom features
3. Scale based on usage
4. Plan cloud-native migration

## 🆘 Support

- **Documentation**: Full docs in `/docs`
- **Issues**: GitHub Issues for bug reports
- **Enterprise**: Contact for enterprise support
- **Community**: Discord server for discussions

## 📜 License

This deployment configuration is part of the Agentic Control Framework. See LICENSE for details.

---

**Ready to deploy?** Choose your platform and run the quick-deploy script! 🚀 