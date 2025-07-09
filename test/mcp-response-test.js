#!/usr/bin/env node

/**
 * Test MCP responses to verify duplication elimination and logging reduction
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class McpResponseTest {
  constructor() {
    this.mcpProcess = null;
    this.responses = [];
  }

  async startMcpServer() {
    console.log('🚀 Starting MCP server...');
    
    this.mcpProcess = spawn('node', ['src/mcp_server.js'], {
      cwd: '/Users/abhilashchadhar/uncloud/cursor/agentic-control-framework',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    await new Promise((resolve) => {
      this.mcpProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server ready and listening')) {
          console.log('✅ MCP server is ready');
          resolve();
        }
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

  async testListTasksResponse() {
    console.log('\n📋 Testing listTasks response size...');
    
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "listTasks_agentic-control-framework",
        arguments: {
          format: "human"
        }
      }
    };

    const response = await this.sendMcpRequest(request);
    const responseSize = JSON.stringify(response).length;
    
    console.log(`📏 Response size: ${responseSize} characters`);
    console.log(`📊 Success: ${response.result?.content?.[0]?.text ? 'Yes' : 'No'}`);
    
    // Check for duplication indicators
    const responseText = JSON.stringify(response);
    const taskTableCount = (responseText.match(/taskTable/g) || []).length;
    const tasksArrayCount = (responseText.match(/"tasks":\[/g) || []).length;
    
    console.log(`🔍 Duplication check:`);
    console.log(`   - taskTable references: ${taskTableCount}`);
    console.log(`   - tasks arrays: ${tasksArrayCount}`);
    
    return {
      size: responseSize,
      success: !!response.result?.content?.[0]?.text,
      duplicationIndicators: { taskTableCount, tasksArrayCount },
      response: response
    };
  }

  async testPriorityOperationsResponse() {
    console.log('\n⚡ Testing priority operations response...');
    
    // Test bumpTaskPriority
    const bumpRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "bumpTaskPriority_agentic-control-framework",
        arguments: {
          id: "37",
          amount: 25
        }
      }
    };

    const bumpResponse = await this.sendMcpRequest(bumpRequest);
    const bumpSize = JSON.stringify(bumpResponse).length;
    
    console.log(`📏 Bump priority response size: ${bumpSize} characters`);
    console.log(`📊 Success: ${bumpResponse.result?.content?.[0]?.text ? 'Yes' : 'No'}`);
    
    // Test deferTaskPriority
    const deferRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "deferTaskPriority_agentic-control-framework",
        arguments: {
          id: "38",
          amount: 15
        }
      }
    };

    const deferResponse = await this.sendMcpRequest(deferRequest);
    const deferSize = JSON.stringify(deferResponse).length;
    
    console.log(`📏 Defer priority response size: ${deferSize} characters`);
    console.log(`📊 Success: ${deferResponse.result?.content?.[0]?.text ? 'Yes' : 'No'}`);
    
    // Check for priority logging spam
    const combinedResponse = JSON.stringify(bumpResponse) + JSON.stringify(deferResponse);
    const priorityLogCount = (combinedResponse.match(/Priority.*updated|Priority.*adjusted|Priority.*bumped|Priority.*deferred/gi) || []).length;
    const activityLogCount = (combinedResponse.match(/activityLog/g) || []).length;
    
    console.log(`🔍 Priority logging check:`);
    console.log(`   - Priority-related log messages: ${priorityLogCount}`);
    console.log(`   - Total activityLog references: ${activityLogCount}`);
    
    return {
      bumpSize,
      deferSize,
      totalSize: bumpSize + deferSize,
      priorityLogCount,
      activityLogCount,
      bumpResponse,
      deferResponse
    };
  }

  async testUpdateStatusResponse() {
    console.log('\n🔄 Testing updateStatus response...');
    
    const updateRequest = {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "updateStatus_agentic-control-framework",
        arguments: {
          id: "39",
          newStatus: "done",
          relatedFiles: "test1.js,test2.js"
        }
      }
    };

    const updateResponse = await this.sendMcpRequest(updateRequest);
    const updateSize = JSON.stringify(updateResponse).length;
    
    console.log(`📏 Update status response size: ${updateSize} characters`);
    console.log(`📊 Success: ${updateResponse.result?.content?.[0]?.text ? 'Yes' : 'No'}`);
    
    // Check for duplication in updateStatus (should be single I/O now)
    const responseText = JSON.stringify(updateResponse);
    const fileIoIndicators = (responseText.match(/readTasks|writeTasks/g) || []).length;
    
    console.log(`🔍 File I/O duplication check:`);
    console.log(`   - File I/O operation indicators: ${fileIoIndicators}`);
    
    return {
      size: updateSize,
      success: !!updateResponse.result?.content?.[0]?.text,
      fileIoIndicators,
      response: updateResponse
    };
  }

  async testRecalculatePrioritiesResponse() {
    console.log('\n🧮 Testing recalculatePriorities response...');
    
    const recalcRequest = {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "recalculatePriorities_agentic-control-framework",
        arguments: {
          applyDependencyBoosts: true,
          optimizeDistribution: true
        }
      }
    };

    const recalcResponse = await this.sendMcpRequest(recalcRequest);
    const recalcSize = JSON.stringify(recalcResponse).length;
    
    console.log(`📏 Recalculate priorities response size: ${recalcSize} characters`);
    console.log(`📊 Success: ${recalcResponse.result?.content?.[0]?.text ? 'Yes' : 'No'}`);
    
    // Check for massive priority logging spam
    const responseText = JSON.stringify(recalcResponse);
    const priorityAdjustmentCount = (responseText.match(/priority.*adjust|adjust.*priority/gi) || []).length;
    const dependencyBoostCount = (responseText.match(/dependency.*boost|boost.*dependency/gi) || []).length;
    
    console.log(`🔍 Priority recalculation logging check:`);
    console.log(`   - Priority adjustment messages: ${priorityAdjustmentCount}`);
    console.log(`   - Dependency boost messages: ${dependencyBoostCount}`);
    
    return {
      size: recalcSize,
      success: !!recalcResponse.result?.content?.[0]?.text,
      priorityAdjustmentCount,
      dependencyBoostCount,
      response: recalcResponse
    };
  }

  generateReport(results) {
    console.log('\n📊 MCP RESPONSE ANALYSIS REPORT');
    console.log('================================');
    
    console.log('\n📏 RESPONSE SIZES:');
    console.log(`📋 listTasks: ${results.listTasks.size} chars`);
    console.log(`⚡ Priority operations: ${results.priorityOps.totalSize} chars`);
    console.log(`🔄 updateStatus: ${results.updateStatus.size} chars`);
    console.log(`🧮 recalculatePriorities: ${results.recalcPriorities.size} chars`);
    
    const totalSize = results.listTasks.size + results.priorityOps.totalSize + 
                     results.updateStatus.size + results.recalcPriorities.size;
    console.log(`📊 Total response size: ${totalSize} chars`);
    
    console.log('\n🔍 DUPLICATION ELIMINATION:');
    console.log(`✅ listTasks duplication fixed: ${results.listTasks.duplicationIndicators.tasksArrayCount <= 1 ? 'Yes' : 'No'}`);
    console.log(`✅ updateStatus single I/O: ${results.updateStatus.fileIoIndicators <= 2 ? 'Yes' : 'No'}`);
    
    console.log('\n📝 PRIORITY LOGGING REDUCTION:');
    console.log(`🎯 Priority operation logs: ${results.priorityOps.priorityLogCount}`);
    console.log(`🎯 Priority recalc logs: ${results.recalcPriorities.priorityAdjustmentCount}`);
    console.log(`🎯 Dependency boost logs: ${results.recalcPriorities.dependencyBoostCount}`);
    
    const totalPriorityLogs = results.priorityOps.priorityLogCount + 
                             results.recalcPriorities.priorityAdjustmentCount + 
                             results.recalcPriorities.dependencyBoostCount;
    
    console.log(`📊 Total priority-related logs: ${totalPriorityLogs}`);
    
    console.log('\n🎯 SUCCESS METRICS:');
    const allSuccessful = results.listTasks.success && 
                         results.priorityOps.bumpResponse.result && 
                         results.priorityOps.deferResponse.result && 
                         results.updateStatus.success && 
                         results.recalcPriorities.success;
    
    console.log(`✅ All operations successful: ${allSuccessful ? 'Yes' : 'No'}`);
    console.log(`📉 Response size reasonable: ${totalSize < 50000 ? 'Yes' : 'No'} (${totalSize} < 50k)`);
    console.log(`📝 Priority logging controlled: ${totalPriorityLogs < 50 ? 'Yes' : 'No'} (${totalPriorityLogs} < 50)`);
    
    const overallSuccess = allSuccessful && totalSize < 50000 && totalPriorityLogs < 50;
    console.log(`🏆 Overall improvement: ${overallSuccess ? 'SUCCESS' : 'NEEDS WORK'}`);
    
    return {
      totalSize,
      totalPriorityLogs,
      allSuccessful,
      overallSuccess,
      results
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

  async run() {
    try {
      await this.startMcpServer();
      
      const results = {
        listTasks: await this.testListTasksResponse(),
        priorityOps: await this.testPriorityOperationsResponse(),
        updateStatus: await this.testUpdateStatusResponse(),
        recalcPriorities: await this.testRecalculatePrioritiesResponse()
      };
      
      const report = this.generateReport(results);
      
      await this.stopMcpServer();
      
      return report;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      await this.stopMcpServer();
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new McpResponseTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 MCP response test completed: ${report.overallSuccess ? 'SUCCESS' : 'NEEDS WORK'}`);
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 MCP response test failed:', error);
      process.exit(1);
    });
}

module.exports = McpResponseTest;
