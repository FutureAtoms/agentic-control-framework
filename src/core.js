const fs = require('fs');
const path = require('path');
const prdParser = require('./prd_parser'); // Import the PRD parser
const Table = require('cli-table3'); // Import cli-table3
const chalk = require('chalk'); // Import chalk (v4)

const TASKS_FILE = 'tasks.json';
const CURSOR_RULES_DIR = path.join('.cursor', 'rules');
const CURSOR_RULES_FILE = path.join(CURSOR_RULES_DIR, 'task_manager_workflow.mdc');

// Function to ensure a directory exists
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Function to initialize the project
function initProject() {
  // Create tasks.json if it doesn't exist
  if (!fs.existsSync(TASKS_FILE)) {
    const initialData = {
      lastTaskId: 0, // To track the next available ID
      tasks: []
      // Structure for a task:
      // {
      //   id: 1,
      //   title: "Example Task",
      //   description: "Details about the task",
      //   status: "todo", // e.g., todo, inprogress, done, blocked
      //   priority: "medium", // e.g., low, medium, high
      //   dependsOn: [], // Array of task IDs it depends on
      //   createdAt: "ISO_TIMESTAMP",
      //   updatedAt: "ISO_TIMESTAMP",
      //   subtasks: [
      //     {
      //       id: "1.1", // Subtask ID convention (e.g., parentId.subIndex)
      //       title: "Subtask 1",
      //       status: "todo"
      //     }
      //   ]
      // }
    };
    fs.writeFileSync(TASKS_FILE, JSON.stringify(initialData, null, 2));
    console.log(`Created initial tasks file: ${TASKS_FILE}`);
  } else {
    console.log(`Tasks file already exists: ${TASKS_FILE}`);
  }

  // Create .cursor/rules directory and placeholder file if they don't exist
  ensureDirExists(CURSOR_RULES_DIR);
  if (!fs.existsSync(CURSOR_RULES_FILE)) {
    const placeholderContent = `# Cursor AI Workflow Rules for Gemini Task Manager\n\n# (Define rules here to tell Cursor how to use task-manager commands)\n\n# Example:\n# To list tasks, use the command: task-manager list\n# To get the next task: task-manager next\n`;
    fs.writeFileSync(CURSOR_RULES_FILE, placeholderContent);
    console.log(`Created placeholder Cursor rules file: ${CURSOR_RULES_FILE}`);
  } else {
    console.log(`Cursor rules file already exists: ${CURSOR_RULES_FILE}`);
  }
}

// Function to read tasks from the file
function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    console.error(`Error: Tasks file not found: ${TASKS_FILE}`);
    console.error('Please run "task-manager init" first.');
    process.exit(1); // Exit if the file doesn't exist
  }
  try {
    const rawData = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing tasks file: ${TASKS_FILE}`, error);
    process.exit(1);
  }
}

// Function to write tasks to the file
function writeTasks(data) {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing tasks file: ${TASKS_FILE}`, error);
    process.exit(1);
  }
}

// Function to add a new task
function addTask(options) {
  const tasksData = readTasks();
  const newTaskId = tasksData.lastTaskId + 1;

  const newTask = {
    id: newTaskId,
    title: options.title,
    description: options.description || '',
    status: 'todo',
    priority: options.priority || 'medium',
    dependsOn: options.dependsOn ? options.dependsOn.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: []
  };

  tasksData.tasks.push(newTask);
  tasksData.lastTaskId = newTaskId;

  writeTasks(tasksData);
  console.log(`Added new task (ID: ${newTaskId}): "${newTask.title}"`);
}

// Function to list tasks
function listTasks(options) {
  const tasksData = readTasks();
  const { status } = options;

  let tasksToDisplay = tasksData.tasks;

  if (status) {
    tasksToDisplay = tasksData.tasks.filter(task => task.status === status);
  }

  if (tasksToDisplay.length === 0) {
    console.log(status ? `No tasks found with status: ${status}` : 'No tasks found.');
    return;
  }

  const table = new Table({
    head: ['ID', 'Title', 'Status', 'Priority', 'Depends', 'Subtasks'],
    colWidths: [8, 45, 15, 10, 10, 10] // Adjusted widths slightly
  });

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return chalk.green;
      case 'inprogress': return chalk.yellow;
      case 'blocked': return chalk.red;
      case 'todo':
      default: return chalk.white; // Or chalk.gray, etc.
    }
  };

  tasksToDisplay.forEach(task => {
    if (!task) {
        console.error("DEBUG: Skipping undefined task object in listTasks");
        return;
    }
    
    const colorFunc = getStatusColor(task.status);
    
    table.push([
      colorFunc(task.id),
      colorFunc(task.title),
      colorFunc(task.status),
      colorFunc(task.priority),
      colorFunc(task.dependsOn.join(', ') || '-'),
      colorFunc(task.subtasks.length)
    ]);

    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(sub => {
            const subColorFunc = getStatusColor(sub.status);
            table.push([
                subColorFunc(`  ${sub.id}`),
                subColorFunc(`  ${sub.title}`),
                subColorFunc(sub.status),
                '', 
                '', 
                ''  
            ]);
        });
    }
  });

  console.log(table.toString());
}

// Function to add a subtask to a parent task
function addSubtask(parentId, options) {
  const tasksData = readTasks();
  const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parseInt(parentId));

  if (parentTaskIndex === -1) {
    console.error(`Error: Parent task with ID ${parentId} not found.`);
    return; // Don't exit, just report error
  }

  const parentTask = tasksData.tasks[parentTaskIndex];

  // Determine the next subtask index
  const nextSubtaskIndex = parentTask.subtasks.length + 1;
  const newSubtaskId = `${parentTask.id}.${nextSubtaskIndex}`;

  const newSubtask = {
    id: newSubtaskId,
    title: options.title,
    status: 'todo' // Default status for new subtasks
    // Could add createdAt/updatedAt for subtasks too if needed
  };

  parentTask.subtasks.push(newSubtask);
  parentTask.updatedAt = new Date().toISOString(); // Update parent task timestamp

  writeTasks(tasksData);
  console.log(`Added subtask "${newSubtask.title}" (ID: ${newSubtaskId}) to task ${parentId}.`);
}

// Function to update the status of a task or subtask
function updateStatus(id, newStatus) {
  const tasksData = readTasks();
  let taskUpdated = false;
  let itemTitle = '';
  const idString = String(id); // Ensure ID is treated as a string for checks

  // Check if it's a subtask ID (contains '.')
  if (idString.includes('.')) {
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parentId);

    if (parentTaskIndex !== -1) {
      const subtaskIndex = tasksData.tasks[parentTaskIndex].subtasks.findIndex(sub => sub.id === idString);
      if (subtaskIndex !== -1) {
        tasksData.tasks[parentTaskIndex].subtasks[subtaskIndex].status = newStatus;
        tasksData.tasks[parentTaskIndex].updatedAt = new Date().toISOString(); // Update parent task timestamp
        itemTitle = tasksData.tasks[parentTaskIndex].subtasks[subtaskIndex].title;
        taskUpdated = true;
      }
    }
  } else {
    // Assume it's a main task ID
    const taskId = parseInt(idString);
    const taskIndex = tasksData.tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
      tasksData.tasks[taskIndex].status = newStatus;
      tasksData.tasks[taskIndex].updatedAt = new Date().toISOString();
      itemTitle = tasksData.tasks[taskIndex].title;
      taskUpdated = true;
    }
  }

  if (taskUpdated) {
    writeTasks(tasksData);
    console.log(`Updated status of "${itemTitle}" (ID: ${idString}) to "${newStatus}".`);
  } else {
    console.error(`Error: Task or subtask with ID ${idString} not found.`);
  }
}

// Function to determine the next task to work on
function getNextTask() {
  const tasksData = readTasks();
  const tasks = tasksData.tasks;

  // Create a map of task statuses for quick lookup
  const taskStatusMap = tasks.reduce((acc, task) => {
    acc[task.id] = task.status;
    return acc;
  }, {});

  // Filter for actionable tasks (not done or blocked)
  const actionableTasks = tasks.filter(task => task.status !== 'done' && task.status !== 'blocked');

  if (actionableTasks.length === 0) {
    console.log('No actionable tasks remaining.');
    return;
  }

  // Filter tasks whose dependencies are met
  const readyTasks = actionableTasks.filter(task => {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return true; // No dependencies
    }
    // Check if all dependencies are 'done'
    return task.dependsOn.every(depId => taskStatusMap[depId] === 'done');
  });

  if (readyTasks.length === 0) {
    console.log('No tasks are ready (dependencies not met).');
    // Optionally, list which dependencies are blocking
    return;
  }

  // Sort ready tasks: Priority (high > medium > low), then ID (lowest first)
  const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  readyTasks.sort((a, b) => {
    const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.id - b.id; // Sort by ID ascending if priorities are equal
  });

  const nextTask = readyTasks[0];

  console.log('\n---------- Next Task ----------');
  console.log(` ID          : ${nextTask.id}`);
  console.log(` Title       : ${nextTask.title}`);
  console.log(` Status      : ${nextTask.status}`);
  console.log(` Priority    : ${nextTask.priority}`);
  if (nextTask.description) {
    console.log(` Description : ${nextTask.description}`);
  }
  if (nextTask.dependsOn.length > 0) {
    console.log(` Depends On  : ${nextTask.dependsOn.join(', ')}`);
  }
  if (nextTask.subtasks.length > 0) {
      console.log(` Subtasks (${nextTask.subtasks.length}) :`);
      nextTask.subtasks.forEach(sub => {
        console.log(`   - [${sub.id}] ${sub.title} [${sub.status}]`);
      });
  }
  console.log('-----------------------------');
}

// Function to update fields of a task or subtask
function updateTask(id, options) {
  const tasksData = readTasks();
  let itemUpdated = false;
  let itemTitle = '';
  const idString = String(id);

  // Fields that can be updated
  const { title, description, priority } = options;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;

  if (Object.keys(updates).length === 0) {
      console.log("No update options provided (use --title, --description, --priority).");
      return;
  }

  const applyUpdates = (item) => {
    Object.assign(item, updates);
    item.updatedAt = new Date().toISOString(); // Update timestamp
    itemTitle = item.title; // Get title after potential update
    itemUpdated = true;
  };

  if (idString.includes('.')) {
    // Update Subtask
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parentId);

    if (parentTaskIndex !== -1) {
      const subtaskIndex = tasksData.tasks[parentTaskIndex].subtasks.findIndex(sub => sub.id === idString);
      if (subtaskIndex !== -1) {
        // Apply updates to the subtask
        applyUpdates(tasksData.tasks[parentTaskIndex].subtasks[subtaskIndex]);
        // Also update parent task timestamp
        tasksData.tasks[parentTaskIndex].updatedAt = new Date().toISOString();
      }
    }
  } else {
    // Update Main Task
    const taskId = parseInt(idString);
    const taskIndex = tasksData.tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
        // Apply updates to the task
        applyUpdates(tasksData.tasks[taskIndex]);
    }
  }

  if (itemUpdated) {
    writeTasks(tasksData);
    console.log(`Updated task/subtask "${itemTitle}" (ID: ${idString}).`);
    // Optionally log the specific fields updated
    // console.log('Updated fields:', Object.keys(updates).join(', '));
  } else {
    console.error(`Error: Task or subtask with ID ${idString} not found.`);
  }
}

// Function to remove a task or subtask
function removeTask(id) {
  const tasksData = readTasks();
  let itemRemoved = false;
  let itemTitle = '';
  const idString = String(id);

  if (idString.includes('.')) {
    // Remove Subtask
    const parts = idString.split('.');
    const parentId = parseInt(parts[0]);
    const parentTaskIndex = tasksData.tasks.findIndex(task => task.id === parentId);

    if (parentTaskIndex !== -1) {
      const subtaskIndex = tasksData.tasks[parentTaskIndex].subtasks.findIndex(sub => sub.id === idString);
      if (subtaskIndex !== -1) {
        itemTitle = tasksData.tasks[parentTaskIndex].subtasks[subtaskIndex].title;
        tasksData.tasks[parentTaskIndex].subtasks.splice(subtaskIndex, 1); // Remove the subtask
        tasksData.tasks[parentTaskIndex].updatedAt = new Date().toISOString();
        itemRemoved = true;
      }
    }
  } else {
    // Remove Main Task
    const taskId = parseInt(idString);
    const taskIndex = tasksData.tasks.findIndex(task => task.id === taskId);

    if (taskIndex !== -1) {
      itemTitle = tasksData.tasks[taskIndex].title;
      tasksData.tasks.splice(taskIndex, 1); // Remove the task
      itemRemoved = true;
      // Optional: Could add a check here to update dependencies of other tasks
      // that might have depended on the removed task, but keeping it simple for now.
    }
  }

  if (itemRemoved) {
    writeTasks(tasksData);
    console.log(`Removed task/subtask "${itemTitle}" (ID: ${idString}).`);
  } else {
    console.error(`Error: Task or subtask with ID ${idString} not found.`);
  }
}

const TASK_FILES_DIR = 'tasks';

// Function to generate individual task files
function generateTaskFiles() {
  const tasksData = readTasks();
  ensureDirExists(TASK_FILES_DIR); // Ensure the output directory exists

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
    if (task.subtasks && task.subtasks.length > 0) {
      fileContent += `\n**Subtasks:**\n`;
      task.subtasks.forEach(sub => {
        fileContent += `*   [${sub.id}] ${sub.title} [${sub.status}]\n`;
      });
    }
    fileContent += `\n*Created:* ${task.createdAt}\n`;
    fileContent += `*Updated:* ${task.updatedAt}\n`;

    // Format filename (e.g., task_001.md)
    const filename = `task_${String(task.id).padStart(3, '0')}.md`;
    const filePath = path.join(TASK_FILES_DIR, filename);

    try {
      fs.writeFileSync(filePath, fileContent);
      filesGenerated++;
    } catch (error) {
      console.error(`Error writing task file: ${filePath}`, error);
    }
  });

  console.log(`Generated ${filesGenerated} task files in the '${TASK_FILES_DIR}' directory.`);

}

// Function to parse PRD and add tasks
async function parsePrd(prdFilePath) {
  console.log(`Attempting to parse PRD: ${prdFilePath}`);
  const generatedTasks = await prdParser.parsePrdWithGemini(prdFilePath);

  if (!generatedTasks || !Array.isArray(generatedTasks) || generatedTasks.length === 0) {
    console.error("Failed to generate tasks from PRD.");
    return;
  }

  const tasksData = readTasks();
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
        subtasks: []
        // Note: Ignoring dependsOn from Gemini for now, needs careful mapping
        // dependsOn: genTask.dependsOn ? genTask.dependsOn.map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
      };
      tasksData.tasks.push(newTask);
      tasksAddedCount++;
  });

  tasksData.lastTaskId = currentMaxId;
  writeTasks(tasksData);

  console.log(`Successfully added ${tasksAddedCount} tasks from PRD: ${prdFilePath}`);
  // Optional: Implement dependency mapping based on titles or sequence if needed

}

// Function to expand a task using Gemini
async function expandTask(taskId) {
  const tasksData = readTasks();
  const taskIdNum = parseInt(taskId);
  const taskIndex = tasksData.tasks.findIndex(task => task.id === taskIdNum);

  if (taskIndex === -1) {
    console.error(`Error: Task with ID ${taskIdNum} not found.`);
    return;
  }

  const parentTask = tasksData.tasks[taskIndex];

  // Clear existing subtasks before generating new ones
  if (parentTask.subtasks && parentTask.subtasks.length > 0) {
      console.log(`Clearing ${parentTask.subtasks.length} existing subtask(s) for task ${taskIdNum}...`);
      parentTask.subtasks = [];
  }

  const generatedSubtaskTitles = await prdParser.expandTaskWithGemini(parentTask);

  if (!generatedSubtaskTitles || generatedSubtaskTitles.length === 0) {
    console.error(`Failed to generate subtasks for task ${taskIdNum}.`);
    // Write tasksData even if expansion fails, to save the cleared subtasks
    writeTasks(tasksData);
    return;
  }

  let subtasksAddedCount = 0;
  generatedSubtaskTitles.forEach((title, index) => {
    const nextSubtaskIndex = index + 1; // Reset index for new subtasks
    const newSubtaskId = `${parentTask.id}.${nextSubtaskIndex}`;
    const newSubtask = {
      id: newSubtaskId,
      title: title,
      status: 'todo'
    };
    parentTask.subtasks.push(newSubtask);
    subtasksAddedCount++;
  });

  parentTask.updatedAt = new Date().toISOString();
  writeTasks(tasksData);

  console.log(`Successfully generated and added ${subtasksAddedCount} subtask(s) for task ${taskIdNum}.`);
}

// Function to revise future tasks using Gemini
async function reviseTasks(options) {
  const { from, prompt } = options;
  const fromTaskId = parseInt(from);

  if (isNaN(fromTaskId)) {
    console.error("Error: Invalid --from task ID provided.");
    return;
  }
  if (!prompt) {
    console.error("Error: --prompt is required for revision.");
    return;
  }

  const tasksData = readTasks();

  // Separate past/current tasks from future tasks
  const pastOrCurrentTasks = [];
  const futureTasks = [];
  let fromTaskFound = false;

  tasksData.tasks.forEach(task => {
      if (task.id < fromTaskId) {
          pastOrCurrentTasks.push(task);
      } else {
          if(task.id === fromTaskId) fromTaskFound = true;
          // Include the 'from' task and all subsequent tasks as future tasks
          futureTasks.push(task);
      }
  });

  if (!fromTaskFound) {
      console.warn(`Warning: Task ID ${fromTaskId} specified in --from not found. Revising all tasks.`);
      // If from task not found, treat all tasks as future tasks for revision
      futureTasks.push(...pastOrCurrentTasks);
      pastOrCurrentTasks.length = 0; // Clear past tasks
  }
  
  if (futureTasks.length === 0) {
      console.log("No future tasks found to revise.");
      return;
  }

  const revisedFutureTasks = await prdParser.reviseTasksWithGemini(prompt, pastOrCurrentTasks, futureTasks);

  if (!revisedFutureTasks) {
    console.error("Failed to get revised tasks from Gemini. No changes made.");
    return;
  }

  // DEBUG: Log the structure received from Gemini
  console.error('DEBUG: Revised future tasks received from Gemini:', JSON.stringify(revisedFutureTasks, null, 2));

  // Replace the original future tasks with the revised ones
  const updatedTasks = [...pastOrCurrentTasks, ...revisedFutureTasks];

  // Update lastTaskId if new tasks were potentially added
  let maxId = 0;
  updatedTasks.forEach(task => {
      if (task.id > maxId) maxId = task.id;
      // Ensure core fields exist, even if Gemini didn't return them
      task.subtasks = task.subtasks || []; 
      task.status = task.status || 'todo'; // Default to todo if missing
      task.priority = task.priority || 'medium'; // Default priority if missing
      task.dependsOn = task.dependsOn || []; // Default dependencies if missing
      task.description = task.description || ''; // Default description if missing
      
      task.updatedAt = new Date().toISOString(); // Mark as updated
  });
  
  tasksData.tasks = updatedTasks;
  tasksData.lastTaskId = maxId > tasksData.lastTaskId ? maxId : tasksData.lastTaskId;

  writeTasks(tasksData);

  console.log(`Successfully revised tasks from ID ${fromTaskId} onwards based on the prompt.`);
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
  reviseTasks // Export reviseTasks
};
