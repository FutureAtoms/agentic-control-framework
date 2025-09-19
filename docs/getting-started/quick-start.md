# Quick Start Guide

## 5-Minute Setup

Get ACF running quickly with these simple steps.

## Prerequisites

- Node.js 18+ installed
- Git installed
- 4GB RAM available

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Install dependencies
npm install

# Build the project
npm run build
```

## Step 2: Start the Server

```bash
# Start in CLI mode (simplest)
npm start

# Or start MCP server for IDE integration
npm run server
```

## Step 3: Verify Installation

```bash
# Run a simple test
npm run test:simple

# Check server status
npm run status
```

## Step 4: Try Your First Command

### CLI Mode
```bash
# Add a task
acf add "My first task"

# List tasks
acf list

# Get next task
acf next
```

### MCP Mode (Claude Code/Cursor)
1. Open your IDE
2. Configure MCP client (see [IDE setup guides](../setup/))
3. Use natural language: "Add a task: Build a feature"

## What's Next?

- 📖 Read the [complete tutorial](../tutorials/complete-tutorial.md)
- 🔧 Set up your [preferred IDE](../setup/)
- 🚀 Deploy to the [cloud](../deployment/)
- 📚 Explore [all available tools](../architecture/tool-reference.md)

## Quick Tips

1. **CLI is fastest** for quick tasks and testing
2. **MCP mode** enables AI-powered automation
3. **Cloud deployment** allows remote access
4. Check `npm run help` for all available commands

## Common Issues

### Port Already in Use
```bash
# Change the default port
PORT=3001 npm start
```

### Permission Errors
```bash
# Fix npm permissions
sudo npm install -g --unsafe-perm
```

### Build Failures
```bash
# Clean and rebuild
npm run clean
npm install --force
npm run build
```

## Getting Help

- 📋 [Troubleshooting Guide](../setup/troubleshooting.md)
- 💬 [GitHub Issues](https://github.com/FutureAtoms/agentic-control-framework/issues)
- 📚 [Full Documentation](../README.md)