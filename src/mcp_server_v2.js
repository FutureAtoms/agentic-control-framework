#!/usr/bin/env node

/**
 * Agentic Control Framework (ACF) - MCP Server v2
 *
 * @author Abhilash Chadhar (FutureAtoms)
 * @description MCP SDK-based server with 83+ tools for autonomous agent development
 * @version 2.0.0
 *
 * This server uses the official MCP SDK for better compatibility with Claude Code
 */

const { Server } = require('@modelcontextprotocol/sdk/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Import core functionality
const core = require('./core');
const filesystemTools = require('./filesystem_tools');
const terminalTools = require('./tools/terminal_tools');
const searchTools = require('./tools/search_tools');
const editTools = require('./tools/edit_tools');
const enhancedFsTools = require('./tools/enhanced_filesystem_tools');
const browserTools = require('./tools/browser_tools');
const applescriptTools = require('./tools/applescript_tools');
const fileWatcher = require('./file_watcher');

// Parse command line arguments
const getArg = (flag) => {
  const index = process.argv.findIndex(arg => arg === flag);
  return index !== -1 && index < process.argv.length - 1 ? process.argv[index + 1] : null;
};

let workspaceRoot = getArg('--workspaceRoot') || 
                     getArg('-w') || 
                     process.env.ACF_PATH ||
                     process.env.WORKSPACE_ROOT || 
                     process.cwd();

// Ensure workspace root is valid
if (!workspaceRoot || workspaceRoot === '/') {
  workspaceRoot = process.cwd();
  logger.info(`Invalid workspace root. Using current directory: ${workspaceRoot}`);
}

// Parse allowed directories using OS-specific delimiter
const pathMod = require('path');
const envAllowedDirs = process.env.ALLOWED_DIRS ?
  process.env.ALLOWED_DIRS.split(pathMod.delimiter).filter(Boolean) :
  [];
const allowedDirectories = [...new Set([workspaceRoot, ...envAllowedDirs])];

// Check if readonly mode is enabled
const readonlyMode = process.env.READONLY_MODE === 'true';
if (readonlyMode) {
  logger.info('Running in read-only mode. Write operations will be blocked.');
}

logger.info(`Starting ACF MCP Server v2`);
logger.info(`Workspace root: ${workspaceRoot}`);
logger.info(`Allowed directories: ${allowedDirectories.join(', ')}`);

// Initialize file watcher
fileWatcher.initializeWatcher(workspaceRoot);

// Create the MCP server
const server = new Server(
  {
    name: 'agentic-control-framework',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
  }
);

// Helper function to check readonly mode
function checkReadOnlyMode(toolName) {
  if (!readonlyMode) return true;
  
  const writeOperations = [
    'write_file', 
    'copy_file', 
    'move_file', 
    'delete_file', 
    'create_directory'
  ];
  
  return !writeOperations.includes(toolName);
}

// Register tools with the SDK

// Workspace Management
server.setRequestHandler('tools/list', async () => {
  return {
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
            projectDescription: { type: 'string', description: 'Optional goal or description for the project.' },
            editor: { 
              type: 'string', 
              description: 'Optional editor type for generating specific rule files.',
              enum: ['cursor', 'claude', 'cline', 'void']
            }
          }
        }
      },
      // Task Management Tools
      {
        name: 'addTask',
        description: 'Adds a new task to the task list.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The title of the task.' },
            description: { type: 'string' },
            priority: {
              oneOf: [
                { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                { type: 'number', minimum: 1, maximum: 1000 }
              ],
              description: 'Priority as string (low/medium/high/critical) or number (1-1000)',
              default: 'medium'
            },
            dependsOn: { type: 'string' },
            relatedFiles: { type: 'string' },
            tests: { type: 'string', description: 'Optional comma-separated string of tests to verify completion.' }
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
            relatedFiles: { type: 'string', description: 'Optional comma-separated string of relevant file paths.' },
            tests: { type: 'string', description: 'Optional comma-separated string of tests to verify completion.' }
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
            status: { 
              type: 'string', 
              enum: ['todo', 'inprogress', 'testing', 'done', 'blocked', 'error'],
              description: 'Optional status to filter by.'
            },
            format: { 
              type: 'string', 
              enum: ['json', 'table', 'human'],
              description: 'Optional output format.'
            }
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
            newStatus: { 
              type: 'string', 
              enum: ['todo', 'inprogress', 'testing', 'done', 'blocked', 'error'],
              description: 'The new status.'
            },
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
        description: 'Updates the details of a task (title, description, priority, etc.).',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'The ID of the task to update.' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: {
              oneOf: [
                { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                { type: 'number', minimum: 1, maximum: 1000 }
              ],
              description: 'Priority as string or number'
            },
            dependsOn: { type: 'string' },
            relatedFiles: { type: 'string' },
            tests: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'updateSubtask',
        description: 'Updates the details of a subtask.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'The ID of the subtask (e.g., "1.1").' },
            title: { type: 'string', description: 'The new title for the subtask.' },
            relatedFiles: { type: 'string' },
            tests: { type: 'string' }
          },
          required: ['id', 'title']
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
            id: { type: 'string', description: 'The ID of the task or subtask.' }
          },
          required: ['id']
        }
      },
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
        description: 'Parses a Product Requirements Document (PRD) file to generate tasks.',
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
        description: 'Breaks down a task into subtasks using AI.',
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
        description: 'Revises future tasks based on a prompt/change.',
        inputSchema: {
          type: 'object',
          properties: {
            fromTaskId: { type: 'string', description: 'Task ID from which revision should start.' },
            prompt: { type: 'string', description: 'User prompt describing the change.' }
          },
          required: ['fromTaskId', 'prompt']
        }
      },
      {
        name: 'generateTaskTable',
        description: 'Generates a human-readable Markdown file with task statuses.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      // Priority Management Tools
      {
        name: 'recalculatePriorities',
        description: 'Recalculate all task priorities using advanced algorithms.',
        inputSchema: {
          type: 'object',
          properties: {
            applyDependencyBoosts: { type: 'boolean', default: true },
            applyTimeDecay: { type: 'boolean', default: false },
            optimizeDistribution: { type: 'boolean', default: true }
          }
        }
      },
      {
        name: 'getPriorityStatistics',
        description: 'Get priority statistics for all tasks.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'getDependencyAnalysis',
        description: 'Get comprehensive dependency analysis.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'configureTimeDecay',
        description: 'Configure time-based priority decay settings.',
        inputSchema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            model: { 
              type: 'string',
              enum: ['linear', 'exponential', 'logarithmic', 'sigmoid', 'adaptive']
            },
            rate: { type: 'number', minimum: 0.001, maximum: 0.2 },
            threshold: { type: 'integer', minimum: 1, maximum: 365 },
            maxBoost: { type: 'integer', minimum: 0, maximum: 500 },
            priorityWeight: { type: 'boolean' }
          }
        }
      },
      {
        name: 'configureEffortWeighting',
        description: 'Configure effort-weighted priority scoring.',
        inputSchema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            scoreWeight: { type: 'number', minimum: 0, maximum: 1 },
            complexityWeight: { type: 'number', minimum: 0, maximum: 1 },
            impactWeight: { type: 'number', minimum: 0, maximum: 1 },
            urgencyWeight: { type: 'number', minimum: 0, maximum: 1 },
            decayRate: { type: 'number', minimum: 0, maximum: 0.1 },
            boostThreshold: { type: 'number', minimum: 0, maximum: 1 }
          }
        }
      },
      // File System Tools
      {
        name: 'read_file',
        description: 'Read the complete contents of a file from the file system or from a URL.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or URL' },
            isUrl: { type: 'boolean', description: 'Whether the path is a URL' },
            timeout: { type: 'number', description: 'Timeout for URL requests in milliseconds' }
          },
          required: ['path']
        }
      },
      {
        name: 'read_multiple_files',
        description: 'Read the contents of multiple files in a single operation.',
        inputSchema: {
          type: 'object',
          properties: {
            paths: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'List of file paths to read' 
            }
          },
          required: ['paths']
        }
      },
      {
        name: 'write_file',
        description: 'Create or overwrite a file with new content.' + (readonlyMode ? ' (DISABLED IN READ-ONLY MODE)' : ''),
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path where to write the file' },
            content: { type: 'string', description: 'Content to write to the file' }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'copy_file',
        description: 'Copy files and directories.' + (readonlyMode ? ' (DISABLED IN READ-ONLY MODE)' : ''),
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' }
          },
          required: ['source', 'destination']
        }
      },
      {
        name: 'move_file',
        description: 'Move or rename files and directories.' + (readonlyMode ? ' (DISABLED IN READ-ONLY MODE)' : ''),
        inputSchema: {
          type: 'object',
          properties: {
            source: { type: 'string', description: 'Source path' },
            destination: { type: 'string', description: 'Destination path' }
          },
          required: ['source', 'destination']
        }
      },
      {
        name: 'delete_file',
        description: 'Delete a file or directory.' + (readonlyMode ? ' (DISABLED IN READ-ONLY MODE)' : ''),
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to delete' },
            recursive: { type: 'boolean', description: 'Whether to recursively delete directories' }
          },
          required: ['path']
        }
      },
      {
        name: 'list_directory',
        description: 'Get a detailed listing of all files and directories in a path.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of the directory to list' }
          },
          required: ['path']
        }
      },
      {
        name: 'create_directory',
        description: 'Create a new directory.' + (readonlyMode ? ' (DISABLED IN READ-ONLY MODE)' : ''),
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of the directory to create' }
          },
          required: ['path']
        }
      },
      {
        name: 'tree',
        description: 'Returns a hierarchical JSON representation of a directory structure.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path of the directory to traverse' },
            depth: { type: 'number', description: 'Maximum depth to traverse', default: 3 },
            follow_symlinks: { type: 'boolean', description: 'Whether to follow symbolic links', default: false }
          },
          required: ['path']
        }
      },
      {
        name: 'search_files',
        description: 'Recursively search for files and directories matching a pattern.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Starting path for the search' },
            pattern: { type: 'string', description: 'Search pattern to match against file names' }
          },
          required: ['path', 'pattern']
        }
      },
      {
        name: 'get_file_info',
        description: 'Retrieve detailed metadata about a file or directory.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path to the file or directory' }
          },
          required: ['path']
        }
      },
      // Terminal Tools
      {
        name: 'execute_command',
        description: 'Execute a terminal command with timeout.',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            shell: { type: 'string', description: 'Shell to use (optional)' },
            timeout_ms: { type: 'number', description: 'Timeout in milliseconds (optional)' }
          },
          required: ['command']
        }
      },
      {
        name: 'list_processes',
        description: 'List all running processes.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'kill_process',
        description: 'Terminate a running process by PID.',
        inputSchema: {
          type: 'object',
          properties: {
            pid: { type: 'number', description: 'Process ID to kill' }
          },
          required: ['pid']
        }
      },
      // Search and Edit Tools
      {
        name: 'search_code',
        description: 'Search for text/code patterns within file contents using ripgrep.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Starting path for the search' },
            pattern: { type: 'string', description: 'Search pattern' },
            ignoreCase: { type: 'boolean', default: true },
            filePattern: { type: 'string', description: 'File pattern filter (optional)' },
            contextLines: { type: 'number', description: 'Number of context lines (optional)' },
            includeHidden: { type: 'boolean', description: 'Include hidden files (optional)' },
            maxResults: { type: 'number', description: 'Maximum results', default: 100 },
            timeoutMs: { type: 'number', description: 'Timeout in milliseconds (optional)' }
          },
          required: ['path', 'pattern']
        }
      },
      {
        name: 'edit_block',
        description: 'Apply surgical text replacements to files.',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the file to edit' },
            old_string: { type: 'string', description: 'Text to replace' },
            new_string: { type: 'string', description: 'Replacement text' },
            expected_replacements: { type: 'number', description: 'Expected number of replacements', default: 1 }
          },
          required: ['file_path', 'old_string', 'new_string']
        }
      },
      // Browser Tools
      {
        name: 'browser_navigate',
        description: 'Navigate to a URL.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to navigate to' }
          },
          required: ['url']
        }
      },
      {
        name: 'browser_click',
        description: 'Perform click on a web page.',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' }
          },
          required: ['element', 'ref']
        }
      },
      {
        name: 'browser_type',
        description: 'Type text into editable element.',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Human-readable element description' },
            ref: { type: 'string', description: 'Exact target element reference' },
            text: { type: 'string', description: 'Text to type' },
            submit: { type: 'boolean', description: 'Whether to submit entered text' },
            slowly: { type: 'boolean', description: 'Whether to type one character at a time' }
          },
          required: ['element', 'ref', 'text']
        }
      },
      {
        name: 'browser_take_screenshot',
        description: 'Take a screenshot of the current page.',
        inputSchema: {
          type: 'object',
          properties: {
            element: { type: 'string', description: 'Element description (optional)' },
            ref: { type: 'string', description: 'Element reference (optional)' },
            filename: { type: 'string', description: 'File name to save (optional)' },
            raw: { type: 'boolean', description: 'Whether to return PNG format', default: false }
          }
        }
      },
      {
        name: 'browser_close',
        description: 'Close the browser page.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      // AppleScript Tool
      {
        name: 'applescript_execute',
        description: 'Run AppleScript code to interact with Mac applications.',
        inputSchema: {
          type: 'object',
          properties: {
            code_snippet: { type: 'string', description: 'Multi-line AppleScript code to execute' },
            timeout: { type: 'number', description: 'Command execution timeout in seconds', default: 60 }
          },
          required: ['code_snippet']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name: toolName, arguments: args } = request.params;
  
  logger.debug(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);
  
  try {
    let result;
    
    switch (toolName) {
      case 'setWorkspace':
        if (args.workspacePath && fs.existsSync(args.workspacePath)) {
          workspaceRoot = args.workspacePath;
          const index = allowedDirectories.indexOf(allowedDirectories[0]);
          if (index !== -1) {
            allowedDirectories[index] = workspaceRoot;
          } else {
            allowedDirectories.unshift(workspaceRoot);
          }
          logger.info(`Workspace root set to: ${workspaceRoot}`);
          fileWatcher.initializeWatcher(workspaceRoot);
          result = { success: true, message: `Workspace set to ${workspaceRoot}` };
        } else {
          result = { success: false, message: `Invalid or non-existent workspace path: ${args.workspacePath}` };
        }
        break;
        
      case 'initProject':
        result = core.initProject(workspaceRoot, {
          projectName: args.projectName || 'Untitled Project',
          projectDescription: args.projectDescription || '',
          editor: args.editor
        });
        break;
        
      case 'addTask':
        result = core.addTask(workspaceRoot, {
          title: args.title,
          description: args.description || '',
          priority: args.priority || 'medium',
          dependsOn: args.dependsOn || '',
          relatedFiles: args.relatedFiles || '',
          tests: args.tests || ''
        });
        break;
        
      case 'addSubtask':
        result = core.addSubtask(workspaceRoot, args.parentId, {
          title: args.title,
          relatedFiles: args.relatedFiles || '',
          tests: args.tests || ''
        });
        break;
        
      case 'listTasks':
        const tasksData = core.readTasks(workspaceRoot);
        let filteredTasks = [...tasksData.tasks];
        
        if (args && args.status) {
          filteredTasks = filteredTasks.filter(task => task.status === args.status);
        }
        
        const tableRenderer = require('./tableRenderer');
        const humanReadableTable = tableRenderer.generateTaskTable({...tasksData, tasks: filteredTasks}, workspaceRoot);
        
        result = {
          success: true,
          tasks: filteredTasks,
          taskTable: humanReadableTable
        };
        break;
        
      case 'updateStatus':
        try {
          const statusTasksData = core.readTasks(workspaceRoot);
          const { task, subtask, parentTask } = core.findTask(statusTasksData, args.id);
          const item = task || subtask;

          if (!item) {
            result = { success: false, message: `Task or subtask with ID ${args.id} not found.` };
            break;
          }

          // Update status and handle related logic
          const oldStatus = item.status;
          item.status = args.newStatus.toLowerCase();
          item.updatedAt = new Date().toISOString();

          if (!item.activityLog) item.activityLog = [];
          item.activityLog.push({
            timestamp: new Date().toISOString(),
            type: 'log',
            message: args.message || `Status changed from "${oldStatus}" to "${args.newStatus}"`
          });

          core.writeTasks(workspaceRoot, statusTasksData, {
            recalculatePriorities: false,
            updateTable: true
          });
          
          result = { success: true, message: `Status updated to ${args.newStatus}` };
        } catch (error) {
          result = { success: false, message: `Error updating status: ${error.message}` };
        }
        break;
        
      case 'getNextTask':
        result = core.getNextTask(workspaceRoot);
        break;
        
      case 'updateTask':
        result = core.updateTask(workspaceRoot, args.id, args);
        break;
        
      case 'updateSubtask':
        result = core.updateSubtask(workspaceRoot, args.id, args);
        break;
        
      case 'removeTask':
        result = core.removeTask(workspaceRoot, args.id);
        break;
        
      case 'getContext':
        result = core.getContext(workspaceRoot, args.id);
        break;
        
      case 'generateTaskFiles':
        result = core.generateTaskFiles(workspaceRoot);
        break;
        
      case 'parsePrd':
        result = await core.parsePrd(workspaceRoot, args.filePath);
        break;
        
      case 'expandTask':
        result = await core.expandTask(workspaceRoot, args.taskId);
        break;
        
      case 'reviseTasks':
        result = await core.reviseTasks(workspaceRoot, args.fromTaskId, args.prompt);
        break;
        
      case 'generateTaskTable':
        result = core.generateHumanReadableTaskTable(workspaceRoot);
        break;
        
      // Priority management
      case 'recalculatePriorities':
        result = core.recalculatePriorities(workspaceRoot, {
          applyDependencyBoosts: args.applyDependencyBoosts !== false,
          applyTimeDecay: args.applyTimeDecay === true,
          optimizeDistribution: args.optimizeDistribution !== false
        });
        break;
        
      case 'getPriorityStatistics':
        result = core.getPriorityStatistics(workspaceRoot);
        break;
        
      case 'getDependencyAnalysis':
        result = core.getDependencyAnalysis(workspaceRoot);
        break;
        
      case 'configureTimeDecay':
        result = core.configureTimeDecay(workspaceRoot, args);
        break;
        
      case 'configureEffortWeighting':
        result = core.configureEffortWeighting(workspaceRoot, args);
        break;
        
      // Filesystem tools
      case 'read_file':
        if (args.isUrl || (args.path && (args.path.startsWith('http://') || args.path.startsWith('https://')))) {
          result = await enhancedFsTools.readFileEnhanced(args.path, allowedDirectories, {
            isUrl: true,
            timeout: args.timeout
          });
        } else {
          result = filesystemTools.readFile(args.path, allowedDirectories);
        }
        break;
        
      case 'read_multiple_files':
        result = filesystemTools.readMultipleFiles(args.paths, allowedDirectories);
        break;
        
      case 'write_file':
        if (!checkReadOnlyMode('write_file')) {
          result = { success: false, message: 'Operation not allowed: Server is running in read-only mode' };
        } else {
          result = filesystemTools.writeFile(args.path, args.content, allowedDirectories);
        }
        break;
        
      case 'copy_file':
        if (!checkReadOnlyMode('copy_file')) {
          result = { success: false, message: 'Operation not allowed: Server is running in read-only mode' };
        } else {
          result = filesystemTools.copyFile(args.source, args.destination, allowedDirectories);
        }
        break;
        
      case 'move_file':
        if (!checkReadOnlyMode('move_file')) {
          result = { success: false, message: 'Operation not allowed: Server is running in read-only mode' };
        } else {
          result = filesystemTools.moveFile(args.source, args.destination, allowedDirectories);
        }
        break;
        
      case 'delete_file':
        if (!checkReadOnlyMode('delete_file')) {
          result = { success: false, message: 'Operation not allowed: Server is running in read-only mode' };
        } else {
          result = filesystemTools.deleteFile(args.path, args.recursive, allowedDirectories);
        }
        break;
        
      case 'list_directory':
        result = filesystemTools.listDirectory(args.path, allowedDirectories);
        break;
        
      case 'create_directory':
        if (!checkReadOnlyMode('create_directory')) {
          result = { success: false, message: 'Operation not allowed: Server is running in read-only mode' };
        } else {
          result = filesystemTools.createDirectory(args.path, allowedDirectories);
        }
        break;
        
      case 'tree':
        result = filesystemTools.createDirectoryTree(
          args.path, 
          args.depth || 3, 
          args.follow_symlinks || false, 
          allowedDirectories
        );
        break;
        
      case 'search_files':
        result = filesystemTools.searchFiles(args.path, args.pattern, allowedDirectories);
        break;
        
      case 'get_file_info':
        result = filesystemTools.getFileInfo(args.path, allowedDirectories);
        break;
        
      // Terminal tools
      case 'execute_command':
        result = await terminalTools.executeCommand(args.command, {
          shell: args.shell,
          timeout_ms: args.timeout_ms
        });
        break;
        
      case 'list_processes':
        result = await terminalTools.listProcesses();
        break;
        
      case 'kill_process':
        result = await terminalTools.killProcess(args.pid);
        break;
        
      // Search and edit tools
      case 'search_code':
        result = await searchTools.searchCode(args.path, args.pattern, {
          ignoreCase: args.ignoreCase,
          filePattern: args.filePattern,
          contextLines: args.contextLines,
          includeHidden: args.includeHidden,
          maxResults: args.maxResults,
          timeoutMs: args.timeoutMs
        });
        break;
        
      case 'edit_block':
        result = editTools.editBlock(args.file_path, args.old_string, args.new_string, {
          expected_replacements: args.expected_replacements
        });
        break;
        
      // Browser tools
      case 'browser_navigate':
        result = await browserTools.browserNavigate(args.url);
        break;
        
      case 'browser_click':
        result = await browserTools.browserClick(args.element, args.ref);
        break;
        
      case 'browser_type':
        result = await browserTools.browserType(args.element, args.ref, args.text, {
          submit: args.submit,
          slowly: args.slowly
        });
        break;
        
      case 'browser_take_screenshot':
        result = await browserTools.browserTakeScreenshot({
          element: args.element,
          ref: args.ref,
          filename: args.filename,
          raw: args.raw
        });
        break;
        
      case 'browser_close':
        result = await browserTools.browserClose();
        break;
        
      // AppleScript tool
      case 'applescript_execute':
        result = await applescriptTools.executeAppleScript(
          args.code_snippet,
          args.timeout || 60
        );
        break;
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    return {
      content: [
        {
          type: "text",
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    logger.error(`Error executing tool ${toolName}: ${error.message}`);
    throw error;
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  fileWatcher.stopWatcher();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  fileWatcher.stopWatcher();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}\n${err.stack}`);
  process.exit(1);
});

// Start the server with stdio transport
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('ACF MCP Server v2 started successfully');
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
