# Installation Guide for ACF MCP Server

Use these steps to run ACF locally and integrate with Claude Code.

## Local Setup

```bash
# 1) From repo root
cd agentic-control-framework

# 2) Install dependencies
npm install

# 3) Make executables runnable (first time)
chmod +x bin/*

# 4) Start the MCP server locally
npm run start:mcp
```

## Add to Claude Code

Using the Claude CLI:

```bash
# From agentic-control-framework/
claude mcp add acf-local \
  -e ACF_PATH="$(pwd)" \
  -e WORKSPACE_ROOT="${cwd}" \
  -- node bin/agentic-control-framework-mcp --workspaceRoot "${cwd}"
```

Alternatively, add a JSON entry to `~/.claude.json` pointing to `bin/agentic-control-framework-mcp` and set `ACF_PATH` and `WORKSPACE_ROOT` as above.

## Verify

1) Restart Claude Code. 2) Ask Claude to list ACF tools.

Standalone test:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node src/mcp/server.js
```

## Troubleshooting

- Node.js v18+ required: `node --version`
- Ensure `ALLOWED_DIRS` includes your workspace if you hit permission errors
- Use `DEBUG=true` to get verbose logs
