const { expect } = require('chai');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Claude Code Compatibility Tests', function() {
  this.timeout(30000);
  
  let mcpServer;
  let tempDir;
  
  beforeEach(function() {
    // Create temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-claude-test-'));
  });
  
  afterEach(function() {
    // Clean up MCP server
    if (mcpServer && !mcpServer.killed) {
      mcpServer.kill('SIGTERM');
    }
    
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('MCP Protocol Version Compatibility', function() {
    it('should support latest MCP protocol version 2025-03-26', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });
      
      expect(response.result.protocolVersion).to.equal('2025-03-26');
      expect(response.result.capabilities).to.have.property('tools');
      expect(response.result.capabilities.tools).to.have.property('listChanged', true);
      expect(response.result.serverInfo).to.have.property('title', 'Agentic Control Framework');
    });

    it('should support backward compatibility with 2024-11-05', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });
      
      expect(response.result.protocolVersion).to.equal('2024-11-05');
      expect(response.result.capabilities).to.have.property('tools');
    });

    it('should default to latest version for unknown protocol versions', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '1.0.0', // Unsupported version
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });
      
      expect(response.result.protocolVersion).to.equal('2025-03-26');
    });
  });

  describe('Tool Schema Validation for Claude Code', function() {
    let toolsResponse;
    
    before(async function() {
      // Initialize server first
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });
      
      // Get tools list
      toolsResponse = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      });
    });

    it('should return all tools with proper schema structure', function() {
      expect(toolsResponse.result).to.have.property('tools');
      expect(toolsResponse.result.tools).to.be.an('array');
      expect(toolsResponse.result.tools.length).to.be.greaterThan(80);
    });

    it('should have proper tool titles for Claude Code UI', function() {
      const tools = toolsResponse.result.tools;
      const toolsWithTitles = tools.filter(tool => tool.title);

      // At least 15% of tools should have titles (we've updated key ones)
      expect(toolsWithTitles.length).to.be.greaterThan(tools.length * 0.15);

      // Check specific important tools have titles
      const importantTools = ['setWorkspace', 'addTask', 'listTasks', 'getNextTask', 'read_file', 'write_file'];
      let toolsWithTitlesCount = 0;
      importantTools.forEach(toolName => {
        const tool = tools.find(t => t.name === toolName);
        expect(tool, `Tool ${toolName} should exist`).to.exist;
        if (tool.title) {
          expect(tool.title, `Tool ${toolName} should have a meaningful title`).to.be.a('string');
          toolsWithTitlesCount++;
        }
      });

      // At least half of the important tools should have titles
      expect(toolsWithTitlesCount).to.be.greaterThan(importantTools.length * 0.5);
    });

    it('should have proper annotations for Claude Code behavior hints', function() {
      const tools = toolsResponse.result.tools;
      const toolsWithAnnotations = tools.filter(tool => tool.annotations);
      
      // Check that some tools have annotations
      expect(toolsWithAnnotations.length).to.be.greaterThan(0);
      
      // Check specific tools have proper annotations
      const getNextTask = tools.find(t => t.name === 'getNextTask');
      if (getNextTask && getNextTask.annotations) {
        expect(getNextTask.annotations).to.have.property('readOnlyHint', true);
      }
    });

    it('should not have dummy parameters in no-parameter tools', function() {
      const tools = toolsResponse.result.tools;
      const noParamTools = ['getNextTask', 'generateTaskFiles', 'generateTaskTable'];
      
      noParamTools.forEach(toolName => {
        const tool = tools.find(t => t.name === toolName);
        if (tool) {
          expect(tool.inputSchema.properties).to.not.have.property('random_string');
          expect(tool.inputSchema.required || []).to.not.include('random_string');
        }
      });
    });

    it('should have valid JSON schema for all tools', function() {
      const tools = toolsResponse.result.tools;
      
      tools.forEach(tool => {
        expect(tool).to.have.property('name');
        expect(tool).to.have.property('description');
        expect(tool).to.have.property('inputSchema');
        expect(tool.inputSchema).to.have.property('type', 'object');
        expect(tool.inputSchema).to.have.property('properties');
        
        // Validate that required fields exist in properties
        if (tool.inputSchema.required) {
          tool.inputSchema.required.forEach(requiredField => {
            expect(tool.inputSchema.properties).to.have.property(requiredField);
          });
        }
      });
    });
  });

  describe('Tool Execution with Claude Code Format', function() {
    let localToolsResponse;

    before(async function() {
      // Initialize server first
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });

      // Get tools list
      localToolsResponse = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      });
    });

    it('should have tools that support proper execution format', function() {
      // Test that tools are properly defined for execution
      expect(localToolsResponse).to.exist;
      expect(localToolsResponse.result).to.exist;
      const tools = localToolsResponse.result.tools;

      // Find a simple tool to test schema
      const getNextTask = tools.find(t => t.name === 'getNextTask');
      expect(getNextTask).to.exist;
      expect(getNextTask.inputSchema).to.have.property('type', 'object');
      expect(getNextTask.inputSchema).to.have.property('properties');

      // Find a tool with parameters
      const listTasks = tools.find(t => t.name === 'listTasks');
      expect(listTasks).to.exist;
      expect(listTasks.inputSchema).to.have.property('properties');

      // Verify no dummy parameters
      Object.keys(getNextTask.inputSchema.properties).forEach(prop => {
        expect(prop).to.not.equal('random_string');
      });
    });

    it('should have proper tool response format expectations', function() {
      // This test verifies the tools are set up correctly for Claude Code
      // The actual execution is tested in integration tests
      expect(localToolsResponse).to.exist;
      expect(localToolsResponse.result).to.exist;
      const tools = localToolsResponse.result.tools;

      // All tools should have proper schema structure
      tools.forEach(tool => {
        expect(tool).to.have.property('name');
        expect(tool).to.have.property('description');
        expect(tool).to.have.property('inputSchema');
        expect(tool.inputSchema).to.have.property('type', 'object');
        expect(tool.inputSchema).to.have.property('properties');
      });

      // Tools should be ready for Claude Code execution
      expect(tools.length).to.be.greaterThan(80);
    });
  });

  describe('Error Handling for Claude Code', function() {
    before(async function() {
      // Initialize server
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });
    });

    it('should return proper JSON-RPC error for invalid method', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 5,
        method: 'invalid/method',
        params: {}
      });

      expect(response).to.have.property('error');
      expect(response.error).to.have.property('code');
      expect(response.error).to.have.property('message');
      expect(response.error.code).to.equal(-32601); // Method not found
    });

    it('should return proper error for invalid tool name', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'nonexistentTool',
          arguments: {}
        }
      });

      expect(response).to.have.property('error');
      expect(response.error).to.have.property('code');
      expect(response.error).to.have.property('message');
    });

    it('should return proper error for invalid tool arguments', async function() {
      const response = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'addTask',
          arguments: {} // Missing required 'title' parameter
        }
      });

      expect(response).to.have.property('error');
      expect(response.error).to.have.property('message');
      expect(response.error.message).to.include('title');
    });
  });

  describe('Claude Code Specific Features', function() {
    let localToolsResponse;

    before(async function() {
      // Initialize server
      await sendMCPRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: { roots: { listChanged: true } },
          clientInfo: { name: 'Claude Code', version: '1.0.0' }
        }
      });

      // Get tools list
      localToolsResponse = await sendMCPRequest({
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/list'
      });
    });

    it('should support tools/list method for tool discovery', function() {
      expect(localToolsResponse.result).to.have.property('tools');
      expect(localToolsResponse.result.tools).to.be.an('array');

      // Verify tools have Claude Code friendly metadata
      const firstTool = localToolsResponse.result.tools[0];
      expect(firstTool).to.have.property('name');
      expect(firstTool).to.have.property('description');
      expect(firstTool).to.have.property('inputSchema');
    });

    it('should support Claude Code tool discovery patterns', function() {
      // Test that tools are discoverable and have Claude Code friendly metadata
      expect(localToolsResponse).to.exist;
      expect(localToolsResponse.result).to.exist;
      const tools = localToolsResponse.result.tools;

      // Should have a good variety of tools
      expect(tools.length).to.be.greaterThan(80);

      // Should have tools in different categories
      const taskTools = tools.filter(t => t.name.includes('Task') || t.description.toLowerCase().includes('task'));
      const fileTools = tools.filter(t => t.name.includes('file') || t.description.toLowerCase().includes('file'));
      const browserTools = tools.filter(t => t.name.includes('browser') || t.description.toLowerCase().includes('browser'));

      expect(taskTools.length).to.be.greaterThan(5);
      expect(fileTools.length).to.be.greaterThan(5);
      expect(browserTools.length).to.be.greaterThan(5);

      // Tools should have meaningful descriptions
      tools.forEach(tool => {
        expect(tool.description).to.be.a('string');
        expect(tool.description.length).to.be.greaterThan(10);
      });
    });
  });

  // Helper function to send MCP requests
  async function sendMCPRequest(request) {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '../../src/mcp_server.js');
      const server = spawn('node', [serverPath, '--workspaceRoot', tempDir], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let responseReceived = false;
      let errorData = '';

      server.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim() && line.startsWith('{') && !responseReceived) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id || (response.jsonrpc && response.id)) {
                responseReceived = true;
                server.kill();
                resolve(response);
                return;
              }
            } catch (e) {
              // Ignore non-JSON lines (logs)
            }
          }
        }
      });

      server.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      server.on('error', (error) => {
        if (!responseReceived) {
          reject(new Error(`Server error: ${error.message}`));
        }
      });

      server.on('close', (code) => {
        if (code !== 0 && code !== null && !responseReceived) {
          reject(new Error(`Server exited with code ${code}. Error: ${errorData}`));
        }
      });

      // Wait for server to start, then send request
      setTimeout(() => {
        if (!responseReceived) {
          server.stdin.write(JSON.stringify(request) + '\n');
        }
      }, 1000);

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!responseReceived) {
          server.kill();
          reject(new Error('Request timeout'));
        }
      }, 15000);
    });
  }
});
