# Agentic Control Framework - Complete Project Structure Tutorial

## Overview

The Agentic Control Framework (ACF) is a comprehensive task management system with MCP (Model Control Protocol) integration, combining powerful CLI tools with browser automation, terminal control, and AI-powered features.

## Directory Structure

```
agentic-control-framework/
├── bin/                           # Executable scripts
├── src/                           # Source code
│   ├── tools/                     # Integrated MCP tools
│   └── ...                        # Core modules
├── docs/                          # Documentation
├── scripts/                       # Utility scripts
├── test/                          # Test files
├── templates/                     # Template files
├── tasks/                         # Generated task files
├── .github/                       # GitHub Actions workflows
├── .cursor/                       # Cursor IDE integration
├── node_modules/                  # Dependencies
├── package.json                   # Project configuration
├── config.json                    # Runtime configuration
├── .env                          # Environment variables
└── README.md                     # Main documentation
```

## Detailed Directory and File Explanations

### `/bin` - Executable Scripts

This directory contains the main entry points for the framework:

- **`task-manager`**: CLI tool for task management
  - Purpose: Command-line interface for creating, updating, and managing tasks
  - Usage: `./bin/task-manager [command] [options]`
  
- **`agentic-control-framework-mcp`**: MCP server wrapper (recommended)
  - Purpose: Launches the MCP server for Cursor IDE integration
  - Features: Maintains workspace state between sessions
  
- **`task-manager-mcp`**: Legacy MCP server wrapper
  - Purpose: Backward compatibility with older configurations

### `/src` - Source Code

Core functionality and business logic:

- **`cli.js`**: Command-line interface definitions
  - Defines all CLI commands using Commander.js
  - Handles argument parsing and validation
  
- **`core.js`**: Core task management logic
  - Task CRUD operations
  - Dependency management
  - Status tracking
  
- **`mcp_server.js`**: MCP server implementation
  - JSON-RPC protocol handler
  - Tool registration and execution
  - Integration point for all tools
  
- **`filesystem_tools.js`**: File system operations
  - Secure path validation
  - Read/write operations
  - Directory management
  
- **`logger.js`**: Centralized logging
  - Structured logging for debugging
  - Separates stdout (JSON-RPC) from stderr (logs)
  
- **`prd_parser.js`**: PRD parsing with AI
  - Integrates with Gemini API
  - Converts requirements to tasks
  
- **`tableRenderer.js`**: Task visualization
  - Generates human-readable tables
  - Progress tracking displays

### `/src/tools` - Integrated MCP Tools

Enhanced functionality from Desktop Commander and Playwright:

- **`terminal_tools.js`**: Terminal and process management
  ```javascript
  - executeCommand()     // Run shell commands
  - listProcesses()      // List system processes
  - killProcess()        // Terminate processes
  - getConfig()          // Get/set configuration
  ```

- **`browser_tools.js`**: Browser automation with Playwright
  ```javascript
  - browserNavigate()    // Navigate to URLs
  - browserClick()       // Click elements
  - browserType()        // Type text
  - browserScreenshot()  // Capture screenshots
  ```

- **`search_tools.js`**: Advanced code search
  ```javascript
  - searchCode()         // Search using ripgrep
  - Pattern matching with context
  - File filtering options
  ```

- **`edit_tools.js`**: Surgical text editing
  ```javascript
  - editBlock()          // Replace text with fuzzy matching
  - Multi-occurrence support
  - Diff generation
  ```

- **`enhanced_filesystem_tools.js`**: Enhanced file operations
  ```javascript
  - readFileEnhanced()   // Read files or URLs
  - Timeout support for network requests
  ```

### `/docs` - Documentation

Comprehensive guides and references:

- **`tutorial.md`**: Step-by-step getting started guide
- **`MCP_INTEGRATION_GUIDE.md`**: Complete MCP integration reference
- **`enhanced-mcp-tools.md`**: Detailed tool documentation
- **`mcp-integration/`**: Integration examples and guides

### `/scripts` - Utility Scripts

Automation and maintenance tools:

- **`sync-upstream.sh`**: Synchronize with upstream MCP repos
  - Clones/updates Desktop Commander and Playwright repos
  - Extracts tool implementations
  - Handles merge conflicts

- **`compare-upstream-tools.js`**: Tool comparison utility
  - Analyzes differences between ACF and upstream
  - Generates update reports
  - Identifies new/modified tools

### `/.github/workflows` - GitHub Actions

Continuous integration and automation:

- **`check-upstream-updates.yml`**: Daily update checker
  ```yaml
  - Runs daily at 2 AM UTC
  - Compares with upstream repositories
  - Creates issues for updates
  - Sends notifications
  ```

### `/templates` - Template Files

Reusable templates for task generation:

- Task templates for common patterns
- PRD templates for requirements
- Documentation templates

### `/tasks` - Generated Task Files

Output directory for task documentation:

- Individual Markdown files per task
- Auto-generated from task data
- Includes full context and history

### Configuration Files

- **`package.json`**: Project metadata and dependencies
  ```json
  {
    "dependencies": {
      "playwright": "^1.49.0",      // Browser automation
      "@vscode/ripgrep": "^1.15.9", // Code search
      "execa": "^5.1.1",            // Process execution
      "tree-kill": "^1.2.2",        // Process management
      // ... more dependencies
    }
  }
  ```

- **`config.json`**: Runtime configuration
  ```json
  {
    "defaultShell": "/bin/bash",
    "blockedCommands": ["rm -rf /"],
    "browser": {
      "type": "chromium",
      "headless": false
    }
  }
  ```

- **`.env`**: Environment variables
  ```bash
  GEMINI_API_KEY=your_key_here
  BROWSER_HEADLESS=false
  DEFAULT_SHELL=/bin/bash
  ```

- **`mcp-connection.json`**: Cursor IDE connection config
  ```json
  {
    "agentic-control-framework": {
      "command": "/path/to/bin/agentic-control-framework-mcp",
      "protocol": "MCP"
    }
  }
  ```

## How Components Work Together

### 1. Task Management Flow

```
User → CLI (cli.js) → Core Logic (core.js) → File System (tasks.json)
                                           ↓
                                    Task Renderer (tableRenderer.js)
```

### 2. MCP Server Communication

```
Cursor IDE ←→ MCP Server (mcp_server.js) ←→ Tools (src/tools/*.js)
                    ↓
              Core Functions (core.js)
```

### 3. Tool Integration Pipeline

```
Upstream Repos → sync-upstream.sh → Tool Extraction → Integration
       ↓
GitHub Actions → compare-upstream-tools.js → Notifications
```

## Continuous Integration Workflow

### Automatic Synchronization

1. **Daily Check** (GitHub Actions)
   ```yaml
   schedule:
     - cron: '0 2 * * *'  # 2 AM UTC daily
   ```

2. **Comparison Process**
   - Fetches latest tool lists from upstream
   - Compares with current ACF tools
   - Identifies additions/modifications

3. **Notification Flow**
   ```
   Changes Detected → GitHub Issue → Slack/Discord → Email
   ```

4. **Manual Integration**
   ```bash
   # Developer reviews changes
   ./scripts/sync-upstream.sh
   
   # Test integration
   npm test
   
   # Commit changes
   git add -A && git commit -m "feat: sync upstream tools"
   ```

## Best Practices for Development

### 1. Adding New Tools

```javascript
// 1. Create tool file in src/tools/
// src/tools/my_new_tool.js

function myNewFunction(params) {
  // Implementation
}

module.exports = {
  myNewFunction
};

// 2. Register in mcp_server.js
case 'my_new_tool':
  responseData = await myNewTool.myNewFunction(argsParam);
  break;

// 3. Add tool definition to tools/list
{
  name: 'my_new_tool',
  description: 'Description',
  inputSchema: { /* ... */ }
}
```

### 2. Testing Tools

```javascript
// Create test file
// test/tools/my_new_tool.test.js

const { myNewFunction } = require('../../src/tools/my_new_tool');

describe('My New Tool', () => {
  test('should work correctly', async () => {
    const result = await myNewFunction({ /* params */ });
    expect(result.success).toBe(true);
  });
});
```

### 3. Documentation

Always update:
- Tool documentation in `/docs`
- README.md with new features
- Environment variables in `.env.example`
- Config options in `config.json`

## Security Considerations

### 1. Path Validation

All file operations validate paths:
```javascript
// Prevents directory traversal
validatePath(requestedPath, allowedDirectories)
```

### 2. Command Blocking

Dangerous commands are blocked:
```javascript
blockedCommands: [
  "rm -rf /",
  "sudo rm -rf",
  "format c:"
]
```

### 3. Sandboxing

- Use `ALLOWED_DIRS` to restrict access
- Enable `READONLY_MODE` for safe operation
- Configure `BROWSER_HEADLESS` for automation

## Troubleshooting Guide

### Common Issues

1. **MCP Connection Failed**
   - Check command path in Cursor settings
   - Verify executable permissions: `chmod +x bin/*`
   - Review logs in stderr

2. **Tool Not Working**
   - Check dependencies: `npm install`
   - Verify environment variables
   - Enable debug logging: `DEBUG=true`

3. **Browser Automation Issues**
   - Install browsers: `npx playwright install`
   - Check `BROWSER_TYPE` setting
   - Verify display for non-headless mode

4. **Permission Errors**
   - Check `ALLOWED_DIRS` configuration
   - Verify file permissions
   - Run with appropriate user privileges

## Future Enhancements

1. **Plugin Architecture**
   - Dynamic tool loading
   - Third-party tool support
   - Tool marketplace

2. **Enhanced AI Integration**
   - Multiple AI provider support
   - Local LLM integration
   - Advanced task planning

3. **Collaboration Features**
   - Multi-user support
   - Real-time synchronization
   - Role-based access control

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-tool`
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

## Resources

- [MCP Specification](https://github.com/model-context-protocol)
- [Playwright Documentation](https://playwright.dev)
- [Commander.js Guide](https://github.com/tj/commander.js)
- [GitHub Actions](https://docs.github.com/actions)
