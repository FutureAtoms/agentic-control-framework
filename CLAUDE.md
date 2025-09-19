# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Agentic Control Framework (ACF) is an MCP-compliant framework providing 80+ tools for autonomous agent development. It operates in three modes: CLI, Local MCP (IDE integration), and Cloud MCP (remote access).

## Common Development Commands

### Build & Development
```bash
# Install dependencies
npm install

# Run MCP server (for IDE integration)
npm run start:mcp
# Or directly:
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Run CLI mode
./bin/acf <command>

# Run with mcp-proxy for remote access
mcp-proxy --port 8080 node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

### Testing
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm test                    # MCP tests (mocha test/mcp/**/*.js)
npm run test:cli           # CLI tests (mocha test/cli/**/*.js)
npm run test:priority      # Priority system tests
npm run test:claude-code   # Claude Code integration tests

# Run test coverage
npm run coverage:cli       # CLI test coverage with nyc

# Run individual test files
mocha test/mcp/test-tools.js
node test/unit/test-priority-system.js
```

### Linting & Code Quality
Note: This project doesn't have explicit lint or typecheck scripts configured. When modifying code, ensure consistency with existing code style and patterns.

## High-Level Architecture

### Core Components

1. **MCP Server** (`src/mcp/server.js`)
   - Implements JSON-RPC 2.0 protocol
   - Handles tool registration and execution
   - Manages stdio/HTTP/SSE transports
   - Protocol versions: 2025-03-26 (default) and 2024-11-05

2. **Task Manager Core** (`src/core.js`)
   - Task CRUD operations with numerical priorities (1-1000)
   - Dependency management and validation
   - Subtask handling
   - Task file generation and synchronization

3. **Priority Engine** (`src/priority_engine.js`)
   - Numerical priority system (1-1000 replacing string priorities)
   - Dependency-based priority boosts
   - Critical path analysis
   - Distribution optimization algorithms
   - Priority templates system

4. **Tool Categories** (`src/tools/`)
   - `browser_tools.js`: 25 Playwright-based browser automation tools
   - `terminal_tools.js`: Command execution, process management
   - `search_tools.js`: Ripgrep-based code search
   - `edit_tools.js`: Surgical text replacements
   - `applescript_tools.js`: macOS system integration
   - `enhanced_filesystem_tools.js`: Extended file operations

5. **File Watcher** (`src/file_watcher.js`)
   - Automatic task.json synchronization
   - Task file generation triggers
   - Debounced change detection

### Data Flow

1. **CLI Mode**: Direct function calls → Core → tasks.json
2. **MCP Mode**: JSON-RPC → MCP Server → Tool handlers → Core → Response
3. **Cloud Mode**: HTTP/SSE → mcp-proxy → MCP Server → Tools → Response

### Key Design Patterns

- **Tool Registration**: Dynamic tool discovery and registration in MCP server
- **Error Handling**: Standardized JSON-RPC error codes (-32600 to -32000)
- **Security**: Filesystem guardrails via `allowedDirectories` and `readonlyMode`
- **Async Operations**: Promise-based tool execution with timeout handling
- **State Management**: File-based persistence (tasks.json) with atomic writes

## Project-Specific Conventions

### Tool Implementation Pattern
```javascript
// Tools follow this structure:
async function toolName(params) {
  // Validation
  if (!params.required) throw new Error('Missing required parameter');
  
  // Core logic
  const result = await performOperation();
  
  // Return standardized response
  return { success: true, data: result };
}
```

### Priority Ranges
- Critical (900-1000): Security fixes, blockers
- High (700-899): Important features, urgent tasks  
- Medium (400-699): Standard development work
- Low (1-399): Documentation, cleanup

### Testing Approach
- Unit tests use Mocha/Chai
- Integration tests verify MCP protocol compliance
- Each tool category has dedicated test files
- Mock workspaces created in temp directories for isolation

### Error Handling
- Use standard JSON-RPC error codes
- Always include descriptive error messages
- Log errors via `src/logger.js` for debugging
- Graceful degradation for optional features

## Environment Configuration

Key environment variables:
- `WORKSPACE_ROOT`: Project workspace directory
- `ALLOWED_DIRS`: Colon-separated list of accessible directories
- `READONLY_MODE`: Enable read-only filesystem mode
- `BROWSER_HEADLESS`: Control browser automation visibility
- `DEFAULT_SHELL`: Shell for terminal commands
- `ACF_PATH`: ACF installation directory

## Critical Files to Understand

1. **Entry Points**:
   - `bin/agentic-control-framework-mcp`: MCP server executable
   - `bin/acf`: CLI entry point
   - `src/cli.js`: CLI command definitions

2. **Core Logic**:
   - `src/core.js`: Task management operations
   - `src/mcp_server.js`: MCP protocol implementation
   - `src/priority_engine.js`: Priority algorithms

3. **Configuration**:
   - `config/examples/`: Configuration templates
   - `package.json`: Dependencies and scripts
   - `tasks.json`: Task persistence (generated)
