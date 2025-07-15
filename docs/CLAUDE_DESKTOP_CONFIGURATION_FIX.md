# 🔧 Claude Desktop Configuration Fix

**Author: Abhilash Chadhar (FutureAtoms)**

## 🚨 Problem Summary

All Claude Desktop JSON configurations in the documentation were failing except for one specific pattern. This document explains the issue and provides the definitive solution.

## ❌ What Was Failing

### Broken Pattern (Used Throughout Documentation)
```json
{
  "mcpServers": {
    "acf-local": {
      "command": "node",
      "args": [
        "/path/to/agentic-control-framework/bin/agentic-control-framework-mcp",
        "--workspaceRoot",
        "/path/to/your/project"
      ],
      "env": {
        "WORKSPACE_ROOT": "/path/to/your/project",
        "ALLOWED_DIRS": "/path/to/your/project:/tmp"
      }
    }
  }
}
```

### Why It Failed
1. **Incorrect Command Structure**: Using `"command": "node"` with separate `args` array
2. **Missing Critical Environment Variables**: Not setting `ACF_PATH`
3. **Path Resolution Issues**: Relative paths and missing absolute path requirements
4. **Transport Confusion**: Mixing STDIO and SSE transport patterns

## ✅ Working Solution

### The ONLY Pattern That Works Reliably
```json
{
  "mcpServers": {
    "agentic-control-framework": {
      "command": "/FULL/PATH/TO/agentic-control-framework/bin/agentic-control-framework-mcp",
      "env": {
        "ACF_PATH": "/FULL/PATH/TO/agentic-control-framework",
        "WORKSPACE_ROOT": "/FULL/PATH/TO/YOUR/WORKSPACE",
        "ALLOWED_DIRS": "/FULL/PATH/TO/YOUR/WORKSPACE:/tmp",
        "READONLY_MODE": "false",
        "BROWSER_HEADLESS": "false",
        "DEFAULT_SHELL": "/bin/bash"
      }
    }
  }
}
```

### Why This Works
1. **Direct Executable Call**: Uses the full path to the executable directly
2. **Proper Environment Variables**: Sets all required env vars including `ACF_PATH`
3. **STDIO Transport**: Uses direct communication, not SSE
4. **Absolute Paths**: No relative path resolution issues
5. **Executable Permissions**: The script has proper shebang and permissions

## 🔧 Critical Requirements

### 1. Use Full Absolute Paths
- ❌ `~/path/to/acf` (tilde expansion fails)
- ❌ `./bin/script` (relative paths fail)
- ✅ `/Users/username/path/to/agentic-control-framework/bin/agentic-control-framework-mcp`

### 2. Set Required Environment Variables
- `ACF_PATH`: Full path to ACF installation directory
- `WORKSPACE_ROOT`: Full path to your project workspace
- `ALLOWED_DIRS`: Colon-separated list of allowed directories

### 3. Ensure Executable Permissions
```bash
chmod +x /path/to/agentic-control-framework/bin/agentic-control-framework-mcp
```

### 4. Use Direct Command (Not node + args)
- ❌ `"command": "node", "args": [...]`
- ✅ `"command": "/full/path/to/executable"`

## 📁 Files Updated

All documentation has been updated to use the working pattern:

1. **Setup Instructions**: `docs/setup/SETUP-INSTRUCTIONS.md`
2. **MCP Integration Guide**: `docs/MCP_INTEGRATION_GUIDE.md`
3. **README.md**: Main documentation
4. **Quick Reference**: `docs/reference/QUICK-REFERENCE.md`
5. **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md`
6. **Client Configurations**: All files in `config/client-configurations/`
7. **Example Configurations**: All files in `config/examples/`

## 🎯 Key Takeaways

1. **Direct Executable Method is MANDATORY** for Claude Desktop
2. **Environment Variables are CRITICAL** - especially `ACF_PATH`
3. **Absolute Paths ONLY** - no relative paths or tilde expansion
4. **STDIO Transport** works better than SSE for local development
5. **The `node` + `args` pattern FAILS** in Claude Desktop

## 🔍 Root Cause Analysis

The issue was that Claude Desktop's MCP implementation:
- Doesn't properly handle the `node` + `args` pattern
- Requires direct executable calls with proper shebang
- Needs explicit environment variable setup
- Has stricter path resolution requirements than other MCP clients

This working configuration leverages the wrapper script's built-in environment variable handling and path resolution logic, making it more robust and reliable.
