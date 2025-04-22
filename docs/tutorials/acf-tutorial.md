# Agentic Control Framework (ACF) Tutorial

This comprehensive guide will help you use the Agentic Control Framework (ACF), an AI-powered task management system designed to support automated, agentic workflows within your codebase.

**Goal:** Manage a project's tasks programmatically, allowing an AI agent (or user) to track progress, understand context, report status (including errors), and associate tasks with relevant code files.

## Prerequisites

* Node.js installed.
* ACF project files available (e.g., cloned repository).
* **(Optional but Recommended for AI features):** `GEMINI_API_KEY` environment variable set (e.g., in a `.env` file in the workspace root) if using `parse-prd`, `expand`, or `revise` commands.

## Setup and Installation

### 1. Clone the Repository

```bash
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Make Scripts Executable

```bash
chmod +x bin/task-manager bin/task-manager-mcp
```

### 4. Set Up Gemini API Key (for AI Features)

For AI-powered features like PRD parsing, task expansion, and task revision:

```bash
# Add to your .bashrc, .zshrc, or equivalent shell config
export GEMINI_API_KEY="your-api-key-here"
```

---

## Usage Guide

This guide covers two primary ways to use ACF:

1. **Direct CLI Usage** - For manual use or direct integration with agents that can execute commands
2. **MCP Integration** - For use with AI tools like Cursor that support the Model Control Protocol

---

## Part 1: Direct CLI Usage

This section focuses on using the ACF command-line interface directly. An agent would execute these commands in a terminal/shell environment.

### Running Commands

Execute commands from your workspace root directory using:

```bash
# If installed globally or added to PATH
task-manager <command> [options]

# Using node to execute directly
node path/to/agentic-control-framework/bin/task-manager <command> [options]

# From within the project directory
./bin/task-manager <command> [options]
```

### Command Reference & Examples

#### 1. `init`

**Description:** Initializes the task manager project, creating `tasks.json` if it doesn't exist.

**Usage:**
```bash
./bin/task-manager init --project-name "My Project" --project-description "A sample project to learn ACF"
```

**Options:** None (Interactive Prompts)

**Example (Simulated - Agent pre-creates file):**
```bash
# Agent ensures tasks.json exists with basic structure
# Example content:
# {
#   "projectName": "Agent Project Alpha",
#   "projectDescription": "Automated refactoring task.",
#   "lastTaskId": 0,
#   "tasks": []
# }
```

#### 2. `add`

**Description:** Adds a new task to the list.

**Options:**
* `-t, --title <title>` (Required): Title of the task.
* `-d, --description <description>`: Optional description.
* `-p, --priority <priority>`: Optional priority (low, medium, high). Default: medium.
* `--depends-on <ids>`: Optional comma-separated task IDs it depends on.
* `--related-files <paths>`: Optional comma-separated relevant file paths.

**Examples:**
```bash
# Add a basic task
./bin/task-manager add -t "Create user interface"

# Add a task with priority and description
./bin/task-manager add -t "Implement user authentication" -d "Set up login/signup flows" -p high

# Add a task with dependency and related files
./bin/task-manager add -t "Implement API Endpoint" -d "Create POST /users endpoint" -p high --related-files "routes/users.js,controllers/userController.js" --depends-on "1,2"
```

#### 3. `list`

**Description:** Lists tasks in a human-readable table.

**Options:**
* `-s, --status <status>`: Optional status to filter by (e.g., todo, inprogress, done, blocked, error).

**Examples:**
```bash
# List all tasks
./bin/task-manager list

# List tasks with a specific status
./bin/task-manager list -s todo
./bin/task-manager list -s inprogress
./bin/task-manager list -s done
```

#### 4. `add-subtask`

**Description:** Adds a subtask to a specified parent task.

**Arguments:** `<parent-id>`

**Options:**
* `-t, --title <title>` (Required): Title of the subtask.

**Example:**
```bash
# Add a subtask to task #2
./bin/task-manager add-subtask 2 -t "Design login form"
./bin/task-manager add-subtask 2 -t "Implement authentication API"
./bin/task-manager add-subtask 2 -t "Connect frontend to API"
```

#### 5. `status`

**Description:** Updates the status of a task or subtask. Valid statuses include: `todo`, `inprogress`, `done`, `blocked`, `error`.

**Arguments:** `<id>` (task or subtask ID), `<new-status>`

**Options:**
* `-m, --message <message>`: Optional message to add to the activity log.

**Examples:**
```bash
# Start working on a task
./bin/task-manager status 2.1 inprogress -m "Starting work on login form design"

# Mark a task as complete
./bin/task-manager status 2.1 done -m "Completed login form design"

# Mark a task as blocked
./bin/task-manager status 2.2 blocked -m "Waiting for API documentation"

# Report an error
./bin/task-manager status 11 error -m "Controller method throws 500 internal server error on testing."
```

#### 6. `next`

**Description:** Shows the next actionable task based on status (todo/inprogress), dependencies (must be 'done'), and priority (high > medium > low).

**Example:**
```bash
./bin/task-manager next
```

#### 7. `update`

**Description:** Updates details of a task or subtask.

**Arguments:** `<id>` (task or subtask ID)

**Options:**
* `-t, --title <title>`: New title.
* `-d, --description <description>`: New description (Main tasks only).
* `-p, --priority <priority>`: New priority (Main tasks only).
* `--related-files <paths>`: Comma-separated file paths (replaces existing list, Main tasks only).
* `-m, --message <message>`: Optional message for the activity log.

**Examples:**
```bash
# Update task priority and related files
./bin/task-manager update 10 -p medium --related-files "src/core.js" -m "Reducing priority after initial assessment."

# Update subtask title
./bin/task-manager update 11.1 -t "Define & Test request validation schema"
```

#### 8. `remove` (Alias: `rm`)

**Description:** Removes a task or subtask by its ID.

**Arguments:** `<id>` (task or subtask ID)

**Examples:**
```bash
# Remove a subtask
./bin/task-manager remove 11.1

# Remove a task
./bin/task-manager rm 9
```

#### 9. `get-context`

**Description:** Get detailed information about a specific task.

**Example:**
```bash
./bin/task-manager get-context 2
```

#### 10. `generate`

**Description:** Generates individual Markdown files for each task in the `tasks/` directory.

**Example:**
```bash
./bin/task-manager generate
```

### AI-Powered Features

#### Parsing a PRD Document

**Description:** Parse a Product Requirements Document to automatically generate tasks.

**Example:**
```bash
./bin/task-manager parse-prd path/to/your/prd.md
```

#### Expanding Tasks

**Description:** Use AI to break down a high-level task into subtasks.

**Example:**
```bash
./bin/task-manager expand 1
```

#### Revising Tasks

**Description:** Update your task plan based on new requirements.

**Example:**
```bash
./bin/task-manager revise --from-task-id 3 --prompt "Change the authentication from OAuth to JWT"
```

---

## Part 2: MCP Integration (e.g., with Cursor IDE)

This tutorial explains how an agent (or user via an AI assistant like Cursor) interacts with ACF using the MCP (Model Control Protocol) server.

### Setting Up the MCP Server

1. **Make sure your MCP server script is executable:**
   ```bash
   chmod +x bin/task-manager-mcp
   ```

2. **Add the wrapper to your PATH:**
   ```bash
   # Option 1: Add to shell config
   export PATH="$PATH:/absolute/path/to/agentic-control-framework/bin"
   
   # Option 2: Create a symlink
   ln -s "$(pwd)/bin/task-manager-mcp" /usr/local/bin/task-manager-mcp
   ```

3. **Configure Cursor IDE:**
   - Open Settings (⚙️) > Preferences
   - Search for "MCP"
   - Add a new MCP integration:
     - Name: `Agentic Control Framework`
     - Command: Path to your `bin/task-manager-mcp` script
     - Protocol: `MCP`

### MCP Tools

The MCP server provides the following tools that can be called by AI agents:

#### `initProject`
* **Description:** Initializes the task manager project
* **Parameters:**
  * `projectName` (string, optional)
  * `projectDescription` (string, optional)

#### `addTask`
* **Description:** Adds a new task to the list
* **Parameters:**
  * `title` (string, required) 
  * `description` (string, optional)
  * `priority` (string, optional: low/medium/high)
  * `dependsOn` (string, optional: comma-separated IDs)
  * `relatedFiles` (string, optional: comma-separated paths)

#### `listTasks`
* **Description:** Lists all tasks or filters by status
* **Parameters:**
  * `status` (string, optional: todo/inprogress/done/blocked/error)

#### `addSubtask`
* **Description:** Adds a subtask to a parent task
* **Parameters:**
  * `parentId` (number, required)
  * `title` (string, required)

#### `updateStatus`
* **Description:** Updates task or subtask status
* **Parameters:**
  * `id` (string/number, required)
  * `newStatus` (string, required: todo/inprogress/done/blocked/error)
  * `message` (string, optional: Log message)

#### `updateTask`
* **Description:** Updates task or subtask details
* **Parameters:**
  * `id` (string/number, required)
  * `title` (string, optional)
  * `description` (string, optional)
  * `priority` (string, optional)
  * `relatedFiles` (string, optional)
  * `message` (string, optional: Log message)

#### `removeTask`
* **Description:** Removes a task or subtask
* **Parameters:**
  * `id` (string/number, required)

#### `getNextTask`
* **Description:** Gets the next actionable task
* **Parameters:** None

#### `generateTaskFiles`
* **Description:** Generates Markdown files for tasks
* **Parameters:** None

#### `getContext`
* **Description:** Gets detailed context for a task
* **Parameters:**
  * `id` (string/number, required)

#### `parsePrd`
* **Description:** Parses a PRD file to generate tasks
* **Parameters:**
  * `filePath` (string, required)

#### `expandTask`
* **Description:** Breaks down a task into subtasks
* **Parameters:**
  * `taskId` (string/number, required)

#### `reviseTasks`
* **Description:** Revises future tasks based on changes
* **Parameters:**
  * `fromTaskId` (string/number, required)
  * `prompt` (string, required)

### Using the Task Manager in Cursor

Once configured, you can use natural language commands in Cursor:

- `/init project with name "My Project" and description "A demo project"`
- `/add task "Build user interface" with high priority`
- `/add subtask "Create login form" to task 1`
- `/list tasks`
- `/update task 1.1 status to inprogress`
- `/get next task`
- `/parse PRD file "./docs/requirements.md"`

---

## Example Workflow

Here's a complete example workflow using the Agentic Control Framework:

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

---

## Troubleshooting

### Common Issues

- **Task file not found**: Ensure `tasks.json` exists in your workspace root or initialize a new project.
- **API key errors**: Check that your `GEMINI_API_KEY` is set correctly for AI-powered features.
- **File permission issues**: Ensure scripts are executable with `chmod +x bin/task-manager bin/task-manager-mcp`.

### Getting Help

Run any command with `--help` to see usage information:

```bash
./bin/task-manager --help
./bin/task-manager add --help
``` 