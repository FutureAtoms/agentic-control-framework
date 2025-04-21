#!/bin/bash

# Gemini Task Manager MCP Wrapper Script
# This script serves as an entry point for Cursor's MCP integration

# Exit on any error
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Go to the root of the repository (one level up from bin/)
REPO_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Function to detect workspace root
detect_workspace_root() {
  # If GTM_WORKSPACE_ROOT is explicitly set, use that
  if [ -n "$GTM_WORKSPACE_ROOT" ]; then
    echo "$GTM_WORKSPACE_ROOT"
    return
  fi
  
  # Otherwise use current working directory
  echo "$PWD"
}

# Set workspace root
export GTM_WORKSPACE_ROOT=$(detect_workspace_root)

# Ensure workspace root is a valid directory
if [ ! -d "$GTM_WORKSPACE_ROOT" ]; then
  echo "Error: Workspace root '$GTM_WORKSPACE_ROOT' is not a valid directory."
  exit 1
fi

# Prevent using system root as workspace
if [ "$GTM_WORKSPACE_ROOT" = "/" ]; then
  echo "Error: Cannot use system root as workspace. Please specify a valid project directory."
  exit 1
fi

# Check if GTM_WORKSPACE_ROOT is set appropriately
echo "Using workspace root: $GTM_WORKSPACE_ROOT" >&2

# Ensure tasks directory exists in the workspace
TASKS_DIR="$GTM_WORKSPACE_ROOT/tasks"
mkdir -p "$TASKS_DIR"

# Run the MCP server
exec "$SCRIPT_DIR/task-manager-mcp" "$@" 