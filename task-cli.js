#!/usr/bin/env node

// Simple CLI wrapper for task manager functions
const core = require('./gemini-task-manager/src/core');
const workspaceRoot = process.cwd();

// Parse command line arguments
const command = process.argv[2];
const args = process.argv.slice(3);

// Helper to parse key=value pairs into an object
function parseArgs(args) {
  const result = {};
  args.forEach(arg => {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      result[key] = value;
    }
  });
  return result;
}

async function main() {
  try {
    let result;
    
    switch (command) {
      case 'init':
        const initOptions = parseArgs(args);
        result = core.initProject(workspaceRoot, {
          projectName: initOptions.name || 'Untitled Project',
          projectDescription: initOptions.description || ''
        });
        break;
        
      case 'add':
        const taskOptions = parseArgs(args);
        if (!taskOptions.title) {
          console.error('Error: Title is required for adding a task');
          process.exit(1);
        }
        result = core.addTask(workspaceRoot, taskOptions);
        break;
        
      case 'list':
        const listOptions = parseArgs(args);
        result = core.listTasks(workspaceRoot, {
          status: listOptions.status
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
        if (args.length < 2) {
          console.error('Error: Parent ID and title are required for adding a subtask');
          process.exit(1);
        }
        const parentId = parseInt(args[0]);
        const subtaskTitle = args[1];
        
        result = core.addSubtask(workspaceRoot, parentId, {
          title: subtaskTitle
        });
        break;
        
      case 'status':
        if (args.length < 2) {
          console.error('Error: Task ID and new status are required');
          process.exit(1);
        }
        const taskId = args[0];
        const newStatus = args[1];
        const message = args[2] || '';
        
        result = core.updateStatus(workspaceRoot, taskId, newStatus, message);
        break;
        
      case 'next':
        result = core.getNextTask(workspaceRoot);
        break;
        
      case 'update':
        const updateOptions = parseArgs(args);
        if (!updateOptions.id) {
          console.error('Error: Task ID is required for updating a task');
          process.exit(1);
        }
        
        result = core.updateTask(workspaceRoot, updateOptions.id, {
          title: updateOptions.title,
          description: updateOptions.description,
          priority: updateOptions.priority,
          relatedFiles: updateOptions.relatedFiles,
          message: updateOptions.message
        });
        break;
        
      case 'remove':
        if (args.length < 1) {
          console.error('Error: Task ID is required for removing a task');
          process.exit(1);
        }
        
        result = core.removeTask(workspaceRoot, args[0]);
        break;
        
      case 'context':
        if (args.length < 1) {
          console.error('Error: Task ID is required for getting context');
          process.exit(1);
        }
        
        result = core.getContext(workspaceRoot, args[0]);
        break;
        
      case 'parse-prd':
        if (args.length < 1) {
          console.error('Error: PRD file path is required for parsing');
          process.exit(1);
        }
        
        // parsePrd returns a Promise, so we need to await it
        result = await core.parsePrd(workspaceRoot, args[0]);
        break;
        
      case 'generate-files':
        result = core.generateTaskFiles(workspaceRoot);
        break;
        
      case 'help':
      default:
        console.log(`
Task Manager CLI

Usage:
  node task-cli.js <command> [options]

Commands:
  init [name=ProjectName] [description=Description]   Initialize project
  add title=Title [description=Desc] [priority=high]   Add a new task
  list [status=todo|inprogress|done|blocked|error]     List tasks
  add-subtask <parentId> <title>                      Add a subtask
  status <taskId> <newStatus> [message]               Update task status
  next                                                Get next task
  update id=TaskId [title=NewTitle] [description=...] Update task details
  remove <taskId>                                     Remove a task
  context <taskId>                                    Get task context
  parse-prd <filePath>                                Parse PRD to generate tasks
  generate-files                                      Generate individual task files
  help                                                Show this help
        `);
        process.exit(0);
    }
    
    // Print the result as JSON
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main(); 