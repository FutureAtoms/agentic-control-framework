#!/usr/bin/env node

/**
 * Test script for filesystem operations in the MCP server
 * This script sends JSON-RPC requests to the MCP server to test filesystem operations
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Create a temp directory for testing
const tempDir = path.join(process.cwd(), 'test_temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a test file
const testFilePath = path.join(tempDir, 'test_file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for filesystem operations');

// Start the MCP server
const server = spawn('node', ['src/mcp_server.js', '--workspaceRoot', process.cwd()], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Listen for server output
server.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString().trim());
    console.log('Received response:', JSON.stringify(response, null, 2));
  } catch (error) {
    // Not a JSON response, probably startup message
    console.log('Server output:', data.toString());
  }
});

// Helper function to send a request to the server
function sendRequest(id, method, params) {
  return new Promise((resolve) => {
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };
    
    console.log(`\nSending request: ${method}`);
    console.log(JSON.stringify(params, null, 2));
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    // Listen for response
    const responseHandler = (data) => {
      try {
        const response = JSON.parse(data.toString().trim());
        if (response.id === id) {
          server.stdout.removeListener('data', responseHandler);
          resolve(response);
        }
      } catch (error) {
        // Not a JSON response or not our response
      }
    };
    
    server.stdout.on('data', responseHandler);
  });
}

// Run the tests
async function runTests() {
  try {
    // Initialize the server
    await sendRequest(1, 'initialize', {});
    
    // Get list of tools
    await sendRequest(2, 'tools/list', {});
    
    // Test read_file
    const readResponse = await sendRequest(3, 'tools/call', {
      name: 'read_file',
      arguments: {
        path: testFilePath
      }
    });
    console.log('Read file result:', readResponse.result?.content?.[0]?.text);
    
    // Test write_file
    const writeResponse = await sendRequest(4, 'tools/call', {
      name: 'write_file',
      arguments: {
        path: path.join(tempDir, 'new_file.txt'),
        content: 'This is a new file created by the filesystem tools'
      }
    });
    console.log('Write file result:', writeResponse.result?.content?.[0]?.text);
    
    // Test list_directory
    const listResponse = await sendRequest(5, 'tools/call', {
      name: 'list_directory',
      arguments: {
        path: tempDir
      }
    });
    console.log('List directory result:', listResponse.result?.content?.[0]?.text);
    
    // Test get_file_info
    const infoResponse = await sendRequest(6, 'tools/call', {
      name: 'get_file_info',
      arguments: {
        path: testFilePath
      }
    });
    console.log('Get file info result:', infoResponse.result?.content?.[0]?.text);
    
    // Test search_files
    const searchResponse = await sendRequest(7, 'tools/call', {
      name: 'search_files',
      arguments: {
        path: process.cwd(),
        pattern: '*.json'
      }
    });
    console.log('Search files result:', searchResponse.result?.content?.[0]?.text);
    
    // Test create_directory
    const createDirResponse = await sendRequest(8, 'tools/call', {
      name: 'create_directory',
      arguments: {
        path: path.join(tempDir, 'new_directory')
      }
    });
    console.log('Create directory result:', createDirResponse.result?.content?.[0]?.text);
    
    // Test copy_file
    const copyResponse = await sendRequest(9, 'tools/call', {
      name: 'copy_file',
      arguments: {
        source: testFilePath,
        destination: path.join(tempDir, 'new_directory', 'copied_file.txt')
      }
    });
    console.log('Copy file result:', copyResponse.result?.content?.[0]?.text);
    
    // Test tree
    const treeResponse = await sendRequest(10, 'tools/call', {
      name: 'tree',
      arguments: {
        path: tempDir,
        depth: 2
      }
    });
    console.log('Tree result:', treeResponse.result?.content?.[0]?.text);
    
    // Test list_allowed_directories
    const allowedDirsResponse = await sendRequest(11, 'tools/call', {
      name: 'list_allowed_directories',
      arguments: {
        random_string: 'dummy'
      }
    });
    console.log('List allowed directories result:', allowedDirsResponse.result?.content?.[0]?.text);
    
    // Test move_file
    const moveResponse = await sendRequest(12, 'tools/call', {
      name: 'move_file',
      arguments: {
        source: path.join(tempDir, 'new_file.txt'),
        destination: path.join(tempDir, 'new_directory', 'moved_file.txt')
      }
    });
    console.log('Move file result:', moveResponse.result?.content?.[0]?.text);
    
    // Test delete_file
    const deleteResponse = await sendRequest(13, 'tools/call', {
      name: 'delete_file',
      arguments: {
        path: path.join(tempDir, 'new_directory', 'copied_file.txt')
      }
    });
    console.log('Delete file result:', deleteResponse.result?.content?.[0]?.text);
    
    console.log('\nAll tests completed');
    
    // Clean up
    server.kill();
    
    // Optionally clean up test files
    // fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log('Test files remain in:', tempDir);
  } catch (error) {
    console.error('Error running tests:', error);
    server.kill();
  }
}

// Run the tests
runTests(); 