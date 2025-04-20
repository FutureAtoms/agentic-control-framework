# Gemini Task Manager Tutorial

## Introduction

Gemini Task Manager is a powerful AI-driven task management system that helps you organize, track, and complete project tasks efficiently. It allows you to break down complex projects into manageable tasks, prioritize them, track dependencies, and collaborate effectively.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Basic Usage](#basic-usage)
4. [Managing Tasks](#managing-tasks)
5. [Advanced Features](#advanced-features)
6. [Integration with AI Assistants](#integration-with-ai-assistants)
7. [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js (v14 or higher)
- A project folder where you want to manage tasks

### Installation Steps

1. Clone or download the Gemini Task Manager repository:
   ```bash
   git clone https://github.com/your-username/gemini-task-manager.git
   # Or use your local copy if you already have it
   ```

2. Navigate to the gemini-task-manager directory:
   ```bash
   cd gemini-task-manager
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. (Optional) For global installation:
   ```bash
   npm install -g ./
   ```

## Configuration

### MCP Configuration (For Cursor Integration)

To integrate Gemini Task Manager with Cursor or other MCP-compatible editors, add the following configuration to your `.mcp.json` file:

```json
{
  "mcpServers": {
    "gemini-task-manager": {
      "command": "node /path/to/gemini-task-manager/bin/task-manager-mcp",
      "env": {
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE",
        "CURSOR_WORKSPACE_ROOT": "/path/to/your/project/directory"
      }
    }
  }
}
```

**Important Notes:**
- Replace `/path/to/gemini-task-manager` with the actual path to your Gemini Task Manager installation
- Replace `/path/to/your/project/directory` with the absolute path to your project directory
- The `CURSOR_WORKSPACE_ROOT` environment variable is crucial for proper operation

### Environment Variables

You can configure Gemini Task Manager using the following environment variables:

- `GEMINI_API_KEY`: (Optional) Your Gemini API key for AI-powered features
- `CURSOR_WORKSPACE_ROOT`: The absolute path to your project directory
- `VSCODE_WORKSPACE_FOLDER`: Alternative to CURSOR_WORKSPACE_ROOT
- `WORKSPACE_FOLDER`: Another alternative to CURSOR_WORKSPACE_ROOT

## Basic Usage

### Initializing a Project

To start using Gemini Task Manager in your project:

```bash
# If installed globally
task-manager init

# If using the MCP integration in Cursor
# Ask your AI assistant: "Please initialize a new task manager project named 'My Project'"
```

This command creates a `tasks.json` file in your project root and a Cursor rules file at `.cursor/rules/task_manager_workflow.mdc` for AI integration.

### Initializing with Project Details

You can provide a project name and description during initialization:

```bash
# Command line
task-manager init --projectName "My Awesome Project" --projectDescription "A project to build something amazing"

# MCP/Cursor
# Ask your AI assistant: "Initialize a task manager project called 'My Awesome Project' with the description 'A project to build something amazing'"
```

## Managing Tasks

### Adding Tasks

```bash
# Command line
task-manager add --title "Implement login feature" --description "Create user authentication system" --priority "high"

# MCP/Cursor
# Ask your AI assistant: "Add a high priority task to implement the login feature with user authentication"
```

### Listing Tasks

```bash
# Command line
task-manager list

# Filter by status
task-manager list --status "todo"

# MCP/Cursor
# Ask your AI assistant: "Show me all my tasks" or "List my todo tasks"
```

### Finding the Next Task

```bash
# Command line
task-manager next

# MCP/Cursor
# Ask your AI assistant: "What should I work on next?"
```

### Updating Task Status

```bash
# Command line
task-manager update-status --id 1 --newStatus "inprogress"
task-manager update-status --id 1 --newStatus "done"

# MCP/Cursor
# Ask your AI assistant: "Mark task 1 as in progress" or "Complete task 1"
```

### Adding Subtasks

```bash
# Command line
task-manager add-subtask --parentId 1 --title "Design login form"

# MCP/Cursor
# Ask your AI assistant: "Add a subtask to task 1 to design the login form"
```

### Updating Task Details

```bash
# Command line
task-manager update --id 1 --title "New title" --description "Updated description" --priority "medium"

# MCP/Cursor
# Ask your AI assistant: "Update task 1 with a new description and set priority to medium"
```

### Removing Tasks

```bash
# Command line
task-manager remove --id 1

# MCP/Cursor
# Ask your AI assistant: "Remove task 1"
```

## Advanced Features

### Task Dependencies

When adding or updating tasks, you can specify dependencies:

```bash
# Command line
task-manager add --title "Deploy to production" --dependsOn "1,2,3"

# MCP/Cursor
# Ask your AI assistant: "Add a new task for production deployment that depends on tasks 1, 2, and 3"
```

### Generating Task Markdown Files

You can generate individual Markdown files for each task:

```bash
# Command line
task-manager generate

# MCP/Cursor
# Ask your AI assistant: "Generate markdown files for all tasks"
```

This creates a `tasks/` directory with individual Markdown files for each task.

### AI-Powered Features (with GEMINI_API_KEY)

#### Parsing PRD Documents

```bash
# Command line
task-manager parse-prd --filePath "/path/to/prd.txt"

# MCP/Cursor
# Ask your AI assistant: "Parse the PRD file at docs/requirements.txt"
```

#### Expanding Tasks

```bash
# Command line
task-manager expand --taskId 1

# MCP/Cursor
# Ask your AI assistant: "Expand task 1 into subtasks"
```

#### Revising Tasks

```bash
# Command line
task-manager revise --fromTaskId 3 --prompt "The client wants a different login flow"

# MCP/Cursor
# Ask your AI assistant: "Revise tasks starting from task 3 to accommodate a different login flow"
```

## Integration with AI Assistants

### Cursor AI Integration

Gemini Task Manager works seamlessly with Cursor AI through the MCP protocol. The integration uses a rules file (`.cursor/rules/task_manager_workflow.mdc`) that guides the AI assistant's interactions with the task manager.

Common AI prompts:

1. "Initialize a task manager project for my web application"
2. "What's the next task I should work on?"
3. "Mark task 2 as complete and show me the next task"
4. "Parse the PRD document and create tasks from it"
5. "Expand task 3 into smaller subtasks"
6. "Help me implement task 5"

### Workflow Pattern

The most effective workflow pattern is:

1. **Initialize** your project with `initProject`
2. **Add tasks** with `addTask` (or parse from a PRD)
3. **Get the next task** with `getNextTask`
4. **Work on the task** with your AI assistant's help
5. **Update the status** to "done" with `updateStatus`
6. **Repeat** steps 3-5 until your project is complete

## Troubleshooting

### Common Issues

#### Workspace Root Issues

If you encounter errors like `EROFS: read-only file system, open '/tasks.json'` or `ENOENT: no such file or directory, open '/${workspaceFolder}/tasks.json'`:

1. The workspace root isn't being set correctly
2. Edit your `.mcp.json` file to include an explicit path:
   ```json
   "env": {
     "CURSOR_WORKSPACE_ROOT": "/absolute/path/to/your/project"
   }
   ```

#### Task Addition Errors

If you get errors like `Cannot read properties of undefined (reading 'title')`:

1. Ensure your `tasks.json` file is valid JSON if it already exists
2. Try initializing the project again with `initProject`
3. Check that the command parameters match the expected format

#### Connection Issues

If MCP tools aren't connecting:

1. Restart the MCP server
2. Check your `.mcp.json` configuration
3. Ensure you're using the correct absolute paths for commands

### Logs and Debugging

To see detailed logs:

1. Look for "MCP INFO" and "MCP ERROR" messages in the Cursor console
2. Check your project directory for any log files generated

## Conclusion

Gemini Task Manager provides a powerful way to manage your project tasks with the help of AI. By integrating with Cursor and other MCP-compatible editors, it creates a seamless workflow that keeps you focused on your work while maintaining an organized task list.

For additional help or to report issues, refer to the project documentation or contact the maintainers. 