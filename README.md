# Gemini Task Manager

A command-line and MCP-compatible task manager inspired by claude-task-master, designed for integration with Cursor. This tool focuses on core task management functionalities (add, remove, update, list, track) without relying on AI for these operations. PRD parsing utilizes the Gemini API.

## Features

*   **CLI Interface:** Manage tasks directly from the command line.
*   **MCP Server:** Integrate with editors like Cursor via the Model Control Protocol.
*   **Cursor Rules:** Includes rules (`.cursor/rules/task_manager_workflow.mdc`) to guide Cursor's AI on how to interact with the tool.
*   **Task Management:** Add, list, update status/details, find next, remove tasks/subtasks.
*   **PRD Parsing (Gemini):** Parse Product Requirement Documents using the Gemini API (`parse-prd`).
*   **Task File Generation:** Generate individual Markdown files for tasks (`generate`).
*   **Data Storage:** Uses a simple `tasks.json` file.

## Installation

You can make the `task-manager` command available system-wide or use it directly within your project.

### Option 1: System-Wide (using npm link for development)

This is useful for accessing the `task-manager` command from any directory during development.

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/FutureAtoms/Gemini-task-man-mcp.git
    cd Gemini-task-man-mcp
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Link the package:**
    ```bash
    npm link
    ```
    This creates a symbolic link, making `task-manager` and `task-manager-mcp` globally available, pointing to your local code.

### Option 2: Local Project Usage (using npx)

If you prefer not to install it globally, you can run it directly using `npx` from within the project directory after installing dependencies:

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/FutureAtoms/Gemini-task-man-mcp.git
    cd Gemini-task-man-mcp
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run commands using `npx`:**
    ```bash
    npx task-manager <command> [options]
    # e.g., npx task-manager list
    ```
    Or run directly from `./bin`: `./bin/task-manager <command> [options]`

## Initial Setup

Once installed or linked, navigate to your project directory where you want to manage tasks and initialize the task manager:

```bash
# If globally linked:
task-manager init

# If using npx:
npx task-manager init
```

This will:
*   Create a `tasks.json` file to store your tasks.
*   Create a `.cursor/rules/task_manager_workflow.mdc` file to guide Cursor's AI.

## Configuration (Gemini API Key)

The `parse-prd` command requires a Google Gemini API key.

1.  **Copy the example env file:**
    ```bash
    cp .env.example .env
    ```
2.  **Edit the `.env` file:** Open the newly created `.env` file and replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key.
3.  **Add `.env` to `.gitignore`:** Ensure your API key is not committed to version control. The included `.gitignore` file should already handle this, but double-check or run:
    ```bash
    echo ".env" >> .gitignore
    ```

## Usage (CLI Examples)

Here are some common commands (run from your project directory):

```bash
# Add a task
task-manager add -t "Implement user auth" -p high

# Add a subtask to task 1
task-manager add-subtask 1 -t "Design login UI"

# List all tasks
task-manager list

# List only 'todo' tasks
task-manager list -s todo

# Show the next actionable task
task-manager next

# Update task 1's status to 'inprogress'
task-manager status 1 inprogress

# Update subtask 1.1's status to 'done'
task-manager status 1.1 done

# Update task 1's title
task-manager update 1 --title "Implement full user authentication"

# Remove subtask 1.1
task-manager remove 1.1

# Generate individual task files in ./tasks/
task-manager generate

# Parse a PRD file (requires .env setup)
task-manager parse-prd ./path/to/your/prd.txt
```

## Cursor Integration

There are two main ways to integrate with Cursor:

### Option 1: Using MCP Server (Recommended)

This provides the most seamless integration.

1.  Ensure `gemini-task-manager` is installed globally (e.g., via `npm link` or `npm i -g .`) or available in your project's `node_modules`.
2.  **Configure Cursor MCP:**
    *   Go to Cursor Settings -> MCP.
    *   Click "Add New MCP Server".
    *   Use the following configuration:

        ```json
        {
          "name": "gemini-task-manager", // Or your preferred name
          "command": "npx",
          "args": [
            "task-manager-mcp"
          ],
          "env": {
             // GEMINI_API_KEY will be inherited from your shell environment
             // or you can explicitly set it here if needed:
             // "GEMINI_API_KEY": "YOUR_KEY_HERE"
          }
        }
        ```
    *   Save the configuration.
3.  **Enable the MCP Server** in Cursor's AI settings.
4.  **Interact:** Use natural language in Cursor's chat. The AI will use the MCP server based on the rules defined in `.cursor/rules/task_manager_workflow.mdc`.
    *   "Initialize task manager."
    *   "Parse the PRD at `docs/prd.txt`."
    *   "What's the next task?"
    *   "Mark task 2 as done."

### Option 2: Using Rules Only (CLI Interaction)

If you don't set up the MCP server, Cursor can still use the tool by running the CLI commands directly in its integrated terminal, guided by the `.cursor/rules/task_manager_workflow.mdc` file.

1.  Ensure `task-manager` is globally available in your PATH (`npm link` or `npm i -g .`).
2.  The `task-manager init` command should have created the `.cursor/rules/task_manager_workflow.mdc` file.
3.  Interact with Cursor's AI using natural language. It will attempt to execute the `task-manager` commands in the terminal based on the rules file.

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

## Contributing

(Add contribution guidelines if desired)

## License

(Specify license, e.g., ISC as per package.json)
