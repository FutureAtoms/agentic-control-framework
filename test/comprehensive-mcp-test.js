#!/usr/bin/env node

/**
 * Comprehensive MCP Tool Response Test
 * Tests all MCP tools in a clean test workspace to identify any remaining issues
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../src/core');

class ComprehensiveMcpTest {
  constructor() {
    this.testWorkspace = path.join(os.tmpdir(), 'acf-comprehensive-mcp-test-' + Date.now());
    this.results = {};
    this.issues = [];
  }

  async setup() {
    console.log('🔧 Setting up comprehensive test workspace...');
    
    // Create test workspace
    if (!fs.existsSync(this.testWorkspace)) {
      fs.mkdirSync(this.testWorkspace, { recursive: true });
    }
    
    // Initialize project
    const initResult = core.initProject(this.testWorkspace, {
      projectName: 'Comprehensive MCP Test',
      projectDescription: 'Testing all MCP tools for response analysis'
    });
    
    if (!initResult.success) {
      throw new Error(`Failed to initialize test project: ${initResult.message}`);
    }
    
    // Add diverse test tasks with various configurations
    const testTasks = [
      {
        title: 'High Priority Task',
        description: 'Critical task with dependencies',
        priority: 'critical',
        relatedFiles: 'critical.js,urgent.js',
        dependsOn: ''
      },
      {
        title: 'Medium Priority Task',
        description: 'Standard task with some files',
        priority: 'medium',
        relatedFiles: 'standard.js',
        dependsOn: '1'
      },
      {
        title: 'Low Priority Task',
        description: 'Simple task',
        priority: 'low',
        relatedFiles: '',
        dependsOn: '1,2'
      },
      {
        title: 'Complex Task with Long Description',
        description: 'This is a very long description that contains multiple sentences and should test how the system handles longer text content. It includes various details about implementation requirements, testing needs, and documentation updates that might be needed.',
        priority: 500,
        relatedFiles: 'complex1.js,complex2.js,complex3.js,test1.spec.js,test2.spec.js',
        dependsOn: ''
      },
      {
        title: 'Task with Special Characters & Symbols',
        description: 'Testing special chars: @#$%^&*()[]{}|\\:";\'<>?,./',
        priority: 750,
        relatedFiles: 'special-chars.js,symbols@test.js',
        dependsOn: '4'
      }
    ];
    
    for (const task of testTasks) {
      const result = core.addTask(this.testWorkspace, task);
      if (!result.success) {
        console.warn(`⚠️ Failed to add task: ${task.title}`);
      }
    }
    
    console.log('✅ Test workspace setup complete');
    return { workspace: this.testWorkspace, tasksAdded: testTasks.length };
  }

  measureResponse(toolName, result, startTime) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const responseText = JSON.stringify(result);
    const responseSize = responseText.length;
    
    // Analyze response patterns
    const patterns = {
      'success': result.success !== false,
      'has_content': !!(result.content || result.message || result.tasks),
      'response_size': responseSize,
      'response_time': responseTime,
      'tasks_arrays': (responseText.match(/"tasks":\[/g) || []).length,
      'activity_logs': (responseText.match(/activityLog/g) || []).length,
      'priority_logs': (responseText.match(/Priority.*adjust|Priority.*boost|Priority.*update/gi) || []).length,
      'error_indicators': (responseText.match(/error|fail|exception/gi) || []).length,
      'large_response': responseSize > 10000,
      'slow_response': responseTime > 1000
    };
    
    // Check for potential issues
    const issues = [];
    if (!patterns.success) issues.push('Operation failed');
    if (patterns.large_response) issues.push(`Large response (${responseSize} chars)`);
    if (patterns.slow_response) issues.push(`Slow response (${responseTime}ms)`);
    if (patterns.tasks_arrays > 1) issues.push('Multiple task arrays (duplication)');
    if (patterns.priority_logs > 5) issues.push('Excessive priority logging');
    if (patterns.error_indicators > 0) issues.push('Error indicators in response');
    
    console.log(`📏 ${toolName}: ${responseSize} chars, ${responseTime}ms ${issues.length > 0 ? '⚠️' : '✅'}`);
    if (issues.length > 0) {
      console.log(`   Issues: ${issues.join(', ')}`);
      this.issues.push({ tool: toolName, issues });
    }
    
    return {
      toolName,
      result,
      patterns,
      issues,
      responseText: responseSize > 1000 ? responseText.substring(0, 1000) + '...' : responseText
    };
  }

  async testCoreOperations() {
    console.log('\n📋 Testing Core Operations...');
    
    const tests = [];
    
    // Test listTasks with different formats
    let startTime = Date.now();
    let result = core.listTasks(this.testWorkspace, { format: 'json' });
    tests.push(this.measureResponse('listTasks_json', result, startTime));
    
    startTime = Date.now();
    result = core.listTasks(this.testWorkspace, { format: 'human' });
    tests.push(this.measureResponse('listTasks_human', result, startTime));
    
    startTime = Date.now();
    result = core.listTasks(this.testWorkspace, { format: 'table' });
    tests.push(this.measureResponse('listTasks_table', result, startTime));
    
    // Test with status filter
    startTime = Date.now();
    result = core.listTasks(this.testWorkspace, { status: 'todo' });
    tests.push(this.measureResponse('listTasks_filtered', result, startTime));
    
    return tests;
  }

  async testTaskManagement() {
    console.log('\n📝 Testing Task Management...');
    
    const tests = [];
    
    // Test addTask
    let startTime = Date.now();
    let result = core.addTask(this.testWorkspace, {
      title: 'New Test Task',
      description: 'Added during testing',
      priority: 'high',
      relatedFiles: 'test.js'
    });
    tests.push(this.measureResponse('addTask', result, startTime));
    
    // Test updateTask
    startTime = Date.now();
    result = core.updateTask(this.testWorkspace, '1', {
      title: 'Updated Task Title',
      priority: 850
    });
    tests.push(this.measureResponse('updateTask', result, startTime));
    
    // Test updateStatus
    startTime = Date.now();
    result = core.updateStatus(this.testWorkspace, '2', 'inprogress', 'Starting work');
    tests.push(this.measureResponse('updateStatus', result, startTime));
    
    // Test addSubtask
    startTime = Date.now();
    result = core.addSubtask(this.testWorkspace, 1, {
      title: 'Test Subtask',
      relatedFiles: 'subtask.js'
    });
    tests.push(this.measureResponse('addSubtask', result, startTime));
    
    // Test removeTask
    startTime = Date.now();
    result = core.removeTask(this.testWorkspace, '6');
    tests.push(this.measureResponse('removeTask', result, startTime));
    
    return tests;
  }

  async testPriorityOperations() {
    console.log('\n⚡ Testing Priority Operations...');
    
    const tests = [];
    
    // Test priority bump/defer operations
    const priorityOps = [
      { op: 'bump', id: '1', amount: 50 },
      { op: 'defer', id: '2', amount: 25 },
      { op: 'bump', id: '3', amount: 100 },
      { op: 'defer', id: '4', amount: 75 }
    ];
    
    for (const { op, id, amount } of priorityOps) {
      const startTime = Date.now();
      
      // Simulate MCP server priority operations
      const tasksData = core.readTasks(this.testWorkspace);
      const task = tasksData.tasks.find(t => t.id === parseInt(id));
      
      if (task) {
        const oldPriority = task.priority;
        const newPriority = op === 'bump' 
          ? Math.min(1000, task.priority + amount)
          : Math.max(1, task.priority - amount);
        
        task.priority = newPriority;
        task.updatedAt = new Date().toISOString();
        
        // Add smart activity log entry
        if (!task.activityLog) task.activityLog = [];
        const priorityDelta = Math.abs(newPriority - oldPriority);
        
        if (priorityDelta >= 10) {
          task.activityLog.push({
            timestamp: new Date().toISOString(),
            type: 'log',
            message: `Priority ${op}ed to ${newPriority} (${op === 'bump' ? '+' : '-'}${amount})`
          });
        }
        
        core.writeTasks(this.testWorkspace, tasksData, { 
          recalculatePriorities: false, 
          skipTableUpdate: true 
        });
        
        const result = { 
          success: true, 
          message: `Task ${id} priority ${op}ed from ${oldPriority} to ${newPriority}`,
          oldPriority,
          newPriority,
          priorityDelta
        };
        
        tests.push(this.measureResponse(`${op}TaskPriority_${id}`, result, startTime));
      }
    }
    
    // Test priority recalculation
    let startTime = Date.now();
    let result = core.recalculatePriorities(this.testWorkspace, {
      applyDependencyBoosts: true,
      optimizeDistribution: true
    });
    tests.push(this.measureResponse('recalculatePriorities', result, startTime));
    
    // Test priority statistics
    startTime = Date.now();
    result = core.getPriorityStatistics(this.testWorkspace);
    tests.push(this.measureResponse('getPriorityStatistics', result, startTime));
    
    return tests;
  }

  async testAdvancedFeatures() {
    console.log('\n🔧 Testing Advanced Features...');
    
    const tests = [];
    
    // Test file generation
    let startTime = Date.now();
    let result = core.generateTaskFiles(this.testWorkspace);
    tests.push(this.measureResponse('generateTaskFiles', result, startTime));
    
    // Test table generation
    startTime = Date.now();
    result = core.generateHumanReadableTaskTable(this.testWorkspace);
    tests.push(this.measureResponse('generateTaskTable', result, startTime));
    
    // Test dependency analysis
    startTime = Date.now();
    result = core.getDependencyAnalysis(this.testWorkspace);
    tests.push(this.measureResponse('getDependencyAnalysis', result, startTime));
    
    // Test next task
    startTime = Date.now();
    result = core.getNextTask(this.testWorkspace);
    tests.push(this.measureResponse('getNextTask', result, startTime));
    
    // Test context retrieval
    startTime = Date.now();
    result = core.getContext(this.testWorkspace, '1');
    tests.push(this.measureResponse('getContext', result, startTime));
    
    return tests;
  }

  async testConfigurationAndUtilities() {
    console.log('\n⚙️ Testing Configuration & Utilities...');
    
    const tests = [];
    
    // Test priority logging configuration
    let startTime = Date.now();
    let result = core.configurePriorityLogging({
      enabled: true,
      minSignificantDelta: 25,
      consolidateWindow: 30000
    });
    tests.push(this.measureResponse('configurePriorityLogging', result, startTime));
    
    // Test getting priority config
    startTime = Date.now();
    result = core.getPriorityLoggingConfig();
    tests.push(this.measureResponse('getPriorityLoggingConfig', result, startTime));
    
    // Test advanced algorithm config
    startTime = Date.now();
    result = core.getAdvancedAlgorithmConfig();
    tests.push(this.measureResponse('getAdvancedAlgorithmConfig', result, startTime));
    
    // Test priority templates
    startTime = Date.now();
    result = core.getPriorityTemplates();
    tests.push(this.measureResponse('getPriorityTemplates', result, startTime));
    
    // Test template suggestion
    startTime = Date.now();
    result = core.suggestPriorityTemplate('Bug Fix', 'Critical bug in production system');
    tests.push(this.measureResponse('suggestPriorityTemplate', result, startTime));
    
    return tests;
  }

  analyzeWorkspaceState() {
    console.log('\n📊 Analyzing Final Workspace State...');
    
    const tasksJsonPath = path.join(this.testWorkspace, '.acf', 'tasks.json');
    const stats = fs.statSync(tasksJsonPath);
    const content = fs.readFileSync(tasksJsonPath, 'utf8');
    const tasksData = JSON.parse(content);
    
    const analysis = {
      fileSize: {
        bytes: stats.size,
        kb: (stats.size / 1024).toFixed(2)
      },
      tasks: {
        total: tasksData.tasks.length,
        withSubtasks: tasksData.tasks.filter(t => t.subtasks && t.subtasks.length > 0).length,
        withDependencies: tasksData.tasks.filter(t => t.dependsOn && t.dependsOn.length > 0).length
      },
      logs: {
        total: tasksData.tasks.reduce((sum, t) => sum + (t.activityLog ? t.activityLog.length : 0), 0),
        priority: (content.match(/Priority.*adjust|Priority.*boost|Priority.*update/gi) || []).length,
        avgPerTask: 0
      },
      priorities: {
        min: Math.min(...tasksData.tasks.map(t => t.priority)),
        max: Math.max(...tasksData.tasks.map(t => t.priority)),
        avg: Math.round(tasksData.tasks.reduce((sum, t) => sum + t.priority, 0) / tasksData.tasks.length)
      }
    };
    
    analysis.logs.avgPerTask = (analysis.logs.total / analysis.tasks.total).toFixed(1);
    
    console.log(`📁 File size: ${analysis.fileSize.kb} KB`);
    console.log(`📝 Tasks: ${analysis.tasks.total} (${analysis.tasks.withSubtasks} with subtasks, ${analysis.tasks.withDependencies} with dependencies)`);
    console.log(`📋 Logs: ${analysis.logs.total} total (${analysis.logs.priority} priority-related, ${analysis.logs.avgPerTask} avg/task)`);
    console.log(`⚡ Priorities: ${analysis.priorities.min}-${analysis.priorities.max} (avg: ${analysis.priorities.avg})`);
    
    return analysis;
  }

  generateComprehensiveReport(allTests, workspaceAnalysis) {
    console.log('\n📊 COMPREHENSIVE MCP TOOL ANALYSIS REPORT');
    console.log('==========================================');
    
    const allResults = allTests.flat();
    const totalTests = allResults.length;
    const successfulTests = allResults.filter(t => t.patterns.success).length;
    const failedTests = totalTests - successfulTests;
    
    // Response size analysis
    const responseSizes = allResults.map(t => t.patterns.response_size);
    const totalResponseSize = responseSizes.reduce((sum, size) => sum + size, 0);
    const avgResponseSize = Math.round(totalResponseSize / totalTests);
    const maxResponseSize = Math.max(...responseSizes);
    const largeResponses = allResults.filter(t => t.patterns.large_response);
    
    // Performance analysis
    const responseTimes = allResults.map(t => t.patterns.response_time);
    const avgResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / totalTests);
    const maxResponseTime = Math.max(...responseTimes);
    const slowResponses = allResults.filter(t => t.patterns.slow_response);
    
    // Issue analysis
    const allIssues = this.issues.flat();
    const issuesByType = {};
    allIssues.forEach(issue => {
      issue.issues.forEach(i => {
        issuesByType[i] = (issuesByType[i] || 0) + 1;
      });
    });
    
    console.log('\n📈 PERFORMANCE METRICS:');
    console.log(`   Total tests: ${totalTests}`);
    console.log(`   Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Avg response size: ${avgResponseSize} chars`);
    console.log(`   Max response size: ${maxResponseSize} chars`);
    console.log(`   Large responses (>10KB): ${largeResponses.length}`);
    console.log(`   Avg response time: ${avgResponseTime}ms`);
    console.log(`   Max response time: ${maxResponseTime}ms`);
    console.log(`   Slow responses (>1s): ${slowResponses.length}`);
    
    console.log('\n🔍 ISSUE ANALYSIS:');
    if (Object.keys(issuesByType).length === 0) {
      console.log('   ✅ No issues detected!');
    } else {
      Object.entries(issuesByType).forEach(([issue, count]) => {
        console.log(`   ⚠️  ${issue}: ${count} occurrences`);
      });
    }
    
    console.log('\n📁 WORKSPACE STATE:');
    console.log(`   File size: ${workspaceAnalysis.fileSize.kb} KB`);
    console.log(`   Tasks: ${workspaceAnalysis.tasks.total}`);
    console.log(`   Total logs: ${workspaceAnalysis.logs.total}`);
    console.log(`   Priority logs: ${workspaceAnalysis.logs.priority}`);
    console.log(`   Avg logs per task: ${workspaceAnalysis.logs.avgPerTask}`);
    
    console.log('\n🎯 QUALITY ASSESSMENT:');
    const qualityMetrics = {
      responsesSizeReasonable: avgResponseSize < 5000,
      responsesTimely: avgResponseTime < 500,
      noLargeResponses: largeResponses.length === 0,
      noSlowResponses: slowResponses.length === 0,
      highSuccessRate: (successfulTests/totalTests) > 0.95,
      reasonableFileSize: parseFloat(workspaceAnalysis.fileSize.kb) < 100,
      controlledLogging: workspaceAnalysis.logs.priority < 50
    };
    
    Object.entries(qualityMetrics).forEach(([metric, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${metric}: ${passed ? 'PASS' : 'FAIL'}`);
    });
    
    const overallQuality = Object.values(qualityMetrics).filter(Boolean).length / Object.keys(qualityMetrics).length;
    console.log(`\n🏆 Overall Quality Score: ${(overallQuality * 100).toFixed(1)}% (${overallQuality > 0.8 ? 'EXCELLENT' : overallQuality > 0.6 ? 'GOOD' : 'NEEDS IMPROVEMENT'})`);
    
    // Specific observations
    console.log('\n🔍 SPECIFIC OBSERVATIONS:');
    
    // Check for duplication patterns
    const duplicatedArrays = allResults.filter(t => t.patterns.tasks_arrays > 1);
    if (duplicatedArrays.length > 0) {
      console.log(`   ⚠️  Task array duplication detected in: ${duplicatedArrays.map(t => t.toolName).join(', ')}`);
    } else {
      console.log('   ✅ No task array duplication detected');
    }
    
    // Check priority logging
    const excessivePriorityLogs = allResults.filter(t => t.patterns.priority_logs > 5);
    if (excessivePriorityLogs.length > 0) {
      console.log(`   ⚠️  Excessive priority logging in: ${excessivePriorityLogs.map(t => t.toolName).join(', ')}`);
    } else {
      console.log('   ✅ Priority logging is well controlled');
    }
    
    // Check for error patterns
    const errorResponses = allResults.filter(t => t.patterns.error_indicators > 0);
    if (errorResponses.length > 0) {
      console.log(`   ⚠️  Error indicators found in: ${errorResponses.map(t => t.toolName).join(', ')}`);
    } else {
      console.log('   ✅ No error indicators in responses');
    }
    
    return {
      totalTests,
      successfulTests,
      failedTests,
      avgResponseSize,
      maxResponseSize,
      avgResponseTime,
      maxResponseTime,
      largeResponses: largeResponses.length,
      slowResponses: slowResponses.length,
      issuesByType,
      qualityMetrics,
      overallQuality,
      workspaceAnalysis,
      allResults
    };
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
      console.log('🚀 Starting Comprehensive MCP Tool Test...');
      
      await this.setup();
      
      const coreTests = await this.testCoreOperations();
      const taskTests = await this.testTaskManagement();
      const priorityTests = await this.testPriorityOperations();
      const advancedTests = await this.testAdvancedFeatures();
      const configTests = await this.testConfigurationAndUtilities();
      
      const allTests = [coreTests, taskTests, priorityTests, advancedTests, configTests];
      const workspaceAnalysis = this.analyzeWorkspaceState();
      
      const report = this.generateComprehensiveReport(allTests, workspaceAnalysis);
      
      await this.cleanup();
      
      return report;
    } catch (error) {
      console.error('❌ Comprehensive test failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new ComprehensiveMcpTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 Comprehensive MCP test completed: ${report.overallQuality > 0.8 ? 'EXCELLENT' : 'COMPLETED'}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Comprehensive MCP test failed:', error);
      process.exit(1);
    });
}

module.exports = ComprehensiveMcpTest;
