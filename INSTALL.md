# Installation Guide for ACF MCP Server

Since the package is not yet published to npm, you have several options to install and use it with Claude Code:

## Option 1: Local Installation (Recommended for now)

```bash
# 1. Make sure you're in the ACF directory
cd /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework

# 2. Install dependencies
npm install

# 3. Add to Claude Code using the local path
claude mcp add /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework
```

## Option 2: npm link (For development)

```bash
# 1. In the ACF directory, create a global link
cd /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework
npm link

# 2. Add to Claude Code
claude mcp add agentic-control-framework
```

## Option 3: Direct Configuration

Add this to your Claude Code configuration file (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "node",
      "args": [
        "/Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp"
      ],
      "env": {
        "WORKSPACE_ROOT": "${cwd}",
        "ACF_PATH": "/Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework"
      }
    }
  }
}
```

## Verify Installation

After adding to Claude Code:

1. Restart Claude Code
2. Open a new conversation
3. You should see ACF tools available
4. Try: "List the available ACF tools"

## Troubleshooting

If the server doesn't connect:

1. Check that Node.js v18+ is installed:
   ```bash
   node --version
   ```

2. Verify the server works standalone:
   ```bash
   node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp
   ```
   Then type: `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}`
   
   You should see a response with server info.

3. Check Claude Code logs for errors

## Next Steps

Once the package is published to npm, you'll be able to install it globally:
```bash
npm install -g agentic-control-framework
claude mcp add agentic-control-framework
```

For now, use one of the local installation methods above.