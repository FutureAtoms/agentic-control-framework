const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const tableRenderer = require('./tableRenderer');
const core = require('./core');

/**
 * File watcher for tasks.json to automatically update task table and files
 */
class TaskFileWatcher {
  constructor(workspaceRoot, options = {}) {
    this.workspaceRoot = workspaceRoot;
    this.tasksFilePath = path.resolve(workspaceRoot, '.acf', 'tasks.json');
    this.watcher = null;
    this.debounceTimer = null;
    this.debounceDelay = options.debounceDelay || 500; // 500ms debounce
    this.isWatching = false;
    this.lastModified = null;

    // Enhanced features
    this.changeQueue = [];
    this.isProcessing = false;
    this.maxQueueSize = options.maxQueueSize || 10;
    this.enableTaskFiles = options.enableTaskFiles !== false; // Default true
    this.enableTableSync = options.enableTableSync !== false; // Default true
    this.enablePriorityRecalc = options.enablePriorityRecalc || false; // Default false
    this.changeHistory = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second

    // Statistics
    this.stats = {
      changesDetected: 0,
      changesProcessed: 0,
      errors: 0,
      lastProcessed: null,
      averageProcessingTime: 0
    };
  }

  /**
   * Start watching the tasks.json file for changes
   */
  start() {
    if (this.isWatching) {
      logger.debug('File watcher is already running');
      return;
    }

    if (!fs.existsSync(this.tasksFilePath)) {
      logger.debug(`Tasks file not found: ${this.tasksFilePath}. Watcher will start when file is created.`);
      return;
    }

    try {
      // Get initial modification time
      const stats = fs.statSync(this.tasksFilePath);
      this.lastModified = stats.mtime.getTime();

      this.watcher = fs.watch(this.tasksFilePath, (eventType, filename) => {
        if (eventType === 'change') {
          this.handleFileChange();
        }
      });

      this.isWatching = true;
      logger.debug(`Started watching tasks.json at: ${this.tasksFilePath}`);
    } catch (error) {
      logger.error(`Failed to start file watcher: ${error.message}`);
    }
  }

  /**
   * Stop watching the tasks.json file
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isWatching = false;
    logger.debug('Stopped watching tasks.json');
  }

  /**
   * Handle file change events with advanced debouncing and queuing
   */
  handleFileChange() {
    this.stats.changesDetected++;

    // Add change to queue
    const changeEvent = {
      timestamp: Date.now(),
      id: `change_${this.stats.changesDetected}`
    };

    this.addToQueue(changeEvent);

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer with adaptive delay
    const adaptiveDelay = this.calculateAdaptiveDelay();
    this.debounceTimer = setTimeout(() => {
      this.processQueue();
    }, adaptiveDelay);
  }

  /**
   * Add change event to processing queue
   */
  addToQueue(changeEvent) {
    // Prevent queue overflow
    if (this.changeQueue.length >= this.maxQueueSize) {
      logger.warn(`Change queue full (${this.maxQueueSize}), dropping oldest event`);
      this.changeQueue.shift();
    }

    this.changeQueue.push(changeEvent);
    logger.debug(`Added change event to queue: ${changeEvent.id} (queue size: ${this.changeQueue.length})`);
  }

  /**
   * Calculate adaptive debounce delay based on recent activity
   */
  calculateAdaptiveDelay() {
    const recentChanges = this.changeHistory.filter(
      change => Date.now() - change.timestamp < 10000 // Last 10 seconds
    ).length;

    // Increase delay if there's high activity
    if (recentChanges > 5) {
      return this.debounceDelay * 2; // Double delay for high activity
    } else if (recentChanges > 2) {
      return this.debounceDelay * 1.5; // 1.5x delay for moderate activity
    }

    return this.debounceDelay; // Normal delay
  }

  /**
   * Process the entire change queue
   */
  async processQueue() {
    if (this.isProcessing || this.changeQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      logger.debug(`Processing ${this.changeQueue.length} queued changes`);

      // Process all queued changes as a batch
      const changes = [...this.changeQueue];
      this.changeQueue = [];

      await this.processFileChangeWithRetry(changes);

      // Update statistics
      this.stats.changesProcessed += changes.length;
      this.stats.lastProcessed = Date.now();

      const processingTime = Date.now() - startTime;
      this.updateAverageProcessingTime(processingTime);

      logger.debug(`Processed ${changes.length} changes in ${processingTime}ms`);

    } catch (error) {
      this.stats.errors++;
      logger.error(`Error processing change queue: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process file changes with retry logic and comprehensive updates
   */
  async processFileChangeWithRetry(changes, attempt = 1) {
    try {
      // Check if file still exists
      if (!fs.existsSync(this.tasksFilePath)) {
        logger.debug('Tasks file was deleted, stopping watcher');
        this.stop();
        return;
      }

      // Check if file was actually modified (avoid duplicate events)
      const stats = fs.statSync(this.tasksFilePath);
      const currentModified = stats.mtime.getTime();

      if (this.lastModified && currentModified <= this.lastModified) {
        logger.debug('No actual file modification detected, skipping processing');
        return;
      }

      this.lastModified = currentModified;

      // Read and validate the tasks file
      const tasksData = JSON.parse(fs.readFileSync(this.tasksFilePath, 'utf8'));

      // Record change in history
      const changeRecord = {
        timestamp: Date.now(),
        changes: changes.length,
        fileSize: stats.size,
        taskCount: tasksData.tasks ? tasksData.tasks.length : 0
      };

      this.addToHistory(changeRecord);

      // Perform comprehensive synchronization
      await this.performComprehensiveSync(tasksData);

      logger.info(`Successfully processed ${changes.length} file changes`);

    } catch (error) {
      logger.error(`Error processing tasks.json change (attempt ${attempt}): ${error.message}`);

      // Retry logic
      if (attempt < this.retryAttempts) {
        logger.info(`Retrying in ${this.retryDelay}ms... (attempt ${attempt + 1}/${this.retryAttempts})`);
        setTimeout(() => {
          this.processFileChangeWithRetry(changes, attempt + 1);
        }, this.retryDelay);
      } else {
        logger.error(`Failed to process file changes after ${this.retryAttempts} attempts`);
        this.stats.errors++;
      }
    }
  }

  /**
   * Perform comprehensive synchronization of all task-related files
   */
  async performComprehensiveSync(tasksData) {
    const syncResults = {
      taskTable: false,
      taskFiles: false,
      priorityRecalc: false
    };

    try {
      // 1. Update task table (if enabled)
      if (this.enableTableSync) {
        syncResults.taskTable = tableRenderer.writeTaskTable(tasksData, this.workspaceRoot);
        if (syncResults.taskTable) {
          logger.debug('✅ Task table synchronized');
        } else {
          logger.warn('❌ Failed to synchronize task table');
        }
      }

      // 2. Generate individual task files (if enabled)
      if (this.enableTaskFiles) {
        try {
          const result = core.generateTaskFiles(this.workspaceRoot);
          syncResults.taskFiles = result.success;
          if (syncResults.taskFiles) {
            logger.debug('✅ Individual task files synchronized');
          } else {
            logger.warn('❌ Failed to synchronize task files');
          }
        } catch (error) {
          logger.warn(`Failed to generate task files: ${error.message}`);
        }
      }

      // 3. Recalculate priorities (if enabled)
      if (this.enablePriorityRecalc) {
        try {
          const result = core.recalculatePriorities(this.workspaceRoot, {
            applyDependencyBoosts: true,
            optimizeDistribution: true
          });
          syncResults.priorityRecalc = result.success;
          if (syncResults.priorityRecalc) {
            logger.debug('✅ Priorities recalculated');
          } else {
            logger.warn('❌ Failed to recalculate priorities');
          }
        } catch (error) {
          logger.warn(`Failed to recalculate priorities: ${error.message}`);
        }
      }

      // Log sync summary
      const successCount = Object.values(syncResults).filter(Boolean).length;
      const totalCount = Object.values(syncResults).filter(v => v !== false).length;
      logger.debug(`Sync completed: ${successCount}/${totalCount} operations successful`);

    } catch (error) {
      logger.error(`Error during comprehensive sync: ${error.message}`);
      throw error;
    }

    return syncResults;
  }

  /**
   * Add change record to history
   */
  addToHistory(changeRecord) {
    // Prevent history overflow
    if (this.changeHistory.length >= this.maxHistorySize) {
      this.changeHistory.shift();
    }

    this.changeHistory.push(changeRecord);
  }

  /**
   * Update average processing time
   */
  updateAverageProcessingTime(newTime) {
    if (this.stats.averageProcessingTime === 0) {
      this.stats.averageProcessingTime = newTime;
    } else {
      // Exponential moving average
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime * 0.8) + (newTime * 0.2);
    }
  }

  /**
   * Force sync all task-related files with current tasks.json
   */
  async forceSync() {
    if (!fs.existsSync(this.tasksFilePath)) {
      throw new Error('Tasks file does not exist');
    }

    try {
      const tasksData = JSON.parse(fs.readFileSync(this.tasksFilePath, 'utf8'));
      await this.performComprehensiveSync(tasksData);
      logger.info('Force sync completed successfully');
    } catch (error) {
      logger.error(`Force sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the watcher is currently active
   */
  isActive() {
    return this.isWatching;
  }

  /**
   * Get watcher statistics
   */
  getStats() {
    return {
      ...this.stats,
      queueSize: this.changeQueue.length,
      historySize: this.changeHistory.length,
      isProcessing: this.isProcessing,
      isWatching: this.isWatching,
      uptime: this.isWatching ? Date.now() - (this.stats.lastProcessed || Date.now()) : 0
    };
  }

  /**
   * Get recent change history
   */
  getChangeHistory(limit = 10) {
    return this.changeHistory.slice(-limit);
  }

  /**
   * Configure watcher options
   */
  configure(options) {
    if (options.debounceDelay !== undefined) {
      this.debounceDelay = options.debounceDelay;
    }
    if (options.maxQueueSize !== undefined) {
      this.maxQueueSize = options.maxQueueSize;
    }
    if (options.enableTaskFiles !== undefined) {
      this.enableTaskFiles = options.enableTaskFiles;
    }
    if (options.enableTableSync !== undefined) {
      this.enableTableSync = options.enableTableSync;
    }
    if (options.enablePriorityRecalc !== undefined) {
      this.enablePriorityRecalc = options.enablePriorityRecalc;
    }
    if (options.retryAttempts !== undefined) {
      this.retryAttempts = options.retryAttempts;
    }
    if (options.retryDelay !== undefined) {
      this.retryDelay = options.retryDelay;
    }

    logger.info('File watcher configuration updated');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      changesDetected: 0,
      changesProcessed: 0,
      errors: 0,
      lastProcessed: null,
      averageProcessingTime: 0
    };
    this.changeHistory = [];
    logger.info('File watcher statistics reset');
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      debounceDelay: this.debounceDelay,
      maxQueueSize: this.maxQueueSize,
      enableTaskFiles: this.enableTaskFiles,
      enableTableSync: this.enableTableSync,
      enablePriorityRecalc: this.enablePriorityRecalc,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      maxHistorySize: this.maxHistorySize
    };
  }
}

/**
 * Global watcher instance
 */
let globalWatcher = null;

/**
 * Initialize the file watcher for a workspace
 * @param {string} workspaceRoot - The workspace root path
 * @param {Object} options - Watcher configuration options
 * @returns {TaskFileWatcher} The watcher instance
 */
function initializeWatcher(workspaceRoot, options = {}) {
  if (globalWatcher) {
    globalWatcher.stop();
  }

  globalWatcher = new TaskFileWatcher(workspaceRoot, options);
  globalWatcher.start();
  return globalWatcher;
}

/**
 * Configure the global watcher
 * @param {Object} options - Configuration options
 */
function configureWatcher(options) {
  if (globalWatcher) {
    globalWatcher.configure(options);
  } else {
    logger.warn('No active watcher to configure');
  }
}

/**
 * Get watcher statistics
 * @returns {Object|null} Watcher statistics or null if no watcher
 */
function getWatcherStats() {
  return globalWatcher ? globalWatcher.getStats() : null;
}

/**
 * Force sync all task files
 * @returns {Promise} Promise that resolves when sync is complete
 */
async function forceSyncAll() {
  if (globalWatcher) {
    return await globalWatcher.forceSync();
  } else {
    throw new Error('No active watcher for force sync');
  }
}

/**
 * Get the current global watcher instance
 * @returns {TaskFileWatcher|null} The current watcher or null
 */
function getWatcher() {
  return globalWatcher;
}

/**
 * Stop the global watcher
 */
function stopWatcher() {
  if (globalWatcher) {
    globalWatcher.stop();
    globalWatcher = null;
  }
}

module.exports = {
  TaskFileWatcher,
  initializeWatcher,
  getWatcher,
  stopWatcher,
  configureWatcher,
  getWatcherStats,
  forceSyncAll
};
