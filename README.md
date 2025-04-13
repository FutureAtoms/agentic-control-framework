# Gemini Task Manager

A command-line and MCP-compatible task manager inspired by claude-task-master, designed for integration with Cursor. This tool focuses on core task management functionalities (add, remove, update, list, track) without relying on AI for these operations. PRD parsing utilizes the Gemini API.

## Features

*   **CLI Interface:** Manage tasks directly from the command line.
*   **MCP Server:** Integrate with editors like Cursor via the Model Control Protocol.
*   **Cursor Rules:** Includes rules (`.cursor/rules/task_manager_workflow.mdc`) to guide Cursor's AI on how to interact with the tool.
*   **Task Management:**
    *   Initialize project (`init`)
    *   Add tasks and subtasks (`add`, `add-subtask`)
    *   List tasks (`list`) with filtering options
    *   Show next task (`next`) based on dependencies and priority
    *   Update task/subtask status (`status`)
    *   Update task/subtask details (`update`)
    *   Remove tasks/subtasks (`remove`)
*   **PRD Parsing (Gemini):** Parse Product Requirement Documents using the Gemini API (`parse-prd`). (Requires API key configuration).
*   **Task File Generation:** Optionally generate individual files for each task (`generate`).
*   **Data Storage:** Uses a simple `tasks.json` file for storing task data.

## Planned CLI Commands

*   `task-manager init`: Sets up `tasks.json` and `.cursor` rules.
*   `task-manager add --title "..." [--description "..."] [--priority high|medium|low] [--depends-on ID]`: Adds a new task.
*   `task-manager add-subtask <task-id> --title "..."`: Adds a subtask to a specific task.
*   `task-manager list [--status todo|inprogress|done|...]`: Lists tasks, optionally filtering by status.
*   `task-manager next`: Determines and displays the next actionable task.
*   `task-manager status <task-or-subtask-id> <new-status>`: Updates the status of a task or subtask.
*   `task-manager update <task-or-subtask-id> --title "..." [--description "..."] [--priority ...]`: Updates details of a task or subtask.
*   `task-manager remove <task-or-subtask-id>`: Deletes a task or subtask.
*   `task-manager parse-prd <prd-file-path>`: Parses the specified PRD file using the configured Gemini API.
*   `task-manager generate`: Creates individual task files in a `tasks/` directory based on `tasks.json`.

## Project Structure

```
gemini-task-manager/
├── .cursor/
│   └── rules/
│       └── task_manager_workflow.mdc
├── bin/
│   ├── task-manager
│   └── task-manager-mcp
├── src/
│   ├── cli.js
│   ├── core.js
│   ├── mcp_server.js
│   └── prd_parser.js
├── templates/
│   └── initial_tasks.json
├── docs/
│   └── tutorial.md
├── package.json
├── tasks.json  (created by 'init')
└── README.md
```

## Getting Started

_(Instructions TBD)_

## Configuration

_(Details on configuring Gemini API key TBD)_
