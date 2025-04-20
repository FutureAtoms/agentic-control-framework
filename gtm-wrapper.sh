#!/bin/bash

# Try to get the current workspace directory
WORKSPACE_ROOT=$(pwd)

# If pwd returns root, try to use a hardcoded project path
if [ "$WORKSPACE_ROOT" = "/" ]; then
    # Use a hardcoded path as fallback
    WORKSPACE_ROOT="/Users/abhilashchadhar/uncloud/cursor/deep-behavior-game"
    echo "Detected root directory, using hardcoded fallback path: $WORKSPACE_ROOT" >&2
else
    echo "Using current directory as workspace root: $WORKSPACE_ROOT" >&2
fi

# Ensure WORKSPACE_ROOT is not root or empty
if [ "$WORKSPACE_ROOT" = "/" ] || [ -z "$WORKSPACE_ROOT" ]; then
    echo "ERROR: Could not determine valid workspace directory. Exiting." >&2
    exit 1
fi

# Run the MCP server with the determined workspace root
echo "Running GTM MCP server with workspace root: $WORKSPACE_ROOT" >&2
/opt/homebrew/opt/node@20/bin/node /Users/abhilashchadhar/uncloud/cursor/task-master/gemini-task-manager/bin/gtm-mcp-server.js --workspaceRoot "$WORKSPACE_ROOT" 