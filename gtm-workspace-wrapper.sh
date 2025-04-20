#!/bin/bash
CURRENT_WORKSPACE=$(pwd)
/opt/homebrew/opt/node@20/bin/node /Users/abhilashchadhar/uncloud/cursor/task-master/gemini-task-manager/bin/gtm-mcp-server.js --workspaceRoot "$CURRENT_WORKSPACE"