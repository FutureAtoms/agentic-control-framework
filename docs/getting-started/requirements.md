# System Requirements

## Minimum Requirements

### Hardware
- **CPU**: 2 cores (x86_64 or ARM64)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Stable internet connection for cloud features

### Software
- **Node.js**: Version 18.0.0 or higher (20+ recommended)
- **npm**: Version 8.0.0 or higher
- **Git**: Version 2.0 or higher
- **Operating System**:
  - macOS 12+ (Monterey or later)
  - Ubuntu 20.04+ or Debian 11+
  - Windows 10/11 with WSL2
  - Any Linux distribution with glibc 2.31+

## Recommended Setup

### Development Machine
- **CPU**: 4+ cores
- **RAM**: 16GB
- **Storage**: 10GB free space (for logs and cache)
- **Display**: 1920x1080 or higher for browser automation

### Production Server
- **CPU**: 2+ vCPUs
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **Network**: Low-latency connection (<50ms to clients)

## IDE Requirements

### Claude Code
- Latest version from Anthropic
- MCP support enabled
- 2GB RAM allocated to IDE

### Cursor IDE
- Version 0.8.0 or higher
- MCP extension installed
- Node.js runtime configured

### Claude Desktop
- Version with MCP support
- macOS 12+ or Windows 10+

### VS Code
- Version 1.85.0 or higher
- MCP extension from marketplace
- Node.js extension pack

## Browser Automation Requirements

For browser automation tools:
- **Chromium**: Automatically installed via Playwright
- **Display**: Virtual display for headless mode (Linux servers)
- **Memory**: Additional 2GB for browser processes

## Cloud Deployment Requirements

### Google Cloud Run
- Container runtime support
- 2 vCPU minimum
- 4GB memory minimum
- HTTP/2 support

### Docker
- Docker Engine 20.10+
- Docker Compose 2.0+ (optional)
- 4GB memory limit per container

### Railway/Fly.io
- Node.js buildpack support
- WebSocket support for real-time features
- Auto-scaling capability (recommended)

## Network Requirements

### Ports
- **3000**: Default ACF server port
- **3001-3010**: Additional services (optional)
- **443**: HTTPS for production
- **80**: HTTP (redirect to HTTPS)

### Protocols
- HTTP/1.1 and HTTP/2
- WebSocket for real-time updates
- Server-Sent Events (SSE) for MCP

## Optional Dependencies

### For Enhanced Features
- **Redis**: For caching and session storage
- **PostgreSQL**: For persistent task storage
- **ffmpeg**: For media processing
- **ImageMagick**: For image manipulation

### For Development
- **TypeScript**: Version 5.0+
- **ESLint**: For code quality
- **Jest**: For running tests
- **Prettier**: For code formatting

## Checking Requirements

### Verify Node.js
```bash
node --version
# Should output v18.0.0 or higher
```

### Verify npm
```bash
npm --version
# Should output 8.0.0 or higher
```

### Verify Git
```bash
git --version
# Should output 2.0 or higher
```

### Check System Resources
```bash
# Check available memory
free -h  # Linux
vm_stat  # macOS

# Check disk space
df -h

# Check CPU info
lscpu  # Linux
sysctl -n machdep.cpu.brand_string  # macOS
```

## Troubleshooting

### Insufficient Memory
If you have less than 4GB RAM:
- Use swap space (not recommended for production)
- Reduce concurrent operations
- Disable browser automation features

### Unsupported Node Version
```bash
# Use nvm to install correct version
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Missing Dependencies
```bash
# Install build tools
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install

# RHEL/CentOS
sudo yum groupinstall "Development Tools"
```

## Performance Considerations

- **SSD storage** significantly improves file operation performance
- **Multi-core CPUs** enable parallel task processing
- **Adequate RAM** prevents swapping and improves response times
- **Low-latency network** essential for real-time features

## Next Steps

Once requirements are met:
1. Follow the [Installation Guide](./installation.md)
2. Try the [Quick Start](./quick-start.md)
3. Configure your [IDE](../setup/)