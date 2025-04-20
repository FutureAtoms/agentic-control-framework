const fs = require('fs');
const path = require('path');
const prdParser = require('./prd_parser'); // Import the PRD parser
const Table = require('cli-table3'); // Import cli-table3
const chalk = require('chalk'); // Import chalk (v4)

// --- Path Calculation Helper ---
// Helper function to get paths based on the script's location
function getWorkspacePaths(workspaceRoot) { // Added workspaceRoot argument
  if (!workspaceRoot) {
    // Fallback or error if workspaceRoot isn't provided - might need adjustment
    console.error("ERROR: Workspace root not provided to getWorkspacePaths.");
    // Use process.cwd() instead as a more reliable fallback
    workspaceRoot = process.cwd();
    console.error(`CORE WARN: Falling back to current working directory: ${workspaceRoot}`);
  }
  
  return {
    tasksFilePath: path.join(workspaceRoot, 'tasks.json'),
    cursorRulesDir: path.join(workspaceRoot, '.cursor', 'rules'),
    cursorRulesFile: path.join(workspaceRoot, '.cursor', 'rules', 'task_manager_workflow.mdc'),
    taskFilesDir: path.join(workspaceRoot, 'tasks')
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
      messages.push(`Created initial tasks file: ${tasksFilePath}`);
      messages.push(`  Project Name: ${projectName}`);
      if (projectDescription) messages.push(`  Added initial task for: ${projectDescription}`);
    } catch (error) {
       throw new Error(`Failed to write tasks file ${tasksFilePath}: ${error.message}`);
    }
  } else {
    messages.push(`Tasks file already exists: ${tasksFilePath}`);
    // Optional: Check if metadata needs updating in existing file?
  }

  const dirMsg = ensureDirExists(cursorRulesDir);
  if (dirMsg) messages.push(dirMsg);

  if (!fs.existsSync(cursorRulesFile)) {
    const placeholderContent = `# Cursor AI Workflow Rules for Gemini Task Manager\n\n# (Define rules here to tell Cursor how to use task-manager commands)\n\n# Example:\n# To list tasks, use the command: task-manager list\n# To get the next task: task-manager next\n`;
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
  // console.error(`DEBUG [readTasks]: TASKS_FILE = ${tasksFilePath}`); // Removed debug log
  
  if (!fs.existsSync(tasksFilePath)) {
    // Instead of exiting, throw an error that can be caught
    throw new Error(`Tasks file not found: ${tasksFilePath}. Please run init command first.`);
    // console.error(`Error: Tasks file not found: ${tasksFilePath}`);
    // console.error('Please run "task-manager init" first.');
    // process.exit(1); // Avoid exiting
  }
  try {
    const rawData = fs.readFileSync(tasksFilePath, 'utf-8');
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
    throw new Error(`Error reading or parsing tasks file ${tasksFilePath}: ${error.message}`);
    // console.error(`Error reading or parsing tasks file: ${tasksFilePath}`, error);
    // process.exit(1); // Avoid exiting
  }
}

// Function to write tasks to the file
function writeTasks(workspaceRoot, data) { // Renamed argument
  const { tasksFilePath } = getWorkspacePaths(workspaceRoot); // Pass argument
  try {
    fs.writeFileSync(tasksFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    // Throw an error instead of exiting
    throw new Error(`Error writing tasks file ${tasksFilePath}: ${error.message}`);
    // console.error(`Error writing tasks file: ${tasksFilePath}`, error);
    // process.exit(1); // Avoid exiting
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
  const { status } = options;

  let tasksToDisplay = tasksData.tasks;

  if (status) {
    tasksToDisplay = tasksData.tasks.filter(task => task.status === status);
  }

  // Return format for MCP server
  return { tasks: tasksToDisplay }; 

  /* --- Original Table Logging (Removed for MCP return) ---
  if (tasksToDisplay.length === 0) { ... }
  const table = new Table({...});
  const getStatusColor = (status) => { ... };
  tasksToDisplay.forEach(task => { ... });
  console.log(table.toString());
  */
}

// Function to add a subtask to a parent task
function addSubtask(workspaceRoot, parentId, options) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parseInt(parentId));

  if (parentTaskIndex === -1) {
    throw new Error(`Parent task with ID ${parentId} not found.`);
  }

  const parentTask = tasksData.tasks[parentTaskIndex];

  // **Fix: Use and increment lastSubtaskIndex on the parent task**
  parentTask.lastSubtaskIndex = (parentTask.lastSubtaskIndex || 0) + 1;
  const nextSubtaskIndex = parentTask.lastSubtaskIndex;
  const newSubtaskId = `${parentTask.id}.${nextSubtaskIndex}`;

  const newSubtask = {
    id: newSubtaskId,
    title: options.title,
    status: 'todo', // Default status for new subtasks
    activityLog: [] // Initialize activity log for subtask
  };

  // Initialize subtasks array if it doesn't exist
  if (!parentTask.subtasks) {
    parentTask.subtasks = [];
  }
  // Add initial log entry to subtask
  addActivityLog(newSubtask, `Subtask created with title: "${newSubtask.title}"`);

  parentTask.subtasks.push(newSubtask);
  parentTask.updatedAt = new Date().toISOString(); // Update parent task timestamp

  writeTasks(workspaceRoot, tasksData); // Pass argument
  // Return data instead of logging
  return { success: true, message: `Added subtask "${newSubtask.title}" (ID: ${newSubtaskId}) to task ${parentId}.`, subtaskId: newSubtaskId };
}

// Function to update the status of a task or subtask
function updateStatus(workspaceRoot, id, newStatus, message) { // Added message parameter
  const tasksData = readTasks(workspaceRoot);
  let item = null; // Store the item being updated
  const idString = String(id);

  // Find the task or subtask
  if (idString.includes('.')) {
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTask = tasksData.tasks.find(task => task.id === parentId);
    if (parentTask) {
      if (!parentTask.subtasks) parentTask.subtasks = [];
      item = parentTask.subtasks.find(sub => sub.id === idString);
      if (item) {
        parentTask.updatedAt = new Date().toISOString();
      }
    }
  } else {
    const taskId = parseInt(idString);
    item = tasksData.tasks.find(task => task.id === taskId);
  }

  if (item) {
    const oldStatus = item.status;
    item.status = newStatus;
    item.updatedAt = new Date().toISOString();

    const logMessage = message || `Status changed from "${oldStatus}" to "${newStatus}"`;
    const logType = newStatus === 'error' ? 'error' : 'status';
    addActivityLog(item, logMessage, logType);

    writeTasks(workspaceRoot, tasksData);
    // Return data instead of logging
    const successMsg = `Updated status of "${item.title}" (ID: ${idString}) to "${newStatus}".${message ? ' Logged: "' + message + '"' : ''}`;
    return { success: true, message: successMsg };
  } else {
    throw new Error(`Task or subtask with ID ${idString} not found.`);
  }
}

// Function to get the next available task
function getNextTask(workspaceRoot) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const tasks = tasksData.tasks;

  // Filter for tasks that are strictly 'todo' and not blocked
  const actionableTasks = tasks.filter(task => 
    task.status === 'todo' && // Only consider tasks explicitly marked as 'todo'
    task.dependsOn.every(depId => { // Check if all dependencies are met
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'done';
    })
  );

  if (actionableTasks.length === 0) {
    // Return a structured response instead of logging directly
    return { success: true, task: null, message: "No actionable 'todo' tasks found (check statuses and dependencies)." }; 
    // console.log("No actionable tasks found (check statuses and dependencies).");
    // return null; // Return null if no task found
  }

  // Prioritize based on priority (high > medium > low)
  const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
  actionableTasks.sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 3;
    const priorityB = priorityOrder[b.priority] || 3;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // If priority is the same, prioritize older tasks (smaller ID)
    return a.id - b.id; 
  });

  const nextTask = actionableTasks[0];

  // Return format for MCP server / CLI
  return { success: true, task: nextTask, message: `Next task: ${nextTask.id} - ${nextTask.title}` };
  // return nextTask; // Return object or null

  /* --- Original Console Logging (Removed for MCP return) ---
  console.log('Next Actionable Task:');
  console.log(`  ID: ${nextTask.id}`);
  console.log(`  Title: ${nextTask.title}`);
  console.log(`  Status: ${nextTask.status}`);
  console.log(`  Priority: ${nextTask.priority}`);
  if (nextTask.description) {
    console.log(`  Description: ${nextTask.description}`);
  }
  if (nextTask.subtasks && nextTask.subtasks.length > 0) {
    console.log('  Subtasks:');
    nextTask.subtasks.forEach(sub => console.log(`    - [${sub.status}] ${sub.title} (ID: ${sub.id})`));
  }
  */
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

// Function to generate individual task files
function generateTaskFiles(workspaceRoot) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const { taskFilesDir } = getWorkspacePaths(workspaceRoot); // Pass argument
  ensureDirExists(taskFilesDir); // Ensure the output directory exists

  let filesGenerated = 0;
  tasksData.tasks.forEach(task => {
    // Format the task details into a string (e.g., Markdown)
    let fileContent = `# Task ${task.id}: ${task.title}\n\n`;
    fileContent += `**Status:** ${task.status}\n`;
    fileContent += `**Priority:** ${task.priority}\n`;
    if (task.description) {
      fileContent += `**Description:**\n${task.description}\n`;
    }
    if (task.dependsOn && task.dependsOn.length > 0) {
      fileContent += `**Depends On:** ${task.dependsOn.join(', ')}\n`;
    }
    // Add related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
        fileContent += `**Related Files:**\n`;
        task.relatedFiles.forEach(file => {
            fileContent += `* ${file}\n`;
        });
    }
    if (task.subtasks && task.subtasks.length > 0) {
      fileContent += `\n**Subtasks:**\n`;
      task.subtasks.forEach(sub => {
        fileContent += `*   [${sub.id}] ${sub.title} [${sub.status}]\n`;
      });
    }
    // Add activity log
    if (task.activityLog && task.activityLog.length > 0) {
        fileContent += `\n**Activity Log:**\n`;
        task.activityLog.forEach(log => {
            fileContent += `* ${log.timestamp} [${log.type}] ${log.message}\n`;
        });
    }
    fileContent += `\n*Created:* ${task.createdAt}\n`;
    fileContent += `*Updated:* ${task.updatedAt}\n`;

    const filename = `task_${String(task.id).padStart(3, '0')}.md`;
    const filePath = path.join(taskFilesDir, filename);

    try {
      fs.writeFileSync(filePath, fileContent);
      filesGenerated++;
    } catch (error) {
      console.error(`Error writing task file: ${filePath}`, error);
      // Don't stop generation for one file error, just log it
    }
  });
  // Return data instead of logging
  const successMsg = `Generated ${filesGenerated} task files in the '${taskFilesDir}' directory.`;
  return { success: true, message: successMsg, filesGenerated: filesGenerated };
}

// Function to parse PRD and add tasks
async function parsePrd(workspaceRoot, prdFilePath) { // Renamed argument
  console.log(`Attempting to parse PRD: ${prdFilePath}`); // Keep this log
  const generatedTasks = await prdParser.parsePrdWithGemini(prdFilePath);

  if (!generatedTasks || !Array.isArray(generatedTasks) || generatedTasks.length === 0) {
    console.error("Failed to generate tasks from PRD."); // Keep error log
    return { success: false, message: "Failed to generate tasks from PRD.", tasksAdded: 0 };
  }

  const tasksData = readTasks(workspaceRoot);
  let currentMaxId = tasksData.lastTaskId;
  let tasksAddedCount = 0;

  generatedTasks.forEach(genTask => {
    // Basic validation
    if (!genTask.title) {
        console.warn('Skipping task from Gemini response due to missing title:', genTask);
        return;
    }

    currentMaxId++;
    const newTask = {
        id: currentMaxId,
        title: genTask.title,
        description: genTask.description || '',
        status: 'todo', // Default status
        priority: genTask.priority || 'medium', // Default priority
        dependsOn: [], // We'll resolve dependencies later
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
        lastSubtaskIndex: 0,
        relatedFiles: [],
        activityLog: []
      };
      tasksData.tasks.push(newTask);
      tasksAddedCount++;
  });

  tasksData.lastTaskId = currentMaxId;
  writeTasks(workspaceRoot, tasksData);
  const successMsg = `Successfully added ${tasksAddedCount} tasks from PRD: ${prdFilePath}`;
  return { success: true, message: successMsg, tasksAdded: tasksAddedCount };
}

// Helper function to make Gemini API calls (replace with your actual implementation)
async function callGeminiApi(prompt, type = 'generation') {
    // console.log("DEBUG: Calling Gemini API with prompt:", prompt.substring(0, 100) + "..."); 
    console.error(`DEBUG: Calling Gemini API (type: ${type})`); // Log to stderr
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set.");
    }

    // Example using Google Generative AI SDK (ensure it's installed: npm install @google/generative-ai)
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"}); // Or your preferred model

    try {
        // Explicitly tell the model to return JSON format
        const enhancedPrompt = `${prompt.trim()}\n\nIMPORTANT: Return ONLY raw JSON without any markdown formatting, code blocks, or extra text.`;
        
        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;
        const text = response.text();
        console.error(`DEBUG: Received response from Gemini API.`); // Log to stderr
        return text;
    } catch (error) {
        console.error(`Error calling Gemini API: ${error}`); // Log error details to stderr
        throw new Error(`Gemini API call failed: ${error.message}`);
    }
}

// --- End Gemini Helper ---

// Function to expand a task into subtasks using Gemini API
async function expandTask(workspaceRoot, taskId) { 
  const tasksData = readTasks(workspaceRoot);
  const taskIndex = tasksData.tasks.findIndex(task => task.id === parseInt(taskId));

  if (taskIndex === -1) {
    // Throw an error instead of logging and exiting
    throw new Error(`Task with ID ${taskId} not found for expansion.`);
    // console.error(`Error: Task with ID ${taskId} not found.`);
    // process.exit(1);
  }

  const task = tasksData.tasks[taskIndex];
  const prompt = `Given the following main task, break it down into a list of actionable subtasks. Return ONLY a JSON array of strings, where each string is a subtask title. Do not include preamble or explanations.

Main Task Title: ${task.title}
Main Task Description: ${task.description || '(No description provided)'}
`;

  // console.log(`Sending task (ID: ${taskId}) to Gemini API for expansion...`); // Changed to console.error
  console.error(`DEBUG: Sending task (ID: ${taskId}) to Gemini API for expansion...`);

  try {
    const responseText = await callGeminiApi(prompt);
    // console.log("Successfully parsed subtasks from Gemini response."); // Changed to console.error
    console.error("DEBUG: Successfully received response from Gemini API for expansion.");

    let subtaskTitles = [];
    try {
        // First strip any markdown code blocks
        const cleanedResponse = responseText.replace(/```(?:json)?\n([\s\S]*?)\n```/g, '$1').trim();
        console.error(`DEBUG: Cleaned response for JSON parsing`);
        
        // Attempt to parse the response as JSON
        subtaskTitles = JSON.parse(cleanedResponse);
        if (!Array.isArray(subtaskTitles) || !subtaskTitles.every(t => typeof t === 'string')) {
            throw new Error("Parsed response is not an array of strings.");
        }
         console.error(`DEBUG: Parsed ${subtaskTitles.length} subtask titles from Gemini response.`); // Log count to stderr
    } catch (parseError) {
        // Fallback: Treat each line as a subtask if JSON parsing fails
        console.error(`WARN: Failed to parse Gemini response as JSON array: ${parseError.message}. Falling back to line splitting.`);
        subtaskTitles = responseText.split('\n').map(line => line.trim()).filter(Boolean);
        console.error(`DEBUG: Using fallback, extracted ${subtaskTitles.length} subtask titles.`); // Log count to stderr
    }
    
    // Clear existing subtasks and reset index
    task.subtasks = [];
    task.lastSubtaskIndex = 0; 
    
    // Add new subtasks
    let addedCount = 0;
    subtaskTitles.forEach(title => {
        if (title) { // Ensure title is not empty
            task.lastSubtaskIndex = (task.lastSubtaskIndex || 0) + 1;
            const nextSubtaskIndex = task.lastSubtaskIndex;
            const newSubtaskId = `${task.id}.${nextSubtaskIndex}`;
            
            const newSubtask = {
                id: newSubtaskId,
                title: title,
                status: 'todo',
                activityLog: []
            };
            addActivityLog(newSubtask, `Subtask created by Gemini expansion`);
            task.subtasks.push(newSubtask);
            addedCount++;
        }
    });

    addActivityLog(task, `Task expanded into ${addedCount} subtasks using Gemini API.`);
    task.updatedAt = new Date().toISOString();
    writeTasks(workspaceRoot, tasksData);
    
    // Return success status and message for MCP
    const message = `Successfully generated and added ${addedCount} subtask(s) for task ${taskId}.`;
    return { success: true, message: message, generatedCount: addedCount };
    // console.log(`Successfully generated and added ${subtaskTitles.length} subtask(s) for task ${taskId}.`); // Removed final log

  } catch (error) {
    // Throw error for MCP handler
     throw new Error(`Error expanding task ${taskId}: ${error.message}`);
    // console.error(`Error expanding task ${taskId}: ${error.message}`);
    // process.exit(1);
  }
}

// Function to revise future tasks based on a prompt using Gemini API
async function reviseTasks(workspaceRoot, options) { 
  const { fromTaskId, prompt } = options;
  const tasksData = readTasks(workspaceRoot);

  // **FIXED: Correctly find the index of the task to start revision from**
  const startIndex = tasksData.tasks.findIndex(task => String(task.id) === String(fromTaskId));

  if (startIndex === -1) {
    // Throw an error instead of logging and exiting
    throw new Error(`Invalid --from task ID provided for revision: ${fromTaskId}`);
    // console.error(`Error: Invalid --from task ID provided for revision.`);
    // process.exit(1);
  }

  const futureTasks = tasksData.tasks.slice(startIndex);

  // Prepare the data for the Gemini prompt
  const futureTasksJson = JSON.stringify(futureTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dependsOn: task.dependsOn,
    subtasks: task.subtasks.map(st => ({ id: st.id, title: st.title, status: st.status })) // Include subtasks
  })), null, 2);

  const apiPrompt = `Given the following list of future tasks (starting from ID ${fromTaskId}) in JSON format and a required change described in the prompt, please revise the tasks. Return ONLY the revised list of tasks in the exact same JSON format (an array of task objects). Ensure IDs are preserved where possible but adjust titles, descriptions, dependencies, status, priority, and subtasks as necessary based on the prompt. Add new tasks or remove tasks if logically required by the change. Do not include any preamble or explanations in your response.

Prompt describing the change: ${prompt}

Current Future Tasks JSON:
${futureTasksJson}
`;

  // console.log(`Sending future tasks to Gemini API for revision based on prompt: "${prompt}"`); // Changed to console.error
  console.error(`DEBUG: Sending future tasks (from ID ${fromTaskId}) to Gemini API for revision...`);

  try {
    const responseText = await callGeminiApi(apiPrompt, 'revision');
    // console.log("Successfully parsed revised tasks from Gemini response."); // Changed to console.error
    console.error("DEBUG: Successfully received response from Gemini API for revision.");

    let revisedTasks;
    try {
        // First strip any markdown code blocks
        const cleanedResponse = responseText.replace(/```(?:json)?\n([\s\S]*?)\n```/g, '$1').trim();
        console.error(`DEBUG: Cleaned response for JSON parsing`);
        
        // Attempt to parse the response as JSON
        revisedTasks = JSON.parse(cleanedResponse);
        if (!Array.isArray(revisedTasks)) { // Basic validation
            throw new Error("Parsed response is not an array.");
        }
        console.error(`DEBUG: Parsed ${revisedTasks.length} revised tasks from Gemini response.`); // Log count to stderr
    } catch (parseError) {
        // If parsing fails, throw an error as we need structured data here
        throw new Error(`Failed to parse revised tasks JSON from Gemini response: ${parseError.message}. Response Text: ${responseText.substring(0, 200)}...`);
    }
    
    // console.error(`DEBUG: Revised future tasks received from Gemini: ${JSON.stringify(revisedTasks)}`); // Log to stderr

    // Replace the original future tasks with the revised ones
    tasksData.tasks.splice(startIndex, tasksData.tasks.length - startIndex, ...revisedTasks);

    // Add a log entry to the *first affected* task (if it still exists)
    const firstRevisedTask = tasksData.tasks.find(task => String(task.id) === String(fromTaskId));
    if (firstRevisedTask) {
      addActivityLog(firstRevisedTask, `Tasks from this point revised via Gemini based on prompt: "${prompt}"`);
      firstRevisedTask.updatedAt = new Date().toISOString(); 
    } else {
        // Maybe add a project-level log if the starting task was removed?
        console.error(`WARN: Task ${fromTaskId} seems to have been removed during revision. Log not added to specific task.`);
    }

    writeTasks(workspaceRoot, tasksData);
    
    // Return success status and message for MCP
    const message = `Successfully revised tasks from ID ${fromTaskId} onwards based on the prompt.`;
    return { success: true, message: message, revisedCount: revisedTasks.length };
    // console.log(`Successfully revised tasks from ID ${fromTaskId} onwards based on the prompt.`); // Removed final log

  } catch (error) {
      // Throw error for MCP handler
      throw new Error(`Error revising tasks: ${error.message}`);
    // console.error(`Error revising tasks: ${error.message}`);
    // process.exit(1);
  }
}

// Function to retrieve detailed context for a task
function getContext(workspaceRoot, id) {
    const tasksData = readTasks(workspaceRoot);
    const idString = String(id);
    let item = null;

    if (idString.includes('.')) {
        const parts = idString.split('.');
        const parentId = parseInt(parts[0]);
        const parentTask = tasksData.tasks.find(task => task.id === parentId);
        if (parentTask) {
             if (!parentTask.subtasks) parentTask.subtasks = [];
            item = parentTask.subtasks.find(sub => sub.id === idString);
        }
    } else {
        const taskId = parseInt(idString);
        item = tasksData.tasks.find(task => task.id === taskId);
    }

    if (item) {
        let contextData;
        if (idString.includes('.')) {
            // Subtask context
            contextData = {
                id: item.id,
                title: item.title,
                status: item.status,
                activityLog: item.activityLog || []
            };
        } else {
            // Main task context
            contextData = {
                id: item.id,
                title: item.title,
                description: item.description,
                status: item.status,
                priority: item.priority,
                dependsOn: item.dependsOn,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                subtasks: item.subtasks || [],
                relatedFiles: item.relatedFiles || [],
                activityLog: item.activityLog || []
            };
            // Add file existence check
            contextData.filesStatus = contextData.relatedFiles.map(filePath => ({
                path: filePath,
                exists: fs.existsSync(path.resolve(workspaceRoot, filePath)) // Check existence relative to workspace
            }));
        }
        return contextData; // Return the context object directly
    } else {
        throw new Error(`Task or subtask with ID ${idString} not found.`);
    }
}

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
  parsePrd,
  expandTask,
  reviseTasks, // Export reviseTasks
  getContext // Export getContext
};
