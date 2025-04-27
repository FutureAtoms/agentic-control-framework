// Test script for expandTask function

const core = require('../../src/core');
const logger = require('../../src/logger');

// Define the workspace root and the task ID to expand
const workspaceRoot = process.cwd();
const taskId = 1; // Replace with an actual task ID from your tasks.json

// Test the expandTask function
async function testExpandTask() {
  try {
    logger.info(`Testing expandTask function with task ID ${taskId}`);
    
    // Override the callGeminiApi function to return a mock response
    // This is a simple stub to test our function with different response types
    const originalCallGeminiApi = core.callGeminiApi;
    
    // Test with array response
    core.callGeminiApi = async () => {
      return ['Subtask 1', 'Subtask 2', 'Subtask 3'];
    };
    
    logger.info("Testing with array response...");
    const arrayResult = await core.expandTask(workspaceRoot, taskId);
    logger.info(`Array response result: ${JSON.stringify(arrayResult, null, 2)}`);
    
    // Test with string response
    core.callGeminiApi = async () => {
      return "Subtask 1\nSubtask 2\nSubtask 3";
    };
    
    logger.info("Testing with string response...");
    const stringResult = await core.expandTask(workspaceRoot, taskId);
    logger.info(`String response result: ${JSON.stringify(stringResult, null, 2)}`);
    
    // Test with JSON string response
    core.callGeminiApi = async () => {
      return JSON.stringify(['Subtask 1', 'Subtask 2', 'Subtask 3']);
    };
    
    logger.info("Testing with JSON string response...");
    const jsonStringResult = await core.expandTask(workspaceRoot, taskId);
    logger.info(`JSON string response result: ${JSON.stringify(jsonStringResult, null, 2)}`);
    
    // Test with non-string, non-array response
    core.callGeminiApi = async () => {
      return { subtasks: ['Subtask 1', 'Subtask 2', 'Subtask 3'] };
    };
    
    logger.info("Testing with object response...");
    const objectResult = await core.expandTask(workspaceRoot, taskId);
    logger.info(`Object response result: ${JSON.stringify(objectResult, null, 2)}`);
    
    // Restore the original function
    core.callGeminiApi = originalCallGeminiApi;
    
    logger.info("All tests completed.");
  } catch (error) {
    logger.error(`Error in test: ${error.message}`);
  }
}

// Run the test
testExpandTask(); 