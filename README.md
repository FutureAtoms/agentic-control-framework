# Gemini Task Manager

A powerful task manager system powered by Google's Gemini AI, designed to help developers break down complex projects into manageable tasks and subtasks.

![Gemini Task Manager](https://i.imgur.com/LhUbxWD.png)

## 📋 Features

- **Project Task Management**: Create and track tasks with priorities, dependencies, and status
- **Subtask Support**: Break down complex tasks into smaller, manageable subtasks
- **Task Dependencies**: Set dependencies between tasks to establish workflow
- **Priority Management**: Assign priorities to tasks (high, medium, low)
- **Status Tracking**: Monitor task status (todo, inprogress, done, blocked, error)
- **Activity Logging**: Track changes and updates to tasks
- **File Associations**: Link tasks to specific files in your codebase
- **AI-Powered Task Generation**: Use Gemini AI to generate tasks from PRD documents
- **Task Expansion**: Automatically expand tasks into subtasks using AI
- **Task Revision**: Revise tasks based on changing requirements
- **MCP Integration**: Seamless integration with Cursor IDE via MCP protocol

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Cursor IDE (for MCP integration)
- (Optional) Google Gemini API key for AI-powered features

### Basic Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/task-master.git
   cd task-master
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Gemini API key for AI features:
   ```bash
   # Add to your .bashrc, .zshrc, or equivalent shell config
   export GEMINI_API_KEY="your-api-key-here"
   ```

### MCP Server Setup (For Cursor IDE Integration)

To use the Gemini Task Manager with Cursor IDE, you need to set up the MCP server wrapper:

1. Make the wrapper scripts executable:
   ```bash
   chmod +x gemini-task-manager/bin/task-manager-mcp
   chmod +x bin/task-manager-mcp
   ```

2. Add the wrapper to your PATH (choose one option):

   **Option 1**: Add to your shell config
   ```bash
   # Add this to your .bashrc, .zshrc, or equivalent shell config file
   export PATH="$PATH:/absolute/path/to/task-master/bin"
   ```

   **Option 2**: Create a symlink in a directory already in your PATH
   ```bash
   # Example for macOS/Linux
   ln -s "$(pwd)/bin/task-manager-mcp" /usr/local/bin/task-manager-mcp
   ```

## 🛠️ Usage

### CLI Usage

The Gemini Task Manager provides a command-line interface for managing tasks:

```bash
./gemini-task-manager/bin/task-manager <command> [options]
```

### MCP Server (For Cursor IDE)

To start the MCP server for use with Cursor IDE:

```bash
task-manager-mcp
```

This will start the server using your current directory as the workspace root.

## 📚 Command Reference

### Initializing a Project

```bash
# CLI
./gemini-task-manager/bin/task-manager init --projectName "My Project" --projectDescription "Description of my project"

# In Cursor IDE
# Type: /init project with name "My Project" and description "Description of my project"
```

### Adding a Task

```bash
# CLI
./gemini-task-manager/bin/task-manager add -t "Implement login feature" -d "Create user authentication system" -p high

# In Cursor IDE
# Type: /add task "Implement login feature" with description "Create user authentication system" and high priority
```

### Listing Tasks

```bash
# CLI - List all tasks
./gemini-task-manager/bin/task-manager list

# CLI - List tasks with specific status
./gemini-task-manager/bin/task-manager list -s todo

# In Cursor IDE
# Type: /list tasks
# Type: /list todo tasks
```

### Getting the Next Task

```bash
# CLI
./gemini-task-manager/bin/task-manager next

# In Cursor IDE
# Type: /get next task
```

### Adding a Subtask

```bash
# CLI
./gemini-task-manager/bin/task-manager add-subtask 1 -t "Design login form"

# In Cursor IDE
# Type: /add subtask "Design login form" to task 1
```

### Updating Task Status

```bash
# CLI
./gemini-task-manager/bin/task-manager status 1 inprogress -m "Starting work on this task"
./gemini-task-manager/bin/task-manager status 1 done -m "Completed implementation"

# In Cursor IDE
# Type: /update task 1 status to inprogress with message "Starting work on this task"
# Type: /mark task 1 as done with message "Completed implementation"
```

### Updating Task Details

```bash
# CLI
./gemini-task-manager/bin/task-manager update 1 -t "New title" -d "Updated description" -p medium

# In Cursor IDE
# Type: /update task 1 with title "New title" and description "Updated description"
```

### Removing a Task

```bash
# CLI
./gemini-task-manager/bin/task-manager remove 1

# In Cursor IDE
# Type: /remove task 1
```

### Generating Task Files

```bash
# CLI
./gemini-task-manager/bin/task-manager generate

# In Cursor IDE
# Type: /generate task files
```

## 🧠 AI-Powered Features

### Parsing PRD Documents

```bash
# CLI
./gemini-task-manager/bin/task-manager parse-prd --filePath "path/to/prd.md"

# In Cursor IDE
# Type: /parse PRD file "path/to/prd.md"
```

### Expanding Tasks into Subtasks

```bash
# CLI
./gemini-task-manager/bin/task-manager expand --taskId 1

# In Cursor IDE
# Type: /expand task 1
```

### Revising Tasks

```bash
# CLI
./gemini-task-manager/bin/task-manager revise --fromTaskId 3 --prompt "Change authentication from OAuth to JWT"

# In Cursor IDE
# Type: /revise tasks from 3 with "Change authentication from OAuth to JWT"
```

## 🔍 Task Context

To get detailed context for a specific task:

```bash
# CLI
./gemini-task-manager/bin/task-manager get-context 1

# In Cursor IDE
# Type: /get context for task 1
```

## 📊 Example Workflow

1. **Initialize project**:
   ```bash
   ./gemini-task-manager/bin/task-manager init --projectName "E-Commerce App" --projectDescription "A modern e-commerce application with user authentication, product listings, and checkout"
   ```

2. **Parse PRD document** (if available):
   ```bash
   ./gemini-task-manager/bin/task-manager parse-prd --filePath "docs/ecommerce-prd.md"
   ```

3. **Add high-level tasks** (if not using PRD):
   ```bash
   ./gemini-task-manager/bin/task-manager add -t "User Authentication" -p high
   ./gemini-task-manager/bin/task-manager add -t "Product Catalog" -p high --dependsOn "1"
   ./gemini-task-manager/bin/task-manager add -t "Shopping Cart" -p medium --dependsOn "2"
   ./gemini-task-manager/bin/task-manager add -t "Checkout Process" -p medium --dependsOn "3"
   ```

4. **Expand tasks into subtasks**:
   ```bash
   ./gemini-task-manager/bin/task-manager expand --taskId 1
   ```

5. **Work on tasks**:
   ```bash
   # Get next task
   ./gemini-task-manager/bin/task-manager next
   
   # Mark task as in progress
   ./gemini-task-manager/bin/task-manager status 1.1 inprogress -m "Working on login form design"
   
   # Mark task as done
   ./gemini-task-manager/bin/task-manager status 1.1 done -m "Completed login form design"
   ```

6. **Generate task files for documentation**:
   ```bash
   ./gemini-task-manager/bin/task-manager generate
   ```

## 🤖 MCP Integration Example (in Cursor)

When using Gemini Task Manager with Cursor IDE via MCP, you can interact with it through natural language:

```
/init project "Todo App" with description "A simple todo application with authentication and task management"

/add task "Set up project structure" with high priority

/add task "Implement user authentication" with high priority and depends on task 1

/expand task 1

/list tasks

/mark task 1.1 as inprogress with message "Creating directory structure"

/get next task
```

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

## 📄 License

[LICENSE INFO]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please [create an issue](https://github.com/yourusername/task-master/issues) on the GitHub repository. 