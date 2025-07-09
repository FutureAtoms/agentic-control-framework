#!/bin/bash

# 🚀 Claude Code Setup Script for ACF
# This script creates a claude-code-mcp-config.json file for your project

set -e

echo "🤖 Setting up Claude Code for Agentic Control Framework..."

# Get current directory
PROJECT_ROOT="$(pwd)"
ACF_PATH="$(dirname "$(readlink -f "$0")")"

# Check if we're in the ACF directory
if [ ! -f "$ACF_PATH/bin/agentic-control-framework-mcp" ]; then
    echo "❌ Error: Cannot find ACF MCP server at $ACF_PATH/bin/agentic-control-framework-mcp"
    echo "Please run this script from the ACF directory or update ACF_PATH"
    exit 1
fi

# Create Claude Code configuration
cat > claude-code-mcp-config.json << EOF
{
  "type": "stdio",
  "command": "node",
  "args": [
    "$ACF_PATH/bin/agentic-control-framework-mcp",
    "--workspaceRoot",
    "$PROJECT_ROOT"
  ],
  "env": {
    "ACF_PATH": "$ACF_PATH",
    "WORKSPACE_ROOT": "$PROJECT_ROOT",
    "READONLY_MODE": "false",
    "BROWSER_HEADLESS": "false",
    "DEFAULT_SHELL": "/bin/bash",
    "NODE_ENV": "production"
  }
}
EOF

echo "✅ Claude Code configuration created: claude-code-mcp-config.json"
echo ""
echo "📋 Configuration details:"
echo "   - ACF Path: $ACF_PATH"
echo "   - Workspace: $PROJECT_ROOT"
echo "   - Mode: Full access (read/write)"
echo "   - Browser: UI enabled"
echo ""
echo "🚀 To start Claude Code with ACF:"
echo "   claude-code --mcp-config claude-code-mcp-config.json"
echo ""
echo "🧪 To test the configuration:"
echo "   claude-code --mcp-config claude-code-mcp-config.json --test-tools"
echo ""
echo "📚 For more help, see: docs/CLAUDE_CODE_SETUP_GUIDE.md"