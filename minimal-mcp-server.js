#!/usr/bin/env node

// Minimal MCP server for testing Cursor connectivity
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Basic request counter for generating unique IDs in our responses
let requestCounter = 1;

// Function to send JSON-RPC response
function sendResponse(id, result) {
  const response = {
    jsonrpc: '2.0',
    id: id || 0,  // Ensure id is never undefined, default to 0
    result: result
  };
  console.log(JSON.stringify(response));
}

// Function to send JSON-RPC error
function sendError(id, code, message, data = {}) {
  const response = {
    jsonrpc: '2.0',
    id: id || 0,  // Ensure id is never undefined, default to 0
    error: {
      code: code,
      message: message,
      data: data
    }
  };
  console.log(JSON.stringify(response));
}

// Handle incoming lines from stdin (JSON-RPC requests)
rl.on('line', (line) => {
  try {
    // Log to stderr - stdout is reserved for JSON-RPC responses
    console.error(`[DEBUG] Received request: ${line}`);
    
    // Parse the request
    const request = JSON.parse(line);
    const { id, method, params } = request;
    
    console.error(`[DEBUG] Parsed request - Method: ${method}, ID: ${id}`);
    
    // Handle different method types
    switch (method) {
      case 'initialize':
        // Respond to initialize with minimal capabilities
        console.error('[DEBUG] Handling initialize request');
        sendResponse(id, {
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'minimal-mcp-server',
            version: '0.1.0'
          },
          protocolVersion: params?.protocolVersion || '2.0.0'
        });
        break;
        
      case 'tools/list':
        // Respond with a single, simple tool
        console.error('[DEBUG] Handling tools/list request');
        sendResponse(id, {
          tools: [
            {
              name: 'hello',
              description: 'A simple hello world tool',
              inputSchema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name to greet'
                  }
                }
              }
            }
          ]
        });
        break;
        
      case 'tools/call':
        // Handle tools/call which is an alias for tools/run with different param structure
        console.error('[DEBUG] Handling tools/call request');
        console.error(`[DEBUG] tools/call params: ${JSON.stringify(params)}`);
        
        // Map from tools/call format to tools/run format
        // tools/call: {name: "hello", arguments: {name: "User"}}
        // tools/run:  {tool: "hello", args: {name: "User"}}
        if (params?.name === 'hello') {
          const name = params?.arguments?.name || 'World';
          sendResponse(id, {
            content: [
              {
                type: 'text',
                text: `Hello, ${name}!`
              }
            ]
          });
        } else {
          sendError(id, -32601, `Unknown tool: ${params?.name}`);
        }
        break;
        
      case 'tools/run':
        // Handle running our simple tool
        console.error('[DEBUG] Handling tools/run request');
        if (params?.tool === 'hello') {
          const name = params?.args?.name || 'World';
          sendResponse(id, {
            content: [
              {
                type: 'text',
                text: `Hello, ${name}!`
              }
            ]
          });
        } else {
          sendError(id, -32601, `Unknown tool: ${params?.tool}`);
        }
        break;
        
      case 'notifications/initialized':
        console.error('[DEBUG] Handling notifications/initialized');
        // No response needed for notifications
        break;
        
      default:
        // Handle unknown methods
        console.error(`[DEBUG] Unknown method: ${method}`);
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    // Handle parsing errors or other exceptions
    console.error(`[ERROR] Error processing request: ${error.message}`);
    sendError(requestCounter++, -32700, 'Parse error', { message: error.message });
  }
});

// Indicate the server is ready on stderr (doesn't affect stdout for JSON-RPC)
console.error('Minimal MCP Server listening...'); 