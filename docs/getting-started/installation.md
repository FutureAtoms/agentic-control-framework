# Installation Guide

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn package manager
- Git (for cloning the repository)
- 4GB RAM minimum
- Operating Systems: macOS, Linux, Windows (with WSL)

## Installation Methods

### Method 1: Quick Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Install dependencies
npm install

# Build the project
npm run build

# Start the MCP server
npm start
```

### Method 2: NPM Package Installation

```bash
# Install as a global package
npm install -g agentic-control-framework

# Or install locally in your project
npm install agentic-control-framework
```

### Method 3: Docker Installation

```bash
# Using Docker
docker pull futureatoms/acf:latest
docker run -p 3000:3000 futureatoms/acf:latest
```

## Post-Installation Setup

### 1. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit with your preferences
nano .env
```

### 2. Verify Installation

```bash
# Run the test suite
npm test

# Check MCP server status
npm run status
```

### 3. Configure Your IDE

Choose your IDE and follow the specific setup guide:

- [Claude Code Setup](../setup/claude-code.md)
- [Claude Desktop Setup](../setup/claude-desktop.md)
- [Cursor IDE Setup](../setup/cursor.md)
- [VS Code Setup](../setup/vscode.md)

## Common Installation Issues

### Node Version Issues

```bash
# Check your Node version
node --version

# Use nvm to install correct version
nvm install 20
nvm use 20
```

### Permission Errors

```bash
# Fix npm permissions on macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Build Failures

```bash
# Clean and rebuild
npm run clean
npm install --force
npm run build
```

## Next Steps

1. Read the [Quick Start Guide](./quick-start.md)
2. Configure your [IDE Integration](../setup/)
3. Try the [Basic Tutorial](../tutorials/basic-usage.md)
4. Explore the [Tool Reference](../architecture/tool-reference.md)

## Support

- GitHub Issues: [Report problems](https://github.com/FutureAtoms/agentic-control-framework/issues)
- Documentation: [Full documentation](../README.md)
- Community: Join our Discord server