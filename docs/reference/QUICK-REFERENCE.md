# 🚀 ACF Quick Reference

**Author:** Abhilash Chadhar (FutureAtoms)  
**Last Updated:** July 2025

## 📋 Essential Commands

### Server Startup Commands

```bash
# CLI Mode - Direct task management
./bin/acf init --project-name "My Project" --project-description "Project description"

# Local MCP Mode - IDE integration
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Cloud MCP Mode - Remote access via HTTP/SSE
mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"
```

### Verification Commands

```bash
# Check server health
curl http://localhost:8080/health

# Test tool availability
curl -X POST http://localhost:8080/tools/list -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Verify CLI functionality
./bin/acf --help
./bin/acf list
```

## 🔧 Installation Quick Commands

### Windows (PowerShell)
```powershell
# Install Node.js 22 LTS
winget install OpenJS.NodeJS.LTS

# Clone and setup ACF
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework
npm install
npm install -g mcp-proxy @modelcontextprotocol/inspector
npx playwright install
```

### macOS (Terminal)
```bash
# Install Node.js 22 LTS
brew install node@22

# Clone and setup ACF
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework
npm install
npm install -g mcp-proxy @modelcontextprotocol/inspector
npx playwright install
chmod +x bin/*
```

### Ubuntu (Terminal)
```bash
# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and setup ACF
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework
npm install
npm install -g mcp-proxy @modelcontextprotocol/inspector
npx playwright install
chmod +x bin/*
```

## 🎯 Common CLI Tasks

```bash
# Initialize new project
./bin/acf init --project-name "Project Name" --project-description "Description"

# Add tasks
./bin/acf add --title "Task Title" --description "Task description" --priority high
./bin/acf add --title "Subtask" --parent-id TASK_ID --priority medium

# List and manage tasks
./bin/acf list                    # List all tasks
./bin/acf list --status pending   # Filter by status
./bin/acf status TASK_ID          # Get task details
./bin/acf update TASK_ID --status completed

# Priority management
./bin/acf bump TASK_ID            # Increase priority
./bin/acf defer TASK_ID           # Decrease priority
./bin/acf next                    # Get next recommended task

# Generate outputs
./bin/acf table                   # Generate task table
./bin/acf context                 # Get project context
```

## 🔌 IDE Integration Quick Setup

### Claude Code
```bash
# Add ACF server to Claude Code
claude mcp add acf-server node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Verify integration
claude mcp list
claude mcp get acf-server
```

### Cursor IDE
```json
// Add to Cursor settings.json
{
  "mcp.servers": {
    "acf-local": {
      "transport": "sse",
      "url": "http://localhost:8080/sse"
    }
  }
}
```

### Claude Desktop (Direct STDIO - RECOMMENDED)
```json
// ~/.config/Claude/claude_desktop_config.json (Linux)
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "/FULL/PATH/TO/agentic-control-framework/bin/agentic-control-framework-mcp",
      "env": {
        "ACF_PATH": "/FULL/PATH/TO/agentic-control-framework",
        "WORKSPACE_ROOT": "/FULL/PATH/TO/YOUR/WORKSPACE",
        "ALLOWED_DIRS": "/FULL/PATH/TO/YOUR/WORKSPACE:/tmp",
        "READONLY_MODE": "false",
        "BROWSER_HEADLESS": "false",
        "DEFAULT_SHELL": "/bin/bash"
      }
    }
  }
}
```

### Claude Desktop (Via mcp-proxy - Alternative)
```json
{
  "mcpServers": {
    "acf-proxy": {
      "transport": "sse",
      "url": "http://localhost:8080/sse"
    }
  }
}
```

### VS Code (Cline Extension)
```json
// Add to VS Code settings.json
{
  "cline.mcpServers": {
    "acf-local": {
      "transport": "sse",
      "url": "http://localhost:8080/sse"
    }
  }
}
```

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Test specific components
npm run test:cli
npm run test:mcp
npm run test:tools

# Test browser automation
npx playwright --version
node -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch(); console.log('✅ Browser test passed'); await browser.close(); })()"

# Test MCP protocol compliance
npx @modelcontextprotocol/inspector
```

## 🔍 Troubleshooting Quick Fixes

### Server Won't Start
```bash
# Check Node.js version (should be 22+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check permissions (macOS/Linux)
chmod +x bin/*

# Verify binary syntax
node --check ./bin/agentic-control-framework-mcp
```

### Port Already in Use
```bash
# Find process using port 8080
# Windows:
netstat -ano | findstr :8080

# macOS/Linux:
lsof -i :8080

# Kill process and restart
kill -9 PID_NUMBER
```

### Tools Not Showing in IDE
```bash
# Verify server is running
curl http://localhost:8080/health

# Check tool count
curl -X POST http://localhost:8080/tools/list -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Restart mcp-proxy
pkill mcp-proxy
mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"
```

### Permission Errors (npm global)
```bash
# Configure npm global directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Add to shell profile
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc  # or ~/.zshrc
source ~/.bashrc  # or ~/.zshrc
```

## 📚 Documentation Links

- **[Platform Setup Guide](PLATFORM-SETUP-GUIDE.md)** - Detailed installation for Windows, macOS, Ubuntu
- **[Setup Instructions](SETUP-INSTRUCTIONS.md)** - IDE integration configuration
- **[Tool Reference](docs/TOOL_REFERENCE.md)** - Complete tool documentation
- **[Testing Report](COMPREHENSIVE-TESTING-REPORT.md)** - Verification and testing results
- **[README](README.md)** - Complete project documentation

## 🆘 Getting Help

1. **Check Documentation**: Review the guides above for your specific issue
2. **Verify Prerequisites**: Ensure Node.js 22+, npm, and dependencies are installed
3. **Test Components**: Use verification commands to isolate the problem
4. **Check Logs**: Look for error messages in terminal output
5. **Restart Services**: Stop and restart ACF server and mcp-proxy

---

**Quick Reference Version:** 1.0  
**Compatible with:** ACF v0.1.1+  
**Last Verified:** July 2025
