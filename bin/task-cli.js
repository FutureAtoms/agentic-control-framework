#!/usr/bin/env node

// Simple CLI wrapper for task manager functions
const core = require('../src/core');
const workspaceRoot = process.cwd();

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

// Helper to parse arguments
function parseArgs(args) {
  const result = {};
  
  // Handle both styles of arguments:
  // 1. key=value pairs: name=Project
  // 2. flag options: -t "Task Title", --description "Description"
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle key=value style
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      result[key] = value;
      continue;
    }
    
    // Handle flag style (-t, --title, etc.)
    if (arg.startsWith('-')) {
      const flag = arg.replace(/^-+/, ''); // Remove leading dashes
      let key = flag;
      
      // Map short flags to full property names
      if (flag === 't') key = 'title';
      if (flag === 'd') key = 'description';
      if (flag === 'p') key = 'priority';
      if (flag === 'm') key = 'message';
      
      // Check if there's a value following this flag
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result[key] = args[i + 1];
        i++; // Skip the next argument since we used it as a value
      } else {
        // Flag without value, treat as boolean
        result[key] = true;
      }
    } else {
      // Positional argument (store in _args array)
      if (!result._args) result._args = [];
      result._args.push(arg);
    }
  }
  
  return result;
}

async function main() {
  try {
    let result;
    
    switch (command) {
      case 'init':
        const initOptions = parseArgs(args);
        result = core.initProject(workspaceRoot, {
          projectName: initOptions.name || initOptions['project-name'] || 'Untitled Project',
          projectDescription: initOptions.description || initOptions['project-description'] || ''
        });
        break;
        
      case 'add':
        const taskOptions = parseArgs(args);
        
        if (!taskOptions.title) {
          console.error('[ERROR] Title is required for adding a task');
          process.exit(1);
        }
        
        // Convert depends-on if provided
        if (taskOptions['depends-on']) {
          taskOptions.dependsOn = taskOptions['depends-on'];
        }
        
        result = core.addTask(workspaceRoot, {
          title: taskOptions.title,
          description: taskOptions.description || '',
          priority: taskOptions.priority || 'medium',
          dependsOn: taskOptions.dependsOn || '',
          relatedFiles: taskOptions.relatedFiles || ''
        });
        break;
        
      case 'list':
        const listOptions = parseArgs(args);
        result = core.listTasks(workspaceRoot, {
          status: listOptions.status || listOptions.s
        });
        
        // Print tasks in a more readable format
        if (result && result.tasks) {
          console.log(`Total tasks: ${result.tasks.length}`);
          result.tasks.forEach(task => {
            console.log(`\nID: ${task.id} - ${task.title} [${task.status}] [${task.priority}]`);
            if (task.description) console.log(`Description: ${task.description}`);
            
            if (task.subtasks && task.subtasks.length > 0) {
              console.log('Subtasks:');
              task.subtasks.forEach(subtask => {
                console.log(`  - ${subtask.id}: ${subtask.title} [${subtask.status}]`);
              });
            }
            
            if (task.dependsOn && task.dependsOn.length > 0) {
              console.log(`Depends on: ${task.dependsOn.join(', ')}`);
            }
          });
          return; // Skip JSON output
        }
        break;
        
      case 'add-subtask':
        const subtaskOptions = parseArgs(args);
        let parentId, subtaskTitle;
        
        if (subtaskOptions._args && subtaskOptions._args.length >= 1) {
          // Handle positional arguments
          parentId = parseInt(subtaskOptions._args[0]);
          if (subtaskOptions._args.length >= 2) {
            subtaskTitle = subtaskOptions._args[1];
          }
        }
        
        // Allow flag-style arguments to override positional ones
        parentId = subtaskOptions.parentId || subtaskOptions['parent-id'] || parentId;
        subtaskTitle = subtaskOptions.title || subtaskOptions.t || subtaskTitle;
        
        if (!parentId || !subtaskTitle) {
          console.error('[ERROR] Parent ID and title are required for adding a subtask');
          process.exit(1);
        }
        
        result = core.addSubtask(workspaceRoot, parentId, {
          title: subtaskTitle
        });
        break;
        
      case 'status':
        const statusOptions = parseArgs(args);
        let taskId, newStatus, message;
        
        if (statusOptions._args && statusOptions._args.length >= 2) {
          taskId = statusOptions._args[0];
          newStatus = statusOptions._args[1];
          message = statusOptions._args[2] || '';
        }
        
        // Allow flag-style arguments to override
        taskId = statusOptions.id || taskOptions.taskId || taskId;
        newStatus = statusOptions.status || statusOptions.newStatus || newStatus;
        message = statusOptions.message || statusOptions.m || message || '';
        
        if (!taskId || !newStatus) {
          console.error('[ERROR] Task ID and new status are required');
          process.exit(1);
        }
        
        result = core.updateStatus(workspaceRoot, taskId, newStatus, message);
        break;
        
      case 'next':
        result = core.getNextTask(workspaceRoot);
        break;
        
      case 'update':
        const updateOptions = parseArgs(args);
        const id = updateOptions.id || updateOptions._args?.[0];
        
        if (!id) {
          console.error('[ERROR] Task ID is required for updating a task');
          process.exit(1);
        }
        
        result = core.updateTask(workspaceRoot, id, {
          title: updateOptions.title || updateOptions.t,
          description: updateOptions.description || updateOptions.d,
          priority: updateOptions.priority || updateOptions.p,
          relatedFiles: updateOptions.relatedFiles,
          message: updateOptions.message || updateOptions.m
        });
        break;
        
      case 'remove':
        const removeOptions = parseArgs(args);
        const removeId = removeOptions.id || removeOptions._args?.[0];
        
        if (!removeId) {
          console.error('[ERROR] Task ID is required for removing a task');
          process.exit(1);
        }
        
        result = core.removeTask(workspaceRoot, removeId);
        break;
        
      case 'context':
        const contextOptions = parseArgs(args);
        const contextId = contextOptions.id || contextOptions._args?.[0];
        
        if (!contextId) {
          console.error('[ERROR] Task ID is required for getting context');
          process.exit(1);
        }
        
        result = core.getContext(workspaceRoot, contextId);
        break;
        
      case 'parse-prd':
        const prdOptions = parseArgs(args);
        const filePath = prdOptions.filePath || prdOptions.file || prdOptions._args?.[0];
        
        if (!filePath) {
          console.error('[ERROR] PRD file path is required for parsing');
          process.exit(1);
        }
        
        // parsePrd returns a Promise, so we need to await it
        console.error('[INFO] Parsing PRD file...');
        result = await core.parsePrd(workspaceRoot, filePath);
        break;
        
      case 'generate-files':
        result = core.generateTaskFiles(workspaceRoot);
        break;
        
      case 'expand-task':
        const expandOptions = parseArgs(args);
        const expandTaskId = expandOptions.id || expandOptions._args?.[0];
        
        if (!expandTaskId) {
          console.error('[ERROR] Task ID is required for expansion');
          process.exit(1);
        }
        
        console.error('[INFO] Expanding task into subtasks...');
        result = await core.expandTask(workspaceRoot, expandTaskId);
        break;
        
      case 'revise-tasks':
        const reviseOptions = parseArgs(args);
        const fromTaskId = reviseOptions.from || reviseOptions['from-task-id'] || reviseOptions._args?.[0];
        const prompt = reviseOptions.prompt || reviseOptions.p || reviseOptions._args?.[1];
        
        if (!fromTaskId || !prompt) {
          console.error('[ERROR] Both task ID and prompt are required for revising tasks');
          process.exit(1);
        }
        
        console.error('[INFO] Revising tasks...');
        result = await core.reviseTasks(workspaceRoot, {
          fromTaskId,
          prompt
        });
        break;
        
      case 'help':
      default:
        console.log(`
Task Manager CLI

Usage:
  node task-cli.js <command> [options]

Commands:
  init [name=ProjectName] [description=Description]   Initialize project
  add -t "Title" [-d "Description"] [-p high]         Add a new task
  list [-s todo|inprogress|done|blocked|error]        List tasks
  add-subtask <parentId> -t "Subtask Title"          Add a subtask
  status <taskId> <newStatus> [-m "Message"]          Update task status
  next                                                Get next task
  update <id> [-t "New Title"] [-d "New Desc"]        Update task details
  remove <taskId>                                     Remove a task
  context <taskId>                                    Get task context
  parse-prd <filePath>                               Parse PRD document
  generate-files                                      Generate Markdown files
  expand-task <taskId>                               Expand task into subtasks
  revise-tasks <fromTaskId> -p "Prompt"              Revise future tasks
  help                                                Show this help text
`);
        process.exit(0);
    }
    
    // If we get here, we have a result to print
    if (result) {
      if (typeof result === 'object') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    }
    
  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error(`[FATAL] Uncaught exception: ${err.message}`);
  process.exit(1);
}); 