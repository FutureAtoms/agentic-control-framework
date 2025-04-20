#!/usr/bin/env node

// A complete rebuild of the GTM MCP server based on our working minimal server
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const url = require('url'); // Needed for parsing file URIs

// Fix: Correct the require path for core.js with a relative path
const core = require('../src/core'); // Require the GTM core logic

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Get workspace root - First try command line args, then environment variable, then hardcoded fallback
let currentWorkspaceRoot = null; 
let rootSource = 'unknown'; // Track how the root was determined

const wsArgIndex = process.argv.indexOf('--workspaceRoot');
if (wsArgIndex !== -1 && process.argv.length > wsArgIndex + 1) {
    const argValue = process.argv[wsArgIndex + 1];
    // Check if Cursor failed to substitute the variable
    if (argValue === '${workspaceFolder}') {
        console.error('[WARN] --workspaceRoot argument was literally "${workspaceFolder}".');
        // Do not set currentWorkspaceRoot here, let env var try
    } else {
        currentWorkspaceRoot = argValue;
        rootSource = 'argument';
        console.error(`[INFO] Using workspace root from --workspaceRoot arg: ${currentWorkspaceRoot}`);
    }
} else {
    console.error('[INFO] --workspaceRoot argument not provided or missing value.');
}

// If workspace root not determined from args, try environment variable
if (!currentWorkspaceRoot && process.env.GTM_WORKSPACE_ROOT) {
    console.error(`[INFO] Attempting to use GTM_WORKSPACE_ROOT environment variable.`);
    const envValue = process.env.GTM_WORKSPACE_ROOT;
    if (envValue && typeof envValue === 'string' && envValue.trim() !== '') {
         currentWorkspaceRoot = envValue.trim();
         rootSource = 'environment';
         console.error(`[INFO] Using workspace root from GTM_WORKSPACE_ROOT env var: ${currentWorkspaceRoot}`);
    } else {
         console.error('[WARN] GTM_WORKSPACE_ROOT environment variable is empty or invalid.');
    }
}

// NEW: If workspace root still not determined, use the script directory's parent path
if (!currentWorkspaceRoot) {
    console.error('[INFO] Attempting to determine workspace root from script location.');
    // Get the directory containing the script
    const scriptDir = path.dirname(require.main.filename);
    // Go up to the workspace root (assuming bin/ is in project root)
    const projectRoot = path.resolve(scriptDir, '..');
    currentWorkspaceRoot = projectRoot;
    rootSource = 'script-location';
    console.error(`[INFO] Using script location to determine workspace root: ${currentWorkspaceRoot}`);
}

// Final fallback to working directory if all else fails
if (!currentWorkspaceRoot) {
    console.error('[INFO] Attempting to use current working directory as workspace root.');
    // Use process.cwd() as last resort
    currentWorkspaceRoot = process.cwd();
    rootSource = 'cwd-fallback';
    console.error(`[INFO] Using current working directory as workspace root: ${currentWorkspaceRoot}`);
}

// Final check and fatal error if no root could be determined
if (!currentWorkspaceRoot) {
    console.error('[FATAL] Workspace root could not be determined from arguments, environment variables, or fallback path. Server cannot function.');
    // Optionally exit here if preferred: process.exit(1);
} else {
    console.error(`[INFO] Final workspace root set via ${rootSource}: ${currentWorkspaceRoot}`);
}

// Basic request counter for generating unique IDs in our responses
let requestCounter = 1;

// Function to send JSON-RPC response
function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id || 0,  // Ensure id is never undefined, default to 0
    result: result
  };
  console.log(JSON.stringify(response));
}

// Function to send JSON-RPC error
function sendError(id, code, message, data = {}) {
  const response = {
    jsonrpc: '2.0',
    id: id || 0,  // Ensure id is never undefined, default to 0
    error: {
      code: code,
      message: message,
      data: data
    }
  };
  console.log(JSON.stringify(response));
}

// Handle incoming lines from stdin (JSON-RPC requests)
rl.on('line', async (line) => {
  let requestId = null; // Store ID for error handling
  try {
    // Log to stderr - stdout is reserved for JSON-RPC responses
    console.error(`[DEBUG] Received request: ${line}`);
    
    // Parse the request
    const request = JSON.parse(line);
    const { id, method, params } = request;
    requestId = id; // Store the ID
    
    console.error(`[DEBUG] Parsed request - Method: ${method}, ID: ${id}`);
    
    // Handle different method types
    switch (method) {
      case 'initialize':
        console.error('[DEBUG] Handling initialize request');
        // No need to determine workspace here anymore
        
        // Respond immediately
        sendResponse(id, {
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'gemini-task-manager',
            version: '0.1.0'
          },
          protocolVersion: params?.protocolVersion || '2.0.0'
        });
        break;

      case 'notifications/initialized':
        console.error('[DEBUG] Handling notifications/initialized');
        // No response needed for notifications
        break;
        
      case 'tools/list':
        // Respond with GTM tools
        console.error('[DEBUG] Handling tools/list request');
        sendResponse(id, {
          tools: [
            {
              name: 'initProject',
              description: 'Initializes the task manager project.',
              inputSchema: {
                type: 'object',
                properties: {
                  projectName: { type: 'string', description: 'Optional name for the project.' },
                  projectDescription: { type: 'string', description: 'Optional goal or description for the project.' }
                }
              }
            },
            {
              name: 'addTask',
              description: 'Adds a new task to the task list.',
              inputSchema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'The title of the task.' },
                  description: { type: 'string', description: 'Optional description for the task.' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Optional priority (low, medium, high). Defaults to medium.' },
                  dependsOn: { type: 'string', description: 'Optional comma-separated string of task IDs it depends on.' },
                  relatedFiles: { type: 'string', description: 'Optional comma-separated string of relevant file paths.' }
                },
                required: ['title']
              }
            },
            {
              name: 'addSubtask',
              description: 'Adds a subtask to a specified parent task.',
              inputSchema: {
                type: 'object',
                properties: {
                  parentId: { type: 'number', description: 'The ID of the parent task.' },
                  title: { type: 'string', description: 'The title of the subtask.' },
                },
                required: ['parentId', 'title']
              }
            },
            {
              name: 'listTasks',
              description: 'Lists tasks, optionally filtered by status.',
              inputSchema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['todo', 'inprogress', 'done', 'blocked', 'error'], description: 'Optional status to filter by.' }
                }
              }
            },
            {
              name: 'updateStatus',
              description: 'Updates the status of a task or subtask.',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'The ID of the task or subtask (e.g., 1 or 1.1).' },
                  newStatus: { type: 'string', enum: ['todo', 'inprogress', 'done', 'blocked', 'error'], description: 'The new status.' },
                  message: { type: 'string', description: 'Optional message to add to the activity log.' }
                },
                required: ['id', 'newStatus']
              }
            },
            {
              name: 'getNextTask',
              description: 'Gets the next actionable task based on status, dependencies, and priority.',
              inputSchema: { 
                type: 'object', 
                properties: {} 
              }
            },
            {
              name: 'updateTask',
              description: 'Updates the details of a task or subtask.',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'The ID of the task or subtask.' },
                  title: { type: 'string', description: 'Optional new title.' },
                  description: { type: 'string', description: 'Optional new description (applies to main tasks).' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Optional new priority (applies to main tasks).' },
                  relatedFiles: { type: 'string', description: 'Optional comma-separated string of relevant file paths (replaces existing).' },
                  message: { type: 'string', description: 'Optional message to add to the activity log.' }
                },
                required: ['id']
              }
            },
            {
              name: 'removeTask',
              description: 'Removes a task or subtask by its ID.',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'The ID of the task or subtask to remove.' }
                },
                required: ['id']
              }
            },
            {
              name: 'getContext',
              description: 'Retrieves detailed context for a specific task or subtask.',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'The ID of the task or subtask (e.g., 1 or 1.1).' }
                },
                required: ['id']
              }
            },
            // NEW TOOLS
            {
              name: 'generateTaskFiles',
              description: 'Generates individual Markdown files for each task in the tasks/ directory.',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            },
            {
              name: 'parsePrd',
              description: 'Parses a Product Requirements Document (PRD) file using the Gemini API to generate tasks.',
              inputSchema: {
                type: 'object',
                properties: {
                  filePath: { type: 'string', description: 'Path to the PRD file to parse.' }
                },
                required: ['filePath']
              }
            },
            {
              name: 'expandTask',
              description: 'Uses the Gemini API to break down a task into subtasks (overwrites existing subtasks).',
              inputSchema: {
                type: 'object',
                properties: {
                  taskId: { type: 'string', description: 'The ID of the task to expand.' }
                },
                required: ['taskId']
              }
            },
            {
              name: 'reviseTasks',
              description: 'Uses the Gemini API to revise future tasks based on a prompt/change, starting from a specific task ID.',
              inputSchema: {
                type: 'object',
                properties: {
                  fromTaskId: { type: 'string', description: 'Task ID from which revision should start.' },
                  prompt: { type: 'string', description: 'User prompt describing the change.' }
                },
                required: ['fromTaskId', 'prompt']
              }
            }
          ]
        });
        break;
        
      case 'tools/run':
      case 'tools/call':
        // Handle running tools
        console.error(`[DEBUG] Handling ${method} request`);
        
        // CRITICAL: Check if workspaceRoot was determined
        if (!currentWorkspaceRoot) {
             console.error("[FATAL] Workspace root not determined. Cannot execute tools. Check server startup logs.");
             // Use the stored requestId for the error response
             sendError(requestId, -32001, "Server Configuration Error", { message: "Workspace root could not be determined. Check server startup logs." });
             return; // Stop processing if workspace is unknown
        }
        
        // Normalize the parameters format
        let toolName, toolArgs;
        
        if (method === 'tools/call' && params?.name) {
          // Convert tools/call format to tools/run format
          toolName = params.name;
          toolArgs = params.arguments || {};
          console.error(`[DEBUG] Converting tools/call format: name=${toolName}`);
        } else {
          // Standard tools/run format
          toolName = params?.tool;
          toolArgs = params?.args || {};
        }
        
        console.error(`[DEBUG] Tool: ${toolName}, Args: ${JSON.stringify(toolArgs)}, Workspace: ${currentWorkspaceRoot}`);
        
        // Execute the corresponding core function based on tool name
        try {
          let result = { success: false, message: 'Tool not found' };
          
          switch (toolName) {
            case 'initProject':
              await core.initProject(currentWorkspaceRoot, toolArgs);
              result = { success: true, message: "Project initialized successfully." };
              break;
              
            case 'addTask':
              result = core.addTask(currentWorkspaceRoot, toolArgs);
              break;
              
            case 'listTasks':
              const listResult = core.listTasks(currentWorkspaceRoot, toolArgs);
              const tasks = listResult.tasks || []; // Ensure tasks is an array
              result = { success: true, message: `Found ${tasks.length} tasks.`, data: tasks };
              break;
              
            case 'addSubtask':
              {
                const parentId = toolArgs.parentId;
                const title = toolArgs.title;
                result = core.addSubtask(currentWorkspaceRoot, parentId, { title });
              }
              break;
              
            case 'updateStatus':
              {
                const { id: statusId, newStatus, message } = toolArgs; // Renamed id to avoid conflict
                result = core.updateStatus(currentWorkspaceRoot, statusId, newStatus, message);
              }
              break;
              
            case 'getNextTask':
              {
                const nextTask = core.getNextTask(currentWorkspaceRoot);
                result = { 
                  success: true, 
                  message: nextTask ? `Next task: ${nextTask.id} - ${nextTask.title}` : "No actionable tasks found.",
                  data: nextTask 
                };
              }
              break;
              
            case 'updateTask':
              {
                const { id: updateId, ...updateOptions } = toolArgs; // Renamed id
                result = core.updateTask(currentWorkspaceRoot, updateId, updateOptions);
              }
              break;
              
            case 'removeTask':
              {
                const { id: removeId } = toolArgs; // Renamed id
                result = core.removeTask(currentWorkspaceRoot, removeId);
              }
              break;
              
            case 'getContext':
              {
                const { id: contextId } = toolArgs; // Renamed id
                const contextData = core.getContext(currentWorkspaceRoot, contextId);
                result = { success: true, message: `Retrieved context for item ${contextId}.`, data: contextData };
              }
              break;
              
            // NEW TOOL HANDLERS
            case 'generateTaskFiles':
              {
                try {
                  const fileResult = core.generateTaskFiles(currentWorkspaceRoot);
                  result = { success: true, message: fileResult.message || "Task files generated successfully." };
                } catch (error) {
                  result = { success: false, message: `Error generating task files: ${error.message}` };
                }
              }
              break;
              
            case 'parsePrd':
              {
                const { filePath } = toolArgs;
                try {
                  const prdResult = await core.parsePrd(currentWorkspaceRoot, filePath);
                  result = { success: true, message: prdResult.message || "PRD parsed successfully." };
                } catch (error) {
                  result = { success: false, message: `Error parsing PRD: ${error.message}` };
                }
              }
              break;
              
            case 'expandTask':
              {
                const { taskId } = toolArgs;
                try {
                  const expandResult = await core.expandTask(currentWorkspaceRoot, taskId);
                  result = { success: true, message: expandResult.message || "Task expanded successfully." };
                } catch (error) {
                  result = { success: false, message: `Error expanding task: ${error.message}` };
                }
              }
              break;
              
            case 'reviseTasks':
              {
                const { fromTaskId, prompt } = toolArgs;
                try {
                  // Add debug log here
                  console.error(`DEBUG [MCP Server]: Calling core.reviseTasks with options: ${JSON.stringify({ fromTaskId, prompt })}`);
                  const reviseResult = await core.reviseTasks(currentWorkspaceRoot, { fromTaskId, prompt });
                  result = { success: true, message: reviseResult.message || "Tasks revised successfully." };
                } catch (error) {
                  result = { success: false, message: `Error revising tasks: ${error.message}` };
                }
              }
              break;
              
            default:
              sendError(id, -32601, `Unknown tool: ${toolName}`);
              return;
          }
          
          // Format the response based on the result
          let responseText;
          
          if (result.success) {
            if (toolName === 'listTasks' || toolName === 'getContext' || toolName === 'getNextTask') {
              responseText = JSON.stringify(result.data, null, 2);
            } else {
              responseText = result.message;
            }
            
            sendResponse(id, {
              content: [{ type: 'text', text: responseText }]
            });
          } else {
            sendError(id, -32000, result.message || "Unknown error");
          }
        } catch (error) {
          console.error(`[ERROR] Error executing tool ${toolName}:`, error);
          sendError(id, -32000, `Error executing tool ${toolName}: ${error.message}`);
        }
        break;
        
      default:
        // Handle unknown methods
        console.error(`[DEBUG] Unknown method: ${method}`);
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    // Handle parsing errors or other exceptions
    console.error(`[ERROR] Error processing request: ${error.message}`);
    // Use the stored requestId for error reporting
    sendError(requestId, -32700, 'Parse error', { message: error.message }); 
  }
});

// Indicate the server is ready on stderr (doesn't affect stdout for JSON-RPC)
console.error('GTM Rebuilt MCP Server listening...'); 