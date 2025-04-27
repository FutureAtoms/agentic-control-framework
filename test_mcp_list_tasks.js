#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

// Start the MCP server as a child process
const server = spawn('node', ['./bin/task-manager-mcp', '--workspaceRoot', './test/testdata'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Create interface to read/write to the server
const rl = readline.createInterface({
  input: server.stdout,
  output: process.stdout
});

// Function to send a request to the MCP server
function sendRequest(id, method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  
  console.log(`\n----- SENDING REQUEST ${id} -----`);
  console.log(JSON.stringify(request, null, 2));
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Test with different format parameters
const testRequests = [
  // Initialize
  {
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2.0.0'
    }
  },
  // Default format (no format parameter)
  {
    id: 2,
    method: 'tools/run',
    params: {
      tool: 'listTasks',
      args: {}
    }
  },
  // Table format
  {
    id: 3,
    method: 'tools/run',
    params: {
      tool: 'listTasks',
      args: {
        format: 'table'
      }
    }
  },
  // Human format
  {
    id: 4,
    method: 'tools/run',
    params: {
      tool: 'listTasks',
      args: {
        format: 'human'
      }
    }
  }
];

// Current request index
let currentRequestIndex = 0;

// Read server responses
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    console.log(`\n----- RECEIVED RESPONSE ${response.id} -----`);
    console.log(JSON.stringify(response, null, 2));
    
    // Send the next request after receiving a response
    currentRequestIndex++;
    if (currentRequestIndex < testRequests.length) {
      const nextRequest = testRequests[currentRequestIndex];
      setTimeout(() => {
        sendRequest(nextRequest.id, nextRequest.method, nextRequest.params);
      }, 500);
    } else {
      console.log("\n----- ALL TESTS COMPLETED -----");
      // Close the server and exit after all requests are completed
      setTimeout(() => {
        server.kill();
        process.exit(0);
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to parse response:', error.message);
    console.error('Raw response:', line);
  }
});

// Send the first request to start the sequence
setTimeout(() => {
  sendRequest(
    testRequests[0].id,
    testRequests[0].method,
    testRequests[0].params
  );
}, 1000); 