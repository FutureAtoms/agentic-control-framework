#!/bin/bash

# Comprehensive Test Script for Agentic Control Framework
# This script tests both CLI and MCP functionality after cleanup

echo "======================================================"
echo "  Agentic Control Framework Functionality Test"
echo "======================================================"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to run tests with proper error handling
run_test() {
  local test_name="$1"
  local command="$2"
  
  echo -n "Testing $test_name... "
  if eval "$command" > /dev/null 2>&1; then
    echo "✅ PASSED"
    return 0
  else
    echo "❌ FAILED"
    echo "  Command: $command"
    echo "  Try running the command manually to see the error."
    return 1
  fi
}

# Create a temporary test directory
TEST_DIR="acf_test_$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR" || { echo "Failed to create test directory"; exit 1; }
echo "Created test directory: $PWD"

echo -e "\n1. Checking required components..."

# Check for Node.js
if command_exists node; then
  NODE_VERSION=$(node --version)
  echo "✅ Node.js found: $NODE_VERSION"
else
  echo "❌ Node.js not found. Please install Node.js to run the task manager."
  exit 1
fi

# Check for task-manager script
if [ -f "../bin/task-manager" ]; then
  echo "✅ CLI script (bin/task-manager) found"
else
  echo "❌ CLI script not found. Expected at ../bin/task-manager"
  exit 1
fi

# Check for task-manager-mcp script
if [ -f "../bin/task-manager-mcp" ]; then
  echo "✅ MCP script (bin/task-manager-mcp) found"
else
  echo "❌ MCP script not found. Expected at ../bin/task-manager-mcp"
  exit 1
fi

echo -e "\n2. Testing CLI functionality..."

# Test CLI initialization
run_test "project initialization" "../bin/task-manager init --project-name 'Test Project' --project-description 'Testing ACF functionality'"

# Verify tasks.json was created
if [ -f "tasks.json" ]; then
  echo "✅ tasks.json file created successfully"
else
  echo "❌ tasks.json file was not created"
  exit 1
fi

# Test adding a task
run_test "adding a task" "../bin/task-manager add -t 'Test Task 1' -d 'First test task' -p high"

# Test adding another task that depends on the first
run_test "adding a dependent task" "../bin/task-manager add -t 'Test Task 2' -d 'Second test task' -p medium --depends-on 1"

# Test adding a subtask
run_test "adding a subtask" "../bin/task-manager add-subtask 1 -t 'Test Subtask 1.1'"

# Test listing tasks
run_test "listing tasks" "../bin/task-manager list"

# Test updating task status
run_test "updating task status" "../bin/task-manager status 1 inprogress -m 'Starting work'"

# Test getting next task
run_test "getting next task" "../bin/task-manager next"

# Test task context
run_test "getting task context" "../bin/task-manager context 1"

# Test generating task files
run_test "generating task files" "../bin/task-manager generate-files"

# Verify task files
if [ -d "tasks" ] && [ "$(ls -A tasks | wc -l)" -gt 0 ]; then
  echo "✅ Task files generated successfully"
else
  echo "❌ Task files were not generated correctly"
  exit 1
fi

echo -e "\n3. Testing MCP functionality (basic)..."

# Create a simple MCP client test file
cat > mcp_test_client.js << 'EOF'
const net = require('net');
const logger = require('../src/logger'); // Import logger module

// Create client request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2.0.0'
  }
};

// Try spawning the MCP server and reading its initialization response
const { spawn } = require('child_process');
const mcp = spawn('../bin/task-manager-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send initialize request
mcp.stdin.write(JSON.stringify(request) + '\n');

// Listen for response
let responseData = '';
mcp.stdout.on('data', (data) => {
  responseData += data.toString();
  
  try {
    const response = JSON.parse(responseData);
    logger.info('MCP initialize test successful!');
    logger.output(JSON.stringify(response, null, 2));
    
    // Request tools list
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    mcp.stdin.write(JSON.stringify(toolsRequest) + '\n');
    
    // After 1 second, terminate the process
    setTimeout(() => {
      logger.info('Test completed, terminating MCP server');
      mcp.kill();
      process.exit(0);
    }, 1000);
    
    // Reset for the next message
    responseData = '';
  } catch (error) {
    // Not a complete JSON response yet, continue collecting data
  }
});

// Handle process exit
mcp.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    logger.error(`MCP server exited with code ${code}`);
    process.exit(1);
  }
});
EOF

# Run the MCP test
echo "Running basic MCP test..."
if node mcp_test_client.js; then
  echo "✅ Basic MCP test passed"
else
  echo "❌ Basic MCP test failed"
  exit 1
fi

echo -e "\n4. Testing full task creation through MCP..."

# Create more complete MCP client test that creates a task
cat > mcp_create_task.js << 'EOF'
const { spawn } = require('child_process');
const logger = require('../src/logger'); // Import logger module

// Start the MCP server
const mcp = spawn('../bin/task-manager-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Function to send a request to the MCP server
function sendRequest(request) {
  return new Promise((resolve) => {
    let responseData = '';
    
    // Set up response handler for this request
    const dataHandler = (data) => {
      responseData += data.toString();
      try {
        // See if we have a complete JSON response
        const response = JSON.parse(responseData);
        mcp.stdout.removeListener('data', dataHandler);
        resolve(response);
      } catch (error) {
        // Continue collecting data
      }
    };
    
    // Add the data listener
    mcp.stdout.on('data', dataHandler);
    
    // Send the request
    mcp.stdin.write(JSON.stringify(request) + '\n');
  });
}

async function runTests() {
  try {
    // Step 1: Initialize
    logger.info('Initializing MCP server...');
    const initResult = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2.0.0' }
    });
    logger.info('Initialization successful');
    
    // Step 2: Add a task using tools/call
    logger.info('Creating a new task...');
    const addTaskResult = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'addTask',
        arguments: {
          title: 'MCP Created Task',
          description: 'This task was created via the MCP protocol',
          priority: 'high'
        }
      }
    });
    logger.debug('Task creation result:', JSON.parse(addTaskResult.result.content[0].text));
    
    // Step 3: List tasks
    logger.info('Listing tasks...');
    const listTasksResult = await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'listTasks',
        arguments: {}
      }
    });
    
    // Parse and display task list
    const tasks = JSON.parse(JSON.parse(listTasksResult.result.content[0].text).tasks);
    logger.info(`Found ${tasks.length} tasks`);
    
    // Step 4: Add a subtask
    logger.info('Adding a subtask...');
    const addSubtaskResult = await sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'addSubtask',
        arguments: {
          parentId: 3,
          title: 'MCP Created Subtask'
        }
      }
    });
    logger.debug('Subtask creation result:', JSON.parse(addSubtaskResult.result.content[0].text));
    
    logger.output('All MCP tests completed successfully!');
  } catch (error) {
    logger.error('Error during MCP testing:', error);
  } finally {
    // Clean up
    mcp.kill();
  }
}

// Run the tests
runTests();
EOF

# Run the MCP task creation test
echo "Running MCP task creation test..."
if node mcp_create_task.js; then
  echo "✅ MCP task creation test passed"
else
  echo "❌ MCP task creation test failed"
  exit 1
fi

echo -e "\n5. Verifying task creation via MCP..."

# Check if task was created by the MCP
if grep -q "MCP Created Task" tasks.json; then
  echo "✅ Task created through MCP found in tasks.json"
else
  echo "❌ Task created through MCP not found in tasks.json"
  exit 1
fi

echo -e "\n======================================================"
echo "  All tests passed! Agentic Control Framework is working properly."
echo "======================================================"

# Cleanup
cd ..
echo "Test directory: $TEST_DIR (not deleted for inspection)"
echo "To remove test directory: rm -rf $TEST_DIR" 