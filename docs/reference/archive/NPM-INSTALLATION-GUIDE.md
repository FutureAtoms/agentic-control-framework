# ACF NPM Installation Guide

## Current Installation Methods

### 1. Install from Local Directory
```bash
# Install locally in your project (from a local clone)
npm install <absolute/path/to/agentic-control-framework>

# Or install globally
npm install -g <absolute/path/to/agentic-control-framework>
```

### 2. Using npm link (Development)
```bash
# In the ACF directory
cd <absolute/path/to/agentic-control-framework>
npm link

# In your project directory
npm link agentic-control-framework
```

### 3. Install from GitHub (Once Published)
```bash
npm install -g github:FutureAtoms/agentic-control-framework
```

## Adding to Claude Code

### Method 1: Claude CLI
```bash
claude mcp add acf-local \
  -e ACF_PATH="/path/to/agentic-control-framework" \
  -e WORKSPACE_ROOT="${cwd}" \
  -- node /path/to/agentic-control-framework/bin/agentic-control-framework-mcp --workspaceRoot "${cwd}"
```

### Method 2: Manual Configuration
Add to `~/.claude.json` or `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "node",
      "args": [
        "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
        "--workspaceRoot",
        "${cwd}"
      ],
      "env": {
        "ACF_PATH": "/path/to/agentic-control-framework",
        "WORKSPACE_ROOT": "${cwd}"
      }
    }
  }
}
```

## Testing Installation

### Verify Binary Installation
```bash
# Check if binary is available
which agentic-control-framework

# Test the binary
agentic-control-framework --version
```

### Test MCP Server
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{}}}' | agentic-control-framework
```

## Known Issues & Solutions

### Issue 1: Sharp Dependency
**Problem**: Sharp module fails to install on some platforms (Alpine Linux, ARM64)
**Solution**: Sharp has been moved to optionalDependencies. The server will work without it, but screenshot features will be disabled.

### Issue 2: Path Conflicts
**Problem**: Multiple ACF installations causing path confusion
**Solution**: Always set `ACF_PATH` environment variable to point to the correct installation:
```bash
export ACF_PATH="<absolute/path/to/agentic-control-framework>"
```

### Issue 3: Permission Errors
**Problem**: EACCES errors during global installation
**Solution**: Use npm's prefix or nvm to manage global packages without sudo:
```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## Future NPM Registry Installation

Once published to npm registry, installation will be simplified:
```bash
# Install globally from npm
npm install -g agentic-control-framework

# Add to Claude Code
claude mcp add agentic-control-framework
```

## Package Information

- **Name**: agentic-control-framework
- **Version**: 0.1.1
- **Author**: Abhilash Chadhar (FutureAtoms)
- **License**: ISC
- **Node**: Requires Node.js v18 or higher
- **Tools**: 79+ specialized tools for autonomous agent development

## Support

- **Repository**: https://github.com/FutureAtoms/agentic-control-framework
- **Issues**: https://github.com/FutureAtoms/agentic-control-framework/issues
