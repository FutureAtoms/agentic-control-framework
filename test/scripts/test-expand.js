#!/usr/bin/env node

// Import core module
const core = require('./src/core');
const logger = require('./src/logger'); // Import logger module

// Define a task ID to expand (assuming tasks.json exists with a task with this ID)
const taskId = 26; // Replace with an actual task ID from your tasks.json

// Get the workspace root
const workspaceRoot = process.cwd();

// Call the expandTask function and handle the result
core.expandTask(workspaceRoot, taskId)
  .then(result => {
    logger.info('Test result:', result);
    logger.output('Success! Task expanded with subtasks.');
  })
  .catch(error => {
    logger.error('Test failed with error:', error.message);
  }); 