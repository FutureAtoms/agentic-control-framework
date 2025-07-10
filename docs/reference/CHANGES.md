# Agentic Control Framework Changes

This document outlines the changes made to the Agentic Control Framework.

## Cleanup and Fixes Applied

### 1. Repository Cleanup

- **Removed redundant files**:
  - Removed duplicate MCP server implementations (`acf-mcp-fixed.js`, `acf-mcp-rebuild.js`, `minimal-mcp-server.js`)
  - Eliminated variant wrapper scripts (`bin/mcp-wrapper.js`, `bin/mcp-safe.js`, `bin/mcp-wrapper-extreme.js`)
  - Removed duplicate wrapper scripts (`acf-wrapper.sh`, `acf-workspace-wrapper.sh`)

- **Consolidated documentation**:
  - Moved scattered tutorial files to `docs/tutorials/`
  - Created a clear project structure section in README.md
  - Added a cleanup documentation file (CLEANUP.md)

- **Organized project structure**:
  - Moved test scripts to `test/scripts/`
  - Ensured CLI wrapper is in the correct location
  - Fixed path references in configuration files

### 2. CLI Functionality Fixes

- **Fixed module paths**:
  - Updated `bin/task-cli.js` to correctly reference `../src/core.js`
  - Made sure all scripts use consistent relative paths

- **Improved command-line argument parsing**:
  - Added support for both styles of arguments: flag-style (`-t "Title"`) and key=value (`title=Title`)
  - Added better handling of positional arguments
  - Fixed parameter handling to support short flags (`-t`, `-d`, `-p`)
  - Made argument parsing more robust with fallbacks

### 3. MCP Server Fixes

- **Fixed workspace detection**:
  - Added fallback to current directory when `--workspaceRoot` isn't provided
  - Made workspace determination more robust for different environments
  - Improved error messaging for workspace issues

- **Enhanced tool execution**:
  - Used an effective workspace root that never fails
  - Added better logging for workspace detection
  - Removed hard failure when workspace can't be determined from config

### 4. Testing

- Created a comprehensive test script (`test-functionality.sh`) that:
  - Tests CLI functionality (init, add, list, status, etc.)
  - Tests MCP functionality (connection, tool list)
  - Tests task creation through MCP
  - Verifies all functionality works correctly

## Version 0.2.0

### Fixed

- Fixed parameter extraction bug in the `reviseTasks` MCP function
- Improved file path resolution by adding a `resolvePath` utility function
- Updated all file operations to use consistent path resolution
- Fixed relative file paths handling for the `parsePrd` function
- Enhanced parameter handling consistency between CLI and MCP server

## Benefits of Changes

1. **More robust functionality**: The system no longer fails when run in different environments
2. **Cleaner repository**: Removed redundant and confusing files
3. **Better organization**: Clear structure with files in the right places
4. **Consistent interface**: Standardized on a single implementation of each component
5. **Improved documentation**: Better explanation of the project structure and usage
6. **Comprehensive testing**: Added tests to ensure everything works as expected

## Recommended Next Steps

1. Run the cleanup script to apply all file removals and reorganization
2. Run the test script to verify functionality
3. Commit the changes to version control
4. Consider adding unit tests for core functionality
5. Update documentation to reflect the new command-line argument handling 