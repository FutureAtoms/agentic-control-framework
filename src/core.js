/**
 * Agentic Control Framework (ACF) - Core Module
 *
 * @author Abhilash Chadhar (FutureAtoms)
 * @description Core task management logic and data structures for ACF
 * @version 0.1.1
 */

const fs = require('fs');
const path = require('path');
const prdParser = require('./prd_parser'); // Import the PRD parser
const Table = require('cli-table3'); // Import cli-table3
const chalk = require('chalk'); // Import chalk (v4)
const logger = require('./logger'); // Import our logger module
const os = require('os'); // Import os module
const tableRenderer = require('./tableRenderer'); // Import the tableRenderer module
const PriorityEngine = require('./priority_engine'); // Import advanced priority engine
const fileWatcher = require('./file_watcher'); // Import file watcher module
const priorityTemplates = require('./priority_templates'); // Import priority templates

// Simple task data cache to reduce file I/O
const taskCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache TTL

// Derived data cache to eliminate redundant representations
const derivedDataCache = new Map();
const DERIVED_CACHE_TTL = 10000; // 10 seconds for derived data

// Priority logging configuration
const PRIORITY_LOGGING_CONFIG = {
  enabled: true,
  minSignificantDelta: 50, // Only log priority changes >= 50 points for automatic adjustments
  minMcpDelta: 10, // Only log MCP priority changes >= 10 points
  consolidateWindow: 60000, // 1 minute window for consolidating similar logs
  maxMinorAdjustmentsBeforeSummary: 3 // Group minor adjustments into summary after this many
};

// Cache helper functions
function getCacheKey(workspaceRoot) {
  return path.resolve(workspaceRoot);
}

function getCachedTasks(workspaceRoot) {
  const key = getCacheKey(workspaceRoot);
  const cached = taskCache.get(key);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    logger.debug('Using cached task data');
    return JSON.parse(JSON.stringify(cached.data)); // Return deep copy
  }

  return null;
}

function setCachedTasks(workspaceRoot, data) {
  const key = getCacheKey(workspaceRoot);
  taskCache.set(key, {
    data: JSON.parse(JSON.stringify(data)), // Store deep copy
    timestamp: Date.now()
  });
  logger.debug('Cached task data');
}

function invalidateCache(workspaceRoot) {
  const key = getCacheKey(workspaceRoot);
  taskCache.delete(key);
  // Also invalidate all derived data when task data changes
  invalidateDerivedDataCache(workspaceRoot);
  logger.debug('Invalidated task cache');
}

// Derived data cache helper functions
function getDerivedCacheKey(workspaceRoot, type) {
  return `${path.resolve(workspaceRoot)}:${type}`;
}

function getCachedDerivedData(workspaceRoot, type) {
  const key = getDerivedCacheKey(workspaceRoot, type);
  const cached = derivedDataCache.get(key);

  if (cached && (Date.now() - cached.timestamp) < DERIVED_CACHE_TTL) {
    logger.debug(`Using cached derived data: ${type}`);
    return cached.data;
  }

  return null;
}

function setCachedDerivedData(workspaceRoot, type, data) {
  const key = getDerivedCacheKey(workspaceRoot, type);
  derivedDataCache.set(key, {
    data: data,
    timestamp: Date.now()
  });
  logger.debug(`Cached derived data: ${type}`);
}

function invalidateDerivedDataCache(workspaceRoot) {
  // Remove all derived data for this workspace
  const prefix = path.resolve(workspaceRoot) + ':';
  for (const key of derivedDataCache.keys()) {
    if (key.startsWith(prefix)) {
      derivedDataCache.delete(key);
    }
  }
  logger.debug('Invalidated derived data cache');
}

// Priority logging configuration functions
function configurePriorityLogging(options = {}) {
  if (options.enabled !== undefined) PRIORITY_LOGGING_CONFIG.enabled = options.enabled;
  if (options.minSignificantDelta !== undefined) PRIORITY_LOGGING_CONFIG.minSignificantDelta = options.minSignificantDelta;
  if (options.minMcpDelta !== undefined) PRIORITY_LOGGING_CONFIG.minMcpDelta = options.minMcpDelta;
  if (options.consolidateWindow !== undefined) PRIORITY_LOGGING_CONFIG.consolidateWindow = options.consolidateWindow;
  if (options.maxMinorAdjustmentsBeforeSummary !== undefined) PRIORITY_LOGGING_CONFIG.maxMinorAdjustmentsBeforeSummary = options.maxMinorAdjustmentsBeforeSummary;

  logger.info(`Priority logging configured: ${JSON.stringify(PRIORITY_LOGGING_CONFIG)}`);
  return { success: true, config: { ...PRIORITY_LOGGING_CONFIG } };
}

function getPriorityLoggingConfig() {
  return { success: true, config: { ...PRIORITY_LOGGING_CONFIG } };
}

// Initialize global priority engine instance
const priorityEngine = new PriorityEngine();

// --- Priority System Configuration ---
// Priority mapping for backward compatibility
const PRIORITY_MAPPING = {
  // String to numeric mappings
  'critical': 900,
  'high': 700,
  'medium': 500,
  'low': 300,
  // Numeric to string mappings (for display/backward compatibility)
  _numeric_to_string: (num) => {
    if (num >= 800) return 'critical';
    if (num >= 600) return 'high';
    if (num >= 400) return 'medium';
    return 'low';
  }
};

// Helper function to normalize priority to numeric value
function normalizePriority(priority) {
  if (typeof priority === 'number') {
    // Clamp between 1 and 1000
    return Math.max(1, Math.min(1000, Math.round(priority)));
  }
  if (typeof priority === 'string') {
    // Check if it's a numeric string
    const numPriority = parseInt(priority, 10);
    if (!isNaN(numPriority)) {
      return Math.max(1, Math.min(1000, numPriority));
    }
    // Otherwise use mapping
    return PRIORITY_MAPPING[priority.toLowerCase()] || PRIORITY_MAPPING['medium'];
  }
  // Default to medium priority
  return PRIORITY_MAPPING['medium'];
}

// Helper function to get display priority (for backward compatibility)
function getDisplayPriority(priority) {
  if (typeof priority === 'number') {
    return priority;
  }
  // For string priorities, return as-is
  return priority;
}

// Helper function to convert numeric priority to string for backward compatibility
function getPriorityString(priority) {
  if (typeof priority === 'string' && PRIORITY_MAPPING[priority.toLowerCase()]) {
    return priority.toLowerCase();
  }
  if (typeof priority === 'number') {
    return PRIORITY_MAPPING._numeric_to_string(priority);
  }
  return 'medium';
}
// --- End Priority System Configuration ---

// --- Priority Uniqueness System ---
// Function to ensure all tasks have unique numerical priorities
function ensureUniquePriorities(tasksData) {
  if (!tasksData.tasks || tasksData.tasks.length === 0) return;

  // Separate tasks by priority type
  const stringPriorityTasks = [];
  const numericPriorityTasks = [];
  
  tasksData.tasks.forEach(task => {
    // Check if the task is using a backward-compatible string priority
    if (typeof task.priorityDisplay === 'string' && 
        PRIORITY_MAPPING[task.priorityDisplay.toLowerCase()] === task.priority) {
      stringPriorityTasks.push(task);
    } else {
      numericPriorityTasks.push(task);
    }
  });

  // Sort numeric priority tasks by priority (descending) and then by ID (ascending)
  numericPriorityTasks.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.id - b.id; // If same priority, sort by ID to maintain consistency
  });

  // Check for conflicts and adjust
  const usedPriorities = new Set();
  const adjustedTasks = [];

  // First, record all string-based priorities as "used"
  stringPriorityTasks.forEach(task => {
    usedPriorities.add(task.priority);
  });

  // Process numeric priority tasks
  numericPriorityTasks.forEach(task => {
    let newPriority = task.priority;
    let adjustmentAttempts = 0;
    const maxAttempts = 1000; // Prevent infinite loops

    // Find a unique priority
    while (usedPriorities.has(newPriority) && adjustmentAttempts < maxAttempts) {
      // Try decreasing by 1 first (to maintain relative order)
      newPriority--;
      
      // Ensure we stay within bounds
      if (newPriority < 1) {
        // If we hit the lower bound, try increasing from original
        newPriority = task.priority + adjustmentAttempts;
        if (newPriority > 1000) {
          // If we exceed upper bound, compress the range
          newPriority = Math.floor(Math.random() * 900) + 50; // Random between 50-950
        }
      }
      
      adjustmentAttempts++;
    }

    // If priority was adjusted, update the task and log it
    if (newPriority !== task.priority) {
      const oldPriority = task.priority;
      task.priority = newPriority;

      // Update priorityDisplay if it was numeric
      if (typeof task.priorityDisplay === 'number') {
        task.priorityDisplay = newPriority;
      }

      // Add smart activity log entry for automatic priority adjustments
      addActivityLog(task, `Priority automatically adjusted from ${oldPriority} to ${newPriority} to ensure uniqueness.`, 'log', {
        isPriorityLog: true,
        isManual: false,
        priorityDelta: Math.abs(newPriority - oldPriority),
        newPriority: newPriority
      });
      adjustedTasks.push({ id: task.id, oldPriority, newPriority });
    }

    usedPriorities.add(newPriority);
  });

  // Return information about adjustments made
  return adjustedTasks;
}

// Function to suggest the next available priority near a target
function getNextAvailablePriority(tasksData, targetPriority, excludeTaskId = null) {
  const usedPriorities = new Set();
  
  // Collect all used priorities except the excluded task
  tasksData.tasks.forEach(task => {
    if (task.id !== excludeTaskId) {
      usedPriorities.add(task.priority);
    }
  });

  // If target is available, use it
  if (!usedPriorities.has(targetPriority)) {
    return targetPriority;
  }

  // Search for nearest available priority
  let offset = 1;
  const maxOffset = 500;

  while (offset <= maxOffset) {
    // Try higher priority first
    const higher = targetPriority + offset;
    if (higher <= 1000 && !usedPriorities.has(higher)) {
      return higher;
    }

    // Try lower priority
    const lower = targetPriority - offset;
    if (lower >= 1 && !usedPriorities.has(lower)) {
      return lower;
    }

    offset++;
  }

  // If no nearby priority is available, find any available
  for (let p = 1000; p >= 1; p--) {
    if (!usedPriorities.has(p)) {
      return p;
    }
  }

  // This should never happen with 1000 priorities and reasonable task counts
  return targetPriority;
}
// --- End Priority Uniqueness System ---

// --- Advanced Priority Management Functions ---
/**
 * Recalculate priorities for all tasks using advanced algorithms
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} options - Recalculation options
 * @returns {Object} Result with success status and adjustments made
 */
function recalculatePriorities(workspaceRoot, options = {}) {
  try {
    const tasksData = readTasks(workspaceRoot);
    const adjustments = priorityEngine.recalculateAllPriorities(tasksData, options);

    if (adjustments.length > 0) {
      // Log adjustments to affected tasks
      adjustments.forEach(adjustment => {
        const task = tasksData.tasks.find(t => t.id === adjustment.taskId);
        if (task) {
          addActivityLog(task, adjustment.reason);
        }
      });

      writeTasks(workspaceRoot, tasksData);
    }

    return {
      success: true,
      message: `Recalculated priorities for ${tasksData.tasks.length} tasks. Made ${adjustments.length} adjustments.`,
      adjustments
    };
  } catch (error) {
    return {
      success: false,
      message: `Error recalculating priorities: ${error.message}`
    };
  }
}

/**
 * Get priority statistics for the current task set
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Priority statistics
 */
function getPriorityStatistics(workspaceRoot) {
  try {
    // Check cache first
    const cached = getCachedDerivedData(workspaceRoot, 'priority-stats');
    if (cached) {
      return cached;
    }

    const tasksData = readTasks(workspaceRoot);
    const stats = priorityEngine.getPriorityStatistics(tasksData.tasks);

    const result = {
      success: true,
      statistics: stats
    };

    // Cache the result
    setCachedDerivedData(workspaceRoot, 'priority-stats', result);

    return result;
  } catch (error) {
    return {
      success: false,
      message: `Error getting priority statistics: ${error.message}`
    };
  }
}

/**
 * Get dependency analysis for the current task set
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Dependency analysis report
 */
function getDependencyAnalysis(workspaceRoot) {
  try {
    const tasksData = readTasks(workspaceRoot);
    const analysis = priorityEngine.getDependencyAnalysis(tasksData.tasks);

    return {
      success: true,
      analysis: analysis
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting dependency analysis: ${error.message}`
    };
  }
}
// --- End Advanced Priority Management Functions ---

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
    tasksFilePath: path.resolve(workspaceRoot, '.acf', 'tasks.json'),
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
  const { projectName = "Untitled Project", projectDescription = "", editor = null } = options;
  logger.info(`[DEBUG] initProject: projectDescription = "${projectDescription}"`); // Added for debugging
  let messages = []; // Collect messages to return

  // Ensure the .acf directory exists
  const acfDir = path.dirname(tasksFilePath);
  const dirMsgAcf = ensureDirExists(acfDir);
  if (dirMsgAcf) messages.push(dirMsgAcf);

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
          priority: normalizePriority("high"), // Use numeric priority
          priorityDisplay: "high", // Store original format
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
      messages.push(`View the auto-generated task board at tasks-table.md`);
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
      messages.push(`Tasks file already exists. The task board at tasks-table.md has been synced.`);
    } catch (error) {
      logger.error(`Failed to sync task table during init: ${error.message}`);
    }
  }

  const dirMsg = ensureDirExists(cursorRulesDir);
  if (dirMsg) messages.push(dirMsg);

  if (!fs.existsSync(cursorRulesFile)) {
    const placeholderContent = `# Cursor AI Workflow Rules for Agentic Control Framework\n\n# (Define rules here to tell Cursor how to use acf commands)\n\n# Example:\n# To list tasks, use the command: acf list\n# To get the next task: acf next\n`;
    try {
      fs.writeFileSync(cursorRulesFile, placeholderContent);
      messages.push(`Created placeholder Cursor rules file: ${cursorRulesFile}`);
    } catch (error) {
       throw new Error(`Failed to write cursor rules file ${cursorRulesFile}: ${error.message}`);
    }
  } else {
    messages.push(`Cursor rules file already exists: ${cursorRulesFile}`);
  }
  
  // Handle editor-specific setup
  if (editor) {
      const validEditors = ['cursor', 'claude', 'cline', 'void'];
      if (validEditors.includes(editor)) {
          const editorDir = path.resolve(workspaceRoot, `.${editor}`);
          const editorRulesDir = path.resolve(editorDir, 'rules');
          const editorRulesFile = path.resolve(editorRulesDir, 'acf_rules.md');

          const editorDirMsg = ensureDirExists(editorRulesDir);
          if (editorDirMsg) messages.push(editorDirMsg);

          if (!fs.existsSync(editorRulesFile)) {
              let finalContent = '';
              const oldRulesFile = path.resolve(workspaceRoot, '.cursor', 'rules', 'task_manager_workflow.mdc');

              // 1. Check for the old rules file and read its content
              if (fs.existsSync(oldRulesFile)) {
                  try {
                      finalContent += fs.readFileSync(oldRulesFile, 'utf8') + '\n\n---\n\n';
                      messages.push(`Migrated content from old rules file: ${oldRulesFile}`);
                  } catch (error) {
                      messages.push(`[WARN] Could not read old rules file at ${oldRulesFile}. Skipping migration.`);
                  }
              }

              // 2. Add the new placeholder content
              finalContent += `# Agentic Control Framework Rules for ${editor}\n\nThis file defines workflow rules and automations for the ACF.\n\n## Example Rules\n\n- **On test pass**: Automatically run 'acf next' to proceed to the next task.\n- **On task completion**: Prompt user for a commit message.\n`;

              try {
                  fs.writeFileSync(editorRulesFile, finalContent);
                  messages.push(`Created consolidated rules file for ${editor}: ${editorRulesFile}`);
                  
                  // 3. Clean up the old file after successful migration
                  if (fs.existsSync(oldRulesFile)) {
                      fs.unlinkSync(oldRulesFile);
                      messages.push(`Removed old rules file to avoid duplication.`);
                  }

              } catch (error) {
                  throw new Error(`Failed to write ${editor} rules file: ${error.message}`);
              }
          } else {
              messages.push(`${editor} rules file already exists: ${editorRulesFile}`);
          }
      } else {
          messages.push(`[WARN] Invalid editor type '${editor}'. No rules created. Valid options are: ${validEditors.join(', ')}`);
      }
  }
  
  // Return success and collected messages
  return { success: true, message: messages.join('\n') };
}

// Function to read tasks from the file
function readTasks(workspaceRoot, options = {}) { // Renamed argument, added options
  // Check cache first unless bypassed
  if (!options.bypassCache) {
    const cached = getCachedTasks(workspaceRoot);
    if (cached) {
      return cached;
    }
  }

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
            
            // Migrate priority to numerical if needed
            if (typeof task.priority === 'string') {
                task.priorityDisplay = task.priority; // Store original display value
                task.priority = normalizePriority(task.priority);
            } else if (typeof task.priority === 'number') {
                // Ensure numeric priority is within bounds
                task.priority = normalizePriority(task.priority);
                if (task.priorityDisplay === undefined) {
                    task.priorityDisplay = task.priority; // Use numeric display
                }
            }
            
            // Initialize subtask fields too
            if (Array.isArray(task.subtasks)) {
                task.subtasks.forEach(subtask => {
                    if (subtask.activityLog === undefined) subtask.activityLog = [];
                });
            }
        });
    }

    // Cache the result for future reads
    if (!options.bypassCache) {
      setCachedTasks(workspaceRoot, tasksData);
    }

    return tasksData;
  } catch (error) {
    // Throw a more specific error for parsing/reading issues
    throw new Error(`Error reading or parsing tasks file ${resolvedTasksFilePath}: ${error.message}`);
  }
}

// Helper function to find a task or subtask by its ID
function findTask(tasksData, id) {
  const idString = String(id);
  if (idString.includes('.')) {
    const [parentId, subtaskIndex] = idString.split('.').map(Number);
    const parentTask = tasksData.tasks.find(task => task.id === parentId);
    if (parentTask && parentTask.subtasks) {
      // The subtask ID in the file is a string like "1.1", "1.2", etc.
      const subtask = parentTask.subtasks.find(sub => sub.id === idString);
      return { subtask, parentTask };
    }
  } else {
    const taskId = parseInt(idString, 10);
    const task = tasksData.tasks.find(task => task.id === taskId);
    return { task };
  }
  return {}; // Return empty object if not found
}

// Function to write tasks to the file
function writeTasks(workspaceRoot, data, options = {}) { // Renamed argument, added options
  const { tasksFilePath } = getWorkspacePaths(workspaceRoot); // Pass argument
  // Resolve the path to ensure it works with both relative and absolute paths
  const resolvedTasksFilePath = resolvePath(workspaceRoot, tasksFilePath);

  // Only apply expensive operations if explicitly requested or if it's a major change
  const shouldRecalculatePriorities = options.recalculatePriorities !== false &&
    (options.forceRecalculation || data.tasks.length > 10); // Skip for small task sets unless forced

  const shouldUpdateTable = options.updateTable !== false &&
    (options.forceTableUpdate || !options.skipTableUpdate);

  // Apply advanced priority recalculation only when needed
  if (shouldRecalculatePriorities) {
    const priorityAdjustments = priorityEngine.recalculateAllPriorities(data, {
      applyDependencyBoosts: true,
      applyTimeDecay: false, // Disabled by default
      optimizeDistribution: true
    });

    if (priorityAdjustments && priorityAdjustments.length > 0) {
      logger.debug(`Applied ${priorityAdjustments.length} priority adjustments`);

      // Smart logging for priority engine adjustments - only log significant changes
      const significantAdjustments = priorityAdjustments.filter(adj =>
        adj.type === 'manual' || Math.abs(adj.newPriority - adj.oldPriority) > 50
      );

      // Group minor adjustments into a single summary log
      const minorAdjustments = priorityAdjustments.filter(adj =>
        adj.type !== 'manual' && Math.abs(adj.newPriority - adj.oldPriority) <= 50
      );

      // Log significant adjustments individually
      significantAdjustments.forEach(adjustment => {
        const task = data.tasks.find(t => t.id === adjustment.taskId);
        if (task) {
          addActivityLog(task, adjustment.reason, 'log', {
            isPriorityLog: true,
            isManual: adjustment.type === 'manual',
            priorityDelta: Math.abs(adjustment.newPriority - adjustment.oldPriority),
            newPriority: adjustment.newPriority
          });
        }
      });

      // Add a single summary log for minor adjustments if there are many
      if (minorAdjustments.length > 3) {
        const affectedTaskIds = [...new Set(minorAdjustments.map(adj => adj.taskId))];
        affectedTaskIds.forEach(taskId => {
          const task = data.tasks.find(t => t.id === taskId);
          if (task) {
            const taskAdjustments = minorAdjustments.filter(adj => adj.taskId === taskId);
            const latestAdjustment = taskAdjustments[taskAdjustments.length - 1];
            addActivityLog(task, `Priority auto-tuned (${taskAdjustments.length} adjustments)`, 'log', {
              isPriorityLog: true,
              isManual: false,
              priorityDelta: 25, // Treat as minor
              newPriority: latestAdjustment.newPriority
            });
          }
        });
      } else {
        // Log minor adjustments individually if there are few
        minorAdjustments.forEach(adjustment => {
          const task = data.tasks.find(t => t.id === adjustment.taskId);
          if (task) {
            addActivityLog(task, adjustment.reason, 'log', {
              isPriorityLog: true,
              isManual: false,
              priorityDelta: Math.abs(adjustment.newPriority - adjustment.oldPriority),
              newPriority: adjustment.newPriority
            });
          }
        });
      }
    }
  }

  try {
    fs.writeFileSync(resolvedTasksFilePath, JSON.stringify(data, null, 2));

    // Invalidate cache since we've written new data
    invalidateCache(workspaceRoot);

    // Generate the human-readable task table only when needed
    if (shouldUpdateTable) {
      tableRenderer.writeTaskTable(data, workspaceRoot);
      logger.info(`Tasks updated. View the auto-generated task board at tasks-table.md`);
    } else {
      logger.debug(`Tasks updated (table generation skipped for performance)`);
    }
  } catch (error) {
    // Throw an error instead of exiting
    throw new Error(`Error writing tasks file ${resolvedTasksFilePath}: ${error.message}`);
  }
}

// Helper function to add a log entry with smart priority logging
function addActivityLog(item, message, type = 'log', options = {}) {
    if (!item.activityLog) {
        item.activityLog = [];
    }

    // Smart priority logging: avoid spam from automatic adjustments
    if (options.isPriorityLog && PRIORITY_LOGGING_CONFIG.enabled) {
        const minDelta = options.isManual ? 1 : PRIORITY_LOGGING_CONFIG.minSignificantDelta;

        // Only log significant priority changes or manual changes
        if (options.isManual || options.priorityDelta >= minDelta) {
            // For automatic changes, use a condensed format
            if (!options.isManual) {
                // Check if we already have a recent priority log to consolidate
                const recentPriorityLog = item.activityLog
                    .slice(-3) // Check last 3 entries
                    .find(log => log.message.includes('Priority') &&
                          (Date.now() - new Date(log.timestamp).getTime()) < PRIORITY_LOGGING_CONFIG.consolidateWindow);

                if (recentPriorityLog) {
                    // Update the existing log instead of adding a new one
                    recentPriorityLog.message = `Priority auto-adjusted (latest: ${options.newPriority})`;
                    recentPriorityLog.timestamp = new Date().toISOString();
                    item.updatedAt = new Date().toISOString();
                    return;
                }

                // Use condensed format for automatic adjustments
                message = `Priority auto-adjusted to ${options.newPriority}`;
            }
        } else {
            // Skip logging minor automatic priority adjustments
            item.updatedAt = new Date().toISOString();
            return;
        }
    } else if (options.isPriorityLog && !PRIORITY_LOGGING_CONFIG.enabled) {
        // Priority logging is disabled, just update timestamp
        item.updatedAt = new Date().toISOString();
        return;
    }

    item.activityLog.push({
        timestamp: new Date().toISOString(),
        type: type,
        message: message
    });
    item.updatedAt = new Date().toISOString();
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
    priority: getNextAvailablePriority(tasksData, normalizePriority(options.priority || 'medium')),
    priorityDisplay: getDisplayPriority(options.priority || 'medium'), // Store original format for display
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
        task.priorityDisplay || task.priority, // Show display priority
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
function addSubtask(workspaceRoot, parentId, options, tasksData) {
  const shouldWrite = options.write !== false;
  if (!tasksData) {
    tasksData = readTasks(workspaceRoot);
  }
  const { task: parentTask } = findTask(tasksData, parentId);

  if (!parentTask) {
    throw new Error(`Parent task with ID ${parentId} not found.`);
  }
  
  // Initialize lastSubtaskIndex if it doesn't exist
  if (parentTask.lastSubtaskIndex === undefined) {
    parentTask.lastSubtaskIndex = 0;
  }
  
  // Create new subtask index
  const subTaskIndex = parentTask.lastSubtaskIndex + 1;
  const newSubtaskId = `${parentId}.${subTaskIndex}`;
  
  // Create new subtask
  const newSubtask = {
    id: newSubtaskId,
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
  
  if (shouldWrite) {
    writeTasks(workspaceRoot, tasksData);
  }

  // Return data instead of logging
  return { success: true, message: `Added new subtask (ID: ${newSubtaskId}) to task ${parentId}: "${newSubtask.title}"`, subtaskId: newSubtaskId };
}

// Function to update the status of a task or subtask
function updateStatus(workspaceRoot, id, newStatus, message) { // Added message parameter
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const { task, subtask, parentTask } = findTask(tasksData, id);
  const item = task || subtask;

  if (!item) {
    return { success: false, message: `Task or subtask with ID ${id} not found.` };
  }

  // Prevent starting a task if dependencies are not met
  if (['inprogress', 'testing'].includes(newStatus.toLowerCase())) {
    if (item.dependsOn && item.dependsOn.length > 0) {
      const dependenciesMet = item.dependsOn.every(depId => {
        const dependency = tasksData.tasks.find(t => t.id === depId);
        return dependency && dependency.status === 'done';
      });

      if (!dependenciesMet) {
        return { success: false, message: `Cannot start task ${id}. It has unmet dependencies.` };
      }
    }
  }

  // Prevent marking a task as done if it has incomplete subtasks
  if (newStatus.toLowerCase() === 'done' && item.subtasks && item.subtasks.some(s => s.status !== 'done')) {
    return { success: false, message: `Cannot mark task ${id} as done. All its subtasks must be completed first.` };
  }

  const oldStatus = item.status;
  item.status = newStatus.toLowerCase();
  
  const logMessage = message 
    ? `Status changed from "${oldStatus}" to "${newStatus}". Message: ${message}`
    : `Status changed from "${oldStatus}" to "${newStatus}"`;

  addActivityLog(item, logMessage);

  // If a task is moved to 'testing', auto-generate testing subtasks
  if (item && !item.id.toString().includes('.') && newStatus.toLowerCase() === 'testing') {
    const testingSubtasks = [
      { title: `Write unit and integration tests for '${item.title}'`, write: false },
      { title: `Ensure all tests are passing for '${item.title}'`, write: false }
    ];

    testingSubtasks.forEach(subtaskOptions => {
      addSubtask(workspaceRoot, item.id, subtaskOptions, tasksData);
    });
  }

  // If a subtask is updated, also update the parent task's timestamp
  if (parentTask) {
    parentTask.updatedAt = new Date().toISOString();
  }
  
  writeTasks(workspaceRoot, tasksData); // Pass argument
  return { success: true, message: `Status of ${subtask ? 'subtask' : 'task'} ${id} updated to ${newStatus}.` };
}

// Function to get the next actionable task
function getNextTask(workspaceRoot) { // Renamed argument
  const tasksData = readTasks(workspaceRoot); // Pass argument
  const tasks = tasksData.tasks;
  
  const actionableTasks = tasks.filter(task => {
    // Task must be in 'todo' or 'inprogress' status
    const isActionableStatus = task.status === 'todo' || task.status === 'inprogress';
    if (!isActionableStatus) return false;

    // All dependencies must be 'done'
    const dependenciesMet = task.dependsOn.every(depId => {
      const dependency = tasks.find(t => t.id === depId);
      return dependency && dependency.status === 'done';
    });
    
    return dependenciesMet;
  });

  if (actionableTasks.length === 0) {
    return { success: false, message: "No actionable tasks found. All tasks are either done, blocked by dependencies, or have other statuses." };
  }
  
  // Sort by numeric priority (higher number = higher priority)
  actionableTasks.sort((a, b) => {
    // Numeric priorities - higher values come first
    return (b.priority || 0) - (a.priority || 0);
  });
  
  // Return the highest priority actionable task
  const nextTask = actionableTasks[0];
  
  return { 
    success: true, 
    message: `Next actionable task (ID: ${nextTask.id}): "${nextTask.title}"`,
    task: nextTask 
  };
}

// Function to update a task. For subtasks, use updateSubtask.
function updateTask(workspaceRoot, id, options) {
  const tasksData = readTasks(workspaceRoot);
  const { task, subtask } = findTask(tasksData, id);

  if (subtask) {
    // Delegate to the new updateSubtask function for subtasks
    return updateSubtask(workspaceRoot, id, options);
  }

  if (!task) {
    return { success: false, message: `Task with ID ${id} not found.` };
  }

  // It's a main task, proceed with updating
  let updated = false;
  const parseCommaSeparated = (str) => (typeof str === 'string' ? str.split(',').map(s => s.trim()).filter(Boolean) : []);

  if (options.title !== undefined) {
    task.title = options.title;
    addActivityLog(task, `Title updated to: "${options.title}"`);
    updated = true;
  }
  if (options.description !== undefined) {
    task.description = options.description;
    addActivityLog(task, 'Description updated.');
    updated = true;
  }
  if (options.priority !== undefined) {
    const oldPriority = task.priorityDisplay || task.priority;
    const targetPriority = normalizePriority(options.priority);
    task.priority = getNextAvailablePriority(tasksData, targetPriority, task.id);
    task.priorityDisplay = getDisplayPriority(options.priority);
    addActivityLog(task, `Priority updated from ${oldPriority} to: ${task.priorityDisplay}`, 'log', {
      isPriorityLog: true,
      isManual: true,
      priorityDelta: Math.abs(task.priority - (typeof oldPriority === 'number' ? oldPriority : normalizePriority(oldPriority))),
      newPriority: task.priority
    });
    updated = true;
  }
  if (options.dependsOn !== undefined) {
    task.dependsOn = options.dependsOn.split(',').map(depId => parseInt(depId.trim())).filter(depId => !isNaN(depId));
    addActivityLog(task, `Dependencies updated to: ${task.dependsOn.join(', ')}`);
    updated = true;
  }
  if (options.relatedFiles !== undefined) {
    task.relatedFiles = parseCommaSeparated(options.relatedFiles);
    addActivityLog(task, 'Related files updated.');
    updated = true;
  }

  if (updated) {
    task.updatedAt = new Date().toISOString();
    writeTasks(workspaceRoot, tasksData);
    return { success: true, message: `Task ${id} updated successfully.` };
  } else {
    return { success: false, message: `No updates provided for task ${id}.` };
  }
}

// Function to update a subtask
function updateSubtask(workspaceRoot, subtaskId, options) {
  const tasksData = readTasks(workspaceRoot);
  const { subtask, parentTask } = findTask(tasksData, subtaskId);

  if (!subtask) {
    return { success: false, message: `Subtask with ID ${subtaskId} not found.` };
  }

  let updated = false;

  if (options.title !== undefined) {
    subtask.title = options.title;
    addActivityLog(subtask, `Title updated to: "${options.title}"`);
    updated = true;
  }
  // Currently, only the title of a subtask can be updated.
  // Add other fields here if needed in the future.

  if (updated) {
    subtask.updatedAt = new Date().toISOString();
    parentTask.updatedAt = new Date().toISOString(); // Also update parent task's timestamp
    writeTasks(workspaceRoot, tasksData);
    return { success: true, message: `Subtask ${subtaskId} updated successfully.` };
  } else {
    return { success: false, message: `No updates provided for subtask ${subtaskId}.` };
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
function generateTaskFiles(workspaceRoot, options = {}) { // Renamed argument, added options
  // Check cache first unless forced
  if (!options.force) {
    const cached = getCachedDerivedData(workspaceRoot, 'task-files');
    if (cached) {
      return cached;
    }
  }

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
      content += `**Priority:** ${task.priorityDisplay || task.priority}\n`;
      
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

    const result = { success: true, message: `Generated ${filesCreated} task files in the '${taskFilesDir}' directory.` };

    // Cache the result
    if (!options.force) {
      setCachedDerivedData(workspaceRoot, 'task-files', result);
    }

    return result;
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
        priority: normalizePriority(taskInfo.priority || 'medium'),
        priorityDisplay: getDisplayPriority(taskInfo.priority || 'medium'),
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
      reportContent += `- Priority: ${task.priorityDisplay || task.priority}\n`;
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
function generateHumanReadableTaskTable(workspaceRoot, options = {}) {
  try {
    // Check cache first unless forced
    if (!options.force) {
      const cached = getCachedDerivedData(workspaceRoot, 'task-table');
      if (cached) {
        return cached;
      }
    }

    const tasksData = readTasks(workspaceRoot);
    const tableRenderer = require('./tableRenderer');
    const success = tableRenderer.writeTaskTable(tasksData, workspaceRoot);

    const result = success ?
      { success: true, message: `Human-readable task table has been generated.` } :
      { success: false, message: 'Failed to generate human-readable task table.' };

    // Cache the result
    if (!options.force && result.success) {
      setCachedDerivedData(workspaceRoot, 'task-table', result);
    }

    return result;
  } catch (error) {
    throw new Error(`Error generating human-readable task table: ${error.message}`);
  }
}

/**
 * Configure time decay settings
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} config - Time decay configuration
 * @returns {Object} Result with success status and current config
 */
function configureTimeDecay(workspaceRoot, config) {
  try {
    priorityEngine.configureTimeDecay(config);

    return {
      success: true,
      message: 'Time decay configuration updated',
      config: priorityEngine.getTimeDecayConfig()
    };
  } catch (error) {
    logger.error(`Error configuring time decay: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Configure effort weighting settings
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} config - Effort weighting configuration
 * @returns {Object} Result with success status and current config
 */
function configureEffortWeighting(workspaceRoot, config) {
  try {
    priorityEngine.configureEffortWeighting(config);

    return {
      success: true,
      message: 'Effort weighting configuration updated',
      config: priorityEngine.getEffortWeightingConfig()
    };
  } catch (error) {
    logger.error(`Error configuring effort weighting: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get current advanced algorithm configuration
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Result with success status and configuration
 */
function getAdvancedAlgorithmConfig(workspaceRoot) {
  try {
    return {
      success: true,
      config: {
        timeDecay: priorityEngine.getTimeDecayConfig(),
        effortWeighting: priorityEngine.getEffortWeightingConfig(),
        availableModels: priorityEngine.getAvailableDecayModels()
      }
    };
  } catch (error) {
    logger.error(`Error getting algorithm configuration: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Initialize file watcher for automatic synchronization
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} options - Watcher configuration options
 * @returns {Object} Result with success status and watcher info
 */
function initializeFileWatcher(workspaceRoot, options = {}) {
  try {
    const watcher = fileWatcher.initializeWatcher(workspaceRoot, options);

    return {
      success: true,
      message: 'File watcher initialized successfully',
      isActive: watcher.isActive(),
      config: watcher.getConfig()
    };
  } catch (error) {
    logger.error(`Error initializing file watcher: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Stop file watcher
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Result with success status
 */
function stopFileWatcher(workspaceRoot) {
  try {
    fileWatcher.stopWatcher();

    return {
      success: true,
      message: 'File watcher stopped successfully'
    };
  } catch (error) {
    logger.error(`Error stopping file watcher: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Configure file watcher settings
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} options - Configuration options
 * @returns {Object} Result with success status and current config
 */
function configureFileWatcher(workspaceRoot, options) {
  try {
    fileWatcher.configureWatcher(options);

    const currentWatcher = fileWatcher.getWatcher();
    return {
      success: true,
      message: 'File watcher configuration updated',
      config: currentWatcher ? currentWatcher.getConfig() : null
    };
  } catch (error) {
    logger.error(`Error configuring file watcher: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get file watcher status and statistics
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Result with success status and watcher stats
 */
function getFileWatcherStatus(workspaceRoot) {
  try {
    const stats = fileWatcher.getWatcherStats();

    return {
      success: true,
      stats: stats || { message: 'No active file watcher' }
    };
  } catch (error) {
    logger.error(`Error getting file watcher status: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Force synchronization of all task files
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Result with success status
 */
async function forceSyncTaskFiles(workspaceRoot) {
  try {
    await fileWatcher.forceSyncAll();

    return {
      success: true,
      message: 'Task files synchronized successfully'
    };
  } catch (error) {
    logger.error(`Error forcing sync: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get all available priority templates
 * @param {string} workspaceRoot - The workspace root path
 * @returns {Object} Result with success status and templates
 */
function getPriorityTemplates(workspaceRoot) {
  try {
    const templates = priorityTemplates.getAllTemplates();

    return {
      success: true,
      templates
    };
  } catch (error) {
    logger.error(`Error getting priority templates: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Calculate priority using a template
 * @param {string} workspaceRoot - The workspace root path
 * @param {string} templateName - Template name
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {Array} tags - Optional tags
 * @returns {Object} Result with calculated priority
 */
function calculatePriorityFromTemplate(workspaceRoot, templateName, title, description, tags = []) {
  try {
    const result = priorityTemplates.calculatePriority(templateName, title, description, tags);

    return result;
  } catch (error) {
    logger.error(`Error calculating priority from template: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Suggest template for a task
 * @param {string} workspaceRoot - The workspace root path
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @returns {Object} Result with template suggestions
 */
function suggestPriorityTemplate(workspaceRoot, title, description) {
  try {
    const result = priorityTemplates.suggestTemplate(title, description);

    return result;
  } catch (error) {
    logger.error(`Error suggesting priority template: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Add task with template-based priority
 * @param {string} workspaceRoot - The workspace root path
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string} templateName - Template name
 * @param {Array} tags - Optional tags
 * @param {Object} options - Additional options
 * @returns {Object} Result with task creation status
 */
function addTaskWithTemplate(workspaceRoot, title, description, templateName, tags = [], options = {}) {
  try {
    // Calculate priority using template
    const priorityResult = priorityTemplates.calculatePriority(templateName, title, description, tags);

    if (!priorityResult.success) {
      return priorityResult;
    }

    // Create task with calculated priority
    const taskOptions = {
      ...options,
      priority: priorityResult.priority,
      templateUsed: templateName,
      templateInfo: {
        basePriority: priorityResult.basePriority,
        appliedModifiers: priorityResult.appliedModifiers,
        template: priorityResult.template
      }
    };

    const result = addTask(workspaceRoot, title, description, taskOptions);

    if (result.success) {
      result.priorityCalculation = priorityResult;
    }

    return result;
  } catch (error) {
    logger.error(`Error adding task with template: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Add custom priority template
 * @param {string} workspaceRoot - The workspace root path
 * @param {string} name - Template name
 * @param {Object} template - Template configuration
 * @returns {Object} Result with success status
 */
function addCustomPriorityTemplate(workspaceRoot, name, template) {
  try {
    const result = priorityTemplates.addCustomTemplate(name, template);

    return result;
  } catch (error) {
    logger.error(`Error adding custom priority template: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
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
  updateSubtask,
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
  generateHumanReadableTaskTable,
  findTask,
  addActivityLog,

  // Cache management exports
  getCachedTasks,
  setCachedTasks,
  invalidateCache,
  getCachedDerivedData,
  setCachedDerivedData,
  invalidateDerivedDataCache,

  // Priority logging configuration exports
  configurePriorityLogging,
  getPriorityLoggingConfig,
  
  // Priority system exports
  normalizePriority,
  getDisplayPriority,
  getPriorityString,
  
  // Priority uniqueness exports
  ensureUniquePriorities,
  getNextAvailablePriority,

  // Advanced priority management exports
  recalculatePriorities,
  getPriorityStatistics,
  getDependencyAnalysis,

  // Advanced algorithm configuration exports
  configureTimeDecay,
  configureEffortWeighting,
  getAdvancedAlgorithmConfig,

  // File watcher exports
  initializeFileWatcher,
  stopFileWatcher,
  configureFileWatcher,
  getFileWatcherStatus,
  forceSyncTaskFiles,

  // Priority templates exports
  getPriorityTemplates,
  calculatePriorityFromTemplate,
  suggestPriorityTemplate,
  addTaskWithTemplate,
  addCustomPriorityTemplate};
