#!/bin/bash

# Gemini Task Manager wrapper script
# This script handles properly launching the Task Manager MCP server
# with the correct workspace root configuration

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the repository root directory (parent of bin directory)
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Determine workspace root
# If provided as argument, use that
if [ "$1" == "--workspaceRoot" ] && [ -n "$2" ]; then
  WORKSPACE_ROOT="$2"
else
  # Otherwise use the current directory
  WORKSPACE_ROOT=$(pwd)
fi

# Basic validation
if [ "$WORKSPACE_ROOT" == "/" ]; then
  echo "[ERROR] Workspace root cannot be the root directory (/)" >&2
  exit 1
fi

if [ -z "$WORKSPACE_ROOT" ]; then
  echo "[ERROR] Could not determine workspace directory" >&2
  exit 1
fi

# Set environment variable for the MCP server
export GTM_WORKSPACE_ROOT="$WORKSPACE_ROOT"

# Log what we're doing
echo "[INFO] Starting Gemini Task Manager MCP Server" >&2
echo "[INFO] Workspace Root: $WORKSPACE_ROOT" >&2
echo "[INFO] Project Root: $REPO_ROOT" >&2

# Execute the MCP wrapper script
exec node "$REPO_ROOT/bin/task-manager-mcp.js" --workspaceRoot "$WORKSPACE_ROOT" "$@" 