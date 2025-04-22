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
  // Use logger.output specifically for JSON-RPC responses to stdout
  logger.output(JSON.stringify(response));
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
  // Use logger.output specifically for JSON-RPC responses to stdout
  logger.output(JSON.stringify(response));
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
                type: 'object'
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
                type: 'object'
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
      
      case 'tools/call':
      case 'tools/run':
        logger.debug(`Processing tool request: ${JSON.stringify(params)}`);
        
        // Extract the parameters we need
        const toolName = method === 'tools/call' ? params.name : params.tool; // Adjust based on MCP version
        const argsParam = method === 'tools/call' ? params.parameters : params.args;
        
        logger.debug(`Invoking tool: ${toolName} with args: ${JSON.stringify(argsParam)}`);
        
        try {
          // Handle the specific tool requests
          let responseData;
          
          switch (toolName) {
            case 'setWorkspace':
              if (argsParam.workspacePath && fs.existsSync(argsParam.workspacePath)) {
                workspaceRoot = argsParam.workspacePath;
                logger.info(`Workspace root set to: ${workspaceRoot}`);
                responseData = { success: true, message: `Workspace set to ${workspaceRoot}` };
              } else {
                logger.error(`Invalid workspace path: ${argsParam.workspacePath}`);
                responseData = { success: false, message: `Invalid or non-existent workspace path: ${argsParam.workspacePath}` };
              }
              break;
              
            case 'initProject':
              responseData = core.initProject(workspaceRoot, {
                projectName: argsParam.projectName || 'Untitled Project',
                projectDescription: argsParam.projectDescription || ''
              });
              break;
              
            case 'addTask':
              responseData = core.addTask(workspaceRoot, {
                title: argsParam.title,
                description: argsParam.description || '',
                priority: argsParam.priority || 'medium',
                dependsOn: argsParam.dependsOn || '',
                relatedFiles: argsParam.relatedFiles || ''
              });
              break;
              
            case 'addSubtask':
              responseData = core.addSubtask(workspaceRoot, argsParam.parentId, {
                title: argsParam.title
              });
              break;
              
            case 'listTasks':
              responseData = core.listTasks(workspaceRoot, {
                status: argsParam.status
              });
              break;
              
            case 'updateStatus':
              responseData = core.updateStatus(workspaceRoot, argsParam.id, argsParam.newStatus, argsParam.message || '');
              break;
              
            case 'getNextTask':
              responseData = core.getNextTask(workspaceRoot);
              break;
              
            case 'updateTask':
              responseData = core.updateTask(workspaceRoot, argsParam.id, {
                title: argsParam.title,
                description: argsParam.description,
                priority: argsParam.priority,
                relatedFiles: argsParam.relatedFiles,
                message: argsParam.message
              });
              break;
              
            case 'removeTask':
              responseData = core.removeTask(workspaceRoot, argsParam.id);
              break;
              
            case 'getContext':
              responseData = core.getContext(workspaceRoot, argsParam.id);
              break;
              
            case 'generateTaskFiles':
              responseData = core.generateTaskFiles(workspaceRoot);
              break;
              
            case 'parsePrd':
              responseData = await core.parsePrd(workspaceRoot, argsParam.filePath);
              break;
              
            case 'expandTask':
              responseData = await core.expandTask(workspaceRoot, argsParam.taskId);
              break;
              
            case 'reviseTasks':
              responseData = await core.reviseTasks(workspaceRoot, {
                fromTaskId: argsParam.fromTaskId,
                prompt: argsParam.prompt
              });
              break;
              
            default:
              logger.error(`Unknown tool requested: ${toolName}`);
              sendError(id, -32601, `Method not found: ${toolName}`);
              return;
          }
          
          logger.debug(`Tool "${toolName}" executed successfully`);
          
          // Format the response specifically for MCP
          // If responseData is already MCP formatted, return it as-is
          if (method === 'tools/call') {
            // Handle tools/call response (newer MCP format)
            if (typeof responseData === 'string') {
              // Text response
              sendResponse(id, {
                content: [
                  {
                    type: "text",
                    text: responseData
                  }
                ]
              });
            } else {
              // JSON response
              sendResponse(id, {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(responseData)
                  }
                ]
              });
            }
          } else {
            // Handle tools/run response (older MCP format)
            sendResponse(id, responseData);
          }
          
        } catch (error) {
          logger.error(`Error executing tool ${toolName}: ${error.message}`);
          logger.debug(error.stack);
          
          sendError(id, -32000, `Error executing tool ${toolName}: ${error.message}`, { 
            stack: error.stack
          });
        }
        break;
        
      default:
        logger.error(`Unknown method requested: ${method}`);
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    logger.error(`Error processing request: ${error.message}`);
    logger.debug(error.stack);
    
    if (requestId !== null) {
      sendError(requestId, -32603, `Internal error: ${error.message}`, { 
        stack: error.stack
      });
    }
  }
});

logger.info('Server ready and listening for requests');

// Prevent the process from exiting
process.stdin.resume(); 