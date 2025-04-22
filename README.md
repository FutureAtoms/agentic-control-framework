# Agentic Control Framework

A powerful CLI and MCP-based task management system for agentic workflows.

![Agentic Control Framework](agentic-control-framework.png)

## Overview

The Agentic Control Framework (ACF) is a comprehensive task management system designed to bring structure and organization to your development projects. It offers:

- **CLI-based task management:** Create, update, and track tasks using simple commands
- **MCP integration:** Seamlessly connect with Cursor IDE for enhanced productivity
- **AI-powered features:** Break down tasks into subtasks, adapt to changing requirements
- **Progress tracking:** Monitor task status, dependencies, and completion
- **Customizable workflows:** Adapt to your specific project needs

## Features

- Create and manage tasks with priorities, descriptions, and dependencies
- Break down complex tasks into manageable subtasks
- Track task status (todo, inprogress, done, blocked, error)
- Generate Markdown documentation for tasks
- Parse PRD (Product Requirements Document) files to auto-generate tasks
- Use AI to expand tasks into detailed subtasks
- Revise task plans when requirements change
- Integrate with Cursor IDE through MCP (Model Control Protocol)

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/FutureAtoms/agentic-control-framework.git
   cd agentic-control-framework
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make scripts executable:
   ```
   chmod +x bin/task-manager bin/task-manager-mcp
   ```

4. Create a `.env` file with your API key (optional, but required for AI features):
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Project Structure

The Agentic Control Framework has a clean and organized project structure:

```
agentic-control-framework/
├── bin/
│   ├── task-manager      # CLI entry point
│   ├── task-manager-mcp  # MCP server wrapper for Cursor IDE
├── src/
│   ├── cli.js            # CLI command definitions
│   ├── core.js           # Core functionality
│   ├── logger.js         # Standardized logging
│   ├── mcp_server.js     # MCP server implementation
│   └── prd_parser.js     # PRD parsing functionality
├── package.json
└── README.md
```

## Setting up with Cursor IDE

To use the Agentic Control Framework with Cursor IDE, you need to set up the MCP server wrapper:

1. Make the MCP server wrapper executable:
   ```
   chmod +x bin/task-manager-mcp
   ```

2. Link the script for system-wide use (optional):
   ```
   # Install globally (may require sudo)
   sudo ln -s "$(pwd)/bin/task-manager-mcp" /usr/local/bin/task-manager-mcp
   
   # Or add to your PATH in .bashrc or .zshrc
   export PATH="$PATH:/path/to/agentic-control-framework/bin"
   ```

3. Configure Cursor MCP connection:
   - Open Cursor settings
   - Go to Extensions > MCP > Add connection
   - Add a new connection with these details:
     - Name: `Agentic Control Framework`
     - Command: Path to your `bin/task-manager-mcp` script
     - Extension ID: Any unique identifier you prefer

4. Now you can use ACF within Cursor by triggering the MCP extension

## CLI Commands

The Agentic Control Framework provides a command-line interface for managing tasks:

```
./bin/task-manager <command> [options]
```

### MCP Server

Launch the MCP server for integration with Cursor:

```
./bin/task-manager-mcp
```

### Initialize a Project

Initialize a task management project:

```
./bin/task-manager init
```

With specific name and description:

```
./bin/task-manager init --project-name "My Project" --project-description "Description of my project"
```

### Add a Task

Add a new task:

```
./bin/task-manager add -t "Implement login feature"
```

With description and priority:

```
./bin/task-manager add -t "Implement login feature" -d "Create user authentication system" -p high
```

### List Tasks

List all tasks:

```
./bin/task-manager list
```

Filter by status:

```
./bin/task-manager list -s todo
```

### Get Next Task

Get the next actionable task based on status, dependencies, and priority:

```
./bin/task-manager next
```

### Add a Subtask

Add a subtask to a specific parent task:

```
./bin/task-manager add-subtask 1 -t "Design login form"
```

### Update Task Status

Change the status of a task:

```
./bin/task-manager status 1 inprogress -m "Starting work on this task"
./bin/task-manager status 1 done -m "Completed implementation"
```

### Get Task Context

Get detailed context for a specific task:

```
./bin/task-manager get-context 1
```

### Remove a Task

Remove a task by ID:

```
./bin/task-manager remove 1
```

### Generate Task Files

Generate Markdown files for all tasks:

```
./bin/task-manager generate-files
```

### Parse PRD

Parse a Product Requirements Document to generate tasks:

```
./bin/task-manager parse-prd path/to/prd.md
```

### Expand Task

Break down a task into subtasks using AI:

```
./bin/task-manager expand-task 1
```

### Revise Tasks

Revise future tasks based on a prompt:

```
./bin/task-manager revise-tasks 3 -p "Change authentication from OAuth to JWT"
```

## Example Workflow

Here's a complete workflow with the Agentic Control Framework:

```bash
# Initialize the project
./bin/task-manager init --project-name "E-Commerce App" --project-description "A modern e-commerce application with user authentication, product listings, and checkout"

# Add main tasks
./bin/task-manager add -t "User Authentication" -p high
./bin/task-manager add -t "Product Catalog" -p high --dependsOn "1"
./bin/task-manager add -t "Shopping Cart" -p medium --dependsOn "2"
./bin/task-manager add -t "Checkout Process" -p medium --dependsOn "3"

# Expand a task into subtasks
./bin/task-manager expand-task 1

# Get the next actionable task
./bin/task-manager next

# Update task status
./bin/task-manager status 1.1 inprogress -m "Working on login form design"

# Mark task as done
./bin/task-manager status 1.1 done -m "Completed login form design"

# Generate documentation
./bin/task-manager generate-files
```

## Troubleshooting

- Make sure your scripts are executable: `chmod +x bin/task-manager bin/task-manager-mcp`
- Check that your `.env` file contains the API key if you're using AI features
- Verify your Node.js version (`node -v`) is v14 or later
- Check the paths in the bin/task-manager-mcp script match your installation

## Best Practices

- Always run `task-manager init` in a new project directory before using other commands
- Use meaningful task titles and descriptions
- Set appropriate dependencies between tasks
- Update task status regularly to keep your project dashboard accurate
- Use the `next` command to maintain focus on the most important tasks
- Leverage AI expansion for complex tasks

## License

ISC

## Author

Abhilash Chadhar
 