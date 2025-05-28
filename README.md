# Agentic Control Framework

A powerful CLI and MCP-based task management system for agentic workflows.

![Agentic Control Framework](agentic-control-framework.png)

## Overview

The Agentic Control Framework (ACF) is a comprehensive autonomous agent system designed to bring structure and organization to your development projects. It offers:

- **CLI-based task management:** Create, update, and track tasks using simple commands
- **MCP integration:** Seamlessly connect with Cursor IDE for enhanced productivity
- **AI-powered features:** Break down tasks into subtasks, adapt to changing requirements
- **Progress tracking:** Monitor task status, dependencies, and completion
- **Customizable workflows:** Adapt to your specific project needs
- **Comprehensive tool suite:** 64+ tools for filesystem, terminal, browser automation, and more
- **Manus-like capabilities:** All-in-one autonomous agent eliminating need for multiple MCP servers

![Demo of Agentic Control Framework](demo.gif)

Check out our comprehensive [tutorial](docs/tutorial.md) to get started!

## 🎯 Why Choose ACF?

**ACF is designed to be a comprehensive "Manus-like" autonomous agent** - a single MCP server that provides all the tools you need for development workflows, eliminating the need for multiple separate MCP servers.

### ✅ What ACF Provides
- **Task Management**: 15 tools for project planning and execution
- **Browser Automation**: 22 tools for complete web interaction (replaces Playwright MCP)
- **File Operations**: 13 tools for comprehensive file management
- **Code Execution**: 8 tools for terminal and process management
- **AI Enhancement**: 3 tools for intelligent task processing
- **System Integration**: AppleScript for macOS automation
- **Code Manipulation**: Advanced search and edit capabilities

**Total: 64 tools** - More comprehensive than most agent systems!

## Project Structure

The Agentic Control Framework has a clean and organized project structure. Here's what each file and directory does:

```
agentic-control-framework/
├── 📁 bin/                           # Executable scripts and entry points
│   ├── 🔧 task-manager               # Main CLI entry point for task management
│   ├── 🔧 task-manager-mcp           # Legacy MCP server wrapper (deprecated)
│   ├── 🔧 agentic-control-framework-mcp # Primary MCP server for Cursor/Claude integration
│   └── 🔧 task-cli.js                # Alternative CLI interface with enhanced features
│
├── 📁 src/                           # Core source code
│   ├── 🧠 core.js                    # Core task management logic and data structures
│   ├── 🖥️  cli.js                    # CLI command definitions and argument parsing
│   ├── 🌐 mcp_server.js              # MCP server with 64+ tools (main server file)
│   ├── 📁 filesystem_tools.js        # Filesystem operations for MCP integration
│   ├── 📊 tableRenderer.js           # Task table rendering and formatting utilities
│   ├── 🤖 prd_parser.js              # AI-powered PRD parsing and task generation
│   └── 📝 logger.js                  # Standardized logging across all components
│
├── 📁 test/                          # Testing infrastructure
│   ├── 🧪 comprehensive_mcp_test.js  # Consolidated test suite for all MCP tools
│   ├── 🔒 test_env_guardrails.js     # Security and environment validation tests
│   ├── 📁 test_filesystem.js         # Filesystem operations testing
│   └── 📁 scripts/                   # Additional test utilities and helpers
│
├── 📁 docs/                          # Documentation and guides
│   ├── 📖 tutorial.md                # Step-by-step getting started guide
│   ├── 🔧 MCP_INTEGRATION_GUIDE.md   # Detailed MCP setup and configuration
│   └── 📚 enhanced-mcp-tools.md      # Complete tool reference documentation
│
├── 📁 tasks/                         # Generated task files and project data
│   ├── 📋 Individual task Markdown files (auto-generated)
│   └── 📊 Task status and progress tracking files
│
├── 📁 templates/                     # Project templates and scaffolding
│   ├── 📄 PRD templates for different project types
│   ├── 🏗️  Project initialization templates
│   └── 📋 Task structure templates
│
├── 📁 scripts/                       # Automation and utility scripts
│   ├── 🔄 sync-upstream.sh           # Sync with upstream MCP repositories
│   ├── 📊 compare-upstream-tools.js  # Compare tool versions with upstream
│   └── 🛠️  Various maintenance and setup scripts
│
├── 📁 .github/                       # GitHub Actions and repository configuration
│   ├── 🔄 workflows/                 # CI/CD pipelines and automation
│   └── 📋 Issue and PR templates
│
├── 📁 .tasks/                        # Internal task management data
│   └── 💾 Task storage and metadata (auto-managed)
│
├── 📁 .tmp/                          # Temporary files and cache
│   └── 🗂️  Temporary workspace data and cache files
│
├── 📁 MCP documents/                 # MCP protocol documentation and examples
│   ├── 📖 Protocol specifications
│   └── 💡 Integration examples and best practices
│
├── 📄 Core Configuration Files
├── 📦 package.json                   # Node.js dependencies and project metadata
├── 🔒 package-lock.json              # Locked dependency versions for reproducibility
├── ⚙️  config.json                   # ACF configuration and settings
├── 🔧 settings.json                  # User preferences and customizations
├── 🔗 mcp-connection.json            # MCP connection configuration
├── 🚫 .gitignore                     # Git ignore patterns
├── 🛠️  setup.sh                      # Automated setup and installation script
│
├── 📄 Documentation Files
├── 📖 README.md                      # This comprehensive guide
├── 📝 CHANGES.md                     # Version history and changelog
├── 📊 CONSOLIDATED_TEST_REPORTS.md   # Latest test results and status
├── 🚀 MANUS_LIKE_ENHANCEMENT_PLAN.md # Roadmap for Manus-like capabilities
│
├── 📄 Project Data Files
├── 📋 tasks.json                     # Main task database and state
├── 📊 tasks-table.md                 # Human-readable task status table
│
└── 📄 Media and Assets
    ├── 🖼️  agentic-control-framework.png # Project logo and branding
    └── 🎬 demo.gif                   # Demonstration video/animation
```

### 🔍 Key File Descriptions

#### Core Engine Files
- **`src/mcp_server.js`** (1,496 lines): The heart of ACF - contains all 64 MCP tools including task management, filesystem operations, terminal control, browser automation, and AppleScript integration
- **`src/core.js`** (1,189 lines): Core task management engine with data structures, task lifecycle management, and business logic
- **`src/cli.js`** (514 lines): Command-line interface with argument parsing, command routing, and user interaction

#### Specialized Components
- **`src/filesystem_tools.js`** (740 lines): Secure filesystem operations with path validation, URL support, and permission management
- **`src/tableRenderer.js`** (461 lines): Advanced table rendering for task visualization with formatting, sorting, and export capabilities
- **`src/prd_parser.js`** (306 lines): AI-powered PRD parsing using Gemini API for automatic task generation

#### Testing Infrastructure
- **`test/comprehensive_mcp_test.js`** (357 lines): Consolidated test suite covering all 64 MCP tools with protocol compliance testing
- **`test/test_env_guardrails.js`** (346 lines): Security validation and environment safety checks

#### Entry Points
- **`bin/agentic-control-framework-mcp`** (133 lines): Primary MCP server launcher for IDE integration
- **`bin/task-cli.js`** (335 lines): Enhanced CLI with additional features and improved UX

## Features

### 🎯 Core Capabilities

#### Task Management (15 tools)
- Create and manage tasks with priorities, descriptions, and dependencies
- Break down complex tasks into manageable subtasks
- Track task status (todo, inprogress, done, blocked, error)
- Generate Markdown documentation for tasks
- Parse PRD (Product Requirements Document) files to auto-generate tasks
- Use AI to expand tasks into detailed subtasks
- Revise task plans when requirements change

#### MCP Integration (64+ tools)
- **Comprehensive tool suite** eliminating need for multiple MCP servers
- **Task Management**: Full project lifecycle management
- **Filesystem Operations**: Secure file access with URL support
- **Terminal Control**: Command execution and process management
- **Browser Automation**: Complete web interaction capabilities
- **Code Operations**: Advanced search and surgical editing
- **System Integration**: AppleScript for macOS automation

#### Browser Automation (22 tools)
- Full browser automation with Playwright integration
- Navigate web pages and interact with elements
- Take screenshots and generate PDFs
- Manage browser tabs and windows
- Upload files to web forms
- Monitor network requests and console messages
- Handle browser dialogs and alerts

#### Terminal & Process Management (8 tools)
- Execute terminal commands with configurable timeout
- Monitor command output in real-time
- Manage running processes and sessions
- Kill processes by PID
- List active terminal sessions

#### Advanced Search & Edit (2 tools)
- Search code patterns using ripgrep integration
- Perform surgical text replacements with fuzzy matching
- Context-aware code search with line numbers
- Multi-file search and replace operations

#### Configuration & Security
- Configurable shell environments
- Blocked commands for safety
- Path validation and sandboxing
- Read-only mode support
- Customizable timeouts and limits

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- Git (for upstream synchronization)

#### Optional but Recommended
- ripgrep (for advanced code search) - [Installation guide](https://github.com/BurntSushi/ripgrep#installation)
- Chrome/Chromium (for browser automation) - Automatically installed by Playwright if needed

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/FutureAtoms/agentic-control-framework.git
   cd agentic-control-framework
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the automatic setup script (recommended):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This script will:
   - Make all required scripts executable
   - Configure paths correctly for your system
   - Set up environment variables
   - Create necessary configuration files
   - Provide instructions for Cursor IDE integration

4. Alternatively, manually make scripts executable:
   ```bash
   chmod +x bin/task-manager bin/agentic-control-framework-mcp
   ```

5. Create a `.env` file with your API key (optional, but required for AI features):
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

## MCP Integration Setup

The Agentic Control Framework provides a powerful MCP (Model Context Protocol) server with 64+ integrated tools for task management, filesystem operations, terminal control, browser automation, and more.

### Complete Tool Inventory

<details>
<summary><strong>📋 Core ACF Tools (15 tools)</strong></summary>

- `setWorkspace` - Set the workspace directory
- `initProject` - Initialize a new project
- `addTask` - Add a new task
- `addSubtask` - Add a subtask to a parent task
- `listTasks` - List all tasks with filters
- `updateStatus` - Update task/subtask status
- `getNextTask` - Get the next actionable task
- `updateTask` - Update task details
- `removeTask` - Remove a task or subtask
- `getContext` - Get detailed task context
- `generateTaskFiles` - Generate Markdown files for tasks
- `parsePrd` - Parse PRD files using AI
- `expandTask` - Expand tasks into subtasks using AI
- `reviseTasks` - Revise tasks based on prompts
- `generateTaskTable` - Generate human-readable task tables
</details>

<details>
<summary><strong>📁 Filesystem Tools (13 tools)</strong></summary>

- `read_file` - Read files with URL support
- `read_multiple_files` - Read multiple files at once
- `write_file` - Write content to files
- `copy_file` - Copy files and directories
- `move_file` - Move or rename files
- `delete_file` - Delete files or directories
- `list_directory` - List directory contents
- `create_directory` - Create directories
- `tree` - Get directory tree structure
- `search_files` - Search for files by name
- `get_file_info` - Get file metadata
- `list_allowed_directories` - List allowed directories
- `get_filesystem_status` - Get filesystem status
</details>

<details>
<summary><strong>💻 Terminal & Process Tools (8 tools)</strong></summary>

- `get_config` - Get server configuration
- `set_config_value` - Update configuration
- `execute_command` - Execute terminal commands
- `read_output` - Read command output
- `force_terminate` - Terminate running commands
- `list_sessions` - List active terminal sessions
- `list_processes` - List system processes
- `kill_process` - Kill a process by PID
</details>

<details>
<summary><strong>🔍 Search & Edit Tools (2 tools)</strong></summary>

- `search_code` - Search code using ripgrep
- `edit_block` - Surgical text replacements
</details>

<details>
<summary><strong>🌐 Browser Automation Tools (22 tools)</strong></summary>

- Navigation: `browser_navigate`, `browser_navigate_back`, `browser_navigate_forward`
- Interaction: `browser_click`, `browser_type`, `browser_hover`, `browser_drag`, `browser_select_option`, `browser_press_key`
- Capture: `browser_take_screenshot`, `browser_snapshot`, `browser_pdf_save`
- Information: `browser_console_messages`, `browser_network_requests`
- Tab Management: `browser_tab_list`, `browser_tab_new`, `browser_tab_select`, `browser_tab_close`
- Utilities: `browser_wait`, `browser_wait_for`, `browser_resize`, `browser_handle_dialog`, `browser_file_upload`
- Control: `browser_close`, `browser_install`
</details>

<details>
<summary><strong>🍎 AppleScript Tools (1 tool) - macOS only</strong></summary>

- `applescript_execute` - Run AppleScript for macOS automation (Notes, Calendar, Contacts, Messages, Mail, Finder, Safari, etc.)
</details>

### Integration with Claude Desktop

1. **Install Claude Desktop** from [claude.ai](https://claude.ai/download)

2. **Configure MCP Connection**:
   - Open Claude Desktop settings
   - Navigate to Developer → Model Context Protocol
   - Click "Add MCP Server" and add:

   ```json
   {
     "agentic-control-framework": {
       "command": "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
       "env": {
         "ACF_PATH": "/path/to/agentic-control-framework",
         "WORKSPACE_ROOT": "/path/to/your/project",
         "ALLOWED_DIRS": "/home/user/projects:/tmp/shared",
         "BROWSER_HEADLESS": "false"
       }
     }
   }
   ```

3. **Restart Claude Desktop** to activate the connection

4. **Verify Integration**: In Claude, you should see "Agentic Control Framework" in the MCP connections. Try:
   ```
   Can you list my tasks using the Agentic Control Framework?
   ```

### Integration with Cursor IDE

1. **Automatic Setup** (Recommended):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   Follow the on-screen instructions for Cursor integration.

2. **Manual Setup**:
   
   a. Make scripts executable:
   ```bash
   chmod +x bin/agentic-control-framework-mcp
   ```

   b. Configure Cursor:
   - Open Cursor Settings (Cmd/Ctrl + ,)
   - Search for "MCP" or navigate to Extensions → MCP
   - Add new connection:
     ```json
     {
       "name": "Agentic Control Framework",
       "command": "/absolute/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
       "args": [],
       "env": {
         "WORKSPACE_ROOT": "${workspaceFolder}",
         "BROWSER_TYPE": "chromium",
         "DEFAULT_SHELL": "/bin/bash"
       }
     }
     ```

3. **Usage in Cursor**: Once connected, ACF tools are available through Cursor's AI assistant. Try:
   - "Initialize a new project with ACF"
   - "Parse this PRD file and create tasks"
   - "Show me the current task status"

### Environment Variables Reference

Configure the MCP server behavior with these environment variables:

```bash
# Core Settings
ACF_PATH=/path/to/agentic-control-framework    # ACF installation path
WORKSPACE_ROOT=/path/to/project                 # Default workspace
ALLOWED_DIRS="/path1:/path2"                    # Colon-separated allowed directories
READONLY_MODE=false                             # Enable/disable write operations

# Terminal Settings
DEFAULT_SHELL=/bin/bash                         # Shell for commands
COMMAND_TIMEOUT=30000                           # Command timeout (ms)
BLOCKED_COMMANDS="rm -rf /,sudo rm -rf"         # Blocked commands

# Browser Settings
BROWSER_TYPE=chromium                           # chromium|firefox|webkit
BROWSER_HEADLESS=false                          # Headless mode
BROWSER_TIMEOUT=30000                           # Browser timeout (ms)

# Search Settings
MAX_SEARCH_RESULTS=100                          # Max search results
SEARCH_TIMEOUT=30000                            # Search timeout (ms)

# AI Features
GEMINI_API_KEY=your_api_key                     # For AI task expansion
```

## CLI Usage

### Basic Commands

```bash
# Initialize a new project
./bin/task-manager init -n "My Project" -d "Project description"

# Parse a PRD file to generate tasks
./bin/task-manager parse-prd docs/requirements.md

# List all tasks
./bin/task-manager list

# Add a new task
./bin/task-manager add -t "Implement user authentication" -p high

# Update task status
./bin/task-manager status 1 inprogress

# Get next actionable task
./bin/task-manager next

# Generate task documentation
./bin/task-manager generate-files
```

### Advanced Workflows

```bash
# Complete PRD-driven workflow
./bin/task-manager init -n "E-commerce Platform"
./bin/task-manager parse-prd docs/ecommerce-requirements.md
./bin/task-manager expand-task 1  # Expand first task using AI
./bin/task-manager generate-table  # Generate readable task table

# Task management workflow
./bin/task-manager next  # Get next task
./bin/task-manager status 1.1 inprogress -m "Starting implementation"
./bin/task-manager status 1.1 done -m "Completed successfully"
```

## Testing

### Run Comprehensive Tests

```bash
# Run the consolidated test suite
node test/comprehensive_mcp_test.js

# Run with Playwright browser tests (requires Playwright)
PLAYWRIGHT_INSTALLED=true node test/comprehensive_mcp_test.js

# Run specific test categories
node test/test_filesystem.js
node test/test_env_guardrails.js
```

### Test Results

The latest test results show:
- ✅ **64 tools available and functional**
- ✅ **MCP protocol compliance verified**
- ✅ **All core functionality tested**
- ✅ **Security guardrails validated**

See `CONSOLIDATED_TEST_REPORTS.md` for detailed test results.

## Security Considerations

The Agentic Control Framework includes several security features:

1. **Path Validation**: All filesystem operations validate paths to prevent directory traversal attacks
2. **Workspace Isolation**: By default, filesystem operations are restricted to the workspace directory
3. **Allowed Directories**: Additional directories can be explicitly allowed using the `ALLOWED_DIRS` environment variable
4. **Read-Only Mode**: Enable `READONLY_MODE=true` to prevent any write operations
5. **Command Blocking**: Dangerous commands are blocked by default
6. **Timeout Protection**: All operations have configurable timeouts

## Best Practices

- Start with a well-defined PRD (Product Requirements Document) that outlines all project requirements
- Follow the recommended workflow order: 1) Create PRD, 2) Initialize project, 3) Parse PRD, 4) Use other commands
- Always run `task-manager init` in a new project directory before using other commands
- Use meaningful task titles and descriptions
- Set appropriate dependencies between tasks
- Update task status regularly to keep your project dashboard accurate
- Use the `next` command to maintain focus on the most important tasks
- Leverage AI expansion for complex tasks
- Use task revision when project requirements change instead of manually updating each task

## Troubleshooting

**Connection Issues:**
- Ensure the ACF bin path is absolute, not relative
- Check that scripts are executable: `chmod +x bin/*-mcp`
- Verify environment variables are set correctly
- Check logs: `tail -f ~/.acf/logs/mcp-server.log`

**Tool Errors:**
- Browser tools require Playwright: `npx playwright install`
- Search tools need ripgrep: `brew install ripgrep` (macOS) or `apt install ripgrep` (Linux)
- AppleScript tools only work on macOS

**Permission Issues:**
- Use `ALLOWED_DIRS` to grant access to directories outside workspace
- Set `READONLY_MODE=true` for read-only access
- Check file permissions for the ACF installation

## License

ISC

## Author

Abhilash Chadhar

---

**🚀 Ready to get started?** Run `./setup.sh` to automatically configure ACF for your system, or follow the manual installation steps above.

## Complete MCP Tool Reference

The Agentic Control Framework provides 64+ tools through MCP integration:

### Task Management Tools
Core ACF functionality for managing projects and tasks with AI assistance.

### Filesystem Operations
Secure file operations with path validation, URL support, and configurable permissions.

### Terminal & Process Control
Execute commands, manage processes, and monitor system resources.

### Code Search & Editing
Advanced code search with ripgrep and precise text editing capabilities.

### Browser Automation
Full browser control with Playwright for web scraping, testing, and automation.

### macOS Automation
AppleScript integration for controlling Mac applications and system features.

> **Note**: For detailed tool documentation and examples, see the [MCP Integration Guide](docs/MCP_INTEGRATION_GUIDE.md).

## Environment Variables

The Agentic Control Framework supports the following environment variables to control its behavior:

### Core Configuration
- `ACF_PATH` or `WORKSPACE_ROOT`: Sets the workspace root directory. Command-line arguments take precedence.
- `ALLOWED_DIRS`: Colon-separated list of additional directories that the filesystem tools are allowed to access. Example: `/path/to/dir1:/path/to/dir2`.
- `READONLY_MODE`: When set to `true`, disables all write operations in the filesystem tools.
- `GEMINI_API_KEY`: API key for AI-powered features (task expansion, PRD parsing).

### Terminal Configuration
- `DEFAULT_SHELL`: Shell to use for command execution (default: `/bin/bash`)
- `COMMAND_TIMEOUT`: Default timeout for commands in milliseconds (default: `30000`)
- `BLOCKED_COMMANDS`: Comma-separated list of blocked commands (default: `rm -rf /,sudo rm -rf,format c:`)

### Browser Configuration
- `BROWSER_TYPE`: Browser to use - `chromium`, `firefox`, or `webkit` (default: `chromium`)
- `BROWSER_HEADLESS`: Run browser in headless mode - `true` or `false` (default: `false`)
- `BROWSER_TIMEOUT`: Browser operation timeout in milliseconds (default: `30000`)
- `BROWSER_USER_DATA_DIR`: Path to browser user data directory for persistent sessions

### Search Configuration
- `MAX_SEARCH_RESULTS`: Maximum number of search results (default: `100`)
- `SEARCH_TIMEOUT`: Search operation timeout in milliseconds (default: `30000`)

### Telemetry
- `TELEMETRY_ENABLED`: Enable/disable telemetry - `true` or `false` (default: `false`)

Example usage:

```bash
# Allow access to additional directories
ALLOWED_DIRS="/home/user/documents:/tmp/shared" node src/mcp_server.js

# Enable read-only mode for security
READONLY_MODE=true node src/mcp_server.js

# Configure browser for headless operation
BROWSER_TYPE=chromium BROWSER_HEADLESS=true node src/mcp_server.js

# Set custom shell and timeout
DEFAULT_SHELL=/bin/zsh COMMAND_TIMEOUT=60000 node src/mcp_server.js
```

## Key Features of Enhanced MCP Integration

The Agentic Control Framework now includes powerful tools integrated from multiple MCP servers:

### 🚀 What's New

1. **Desktop Commander MCP Integration**
   - Terminal command execution with timeout control
   - Real-time process monitoring and management
   - Advanced code search using ripgrep
   - Surgical text editing with fuzzy matching

2. **Playwright MCP Integration**
   - Full browser automation (Chrome, Firefox, Safari)
   - Web scraping and screenshot capabilities
   - Multi-tab management
   - Network request monitoring

3. **AppleScript Integration** (macOS only)
   - Access Apple Notes, Calendar, Contacts
   - Control system applications
   - Automate macOS workflows

4. **Enhanced File Operations**
   - URL support in read_file tool
   - Batch file operations
   - Advanced search capabilities

### 🔧 Automatic Tool Synchronization

ACF automatically stays updated with the latest tools from upstream MCP repositories:

```bash
# Check for updates
node scripts/compare-upstream-tools.js

# Sync with upstream repositories
./scripts/sync-upstream.sh
```

Updates are checked daily via GitHub Actions, ensuring you always have access to the latest capabilities.

For detailed documentation on all enhanced tools, see [Enhanced MCP Tools Documentation](docs/enhanced-mcp-tools.md).

## Upstream Synchronization

ACF now includes automatic synchronization with upstream MCP repositories to stay updated with the latest tools and features.

### Automatic Update Checking

The framework automatically checks for updates from:
- Desktop Commander MCP
- Playwright MCP

Updates are checked daily via GitHub Actions, and notifications are sent when new versions are available.

### Manual Synchronization

To manually check for updates and sync tools:

```bash
# Run the sync script
./scripts/sync-upstream.sh

# Or check for updates manually
node scripts/compare-upstream-tools.js
```

### Notification Channels

Configure notifications for upstream updates through:
- GitHub Issues (default)
- Slack webhooks
- Discord webhooks
- Email notifications

See [Notification Setup Guide](docs/mcp-integration/notification-setup.md) for configuration details.

## Security Considerations

The Agentic Control Framework includes several security features:

1. **Path Validation**: All filesystem operations validate paths to prevent directory traversal attacks.
2. **Workspace Isolation**: By default, filesystem operations are restricted to the workspace directory.
3. **Allowed Directories**: Additional directories can be explicitly allowed using the `ALLOWED_DIRS` environment variable.
4. **Read-Only Mode**: Enable `READONLY_MODE=true` to prevent any write operations, allowing only read operations.
 