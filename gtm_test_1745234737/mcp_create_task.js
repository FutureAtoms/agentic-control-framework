const { spawn } = require('child_process');

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
    console.log('Initializing MCP server...');
    const initResult = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2.0.0' }
    });
    console.log('Initialization successful');
    
    // Step 2: Add a task using tools/call
    console.log('Creating a new task...');
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
    console.log('Task creation result:', JSON.parse(addTaskResult.result.content[0].text));
    
    // Step 3: List tasks
    console.log('Listing tasks...');
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
    console.log(`Found ${tasks.length} tasks`);
    
    // Step 4: Add a subtask
    console.log('Adding a subtask...');
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
    console.log('Subtask creation result:', JSON.parse(addSubtaskResult.result.content[0].text));
    
    console.log('All MCP tests completed successfully!');
  } catch (error) {
    console.error('Error during MCP testing:', error);
  } finally {
    // Clean up
    mcp.kill();
  }
}

// Run the tests
runTests();
