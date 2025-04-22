# Agentic Control Framework Tutorial

## 📋 Introduction

The Agentic Control Framework (ACF) is a powerful AI-driven task management system that helps you organize, track, and complete project tasks efficiently. It integrates with the Cursor IDE through the Model Control Protocol (MCP) and offers both a command-line interface and natural language interaction for managing your tasks.

This tutorial will guide you through setting up and using the Agentic Control Framework, from basic task management to advanced AI-powered features.

## 📑 Table of Contents

1. [Installation and Setup](#installation-and-setup)
2. [Basic Task Management](#basic-task-management)
3. [Working with Subtasks](#working-with-subtasks)
4. [Task Dependencies and Priority](#task-dependencies-and-priority)
5. [Tracking Task Status](#tracking-task-status)
6. [File Associations](#file-associations)
7. [Activity Logging](#activity-logging)
8. [Task Context](#task-context)
9. [AI-Powered Features](#ai-powered-features)
10. [MCP Integration with Cursor IDE](#mcp-integration-with-cursor-ide)
11. [Advanced Examples](#advanced-examples)
12. [Tips and Best Practices](#tips-and-best-practices)
13. [Troubleshooting](#troubleshooting)

## ⚙️ Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Cursor IDE (for MCP integration)
- (Optional) Google Gemini API key for AI-powered features

### Basic Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FutureAtoms/agentic-control-framework.git
   cd agentic-control-framework
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Gemini API key for AI features:
   ```bash
   # Add to your .bashrc, .zshrc, or equivalent shell config
   export GEMINI_API_KEY="your_api_key_here"
   ```

### MCP Server Setup (For Cursor IDE Integration)

To use the Agentic Control Framework with Cursor IDE, you need to set up the MCP server wrapper:

1. Make the wrapper scripts executable:
   ```bash
   chmod +x bin/task-manager-mcp
   chmod +x bin/task-manager-mcp
   ```

2. Add the wrapper to your PATH (choose one option):

   **Option 1**: Add to your shell config
   ```bash
   # Add this to your .bashrc, .zshrc, or equivalent shell config file
   export PATH="$PATH:/path/to/agentic-control-framework/bin"
   ```

   **Option 2**: Create a symlink in a directory already in your PATH
   ```bash
   # Example for macOS/Linux
   ln -s "$(pwd)/bin/task-manager-mcp" /usr/local/bin/task-manager-mcp
   ```

3. Configuring Cursor to use the MCP integration:

   a. Open Cursor IDE
   b. Go to Settings (⚙️) > Preferences
   c. Search for "MCP" in the settings search
   d. Under MCP Integrations, add a new integration:
      - Name: `Agentic Control Framework`
      - Command: The path to your `bin/task-manager-mcp` script
      - Protocol: `MCP`
   e. Save the settings

   Now you can access the Agentic Control Framework in Cursor by typing `/` followed by a task management command in the editor.

## 📝 Basic Task Management

### Initializing a Project

Before you can start creating tasks, you need to initialize a project:

**CLI Method:**
```bash
./bin/task-manager init --projectName "My Project" --projectDescription "Description of my project"
```

**Cursor IDE Method:**
Type in the editor:
```
/init project with name "My Project" and description "Description of my project"
```

This creates a `tasks.json` file in your project root that will store all your task data.

### Adding Tasks

**CLI Method:**
```bash
./bin/task-manager add -t "Implement login feature" -d "Create user authentication system with email and password" -p high
```

**Cursor IDE Method:**
```
/add task "Implement login feature" with description "Create user authentication system with email and password" and high priority
```

### Listing Tasks

**CLI Method:**
```bash
# List all tasks
./bin/task-manager list

# List tasks with specific status
./bin/task-manager list -s todo
```

**Cursor IDE Method:**
```
/list tasks
/list todo tasks
```

Example output:
```
┌─────┬─────────────────────────────┬────────────┬──────────┬────────────┬───────────────┐
│ ID  │ Title                       │ Status     │ Priority │ Depends On │ Subtasks      │
├─────┼─────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
│ 1   │ Implement login feature     │ todo       │ high     │ None       │ None          │
└─────┴─────────────────────────────┴────────────┴──────────┴────────────┴───────────────┘
```

### Getting the Next Task

The `next` command will suggest the next task to work on based on status, dependencies, and priority:

**CLI Method:**
```bash
./bin/task-manager next
```

**Cursor IDE Method:**
```
/get next task
```

### Removing Tasks

**CLI Method:**
```bash
./bin/task-manager remove 1
```

**Cursor IDE Method:**
```
/remove task 1
```

## 📋 Working with Subtasks

Subtasks help you break down complex tasks into smaller, manageable pieces.

### Adding Subtasks

**CLI Method:**
```bash
./bin/task-manager add-subtask 1 -t "Design login form"
```

**Cursor IDE Method:**
```
/add subtask "Design login form" to task 1
```

### Listing Subtasks

When you list tasks, subtasks will appear in the "Subtasks" column:

```
┌─────┬─────────────────────────────┬────────────┬──────────┬────────────┬───────────────┐
│ ID  │ Title                       │ Status     │ Priority │ Depends On │ Subtasks      │
├─────┼─────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
│ 1   │ Implement login feature     │ todo       │ high     │ None       │ 0/1 done      │
└─────┴─────────────────────────────┴────────────┴──────────┴────────────┴───────────────┘
```

To see the detailed subtasks, use the `get-context` command:

**CLI Method:**
```bash
./bin/task-manager get-context 1
```

**Cursor IDE Method:**
```
/get context for task 1
```

### Updating Subtask Status

**CLI Method:**
```bash
./bin/task-manager status 1.1 inprogress -m "Starting implementation"
./bin/task-manager status 1.1 done -m "Completed implementation"
```

**Cursor IDE Method:**
```
/update subtask 1.1 status to inprogress with message "Starting implementation"
/mark subtask 1.1 as done with message "Completed implementation"
```

## 🔄 Task Dependencies and Priority

### Setting Task Dependencies

Dependencies ensure tasks are completed in the proper order. A task will only be considered "actionable" if all its dependencies are marked as "done".

**CLI Method:**
```bash
./bin/task-manager add -t "Implement registration" -d "Create user registration flow" --depends-on "1"
```

**Cursor IDE Method:**
```
/add task "Implement registration" with description "Create user registration flow" and depends on task 1
```

### Setting Task Priority

Tasks can have one of three priority levels: `high`, `medium`, or `low`. The `next` command will prioritize tasks in this order.

**CLI Method:**
```bash
./bin/task-manager add -t "Fix security vulnerability" -p high
```

**Cursor IDE Method:**
```
/update task 2 priority to high
```

## 📊 Tracking Task Status

Tasks can have the following statuses:
- `todo`: Task is not yet started
- `inprogress`: Task is currently being worked on
- `done`: Task is completed
- `blocked`: Task is blocked by an external factor
- `error`: Task has encountered an error

### Updating Task Status

**CLI Method:**
```bash
./bin/task-manager status 1 inprogress -m "Starting work on login feature"
```

**Cursor IDE Method:**
```
/update task 1 status to inprogress with message "Starting work on login feature"
```

### Reporting Errors

**CLI Method:**
```bash
./bin/task-manager status 1 error -m "Login API endpoint returns 500 error"
```

**Cursor IDE Method:**
```
/mark task 1 as error with message "Login API endpoint returns 500 error"
```

### Marking Tasks as Blocked

**CLI Method:**
```bash
./bin/task-manager status 2 blocked -m "Blocked by pending API documentation"
```

**Cursor IDE Method:**
```
/mark task 2 as blocked with message "Blocked by pending API documentation"
```

## 📄 File Associations

You can associate specific files in your codebase with tasks to make it easier to navigate to relevant code.

### Adding Related Files

**CLI Method:**
```bash
./bin/task-manager add -t "Refactor authentication" --related-files "src/auth/login.js,src/auth/register.js"
```

**Cursor IDE Method:**
```
/add task "Refactor authentication" with related files "src/auth/login.js,src/auth/register.js"
```

### Updating Related Files

**CLI Method:**
```bash
./bin/task-manager update 3 --related-files "src/auth/login.js,src/auth/register.js,src/auth/reset-password.js"
```

**Cursor IDE Method:**
```
/update task 3 related files to "src/auth/login.js,src/auth/register.js,src/auth/reset-password.js"
```

## 📝 Activity Logging

Activity logs help you track the history of a task, including status changes and custom messages.

### Adding Log Messages

**CLI Method:**
```bash
./bin/task-manager update 1 -m "Discovered a potential security issue in the login form"
```

**Cursor IDE Method:**
```
/add log to task 1 "Discovered a potential security issue in the login form"
```

### Viewing Activity Logs

Activity logs are included when you view task context:

**CLI Method:**
```bash
./bin/task-manager get-context 1
```

**Cursor IDE Method:**
```
/get context for task 1
```

Example output:
```json
{
  "id": 1,
  "title": "Implement login feature",
  "description": "Create user authentication system with email and password",
  "status": "inprogress",
  "priority": "high",
  "dependsOn": [],
  "createdAt": "2023-06-01T10:00:00.000Z",
  "updatedAt": "2023-06-01T11:30:00.000Z",
  "subtasks": [
    {
      "id": "1.1",
      "title": "Design login form",
      "status": "done",
      "activityLog": [
        {
          "timestamp": "2023-06-01T10:15:00.000Z",
          "type": "log",
          "message": "Subtask created"
        },
        {
          "timestamp": "2023-06-01T10:30:00.000Z",
          "type": "status",
          "message": "Status changed from \"todo\" to \"inprogress\""
        },
        {
          "timestamp": "2023-06-01T11:00:00.000Z",
          "type": "status",
          "message": "Status changed from \"inprogress\" to \"done\""
        }
      ]
    }
  ],
  "relatedFiles": ["src/auth/login.js"],
  "activityLog": [
    {
      "timestamp": "2023-06-01T10:00:00.000Z",
      "type": "log",
      "message": "Task created with title: \"Implement login feature\""
    },
    {
      "timestamp": "2023-06-01T10:30:00.000Z",
      "type": "status",
      "message": "Status changed from \"todo\" to \"inprogress\""
    },
    {
      "timestamp": "2023-06-01T11:30:00.000Z",
      "type": "log",
      "message": "Discovered a potential security issue in the login form"
    }
  ]
}
```

## 🔍 Task Context

The `get-context` command provides detailed information about a task, including subtasks, activity logs, and related files.

**CLI Method:**
```bash
./bin/task-manager get-context 1
```

**Cursor IDE Method:**
```
/get context for task 1
```

## 🧠 AI-Powered Features

### Setting Up Gemini API Key

To use AI-powered features, you need to set up a Gemini API key:

```bash
# Add to your .bashrc, .zshrc, or equivalent shell config
export GEMINI_API_KEY="your_api_key_here"
```

### Parsing PRD Documents

You can automatically generate tasks from a Product Requirements Document (PRD):

**CLI Method:**
```bash
./bin/task-manager parse-prd --filePath "docs/requirements.md"
```

**Cursor IDE Method:**
```
/parse PRD file "docs/requirements.md"
```

Example PRD format:
```markdown
# Product Requirements: User Authentication System

## Overview
Implement a secure authentication system for our application that supports email/password login, social authentication, and two-factor authentication.

## Requirements
1. Users should be able to sign up with email and password
2. Users should be able to log in with their credentials
3. Support password reset functionality
4. Implement OAuth integration with Google and Facebook
5. Add two-factor authentication using SMS or authenticator apps
```

### Expanding Tasks into Subtasks

The `expand` command uses AI to automatically break down a complex task into subtasks:

**CLI Method:**
```bash
./bin/task-manager expand-task 1
```

**Cursor IDE Method:**
```
/expand task 1
```

Example output:
```
Successfully generated and added 5 subtask(s) for task 1.
```

The subtasks might include:
1. "Design login form UI"
2. "Implement form validation"
3. "Create API endpoints for authentication"
4. "Add error handling and user feedback"
5. "Implement session management"

### Revising Tasks

The `revise` command uses AI to update tasks based on changing requirements:

**CLI Method:**
```bash
./bin/task-manager revise-tasks 3 -p "Change authentication from OAuth to JWT"
```

**Cursor IDE Method:**
```
/revise tasks from 3 with "Change authentication from OAuth to JWT"
```

## 🖥️ MCP Integration with Cursor IDE

### Basic Commands in Cursor

When using Agentic Control Framework with Cursor IDE via MCP, you can interact with it through natural language commands by typing `/` followed by your request:

```
/init project "Todo App" with description "A simple todo application with authentication and task management"

/add task "Set up project structure" with high priority

/add task "Implement user authentication" with high priority and depends on task 1

/expand task 1

/list tasks

/mark task 1.1 as inprogress with message "Creating directory structure"

/get next task
```

### Natural Language Flexibility

The MCP integration supports flexible natural language commands:

```
/create a new task for implementing the user profile page with medium priority

/what's my next task?

/mark the authentication task as complete

/show me all the tasks related to the frontend
```

## 🚀 Advanced Examples

### Example 1: E-Commerce Project Setup

```bash
# Initialize project
./bin/task-manager init --projectName "E-Commerce App" --projectDescription "A modern e-commerce application with user authentication, product listings, and checkout"

# Add main tasks
./bin/task-manager add -t "User Authentication" -p high
./bin/task-manager add -t "Product Catalog" -p high --dependsOn "1"
./bin/task-manager add -t "Shopping Cart" -p medium --dependsOn "2"
./bin/task-manager add -t "Checkout Process" -p medium --dependsOn "3"
./bin/task-manager add -t "Admin Dashboard" -p low --dependsOn "1,2,3,4"

# Expand first task using AI
./bin/task-manager expand-task 1

# Start working on first subtask
./bin/task-manager status 1.1 inprogress -m "Setting up authentication routes"

# Add file associations
./bin/task-manager update 1 --related-files "src/auth/index.js,src/auth/routes.js,src/auth/controllers.js"

# Mark subtask as done
./bin/task-manager status 1.1 done -m "Authentication routes complete"

# Generate documentation
./bin/task-manager generate-files
```

### Example 2: Refactoring Project with PRD

```bash
# Create a PRD file (dummy_prd.md)
cat > dummy_prd.md << 'EOL'
# Refactoring Requirements

## Overview
We need to refactor our codebase to improve performance and maintainability.

## Requirements
1. Identify and fix performance bottlenecks in the rendering pipeline
2. Modularize the authentication system
3. Update deprecated API calls
4. Improve error handling throughout the application
5. Add comprehensive logging
EOL

# Initialize project
./bin/task-manager init --projectName "Code Refactoring" --projectDescription "Refactoring project to improve performance and maintainability"

# Parse PRD to generate tasks
./bin/task-manager parse-prd --filePath "dummy_prd.md"

# Expand the first task
./bin/task-manager expand-task 1

# Start working and track progress
./bin/task-manager status 1 inprogress -m "Starting performance analysis"
./bin/task-manager status 1.1 inprogress -m "Profiling render cycles"
```

## 💡 Tips and Best Practices

1. **Task Granularity**: Create tasks that are specific enough to be actionable but not so detailed that you need dozens of them.

2. **Use Dependencies Wisely**: Set dependencies to enforce proper task order, but avoid creating too many dependencies that might block progress.

3. **Activity Logging**: Use the `-m` flag frequently to document your progress, decisions, and issues.

4. **File Associations**: Keep the related files list updated as you work to maintain a clear connection between tasks and code.

5. **Regular Reviews**: Periodically review and update your task list to reflect changing priorities and requirements.

6. **Task Expansion**: Use the `expand` command for complex tasks to ensure you don't miss important subtasks.

7. **Status Management**: Keep task statuses updated to accurately reflect the current state of your project.

8. **Generate Task Files**: Use the `generate-files` command to create Markdown files for easy task reference and documentation.

## 🔧 Troubleshooting

### Common Issues

1. **MCP Server Not Starting**:
   - Ensure the wrapper scripts have executable permissions
   - Check if Node.js is properly installed
   - Verify the paths in the wrapper scripts

2. **MCP Integration Not Working in Cursor**:
   - Ensure Cursor is configured to use the MCP wrapper
   - Check console output for any error messages

3. **AI Features Not Working**:
   - Verify that the `GEMINI_API_KEY` environment variable is set
   - Check network connectivity to the Gemini API

4. **Tasks File Issues**:
   - If the tasks.json file becomes corrupted, you can try to repair it manually or use a backup
   - Always initialize a project before adding tasks

### Error Messages and Solutions

| Error Message | Possible Solution |
|---------------|-------------------|
| `Tasks file not found: tasks.json` | Run `task-manager init` to create the tasks file |
| `Error reading or parsing tasks file` | Check if the tasks.json file is valid JSON |
| `Task with ID X not found` | Verify the task ID exists in your tasks list |
| `GEMINI_API_KEY environment variable not set` | Set the environment variable as described in the AI Features section |
| `Error connecting to Gemini API` | Check your internet connection and API key validity |

## 🎓 Conclusion

The Agentic Control Framework is a powerful tool for managing tasks in your development projects. By integrating with Cursor IDE through the MCP protocol and leveraging AI capabilities through the Gemini API, it offers a seamless and efficient task management experience.

Use this tutorial as a reference as you explore the features and capabilities of the Agentic Control Framework. Happy task managing! 