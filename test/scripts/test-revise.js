#!/usr/bin/env node

// Import core module
const core = require('./src/core');
const logger = require('./src/logger'); // Import logger module

// Define a task ID to start revision from (assuming tasks.json exists with tasks)
const fromTaskId = 26; // Replace with an actual task ID from your tasks.json

// Define a prompt for revision
const prompt = "Focus more on testing and quality assurance.";

// Get the workspace root
const workspaceRoot = process.cwd();

// Call the reviseTasks function and handle the result
core.reviseTasks(workspaceRoot, { fromTaskId, prompt })
  .then(result => {
    logger.info('Test result:', result);
    logger.output('Success! Tasks revised based on prompt.');
  })
  .catch(error => {
    logger.error('Test failed with error:', error.message);
  }); 