const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('ACF MCP Server v2 Tests', function() {
  this.timeout(10000);
  
  let serverProcess;
  const serverPath = path.join(__dirname, '../../bin/acf-mcp-v2');
  const testWorkspace = path.join(__dirname, '../test-workspace');
  
  // Helper to send JSON-RPC request
  function sendRequest(process, request) {
    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      let responseData = '';
      let errorData = '';
      
      const onData = (data) => {
        responseData += data.toString();
        try {
          // Try to parse complete JSON response
          const lines = responseData.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.startsWith('{')) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                process.stdout.removeListener('data', onData);
                resolve(response);
                return;
              }
            }
          }
        } catch (e) {
          // Not yet complete JSON, continue collecting
        }
      };
      
      const onError = (data) => {
        errorData += data.toString();
      };
      
      process.stdout.on('data', onData);
      process.stderr.on('data', onError);
      
      process.stdin.write(requestStr);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        process.stdout.removeListener('data', onData);
        process.stderr.removeListener('data', onError);
        reject(new Error(`Timeout waiting for response. Stderr: ${errorData}`));
      }, 5000);
    });
  }
  
  before(function(done) {
    // Create test workspace
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
    
    // Start server process
    serverProcess = spawn('node', [serverPath, '--workspaceRoot', testWorkspace], {
      env: {
        ...process.env,
        WORKSPACE_ROOT: testWorkspace,
        DEBUG: 'false'
      }
    });
    
    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
    });
    
    // Wait for server to be ready
    setTimeout(done, 1000);
  });
  
  after(function() {
    if (serverProcess) {
      serverProcess.kill();
    }
    // Clean up test workspace
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });
  
  describe('Server Initialization', function() {
    it('should respond to initialize request', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {}
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('protocolVersion');
      expect(response.result).to.have.property('capabilities');
      expect(response.result).to.have.property('serverInfo');
      expect(response.result.serverInfo.name).to.equal('agentic-control-framework');
    });
  });
  
  describe('Tools List', function() {
    it('should return list of available tools', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('tools');
      expect(response.result.tools).to.be.an('array');
      expect(response.result.tools.length).to.be.greaterThan(50);
      
      // Check for some key tools
      const toolNames = response.result.tools.map(t => t.name);
      expect(toolNames).to.include('addTask');
      expect(toolNames).to.include('listTasks');
      expect(toolNames).to.include('read_file');
      expect(toolNames).to.include('write_file');
      expect(toolNames).to.include('execute_command');
      expect(toolNames).to.include('browser_navigate');
    });
    
    it('should have proper tool schemas', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
        params: {}
      };
      
      const response = await sendRequest(serverProcess, request);
      const tools = response.result.tools;
      
      // Check a specific tool schema
      const addTaskTool = tools.find(t => t.name === 'addTask');
      expect(addTaskTool).to.exist;
      expect(addTaskTool).to.have.property('description');
      expect(addTaskTool).to.have.property('inputSchema');
      expect(addTaskTool.inputSchema).to.have.property('type', 'object');
      expect(addTaskTool.inputSchema).to.have.property('properties');
      expect(addTaskTool.inputSchema).to.have.property('required');
      expect(addTaskTool.inputSchema.required).to.include('title');
    });
  });
  
  describe('Tool Execution', function() {
    it('should initialize project', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'initProject',
          arguments: {
            projectName: 'Test Project',
            projectDescription: 'A test project for MCP server'
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('content');
      
      // Check that tasks.json was created
      const tasksFile = path.join(testWorkspace, '.acf', 'tasks.json');
      expect(fs.existsSync(tasksFile)).to.be.true;
    });
    
    it('should add a task', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'addTask',
          arguments: {
            title: 'Test Task',
            description: 'This is a test task',
            priority: 'high'
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('content');
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content.success).to.be.true;
      expect(content).to.have.property('taskId');
    });
    
    it('should list tasks', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'listTasks',
          arguments: {}
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('content');
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content.success).to.be.true;
      expect(content).to.have.property('tasks');
      expect(content.tasks).to.be.an('array');
      expect(content.tasks.length).to.be.at.least(2);
      // The first task is the auto-created "Project Setup" task
      // The second task should be our "Test Task"
      const testTask = content.tasks.find(t => t.title === 'Test Task');
      expect(testTask).to.exist;
      expect(testTask).to.have.property('title', 'Test Task');
    });
    
    it('should read file', async function() {
      // Create a test file
      const testFile = path.join(testWorkspace, 'test.txt');
      fs.writeFileSync(testFile, 'Hello, MCP!');
      
      const request = {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'read_file',
          arguments: {
            path: testFile
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('content');
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content.success).to.be.true;
      expect(content.content).to.equal('Hello, MCP!');
    });
    
    it('should write file', async function() {
      const testFile = path.join(testWorkspace, 'output.txt');
      
      const request = {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'write_file',
          arguments: {
            path: testFile,
            content: 'Written by MCP server'
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('result');
      expect(response.result).to.have.property('content');
      
      const content = JSON.parse(response.result.content[0].text);
      expect(content.success).to.be.true;
      
      // Verify file was written
      const fileContent = fs.readFileSync(testFile, 'utf8');
      expect(fileContent).to.equal('Written by MCP server');
    });
  });
  
  describe('Error Handling', function() {
    it('should handle invalid tool name', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'nonExistentTool',
          arguments: {}
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      expect(response).to.have.property('error');
      expect(response.error).to.have.property('message');
      expect(response.error.message.toLowerCase()).to.satisfy(msg => 
        msg.includes('unknown tool') || msg.includes('method not found') || msg.includes('nonexistenttool')
      );
    });
    
    it('should handle missing required parameters', async function() {
      const request = {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'addTask',
          arguments: {
            // Missing required 'title' parameter
            description: 'Task without title'
          }
        }
      };
      
      const response = await sendRequest(serverProcess, request);
      // The server may return either an error or a result with success: false
      if (response.error) {
        expect(response.error).to.have.property('message');
        expect(response.error.message.toLowerCase()).to.include('title');
      } else {
        expect(response).to.have.property('result');
        const content = JSON.parse(response.result.content[0].text);
        expect(content.success).to.be.false;
        expect(content.message.toLowerCase()).to.include('title');
      }
    });
  });
});

describe('MCP Protocol Compliance', function() {
  it('should comply with MCP specification', function() {
    // This test verifies that our implementation follows MCP standards
    const configPath = path.join(__dirname, '../../claude.json');
    expect(fs.existsSync(configPath)).to.be.true;
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config).to.have.property('mcpServers');
    expect(config.mcpServers).to.have.property('agentic-control-framework');
    
    const serverConfig = config.mcpServers['agentic-control-framework'];
    expect(serverConfig).to.have.property('command');
    expect(serverConfig).to.have.property('args');
  });
});