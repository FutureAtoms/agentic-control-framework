# Gemini Task Manager MCP

A task management system for Cursor AI that uses the Model Control Protocol (MCP) to interact with the Gemini API. This tool helps organize and track tasks for software development projects directly within the Cursor editor.

## Overview

This repo contains:

- Task management system with subtasks, priorities, and dependencies
- Gemini API integration for analyzing PRDs and expanding tasks
- MCP integration for Cursor AI
- Workspace-aware task tracking

## Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/gemini-task-manager.git
cd gemini-task-manager
```

2. Install dependencies:
```bash
cd gemini-task-manager
npm install
```

3. Configure the `.env` file with your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

4. Configure Cursor MCP integration:
   - Open Cursor settings → MCP
   - Add a new MCP Server with:
   ```json
   {
     "name": "gemini-task-manager",
     "command": "/path/to/your/gtm-wrapper.sh",
     "args": [],
     "env": {
       "GEMINI_API_KEY": "your_api_key_here",
       "DEBUG": "true"
     }
   }
   ```

## Features

- **Task Management**: Create, update, list, and remove tasks
- **Subtasks**: Break down complex tasks into manageable pieces
- **Priority System**: Set high/medium/low priority for tasks
- **Dependency Tracking**: Tasks can depend on other tasks
- **Gemini Integration**: Parse PRDs and expand tasks using AI
- **Workspace Awareness**: Manage tasks per project workspace

## Troubleshooting

### Workspace Root Issues

If you encounter path-related errors like:
```
Error: Invalid workspace root (received "/"). Cannot write to the root directory. 
```

The script is having trouble identifying your project workspace. Solutions:

1. Edit `gtm-wrapper.sh` to set a hardcoded path to your project
2. Run the CLI tool directly in your project directory: `cd your_project && task-manager init`
3. Set the environment variable: `export GTM_WORKSPACE_ROOT=/path/to/your/project`

## Recent Updates (v0.1.1)

- Fixed workspace root detection to avoid root directory issues
- Added safeguards to prevent writing to system directories
- Improved MCP integration with workspace-aware scripts
- Added comprehensive error messaging

## License

MIT License 