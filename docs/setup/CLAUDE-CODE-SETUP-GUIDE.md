# 🤖 Claude Code Setup Guide for ACF

**A comprehensive guide to using Agentic Control Framework with Claude Code**

**Author:** Abhilash Chadhar (FutureAtoms)  
**Last Updated:** January 2025

## 🎯 Why Claude Code + ACF?

Claude Code is the premier way to use ACF's MCP server, offering:

- **✅ Native MCP Support**: First-class integration with excellent tool discovery
- **⚡ High Performance**: Optimized for real-time streaming and tool execution
- **🔧 Rich Tooling**: Built-in debugging, validation, and error handling
- **🛡️ Security**: Advanced permission management and sandboxing
- **🎨 Superior UX**: Beautiful tool descriptions and parameter hints
- **📊 Comprehensive Testing**: All 83+ ACF tools verified working

## 🚀 Quick Start (2 Minutes)

### Option 1: One-Command Setup (Recommended)
```bash
# Clone ACF (if not already installed)
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Install dependencies
npm install

# Setup for Claude Code
./setup-claude.sh

# Add ACF server to Claude Code
claude mcp add acf-server \
  -e ACF_PATH="$(pwd)" \
  -e WORKSPACE_ROOT="$(pwd)" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node ./bin/agentic-control-framework-mcp --workspaceRoot "$(pwd)"
```

### Option 2: Manual Configuration
```bash
# Navigate to your project directory
cd /path/to/your/project

# Copy ACF's pre-configured file
cp /path/to/agentic-control-framework/claude-mcp-config.json .

# Add ACF server to Claude Code
claude mcp add acf-server \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="/path/to/your/project" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "/path/to/your/project"
```

## 📋 Configuration Options

### Basic Configuration
```bash
# Add ACF server to Claude Code
claude mcp add acf-server \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="/path/to/your/project" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "/path/to/your/project"
```

### Advanced Configuration
```bash
# Add ACF server with advanced options
claude mcp add acf-server \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="/path/to/your/project" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -e BROWSER_TYPE="chromium" \
  -e COMMAND_TIMEOUT="30000" \
  -e MAX_SEARCH_RESULTS="100" \
  -e ALLOWED_DIRS="/path/to/your/project:/tmp:/home/user/shared" \
  -e BLOCKED_COMMANDS="sudo rm -rf,rm -rf /" \
  -e TELEMETRY_ENABLED="false" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "/path/to/your/project"
```

### Remote Configuration (via mcp-proxy)
```bash
# Add remote ACF server
claude mcp add --transport sse acf-remote http://localhost:8080/sse
```

### Project-Scoped Configuration
```bash
# Add ACF server for current project only (shared via .mcp.json)
claude mcp add -s project acf-project \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="$(pwd)" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "$(pwd)"
```

### User-Scoped Configuration
```bash
# Add ACF server available across all projects
claude mcp add -s user acf-global \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e READONLY_MODE="false" \
  -e BROWSER_HEADLESS="false" \
  -e DEFAULT_SHELL="/bin/bash" \
  -e NODE_ENV="production" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "$(pwd)"
```

## 🛠️ Environment Variables

Configure ACF behavior with these environment variables:

### Core Configuration
```bash
# Required paths
export ACF_PATH="/path/to/agentic-control-framework"
export WORKSPACE_ROOT="/path/to/your/project"

# Security settings
export READONLY_MODE="false"  # Enable/disable write operations
export ALLOWED_DIRS="/path/to/your/project:/tmp:/home/user/shared"
export BLOCKED_COMMANDS="sudo rm -rf,rm -rf /,rm -rf *"

# Browser settings
export BROWSER_HEADLESS="false"  # Show browser UI
export BROWSER_TYPE="chromium"   # chromium, firefox, webkit
export BROWSER_TIMEOUT="30000"   # 30 seconds

# Terminal settings
export DEFAULT_SHELL="/bin/bash"  # Default shell for commands
export COMMAND_TIMEOUT="30000"    # Command timeout in milliseconds

# Search settings
export MAX_SEARCH_RESULTS="100"   # Max search results
export SEARCH_TIMEOUT="30000"     # Search timeout

# AI features (optional)
export GEMINI_API_KEY="your_key"  # For AI-powered task expansion
export TELEMETRY_ENABLED="false"  # Disable telemetry
```

## 🎯 Usage Examples

### Basic Task Management
```bash
# Start Claude Code (ACF server should already be added)
claude

# Then use natural language:
```

**In Claude Code:**
```
Initialize a new project called "My Web App" and create initial setup tasks
```

```
Add a high-priority task for implementing user authentication
```

```
List all tasks that are currently in progress
```

```
What should I work on next? Show me the highest priority task.
```

### Advanced Workflows

**1. Code Analysis & Task Creation**
```
Search for all TODO comments in the src directory and create tasks for each one
```

**2. Automated Testing**
```
Execute "npm test" and create debugging tasks if there are any failures
```

**3. Browser Automation**
```
Navigate to https://example.com, take a screenshot, and save it as example-screenshot.png
```

**4. File Operations**
```
Read the contents of package.json and create a task for updating dependencies
```

**5. Priority Management**
```
Show me priority statistics and bump the priority of task #5 by 100 points
```

## 🔧 Advanced Features

### Custom Setup Script
Create a project-specific setup script:

```bash
#!/bin/bash
# setup-project-acf.sh

PROJECT_ROOT="$(pwd)"
ACF_PATH="/path/to/agentic-control-framework"

# Create Claude Code configuration
cat > claude-mcp-config.json << EOF
{
  "type": "stdio",
  "command": "node",
  "args": [
    "${ACF_PATH}/bin/agentic-control-framework-mcp",
    "--workspaceRoot",
    "${PROJECT_ROOT}"
  ],
  "env": {
    "ACF_PATH": "${ACF_PATH}",
    "WORKSPACE_ROOT": "${PROJECT_ROOT}",
    "READONLY_MODE": "false",
    "BROWSER_HEADLESS": "false",
    "DEFAULT_SHELL": "/bin/bash",
    "NODE_ENV": "production",
    "ALLOWED_DIRS": "${PROJECT_ROOT}:/tmp"
  }
}
EOF

# Initialize ACF project
if [ ! -d ".acf" ]; then
    echo "Initializing ACF project..."
    node "${ACF_PATH}/bin/agentic-control-framework-mcp" --init
fi

echo "Claude Code configuration created: claude-mcp-config.json"
echo "Run: claude (server should already be added)"
```

### Multiple Project Configurations
Manage multiple projects with separate configurations:

```bash
# Project A
cd /path/to/project-a
cp /path/to/acf/claude-mcp-config.json claude-config-a.json
# Edit paths in claude-config-a.json

# Project B
cd /path/to/project-b
cp /path/to/acf/claude-mcp-config.json claude-config-b.json
# Edit paths in claude-config-b.json

# Add project-specific server
claude mcp add project-a-server \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="/path/to/project-a" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "/path/to/project-a"
```

## 📊 Tool Categories Available

### ✅ Task Management Tools (33 tools)
- **Core Operations**: addTask, listTasks, updateStatus, getNextTask
- **Priority Management**: recalculatePriorities, bumpTaskPriority, prioritizeTask
- **Dependency Analysis**: getDependencyAnalysis, getAdvancedAlgorithmConfig
- **Project Management**: setWorkspace, initProject, generateTaskTable

### ✅ Filesystem Tools (12 tools)
- **File Operations**: read_file, write_file, copy_file, move_file, delete_file
- **Directory Operations**: list_directory, create_directory, tree
- **File Discovery**: search_files, get_file_info
- **Security**: list_allowed_directories, get_filesystem_status

### ✅ Terminal Tools (6 tools)
- **Command Execution**: execute_command, read_output, force_terminate
- **Process Management**: list_processes, kill_process, list_sessions

### ✅ Browser Tools (25 tools)
- **Navigation**: browser_navigate, browser_navigate_back, browser_navigate_forward
- **Interaction**: browser_click, browser_type, browser_hover, browser_drag
- **Capture**: browser_take_screenshot, browser_pdf_save, browser_snapshot
- **Tab Management**: browser_tab_list, browser_tab_new, browser_tab_select
- **Utilities**: browser_install, browser_resize, browser_wait

### ✅ Search & Edit Tools (2 tools)
- **Code Search**: search_code (with ripgrep)
- **Text Editing**: edit_block (surgical replacements)

### ✅ Configuration Tools (3 tools)
- **Settings**: get_config, set_config_value
- **System**: get_filesystem_status

### ✅ AppleScript Tools (1 tool)
- **macOS Integration**: applescript_execute

## 🧪 Testing & Validation

### Test Your Setup
```bash
# Test MCP server directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp

# Test with Claude Code
claude --test-tools

# List all configured MCP servers
claude mcp list

# Get details about ACF server
claude mcp get acf-server

# Remove ACF server (if needed)
claude mcp remove acf-server

# Run comprehensive tests
cd /path/to/agentic-control-framework
npm test
```

### Validate Configuration
```bash
# Check configuration syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('claude-mcp-config.json', 'utf8')))"

# Verify paths exist
ls -la /path/to/agentic-control-framework/bin/agentic-control-framework-mcp

# Test ACF installation
cd /path/to/agentic-control-framework
node bin/agentic-control-framework-mcp --version
```

## 🚨 Troubleshooting

### Common Issues

**1. Claude Code can't find MCP server**
```bash
# Check configuration file syntax
node -c claude-mcp-config.json

# Verify paths are absolute
ls -la /path/to/agentic-control-framework/bin/agentic-control-framework-mcp

# Check permissions
chmod +x /path/to/agentic-control-framework/bin/agentic-control-framework-mcp
```

**2. Tools not working**
```bash
# Check environment variables
echo $WORKSPACE_ROOT
echo $ACF_PATH

# Verify allowed directories
echo $ALLOWED_DIRS

# Test tool directly
node -e "
const fs = require('fs');
const path = require('path');
console.log(fs.readFileSync(path.join(process.env.WORKSPACE_ROOT, 'package.json'), 'utf8'));
"
```

**3. Browser tools failing**
```bash
# Install browsers
npx playwright install --with-deps

# Check browser installation
npx playwright --version

# Test browser tools
node -e "
const browserTools = require('./src/tools/browser_tools');
browserTools.browserInstall().then(console.log);
"
```

**4. Permission errors**
```bash
# Check file permissions
ls -la /path/to/your/project

# Verify ALLOWED_DIRS includes your workspace
grep -r "ALLOWED_DIRS" claude-mcp-config.json

# Check READONLY_MODE
grep -r "READONLY_MODE" claude-mcp-config.json
```

### Debug Mode
Enable debug logging:
```json
{
  "type": "stdio",
  "command": "node",
  "args": [
    "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
    "--workspaceRoot",
    "/path/to/your/project",
    "--debug"
  ],
  "env": {
    "DEBUG": "acf:*",
    "NODE_ENV": "development"
  }
}
```

## 🔐 Security Best Practices

### 1. Filesystem Security
```json
{
  "env": {
    "READONLY_MODE": "false",
    "ALLOWED_DIRS": "/path/to/your/project:/tmp",
    "BLOCKED_COMMANDS": "sudo rm -rf,rm -rf /,rm -rf *"
  }
}
```

### 2. Process Security
```json
{
  "env": {
    "COMMAND_TIMEOUT": "30000",
    "MAX_SEARCH_RESULTS": "100",
    "TELEMETRY_ENABLED": "false"
  }
}
```

### 3. Browser Security
```json
{
  "env": {
    "BROWSER_HEADLESS": "true",
    "BROWSER_TIMEOUT": "30000",
    "BROWSER_USER_DATA_DIR": "/tmp/acf-browser-profile"
  }
}
```

## 📈 Performance Optimization

### 1. Faster Startup
```json
{
  "env": {
    "NODE_ENV": "production",
    "BROWSER_HEADLESS": "true",
    "COMMAND_TIMEOUT": "10000"
  }
}
```

### 2. Resource Management
```json
{
  "env": {
    "MAX_SEARCH_RESULTS": "50",
    "SEARCH_TIMEOUT": "15000",
    "BROWSER_TIMEOUT": "15000"
  }
}
```

### 3. Caching
```json
{
  "env": {
    "BROWSER_USER_DATA_DIR": "/tmp/acf-browser-cache",
    "TELEMETRY_ENABLED": "false"
  }
}
```

## 🎯 Production Deployment

### Local Development
```bash
# Development mode
claude
```

### Remote Server
```bash
# Start MCP proxy server
mcp-proxy --port 8080 --debug \
  node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp \
  --workspaceRoot /path/to/your/project

# Configure Claude Code for remote
cat > claude-remote-config.json << EOF
{
  "mcpServers": {
    "agentic-control-framework": {
      "transport": {
        "type": "sse",
        "url": "http://your-server:8080/sse"
      }
    }
  }
}
EOF

# Start Claude Code with remote server
claude
```

## 🆘 Support & Community

### Documentation
- **Main README**: [README.md](../README.md)
- **MCP Integration Guide**: [MCP_INTEGRATION_GUIDE.md](./MCP_INTEGRATION_GUIDE.md)
- **Tool Reference**: [TOOL_REFERENCE.md](./TOOL_REFERENCE.md)

### Getting Help
- **GitHub Issues**: [Report problems](https://github.com/FutureAtoms/agentic-control-framework/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/FutureAtoms/agentic-control-framework/discussions)
- **Email Support**: abhilash@futureatoms.com

### Contributing
- **Pull Requests**: [Contribute code](https://github.com/FutureAtoms/agentic-control-framework/pulls)
- **Feature Requests**: [Request features](https://github.com/FutureAtoms/agentic-control-framework/issues/new)

---

**🎉 You're now ready to use ACF with Claude Code! Enjoy the most powerful task management and automation experience available.**

**Next Steps:**
1. Test your configuration with `claude`
2. Try the example workflows above
3. Explore the 83+ tools available
4. Join our community for tips and best practices