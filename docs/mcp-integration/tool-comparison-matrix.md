# MCP Tools Comparison Matrix

## Current ACF Tools (27 tools)

### Task Management Tools
1. **setWorkspace** - Sets the workspace directory for the task manager
2. **initProject** - Initializes the task manager project
3. **addTask** - Adds a new task to the task list
4. **addSubtask** - Adds a subtask to a specified parent task
5. **listTasks** - Lists tasks, optionally filtered by status
6. **updateStatus** - Updates the status of a task or subtask
7. **getNextTask** - Gets the next actionable task
8. **updateTask** - Updates the details of a task or subtask
9. **removeTask** - Removes a task or subtask by its ID
10. **getContext** - Retrieves detailed context for a specific task
11. **generateTaskFiles** - Generates individual Markdown files for tasks
12. **parsePrd** - Parses a PRD file using the Gemini API
13. **expandTask** - Uses the Gemini API to break down a task
14. **reviseTasks** - Uses the Gemini API to revise future tasks
15. **generateTaskTable** - Generates a human-readable Markdown file

### Filesystem Tools
16. **read_file** - Read the complete contents of a file
17. **read_multiple_files** - Read contents of multiple files
18. **write_file** - Create or overwrite a file
19. **copy_file** - Copy files and directories
20. **move_file** - Move or rename files
21. **delete_file** - Delete a file or directory
22. **list_directory** - Get detailed listing of files
23. **create_directory** - Create a new directory
24. **tree** - Returns hierarchical JSON of directory structure
25. **search_files** - Search for files matching a pattern
26. **get_file_info** - Retrieve metadata about a file
27. **list_allowed_directories** - Returns allowed directories
28. **get_filesystem_status** - Returns filesystem operation status

## Missing Tools from DesktopCommanderMCP (11 tools)

### Configuration Management
1. **get_config** ❌ - Get complete server configuration as JSON
2. **set_config_value** ❌ - Set specific configuration values

### Terminal & Process Management
3. **execute_command** ❌ - Execute terminal commands with timeout
4. **read_output** ❌ - Read output from running terminal session
5. **force_terminate** ❌ - Force terminate a running session
6. **list_sessions** ❌ - List all active terminal sessions
7. **list_processes** ❌ - List all running processes
8. **kill_process** ❌ - Terminate a process by PID

### Enhanced Search & Edit
9. **search_code** ❌ - Search for text/code patterns using ripgrep
10. **edit_block** ❌ - Apply surgical text replacements

### Enhanced Features
11. **Enhanced read_file** ❌ - Support for reading from URLs with isUrl parameter

## Missing Tools from Playwright MCP (28 tools)

### Browser Interaction
1. **browser_click** ❌ - Click on web page elements
2. **browser_hover** ❌ - Hover over elements
3. **browser_drag** ❌ - Drag and drop between elements
4. **browser_type** ❌ - Type text into elements
5. **browser_select_option** ❌ - Select dropdown options
6. **browser_press_key** ❌ - Press keyboard keys

### Browser Navigation
7. **browser_navigate** ❌ - Navigate to URL
8. **browser_navigate_back** ❌ - Go back
9. **browser_navigate_forward** ❌ - Go forward

### Browser Capture
10. **browser_snapshot** ❌ - Capture accessibility snapshot
11. **browser_take_screenshot** ❌ - Take screenshots
12. **browser_screen_capture** ❌ - Take screenshot
13. **browser_pdf_save** ❌ - Save page as PDF

### Screen Interaction (Vision Mode)
14. **browser_screen_move_mouse** ❌ - Move mouse to position
15. **browser_screen_click** ❌ - Click at coordinates
16. **browser_screen_drag** ❌ - Drag at coordinates
17. **browser_screen_type** ❌ - Type text

### Tab Management
18. **browser_tab_list** ❌ - List browser tabs
19. **browser_tab_new** ❌ - Open new tab
20. **browser_tab_select** ❌ - Select tab by index
21. **browser_tab_close** ❌ - Close tab

### Browser Control
22. **browser_console_messages** ❌ - Get console messages
23. **browser_file_upload** ❌ - Upload files
24. **browser_wait** ❌ - Wait for specified time
25. **browser_resize** ❌ - Resize browser window
26. **browser_handle_dialog** ❌ - Handle browser dialogs
27. **browser_close** ❌ - Close the page
28. **browser_install** ❌ - Install browser

## Summary

- **Total tools in ACF**: 28
- **Missing from DesktopCommanderMCP**: 11 tools
- **Missing from Playwright MCP**: 28 tools
- **Total tools to add**: 39 tools

## Integration Priority

### High Priority (Core functionality)
1. Terminal execution tools (execute_command, process management)
2. Configuration management (get_config, set_config_value)
3. Enhanced search (search_code)
4. Edit functionality (edit_block)
5. Basic browser navigation and interaction

### Medium Priority (Extended functionality)
1. Browser screenshot and PDF tools
2. Tab management
3. Browser dialog handling
4. Enhanced file reading (URL support)

### Low Priority (Advanced features)
1. Vision mode screen interaction tools
2. Browser installation tool
