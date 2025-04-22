# Gemini Task Manager (GMT) Tutorials for Agentic Workflows

This document provides two tutorials on using the Gemini Task Manager (GMT) to support automated, agentic workflows within your codebase.

**Goal:** Manage a project's tasks programmatically, allowing an AI agent (or user) to track progress, understand context, report status (including errors), and associate tasks with relevant code files.

**Prerequisites:**

*   Node.js installed.
*   GMT project files available (e.g., cloned repository).
*   **(Optional but Recommended for AI features):** `GEMINI_API_KEY` environment variable set (e.g., in a `.env` file in the workspace root) if using `parse-prd`, `expand`, or `revise` commands.

---

## Tutorial 1: Direct CLI Usage for Agents

This tutorial focuses on using the GMT command-line interface directly. An agent would execute these commands in a terminal/shell environment.

**Running Commands:**

Execute commands from your workspace root directory using `node`:

```bash
node gemini-task-manager/bin/task-manager <command> [options]
```

---

### Command Reference & Agentic Examples

**1. `init`**

*   **Description:** Initializes the task manager project. Creates `tasks.json` if it doesn't exist. **Note:** This command is interactive in the CLI, prompting for project name/description. For a fully autonomous agent, you might pre-create a basic `tasks.json` or have the agent handle the interactive prompts if the environment supports it. We simulated this step in testing by creating `tasks.json` manually.
*   **Options:** None (Interactive Prompts)
*   **Example (Simulated - Agent pre-creates file):**
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
*   **Agentic Relevance:** Ensures the task database is ready before other operations.

**2. `add`**

*   **Description:** Adds a new task to the list.
*   **Options:**
    *   `-t, --title <title>` (Required): Title of the task.
    *   `-d, --description <description>`: Optional description.
    *   `-p, --priority <priority>`: Optional priority (low, medium, high). Default: medium.
    *   `--depends-on <ids>`: Optional comma-separated task IDs it depends on.
    *   `--related-files <paths>`: Optional comma-separated relevant file paths.
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager add -t "Implement API Endpoint" -d "Create POST /users endpoint" -p high --related-files "routes/users.js,controllers/userController.js"
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Added new task (ID: 11): "Implement API Endpoint"
    ```
*   **Agentic Relevance:** Agent uses this to create new tasks derived from requirements or user requests. `related-files` helps link the task to code.

**3. `list`**

*   **Description:** Lists tasks in a human-readable table.
*   **Options:**
    *   `-s, --status <status>`: Optional status to filter by (e.g., todo, inprogress, done, blocked, error).
*   **Example (List all):**
    ```bash
    node gemini-task-manager/bin/task-manager list
    ```
*   **Expected Output (Simulated - based on previous tests):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    ┌─────┬────────────────────────────────────────┬────────────┬──────────┬────────────┬───────────────┐
    │ ID  │ Title                                  │ Status     │ Priority │ Depends On │ Subtasks      │
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    │ 2   │ Setup Base Project                     │ done       │ high     │ None       │ None          │
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    │ 3   │ Implement Feature X                    │ error      │ medium   │ None       │ 0/10 done     │
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    # ... other tasks ...
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    │ 10  │ Refactor Core Utilities                │ todo       │ high     │ None       │ None          │
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    │ 11  │ Implement API Endpoint                 │ todo       │ high     │ None       │ None          │
    └─────┴────────────────────────────────────────┴────────────┴──────────┴────────────┴───────────────┘
    ```
*   **Example (Filter by status):**
    ```bash
    node gemini-task-manager/bin/task-manager list -s error
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    ┌─────┬────────────────────────────────────────┬────────────┬──────────┬────────────┬───────────────┐
    │ ID  │ Title                                  │ Status     │ Priority │ Depends On │ Subtasks      │
    ├─────┼────────────────────────────────────────┼────────────┼──────────┼────────────┼───────────────┤
    │ 3   │ Implement Feature X                    │ error      │ medium   │ None       │ 0/10 done     │
    └─────┴────────────────────────────────────────┴────────────┴──────────┴────────────┴───────────────┘
    ```
*   **Agentic Relevance:** Useful for human monitoring. An agent might parse the underlying `tasks.json` or use `get-context` for specific task data instead.

**4. `add-subtask`**

*   **Description:** Adds a subtask to a specified parent task.
*   **Arguments:** `<parent-id>`
*   **Options:**
    *   `-t, --title <title>` (Required): Title of the subtask.
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager add-subtask 11 -t "Define request validation schema"
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Added subtask "Define request validation schema" (ID: 11.1) to task 11.
    ```
*   **Agentic Relevance:** Agent breaks down complex tasks received or generated (e.g., via `expand`).

**5. `status`**

*   **Description:** Updates the status of a task or subtask. Valid statuses include: `todo`, `inprogress`, `done`, `blocked`, `error`.
*   **Arguments:** `<id>` (task or subtask ID), `<new-status>`
*   **Options:**
    *   `-m, --message <message>`: Optional message to add to the activity log.
*   **Example (Report Progress):**
    ```bash
    node gemini-task-manager/bin/task-manager status 11.1 inprogress -m "Writing Joi validation schema."
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Updated status of "Define request validation schema" (ID: 11.1) to "inprogress". Logged: "Writing Joi validation schema."
    ```
*   **Example (Report Error):**
    ```bash
    node gemini-task-manager/bin/task-manager status 11 error -m "Controller method throws 500 internal server error on testing."
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Updated status of "Implement API Endpoint" (ID: 11) to "error". Logged: "Controller method throws 500 internal server error on testing."
    ```
*   **Example (Mark Done):**
    ```bash
    node gemini-task-manager/bin/task-manager status 11.1 done -m "Validation schema complete and tested."
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Updated status of "Define request validation schema" (ID: 11.1) to "done". Logged: "Validation schema complete and tested."
    ```
*   **Agentic Relevance:** Primary mechanism for the agent to report its current state on a task, including success, failure, or blocking issues. The `--message` provides crucial detail.

**6. `next`**

*   **Description:** Shows the next actionable task based on status (todo/inprogress), dependencies (must be 'done'), and priority (high > medium > low).
*   **Options:** None
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager next
    ```
*   **Expected Output (Simulated - JSON object or 'null'):**
    ```json
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    {
      "id": 10,
      "title": "Refactor Core Utilities",
      "description": "Improve utility functions",
      "status": "todo",
      "priority": "high",
      "dependsOn": [],
      "createdAt": "...",
      "updatedAt": "...",
      "subtasks": [],
      "relatedFiles": [
        "gemini-task-manager/src/core.js",
        "gemini-task-manager/src/prd_parser.js"
      ],
      "activityLog": [ ... ]
    }
    ```
*   **Agentic Relevance:** Agent calls this to determine which task it should work on next according to the defined logic.

**7. `update`**

*   **Description:** Updates details of a task or subtask.
*   **Arguments:** `<id>` (task or subtask ID)
*   **Options:**
    *   `-t, --title <title>`: New title.
    *   `-d, --description <description>`: New description (Main tasks only).
    *   `-p, --priority <priority>`: New priority (Main tasks only).
    *   `--related-files <paths>`: Comma-separated file paths (replaces existing list, Main tasks only).
    *   `-m, --message <message>`: Optional message for the activity log.
*   **Example (Update task and log):**
    ```bash
    node gemini-task-manager/bin/task-manager update 10 -p medium --related-files "gemini-task-manager/src/core.js" -m "Reducing priority after initial assessment. Focusing only on core.js for now."
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Updated task/subtask "Refactor Core Utilities" (ID: 10). Logged: "Reducing priority after initial assessment. Focusing only on core.js for now."
    ```
*   **Example (Update subtask title):**
    ```bash
    node gemini-task-manager/bin/task-manager update 11.1 -t "Define & Test request validation schema"
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Updated task/subtask "Define & Test request validation schema" (ID: 11.1).
    ```
*   **Agentic Relevance:** Allows agent to refine task details, associate different files as work progresses, or add general log messages without changing status.

**8. `remove` (Alias: `rm`)**

*   **Description:** Removes a task or subtask by its ID.
*   **Arguments:** `<id>` (task or subtask ID)
*   **Options:** None
*   **Example (Remove subtask):**
    ```bash
    node gemini-task-manager/bin/task-manager remove 11.1
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Removed task/subtask "Define & Test request validation schema" (ID: 11.1).
    ```
*   **Example (Remove task):**
    ```bash
    node gemini-task-manager/bin/task-manager rm 9
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Removed task/subtask "Test Mobile Feature 2" (ID: 9).
    ```
*   **Agentic Relevance:** Agent can remove tasks deemed obsolete or incorrectly generated. Use with caution in autonomous workflows.

**9. `generate`**

*   **Description:** Generates individual Markdown files for each task in the `tasks/` directory.
*   **Options:** None
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager generate
    ```
*   **Expected Output (Simulated):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Created directory: /path/to/your/project/tasks
    Generated 8 task files in the '/path/to/your/project/tasks' directory.
    ```
*   **Agentic Relevance:** Primarily for human review or creating documentation artifacts. Less likely to be used directly by an agent during execution.

**10. `get-context`**

*   **Description:** Retrieves detailed context for a specific task or subtask (JSON output).
*   **Arguments:** `<id>` (task or subtask ID)
*   **Options:** None
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager get-context 10
    ```
*   **Expected Output (Simulated JSON):**
    ```json
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    {
      "id": 10,
      "title": "Refactor Core Utilities",
      "description": "Improve utility functions",
      "status": "todo",
      "priority": "medium",
      "dependsOn": [],
      "createdAt": "...",
      "updatedAt": "...",
      "subtasks": [],
      "relatedFiles": [
        "gemini-task-manager/src/core.js"
      ],
      "activityLog": [
        {
          "timestamp": "...",
          "type": "log",
          "message": "Task created with title: \"Refactor Core Utilities\""
        },
        {
          "timestamp": "...",
          "type": "log",
          "message": "Initial review completed. Identified key areas for refactoring."
        },
        {
           "timestamp": "...",
           "type": "log",
           "message": "Reducing priority after initial assessment. Focusing only on core.js for now."
        }
      ]
    }
    ```
*   **Agentic Relevance:** Essential command for an agent. It calls this after getting the `next` task ID to understand the task's description, associated files (`relatedFiles`), and recent history (`activityLog`) before starting work.

**11. `parse-prd`**

*   **Description:** Parses a Product Requirements Document (PRD) file using the Gemini API to generate tasks. Requires `GEMINI_API_KEY`.
*   **Arguments:** `<file-path>` (path to PRD file)
*   **Options:** None
*   **Example:**
    ```bash
    # Assuming dummy_prd.md exists
    node gemini-task-manager/bin/task-manager parse-prd dummy_prd.md
    ```
*   **Expected Output (Simulated - requires API key):**
    ```
    Attempting to parse PRD: dummy_prd.md
    Sending PRD content to Gemini API...
    Successfully parsed tasks from Gemini response.
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Successfully added 2 tasks from PRD: dummy_prd.md
    ```
*   **Agentic Relevance:** Agent can use this to bootstrap a project plan from an initial requirements document.

**12. `expand`**

*   **Description:** Uses the Gemini API to break down a task into subtasks (overwrites existing subtasks). Requires `GEMINI_API_KEY`.
*   **Arguments:** `<task-id>`
*   **Options:** None
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager expand 10
    ```
*   **Expected Output (Simulated - requires API key):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Sending task (ID: 10) to Gemini API for expansion...
    Successfully parsed subtasks from Gemini response.
    Successfully generated and added 5 subtask(s) for task 10.
    ```
*   **Agentic Relevance:** Agent can use this when it determines a task is too complex and needs to be broken down further before execution.

**13. `revise`**

*   **Description:** Uses the Gemini API to revise future tasks based on a prompt/change, starting from a specific task ID. Requires `GEMINI_API_KEY`.
*   **Options:**
    *   `--from <task-id>` (Required): Task ID from which revision should start.
    *   `-p, --prompt <prompt>` (Required): User prompt describing the change.
*   **Example:**
    ```bash
    node gemini-task-manager/bin/task-manager revise --from 5 -p "Feature 1 scope increased to include admin controls"
    ```
*   **Expected Output (Simulated - requires API key):**
    ```
    DEBUG [readTasks]: TASKS_FILE = /path/to/your/project/tasks.json
    Sending future tasks to Gemini API for revision based on prompt: "Feature 1 scope increased to include admin controls"
    Successfully parsed revised tasks from Gemini response.
    DEBUG: Revised future tasks received from Gemini: [ ... revised task objects ... ]
    Successfully revised tasks from ID 5 onwards based on the prompt.
    ```
*   **Agentic Relevance:** Agent can use this to adapt the plan when requirements change or unexpected issues arise that necessitate altering future tasks.

---

## Tutorial 2: MCP Usage for Agents (e.g., with Cursor)

This tutorial explains how an agent (or user via an AI assistant like Cursor) interacts with GMT using the MCP (Model Control Protocol) server. The agent sends requests to the MCP server, which executes the core logic.

**Setup:**

1.  **Start the MCP Server:** An external process needs to run the MCP server, typically initiated by the editor or a wrapper script. The command usually looks something like this, passing the workspace root:
    ```bash
    node gemini-task-manager/bin/task-manager-mcp --workspaceRoot /path/to/your/project
    ```
    *(Note: How this is started exactly depends on the specific agent/editor integration.)*

2.  **Editor Configuration (Example: Cursor's `settings.json`):** Configure the editor to connect to the GMT MCP server. Environment variables (`GEMINI_API_KEY`, etc.) must be available to the server process.
    ```json
    {
      "mcpServers": {
        // Unique name for the server connection
        "gemini-task-manager": {
          // Command to start the server
          "command": "node",
          "args": [
            // Path relative to workspace may need adjustment
            "gemini-task-manager/bin/task-manager-mcp",
            "--workspaceRoot",
            // Editor usually substitutes the workspace path here
            "${workspaceFolder}"
          ],
          // Environment variables passed to the server process
          "env": {
            // CRITICAL: Set your actual key here or ensure it's in the environment
            "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE_OR_READ_FROM_ENV"
            // Add other relevant env vars if needed (e.g., specific model)
            // "GEMINI_API_ENDPOINT": "...",
          }
        }
      }
    }
    ```

**Interaction Model:**

1.  **Agent -> AI Assistant/Editor:** The agent sends a natural language request (or a structured call if the editor supports it) to the AI assistant integrated with the editor (e.g., Cursor).
2.  **AI Assistant/Editor -> MCP Server:** The AI assistant interprets the request and formulates a JSON-RPC call to the appropriate GMT tool method on the MCP server.
3.  **MCP Server -> Core Logic:** The MCP server receives the call, invokes the corresponding function in `core.js`, passing the workspace root and arguments.
4.  **Core Logic -> MCP Server:** The core function executes and returns the result (or logs output).
5.  **MCP Server -> AI Assistant/Editor:** The MCP server formats the result into a JSON-RPC response (often wrapping it in `{ content: [{ type: 'text', text: '...' }] }`) and sends it back.
6.  **AI Assistant/Editor -> Agent:** The AI assistant presents the result to the agent (or user).

---

### MCP Tool Reference & Agentic Examples

*(Note: The "Agent Prompt" examples below simulate how an agent might instruct the AI assistant.)*

**1. `initProject`**

*   **Description:** Initializes the task manager project.
*   **Parameters:**
    *   `projectName` (string, optional)
    *   `projectDescription` (string, optional)
*   **Example Interaction:**
    *   **Agent Prompt:** "Initialize GMT for this project named 'Autonomous Agent Test' with the goal 'Test agentic task management'."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "initProject"`, `args: {"projectName": "Autonomous Agent Test", "projectDescription": "Test agentic task management."}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Created initial tasks file: /path/to/project/tasks.json\n  Project Name: Autonomous Agent Test\n  Added initial task for: Test agentic task management." }] }`
*   **Agentic Relevance:** Same as CLI `init`.

**2. `addTask`**

*   **Description:** Adds a new task.
*   **Parameters:**
    *   `title` (string, required)
    *   `description` (string, optional)
    *   `priority` (string, optional: low/medium/high)
    *   `dependsOn` (string, optional: comma-separated IDs)
    *   `relatedFiles` (string, optional: comma-separated paths)
*   **Example Interaction:**
    *   **Agent Prompt:** "Add a high priority GMT task titled 'Setup Database Schema' with description 'Define tables for users and items'. Related files are 'db/schema.sql' and 'models/user.js'."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "addTask"`, `args: {"title": "Setup Database Schema", "description": "Define tables for users and items", "priority": "high", "relatedFiles": "db/schema.sql,models/user.js"}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Added new task (ID: 12): \"Setup Database Schema\"" }] }`
*   **Agentic Relevance:** Agent creates tasks via the AI assistant.

**3. `listTasks`**

*   **Description:** Lists tasks, optionally filtered by status.
*   **Parameters:**
    *   `status` (string, optional: todo/inprogress/done/blocked/error)
*   **Example Interaction:**
    *   **Agent Prompt:** "List all 'todo' tasks in GMT."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "listTasks"`, `args: {"status": "todo"}`
    *   **<- MCP Response (Simulated JSON String):** `{ "content": [{ "type": "text", "text": "{\n  \"tasks\": [\n    {\n      \"id\": 10,\n      \"title\": \"Refactor Core Utilities\",\n      ... // other todo tasks \n    }\n    // ... \n  ]\n}" }] }`
*   **Agentic Relevance:** Agent can query the task list, although parsing the JSON response might be more direct than relying on the assistant's summary. Useful for human oversight via the assistant.

**4. `addSubtask`**

*   **Description:** Adds a subtask.
*   **Parameters:**
    *   `parentId` (number, required)
    *   `title` (string, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Add a subtask to task 12 titled 'Create users table'."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "addSubtask"`, `args: {"parentId": 12, "title": "Create users table"}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Added subtask \"Create users table\" (ID: 12.1) to task 12." }] }`
*   **Agentic Relevance:** Agent breaks down tasks.

**5. `updateStatus`**

*   **Description:** Updates task/subtask status.
*   **Parameters:**
    *   `id` (string/number, required)
    *   `newStatus` (string, required: todo/inprogress/done/blocked/error)
    *   `message` (string, optional: Log message)
*   **Example Interaction (Report Error):**
    *   **Agent Prompt:** "Update GMT task 12 status to error with message 'Migration script failed due to syntax error'."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "updateStatus"`, `args: {"id": 12, "newStatus": "error", "message": "Migration script failed due to syntax error."}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Updated status of \"Setup Database Schema\" (ID: 12) to \"error\". Logged: \"Migration script failed due to syntax error.\"" }] }`
*   **Agentic Relevance:** Agent reports progress and errors programmatically via the assistant.

**6. `updateTask`**

*   **Description:** Updates task/subtask details.
*   **Parameters:**
    *   `id` (string/number, required)
    *   `title` (string, optional)
    *   `description` (string, optional, main tasks only)
    *   `priority` (string, optional, main tasks only)
    *   `relatedFiles` (string, optional: comma-separated paths, main tasks only)
    *   `message` (string, optional: Log message)
*   **Example Interaction:**
    *   **Agent Prompt:** "Update GMT task 10: change priority to high, set related files to 'gemini-task-manager/src/core.js, gemini-task-manager/src/utils.js', and add log message 'Re-prioritized based on new dependency'."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "updateTask"`, `args: {"id": 10, "priority": "high", "relatedFiles": "gemini-task-manager/src/core.js, gemini-task-manager/src/utils.js", "message": "Re-prioritized based on new dependency."}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Updated task/subtask \"Refactor Core Utilities\" (ID: 10). Logged: \"Re-prioritized based on new dependency.\"" }] }`
*   **Agentic Relevance:** Agent modifies task details or logs progress without changing status.

**7. `removeTask`**

*   **Description:** Removes a task/subtask.
*   **Parameters:**
    *   `id` (string/number, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Remove GMT task 8."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "removeTask"`, `args: {"id": 8}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Removed task/subtask \"Develop Mobile Feature 2\" (ID: 8)." }] }`
*   **Agentic Relevance:** Agent removes obsolete tasks.

**8. `getNextTask`**

*   **Description:** Gets the next actionable task.
*   **Parameters:** None
*   **Example Interaction:**
    *   **Agent Prompt:** "What is the next GMT task I should work on?"
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "getNextTask"`, `args: {}`
    *   **<- MCP Response (Simulated JSON String or 'null'):** `{ "content": [{ "type": "text", "text": "{\n  \"id\": 10,\n  \"title\": \"Refactor Core Utilities\",\n  ... \n}" }] }`
*   **Agentic Relevance:** Agent asks the assistant to determine the next task.

**9. `generateTaskFiles`**

*   **Description:** Generates Markdown files for tasks.
*   **Parameters:** None
*   **Example Interaction:**
    *   **Agent Prompt:** "Generate the markdown task files for GMT."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "generateTaskFiles"`, `args: {}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Generated 7 task files in the '/path/to/project/tasks' directory." }] }`
*   **Agentic Relevance:** Primarily for human review.

**10. `getContext`**

*   **Description:** Retrieves detailed context for a task/subtask.
*   **Parameters:**
    *   `id` (string/number, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Get the full context for GMT task 10."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "getContext"`, `args: {"id": 10}`
    *   **<- MCP Response (Simulated JSON String):** `{ "content": [{ "type": "text", "text": "{\n  \"id\": 10,\n  \"title\": \"Refactor Core Utilities\",\n  \"description\": \"Improve utility functions\",\n  \"status\": \"todo\",\n  \"priority\": \"high\",\n  \"relatedFiles\": [\"gemini-task-manager/src/core.js\", \"gemini-task-manager/src/utils.js\"],\n  \"activityLog\": [ ... ]\n}" }] }`
*   **Agentic Relevance:** Agent requests detailed context for a task via the assistant.

**11. `parsePrd`**

*   **Description:** Parses PRD using Gemini API.
*   **Parameters:**
    *   `filePath` (string, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Parse the requirements doc at 'docs/app_requirements.md' using GMT."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "parsePrd"`, `args: {"filePath": "docs/app_requirements.md"}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "Attempting to parse PRD: docs/app_requirements.md\n...\nSuccessfully added 15 tasks from PRD: docs/app_requirements.md" }] }`
*   **Agentic Relevance:** Agent uses the assistant to bootstrap tasks from a document.

**12. `expandTask`**

*   **Description:** Expands a task into subtasks using Gemini API.
*   **Parameters:**
    *   `taskId` (string/number, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Expand GMT task 10 into subtasks."
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "expandTask"`, `args: {"taskId": 10}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "DEBUG [readTasks]: ... \nSending task (ID: 10) to Gemini API for expansion...\nSuccessfully generated and added 6 subtask(s) for task 10." }] }`
*   **Agentic Relevance:** Agent delegates task breakdown via the assistant.

**13. `reviseTasks`**

*   **Description:** Revises future tasks using Gemini API based on a prompt.
*   **Parameters:**
    *   `fromTaskId` (string/number, required)
    *   `prompt` (string, required)
*   **Example Interaction:**
    *   **Agent Prompt:** "Revise GMT tasks starting from ID 5 based on this change: 'The UI framework needs to be switched from React to Vue.'"
    *   **-> AI calls MCP Tool:** `tools/run` with `tool: "reviseTasks"`, `args: {"fromTaskId": 5, "prompt": "The UI framework needs to be switched from React to Vue."}`
    *   **<- MCP Response (Simulated):** `{ "content": [{ "type": "text", "text": "DEBUG [readTasks]: ... \nSending future tasks to Gemini API for revision...\nSuccessfully revised tasks from ID 5 onwards based on the prompt." }] }`
*   **Agentic Relevance:** Agent triggers plan adaptation via the assistant.

---

This tutorial provides a foundation for integrating GMT into agentic workflows using either direct CLI execution or the MCP protocol via an AI assistant. Remember to adapt the specific commands and prompts based on your agent's logic and the capabilities of your chosen execution environment. 