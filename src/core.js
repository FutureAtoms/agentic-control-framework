const fs = require('fs');
const path = require('path');
const prdParser = require('./prd_parser'); // Import the PRD parser
const Table = require('cli-table3'); // Import cli-table3
const chalk = require('chalk'); // Import chalk (v4)
const logger = require('./logger'); // Import our logger module
const os = require('os'); // Import os module
const tableRenderer = require('./tableRenderer'); // Import the tableRenderer module

// --- Path Calculation Helper ---
// Helper function to get paths based on the script's location
function getWorkspacePaths(workspaceRoot) { // Added workspaceRoot argument
  if (!workspaceRoot) {
    // Fallback or error if workspaceRoot isn't provided - might need adjustment
    logger.error("Workspace root not provided to getWorkspacePaths.");
    // Use process.cwd() instead as a more reliable fallback
    workspaceRoot = process.cwd();
    logger.warn(`Falling back to current working directory: ${workspaceRoot}`);
  }
  
  // Here we can't use resolvePath to avoid circular dependency,
  // but we ensure all paths are absolute by using path.resolve
  return {
    tasksFilePath: path.resolve(workspaceRoot, 'tasks.json'),
    cursorRulesDir: path.resolve(workspaceRoot, '.cursor', 'rules'),
    cursorRulesFile: path.resolve(workspaceRoot, '.cursor', 'rules', 'task_manager_workflow.mdc'),
    taskFilesDir: path.resolve(workspaceRoot, 'tasks')
  };
}
// --- End Path Helper ---

// Function to ensure a directory exists
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    // Return message instead of logging
    return `Created directory: ${dirPath}`;
  }
  return null; // Return null if directory already exists
}

// Function to initialize the project
function initProject(workspaceRoot, options = {}) { // Renamed argument
  // Safety check - prevent writing to root directory
  if (workspaceRoot === '/' || workspaceRoot === '') {
    throw new Error('Invalid workspace root (received "' + workspaceRoot + '"). Cannot write to the root directory. Please provide a valid project directory path.');
  }

  const { tasksFilePath, cursorRulesDir, cursorRulesFile } = getWorkspacePaths(workspaceRoot); // Pass argument
  const { projectName = "Untitled Project", projectDescription = "" } = options;
  let messages = []; // Collect messages to return

  if (!fs.existsSync(tasksFilePath)) {
    const initialData = {
      projectName: projectName,           // Store project name
      projectDescription: projectDescription, // Store project description
      lastTaskId: 0, 
      tasks: [
        // Add initial task if description is provided
        ...(projectDescription ? [{
          id: 1,
          title: `Project Setup: ${projectName}`,
          description: projectDescription,
          status: "todo",
          priority: "high",
          dependsOn: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: []
        }] : [])
      ]
    };
    if (projectDescription) {
        initialData.lastTaskId = 1;
    }

    try {
      fs.writeFileSync(tasksFilePath, JSON.stringify(initialData, null, 2));
      // Generate the human-readable task table
      tableRenderer.writeTaskTable(initialData, workspaceRoot);
      messages.push(`Created initial tasks file: ${tasksFilePath}`);
      messages.push(`  Project Name: ${projectName}`);
      if (projectDescription) messages.push(`  Added initial task for: ${projectDescription}`);
    } catch (error) {
       throw new Error(`Failed to write tasks file ${tasksFilePath}: ${error.message}`);
    }
  } else {
    messages.push(`Tasks file already exists: ${tasksFilePath}`);
    // Optional: Check if metadata needs updating in existing file?
    // Ensure task table is in sync
    try {
      const tasksData = readTasks(workspaceRoot);
      tableRenderer.writeTaskTable(tasksData, workspaceRoot);
    } catch (error) {
      logger.error(`Failed to sync task table during init: ${error.message}`);
    }
  }

  const dirMsg = ensureDirExists(cursorRulesDir);
  if (dirMsg) messages.push(dirMsg);

  if (!fs.existsSync(cursorRulesFile)) {
    const placeholderContent = `# Cursor AI Workflow Rules for Agentic Control Framework\n\n# (Define rules here to tell Cursor how to use task-manager commands)\n\n# Example:\n# To list tasks, use the command: task-manager list\n# To get the next task: task-manager next\n`;
    try {
      fs.writeFileSync(cursorRulesFile, placeholderContent);
      messages.push(`Created placeholder Cursor rules file: ${cursorRulesFile}`);
    } catch (error) {
       throw new Error(`Failed to write cursor rules file ${cursorRulesFile}: ${error.message}`);
    }
  } else {
    messages.push(`Cursor rules file already exists: ${cursorRulesFile}`);
  }
  
  // Return success and collected messages
  return { success: true, message: messages.join('\n') };
}

// Function to read tasks from the file
function readTasks(workspaceRoot) { // Renamed argument
  const { tasksFilePath } = getWorkspacePaths(workspaceRoot); // Pass argument
  // Resolve the path to ensure it works with both relative and absolute paths
  const resolvedTasksFilePath = resolvePath(workspaceRoot, tasksFilePath);
  // logger.debug(`TASKS_FILE = ${resolvedTasksFilePath}`); // Use logger.debug instead
  
  if (!fs.existsSync(resolvedTasksFilePath)) {
    // Instead of exiting, throw an error that can be caught
    throw new Error(`Tasks file not found: ${resolvedTasksFilePath}. Please run init command first.`);
  }
  try {
    const rawData = fs.readFileSync(resolvedTasksFilePath, 'utf-8');
    // Ensure all main tasks have the new fields if loading older data
    const tasksData = JSON.parse(rawData);
    if (tasksData && Array.isArray(tasksData.tasks)) {
        tasksData.tasks.forEach(task => {
            if (task.relatedFiles === undefined) task.relatedFiles = [];
            if (task.activityLog === undefined) task.activityLog = [];
            if (task.lastSubtaskIndex === undefined) task.lastSubtaskIndex = 0; // Initialize for subtask ID fix
            // Initialize subtask fields too
            if (Array.isArray(task.subtasks)) {
                task.subtasks.forEach(subtask => {
                    if (subtask.activityLog === undefined) subtask.activityLog = [];
                });
            }
        });
    }
    return tasksData;
  } catch (error) {
    // Throw a more specific error for parsing/reading issues
    throw new Error(`Error reading or parsing tasks file ${resolvedTasksFilePath}: ${error.message}`);
  }
}

// Function to write tasks to the file
function writeTasks(workspaceRoot, data) { // Renamed argument
  const { tasksFilePath } = getWorkspacePaths(workspaceRoot); // Pass argument
  // Resolve the path to ensure it works with both relative and absolute paths
  const resolvedTasksFilePath = resolvePath(workspaceRoot, tasksFilePath);
  try {
    fs.writeFileSync(resolvedTasksFilePath, JSON.stringify(data, null, 2));
    // Generate the human-readable task table whenever tasks are updated
    tableRenderer.writeTaskTable(data, workspaceRoot);
  } catch (error) {
    // Throw an error instead of exiting
    throw new Error(`Error writing tasks file ${resolvedTasksFilePath}: ${error.message}`);
  }
}

// Helper function to add a log entry
function addActivityLog(item, message, type = 'log') {
    if (!item.activityLog) {
        item.activityLog = [];
    }
    item.activityLog.push({
        timestamp: new Date().toISOString(),
        type: type,
        message: message
    });
    item.updatedAt = new Date().toISOString(); // Also update timestamp when logging
}

// Function to add a new task
function addTask(workspaceRoot, options) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const newTaskId = tasksData.lastTaskId + 1;

  // Helper to parse comma-separated string safely
  const parseCommaSeparated = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

  const newTask = {
    id: newTaskId,
    title: options.title,
    description: options.description || '',
    status: 'todo',
    priority: options.priority || 'medium',
    dependsOn: options.dependsOn ? options.dependsOn.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
    lastSubtaskIndex: 0, // Initialize for this new task
    relatedFiles: parseCommaSeparated(options.relatedFiles), // Add relatedFiles
    activityLog: [] // Initialize activityLog
  };

  // Add initial log entry
  addActivityLog(newTask, `Task created with title: "${newTask.title}"`);

  tasksData.tasks.push(newTask);
  tasksData.lastTaskId = newTaskId;

  writeTasks(workspaceRoot, tasksData); // Pass argument
  // Return data instead of logging
  return { success: true, message: `Added new task (ID: ${newTaskId}): "${newTask.title}"`, taskId: newTaskId };
}

// Function to list tasks
function listTasks(workspaceRoot, options) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  
  let filteredTasks = [...tasksData.tasks]; // Create a copy
  
  // Apply status filter if specified
  if (options && options.status) {
    filteredTasks = filteredTasks.filter(task => task.status === options.status);
  }
  
  // If this is being used for CLI display, generate a formatted table
  if (options && options.format === 'table') {
    // Create a table with chalk for colored output
    const table = new Table({
      head: [
        chalk.cyan('ID'), 
        chalk.cyan('Title'), 
        chalk.cyan('Status'), 
        chalk.cyan('Priority'),
        chalk.cyan('Subtasks')
      ],
      colWidths: [5, 40, 15, 15, 20]
    });
    
    // Add tasks to the table
    filteredTasks.forEach(task => {
      table.push([
        task.id,
        task.title,
        getStatusColor(task.status),
        task.priority,
        `${task.subtasks.filter(s => s.status === 'done').length}/${task.subtasks.length}`
      ]);
    });
    
    // Send table to stderr for display (not stdout)
    logger.error(table.toString());
    
    // Helper for status colors
    function getStatusColor(status) {
      switch(status) {
        case 'done': return chalk.green(status);
        case 'inprogress': return chalk.yellow(status);
        case 'blocked': return chalk.red(status);
        case 'error': return chalk.bold.red(status);
        default: return status;
      }
    }
  }
  
  // If human-readable format is requested, generate the task table
  if (options && options.humanReadable) {
    return {
      success: true,
      tasks: filteredTasks,
      humanReadableTable: tableRenderer.generateTaskTable({...tasksData, tasks: filteredTasks}, workspaceRoot)
    };
  }
  
  // Return the list of tasks
  return { success: true, tasks: filteredTasks };
}

// Function to add a subtask to a parent task
function addSubtask(workspaceRoot, parentId, options) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  
  // Find the parent task
  const parentTask = tasksData.tasks.find(task => task.id === parseInt(parentId));
  if (!parentTask) {
    throw new Error(`Parent task with ID ${parentId} not found.`);
  }
  
  // Initialize lastSubtaskIndex if it doesn't exist
  if (parentTask.lastSubtaskIndex === undefined) {
    parentTask.lastSubtaskIndex = 0;
  }
  
  // Create new subtask index
  const subTaskIndex = parentTask.lastSubtaskIndex + 1;
  const subTaskId = `${parentId}.${subTaskIndex}`;
  
  // Create new subtask
  const newSubtask = {
    id: subTaskId,
    title: options.title,
    status: 'todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activityLog: [] // Initialize activityLog
  };
  
  // Add initial activity log entry
  addActivityLog(newSubtask, `Subtask created with title: "${newSubtask.title}"`);
  
  // Add to parent's subtasks
  parentTask.subtasks.push(newSubtask);
  parentTask.lastSubtaskIndex = subTaskIndex;
  
  // Update tasks.json
  writeTasks(workspaceRoot, tasksData); // Pass argument
  
  return { success: true, message: `Added subtask (ID: ${subTaskId}): "${newSubtask.title}" to task "${parentTask.title}"`, subtaskId: subTaskId };
}

// Function to update the status of a task or subtask
function updateStatus(workspaceRoot, id, newStatus, message) { // Added message parameter
  const tasksData = readTasks(workspaceRoot); // Pass argument
  
  // Normalize status
  newStatus = newStatus.toLowerCase();
  
  // Check if this is a subtask (ID contains a period)
  if (id.includes('.')) {
    const [parentId, subtaskIndex] = id.split('.');
    const parentTask = tasksData.tasks.find(task => task.id === parseInt(parentId));
    
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found.`);
    }
    
    const subtask = parentTask.subtasks.find(st => st.id === id);
    if (!subtask) {
      throw new Error(`Subtask with ID ${id} not found.`);
    }
    
    // Update status
    const oldStatus = subtask.status;
    subtask.status = newStatus;
    subtask.updatedAt = new Date().toISOString();
    
    // Add activity log
    const logMessage = message || `Status changed from ${oldStatus} to ${newStatus}`;
    addActivityLog(subtask, logMessage, 'status');
    
    writeTasks(workspaceRoot, tasksData); // Pass argument
    return { success: true, message: `Updated subtask "${subtask.title}" (ID: ${id}) status to ${newStatus}` };
  } else {
    // Main task
    const task = tasksData.tasks.find(task => task.id === parseInt(id));
    if (!task) {
      throw new Error(`Task with ID ${id} not found.`);
    }
    
    // Update status
    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    
    // Add activity log
    const logMessage = message || `Status changed from ${oldStatus} to ${newStatus}`;
    addActivityLog(task, logMessage, 'status');
    
    writeTasks(workspaceRoot, tasksData); // Pass argument
    return { success: true, message: `Updated task "${task.title}" (ID: ${id}) status to ${newStatus}` };
  }
}

// Function to get the next actionable task
function getNextTask(workspaceRoot) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  
  // Filter for todo tasks
  const todoTasks = tasksData.tasks.filter(task => task.status === 'todo');
  
  if (todoTasks.length === 0) {
    logger.debug("No actionable tasks found (check statuses and dependencies).");
    return { success: false, message: "No actionable tasks found." };
  }
  
  // Sort by priority (high > medium > low)
  const priorityValues = { 'high': 3, 'medium': 2, 'low': 1 };
  todoTasks.sort((a, b) => {
    // Sort first by priority
    const priorityDiff = (priorityValues[b.priority] || 0) - (priorityValues[a.priority] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by ID (older tasks first)
    return a.id - b.id;
  });
  
  // Filter out tasks with dependencies on non-done tasks
  const actionableTasks = todoTasks.filter(task => {
    // If no dependencies, it's actionable
    if (!task.dependsOn || task.dependsOn.length === 0) return true;
    
    // Check if all dependencies are done
    return task.dependsOn.every(depId => {
      const depTask = tasksData.tasks.find(t => t.id === depId);
      return depTask && depTask.status === 'done';
    });
  });
  
  if (actionableTasks.length === 0) {
    return { success: false, message: "No actionable tasks found (all todo tasks have unmet dependencies)." };
  }
  
  const nextTask = actionableTasks[0];
  
  // For CLI, format nicely
  logger.debug('Next Actionable Task:');
  logger.debug(`  ID: ${nextTask.id}`);
  logger.debug(`  Title: ${nextTask.title}`);
  logger.debug(`  Status: ${nextTask.status}`);
  logger.debug(`  Priority: ${nextTask.priority}`);
  if (nextTask.description) {
    logger.debug(`  Description: ${nextTask.description}`);
  }
  if (nextTask.subtasks && nextTask.subtasks.length > 0) {
    logger.debug('  Subtasks:');
    nextTask.subtasks.forEach(sub => logger.debug(`    - [${sub.status}] ${sub.title} (ID: ${sub.id})`));
  }
  
  return { success: true, task: nextTask, message: `Next task: "${nextTask.title}" (ID: ${nextTask.id}, Priority: ${nextTask.priority})` };
}

// Function to update fields of a task or subtask
function updateTask(workspaceRoot, id, options) { // Renamed argument
  const tasksData = readTasks(workspaceRoot);
  let itemUpdated = false;
  let item = null; // Store the item being updated
  const idString = String(id);

  const { title, description, priority, relatedFiles, message } = options;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (!idString.includes('.')) {
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;
      if (relatedFiles !== undefined) {
        const parseCommaSeparated = (str) => typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
        updates.relatedFiles = parseCommaSeparated(relatedFiles);
      }
  }

  if (Object.keys(updates).length === 0 && !message) {
      return { success: false, message: "No update options or message provided."};
  }

  // Find the task or subtask
  if (idString.includes('.')) {
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTask = tasksData.tasks.find(task => task.id === parentId);
    if (parentTask) {
        if (!parentTask.subtasks) parentTask.subtasks = [];
        const subtaskIndex = parentTask.subtasks.findIndex(sub => sub.id === idString);
        if (subtaskIndex !== -1) {
            item = parentTask.subtasks[subtaskIndex];
            if(updates.title !== undefined) {
                 item.title = updates.title;
                 itemUpdated = true;
            }
            parentTask.updatedAt = new Date().toISOString();
        }
    }
  } else {
    const taskId = parseInt(idString);
    item = tasksData.tasks.find(task => task.id === taskId);
  }

  if(item) {
        if (Object.keys(updates).length > 0 && !idString.includes('.')) {
             if (updates.relatedFiles && item.relatedFiles === undefined) item.relatedFiles = [];
             Object.assign(item, updates);
             itemUpdated = true;
        } else if (updates.title !== undefined && idString.includes('.')) {
             item.title = updates.title;
             itemUpdated = true;
        }

       if (message) {
           addActivityLog(item, message, 'log');
           itemUpdated = true;
       }

        if (itemUpdated) {
           item.updatedAt = new Date().toISOString();
           writeTasks(workspaceRoot, tasksData);
           const successMsg = `Updated task/subtask "${item.title}" (ID: ${idString}).${message ? ' Logged: "' + message + '"' : ''}`;
           return { success: true, message: successMsg };
        } else {
             return { success: true, message: `No fields updated for task/subtask "${item.title}" (ID: ${idString}).${message ? ' Logged: "' + message + '"' : ''}` };
        }
  } else {
        throw new Error(`Task or subtask with ID ${idString} not found.`);
  }
}

// Function to remove a task or subtask
function removeTask(workspaceRoot, id) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  let itemRemoved = false;
  let itemTitle = '';
  const idString = String(id);

  if (idString.includes('.')) {
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parentId);

    if (parentTaskIndex !== -1) {
        if (!tasksData.tasks[parentTaskIndex].subtasks) tasksData.tasks[parentTaskIndex].subtasks = [];
        const subtaskIndex = tasksData.tasks[parentTaskIndex].subtasks.findIndex(sub => sub.id === idString);
        if (subtaskIndex !== -1) {
            itemTitle = tasksData.tasks[parentTaskIndex].subtasks[subtaskIndex].title;
            tasksData.tasks[parentTaskIndex].subtasks.splice(subtaskIndex, 1);
            tasksData.tasks[parentTaskIndex].updatedAt = new Date().toISOString();
            itemRemoved = true;
        }
    }
  } else {
    const taskId = parseInt(idString);
    const taskIndex = tasksData.tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
      itemTitle = tasksData.tasks[taskIndex].title;
      tasksData.tasks.splice(taskIndex, 1);
      itemRemoved = true;
    }
  }

  if (itemRemoved) {
    writeTasks(workspaceRoot, tasksData);
    // Return data instead of logging
    return { success: true, message: `Removed task/subtask "${itemTitle}" (ID: ${idString}).` };
  } else {
    throw new Error(`Task or subtask with ID ${idString} not found.`);
  }
}

// Function to generate individual Markdown files for each task
function generateTaskFiles(workspaceRoot) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const { taskFilesDir } = getWorkspacePaths(workspaceRoot); // Pass argument
  
  // Create tasks directory if it doesn't exist
  try {
    const dirMsg = ensureDirExists(taskFilesDir);
    if (dirMsg) logger.info(dirMsg);
  } catch (error) {
    throw new Error(`Failed to create tasks directory: ${error.message}`);
  }
  
  // Generate one file per task
  let filesCreated = 0;
  
  try {
    tasksData.tasks.forEach(task => {
      const taskFileName = `task-${task.id}-${task.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
      // Use resolvePath to ensure the path is resolved correctly against the workspace root
      const filePath = resolvePath(workspaceRoot, path.join(taskFilesDir, taskFileName));
      
      // Generate Markdown content
      let content = `# Task ${task.id}: ${task.title}\n\n`;
      content += `**Status:** ${task.status}\n`;
      content += `**Priority:** ${task.priority}\n`;
      
      if (task.description) {
        content += `\n## Description\n\n${task.description}\n`;
      }
      
      if (task.dependsOn && task.dependsOn.length > 0) {
        content += `\n## Dependencies\n\n`;
        task.dependsOn.forEach(depId => {
          const depTask = tasksData.tasks.find(t => t.id === depId);
          content += `- Task ${depId}: ${depTask ? depTask.title : 'Unknown Task'}\n`;
        });
      }
      
      if (task.relatedFiles && task.relatedFiles.length > 0) {
        content += `\n## Related Files\n\n`;
        task.relatedFiles.forEach(file => {
          content += `- \`${file}\`\n`;
        });
      }
      
      if (task.subtasks && task.subtasks.length > 0) {
        content += `\n## Subtasks\n\n`;
        task.subtasks.forEach(subtask => {
          content += `- [${subtask.status === 'done' ? 'x' : ' '}] **${subtask.id}:** ${subtask.title}\n`;
        });
      }
      
      if (task.activityLog && task.activityLog.length > 0) {
        content += `\n## Activity Log\n\n`;
        task.activityLog.forEach(entry => {
          // Format timestamp for display
          const date = new Date(entry.timestamp);
          const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          content += `- **${formattedDate}** [${entry.type}]: ${entry.message}\n`;
        });
      }
      
      fs.writeFileSync(filePath, content);
      filesCreated++;
    });
    
    return { success: true, message: `Generated ${filesCreated} task files in the '${taskFilesDir}' directory.` };
  } catch (error) {
    logger.error(`Error writing task file: ${error.message}`);
    throw new Error(`Failed to generate task files: ${error.message}`);
  }
}

// Utility function to resolve paths against the workspace root
function resolvePath(workspaceRoot, filePath) {
  if (!filePath) return null;
  
  // If it's already an absolute path, return it as is
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  // Otherwise, resolve it against the workspace root
  return path.resolve(workspaceRoot, filePath);
}

// Function to parse a PRD file using the Gemini API
async function parsePrd(workspaceRoot, prdFilePath) { // Renamed argument
  logger.debug(`Attempting to parse PRD: ${prdFilePath}`);
  
  try {
    // Resolve relative paths against the workspace root
    let resolvedPath = resolvePath(workspaceRoot, prdFilePath);
    logger.debug(`Resolved path: ${resolvedPath}`);
    
    // Directly use prdParser to parse the PRD
    const tasks = await prdParser.parsePrdWithGemini(resolvedPath);
    
    if (!tasks || tasks.length === 0) {
      logger.error("Failed to generate tasks from PRD.");
      return { success: false, message: "Failed to generate tasks from PRD." };
    }
    
    // Add generated tasks to tasks.json
    const tasksData = readTasks(workspaceRoot);
    let nextId = tasksData.lastTaskId + 1;
    
    const addedTasks = [];
    
    // Process each task
    for (const taskInfo of tasks) {
      // Create the main task
      const newTask = {
        id: nextId,
        title: taskInfo.title,
        description: taskInfo.description || '',
        status: 'todo',
        priority: taskInfo.priority || 'medium',
        dependsOn: taskInfo.dependsOn || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
        lastSubtaskIndex: 0,
        relatedFiles: taskInfo.relatedFiles || [],
        activityLog: []
      };
      
      // Add initial log entry
      addActivityLog(newTask, `Task created from PRD: "${newTask.title}"`);
      
      // Add subtasks if they exist
      if (taskInfo.subtasks && taskInfo.subtasks.length > 0) {
        taskInfo.subtasks.forEach((subtaskTitle, index) => {
          const subtaskId = `${nextId}.${index + 1}`;
          const subtask = {
            id: subtaskId,
            title: subtaskTitle,
            status: 'todo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activityLog: []
          };
          
          // Add initial log entry
          addActivityLog(subtask, `Subtask created from PRD: "${subtask.title}"`);
          
          newTask.subtasks.push(subtask);
          newTask.lastSubtaskIndex = index + 1;
        });
      }
      
      // Add to tasks list
      tasksData.tasks.push(newTask);
      addedTasks.push(newTask);
      nextId++;
      
      // Save after each task is added to ensure progress is preserved
      tasksData.lastTaskId = nextId - 1;
      writeTasks(workspaceRoot, tasksData);
      logger.info(`Added and saved task: ${newTask.title} (ID: ${newTask.id})`);
    }
    
    // Update lastTaskId (already updated in the loop)
    // tasksData.lastTaskId = nextId - 1;
    
    // Final save
    writeTasks(workspaceRoot, tasksData);
    
    // Generate a checkpoint report file
    const reportPath = path.join(workspaceRoot, `prd_parsing_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    let reportContent = `# PRD Parsing Report\n\n`;
    reportContent += `## Summary\n\n`;
    reportContent += `- Generated ${addedTasks.length} tasks from PRD document\n`;
    reportContent += `- Date: ${new Date().toLocaleString()}\n\n`;
    
    reportContent += `## Tasks Overview\n\n`;
    addedTasks.forEach(task => {
      reportContent += `### Task ${task.id}: ${task.title}\n`;
      reportContent += `- Priority: ${task.priority}\n`;
      reportContent += `- Status: ${task.status}\n`;
      reportContent += `- Description: ${task.description}\n`;
      
      if (task.dependsOn && task.dependsOn.length > 0) {
        reportContent += `- Depends on: ${task.dependsOn.join(', ')}\n`;
      }
      
      if (task.subtasks && task.subtasks.length > 0) {
        reportContent += `\n#### Subtasks:\n`;
        task.subtasks.forEach(subtask => {
          reportContent += `- ${subtask.id}: ${subtask.title}\n`;
        });
      }
      reportContent += `\n`;
    });
    
    // Identify testing tasks specifically
    const testTasks = addedTasks.filter(task => task.title.startsWith('Test:') || task.title.includes('Test') || task.title.includes('Testing'));
    if (testTasks.length > 0) {
      reportContent += `## Testing Strategy\n\n`;
      reportContent += `The following test tasks were generated:\n\n`;
      testTasks.forEach(task => {
        reportContent += `- ${task.title}\n`;
      });
      reportContent += `\nEnsure these tests are executed after their corresponding implementation tasks.\n`;
    }
    
    fs.writeFileSync(reportPath, reportContent);
    logger.info(`Generated PRD parsing report at: ${reportPath}`);
    
    return { 
      success: true, 
      message: `Created ${addedTasks.length} tasks from PRD document. Report saved to ${reportPath}`, 
      tasks: addedTasks
    };
  } catch (error) {
    throw new Error(`Error parsing PRD: ${error.message}`);
  }
}

// Common function to call the Gemini API, used by expandTask and reviseTasks
async function callGeminiApi(prompt, type = 'generation') {
  logger.debug(`Calling Gemini API (type: ${type})`);
  
  try {
    // We use different functions from prdParser depending on the type of operation
    let result;
    
    if (type === 'expansion') {
      // For expanding tasks, we'll create a mock parent task with the prompt
      const mockTask = { id: 'temp', title: prompt, description: '' };
      result = await prdParser.expandTaskWithGemini(mockTask);
    } else if (type === 'revision') {
      // For revising tasks, we'll call reviseTasksWithGemini with empty past tasks
      // and the prompt as the change request
      result = await prdParser.reviseTasksWithGemini(prompt, [], [{ id: 'temp', title: 'temp', description: prompt }]);
    } else {
      // For other types, we'll use parsePrdWithGemini with a temporary file
      const tempFile = path.join(os.tmpdir(), 'temp_prompt.txt');
      fs.writeFileSync(tempFile, prompt);
      result = await prdParser.parsePrdWithGemini(tempFile);
      // Clean up the temporary file
      try { fs.unlinkSync(tempFile); } catch (e) { /* ignore cleanup errors */ }
    }
    
    logger.debug(`Received response from Gemini API.`);
    return result;
  } catch (error) {
    logger.error(`Error calling Gemini API: ${error.message}`);
    throw error;
  }
}

// Function to expand a task into subtasks using Gemini API
async function expandTask(workspaceRoot, taskId) { 
  try {
    // Read tasks data
    const tasksData = readTasks(workspaceRoot);
    
    // Find the task
    const task = tasksData.tasks.find(t => t.id === parseInt(taskId));
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }
    
    // Prepare prompt for Gemini
    const prompt = `
    Please break down the following task into a list of specific subtasks. 
    Return ONLY the subtask titles, one per line, with no numbering or bullets. 
    Each subtask should be clear, actionable, and represent a distinct step or component.
    
    Task: ${task.title}
    ${task.description ? `Description: ${task.description}` : ''}
    `;
    
    // Call Gemini API
    logger.debug(`Sending task (ID: ${taskId}) to Gemini API for expansion...`);
    const response = await callGeminiApi(prompt, 'expansion');
    logger.debug("Successfully received response from Gemini API for expansion.");
    
    // Parse the response
    let subtaskTitles = [];
    
    // Check if response is already an array of strings 
    if (Array.isArray(response)) {
      subtaskTitles = response.map(item => item.toString().trim()).filter(item => item.length > 0);
      logger.debug(`Received ${subtaskTitles.length} subtask titles from Gemini response array.`);
    } else if (typeof response === 'string') {
      // String response handling
      const cleanedResponse = response.trim();
      logger.debug(`Processing string response of length ${cleanedResponse.length}`);
      
      // First try to parse as JSON
      try {
        const jsonResult = JSON.parse(cleanedResponse);
        if (Array.isArray(jsonResult)) {
          subtaskTitles = jsonResult.map(item => item.toString().trim()).filter(item => item.length > 0);
          logger.debug(`Parsed JSON array with ${subtaskTitles.length} subtask titles`);
        } else {
          logger.warn("JSON response is not an array, falling back to line splitting");
          // If JSON but not array, treat as text
          subtaskTitles = cleanedResponse
            .replace(/^\s*[-*•#]\s*/gm, '') // Remove bullets
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        }
      } catch (jsonError) {
        // Not valid JSON, process as plain text
        logger.debug(`Not valid JSON: ${jsonError.message}, processing as plain text`);
        subtaskTitles = cleanedResponse
          .replace(/^\s*[-*•#]\s*/gm, '') // Remove bullets
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        logger.debug(`Extracted ${subtaskTitles.length} subtask titles from text`);
      }
    } else if (response === null) {
      return { 
        success: false, 
        message: "Failed to get a response from Gemini API. Check your API key and network connection." 
      };
    } else {
      // Handle other types of responses by converting to string if possible
      logger.warn(`Unexpected response type from Gemini API: ${typeof response}, attempting to convert`);
      try {
        if (response && response.toString) {
          const stringResponse = response.toString().trim();
          subtaskTitles = stringResponse
            .replace(/^\s*[-*•#]\s*/gm, '') // Remove bullets
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
          
          logger.debug(`Converted response to string and extracted ${subtaskTitles.length} subtask titles`);
        } else {
          return { 
            success: false, 
            message: "Failed to generate subtasks: unexpected response format." 
          };
        }
      } catch (conversionError) {
        logger.error(`Failed to convert response: ${conversionError.message}`);
        return { 
          success: false, 
          message: `Failed to process response: ${conversionError.message}` 
        };
      }
    }
    
    if (!subtaskTitles || subtaskTitles.length === 0) {
      return { 
        success: false, 
        message: "No subtasks could be generated from the Gemini response." 
      };
    }
    
    // Clear existing subtasks if any
    const originalSubtaskCount = task.subtasks.length;
    task.subtasks = [];
    task.lastSubtaskIndex = 0;
    
    // Add new subtasks
    subtaskTitles.forEach((title, index) => {
      const subtaskId = `${taskId}.${index + 1}`;
      const subtask = {
        id: subtaskId,
        title: title,
        status: 'todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activityLog: []
      };
      
      // Add initial log entry
      addActivityLog(subtask, `Subtask created via AI expansion: "${subtask.title}"`);
      
      task.subtasks.push(subtask);
      task.lastSubtaskIndex = index + 1;
    });
    
    // Add log to main task
    addActivityLog(task, `Task expanded using AI. ${originalSubtaskCount > 0 ? `Replaced ${originalSubtaskCount} existing subtasks with` : 'Added'} ${subtaskTitles.length} new subtasks.`);
    
    // Save changes
    writeTasks(workspaceRoot, tasksData);
    
    return { 
      success: true, 
      message: `Successfully generated ${subtaskTitles.length} subtasks for task ${taskId}.`,
      task: task
    };
  } catch (error) {
    logger.error(`Error in expandTask: ${error.message}`);
    return { 
      success: false, 
      message: `Error expanding task ${taskId}: ${error.message}` 
    };
  }
}

// Function to revise future tasks based on a prompt
async function reviseTasks(workspaceRoot, fromTaskId, prompt) {
  try {
    // Read tasks data
    const tasksData = readTasks(workspaceRoot);
    
    // Find the task index
    const taskIndex = tasksData.tasks.findIndex(t => t.id === parseInt(fromTaskId));
    if (taskIndex === -1) {
      throw new Error(`Task with ID ${fromTaskId} not found.`);
    }
    
    // Get the future tasks (the specified task and all tasks after it)
    const futureTasks = tasksData.tasks.slice(taskIndex);
    
    // Prepare existing tasks data for the prompt
    const existingTasksData = futureTasks.map(task => {
      return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        hasSubtasks: task.subtasks && task.subtasks.length > 0,
        subtaskCount: task.subtasks ? task.subtasks.length : 0
      };
    });
    
    // Prepare prompt for Gemini
    const apiPrompt = `
    I have a list of tasks in my project, and I need to revise them based on the following change:
    "${prompt}"
    
    Here are the current tasks:
    ${JSON.stringify(existingTasksData, null, 2)}
    
    Please revise these tasks considering the change. For each task, provide:
    1. The task ID (keep the original IDs)
    2. A revised title that better reflects the new direction
    3. A revised description if needed
    4. Should this task still have subtasks? (true/false)
    
    Important: Return a valid JSON array where each element has the fields: id, title, description, keepSubtasks.
    `;
    
    // Call Gemini API
    logger.debug(`Sending ${futureTasks.length} tasks starting from ID ${fromTaskId} to Gemini API for revision...`);
    const response = await callGeminiApi(apiPrompt, 'revision');
    logger.debug("Successfully received response from Gemini API for revision.");
    
    let revisedTasksData = [];
    
    // Check if response is already an array of task objects
    if (Array.isArray(response)) {
      revisedTasksData = response;
      logger.debug(`Received ${revisedTasksData.length} revised tasks from Gemini response.`);
    } else if (typeof response === 'string') {
      // Parse string response for backward compatibility
      try {
        // Try to parse the response as JSON
        const cleanedResponse = response.trim();
        revisedTasksData = JSON.parse(cleanedResponse);
        
        // Ensure we have an array
        if (!Array.isArray(revisedTasksData)) {
          throw new Error("Response is not a valid JSON array");
        }
        
        logger.debug(`Parsed ${revisedTasksData.length} revised tasks from Gemini response.`);
      } catch (parseError) {
        logger.error(`Failed to parse Gemini response as JSON array: ${parseError.message}`);
        return { 
          success: false, 
          message: `Failed to parse API response: ${parseError.message}` 
        };
      }
    } else if (response === null) {
      return { 
        success: false, 
        message: "Failed to get a response from Gemini API. Check your API key and network connection." 
      };
    } else {
      logger.error(`Unexpected response type from Gemini API: ${typeof response}`);
      return { 
        success: false, 
        message: "Failed to revise tasks: unexpected response format." 
      };
    }
    
    if (!revisedTasksData || revisedTasksData.length === 0) {
      return { 
        success: false, 
        message: "No task revisions were generated from the Gemini response." 
      };
    }
    
    // Apply revisions to the tasks
    let changedTaskCount = 0;
    revisedTasksData.forEach(revisedTask => {
      const taskId = parseInt(revisedTask.id);
      const originalTask = tasksData.tasks.find(t => t.id === taskId);
      
      if (originalTask) {
        let isChanged = false;
        
        // Check if title changed
        if (revisedTask.title && revisedTask.title !== originalTask.title) {
          const oldTitle = originalTask.title;
          originalTask.title = revisedTask.title;
          addActivityLog(originalTask, `Title changed from "${oldTitle}" to "${revisedTask.title}" during revision.`);
          isChanged = true;
        }
        
        // Check if description changed
        if (revisedTask.description && revisedTask.description !== originalTask.description) {
          const oldDesc = originalTask.description || '(none)';
          originalTask.description = revisedTask.description;
          addActivityLog(originalTask, `Description changed from "${oldDesc}" to "${revisedTask.description}" during revision.`);
          isChanged = true;
        }
        
        // Handle subtasks (optionally clear them)
        if (revisedTask.keepSubtasks === false && originalTask.subtasks && originalTask.subtasks.length > 0) {
          const subtaskCount = originalTask.subtasks.length;
          originalTask.subtasks = [];
          originalTask.lastSubtaskIndex = 0;
          addActivityLog(originalTask, `Removed ${subtaskCount} subtasks during revision as they no longer apply.`);
          isChanged = true;
        }
        
        // Update the updatedAt timestamp if changes were made
        if (isChanged) {
          originalTask.updatedAt = new Date().toISOString();
          changedTaskCount++;
        }
      }
    });
    
    // Save changes
    writeTasks(workspaceRoot, tasksData);
    
    return { 
      success: true, 
      message: `Successfully revised ${changedTaskCount} tasks based on the prompt: "${prompt}".`,
      changedTaskCount: changedTaskCount
    };
  } catch (error) {
    throw new Error(`Error revising tasks: ${error.message}`);
  }
}

// Function to get detailed context for a specific task
function getContext(workspaceRoot, id) {
  const tasksData = readTasks(workspaceRoot);
  
  // Check if task ID includes a period (subtask)
  if (id.includes('.')) {
    const [parentId, subtaskIndex] = id.split('.');
    const parentTask = tasksData.tasks.find(task => task.id === parseInt(parentId));
    
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found.`);
    }
    
    const subtask = parentTask.subtasks.find(st => st.id === id);
    if (!subtask) {
      throw new Error(`Subtask with ID ${id} not found.`);
    }
    
    return {
      success: true,
      context: {
        ...subtask,
        parentTask: {
          id: parentTask.id,
          title: parentTask.title,
          status: parentTask.status,
          description: parentTask.description,
          relatedFiles: parentTask.relatedFiles
        }
      }
    };
  } else {
    // Main task
    const task = tasksData.tasks.find(task => task.id === parseInt(id));
    if (!task) {
      throw new Error(`Task with ID ${id} not found.`);
    }
    
    return {
      success: true,
      context: task
    };
  }
}

// Function to generate a human-readable task table file
function generateHumanReadableTaskTable(workspaceRoot) {
  try {
    const tasksData = readTasks(workspaceRoot);
    const tableRenderer = require('./tableRenderer');
    const success = tableRenderer.writeTaskTable(tasksData, workspaceRoot);
    
    if (success) {
      return { 
        success: true, 
        message: `Human-readable task table has been generated.` 
      };
    } else {
      return {
        success: false,
        message: 'Failed to generate human-readable task table.'
      };
    }
  } catch (error) {
    throw new Error(`Error generating human-readable task table: ${error.message}`);
  }
}

// Export all the functions
module.exports = {
  initProject,
  addTask,
  listTasks,
  addSubtask,
  updateStatus,
  getNextTask,
  updateTask,
  removeTask,
  generateTaskFiles,
  getContext,
  parsePrd,
  expandTask,
  reviseTasks,
  callGeminiApi, // Adding this for testing purposes
  
  // Utility exports for testing
  readTasks,
  writeTasks,
  resolvePath,
  generateHumanReadableTaskTable
};
