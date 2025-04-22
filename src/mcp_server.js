#!/usr/bin/env node

// Agentic Control Framework MCP server implementation
// This server provides a JSON-RPC interface for Cursor to communicate with ACF
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const logger = require('./logger'); // Import our logger

// Import the core functionality
const core = require('./core');

// Create readline interface for JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle errors in readline
rl.on('error', (err) => {
  logger.error(`Readline interface error: ${err.message}`);
});

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

// Parse command line arguments and set workspace
// We'll provide a better default than '/' if workspaceRoot is not provided
let workspaceRoot = process.argv.find((arg, i, arr) => 
  (arg === '--workspaceRoot' || arg === '-w') && i < arr.length - 1
) ? process.argv[process.argv.findIndex(arg => 
    arg === '--workspaceRoot' || arg === '-w'
  ) + 1] : (process.env.WORKSPACE_ROOT || process.cwd());

// Ensure workspace root is never just '/' which causes issues
if (!workspaceRoot || workspaceRoot === '/') {
  workspaceRoot = process.cwd();
  logger.info(`Invalid workspace root. Using current directory: ${workspaceRoot}`);
}

logger.info(`Starting server with workspace root: ${workspaceRoot}`);

// Counter for generating unique request IDs
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
    logger.debug(`Received request: ${line}`);
    
    // Parse the request
    const request = JSON.parse(line);
    const { id, method, params } = request;
    requestId = id; // Store the ID
    
    logger.debug(`Parsed request - Method: ${method}, ID: ${id}`);
    
    // Handle different method types
    switch (method) {
      case 'initialize':
        logger.debug('Handling initialize request');
        
        // Respond immediately
        sendResponse(id, {
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'agentic-control-framework',
            version: '0.1.0'
          },
          protocolVersion: params?.protocolVersion || '2.0.0'
        });
        break;

      case 'notifications/initialized':
        logger.debug('Handling notifications/initialized');
        // No response needed for notifications
        break;
        
      case 'tools/list':
        // Respond with ACF tools
        logger.debug('Handling tools/list request');
        sendResponse(id, {
          tools: [
            {
              name: 'setWorkspace',
              description: 'Sets the workspace directory for the task manager.',
              inputSchema: {
                type: 'object',
                properties: {
                  workspacePath: { type: 'string', description: 'The path to the workspace directory.' }
                },
                required: ['workspacePath']
              }
            },
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
                properties: {
                  random_string: { type: 'string', description: 'Dummy parameter for no-parameter tools' }
                },
                required: ['random_string']
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
            {
              name: 'generateTaskFiles',
              description: 'Generates individual Markdown files for each task in the tasks/ directory.',
              inputSchema: {
                type: 'object',
                properties: {
                  random_string: { type: 'string', description: 'Dummy parameter for no-parameter tools' }
                },
                required: ['random_string']
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
        logger.debug(`Handling tools/run or tools/call request with tool: ${params?.name || 'undefined'}`);
        // Forward to appropriate tool handler
        if (!params || !params.name) {
          sendError(id, -32602, 'Invalid params: tool name is required');
          return;
        }
        
        // Sanitize tool name by removing any prefix (e.g., "gemini-task-manager_")
        const toolName = params.name.includes('_') ? params.name.split('_').pop() : params.name;
        const toolArgs = params.arguments || {};
        
        logger.debug(`Processing tool ${toolName} with args: ${JSON.stringify(toolArgs)}`);
        
        try {
          // Handle different tools
          switch (toolName) {
            case 'setWorkspace':
              if (!toolArgs.workspacePath) {
                sendError(id, -32602, 'Invalid params: workspacePath is required');
                return;
              }
              
              // Validate path exists
              if (!fs.existsSync(toolArgs.workspacePath)) {
                sendError(id, -32602, `Invalid params: workspacePath does not exist: ${toolArgs.workspacePath}`);
                return;
              }
              
              // Set the new workspace root
              workspaceRoot = toolArgs.workspacePath;
              logger.info(`Workspace root set to: ${workspaceRoot}`);
              sendResponse(id, { success: true, message: `Workspace set to: ${workspaceRoot}` });
              break;
            
            case 'initProject':
              try {
                const result = core.initProject(workspaceRoot, toolArgs);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error initializing project: ${error.message}`);
                sendError(id, -32603, `Error initializing project: ${error.message}`);
              }
              break;
              
            case 'addTask':
              try {
                if (!toolArgs.title) {
                  sendError(id, -32602, 'Invalid params: title is required');
                  return;
                }
                
                const result = core.addTask(workspaceRoot, toolArgs);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error adding task: ${error.message}`);
                sendError(id, -32603, `Error adding task: ${error.message}`);
              }
              break;
              
            case 'addSubtask':
              try {
                if (!toolArgs.parentId || !toolArgs.title) {
                  sendError(id, -32602, 'Invalid params: parentId and title are required');
                  return;
                }
                
                const result = core.addSubtask(workspaceRoot, toolArgs.parentId, {
                  title: toolArgs.title
                });
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error adding subtask: ${error.message}`);
                sendError(id, -32603, `Error adding subtask: ${error.message}`);
              }
              break;
              
            case 'listTasks':
              try {
                const result = core.listTasks(workspaceRoot, toolArgs);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error listing tasks: ${error.message}`);
                sendError(id, -32603, `Error listing tasks: ${error.message}`);
              }
              break;
              
            case 'updateStatus':
              try {
                if (!toolArgs.id || !toolArgs.newStatus) {
                  sendError(id, -32602, 'Invalid params: id and newStatus are required');
                  return;
                }
                
                const result = core.updateStatus(workspaceRoot, toolArgs.id, toolArgs.newStatus, toolArgs.message || '');
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error updating status: ${error.message}`);
                sendError(id, -32603, `Error updating status: ${error.message}`);
              }
              break;
              
            case 'getNextTask':
              try {
                const result = core.getNextTask(workspaceRoot);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error getting next task: ${error.message}`);
                sendError(id, -32603, `Error getting next task: ${error.message}`);
              }
              break;
              
            case 'updateTask':
              try {
                if (!toolArgs.id) {
                  sendError(id, -32602, 'Invalid params: id is required');
                  return;
                }
                
                const result = core.updateTask(workspaceRoot, toolArgs.id, toolArgs);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error updating task: ${error.message}`);
                sendError(id, -32603, `Error updating task: ${error.message}`);
              }
              break;
              
            case 'removeTask':
              try {
                if (!toolArgs.id) {
                  sendError(id, -32602, 'Invalid params: id is required');
                  return;
                }
                
                const result = core.removeTask(workspaceRoot, toolArgs.id);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error removing task: ${error.message}`);
                sendError(id, -32603, `Error removing task: ${error.message}`);
              }
              break;
              
            case 'getContext':
              try {
                if (!toolArgs.id) {
                  sendError(id, -32602, 'Invalid params: id is required');
                  return;
                }
                
                const result = core.getContext(workspaceRoot, toolArgs.id);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error getting context: ${error.message}`);
                sendError(id, -32603, `Error getting context: ${error.message}`);
              }
              break;
              
            case 'generateTaskFiles':
              try {
                const result = core.generateTaskFiles(workspaceRoot);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error generating task files: ${error.message}`);
                sendError(id, -32603, `Error generating task files: ${error.message}`);
              }
              break;
              
            case 'parsePrd':
              try {
                if (!toolArgs.filePath) {
                  sendError(id, -32602, 'Invalid params: filePath is required');
                  return;
                }
                
                // Get absolute path - if provided path is relative, resolve it against workspaceRoot
                const prdPath = path.isAbsolute(toolArgs.filePath) 
                  ? toolArgs.filePath 
                  : path.resolve(workspaceRoot, toolArgs.filePath);
                
                // Check if file exists
                if (!fs.existsSync(prdPath)) {
                  sendError(id, -32602, `Invalid params: PRD file does not exist: ${prdPath}`);
                  return;
                }
                
                // parsePrd is async so we need to await it
                logger.info(`Parsing PRD file: ${prdPath}`);
                const result = await core.parsePrd(workspaceRoot, prdPath);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error parsing PRD: ${error.message}`);
                sendError(id, -32603, `Error parsing PRD: ${error.message}`);
              }
              break;
              
            case 'expandTask':
              try {
                if (!toolArgs.taskId) {
                  sendError(id, -32602, 'Invalid params: taskId is required');
                  return;
                }
                
                // expandTask is async so we need to await it
                logger.info(`Expanding task: ${toolArgs.taskId}`);
                const result = await core.expandTask(workspaceRoot, toolArgs.taskId);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error expanding task: ${error.message}`);
                sendError(id, -32603, `Error expanding task: ${error.message}`);
              }
              break;
              
            case 'reviseTasks':
              try {
                if (!toolArgs.fromTaskId || !toolArgs.prompt) {
                  sendError(id, -32602, 'Invalid params: fromTaskId and prompt are required');
                  return;
                }
                
                // reviseTasks is async so we need to await it
                logger.info(`Revising tasks from ID ${toolArgs.fromTaskId}`);
                const result = await core.reviseTasks(workspaceRoot, toolArgs);
                sendResponse(id, result);
              } catch (error) {
                logger.error(`Error revising tasks: ${error.message}`);
                sendError(id, -32603, `Error revising tasks: ${error.message}`);
              }
              break;
              
            default:
              sendError(id, -32601, `Method not found: Unknown tool ${toolName}`);
          }
        } catch (err) {
          logger.error(`General error processing tool ${toolName}: ${err.message}`);
          logger.debug(err.stack);
          sendError(id, -32603, `Internal error processing tool ${toolName}: ${err.message}`);
        }
        break;
        
      default:
        logger.warn(`Unknown method: ${method}`);
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    logger.error(`Error processing request: ${err.message}`);
    logger.debug(err.stack);
    // Send error response if we have a requestId
    if (requestId !== null) {
      sendError(requestId, -32603, `Internal error: ${err.message}`, { stack: err.stack });
    }
  }
});

logger.info('Server ready and listening for requests'); 