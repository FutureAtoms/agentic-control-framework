# ACF Configuration Guide

This directory contains configuration files and templates for the Agentic Control Framework.

## Directory Structure

```
config/
├── README.md                    # This file
├── client-configurations/       # IDE client configurations
├── examples/                    # Configuration templates
└── templates/                   # Task and priority templates
```

## Quick Setup

### 1. Copy Configuration Templates

Copy the example configuration files to the root directory and customize them:

```bash
# Copy basic configuration
cp config/examples/config.json ./config.json

# Copy MCP connection settings
cp config/examples/mcp-connection.json ./mcp-connection.json

# Copy general settings
cp config/examples/settings.json ./settings.json

# Copy Claude Desktop MCP configuration
cp config/examples/claude-mcp-config.json ./claude-mcp-config.json
```

### 2. Update Paths

Replace the placeholder variables in your copied files:

- `${ACF_PATH}` → Full path to your ACF installation
- `${WORKSPACE_ROOT}` → Full path to your workspace/project directory

**Example:**
```bash
# If ACF is installed at /home/user/agentic-control-framework
# And your workspace is /home/user/my-project

# Replace in all config files:
sed -i 's|${ACF_PATH}|/home/user/agentic-control-framework|g' *.json
sed -i 's|${WORKSPACE_ROOT}|/home/user/my-project|g' *.json
```

### 3. Environment Variables (Alternative)

Instead of editing files, you can set environment variables:

```bash
export ACF_PATH="/path/to/agentic-control-framework"
export WORKSPACE_ROOT="/path/to/your/workspace"
export GEMINI_API_KEY="your_gemini_api_key_here"
```

## Configuration Files

### `config.json` - Core ACF Settings
- **Purpose**: Runtime configuration for ACF tools
- **Contains**: Shell settings, timeouts, security settings
- **Required**: Yes

### `claude-mcp-config.json` - Claude Desktop Integration
- **Purpose**: MCP server configuration for Claude Desktop
- **Contains**: Command and environment setup
- **Required**: Only if using Claude Desktop

### `mcp-connection.json` - MCP Connection Settings
- **Purpose**: MCP protocol connection configuration
- **Contains**: Command paths and protocol settings
- **Required**: Only if using MCP integrations

### `settings.json` - General Application Settings
- **Purpose**: Application-wide settings and API keys
- **Contains**: API keys, workspace paths, tool settings
- **Required**: Only if using AI features

## Client Configurations

See `client-configurations/README.md` for detailed setup instructions for:
- Claude Desktop
- Claude Code
- Cursor IDE
- VS Code (Cline/Continue)
- Windsurf

## Security Notes

⚠️ **Important**: Configuration files contain sensitive information and absolute paths.
- Never commit user-specific config files to version control
- Use environment variables for sensitive data like API keys
- Review `allowedDirectories` settings for security

## Troubleshooting

### Configuration Not Found
```bash
# Check if config files exist
ls -la *.json

# Copy from examples if missing
cp config/examples/*.json ./
```

### Path Issues
```bash
# Verify paths exist
ls -la "${ACF_PATH}/bin/agentic-control-framework-mcp"
ls -la "${WORKSPACE_ROOT}"
```

### Permission Issues
```bash
# Make binaries executable
chmod +x "${ACF_PATH}/bin/"*
```

For more help, see the main documentation in `docs/`.
