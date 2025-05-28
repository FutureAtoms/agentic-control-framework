# Enhanced MCP Tools Documentation

This document provides detailed information about the enhanced MCP tools integrated from Desktop Commander MCP and Playwright MCP.

## Desktop Commander MCP Tools

### Configuration Management

#### get_config
Get the complete server configuration as JSON.
```javascript
// Returns configuration including blockedCommands, defaultShell, allowedDirectories, etc.
get_config()
```

#### set_config_value
Set a specific configuration value by key.
```javascript
set_config_value({
  key: "defaultShell",
  value: "/bin/zsh"
})
```

### Terminal & Process Management

#### execute_command
Execute a terminal command with optional timeout and shell selection.
```javascript
execute_command({
  command: "npm install",
  shell: "/bin/bash",     // optional
  timeout_ms: 30000       // optional, default 30s
})
```

#### read_output
Read new output from a running terminal session.
```javascript
read_output({
  pid: 12345  // Process ID from execute_command
})
```

#### force_terminate
Force terminate a running terminal session.
```javascript
force_terminate({
  pid: 12345
})
```

#### list_sessions
List all active terminal sessions.
```javascript
list_sessions()
```

#### list_processes
List all running processes with CPU and memory usage.
```javascript
list_processes()
```

#### kill_process
Terminate a running process by PID.
```javascript
kill_process({
  pid: 12345
})
```

### Enhanced Search

#### search_code
Search for text/code patterns within file contents using ripgrep.
```javascript
search_code({
  path: "./src",
  pattern: "TODO",
  ignoreCase: true,        // optional, default true
  filePattern: "*.js",     // optional
  contextLines: 2,         // optional
  includeHidden: false,    // optional
  maxResults: 100,         // optional, default 100
  timeoutMs: 30000        // optional
})
```

### File Editing

#### edit_block
Apply surgical text replacements to files.
```javascript
edit_block({
  file_path: "./src/app.js",
  old_string: "console.log('old')",
  new_string: "console.log('new')",
  expected_replacements: 1  // optional, default 1
})
```

### Enhanced File Reading

#### read_file (enhanced)
Read files from both local filesystem and URLs.
```javascript
// Read local file
read_file({
  path: "./config.json"
})

// Read from URL
read_file({
  path: "https://api.example.com/data.json",
  isUrl: true,            // optional, auto-detected
  timeout: 30000          // optional, for URLs
})
```

## Playwright MCP Browser Tools

### Browser Navigation

#### browser_navigate
Navigate to a URL.
```javascript
browser_navigate({
  url: "https://example.com"
})
```

#### browser_navigate_back
Go back to the previous page.
```javascript
browser_navigate_back()
```

#### browser_navigate_forward
Go forward to the next page.
```javascript
browser_navigate_forward()
```

### Browser Interaction

#### browser_click
Click on a web page element.
```javascript
browser_click({
  element: "Login button",
  ref: "#login-btn"
})
```

#### browser_type
Type text into an editable element.
```javascript
browser_type({
  element: "Email input",
  ref: "#email",
  text: "user@example.com",
  submit: true,           // optional, press Enter after
  slowly: false           // optional, type character by character
})
```

#### browser_hover
Hover over an element.
```javascript
browser_hover({
  element: "Menu item",
  ref: "#menu-item"
})
```

#### browser_drag
Perform drag and drop between elements.
```javascript
browser_drag({
  startElement: "Draggable item",
  startRef: "#item1",
  endElement: "Drop zone",
  endRef: "#dropzone"
})
```

#### browser_select_option
Select option(s) in a dropdown.
```javascript
browser_select_option({
  element: "Country dropdown",
  ref: "#country",
  values: ["US", "CA"]
})
```

#### browser_press_key
Press a keyboard key.
```javascript
browser_press_key({
  key: "ArrowDown"
})
```

### Browser Capture

#### browser_take_screenshot
Take a screenshot of the page or element.
```javascript
browser_take_screenshot({
  element: "Header",      // optional
  ref: "#header",         // optional, for element screenshot
  filename: "shot.png",   // optional
  raw: true              // optional, PNG instead of JPEG
})
```

#### browser_snapshot
Capture accessibility snapshot of the current page.
```javascript
browser_snapshot()
```

#### browser_pdf_save
Save the current page as PDF.
```javascript
browser_pdf_save({
  filename: "page.pdf"    // optional
})
```

### Tab Management

#### browser_tab_list
List all browser tabs.
```javascript
browser_tab_list()
```

#### browser_tab_new
Open a new tab.
```javascript
browser_tab_new({
  url: "https://example.com"  // optional
})
```

#### browser_tab_select
Select a tab by index.
```javascript
browser_tab_select({
  index: 1
})
```

#### browser_tab_close
Close a tab.
```javascript
browser_tab_close({
  index: 1               // optional, closes current if not provided
})
```

### Browser Utilities

#### browser_console_messages
Get all console messages from the page.
```javascript
browser_console_messages()
```

#### browser_file_upload
Upload files to file input elements.
```javascript
browser_file_upload({
  paths: ["/path/to/file1.jpg", "/path/to/file2.pdf"]
})
```

#### browser_wait
Wait for a specified time.
```javascript
browser_wait({
  time: 5  // seconds, max 10
})
```

#### browser_wait_for
Wait for text to appear/disappear or time.
```javascript
browser_wait_for({
  text: "Loading complete",      // wait for text to appear
  textGone: "Loading...",        // wait for text to disappear
  time: 10                       // wait for seconds
})
```

#### browser_resize
Resize browser window.
```javascript
browser_resize({
  width: 1280,
  height: 720
})
```

#### browser_handle_dialog
Handle browser dialogs (alert, confirm, prompt).
```javascript
browser_handle_dialog({
  accept: true,
  promptText: "My answer"  // optional, for prompts
})
```

#### browser_close
Close the current page.
```javascript
browser_close()
```

#### browser_install
Install the configured browser (if not installed).
```javascript
browser_install()
```

#### browser_network_requests
Get all network requests made by the page.
```javascript
browser_network_requests()
```

## Configuration

### Environment Variables

```bash
# Terminal Configuration
DEFAULT_SHELL=/bin/bash
COMMAND_TIMEOUT=30000
BLOCKED_COMMANDS=rm -rf /,sudo rm -rf,format c:

# Browser Configuration
BROWSER_TYPE=chromium
BROWSER_HEADLESS=false
BROWSER_TIMEOUT=30000
BROWSER_USER_DATA_DIR=/path/to/profile

# Search Configuration
MAX_SEARCH_RESULTS=100
SEARCH_TIMEOUT=30000
```

### Config File (config.json)

```json
{
  "defaultShell": "/bin/bash",
  "blockedCommands": [
    "rm -rf /",
    "sudo rm -rf",
    "format c:"
  ],
  "allowedDirectories": ["."],
  "fileReadLineLimit": 1000,
  "fileWriteLineLimit": 50,
  "telemetryEnabled": false,
  "commandTimeout": 30000,
  "browser": {
    "type": "chromium",
    "headless": false,
    "timeout": 30000,
    "userDataDir": null
  },
  "search": {
    "maxResults": 100,
    "timeout": 30000,
    "includeHidden": false,
    "ignoreCase": true
  }
}
```

## Security Features

### Terminal Security
- Blocked commands list prevents dangerous operations
- Command timeout prevents hanging processes
- Process isolation with PID tracking

### Browser Security
- Sandboxed browser execution
- Dialog handling prevents blocking
- Network request monitoring

### File System Security
- Path validation and allowed directories
- URL reading with timeout protection
- Fuzzy matching for safe text replacement

## Usage Examples

### Example 1: Running Tests with Output Monitoring
```javascript
// Start test execution
const { pid } = await execute_command({
  command: "npm test",
  timeout_ms: 60000
});

// Monitor output
const interval = setInterval(async () => {
  const { output, status } = await read_output({ pid });
  console.log(output);
  
  if (status !== 'running') {
    clearInterval(interval);
  }
}, 1000);
```

### Example 2: Web Scraping with Playwright
```javascript
// Navigate to page
await browser_navigate({ url: "https://example.com" });

// Wait for content
await browser_wait_for({ text: "Welcome" });

// Take screenshot
await browser_take_screenshot({ filename: "homepage.png" });

// Extract data
const snapshot = await browser_snapshot();
```

### Example 3: Code Refactoring with Search and Replace
```javascript
// Search for pattern
const results = await search_code({
  path: "./src",
  pattern: "oldFunction\\(",
  filePattern: "*.js"
});

// Replace in each file
for (const match of results.matches) {
  await edit_block({
    file_path: match.path,
    old_string: "oldFunction(",
    new_string: "newFunction("
  });
}
```

## Troubleshooting

### Terminal Tools
- If `execute_command` fails, check blocked commands list
- For hanging processes, use `force_terminate`
- Install ripgrep for `search_code` functionality

### Browser Tools
- Run `browser_install()` if browser not found
- Use headless mode for CI/CD environments
- Check console messages for page errors

### File Operations
- Verify allowed directories configuration
- Check file permissions for write operations
- Use appropriate timeouts for URL reading
