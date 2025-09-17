#!/usr/bin/env node

/**
 * Simple test to check response sizes and duplication elimination
 */

const core = require('../src/core');
const fs = require('fs');
const path = require('path');

class SimpleResponseTest {
  constructor() {
    // Use repo root as workspace (contains .acf by default)
    this.workspaceRoot = path.resolve(__dirname, '..');
  }

  measureResponseSize(operation, result) {
    const responseText = JSON.stringify(result);
    const size = responseText.length;
    
    console.log(`📏 ${operation} response: ${size} characters`);
    
    // Check for common duplication patterns
    const patterns = {
      'tasks arrays': (responseText.match(/"tasks":\[/g) || []).length,
      'taskTable refs': (responseText.match(/taskTable/g) || []).length,
      'priority logs': (responseText.match(/Priority.*adjust|Priority.*boost|Priority.*update/gi) || []).length,
      'activity logs': (responseText.match(/activityLog/g) || []).length
    };
    
    console.log(`🔍 Pattern analysis:`, patterns);
    
    return { size, patterns, response: result };
  }

  async testListTasks() {
    console.log('\n📋 Testing listTasks...');
    
    const result = core.listTasks(this.workspaceRoot, { format: 'human' });
    return this.measureResponseSize('listTasks', result);
  }

  async testPriorityOperations() {
    console.log('\n⚡ Testing priority operations...');
    
    // Test priority bump
    console.log('Testing bumpTaskPriority...');
    const tasksData = core.readTasks(this.workspaceRoot);
    const task = tasksData.tasks.find(t => t.id === 37);
    
    if (task) {
      const oldPriority = task.priority;
      const amount = 25;
      const newPriority = Math.min(1000, task.priority + amount);
      
      // Simulate the MCP server logic
      task.priority = newPriority;
      task.updatedAt = new Date().toISOString();
      
      // Add smart activity log entry
      if (!task.activityLog) task.activityLog = [];
      const priorityDelta = Math.abs(newPriority - oldPriority);
      
      if (priorityDelta >= 10) {
        task.activityLog.push({
          timestamp: new Date().toISOString(),
          type: 'log',
          message: `Priority bumped to ${newPriority} (+${amount})`
        });
      }
      
      // Write with optimized options
      core.writeTasks(this.workspaceRoot, tasksData, { 
        recalculatePriorities: false, 
        skipTableUpdate: true 
      });
      
      const result = { 
        success: true, 
        message: `Task 37 priority bumped from ${oldPriority} to ${newPriority}`,
        oldPriority,
        newPriority,
        priorityDelta
      };
      
      return this.measureResponseSize('bumpTaskPriority', result);
    }
    
    return { size: 0, patterns: {}, response: { success: false, message: 'Task not found' } };
  }

  async testUpdateStatus() {
    console.log('\n🔄 Testing updateStatus...');
    
    // Test the optimized updateStatus logic
    const tasksData = core.readTasks(this.workspaceRoot);
    const task = tasksData.tasks.find(t => t.id === 38);
    
    if (task) {
      const oldStatus = task.status;
      const newStatus = 'inprogress';
      
      // Update relatedFiles and status in single operation
      task.relatedFiles = ['test1.js', 'test2.js'];
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      
      // Add activity log
      if (!task.activityLog) task.activityLog = [];
      task.activityLog.push({
        timestamp: new Date().toISOString(),
        type: 'log',
        message: `Status changed from "${oldStatus}" to "${newStatus}". Related files updated.`
      });
      
      // Single write operation
      core.writeTasks(this.workspaceRoot, tasksData, { 
        recalculatePriorities: false, 
        updateTable: true 
      });
      
      const result = { 
        success: true, 
        message: `Status of task 38 updated to ${newStatus}`,
        oldStatus,
        newStatus,
        relatedFiles: task.relatedFiles
      };
      
      return this.measureResponseSize('updateStatus', result);
    }
    
    return { size: 0, patterns: {}, response: { success: false, message: 'Task not found' } };
  }

  async testRecalculatePriorities() {
    console.log('\n🧮 Testing recalculatePriorities...');
    
    const result = core.recalculatePriorities(this.workspaceRoot, {
      applyDependencyBoosts: true,
      optimizeDistribution: true
    });
    
    return this.measureResponseSize('recalculatePriorities', result);
  }

  async testPriorityLoggingConfig() {
    console.log('\n⚙️ Testing priority logging configuration...');
    
    // Test getting current config
    const currentConfig = core.getPriorityLoggingConfig();
    console.log('Current config:', currentConfig);
    
    // Test setting reduced logging
    const newConfig = core.configurePriorityLogging({
      enabled: true,
      minSignificantDelta: 50,
      minMcpDelta: 10,
      consolidateWindow: 60000
    });
    
    console.log('New config:', newConfig);
    
    return this.measureResponseSize('priorityLoggingConfig', { currentConfig, newConfig });
  }

  checkTasksJsonSize() {
    console.log('\n📁 Checking tasks.json file size...');
    
    const tasksJsonPath = `${this.workspaceRoot}/.acf/tasks.json`;
    const stats = fs.statSync(tasksJsonPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`📏 tasks.json size: ${sizeKB} KB (${stats.size} bytes)`);
    
    // Read and analyze content
    const content = fs.readFileSync(tasksJsonPath, 'utf8');
    const priorityLogCount = (content.match(/Priority.*adjust|Priority.*boost|Priority.*update/gi) || []).length;
    const activityLogCount = (content.match(/"activityLog"/g) || []).length;
    const totalLogEntries = (content.match(/"timestamp":/g) || []).length;
    
    console.log(`🔍 Content analysis:`);
    console.log(`   - Priority-related logs: ${priorityLogCount}`);
    console.log(`   - Activity log arrays: ${activityLogCount}`);
    console.log(`   - Total log entries: ${totalLogEntries}`);
    
    return {
      sizeBytes: stats.size,
      sizeKB: parseFloat(sizeKB),
      priorityLogCount,
      activityLogCount,
      totalLogEntries
    };
  }

  generateReport(results) {
    console.log('\n📊 RESPONSE SIZE & DUPLICATION ANALYSIS');
    console.log('========================================');
    
    const totalResponseSize = Object.values(results.tests).reduce((sum, test) => sum + test.size, 0);
    
    console.log('\n📏 RESPONSE SIZES:');
    Object.entries(results.tests).forEach(([test, data]) => {
      console.log(`   ${test}: ${data.size} chars`);
    });
    console.log(`   Total: ${totalResponseSize} chars`);
    
    console.log('\n🔍 DUPLICATION ANALYSIS:');
    Object.entries(results.tests).forEach(([test, data]) => {
      if (data.patterns['tasks arrays'] > 1) {
        console.log(`   ⚠️  ${test}: Multiple tasks arrays (${data.patterns['tasks arrays']})`);
      } else {
        console.log(`   ✅ ${test}: Single tasks array`);
      }
    });
    
    console.log('\n📝 PRIORITY LOGGING ANALYSIS:');
    const totalPriorityLogs = Object.values(results.tests).reduce((sum, test) => 
      sum + (test.patterns['priority logs'] || 0), 0);
    
    console.log(`   Total priority logs in responses: ${totalPriorityLogs}`);
    console.log(`   Priority logs in tasks.json: ${results.fileAnalysis.priorityLogCount}`);
    console.log(`   Total log entries in tasks.json: ${results.fileAnalysis.totalLogEntries}`);
    
    console.log('\n📁 FILE SIZE ANALYSIS:');
    console.log(`   tasks.json size: ${results.fileAnalysis.sizeKB} KB`);
    console.log(`   Size per task: ${(results.fileAnalysis.sizeBytes / 57).toFixed(0)} bytes`);
    
    console.log('\n🎯 SUCCESS METRICS:');
    const metrics = {
      responseSizeReasonable: totalResponseSize < 20000,
      noDuplication: Object.values(results.tests).every(test => test.patterns['tasks arrays'] <= 1),
      priorityLoggingControlled: totalPriorityLogs < 10,
      fileSizeReasonable: results.fileAnalysis.sizeKB < 500
    };
    
    Object.entries(metrics).forEach(([metric, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${metric}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    const overallSuccess = Object.values(metrics).every(Boolean);
    console.log(`\n🏆 Overall Assessment: ${overallSuccess ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
    
    return { ...results, metrics, overallSuccess, totalResponseSize, totalPriorityLogs };
  }

  async run() {
    try {
      console.log('🔍 Testing MCP response sizes and duplication elimination...');
      
      const tests = {
        listTasks: await this.testListTasks(),
        priorityOps: await this.testPriorityOperations(),
        updateStatus: await this.testUpdateStatus(),
        recalcPriorities: await this.testRecalculatePriorities(),
        priorityConfig: await this.testPriorityLoggingConfig()
      };
      
      const fileAnalysis = this.checkTasksJsonSize();
      
      const results = { tests, fileAnalysis };
      const report = this.generateReport(results);
      
      return report;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new SimpleResponseTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 Response test completed: ${report.overallSuccess ? 'SUCCESS' : 'NEEDS IMPROVEMENT'}`);
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Response test failed:', error);
      process.exit(1);
    });
}

module.exports = SimpleResponseTest;
