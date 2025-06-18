#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Utility to make HTTP-like requests to the MCP server via stdio
class MCPClient {
  constructor(serverProcess) {
    this.serverProcess = serverProcess;
    this.requestId = 1;
    this.responsePromises = new Map();
    
    // Set up response handling
    this.serverProcess.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id && this.responsePromises.has(response.id)) {
            const { resolve, reject } = this.responsePromises.get(response.id);
            if (response.error) {
              reject(response.error);
            } else {
              resolve(response.result);
            }
            this.responsePromises.delete(response.id);
          }
        } catch (err) {
          console.error('Error parsing response:', err);
        }
      }
    });
    
    // Handle errors
    this.serverProcess.stderr.on('data', (data) => {
      console.error(`[Server stderr] ${data.toString().trim()}`);
    });
    
    this.serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      // Reject all pending promises
      for (const [id, { reject }] of this.responsePromises.entries()) {
        reject(new Error(`Server process exited with code ${code}`));
        this.responsePromises.delete(id);
      }
    });
  }
  
  // Send a request to the server
  async request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };
      
      this.responsePromises.set(id, { resolve, reject });
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }
  
  // Convenience methods for common operations
  async listTools() {
    return this.request('tools/list');
  }
  
  async callTool(name, args) {
    return this.request('tools/call', { name, arguments: args });
  }
  
  // Close the connection
  close() {
    this.serverProcess.stdin.end();
  }
}

// Test runner
async function runTests() {
  console.log('Starting environment variable guardrails tests...');
  
  // Create a temp test directory
  const testDir = path.join(os.tmpdir(), 'acf-env-test-' + Date.now().toString());
  const secondDir = path.join(os.tmpdir(), 'acf-env-test-secondary-' + Date.now().toString());
  
  fs.mkdirSync(testDir, { recursive: true });
  fs.mkdirSync(secondDir, { recursive: true });
  
  console.log(`Created test directories: ${testDir} and ${secondDir}`);
  
  try {
    // Create test files
    fs.writeFileSync(path.join(testDir, 'test.txt'), 'Test content');
    console.log('Created test files');
    
    // Run tests in sequence
    await testNormalMode(testDir, secondDir);
    await testReadOnlyMode(testDir, secondDir);
    await testAllowedDirectories(testDir, secondDir);
    
    console.log('\n✅ All tests completed successfully');
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  } finally {
    // Clean up
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
      fs.rmSync(secondDir, { recursive: true, force: true });
      console.log('Cleaned up test directories');
    } catch (err) {
      console.error('Error cleaning up:', err);
    }
  }
}

// Test the server in normal mode
async function testNormalMode(testDir, secondDir) {
  console.log('\n=== Testing Normal Mode ===');
  
  // Start the server
  const serverProcess = spawn('node', ['src/mcp_server.js', '--workspaceRoot', testDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Ensure no environment variables from previous tests affect this one
      READONLY_MODE: 'false',
      ALLOWED_DIRS: ''
    }
  });
  
  const client = new MCPClient(serverProcess);
  
  try {
    // Verify tools are available
    const toolsResponse = await client.listTools();
    console.log('Tools available:', toolsResponse.tools.length);
    
    // Get filesystem status
    const statusResponse = await client.callTool('get_filesystem_status', { random_string: 'test' });
    const status = JSON.parse(statusResponse.content[0].text);
    console.log('Filesystem status:', 
      `Read-only: ${status.readonly_mode}, ` +
      `Allowed dirs: ${status.allowed_directories.map(d => d.path).join(', ')}`
    );
    
    // Test writing a file (should succeed) - use absolute path for clarity
    const writeFilePath = path.join(testDir, 'write-test.txt');
    const writeResponse = await client.callTool('write_file', { 
      path: writeFilePath,
      content: 'This is a test file'
    });
    const writeResult = JSON.parse(writeResponse.content[0].text);
    console.log('Write file result:', writeResult.success ? '✅ Success' : '❌ Failed');
    
    if (!writeResult.success) {
      throw new Error(`Write file failed: ${writeResult.message}`);
    }
    
    // Verify the file was written
    if (fs.existsSync(writeFilePath)) {
      console.log('✅ File was written successfully');
    } else {
      throw new Error('File was not written');
    }
    
    // Test writing to a file outside workspace (should fail)
    const outsideWriteResponse = await client.callTool('write_file', {
      path: path.join(secondDir, 'outside.txt'),
      content: 'This should fail'
    });
    const outsideWriteResult = JSON.parse(outsideWriteResponse.content[0].text);
    
    if (!outsideWriteResult.success) {
      console.log('✅ Write outside workspace correctly rejected');
    } else {
      throw new Error('Security issue: Writing outside workspace was allowed');
    }
    
    console.log('Normal mode tests passed');
  } finally {
    client.close();
    serverProcess.kill();
  }
}

// Test the server in read-only mode
async function testReadOnlyMode(testDir, secondDir) {
  console.log('\n=== Testing Read-Only Mode ===');
  
  // Start the server with read-only mode
  const serverProcess = spawn('node', ['src/mcp_server.js', '--workspaceRoot', testDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      READONLY_MODE: 'true',
      ALLOWED_DIRS: ''
    }
  });
  
  const client = new MCPClient(serverProcess);
  
  try {
    // Get filesystem status to verify read-only mode
    const statusResponse = await client.callTool('get_filesystem_status', { random_string: 'test' });
    const status = JSON.parse(statusResponse.content[0].text);
    console.log('Filesystem status:', 
      `Read-only: ${status.readonly_mode}, ` +
      `Allowed dirs: ${status.allowed_directories.map(d => d.path).join(', ')}`
    );
    
    if (!status.readonly_mode) {
      throw new Error('Read-only mode was not enabled');
    }
    
    // Test reading a file (should succeed) - use absolute path
    const readFilePath = path.join(testDir, 'test.txt');
    const readResponse = await client.callTool('read_file', { path: readFilePath });
    const readResult = JSON.parse(readResponse.content[0].text);
    console.log('Read file result:', readResult.success ? '✅ Success' : '❌ Failed');
    
    if (!readResult.success) {
      throw new Error(`Read file failed: ${readResult.message}`);
    }
    
    // Test writing a file (should fail in read-only mode) - use absolute path
    const writeFilePath = path.join(testDir, 'readonly-test.txt');
    const writeResponse = await client.callTool('write_file', { 
      path: writeFilePath,
      content: 'This should fail in read-only mode'
    });
    const writeResult = JSON.parse(writeResponse.content[0].text);
    
    if (!writeResult.success && writeResult.message.includes('read-only mode')) {
      console.log('✅ Write correctly rejected in read-only mode');
    } else {
      throw new Error('Security issue: Writing was allowed in read-only mode');
    }
    
    // Test creating a directory (should fail in read-only mode) - use absolute path
    const dirPath = path.join(testDir, 'readonly-dir');
    const mkdirResponse = await client.callTool('create_directory', { 
      path: dirPath
    });
    const mkdirResult = JSON.parse(mkdirResponse.content[0].text);
    
    if (!mkdirResult.success && mkdirResult.message.includes('read-only mode')) {
      console.log('✅ Directory creation correctly rejected in read-only mode');
    } else {
      throw new Error('Security issue: Directory creation was allowed in read-only mode');
    }
    
    // Verify tools list shows disabled status
    const toolsResponse = await client.listTools();
    const writeFileTool = toolsResponse.tools.find(t => t.name === 'write_file');
    
    if (writeFileTool && writeFileTool.description.includes('DISABLED IN READ-ONLY MODE')) {
      console.log('✅ Tool description correctly shows disabled status');
    } else {
      console.warn('⚠️ Tool description does not indicate read-only status');
    }
    
    console.log('Read-only mode tests passed');
  } finally {
    client.close();
    serverProcess.kill();
  }
}

// Test the server with allowed directories
async function testAllowedDirectories(testDir, secondDir) {
  console.log('\n=== Testing Allowed Directories ===');
  
  // Start the server with additional allowed directory
  const serverProcess = spawn('node', ['src/mcp_server.js', '--workspaceRoot', testDir], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      READONLY_MODE: 'false',
      ALLOWED_DIRS: secondDir
    }
  });
  
  const client = new MCPClient(serverProcess);
  
  try {
    // Get filesystem status to verify allowed directories
    const statusResponse = await client.callTool('get_filesystem_status', { random_string: 'test' });
    const status = JSON.parse(statusResponse.content[0].text);
    console.log('Filesystem status:', 
      `Read-only: ${status.readonly_mode}, ` +
      `Allowed dirs: ${status.allowed_directories.map(d => d.path).join(', ')}`
    );
    
    if (!status.allowed_directories.some(d => d.path === secondDir)) {
      throw new Error('Secondary directory was not in allowed directories');
    }
    
    // Test writing to secondary directory (should succeed now)
    const writeResponse = await client.callTool('write_file', {
      path: path.join(secondDir, 'allowed.txt'),
      content: 'This should now succeed'
    });
    const writeResult = JSON.parse(writeResponse.content[0].text);
    
    if (writeResult.success) {
      console.log('✅ Write to secondary directory succeeded');
    } else {
      throw new Error(`Writing to secondary directory failed: ${writeResult.message}`);
    }
    
    // Verify the file was written
    if (fs.existsSync(path.join(secondDir, 'allowed.txt'))) {
      console.log('✅ File was written to secondary directory');
    } else {
      throw new Error('File was not written to secondary directory');
    }
    
    // Test listing allowed directories tool
    const listDirsResponse = await client.callTool('list_allowed_directories', { random_string: 'test' });
    const listDirsResult = JSON.parse(listDirsResponse.content[0].text);
    
    if (listDirsResult.directories.includes(secondDir)) {
      console.log('✅ Secondary directory correctly listed in allowed directories');
    } else {
      throw new Error('Secondary directory not found in list_allowed_directories output');
    }
    
    console.log('Allowed directories tests passed');
  } finally {
    client.close();
    serverProcess.kill();
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
}); 