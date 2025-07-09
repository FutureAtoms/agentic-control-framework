#!/usr/bin/env node

/**
 * MCP Server Response Test
 * Tests actual MCP server responses to identify any remaining issues
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class McpServerResponseTest {
  constructor() {
    this.mcpProcess = null;
    this.testWorkspace = path.join(os.tmpdir(), 'acf-mcp-server-test-' + Date.now());
    this.responses = [];
    this.issues = [];
  }

  async setupTestWorkspace() {
    console.log('🔧 Setting up MCP server test workspace...');
    
    // Create test workspace
    if (!fs.existsSync(this.testWorkspace)) {
      fs.mkdirSync(this.testWorkspace, { recursive: true });
    }
    
    // Create a minimal tasks.json for testing
    const acfDir = path.join(this.testWorkspace, '.acf');
    fs.mkdirSync(acfDir, { recursive: true });
    
    const tasksData = {
      projectName: "MCP Server Test",
      projectDescription: "Testing MCP server responses",
      tasks: [
        {
          id: 1,
          title: "Test Task 1",
          description: "First test task",
          status: "todo",
          priority: 500,
          priorityDisplay: "medium",
          relatedFiles: ["test1.js"],
          dependsOn: [],
          subtasks: [],
          activityLog: [
            {
              timestamp: new Date().toISOString(),
              type: "log",
              message: "Task created"
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Test Task 2",
          description: "Second test task with dependencies",
          status: "todo",
          priority: 750,
          priorityDisplay: "high",
          relatedFiles: ["test2.js", "test2.spec.js"],
          dependsOn: [1],
          subtasks: [],
          activityLog: [
            {
              timestamp: new Date().toISOString(),
              type: "log",
              message: "Task created"
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      lastTaskId: 2,
      lastSubtaskIndex: 0
    };
    
    fs.writeFileSync(path.join(acfDir, 'tasks.json'), JSON.stringify(tasksData, null, 2));
    console.log('✅ Test workspace created');
  }

  async startMcpServer() {
    console.log('🚀 Starting MCP server...');
    
    this.mcpProcess = spawn('node', ['src/mcp_server.js'], {
      cwd: '/Users/abhilashchadhar/uncloud/cursor/agentic-control-framework',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ACF_WORKSPACE: this.testWorkspace }
    });

    // Wait for server to be ready
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP server startup timeout'));
      }, 10000);

      this.mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server ready and listening')) {
          clearTimeout(timeout);
          console.log('✅ MCP server is ready');
          resolve();
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.error('MCP server error:', data.toString());
      });
    });
  }

  async sendMcpRequest(request) {
    return new Promise((resolve, reject) => {
      let responseData = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      const dataHandler = (data) => {
        responseData += data.toString();
        
        // Check if we have a complete JSON response
        try {
          const lines = responseData.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                this.mcpProcess.stdout.removeListener('data', dataHandler);
                resolve(response);
                return;
              }
            }
          }
        } catch (e) {
          // Continue waiting for complete response
        }
      };

      this.mcpProcess.stdout.on('data', dataHandler);
      
      // Send the request
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  analyzeResponse(toolName, response, startTime) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const responseText = JSON.stringify(response);
    const responseSize = responseText.length;
    
    // Detailed analysis
    const analysis = {
      toolName,
      responseTime,
      responseSize,
      success: !response.error,
      hasContent: !!(response.result?.content?.[0]?.text),
      patterns: {
        taskArrays: (responseText.match(/"tasks":\[/g) || []).length,
        activityLogs: (responseText.match(/activityLog/g) || []).length,
        priorityLogs: (responseText.match(/Priority.*adjust|Priority.*boost|Priority.*update/gi) || []).length,
        errorMessages: (responseText.match(/error|fail|exception/gi) || []).length,
        duplicateKeys: this.findDuplicateKeys(responseText),
        largeArrays: this.findLargeArrays(responseText),
        deepNesting: this.calculateNestingDepth(responseText)
      },
      issues: []
    };
    
    // Identify issues
    if (!analysis.success) analysis.issues.push('Request failed');
    if (responseSize > 50000) analysis.issues.push(`Very large response (${responseSize} chars)`);
    if (responseTime > 2000) analysis.issues.push(`Slow response (${responseTime}ms)`);
    if (analysis.patterns.taskArrays > 1) analysis.issues.push('Multiple task arrays detected');
    if (analysis.patterns.priorityLogs > 10) analysis.issues.push('Excessive priority logging');
    if (analysis.patterns.duplicateKeys.length > 0) analysis.issues.push('Duplicate keys found');
    if (analysis.patterns.largeArrays.length > 0) analysis.issues.push('Large arrays detected');
    if (analysis.patterns.deepNesting > 10) analysis.issues.push('Deep object nesting');
    
    console.log(`📏 ${toolName}: ${responseSize} chars, ${responseTime}ms ${analysis.issues.length > 0 ? '⚠️' : '✅'}`);
    if (analysis.issues.length > 0) {
      console.log(`   Issues: ${analysis.issues.join(', ')}`);
      this.issues.push(analysis);
    }
    
    return analysis;
  }

  findDuplicateKeys(jsonText) {
    const duplicates = [];
    try {
      const obj = JSON.parse(jsonText);
      this.checkForDuplicateKeys(obj, '', duplicates);
    } catch (e) {
      // Ignore parsing errors for this analysis
    }
    return duplicates;
  }

  checkForDuplicateKeys(obj, path, duplicates) {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.checkForDuplicateKeys(item, `${path}[${index}]`, duplicates);
      });
    } else {
      const keys = Object.keys(obj);
      const keyCount = {};
      keys.forEach(key => {
        keyCount[key] = (keyCount[key] || 0) + 1;
        if (keyCount[key] > 1) {
          duplicates.push(`${path}.${key}`);
        }
        this.checkForDuplicateKeys(obj[key], `${path}.${key}`, duplicates);
      });
    }
  }

  findLargeArrays(jsonText) {
    const largeArrays = [];
    try {
      const obj = JSON.parse(jsonText);
      this.checkForLargeArrays(obj, '', largeArrays);
    } catch (e) {
      // Ignore parsing errors
    }
    return largeArrays;
  }

  checkForLargeArrays(obj, path, largeArrays) {
    if (typeof obj !== 'object' || obj === null) return;
    
    if (Array.isArray(obj)) {
      if (obj.length > 100) {
        largeArrays.push({ path, length: obj.length });
      }
      obj.forEach((item, index) => {
        this.checkForLargeArrays(item, `${path}[${index}]`, largeArrays);
      });
    } else {
      Object.keys(obj).forEach(key => {
        this.checkForLargeArrays(obj[key], `${path}.${key}`, largeArrays);
      });
    }
  }

  calculateNestingDepth(jsonText) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];
      if (char === '{' || char === '[') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}' || char === ']') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }

  async testMcpTools() {
    console.log('\n📋 Testing MCP tool responses...');
    
    const tests = [
      {
        name: 'listTasks_human',
        request: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "listTasks_agentic-control-framework",
            arguments: { format: "human" }
          }
        }
      },
      {
        name: 'listTasks_json',
        request: {
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "listTasks_agentic-control-framework",
            arguments: { format: "json" }
          }
        }
      },
      {
        name: 'addTask',
        request: {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "addTask_agentic-control-framework",
            arguments: {
              title: "MCP Test Task",
              description: "Task added via MCP",
              priority: "high",
              relatedFiles: "mcp-test.js"
            }
          }
        }
      },
      {
        name: 'bumpTaskPriority',
        request: {
          jsonrpc: "2.0",
          id: 4,
          method: "tools/call",
          params: {
            name: "bumpTaskPriority_agentic-control-framework",
            arguments: { id: "1", amount: 50 }
          }
        }
      },
      {
        name: 'updateStatus',
        request: {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: {
            name: "updateStatus_agentic-control-framework",
            arguments: {
              id: "2",
              newStatus: "inprogress",
              message: "Starting work via MCP"
            }
          }
        }
      },
      {
        name: 'getPriorityStatistics',
        request: {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: {
            name: "getPriorityStatistics_agentic-control-framework",
            arguments: {}
          }
        }
      },
      {
        name: 'getNextTask',
        request: {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: {
            name: "getNextTask_agentic-control-framework",
            arguments: {}
          }
        }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await this.sendMcpRequest(test.request);
        const analysis = this.analyzeResponse(test.name, response, startTime);
        results.push(analysis);
        this.responses.push({ test: test.name, response, analysis });
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error.message);
        results.push({
          toolName: test.name,
          success: false,
          error: error.message,
          issues: ['Request failed']
        });
      }
    }
    
    return results;
  }

  generateReport(results) {
    console.log('\n📊 MCP SERVER RESPONSE ANALYSIS REPORT');
    console.log('======================================');
    
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    // Response metrics
    const responseSizes = results.filter(r => r.responseSize).map(r => r.responseSize);
    const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
    
    const avgResponseSize = responseSizes.length > 0 ? Math.round(responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length) : 0;
    const maxResponseSize = responseSizes.length > 0 ? Math.max(...responseSizes) : 0;
    const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Avg response size: ${avgResponseSize} chars`);
    console.log(`   Max response size: ${maxResponseSize} chars`);
    console.log(`   Avg response time: ${avgResponseTime}ms`);
    console.log(`   Max response time: ${maxResponseTime}ms`);
    
    console.log('\n🔍 DETAILED OBSERVATIONS:');
    
    // Check for patterns across all responses
    const allTaskArrays = results.reduce((sum, r) => sum + (r.patterns?.taskArrays || 0), 0);
    const allPriorityLogs = results.reduce((sum, r) => sum + (r.patterns?.priorityLogs || 0), 0);
    const allActivityLogs = results.reduce((sum, r) => sum + (r.patterns?.activityLogs || 0), 0);
    
    console.log(`   Task arrays across all responses: ${allTaskArrays}`);
    console.log(`   Priority logs across all responses: ${allPriorityLogs}`);
    console.log(`   Activity log references: ${allActivityLogs}`);
    
    // Issue summary
    console.log('\n⚠️ ISSUES DETECTED:');
    if (this.issues.length === 0) {
      console.log('   ✅ No issues detected!');
    } else {
      this.issues.forEach(issue => {
        console.log(`   🔍 ${issue.toolName}: ${issue.issues.join(', ')}`);
      });
    }
    
    // Quality assessment
    const qualityMetrics = {
      highSuccessRate: (successfulTests / totalTests) > 0.9,
      reasonableResponseSizes: avgResponseSize < 10000,
      fastResponses: avgResponseTime < 500,
      noDuplication: allTaskArrays <= totalTests,
      controlledLogging: allPriorityLogs < 20
    };
    
    console.log('\n🎯 QUALITY METRICS:');
    Object.entries(qualityMetrics).forEach(([metric, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${metric}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    const overallQuality = Object.values(qualityMetrics).filter(Boolean).length / Object.keys(qualityMetrics).length;
    console.log(`\n🏆 Overall Quality Score: ${(overallQuality * 100).toFixed(1)}%`);
    
    return {
      totalTests,
      successfulTests,
      failedTests,
      avgResponseSize,
      maxResponseSize,
      avgResponseTime,
      maxResponseTime,
      qualityMetrics,
      overallQuality,
      issues: this.issues
    };
  }

  async stopMcpServer() {
    if (this.mcpProcess) {
      console.log('\n🛑 Stopping MCP server...');
      this.mcpProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ MCP server stopped');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test workspace...');
    try {
      if (fs.existsSync(this.testWorkspace)) {
        fs.rmSync(this.testWorkspace, { recursive: true, force: true });
      }
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.warn(`⚠️ Cleanup warning: ${error.message}`);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting MCP Server Response Test...');
      
      await this.setupTestWorkspace();
      await this.startMcpServer();
      
      const results = await this.testMcpTools();
      const report = this.generateReport(results);
      
      await this.stopMcpServer();
      await this.cleanup();
      
      return report;
    } catch (error) {
      console.error('❌ MCP server test failed:', error.message);
      await this.stopMcpServer();
      await this.cleanup();
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new McpServerResponseTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 MCP server test completed: ${report.overallQuality > 0.8 ? 'EXCELLENT' : 'COMPLETED'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 MCP server test failed:', error);
      process.exit(1);
    });
}

module.exports = McpServerResponseTest;
