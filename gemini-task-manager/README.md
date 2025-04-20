# Gemini Task Manager

A command-line and MCP-compatible task manager inspired by claude-task-master, designed for integration with Cursor and other AI assistants. This tool focuses on core task management functionalities (add, remove, update, list, track). It also includes Gemini API integration for advanced features like PRD parsing, task expansion, and task revision.

## Features

*   **CLI Interface:** Manage tasks directly from the command line.
*   **MCP Server:** Integrate with editors like Cursor via the Model Control Protocol, featuring improved error handling and argument validation.
*   **Cursor Rules:** Includes rules (`.cursor/rules/task_manager_workflow.mdc`) to guide Cursor's AI on how to interact with the tool.
*   **Task Management:** Add, list, update status/details, find next, remove tasks/subtasks.
*   **Gemini Integration:**
    *   Parse Product Requirement Documents (`parse-prd`).
    *   Expand high-level tasks into subtasks (`expand`).
    *   Revise existing tasks based on new prompts (`revise`).
*   **Workspace Detection:** Robust workspace root detection using command-line args, environment variables, or a project-specific config file (`.task_manager/config.json`) for easier standalone server usage.
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
*   Create a `.cursor/rules/task_manager_workflow.mdc` file (if it doesn't exist) to guide Cursor's AI.
*   Attempt to create a `.task_manager/config.json` file to store the workspace path for future MCP server runs (see Workspace Detection).

## Configuration (Gemini API Key)

The `parse-prd`, `expand`, and `revise` commands require a Google Gemini API key.

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
# Initialize (if not done yet)
task-manager init --project-name "My Project" --project-description "My goal"

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

# Update task 1's status to 'inprogress' with a message
task-manager status 1 inprogress -m "Started working on auth"

# Update subtask 1.1's status to 'done'
task-manager status 1.1 done

# Update task 1's title and related files
task-manager update 1 --title "Implement full user authentication" --related-files "src/auth.js,src/user.js"

# Remove subtask 1.1
task-manager remove 1.1

# Generate individual task files in ./tasks/
task-manager generate

# --- Gemini Commands (require .env setup) ---

# Parse a PRD file
task-manager parse-prd ./path/to/your/prd.md

# Expand task 1 into subtasks
task-manager expand 1

# Revise tasks starting from ID 5 based on a prompt
task-manager revise --from 5 -p "Refactor database logic to use ORM"
```

## Cursor Integration / MCP Server

The MCP server allows AI assistants like Cursor to interact with the task manager programmatically.

### Workspace Root Detection for MCP Server

The `task-manager-mcp` server needs to know the workspace root directory to find `tasks.json`. It uses the following methods in order:

1.  **`--workspaceRoot` Argument:** Pass the path when starting the server (e.g., `task-manager-mcp --workspaceRoot /path/to/project`).
2.  **Environment Variables:** Checks `CURSOR_WORKSPACE_ROOT`, `VSCODE_WORKSPACE_FOLDER`, `WORKSPACE_FOLDER`.
3.  **`.task_manager/config.json` File:** If the server is started *from the workspace root directory*, it will look for this file (created/updated by `init` or previous successful runs) and read the path from it. This is the recommended way for standalone usage after initial setup.
4.  **`initialize` Parameters:** As a final fallback, it tries to parse the root path from the `initialize` request sent by the client (less reliable).

### Configuration in Cursor

1.  Ensure `gemini-task-manager` is installed globally (e.g., via `npm link` or `npm i -g .`) or available in your project's `node_modules`.
2.  **Configure Cursor MCP:**
    *   Go to Cursor Settings -> MCP.
    *   Click "Add New MCP Server".
    *   Use the following configuration:

        ```json
        {
          "name": "gemini-task-manager", 
          "command": "task-manager-mcp", // Assumes linked/installed globally
          "args": [
            // Add --workspaceRoot if needed, otherwise rely on config/env/init
            // "--workspaceRoot",
            // "${workspaceFolderBasename}" // Or the full path variable
          ],
          "env": {
             // GEMINI_API_KEY will be inherited from your shell environment
          }
        }
        ```
        *Note:* If you didn't link `task-manager-mcp` globally, you might need to use `npx task-manager-mcp` in the `command`/`args`.
    *   Save the configuration.
3.  **Enable the MCP Server** in Cursor's AI settings.
4.  **Interact:** Use natural language in Cursor's chat. The AI will use the MCP server based on the rules defined in `.cursor/rules/task_manager_workflow.mdc`.
    *   "Initialize task manager."
    *   "Parse the PRD at `docs/prd.txt`."
    *   "What's the next task?"
    *   "Mark task 2 as done."

### Rules Only (CLI Interaction)

If you don't set up the MCP server, Cursor can still use the tool by running the CLI commands directly in its integrated terminal, guided by the `.cursor/rules/task_manager_workflow.mdc` file.

1.  Ensure `task-manager` is globally available in your PATH (`npm link` or `npm i -g .`).
2.  The `task-manager init` command should have created the `.cursor/rules/task_manager_workflow.mdc` file.
3.  Interact with Cursor's AI using natural language. It will attempt to execute the `task-manager` commands in the terminal based on the rules file.

## Project Structure

```
gemini-task-manager/
├── .cursor/                  # Cursor specific files
│   └── rules/
│       └── task_manager_workflow.mdc
├── .task_manager/            # Task manager config (created automatically)
│   └── config.json 
├── bin/                      # Executable scripts
│   ├── task-manager
│   └── task-manager-mcp
├── src/                      # Source code
│   ├── cli.js                # CLI command definitions
│   ├── core.js               # Core task logic
│   ├── mcp_server.js         # MCP server implementation
│   └── prd_parser.js         # Gemini API interaction
├── docs/                     # Documentation (if added)
│   └── tutorial.md
├── tasks/                    # Generated task files (created by 'generate') 
├── package.json
├── tasks.json                # Main task data file (created by 'init')
├── sample_prd.md           # Sample PRD file (created during tests)
├── .env                      # Gemini API Key (created from .env.example)
├── .env.example
├── .gitignore
└── README.md
```

## Troubleshooting

### "Read-only file system" or "Cannot write to root directory" Error

If you encounter errors like:
```
Error executing tool initProject: Failed to write tasks file /tasks.json: EROFS: read-only file system, open '/tasks.json'
```

The problem is that the workspace root is being incorrectly detected as the filesystem root (`/`), which is read-only on macOS and most Unix-like systems.

#### Solutions:

1. **Use the updated server code:** The latest version (0.1.1+) contains fixes to properly detect the workspace root from the script location.

2. **Set workspace root explicitly:**
   ```bash
   # Run the server with an explicit workspace root:
   npm run start:gtm-mcp
   ```
   This uses the new npm script that passes your current directory as the workspace root.

3. **Set environment variable:**
   ```bash
   # Set the workspace root environment variable:
   export GTM_WORKSPACE_ROOT=$(pwd)
   # Then run the server:
   node ./bin/gtm-mcp-server.js
   ```

4. **Configure Cursor MCP correctly:**
   When configuring the MCP server in Cursor, make sure to use:
   ```json
   {
     "name": "gemini-task-manager", 
     "command": "task-manager-mcp", 
     "args": [
       "--workspaceRoot",
       "${workspaceFolder}"
     ]
   }
   ```
   The `${workspaceFolder}` should be automatically expanded by Cursor to the actual workspace path.

## Contributing

(Add contribution guidelines if desired)

## License

(Specify license, e.g., ISC as per package.json)
