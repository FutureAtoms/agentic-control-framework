# ACF MCP Server - Claude Code Integration Guide

## Overview

The Agentic Control Framework (ACF) now includes a fully compliant MCP (Model Context Protocol) server that seamlessly integrates with Claude Code, providing 79+ powerful tools for autonomous agent development.

## Features

### Core Capabilities
- **Task Management**: Comprehensive task and subtask management with priority systems
- **File Operations**: Read, write, copy, move, delete files and directories
- **Code Tools**: Search code patterns, edit files surgically
- **Terminal Operations**: Execute commands, manage processes
- **Browser Automation**: Control web browsers via Playwright
- **AppleScript Support**: Mac-specific automation capabilities
- **AI Integration**: Parse PRDs, expand tasks, revise plans using Gemini API

### MCP Compliance
- ✅ Latest MCP SDK implementation
- ✅ JSON-RPC protocol support
- ✅ Stdio transport layer
- ✅ Proper error handling
- ✅ Comprehensive tool schemas
- ✅ Claude Code compatible configuration

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `@modelcontextprotocol/sdk` - Official MCP SDK
- `zod` - Schema validation
- All ACF tool dependencies

### 2. Setup for Claude Code

There are three ways to use ACF with Claude Code:

#### Option A: Global Installation (Recommended)
```bash
# Install globally
npm install -g agentic-control-framework

# Add to Claude Code
claude mcp add agentic-control-framework
```

#### Option B: Local Development
```bash
# Clone the repository
git clone https://github.com/FutureAtoms/agentic-control-framework
cd agentic-control-framework

# Install dependencies
npm install

# Add to Claude Code using local path
claude mcp add .
```

#### Option C: Manual Configuration
Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "node",
      "args": [
        "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
        "--workspaceRoot",
        "${cwd}"
      ],
      "env": {
        "WORKSPACE_ROOT": "${cwd}"
      }
    }
  }
}
```

## Configuration Files

### claude.json (Production)
Used for npm package installation:
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "npx",
      "args": ["-y", "agentic-control-framework"],
      "env": {
        "WORKSPACE_ROOT": "${cwd}"
      }
    }
  }
}
```

### claude.dev.json (Development)
Used for local development and testing:
```json
{
  "mcpServers": {
    "agentic-control-framework-local": {
      "command": "node",
      "args": ["./bin/agentic-control-framework-mcp", "--workspaceRoot", "${cwd}"],
      "env": {
        "WORKSPACE_ROOT": "${cwd}",
        "DEBUG": "true"
      }
    }
  }
}
```

## Available Tools

### Task Management (15 tools)
- `initProject` - Initialize a new task management project
- `addTask` - Add a new task with priority and dependencies
- `addSubtask` - Add subtasks to existing tasks
- `listTasks` - List all tasks with optional filtering
- `updateStatus` - Update task status (todo/inprogress/testing/done)
- `getNextTask` - Get the next actionable task based on priorities
- `updateTask` - Update task details
- `removeTask` - Remove tasks or subtasks
- `generateTaskFiles` - Generate individual Markdown files for tasks
- `expandTask` - Use AI to break down tasks into subtasks
- `parsePrd` - Parse PRD documents to generate tasks
- `reviseTasks` - Revise future tasks based on changes

### Priority Management (10 tools)
- `recalculatePriorities` - Recalculate priorities using advanced algorithms
- `getPriorityStatistics` - Get priority distribution statistics
- `getDependencyAnalysis` - Analyze task dependencies
- `configureTimeDecay` - Configure time-based priority decay
- `configureEffortWeighting` - Configure effort-weighted scoring
- `bumpTaskPriority` - Increase task priority
- `deferTaskPriority` - Decrease task priority
- `prioritizeTask` - Set task to high priority
- `deprioritizeTask` - Set task to low priority

### File System Operations (11 tools)
- `read_file` - Read file contents or fetch URLs
- `read_multiple_files` - Read multiple files in one operation
- `write_file` - Create or overwrite files
- `copy_file` - Copy files and directories
- `move_file` - Move or rename files
- `delete_file` - Delete files or directories
- `list_directory` - List directory contents
- `create_directory` - Create directories
- `tree` - Get directory structure as JSON
- `search_files` - Search for files by pattern
- `get_file_info` - Get file metadata

### Terminal Operations (3 tools)
- `execute_command` - Execute shell commands with timeout
- `list_processes` - List running processes
- `kill_process` - Terminate processes by PID

### Code Tools (2 tools)
- `search_code` - Search code patterns using ripgrep
- `edit_block` - Apply surgical text replacements

### Browser Automation (20+ tools)
- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_take_screenshot` - Capture screenshots
- `browser_close` - Close browser
- And many more browser control tools...

### Mac Automation (1 tool)
- `applescript_execute` - Run AppleScript code

## Environment Variables

```bash
# Workspace root directory (defaults to current directory)
WORKSPACE_ROOT=/path/to/workspace

# ACF installation path (auto-detected)
ACF_PATH=/path/to/acf

# Enable read-only mode (blocks write operations)
READONLY_MODE=true

# Allowed directories (colon-separated)
ALLOWED_DIRS=/path/one:/path/two

# Enable debug logging
DEBUG=true
```

## Testing

### Run MCP Server Tests
```bash
npm test -- test/mcp/mcp-server.test.js
```

### Run All Tests
```bash
npm test
```

### Test with Claude Code
1. Install the server: `claude mcp add .`
2. Open Claude Code
3. The ACF tools should appear in the tools list
4. Try commands like:
   - "Initialize a new project"
   - "Add a task: Implement user authentication"
   - "List all tasks"
   - "Read the README file"

## Architecture

### Server Structure
```
src/
├── mcp/
│   └── server.js          # Unified MCP server (JSON-RPC over stdio)
├── core.js                # Core task management functionality
├── filesystem_tools.js    # File system operations
└── tools/                 # Additional tool implementations
    ├── terminal_tools.js
    ├── search_tools.js
    ├── edit_tools.js
    ├── browser_tools.js
    └── applescript_tools.js
```

### Protocol Flow
1. Claude Code connects via stdio transport
2. Server initializes with capabilities
3. Tools are registered and schemas provided
4. Claude sends tool execution requests
5. Server processes and returns results
6. Full JSON-RPC compliance maintained

## Troubleshooting

### Common Issues

1. **SDK Import Errors**
   - Ensure Node.js v18+ is installed
   - Run `npm install` to get all dependencies
   - Check that `@modelcontextprotocol/sdk` is in node_modules

2. **Permission Errors**
   - Ensure the bin scripts are executable: `chmod +x bin/agentic-control-framework-mcp`
   - Check file system permissions for workspace directory

3. **Connection Issues**
   - Verify Claude Code is up to date
   - Check the server logs in stderr
   - Ensure correct paths in configuration

4. **Tool Execution Failures**
   - Check workspace root is set correctly
   - Verify required environment variables
   - Review error messages in Claude Code

### Debug Mode
Enable debug logging:
```bash
DEBUG=true claude code
```

Or in configuration:
```json
{
  "env": {
    "DEBUG": "true"
  }
}
```

## Development

### Adding New Tools

1. Define the tool in the tools list:
```javascript
{
  name: 'my_tool',
  description: 'Tool description',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string' }
    },
    required: ['param']
  }
}
```

2. Handle execution in tools/call:
```javascript
case 'my_tool':
  result = await myToolFunction(args.param);
  break;
```

3. Test the tool:
```javascript
const response = await sendRequest(server, {
  method: 'tools/call',
  params: {
    name: 'my_tool',
    arguments: { param: 'value' }
  }
});
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

ISC License - See LICENSE file for details

## Support

- GitHub Issues: https://github.com/FutureAtoms/agentic-control-framework/issues
- Documentation: https://github.com/FutureAtoms/agentic-control-framework/wiki

## Version History

### v2.0.0 (Current)
- Complete MCP SDK integration
- Full Claude Code compatibility
- 83+ tools available
- Comprehensive test suite
- Production-ready implementation

### v1.0.0
- Initial JSON-RPC implementation
- Basic tool support
- Manual protocol handling

---

## Quick Start Example

```javascript
// Initialize a project
await claude.tools.call('initProject', {
  projectName: 'My Awesome Project',
  projectDescription: 'Building something amazing'
});

// Add a task
await claude.tools.call('addTask', {
  title: 'Setup database',
  description: 'Configure PostgreSQL database',
  priority: 'high'
});

// List tasks
const tasks = await claude.tools.call('listTasks');
console.log(tasks);

// Read a file
const content = await claude.tools.call('read_file', {
  path: './README.md'
});

// Execute a command
const result = await claude.tools.call('execute_command', {
  command: 'npm test'
});
```

---

**Built with ❤️ by FutureAtoms**
