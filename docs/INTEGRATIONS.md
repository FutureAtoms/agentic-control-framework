## MCP Integrations

This guide shows how to connect the ACF MCP server to popular clients using the example configs in `config/examples/`.

Server binary: `bin/agentic-control-framework-mcp`
Server entry (code): `src/mcp/server.js`

Recommended: keep your workspace as the project root and pass it as `WORKSPACE_ROOT` or `--workspaceRoot`.

### Claude Desktop

Place a `claude.json` in your home directory with:

See: `claude.json`

Key fields
- `command`: `npx` or `node`
- `args`: include `./bin/agentic-control-framework-mcp` and `--workspaceRoot ${cwd}`
- `env`: set `WORKSPACE_ROOT` to `${cwd}`

### Claude Code (VS Code extension)

Use the example at `config/examples/claude_code.json`.

Key fields
- `mcpServers.agentic-control-framework.command = "node"`
- `args = ["./bin/agentic-control-framework-mcp", "--workspaceRoot", "${cwd}"]`
- `env.WORKSPACE_ROOT = "${cwd}"`

### Cursor

Project-level: add `.cursor/mcp.json` to your repo. Start with `config/examples/cursor.mcp.json`.

Key fields
- `type = "stdio"`
- `command = "node"`
- `args = ["./bin/agentic-control-framework-mcp", "--workspaceRoot", "${workspaceFolder}"]`
- `env.WORKSPACE_ROOT = "${workspaceFolder}"`

Global: copy the same JSON to `~/.cursor/mcp.json`.

### Codex CLI

Add an entry to `~/.codex/config.toml`. Use `config/examples/codex.config.toml` as a template.

Example
```
[mcp_servers.agentic-control-framework]
command = "node"
args = ["./bin/agentic-control-framework-mcp", "--workspaceRoot", "${cwd}"]
env = { "WORKSPACE_ROOT" = "${cwd}" }
```

### Quick verification

- Start the server manually to confirm it launches:
```
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```
- Connect from your client and issue a `tools/list` request (tools should be returned as a JSON array).

