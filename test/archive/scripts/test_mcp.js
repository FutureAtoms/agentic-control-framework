#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Create test directory
const testDirName = `mcp_test_${Math.floor(Date.now() / 1000)}`;
const testDir = path.join(process.cwd(), testDirName);

console.log('===========================================');
console.log('Starting Task Manager MCP Testing');
console.log('===========================================');

// Create the test directory
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

console.log(`Test directory: ${testDir}`);

// Start the MCP server with the test directory as workspace
const server = spawn('node', ['./bin/task-manager-mcp', '--workspaceRoot', testDir], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Create a readline interface for communication
const rl = readline.createInterface({
  input: server.stdout,
  output: null
});

// Track test results
const results = {
  pass: 0,
  fail: 0,
  failedTests: []
};

// Function to log test results
function logTest(name, success, error = null) {
  if (success) {
    console.log(`✅ PASS: ${name}`);
    results.pass++;
  } else {
    console.log(`❌ FAIL: ${name}${error ? ` - ${error}` : ''}`);
    results.fail++;
    results.failedTests.push(name);
  }
}

// Function to send requests to the MCP server with cleaner error handling
function sendRequest(id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log(`\n----- SENDING REQUEST (ID: ${id}) -----`);
    console.log(JSON.stringify(request, null, 2));
    
    const responseHandler = (line) => {
      try {
        // Handle the response
        console.log(`\n----- RECEIVED RESPONSE RAW DATA -----`);
        console.log(line);
        
        // Safely parse JSON
        let response;
        try {
          response = JSON.parse(line);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nRaw response: ${line}`));
          return;
        }
        
        console.log(`\n----- PARSED RESPONSE (ID: ${response.id}) -----`);
        console.log(JSON.stringify(response, null, 2));
        
        // Check for errors
        if (response.error) {
          reject(new Error(`Server returned error: ${response.error.message}`));
          return;
        }
        
        // If we've got the right response ID, resolve
        if (response.id === id) {
          rl.removeListener('line', responseHandler);
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    // Listen for responses
    rl.on('line', responseHandler);
    
    // Send the request
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Set timeout for response
    setTimeout(() => {
      rl.removeListener('line', responseHandler);
      reject(new Error('Timeout waiting for response'));
    }, 5000);
  });
}

// Run all tests in sequence
async function runTests() {
  try {
    // Initialize
    console.log('\n--- Testing: Initialize ---');
    await sendRequest(1, 'initialize', { protocolVersion: '2.0.0' })
      .then(() => logTest('Initialize', true))
      .catch(err => logTest('Initialize', false, err.message));
    
    // Add initial project
    console.log('\n--- Testing: Init Project ---');
    await sendRequest(2, 'tools/run', {
      tool: 'initProject',
      args: {
        projectName: 'MCP Test Project',
        projectDescription: 'Testing the MCP interface'
      }
    })
      .then(() => logTest('Init Project', true))
      .catch(err => logTest('Init Project', false, err.message));
    
    // List tasks (default format)
    console.log('\n--- Testing: List Tasks (default format) ---');
    await sendRequest(3, 'tools/run', {
      tool: 'listTasks',
      args: {}
    })
      .then(() => logTest('List Tasks (default)', true))
      .catch(err => logTest('List Tasks (default)', false, err.message));
    
    // List tasks (table format)
    console.log('\n--- Testing: List Tasks (table format) ---');
    await sendRequest(4, 'tools/run', {
      tool: 'listTasks',
      args: {
        format: 'table'
      }
    })
      .then(() => logTest('List Tasks (table)', true))
      .catch(err => logTest('List Tasks (table)', false, err.message));
    
    // List tasks (human format)
    console.log('\n--- Testing: List Tasks (human format) ---');
    await sendRequest(5, 'tools/run', {
      tool: 'listTasks',
      args: {
        format: 'human'
      }
    })
      .then(() => logTest('List Tasks (human)', true))
      .catch(err => logTest('List Tasks (human)', false, err.message));
    
    // Add task
    console.log('\n--- Testing: Add Task ---');
    await sendRequest(6, 'tools/run', {
      tool: 'addTask',
      args: {
        title: 'Test Task via MCP',
        description: 'This task was added via MCP interface',
        priority: 'high'
      }
    })
      .then(() => logTest('Add Task', true))
      .catch(err => logTest('Add Task', false, err.message));
    
    // Add subtask
    console.log('\n--- Testing: Add Subtask ---');
    await sendRequest(7, 'tools/run', {
      tool: 'addSubtask',
      args: {
        parentId: 1,
        title: 'Test Subtask via MCP'
      }
    })
      .then(() => logTest('Add Subtask', true))
      .catch(err => logTest('Add Subtask', false, err.message));
    
    // Update task status
    console.log('\n--- Testing: Update Status ---');
    await sendRequest(8, 'tools/run', {
      tool: 'updateStatus',
      args: {
        id: '1.1',
        newStatus: 'inprogress',
        message: 'Started working on this subtask'
      }
    })
      .then(() => logTest('Update Status', true))
      .catch(err => logTest('Update Status', false, err.message));
    
    // Get next task
    console.log('\n--- Testing: Get Next Task ---');
    await sendRequest(9, 'tools/run', {
      tool: 'getNextTask',
      args: {}
    })
      .then(() => logTest('Get Next Task', true))
      .catch(err => logTest('Get Next Task', false, err.message));
    
    // Update task
    console.log('\n--- Testing: Update Task ---');
    await sendRequest(10, 'tools/run', {
      tool: 'updateTask',
      args: {
        id: '2',
        title: 'Updated Test Task',
        description: 'This task was updated via MCP interface',
        priority: 'medium'
      }
    })
      .then(() => logTest('Update Task', true))
      .catch(err => logTest('Update Task', false, err.message));
    
    // Get context
    console.log('\n--- Testing: Get Context ---');
    await sendRequest(11, 'tools/run', {
      tool: 'getContext',
      args: {
        id: '1'
      }
    })
      .then(() => logTest('Get Context', true))
      .catch(err => logTest('Get Context', false, err.message));
    
    // Generate task files
    console.log('\n--- Testing: Generate Task Files ---');
    await sendRequest(12, 'tools/run', {
      tool: 'generateTaskFiles',
      args: {}
    })
      .then(() => logTest('Generate Task Files', true))
      .catch(err => logTest('Generate Task Files', false, err.message));
    
    // Generate task table
    console.log('\n--- Testing: Generate Task Table ---');
    await sendRequest(13, 'tools/run', {
      tool: 'generateTaskTable',
      args: {}
    })
      .then(() => logTest('Generate Task Table', true))
      .catch(err => logTest('Generate Task Table', false, err.message));
    
    // Remove task
    console.log('\n--- Testing: Remove Task ---');
    await sendRequest(14, 'tools/run', {
      tool: 'removeTask',
      args: {
        id: '2'
      }
    })
      .then(() => logTest('Remove Task', true))
      .catch(err => logTest('Remove Task', false, err.message));
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Print test summary
    console.log('\n===========================================');
    console.log('MCP Testing Summary');
    console.log('===========================================');
    console.log(`Total tests: ${results.pass + results.fail}`);
    console.log(`Passed: ${results.pass}`);
    console.log(`Failed: ${results.fail}`);
    
    if (results.fail > 0) {
      console.log('\nFailed tests:');
      results.failedTests.forEach(test => console.log(`- ${test}`));
    } else {
      console.log('\nAll tests passed successfully! ✅');
    }
    
    console.log('\n--- Cleaning up ---');
    server.kill();
    console.log(`Test results remain in: ${testDir}`);
    
    process.exit(0);
  }
}

// Run the tests
console.log('Starting tests in 2 seconds...');
setTimeout(runTests, 2000); 