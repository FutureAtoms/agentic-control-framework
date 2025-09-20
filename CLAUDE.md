# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic Control Framework (ACF) is an AI-native orchestration layer with 80+ tools for context engineering. It provides task management, filesystem operations, browser automation, terminal orchestration, and persistent memory through both CLI and MCP (Model Context Protocol) server interfaces.

## Build and Development Commands

### Installation and Setup
```bash
npm install                    # Install dependencies
npx playwright install         # Install browsers for Playwright (if using browser tools)
chmod +x bin/*                # Make CLI executables
```

### Running the Application
```bash
./bin/acf                     # Run CLI directly
./bin/acf list                # List all tasks
./bin/acf next                # Get next actionable task
npm run start:mcp             # Start MCP server locally
```

### Testing Commands
```bash
npm test                      # Run default MCP tests (test/mcp/**/*.js)
npm run test:cli              # Run CLI tests (test/cli/**/*.js)
npm run test:claude-code-unit # Run Claude Code unit tests
npm run test:priority         # Run priority system tests
npm run test:all              # Run all test suites
npm run coverage:all          # Generate coverage reports
```

### Linting and Type Checking
No enforced linter or type checker is configured. Mirror existing code patterns when contributing.

## High-Level Architecture

### Core Components

1. **Task Management System** (`src/core.js`)
   - Central task graph with IDs, statuses, priorities (1-1000), dependencies
   - Persistent storage in `.acf/tasks.json`
   - Activity logging for every task state change
   - Priority engine with time decay and effort weighting

2. **CLI Interface** (`bin/acf` → `src/cli.js`)
   - Commander-based CLI for task operations
   - Rich context generation for tasks
   - Integration with Gemini API for PRD parsing and task expansion

3. **MCP Server** (`bin/agentic-control-framework-mcp` → `src/mcp/server.js`)
   - JSON-RPC over stdio protocol
   - 80+ tools exposed via MCP protocol
   - Compatible with Claude Desktop, Claude Code, Cursor, Codex

4. **Tool Modules** (`src/tools/`)
   - `browser_tools.js`: Playwright-based browser automation
   - `terminal_tools.js`: Command execution with session management
   - `edit_tools.js`: Surgical text replacements with `edit_block`
   - `search_tools.js`: Ripgrep-based code search
   - `applescript_tools.js`: macOS system integration
   - `enhanced_filesystem_tools.js`: Extended file operations

5. **Context Engineering**
   - File watcher for automatic synchronization (`src/file_watcher.js`)
   - Task context generation with related files and activity logs
   - Markdown generation for task documentation (`tasks/` directory)
   - Priority templates for common task patterns (`src/priority_templates.js`)

### Data Flow

1. **Task Creation**: CLI/MCP → `core.js` → `.acf/tasks.json`
2. **Context Retrieval**: Task ID → `getContext()` → Full task context with history
3. **File Operations**: Guard checks (`allowedDirectories`) → Operation → Result
4. **MCP Communication**: Client → stdio → `server.js` → Tool execution → Response

## Code Conventions

- **Language**: Node.js CommonJS (no ES modules)
- **Indentation**: 2 spaces
- **File naming**: snake_case (e.g., `mcp_server.js`, `browser_tools.js`)
- **Function naming**: lowerCamelCase internally
- **Tool IDs**: snake_case for MCP tool names
- **CLI flags**: kebab-case
- **Test files**: `*-test.js` (general), `*.test.js` (Claude Code specific)

## Key Configuration

### Environment Variables
- `WORKSPACE_ROOT`: Base directory for operations
- `ALLOWED_DIRS`: Comma-separated allowed directories
- `READONLY_MODE`: Enable read-only filesystem mode
- `ACF_PATH`: Path to ACF installation
- `GEMINI_API_KEY`: For PRD parsing and task expansion

### Configuration Files
- `.acf/tasks.json`: Task storage
- `.acf/config.json`: Runtime configuration
- `config/examples/`: Client integration examples
- `.env`: Environment variables (create from `.env.example`)

## Task Management Workflow

### Task Status Flow
`todo` → `inprogress` → `testing` → `done` (with `blocked` and `error` as alternatives)

### Priority System
- Range: 1-1000 (higher = more priority)
- Templates available for common patterns
- Automatic recalculation with dependency boosts
- Time decay and effort weighting options

### Activity Logging
Every task change appends to `activityLog[]` with timestamps. Use `--message` flag in CLI or `message` parameter in MCP to add context:
```bash
acf status 12 done --message "Tests passing, merging to main"
```

## Testing Approach

- **Unit tests**: Isolated function testing in `test/unit/`
- **Integration tests**: Multi-component testing in `test/integration/`
- **MCP tests**: Protocol compliance in `test/mcp/`
- **CLI tests**: Command validation in `test/cli/`
- Use Mocha + Chai for all test suites

## MCP Integration Points

The MCP server exposes tools in categories:
- Task management: `create_task`, `update_task`, `getContext`
- File operations: `read_file`, `write_file`, `edit_block`, `search_code`
- Terminal: `execute_command`, `list_processes`
- Browser: `browser_navigate`, `browser_click`, `browser_snapshot`
- System: `applescript_execute` (macOS only)

Clients connect via stdio with configuration in:
- Claude Desktop: `~/claude.json`
- Claude Code: Project `.vscode/settings.json`
- Cursor: `.cursor/mcp.json`
- Codex: `~/.codex/config.toml`