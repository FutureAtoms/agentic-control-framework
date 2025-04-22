# Gemini Task Manager Tutorial

This tutorial will guide you through setting up and using the Gemini Task Manager, an AI-powered task management system designed to integrate with Cursor IDE.

## Setup and Installation

### 1. Clone the Repository

   ```bash
git clone https://github.com/FutureAtoms/Gemini-task-man-mcp.git
cd Gemini-task-man-mcp
   ```

### 2. Install Dependencies

   ```bash
   npm install
   ```

### 3. Make Scripts Executable

   ```bash
chmod +x bin/task-manager bin/task-manager-mcp
```

### 4. (Optional) Set Up Gemini API Key

For AI-powered features (PRD parsing, task expansion, task revision), you'll need a Google Gemini API key:

```bash
# Add to your .bashrc, .zshrc, or equivalent shell config
export GEMINI_API_KEY="your-api-key-here"
```

## Basic CLI Usage

### Initializing a Project

Start by initializing a new project in your workspace:

```bash
./bin/task-manager init --project-name "My Project" --project-description "A sample project to learn Gemini Task Manager"
```

This creates a `tasks.json` file in your current directory to store all task information.

### Adding Tasks

Add high-level tasks to your project:

```bash
# Add a basic task
./bin/task-manager add -t "Create user interface"

# Add a task with priority and description
./bin/task-manager add -t "Implement user authentication" -d "Set up login/signup flows" -p high

# Add a task with dependency
./bin/task-manager add -t "Build dashboard" -p medium --dependsOn "1,2"
```

### Listing Tasks

View all your tasks:

```bash
./bin/task-manager list
```

Filter tasks by status:

```bash
./bin/task-manager list -s todo
./bin/task-manager list -s inprogress
./bin/task-manager list -s done
```

### Adding Subtasks

Break down complex tasks into smaller subtasks:

```bash
# Add a subtask to task #2
./bin/task-manager add-subtask 2 -t "Design login form"
./bin/task-manager add-subtask 2 -t "Implement authentication API"
./bin/task-manager add-subtask 2 -t "Connect frontend to API"
```

### Updating Task Status

Track your progress by updating task status:

```bash
# Start working on a task
./bin/task-manager status 2.1 inprogress -m "Starting work on login form design"

# Mark a task as complete
./bin/task-manager status 2.1 done -m "Completed login form design"

# Mark a task as blocked
./bin/task-manager status 2.2 blocked -m "Waiting for API documentation"
```

### Getting Task Context

Get detailed information about a specific task:

```bash
./bin/task-manager get-context 2
```

### Finding the Next Task

Let the system suggest your next task based on dependencies and priorities:

```bash
./bin/task-manager next
```

### Generating Task Documentation

Generate individual Markdown files for each task:

```bash
./bin/task-manager generate
```

This creates a `tasks/` directory with individual files for each task.

## AI-Powered Features

### Parsing a PRD Document

Parse a Product Requirements Document to automatically generate tasks:

```bash
./bin/task-manager parse-prd path/to/your/prd.md
```

### Expanding Tasks

Use AI to break down a high-level task into subtasks:

```bash
./bin/task-manager expand 1
```

### Revising Tasks

Update your task plan based on new requirements:

```bash
./bin/task-manager revise --from-task-id 3 --prompt "Change the authentication from OAuth to JWT"
```

## Cursor IDE Integration

### Setting Up the MCP Server

1. Make sure your MCP server script is executable:
   ```bash
   chmod +x bin/task-manager-mcp
   ```

2. Add the wrapper to your PATH:
   ```bash
   # Option 1: Add to shell config
   export PATH="$PATH:/absolute/path/to/Gemini-task-man-mcp/bin"
   
   # Option 2: Create a symlink
   ln -s "$(pwd)/bin/task-manager-mcp" /usr/local/bin/task-manager-mcp
   ```

3. Configure Cursor IDE:
   - Open Settings (⚙️) > Preferences
   - Search for "MCP"
   - Add a new MCP integration:
     - Name: `Gemini Task Manager`
     - Command: Path to your `bin/task-manager-mcp` script
     - Protocol: `MCP`

### Using the Task Manager in Cursor

Once configured, you can use natural language commands in Cursor:

- `/init project with name "My Project" and description "A demo project"`
- `/add task "Build user interface" with high priority`
- `/add subtask "Create login form" to task 1`
- `/list tasks`
- `/update task 1.1 status to inprogress`
- `/get next task`
- `/parse PRD file "./docs/requirements.md"`

## Example Workflow

Here's a complete example workflow using the Gemini Task Manager:

### 1. Initialize Project

```bash
./bin/task-manager init --project-name "E-Commerce App" --project-description "A modern e-commerce application with user authentication, product listings, and checkout"
```

### 2. Add High-Level Tasks

```bash
./bin/task-manager add -t "User Authentication" -p high
./bin/task-manager add -t "Product Catalog" -p high --dependsOn "1"
./bin/task-manager add -t "Shopping Cart" -p medium --dependsOn "2"
./bin/task-manager add -t "Checkout Process" -p medium --dependsOn "3"
```

### 3. Use AI to Expand Tasks

```bash
./bin/task-manager expand 1
```

This might generate subtasks like:
- 1.1 Setup auth routes
- 1.2 Create login form
- 1.3 Implement JWT authentication
- 1.4 Add password reset functionality

### 4. Start Working on Tasks

```bash
# Get the next task
./bin/task-manager next

# Mark as in progress
./bin/task-manager status 1.1 inprogress -m "Working on auth routes"

# Complete task
./bin/task-manager status 1.1 done -m "Completed auth routes implementation"
```

### 5. Generate Documentation

```bash
./bin/task-manager generate
```

### 6. Revise Plan Based on Changes

```bash
./bin/task-manager revise --from-task-id 3 --prompt "Change shopping cart to use local storage instead of database"
```

## Troubleshooting

### Common Issues

1. **Permission Denied Error**:
   - Ensure scripts are executable: `chmod +x bin/task-manager bin/task-manager-mcp`

2. **MCP Server Not Starting**:
   - Check Node.js installation: `node --version`
   - Verify the paths in `bin/task-manager-mcp` match your installation

3. **Workspace Root Not Found Error**:
   - Ensure you're running the MCP server from a directory with a valid project
   - Use the absolute path when starting the MCP server

4. **AI Features Not Working**:
   - Verify the `GEMINI_API_KEY` environment variable is set correctly
   - Ensure you have internet connectivity

For any other issues, refer to the README.md file or submit an issue on GitHub. 