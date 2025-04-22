const net = require('net');

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
    console.log('MCP initialize test successful!');
    console.log(JSON.stringify(response, null, 2));
    
    // Request tools list
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };
    mcp.stdin.write(JSON.stringify(toolsRequest) + '\n');
    
    // After 1 second, terminate the process
    setTimeout(() => {
      console.log('Test completed, terminating MCP server');
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
    console.error(`MCP server exited with code ${code}`);
    process.exit(1);
  }
});
