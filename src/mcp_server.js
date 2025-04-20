#!/usr/bin/env node

// Gemini Task Manager MCP server implementation
// This server provides a JSON-RPC interface for Cursor to communicate with GTM
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Import the core functionality
const core = require('./core');

// Create readline interface for JSON-RPC communication
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Get workspace root from command line args provided by Cursor configuration
let currentWorkspaceRoot = null; 
const wsArgIndex = process.argv.indexOf('--workspaceRoot');
if (wsArgIndex !== -1 && process.argv.length > wsArgIndex + 1) {
    const argValue = process.argv[wsArgIndex + 1];
    // Check if Cursor failed to substitute the variable
    if (argValue === '${workspaceFolder}') {
        console.error('[ERROR] Cursor did not substitute ${workspaceFolder}. Server cannot determine workspace.');
        currentWorkspaceRoot = null; 
    } else {
        currentWorkspaceRoot = argValue;
        console.error(`Using workspace root from --workspaceRoot arg: ${currentWorkspaceRoot}`);
    }
            } else {
    console.error('[ERROR] --workspaceRoot argument not provided by configuration. Server cannot determine workspace.');
    currentWorkspaceRoot = null; 
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
            }
          ]
        });
        break;
        
      case 'tools/run':
      case 'tools/call':
        // Handle running tools
        console.error(`[DEBUG] Handling ${method} request`);
        
        // Check if workspaceRoot was determined
        if (!currentWorkspaceRoot) {
             console.error("[FATAL] Workspace root not determined. Cannot execute tools.");
             sendError(id, -32001, "Server Configuration Error", { 
               message: "Workspace root could not be determined from client initialize request. Cannot execute tool." 
             });
            return;
        }

        // Normalize the parameters format
        let toolName, toolArgs;
        
        if (method === 'tools/call' && params?.name) {
          // Convert tools/call format to tools/run format
          toolName = params.name;
          toolArgs = params.arguments || {};
                } else {
          // Standard tools/run format
          toolName = params?.tool;
          toolArgs = params?.args || {};
            }
        
        console.error(`[DEBUG] Tool: ${toolName}, Args: ${JSON.stringify(toolArgs)}, Workspace: ${currentWorkspaceRoot}`);
        
        // Execute the appropriate core function based on the tool name
        try {
          let result;
          
            switch (toolName) {
                case 'setWorkspace':
              // Set the workspace root
              if (toolArgs.workspacePath) {
                currentWorkspaceRoot = toolArgs.workspacePath;
                console.error(`[INFO] Workspace root set to: ${currentWorkspaceRoot}`);
                result = { success: true, message: `Workspace set to: ${currentWorkspaceRoot}` };
              } else {
                throw new Error('Workspace path not provided');
              }
              break;
              
                case 'initProject':
              result = core.initProject(currentWorkspaceRoot, {
                projectName: toolArgs.projectName,
                projectDescription: toolArgs.projectDescription
              });
                    break;
              
                case 'addTask':
              result = core.addTask(currentWorkspaceRoot, toolArgs);
              break;
              
            case 'addSubtask':
              result = core.addSubtask(currentWorkspaceRoot, toolArgs.parentId, {
                title: toolArgs.title
              });
                    break;
              
                case 'listTasks':
              result = core.listTasks(currentWorkspaceRoot, {
                status: toolArgs.status
              });
                    break;
              
                case 'updateStatus':
              result = core.updateStatus(currentWorkspaceRoot, toolArgs.id, toolArgs.newStatus, toolArgs.message);
                    break;
              
                case 'getNextTask':
              result = core.getNextTask(currentWorkspaceRoot);
                    break;
              
                case 'updateTask':
              result = core.updateTask(currentWorkspaceRoot, toolArgs.id, {
                title: toolArgs.title,
                description: toolArgs.description,
                priority: toolArgs.priority,
                relatedFiles: toolArgs.relatedFiles,
                message: toolArgs.message
              });
                    break;
              
                case 'removeTask':
              result = core.removeTask(currentWorkspaceRoot, toolArgs.id);
                    break;
              
                case 'getContext':
              result = core.getContext(currentWorkspaceRoot, toolArgs.id);
                    break;
              
                default:
              throw new Error(`Unknown tool: ${toolName}`);
          }
          
          // Format the response properly
          sendResponse(id, { 
            content: [{ 
              type: 'text', 
              text: JSON.stringify(result, null, 2)
            }]
          });
        } catch (error) {
          console.error(`[ERROR] Tool execution error: ${error.message}`);
          sendError(id, -32603, `Tool execution error: ${error.message}`);
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
    sendError(requestId || requestCounter++, -32700, 'Parse error', { message: error.message });
    }
});

// Indicate server is ready on stderr
console.error('Gemini Task Manager MCP Server listening...'); 