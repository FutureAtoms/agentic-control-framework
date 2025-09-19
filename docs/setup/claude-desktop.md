# Claude Desktop Setup Guide for ACF

This guide ensures ACF (Agentic Control Framework) works correctly with Claude Desktop on both macOS and Windows. Updated September 17, 2025, following the official MCP documentation.

## Prerequisites

1. **Claude Desktop**: Download from [claude.ai/download](https://claude.ai/download)
   - Ensure you have the latest version
   - Check for updates: Claude menu → "Check for Updates..."

2. **Node.js 18+**: Required for running the MCP server
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

## Configuration File Locations

### macOS
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```

## Installation Methods

### Method 1: NPX with Published Package (Recommended)

Now that ACF is published to npm, you can use it directly with npx:

#### Configuration for Both macOS and Windows

```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "npx",
      "args": [
        "-y",
        "agentic-control-framework",
        "/Users/YOUR_USERNAME/your-workspace"
      ]
    }
  }
}
```

**Windows users**: Replace the path with Windows format:
```json
"args": [
  "-y",
  "agentic-control-framework",
  "C:\\Users\\YOUR_USERNAME\\your-workspace"
]
```

The last argument is your workspace directory where ACF will operate.

### Method 2: Direct Binary (Local Installation)

If you have ACF installed locally:

#### macOS Configuration
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "/Users/YOUR_USERNAME/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
      "env": {
        "ACF_PATH": "/Users/YOUR_USERNAME/path/to/agentic-control-framework",
        "WORKSPACE_ROOT": "/Users/YOUR_USERNAME/your-workspace",
        "ALLOWED_DIRS": "/Users/YOUR_USERNAME/your-workspace:/Users/YOUR_USERNAME/Desktop:/Users/YOUR_USERNAME/Downloads:/tmp",
        "READONLY_MODE": "false",
        "BROWSER_HEADLESS": "false",
        "DEFAULT_SHELL": "/bin/bash"
      }
    }
  }
}
```

#### Windows Configuration
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "C:\\Users\\YOUR_USERNAME\\path\\to\\agentic-control-framework\\bin\\agentic-control-framework-mcp",
      "env": {
        "APPDATA": "C:\\Users\\YOUR_USERNAME\\AppData\\Roaming",
        "ACF_PATH": "C:\\Users\\YOUR_USERNAME\\path\\to\\agentic-control-framework",
        "WORKSPACE_ROOT": "C:\\Users\\YOUR_USERNAME\\your-workspace",
        "ALLOWED_DIRS": "C:\\Users\\YOUR_USERNAME\\your-workspace;C:\\Users\\YOUR_USERNAME\\Desktop;C:\\Users\\YOUR_USERNAME\\Downloads;C:\\Temp",
        "READONLY_MODE": "false",
        "BROWSER_HEADLESS": "false",
        "DEFAULT_SHELL": "cmd.exe"
      }
    }
  }
}
```

**Important for Windows**: Note the `APPDATA` environment variable - this helps prevent ENOENT errors.

### Method 3: Using Node.js

Run the server using Node.js directly:

#### macOS Configuration
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
        "--workspaceRoot",
        "/Users/YOUR_USERNAME/your-workspace"
      ],
      "env": {
        "NODE_ENV": "production",
        "ACF_PATH": "/Users/YOUR_USERNAME/path/to/agentic-control-framework",
        "WORKSPACE_ROOT": "/Users/YOUR_USERNAME/your-workspace",
        "ALLOWED_DIRS": "/Users/YOUR_USERNAME/your-workspace:/Users/YOUR_USERNAME/Desktop:/Users/YOUR_USERNAME/Downloads:/tmp",
        "READONLY_MODE": "false"
      }
    }
  }
}
```

#### Windows Configuration
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "node",
      "args": [
        "C:\\Users\\YOUR_USERNAME\\path\\to\\agentic-control-framework\\bin\\agentic-control-framework-mcp",
        "--workspaceRoot",
        "C:\\Users\\YOUR_USERNAME\\your-workspace"
      ],
      "env": {
        "APPDATA": "C:\\Users\\YOUR_USERNAME\\AppData\\Roaming",
        "NODE_ENV": "production",
        "ACF_PATH": "C:\\Users\\YOUR_USERNAME\\path\\to\\agentic-control-framework",
        "WORKSPACE_ROOT": "C:\\Users\\YOUR_USERNAME\\your-workspace",
        "ALLOWED_DIRS": "C:\\Users\\YOUR_USERNAME\\your-workspace;C:\\Users\\YOUR_USERNAME\\Desktop;C:\\Users\\YOUR_USERNAME\\Downloads;C:\\Temp",
        "READONLY_MODE": "false"
      }
    }
  }
}
```

## Step-by-Step Setup

**Important**: After making any configuration changes, you must completely quit and restart Claude Desktop for the changes to take effect.

### For macOS

1. **Open Claude Desktop Settings**
   - Click Claude menu in the top menu bar
   - Select "Settings..."

2. **Access Developer Settings**
   - Navigate to "Developer" tab in the left sidebar
   - Click "Edit Config" button

3. **Configure the Server**
   - The configuration file will open at: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Copy one of the configurations above
   - Replace `YOUR_USERNAME` with your actual username
   - Replace paths with your actual paths
   - Save the file

4. **Restart Claude Desktop**
   - Completely quit Claude Desktop (Cmd+Q)
   - Restart the application

5. **Verify Connection**
   - Look for the MCP server indicator (hammer icon) in the bottom-right corner of the conversation input box
   - Click it to see available ACF tools

### For Windows

1. **Open Claude Desktop Settings**
   - Click Claude menu
   - Select "Settings..."

2. **Access Developer Settings**
   - Navigate to "Developer" tab in the left sidebar
   - Click "Edit Config" button

3. **Configure the Server**
   - The configuration file will open at: `%APPDATA%\Claude\claude_desktop_config.json`
   - Copy one of the Windows configurations above
   - Replace `YOUR_USERNAME` with your actual Windows username
   - Use double backslashes `\\` in all paths
   - Save the file

4. **Restart Claude Desktop**
   - Completely quit Claude Desktop
   - Restart the application

5. **Verify Connection**
   - Look for the MCP server indicator (hammer icon) in the bottom-right corner
   - Click it to see available ACF tools

## Environment Variables Explained

- **ACF_PATH**: Path to the ACF installation directory
- **WORKSPACE_ROOT**: Default working directory for tasks and file operations
- **ALLOWED_DIRS**: Directories ACF can access (colon-separated on Mac `:`, semicolon on Windows `;`)
- **READONLY_MODE**: Set to "true" to prevent file modifications
- **BROWSER_HEADLESS**: Set to "true" for headless browser automation
- **DEFAULT_SHELL**: Shell to use for command execution
- **APPDATA** (Windows only): Helps prevent ENOENT errors

## Verification

After configuration and restart:

1. Look for the MCP server indicator in the bottom-right corner of the conversation input box
2. Click the icon to view available tools
3. You should see ACF tools like:
   - listTasks
   - addTask  
   - read_file
   - write_file
   - execute_command
   - browser_navigate
   - And 70+ more tools

## Troubleshooting

### Server not showing up / Hammer icon missing

1. **Restart Claude Desktop completely**
2. **Check JSON syntax** - Ensure proper quotes and commas
3. **Verify paths** - All paths must be absolute, not relative
4. **Check logs** (see below)
5. **Test manually** - Try running the server command directly:

   **macOS/Linux:**
   ```bash
   npx -y agentic-control-framework /Users/username/your-workspace
   ```

   **Windows:**
   ```powershell
   npx -y agentic-control-framework C:\Users\username\your-workspace
   ```

### Getting Logs from Claude Desktop

Claude Desktop MCP logs are located at:

**macOS:** `~/Library/Logs/Claude/`
**Windows:** `%APPDATA%\Claude\logs\`

- `mcp.log` - General MCP connection logging
- `mcp-server-agentic-control-framework.log` - ACF-specific errors

**View logs in real-time:**

macOS/Linux:
```bash
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

Windows (shows recent logs only):
```powershell
type "%APPDATA%\Claude\logs\mcp*.log"
```

### Common Issues and Solutions

#### 1. ENOENT error on Windows
Add the expanded APPDATA to your env:
```json
"env": {
  "APPDATA": "C:\\Users\\YOUR_USERNAME\\AppData\\Roaming",
  ...
}
```

#### 2. NPM not installed globally (Windows)
If `npx` fails, ensure npm is installed globally:
```bash
npm install -g npm
```

Check if `%APPDATA%\npm` exists on your system.

#### 3. Permission denied on macOS
Make binaries executable:
```bash
chmod +x /path/to/agentic-control-framework/bin/*
```

#### 4. Sharp module errors
Sharp is now optional. If you see sharp errors, the server will still work but screenshot features will be disabled.

#### 5. Path not found
Ensure all paths:
- Use forward slashes `/` on macOS or double backslashes `\\` on Windows in JSON
- Are absolute paths only (no `~` or relative paths)
- Actually exist on your system

#### 6. Tool calls failing silently
1. Check Claude's logs for errors
2. Verify your server builds and runs without errors
3. Try restarting Claude Desktop

## Testing the Connection

Once connected, test with these commands in Claude:

- "Initialize a new ACF project"
- "List all current tasks"
- "What files are in the current directory?"
- "Create a new file called test.txt with 'Hello World'"
- "Take a screenshot of google.com" (requires browser tools)

## Security Best Practices

1. **Limit directory access**: Only grant access to directories you need
2. **Use READONLY_MODE**: Set to "true" when you only need read access
3. **Review tools**: Disable tools you don't need in Claude Desktop settings
4. **Regular updates**: Keep ACF and Claude Desktop updated

## Platform-Specific Notes

### macOS
- Playwright (browser automation) works out of the box
- AppleScript tools available for system automation
- File watchers use FSEvents for efficiency

### Windows
- May need to install Visual C++ redistributables for some features
- PowerShell execution policy might need adjustment for scripts
- File watchers use Windows native APIs
- Remember to use double backslashes in JSON paths

## Next Steps

Now that you've connected ACF to Claude Desktop, you can:
- Create and manage tasks with the task management tools
- Access and modify files in your allowed directories
- Execute commands and scripts
- Automate browser interactions
- Search and edit code across your projects

## Support

- **Issues**: Report at [GitHub Issues](https://github.com/FutureAtoms/agentic-control-framework/issues)
- **Logs**: Check MCP logs for detailed error messages
- **NPM Package**: [npmjs.com/package/agentic-control-framework](https://npmjs.com/package/agentic-control-framework)
- **Documentation**: See repository README for full tool documentation
> Note: This guide is deprecated. See docs/INTEGRATIONS.md and the root claude.json for the current setup.
