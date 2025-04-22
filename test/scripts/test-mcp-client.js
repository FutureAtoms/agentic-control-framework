#!/usr/bin/env node

// Simple test client for MCP server
const { spawn } = require('child_process');
const readline = require('readline');
const logger = require('./src/logger'); // Import logger module

// Start the MCP server as a child process
const server = spawn('node', ['./bin/task-manager-mcp.js', '--workspaceRoot', process.cwd()], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Create interface to read/write to the server
const rl = readline.createInterface({
  input: server.stdout,
  output: server.stdin
});

// Define some test requests
const testRequests = [
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2.0.0'
    }
  },
  {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  },
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/run',
    params: {
      tool: 'listTasks',
      args: {}
    }
  },
  {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/run',
    params: {
      tool: 'getNextTask',
      args: {
        random_string: "dummy"
      }
    }
  },
  {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/run',
    params: {
      tool: 'getContext',
      args: {
        id: "44"
      }
    }
  }
];

// Read server responses
rl.on('line', (line) => {
  try {
    const response = JSON.parse(line);
    logger.info('\n===== SERVER RESPONSE =====');
    logger.info(`Response ID: ${response.id}`);
    
    if (response.error) {
      logger.error('ERROR:', response.error);
    } else {
      logger.info('SUCCESS');
      // Truncate large responses for readability
      const resultStr = JSON.stringify(response.result, null, 2);
      logger.output('Result:', resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr);
    }
  } catch (error) {
    logger.error('Failed to parse response:', error.message);
    logger.debug('Raw response:', line);
  }
});

// Send each test request with a delay
let requestIndex = 0;
const sendNextRequest = () => {
  if (requestIndex < testRequests.length) {
    const request = testRequests[requestIndex];
    logger.info(`\n===== SENDING REQUEST ${requestIndex + 1} =====`);
    logger.debug(JSON.stringify(request, null, 2));
    
    server.stdin.write(JSON.stringify(request) + '\n');
    requestIndex++;
    
    setTimeout(sendNextRequest, 1000);
  } else {
    logger.info('\n===== ALL TESTS COMPLETE =====');
    // Give time for final response before exiting
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 2000);
  }
};

// Start sending requests after a brief delay to let the server initialize
setTimeout(sendNextRequest, 2000);

// Handle server exit
server.on('close', (code) => {
  logger.info(`Server process exited with code ${code}`);
});

// Handle errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  server.kill();
  process.exit(1);
}); 