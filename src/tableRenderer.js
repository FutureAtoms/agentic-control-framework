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
  output += `${chalk.blue('🔬')} ${chalk.bold('Testing')}: ${statusCounts.testing} | `;
  output += `${chalk.gray('○')} ${chalk.bold('Todo')}: ${statusCounts.todo} | `;
  output += `${chalk.red('⨯')} ${chalk.bold('Blocked')}: ${statusCounts.blocked} | `;
  output += `${chalk.bgRed.white('!')} ${chalk.bold('Error')}: ${statusCounts.error}\n\n`;
  
  // Progress bar
  const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const completedTasks = statusCounts.done;
  const completionPercentage = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  output += chalk.bold(`Progress: ${completionPercentage}%\n\n`);

  // Add priority distribution
  const priorityDistribution = getPriorityDistribution(tasks);
  output += chalk.bold("Priority Distribution:\n");
  output += `${chalk.magenta('🚨 Critical (900+)')}: ${priorityDistribution.critical} | `;
  output += `${chalk.red('🔴 High (700-899)')}: ${priorityDistribution.high} | `;
  output += `${chalk.yellow('🟡 Medium (500-699)')}: ${priorityDistribution.medium} | `;
  output += `${chalk.green('🟢 Low (<500)')}: ${priorityDistribution.low}\n\n`;
  
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
      chalk.white(task.priority), // Show simple numeric priority
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
  
  // Create compact summary with priority distribution in one quote box
  const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const completedTasks = statusCounts.done;
  const completionPercentage = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  // Create a visual progress bar
  const progressBarWidth = 20;
  const filledBars = Math.round((completionPercentage / 100) * progressBarWidth);
  const progressBar = '█'.repeat(Math.max(0, filledBars)) + '░'.repeat(Math.max(0, progressBarWidth - filledBars));

  // Get priority distribution
  const priorityDistribution = getPriorityDistribution(tasks);

  output += "> ## 📈 Project Summary\n";
  output += "> \n";
  output += `> **✅ Done**: ${statusCounts.done} | `;
  output += `**🔄 In Progress**: ${statusCounts.inprogress} | `;
  output += `**⬜ Todo**: ${statusCounts.todo} | `;
  output += `**❌ Blocked**: ${statusCounts.blocked}\n`;
  output += "> \n";
  output += `> **Progress**: ${completionPercentage}% \`${progressBar}\` ${completedTasks}/${totalTasks} tasks\n`;
  output += "> \n";
  output += `> **Priorities**: 🚨 **Critical**: ${priorityDistribution.critical} | `;
  output += `🔴 **High**: ${priorityDistribution.high} | `;
  output += `🟡 **Medium**: ${priorityDistribution.medium} | `;
  output += `🟢 **Low**: ${priorityDistribution.low}\n\n`;
  
  // Sort tasks by ID
  const sortedTasks = [...tasks].sort((a, b) => a.id - b.id);
  
  // Add main tasks section header
  output += "## Tasks\n\n";
  
  // Create a properly formatted Markdown table header
  output += "| ID | Status | Priority | Title | Description |\n";
  output += "|:--:|:------:|:--------:|:------|:------------|\n";
  
  // Add tasks to Markdown table with simple numeric priorities
  sortedTasks.forEach(task => {
    output += `| #${task.id} | ${getStatusWithEmoji(task.status)} | ${task.priority} | **${task.title}** | ${task.description ? truncateText(task.description, 32) : ''} |\n`;
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
    testing: 0,
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
    case 'testing':
      return `🔬 ${status}`;
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
    case 'testing':
      return chalk.blue(`${symbol} ${status}`);
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
    case 'testing':
      return chalk.blue(symbol);
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
    case 'testing':
      return '[T]'; // Testing indicator
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
 * Get a colorized priority badge with enhanced visual indicators
 * @param {string|number} priority - The task priority
 * @returns {string} Colorized priority with gradient and indicators
 */
function getColoredPriority(priority) {
  const numericPriority = typeof priority === 'number' ? priority : getPriorityNumericValue(priority);

  // Create visual priority bar
  const priorityBar = getPriorityBar(numericPriority);
  const priorityLabel = getPriorityLabel(numericPriority);
  const priorityColor = getPriorityColor(numericPriority);

  return `${priorityBar} ${priorityColor(priorityLabel)}`;
}

/**
 * Get numeric value for priority
 * @param {string|number} priority - The task priority
 * @returns {number} Numeric priority value
 */
function getPriorityNumericValue(priority) {
  if (typeof priority === 'number') return priority;

  const priorityStr = String(priority).toLowerCase();
  switch(priorityStr) {
    case 'critical': return 900;
    case 'high': return 700;
    case 'medium': return 500;
    case 'low': return 300;
    default:
      // Try to parse as number
      const parsed = parseInt(priority, 10);
      return isNaN(parsed) ? 500 : parsed;
  }
}

/**
 * Get priority bar visualization
 * @param {number} priority - Numeric priority (1-1000)
 * @returns {string} Visual priority bar
 */
function getPriorityBar(priority) {
  const normalizedPriority = Math.max(1, Math.min(1000, priority));
  const barLength = 8;
  const filledLength = Math.round((normalizedPriority / 1000) * barLength);

  // Create gradient bar with different characters
  let bar = '';
  for (let i = 0; i < barLength; i++) {
    if (i < filledLength) {
      if (normalizedPriority >= 900) bar += '█'; // Critical - solid
      else if (normalizedPriority >= 700) bar += '▉'; // High - almost solid
      else if (normalizedPriority >= 500) bar += '▊'; // Medium - half
      else bar += '▌'; // Low - quarter
    } else {
      bar += '░'; // Empty
    }
  }

  // Color the bar based on priority level
  if (normalizedPriority >= 900) return chalk.magenta(bar);
  if (normalizedPriority >= 700) return chalk.red(bar);
  if (normalizedPriority >= 500) return chalk.yellow(bar);
  return chalk.green(bar);
}

/**
 * Get priority label with numeric value
 * @param {number} priority - Numeric priority
 * @returns {string} Priority label
 */
function getPriorityLabel(priority) {
  const category = getPriorityCategory(priority);
  return `${category} (${priority})`;
}

/**
 * Get priority category
 * @param {number} priority - Numeric priority
 * @returns {string} Priority category
 */
function getPriorityCategory(priority) {
  if (priority >= 900) return 'CRITICAL';
  if (priority >= 700) return 'HIGH';
  if (priority >= 500) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get priority color function
 * @param {number} priority - Numeric priority
 * @returns {Function} Chalk color function
 */
function getPriorityColor(priority) {
  if (priority >= 900) return chalk.bgMagenta.white.bold;
  if (priority >= 700) return chalk.bgRed.white.bold;
  if (priority >= 500) return chalk.bgYellow.black.bold;
  return chalk.bgGreen.black.bold;
}

/**
 * Get an enhanced priority badge for Markdown with numeric values and visual indicators
 * @param {string|number} priority - The task priority
 * @returns {string} Enhanced priority badge
 */
function getPriorityBadge(priority) {
  const numericPriority = getPriorityNumericValue(priority);
  const category = getPriorityCategory(numericPriority);
  const emoji = getPriorityEmoji(numericPriority);
  const progressBar = getPriorityProgressBar(numericPriority);

  return `${emoji} **${category}** \`${numericPriority}\` ${progressBar}`;
}

/**
 * Get priority emoji based on numeric value
 * @param {number} priority - Numeric priority
 * @returns {string} Priority emoji
 */
function getPriorityEmoji(priority) {
  if (priority >= 950) return '🚨'; // Ultra critical
  if (priority >= 900) return '🔥'; // Critical
  if (priority >= 800) return '🔴'; // Very high
  if (priority >= 700) return '🟠'; // High
  if (priority >= 600) return '🟡'; // Medium-high
  if (priority >= 500) return '🟢'; // Medium
  if (priority >= 400) return '🔵'; // Medium-low
  if (priority >= 300) return '⚪'; // Low
  return '⚫'; // Very low
}

/**
 * Get priority progress bar for Markdown
 * @param {number} priority - Numeric priority (1-1000)
 * @returns {string} Progress bar representation
 */
function getPriorityProgressBar(priority) {
  const normalizedPriority = Math.max(1, Math.min(1000, priority));
  const barLength = 10;
  const filledLength = Math.round((normalizedPriority / 1000) * barLength);

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(barLength - filledLength);

  return `\`${filled}${empty}\``;
}

/**
 * Get priority distribution statistics
 * @param {Array} tasks - Array of tasks
 * @returns {Object} Priority distribution counts
 */
function getPriorityDistribution(tasks) {
  const distribution = {
    critical: 0,  // 900+
    high: 0,      // 700-899
    medium: 0,    // 500-699
    low: 0        // <500
  };

  // Count main tasks
  tasks.forEach(task => {
    const priority = getPriorityNumericValue(task.priorityDisplay || task.priority);

    if (priority >= 900) distribution.critical++;
    else if (priority >= 700) distribution.high++;
    else if (priority >= 500) distribution.medium++;
    else distribution.low++;

    // Count subtasks too
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(subtask => {
        const subtaskPriority = getPriorityNumericValue(subtask.priorityDisplay || subtask.priority || 500);

        if (subtaskPriority >= 900) distribution.critical++;
        else if (subtaskPriority >= 700) distribution.high++;
        else if (subtaskPriority >= 500) distribution.medium++;
        else distribution.low++;
      });
    }
  });

  return distribution;
}

/**
 * Generate a compact priority distribution chart for Markdown
 * @param {Object} distribution - Priority distribution object
 * @returns {string} Compact Markdown chart in quote box
 */
function generateCompactPriorityChart(distribution) {
  const total = distribution.critical + distribution.high + distribution.medium + distribution.low;
  if (total === 0) return '';

  const chartWidth = 20;

  // Calculate proportions
  const criticalWidth = Math.round((distribution.critical / total) * chartWidth);
  const highWidth = Math.round((distribution.high / total) * chartWidth);
  const mediumWidth = Math.round((distribution.medium / total) * chartWidth);
  const lowWidth = chartWidth - criticalWidth - highWidth - mediumWidth;

  // Create compact chart in quote box
  let chart = '> ### 📊 Priority Distribution\n';
  chart += '> \n';
  chart += `> 🚨 **Critical**: ${distribution.critical} | `;
  chart += `🔴 **High**: ${distribution.high} | `;
  chart += `🟡 **Medium**: ${distribution.medium} | `;
  chart += `🟢 **Low**: ${distribution.low}\n`;
  chart += '> \n';
  chart += '> ```\n';
  chart += '> ';
  chart += '🚨'.repeat(Math.max(0, criticalWidth));
  chart += '🔴'.repeat(Math.max(0, highWidth));
  chart += '🟡'.repeat(Math.max(0, mediumWidth));
  chart += '🟢'.repeat(Math.max(0, lowWidth));
  chart += '\n';
  chart += '> ```\n\n';

  return chart;
}

/**
 * Generate a visual priority distribution chart for Markdown (legacy)
 * @param {Object} distribution - Priority distribution object
 * @returns {string} Markdown chart
 */
function generatePriorityChart(distribution) {
  // Use the new compact version
  return generateCompactPriorityChart(distribution);
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
    tasksFilePath: path.resolve(workspaceRoot, '.acf', 'tasks.json'),
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
  syncTaskTable,
  getColoredPriority,
  getPriorityBadge,
  getPriorityDistribution,
  generatePriorityChart,
  generateCompactPriorityChart
};