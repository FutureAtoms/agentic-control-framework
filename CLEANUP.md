# Gemini Task Manager Repository Cleanup

This document outlines the cleanup process for the Gemini Task Manager repository.

## Issues Identified

The repository contained several redundant and duplicated files:

1. **Multiple MCP server implementations**:
   - `src/mcp_server.js` (main implementation)
   - `gtm-mcp-fixed.js` (alternative implementation)
   - `gtm-mcp-rebuild.js` (rebuild utility)
   - `minimal-mcp-server.js` (test implementation)

2. **Multiple wrapper scripts and variations**:
   - `bin/gtm-wrapper.sh`
   - `bin/task-manager-mcp`
   - `bin/task-manager-mcp.js`
   - `bin/mcp-wrapper.js` (alternative wrapper)
   - `bin/mcp-safe.js` (safe variant)
   - `bin/mcp-wrapper-extreme.js` (extreme variant)
   - `gtm-wrapper.sh`
   - `gtm-workspace-wrapper.sh`

3. **Scattered documentation**:
   - `gemini-task-manager-tutorial.md`
   - `gmt_tutorial.md`
   - `docs/tutorial.md`

4. **Test files in root directory**:
   - `test-mcp-client.js`
   - `test-expand.js`
   - `test-revise.js`

## Cleanup Actions

The `cleanup.sh` script performs the following actions:

1. **Removes redundant MCP server implementations**, keeping only the official version in `src/mcp_server.js`
2. **Standardizes wrapper scripts**, keeping only the main Bash version in `bin/task-manager-mcp` and removing all variant implementations (safe, extreme, etc.)
3. **Consolidates documentation** into the `docs/tutorials` directory
4. **Organizes test scripts** into the `test/scripts` directory
5. **Moves CLI wrapper** to the `bin` directory
6. **Updates references** in package.json and other configuration files
7. **Auto-recovery mechanism** to recreate the main MCP wrapper if it's missing

## Running the Cleanup Script

To run the cleanup script:

```bash
# Make the script executable
chmod +x cleanup.sh

# Run the script
./cleanup.sh
```

## Post-Cleanup Steps

After running the cleanup script, you should:

1. **Review the changes** to ensure nothing important was removed
2. **Test the application** to verify functionality:
   ```bash
   # Test CLI functionality
   ./bin/task-manager --help
   
   # Test MCP server
   ./bin/task-manager-mcp
   ```
3. **Update any documentation** that referenced the old file structure
4. **Commit the changes** to version control

## New Project Structure

After cleanup, the project structure should look like this:

```
gemini-task-manager/
├── bin/                  # Executable scripts
│   ├── task-manager      # CLI entry point
│   ├── task-manager-mcp  # MCP server wrapper for Cursor IDE
│   └── task-cli.js       # CLI implementation
├── src/                  # Core source code
│   ├── cli.js            # CLI application logic
│   ├── core.js           # Core task management functionality
│   ├── mcp_server.js     # MCP server implementation
│   └── prd_parser.js     # AI-powered PRD parsing functionality
├── tasks/                # Generated task Markdown files
├── docs/                 # Documentation
│   └── tutorials/        # User tutorials
├── test/                 # Test files
│   └── scripts/          # Test scripts
└── templates/            # Template files for task generation
```

## Benefits of Cleanup

- **Reduced confusion** for new contributors
- **Simplified maintenance** with a clear structure
- **Improved organization** of project files
- **Cleaner repository** without redundant code
- **Better documentation** in a central location
- **Standardized interface** with a single, well-tested version of each component 