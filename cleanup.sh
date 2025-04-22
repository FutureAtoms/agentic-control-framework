#!/bin/bash

# Cleanup script for Agentic Control Framework repository
cd "$(dirname "$0")"
REPO_ROOT="$(pwd)"
echo "Starting cleanup of Agentic Control Framework repository..."

# Cleanup script for Gemini Task Manager repository
# This script removes redundant files and organizes the project structure

# 1. Remove redundant MCP server implementations
echo "Removing redundant MCP server implementations..."
rm -f gtm-mcp-fixed.js
rm -f gtm-mcp-rebuild.js
rm -f minimal-mcp-server.js

# 2. Remove duplicate wrapper scripts
echo "Removing duplicate wrapper scripts..."
rm -f gtm-wrapper.sh
rm -f gtm-workspace-wrapper.sh

# 3. Remove redundant bin wrappers
echo "Standardizing bin wrappers..."
rm -f bin/task-manager-mcp.js
rm -f bin/mcp-wrapper.js
rm -f bin/mcp-safe.js
rm -f bin/mcp-wrapper-extreme.js

# 4. Consolidate documentation
echo "Consolidating documentation..."
mkdir -p docs/tutorials
mv gmt_tutorial.md docs/tutorials/ 2>/dev/null || true
mv gemini-task-manager-tutorial.md docs/tutorials/ 2>/dev/null || true

# 5. Move test scripts to test directory
echo "Organizing test scripts..."
mkdir -p test/scripts
mv test-mcp-client.js test/scripts/ 2>/dev/null || true
mv test-expand.js test/scripts/ 2>/dev/null || true
mv test-revise.js test/scripts/ 2>/dev/null || true

# 6. Move CLI wrapper to bin directory
echo "Moving CLI wrapper to bin directory..."
if [ -f task-cli.js ]; then
  mv task-cli.js bin/task-cli.js
  # Update the bin/task-manager script to point to the new location
  echo '#!/usr/bin/env node

// CLI Entry point
require("./task-cli.js");' > bin/task-manager
  chmod +x bin/task-manager
fi

# 7. Create a backup of the primary MCP wrapper if it doesn't exist
if [ ! -f bin/task-manager-mcp ]; then
  echo "WARNING: Main MCP wrapper (bin/task-manager-mcp) missing!"
  # Try to restore from one of the other scripts
  if [ -f bin/task-manager-mcp.js ]; then
    echo "Creating bin/task-manager-mcp from bin/task-manager-mcp.js..."
    echo '#!/usr/bin/env bash

# Wrapper for Gemini Task Manager MCP script
# This script handles environment setup and launches the MCP server

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Setup environment for the MCP server
export GTM_WORKSPACE_ROOT="${PWD}"
echo "GTM MCP wrapper starting..." >&2
echo "Workspace root: ${GTM_WORKSPACE_ROOT}" >&2
echo "Project root: ${REPO_ROOT}" >&2

# Execute the actual MCP server
exec node "$REPO_ROOT/src/mcp_server.js" "$@"' > bin/task-manager-mcp
    chmod +x bin/task-manager-mcp
  fi
fi

echo "Cleanup completed!"
echo "Please review changes and make any necessary adjustments." 