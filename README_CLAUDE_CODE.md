# ACF MCP Server - Claude Code Setup Guide

## ✅ Current Status

The ACF MCP server has been successfully configured and added to Claude Code. The server is now ready for use with all 83+ tools available.

## Installation Instructions

### For Local Development (Current Setup)

The server has already been added to Claude Code with the following configuration:

```bash
# Already configured:
claude mcp add acf-local node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp
```

### To Use the Server

1. **Restart Claude Code** to ensure the MCP server is loaded
2. **Start a new conversation** 
3. **Verify the connection** by asking Claude to list available tools

### Available Commands in Claude Code

Once connected, you can use commands like:

- "Initialize a new project in this directory"
- "Add a task: [task description]"
- "List all current tasks"
- "Show the next actionable task"
- "Read the README file"
- "Search for files containing [pattern]"
- "Execute the command: npm test"
- "Take a screenshot of [website URL]"

## Configuration Details

The server is configured in your local Claude Code settings at:
- Config file: `~/.claude.json`
- Server name: `acf-local`
- Command: `node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp`

## Testing the Connection

To verify the MCP server is working:

```bash
# Test the server directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/src/mcp_server.js
```

You should see a JSON response with server information.

## Environment Variables

The server supports these environment variables:

- `WORKSPACE_ROOT` - Working directory (defaults to current directory)
- `ACF_PATH` - Path to ACF installation
- `READONLY_MODE` - Set to `true` to prevent write operations
- `DEBUG` - Set to `true` for verbose logging
- `ALLOWED_DIRS` - Colon-separated list of allowed directories

## Troubleshooting

### If Claude Code doesn't recognize the tools:

1. **Check the server is running:**
   ```bash
   ps aux | grep agentic-control-framework-mcp
   ```

2. **View Claude Code logs:**
   - Check the Claude Code console for any error messages

3. **Manually test the server:**
   ```bash
   node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp
   ```

4. **Reinstall if needed:**
   ```bash
   # Remove existing
   claude mcp remove acf-local
   
   # Re-add
   claude mcp add acf-local node /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/bin/agentic-control-framework-mcp
   ```

## NPM Publishing (Future)

Once published to npm, users will be able to install globally:

```bash
# Future installation method (after npm publish)
npm install -g agentic-control-framework
claude mcp add acf npx agentic-control-framework
```

## Publishing Steps (For Maintainer)

When ready to publish to npm:

1. **Update version:**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Login to npm:**
   ```bash
   npm login
   ```

3. **Publish:**
   ```bash
   npm publish
   ```

4. **Tag release:**
   ```bash
   git tag v0.1.2
   git push origin --tags
   ```

## Support

- GitHub: https://github.com/FutureAtoms/agentic-control-framework
- Issues: https://github.com/FutureAtoms/agentic-control-framework/issues

---

**Current Installation Path:** `/Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework`
**Server Status:** ✅ Configured and ready
**Tools Available:** 83+