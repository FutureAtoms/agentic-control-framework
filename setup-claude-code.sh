#!/bin/bash

# 🚀 Claude Code Setup Script for ACF
# This script creates a claude-mcp-config.json file for your project

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
cat > claude-mcp-config.json << EOF
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

echo "✅ Claude Code configuration created: claude-mcp-config.json"
echo ""
echo "📋 Configuration details:"
echo "   - ACF Path: $ACF_PATH"
echo "   - Workspace: $PROJECT_ROOT"
echo "   - Mode: Full access (read/write)"
echo "   - Browser: UI enabled"
echo ""
echo "🚀 To add ACF server to Claude Code:"
echo "   claude mcp add acf-server \\"
echo "     -e ACF_PATH=\"$ACF_PATH\" \\"
echo "     -e WORKSPACE_ROOT=\"$PROJECT_ROOT\" \\"
echo "     -e READONLY_MODE=\"false\" \\"
echo "     -e BROWSER_HEADLESS=\"false\" \\"
echo "     -e DEFAULT_SHELL=\"/bin/bash\" \\"
echo "     -e NODE_ENV=\"production\" \\"
echo "     -- node $ACF_PATH/bin/agentic-control-framework-mcp --workspaceRoot \"$PROJECT_ROOT\""
echo ""
echo "🚀 To start Claude Code:"
echo "   claude"
echo ""
echo "🧪 To test the configuration:"
echo "   claude --test-tools"
echo ""
echo "📚 For more help, see: docs/CLAUDE_CODE_SETUP_GUIDE.md"