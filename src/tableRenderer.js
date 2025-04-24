/**
 * tableRenderer.js - Generates a human-readable task table with checkboxes
 * 
 * This module creates a formatted display of tasks with status checkboxes
 * that automatically stays in sync with the tasks.json file.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const Table = require('cli-table3');
const chalk = require('chalk');

/**
 * Generate a formatted string with task checkboxes
 * @param {Object} tasksData - The task data object from tasks.json
 * @param {string} workspaceRoot - The workspace root path
 * @param {boolean} forceMarkdown - Force Markdown output even in TTY
 * @returns {string} Formatted task table with checkboxes
 */
function generateTaskTable(tasksData, workspaceRoot, forceMarkdown = false) {
  if (!tasksData || !tasksData.tasks || !Array.isArray(tasksData.tasks)) {
    return 'No valid task data found';
  }

  const { tasks } = tasksData;
  
  if (tasks.length === 0) {
    return 'No tasks found';
  }
  
  // Determine if we should output CLI or Markdown format
  const shouldUseCliFormat = process.stdout.isTTY && !forceMarkdown;
  
  return shouldUseCliFormat ? 
    generateCliOutput(tasksData, tasks) : 
    generateMarkdownOutput(tasksData, tasks);
}

/**
 * Generate CLI output with colored formatting
 * @param {Object} tasksData - The task data object
 * @param {Array} tasks - The tasks array
 * @returns {string} CLI formatted output
 */
function generateCliOutput(tasksData, tasks) {
  let output = '';
  
  // Create project header
  output += chalk.bold.blue(`# ${tasksData.projectName || 'Project'}\n`);
  
  if (tasksData.projectDescription) {
    output += `${tasksData.projectDescription}\n\n`;
  } else {
    output += '\n';
  }
  
  // Add summary section with counts
  const statusCounts = countTasksByStatus(tasks);
  
  output += chalk.bold("## Summary\n\n");
  
  // CLI status summary with colors
  output += `${chalk.green('✓')} ${chalk.bold('Done')}: ${statusCounts.done} | `;
  output += `${chalk.yellow('⟳')} ${chalk.bold('In Progress')}: ${statusCounts.inprogress} | `;
  output += `${chalk.gray('○')} ${chalk.bold('Todo')}: ${statusCounts.todo} | `;
  output += `${chalk.red('⨯')} ${chalk.bold('Blocked')}: ${statusCounts.blocked} | `;
  output += `${chalk.bgRed.white('!')} ${chalk.bold('Error')}: ${statusCounts.error}\n\n`;
  
  // Progress bar
  const totalTasks = tasks.length;
  const completedTasks = statusCounts.done;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  output += chalk.bold(`Progress: ${completionPercentage}%\n\n`);
  
  // Sort tasks by ID
  const sortedTasks = [...tasks].sort((a, b) => a.id - b.id);
  
  // Add main tasks section header
  output += chalk.bold.underline("\n## Tasks\n\n");
  
  // Create a table for the CLI output
  const tasksTable = new Table({
    head: [
      chalk.bold('ID'), 
      chalk.bold('Status'), 
      chalk.bold('Priority'), 
      chalk.bold('Title'), 
      chalk.bold('Description')
    ],
    wordWrap: true,
    colWidths: [6, 15, 10, 25, 35],
    chars: {
      'top': '-', 'top-mid': '+', 'top-left': '+', 'top-right': '+',
      'bottom': '-', 'bottom-mid': '+', 'bottom-left': '+', 'bottom-right': '+',
      'left': '|', 'left-mid': '+', 'mid': '-', 'mid-mid': '+',
      'right': '|', 'right-mid': '+', 'middle': '|'
    }
  });
  
  // Add tasks to the CLI table with color formatting
  sortedTasks.forEach(task => {
    tasksTable.push([
      chalk.cyan(`#${task.id}`),
      getColoredStatus(task.status),
      getColoredPriority(task.priority),
      chalk.white(task.title),
      task.description ? chalk.gray(truncateText(task.description, 32)) : ''
    ]);
  });
  
  output += tasksTable.toString() + '\n\n';
  
  // Add subtasks sections
  sortedTasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      // CLI output for subtasks with colors
      output += chalk.bold.cyan(`Task #${task.id}: ${task.title} - Subtasks:\n`);
      
      // Create a color-formatted list for CLI
      task.subtasks.forEach(subtask => {
        output += `  ${getColoredStatusSymbol(subtask.status)} ${chalk.cyan(`#${subtask.id}`)}: ${chalk.white(subtask.title)}\n`;
      });
      
      output += '\n';
    }
  });
  
  return output;
}

/**
 * Generate Markdown output
 * @param {Object} tasksData - The task data object
 * @param {Array} tasks - The tasks array
 * @returns {string} Markdown formatted output
 */
function generateMarkdownOutput(tasksData, tasks) {
  let output = '';
  
  // Create project header
  output += `# ${tasksData.projectName || 'Project'}\n`;
  
  if (tasksData.projectDescription) {
    output += `${tasksData.projectDescription}\n\n`;
  } else {
    output += '\n';
  }
  
  // Add summary section with counts
  const statusCounts = countTasksByStatus(tasks);
  
  output += "## Summary\n\n";
  
  // Markdown status summary with emoji
  output += `**✅ Done**: ${statusCounts.done} | `;
  output += `**🔄 In Progress**: ${statusCounts.inprogress} | `;
  output += `**⬜ Todo**: ${statusCounts.todo} | `;
  output += `**❌ Blocked**: ${statusCounts.blocked} | `;
  output += `**⚠️ Error**: ${statusCounts.error}\n\n`;
  
  // Progress bar
  const totalTasks = tasks.length;
  const completedTasks = statusCounts.done;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  output += `**Progress**: ${completionPercentage}%\n`;
  
  // Create a visual progress bar for Markdown
  const progressBarWidth = 20;
  const filledBars = Math.round((completionPercentage / 100) * progressBarWidth);
  const emptyBars = progressBarWidth - filledBars;
  
  const progressBar = `[${'█'.repeat(filledBars)}${' '.repeat(emptyBars)}] ${completionPercentage}%`;
  output += `\n${progressBar}\n\n`;
  
  // Sort tasks by ID
  const sortedTasks = [...tasks].sort((a, b) => a.id - b.id);
  
  // Add main tasks section header
  output += "## Tasks\n\n";
  
  // Create a properly formatted Markdown table header
  output += "| ID | Status | Priority | Title | Description |\n";
  output += "|:--:|:------:|:--------:|:------|:------------|\n";
  
  // Add tasks to Markdown table with enhanced formatting
  sortedTasks.forEach(task => {
    output += `| #${task.id} | ${getStatusWithEmoji(task.status)} | ${getPriorityBadge(task.priority)} | **${task.title}** | ${task.description ? truncateText(task.description, 32) : ''} |\n`;
  });
  
  output += '\n\n';
  
  // Add subtasks sections
  sortedTasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Markdown output for subtasks with better formatting
      output += `### Task #${task.id}: ${task.title} - Subtasks\n\n`;
      
      // For Markdown, create a proper subtask list
      output += "| ID | Status | Title |\n";
      output += "|:--:|:------:|:------|\n";
      
      task.subtasks.forEach(subtask => {
        // Add to Markdown table with enhanced formatting
        output += `| #${subtask.id} | ${getStatusWithEmoji(subtask.status)} | ${subtask.title} |\n`;
      });
      
      output += '\n';
    }
  });
  
  return output;
}

/**
 * Count tasks by status
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Counts of tasks by status
 */
function countTasksByStatus(tasks) {
  const counts = {
    todo: 0,
    inprogress: 0,
    done: 0,
    blocked: 0,
    error: 0
  };

  // Count main tasks
  tasks.forEach(task => {
    const status = task.status.toLowerCase();
    if (counts.hasOwnProperty(status)) {
      counts[status]++;
    }
    
    // Count subtasks too
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        const subtaskStatus = subtask.status.toLowerCase();
        if (counts.hasOwnProperty(subtaskStatus)) {
          counts[subtaskStatus]++;
        }
      });
    }
  });
  
  return counts;
}

/**
 * Create a combined status symbol and text
 * @param {string} status - The task status
 * @returns {string} Status with symbol
 */
function getStatusWithSymbol(status) {
  const symbol = getStatusSymbol(status);
  return `${symbol} ${status}`;
}

/**
 * Get status with emoji for Markdown
 * @param {string} status - The task status
 * @returns {string} Status with emoji
 */
function getStatusWithEmoji(status) {
  switch(status.toLowerCase()) {
    case 'done':
      return `✅ ${status}`;
    case 'inprogress':
      return `🔄 ${status}`;
    case 'blocked':
      return `❌ ${status}`;
    case 'error':
      return `⚠️ ${status}`;
    case 'todo':
    default:
      return `⬜ ${status}`;
  }
}

/**
 * Get a colorized status with symbol
 * @param {string} status - The task status
 * @returns {string} Colorized status
 */
function getColoredStatus(status) {
  const symbol = getStatusSymbol(status);
  switch(status.toLowerCase()) {
    case 'done':
      return chalk.green(`${symbol} ${status}`);
    case 'inprogress':
      return chalk.yellow(`${symbol} ${status}`);
    case 'blocked':
      return chalk.red(`${symbol} ${status}`);
    case 'error':
      return chalk.bgRed.white(`${symbol} ${status}`);
    case 'todo':
    default:
      return chalk.gray(`${symbol} ${status}`);
  }
}

/**
 * Get a colorized status symbol
 * @param {string} status - The task status
 * @returns {string} Colorized symbol
 */
function getColoredStatusSymbol(status) {
  const symbol = getStatusSymbol(status);
  switch(status.toLowerCase()) {
    case 'done':
      return chalk.green(symbol);
    case 'inprogress':
      return chalk.yellow(symbol);
    case 'blocked':
      return chalk.red(symbol);
    case 'error':
      return chalk.bgRed.white(symbol);
    case 'todo':
    default:
      return chalk.gray(symbol);
  }
}

/**
 * Get a status symbol (checkbox) based on status
 * @param {string} status - The task status
 * @returns {string} A checkbox symbol
 */
function getStatusSymbol(status) {
  // Use simple ASCII characters instead of Unicode for better compatibility
  switch(status.toLowerCase()) {
    case 'done':
      return '[x]'; // Checked checkbox
    case 'inprogress':
      return '[/]'; // In-progress indicator
    case 'blocked':
      return '[!]'; // Blocked indicator
    case 'error':
      return '[E]'; // Error indicator
    case 'todo':
    default:
      return '[ ]'; // Empty checkbox
  }
}

/**
 * Get a colorized priority badge
 * @param {string} priority - The task priority
 * @returns {string} Colorized priority
 */
function getColoredPriority(priority) {
  switch(priority.toLowerCase()) {
    case 'high':
      return chalk.bgRed.white(' HIGH ');
    case 'medium':
      return chalk.bgYellow.black(' MEDIUM ');
    case 'low':
    default:
      return chalk.bgGreen.black(' LOW ');
  }
}

/**
 * Get a badge for priority
 * @param {string} priority - The task priority
 * @returns {string} A priority badge
 */
function getPriorityBadge(priority) {
  // Use Markdown-friendly badges for priority indicators
  switch(priority.toLowerCase()) {
    case 'high':
      return '🔴 **HIGH**';
    case 'medium':
      return '🟡 **MEDIUM**';
    case 'low':
    default:
      return '🟢 **LOW**';
  }
}

/**
 * Truncate text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get the path to the tasks file and task table file
 * @param {string} workspaceRoot - Workspace root directory
 * @returns {Object} Object with paths
 */
function getTaskPaths(workspaceRoot) {
  // Make sure workspaceRoot is valid
  if (!workspaceRoot) {
    workspaceRoot = process.cwd();
    logger.warn(`No workspace root provided, using current directory: ${workspaceRoot}`);
  }
  
  return {
    // Use the same path structure as in core.js
    tasksFilePath: path.resolve(workspaceRoot, 'tasks.json'),
    taskTablePath: path.resolve(workspaceRoot, 'tasks-table.md')
  };
}

/**
 * Writes the task table to a markdown file
 * @param {Object} tasksData - The task data object
 * @param {string} workspaceRoot - The workspace root path
 * @returns {boolean} Success status
 */
function writeTaskTable(tasksData, workspaceRoot) {
  try {
    // Always use Markdown format when writing to a file
    const taskTableContent = generateTaskTable(tasksData, workspaceRoot, true);
    
    const { taskTablePath } = getTaskPaths(workspaceRoot);
    
    // Write the task table
    fs.writeFileSync(taskTablePath, taskTableContent);
    logger.debug(`Task table written to ${taskTablePath}`);
    
    return true;
  } catch (error) {
    logger.error(`Error writing task table: ${error.message}`);
    return false;
  }
}

/**
 * Updates the task table whenever the tasks.json file changes
 * @param {string} workspaceRoot - The workspace root path
 */
function syncTaskTable(workspaceRoot) {
  const { tasksFilePath, taskTablePath } = getTaskPaths(workspaceRoot);
  
  try {
    if (fs.existsSync(tasksFilePath)) {
      const tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
      writeTaskTable(tasksData, workspaceRoot);
      logger.debug(`Task table synced with tasks.json`);
    }
  } catch (error) {
    logger.error(`Error syncing task table: ${error.message}`);
  }
}

module.exports = {
  generateTaskTable,
  writeTaskTable,
  syncTaskTable
}; 