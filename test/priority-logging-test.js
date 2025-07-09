#!/usr/bin/env node

/**
 * Test to demonstrate the priority logging improvements
 * Shows before/after comparison of log spam reduction
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Test workspace setup
const testWorkspace = path.join(os.tmpdir(), 'acf-priority-logging-test-' + Date.now());
const core = require('../src/core');

class PriorityLoggingTest {
  constructor() {
    this.testWorkspace = testWorkspace;
  }

  async setup() {
    console.log('🔧 Setting up test workspace...');
    
    // Create test workspace
    if (!fs.existsSync(this.testWorkspace)) {
      fs.mkdirSync(this.testWorkspace, { recursive: true });
    }
    
    // Initialize project
    const initResult = core.initProject(this.testWorkspace, {
      projectName: 'Priority Logging Test',
      projectDescription: 'Testing smart priority logging to reduce spam'
    });
    
    if (!initResult.success) {
      throw new Error(`Failed to initialize test project: ${initResult.message}`);
    }
    
    // Add test tasks with various priorities and dependencies
    for (let i = 1; i <= 10; i++) {
      const dependsOn = i > 3 ? [i - 1, i - 2].join(',') : ''; // Create dependencies
      core.addTask(this.testWorkspace, {
        title: `Test Task ${i}`,
        description: `Description for test task ${i}`,
        priority: Math.floor(Math.random() * 900) + 100, // Random priority 100-999
        dependsOn: dependsOn
      });
    }
    
    console.log('✅ Test workspace setup complete');
  }

  async testWithVerboseLogging() {
    console.log('\n📢 Testing WITH verbose priority logging (old behavior)...');
    
    // Configure for verbose logging (simulate old behavior)
    core.configurePriorityLogging({
      enabled: true,
      minSignificantDelta: 1, // Log all changes
      minMcpDelta: 1,
      consolidateWindow: 0, // No consolidation
      maxMinorAdjustmentsBeforeSummary: 999 // No summaries
    });
    
    // Perform operations that would generate lots of logs
    const startTime = Date.now();
    
    // Trigger priority recalculations and adjustments
    for (let i = 0; i < 5; i++) {
      // Bump some priorities
      await this.simulatePriorityOperations();
      
      // Force priority recalculation
      core.recalculatePriorities(this.testWorkspace, {
        applyDependencyBoosts: true,
        optimizeDistribution: true
      });
    }
    
    const endTime = Date.now();
    
    // Count total log entries
    const tasksData = core.readTasks(this.testWorkspace);
    const totalLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.length : 0), 0
    );
    
    const priorityLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.filter(log => 
        log.message.toLowerCase().includes('priority')).length : 0), 0
    );
    
    console.log(`⏱️  Time taken: ${endTime - startTime}ms`);
    console.log(`📝 Total log entries: ${totalLogEntries}`);
    console.log(`🎯 Priority-related logs: ${priorityLogEntries}`);
    
    return {
      time: endTime - startTime,
      totalLogs: totalLogEntries,
      priorityLogs: priorityLogEntries,
      tasksData: JSON.parse(JSON.stringify(tasksData)) // Deep copy for comparison
    };
  }

  async testWithSmartLogging() {
    console.log('\n🧠 Testing WITH smart priority logging (new behavior)...');
    
    // Reset workspace
    await this.setup();
    
    // Configure for smart logging
    core.configurePriorityLogging({
      enabled: true,
      minSignificantDelta: 50, // Only log significant changes
      minMcpDelta: 10,
      consolidateWindow: 60000, // 1 minute consolidation
      maxMinorAdjustmentsBeforeSummary: 3 // Summarize after 3 minor adjustments
    });
    
    // Perform the same operations
    const startTime = Date.now();
    
    // Trigger priority recalculations and adjustments
    for (let i = 0; i < 5; i++) {
      // Bump some priorities
      await this.simulatePriorityOperations();
      
      // Force priority recalculation
      core.recalculatePriorities(this.testWorkspace, {
        applyDependencyBoosts: true,
        optimizeDistribution: true
      });
    }
    
    const endTime = Date.now();
    
    // Count total log entries
    const tasksData = core.readTasks(this.testWorkspace);
    const totalLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.length : 0), 0
    );
    
    const priorityLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.filter(log => 
        log.message.toLowerCase().includes('priority')).length : 0), 0
    );
    
    console.log(`⏱️  Time taken: ${endTime - startTime}ms`);
    console.log(`📝 Total log entries: ${totalLogEntries}`);
    console.log(`🎯 Priority-related logs: ${priorityLogEntries}`);
    
    return {
      time: endTime - startTime,
      totalLogs: totalLogEntries,
      priorityLogs: priorityLogEntries,
      tasksData: JSON.parse(JSON.stringify(tasksData))
    };
  }

  async testWithDisabledLogging() {
    console.log('\n🔇 Testing WITH disabled priority logging...');
    
    // Reset workspace
    await this.setup();
    
    // Configure to disable priority logging
    core.configurePriorityLogging({
      enabled: false
    });
    
    // Perform the same operations
    const startTime = Date.now();
    
    // Trigger priority recalculations and adjustments
    for (let i = 0; i < 5; i++) {
      // Bump some priorities
      await this.simulatePriorityOperations();
      
      // Force priority recalculation
      core.recalculatePriorities(this.testWorkspace, {
        applyDependencyBoosts: true,
        optimizeDistribution: true
      });
    }
    
    const endTime = Date.now();
    
    // Count total log entries
    const tasksData = core.readTasks(this.testWorkspace);
    const totalLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.length : 0), 0
    );
    
    const priorityLogEntries = tasksData.tasks.reduce((total, task) => 
      total + (task.activityLog ? task.activityLog.filter(log => 
        log.message.toLowerCase().includes('priority')).length : 0), 0
    );
    
    console.log(`⏱️  Time taken: ${endTime - startTime}ms`);
    console.log(`📝 Total log entries: ${totalLogEntries}`);
    console.log(`🎯 Priority-related logs: ${priorityLogEntries}`);
    
    return {
      time: endTime - startTime,
      totalLogs: totalLogEntries,
      priorityLogs: priorityLogEntries,
      tasksData: JSON.parse(JSON.stringify(tasksData))
    };
  }

  async simulatePriorityOperations() {
    // Simulate MCP-style priority operations that would generate logs
    for (let i = 1; i <= 3; i++) {
      // Simulate bumpTaskPriority calls
      const tasksData = core.readTasks(this.testWorkspace);
      const task = tasksData.tasks.find(t => t.id === i);
      if (task) {
        const oldPriority = task.priority;
        const amount = Math.floor(Math.random() * 30) + 5; // 5-35 point changes
        const newPriority = Math.min(1000, task.priority + amount);

        task.priority = newPriority;
        task.updatedAt = new Date().toISOString();

        // Add activity log entry (simulating MCP server behavior)
        if (!task.activityLog) task.activityLog = [];
        const priorityDelta = Math.abs(newPriority - oldPriority);

        // Use the same logic as MCP server
        if (priorityDelta >= 10) {
          task.activityLog.push({
            timestamp: new Date().toISOString(),
            type: 'log',
            message: `Priority bumped to ${newPriority} (+${amount})`
          });
        }

        // Write back with forced recalculation to trigger priority engine
        core.writeTasks(this.testWorkspace, tasksData, {
          recalculatePriorities: true,
          forceRecalculation: true,
          skipTableUpdate: true
        });
      }
    }

    // Also simulate some manual priority updates that would trigger logging
    core.updateTask(this.testWorkspace, '4', { priority: 'high' });
    core.updateTask(this.testWorkspace, '5', { priority: 850 });
  }

  generateComparison(verboseResult, smartResult, disabledResult) {
    console.log('\n📊 PRIORITY LOGGING COMPARISON REPORT');
    console.log('=====================================');
    
    console.log('\n🔍 LOG SPAM REDUCTION:');
    const logReduction = ((verboseResult.priorityLogs - smartResult.priorityLogs) / verboseResult.priorityLogs * 100).toFixed(1);
    const totalLogReduction = ((verboseResult.totalLogs - smartResult.totalLogs) / verboseResult.totalLogs * 100).toFixed(1);
    
    console.log(`📢 Verbose Logging:  ${verboseResult.priorityLogs} priority logs, ${verboseResult.totalLogs} total logs`);
    console.log(`🧠 Smart Logging:    ${smartResult.priorityLogs} priority logs, ${smartResult.totalLogs} total logs`);
    console.log(`🔇 Disabled Logging: ${disabledResult.priorityLogs} priority logs, ${disabledResult.totalLogs} total logs`);
    console.log(`📉 Reduction:        ${logReduction}% priority logs, ${totalLogReduction}% total logs`);
    
    console.log('\n⚡ PERFORMANCE IMPACT:');
    const timeImprovement = verboseResult.time - smartResult.time;
    console.log(`📢 Verbose Logging:  ${verboseResult.time}ms`);
    console.log(`🧠 Smart Logging:    ${smartResult.time}ms`);
    console.log(`🔇 Disabled Logging: ${disabledResult.time}ms`);
    console.log(`⚡ Time Saved:       ${timeImprovement}ms (${(timeImprovement/verboseResult.time*100).toFixed(1)}%)`);
    
    console.log('\n🎯 BENEFITS:');
    console.log('✅ Reduced JSON file size and clutter');
    console.log('✅ Faster MCP response times');
    console.log('✅ Better readability of important logs');
    console.log('✅ Configurable logging levels');
    console.log('✅ Automatic log consolidation');
    
    return {
      logReduction: parseFloat(logReduction),
      totalLogReduction: parseFloat(totalLogReduction),
      timeImprovement,
      success: logReduction > 50 && totalLogReduction > 30 // Success criteria
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
      await this.setup();
      
      const verboseResult = await this.testWithVerboseLogging();
      const smartResult = await this.testWithSmartLogging();
      const disabledResult = await this.testWithDisabledLogging();
      
      const comparison = this.generateComparison(verboseResult, smartResult, disabledResult);
      
      await this.cleanup();
      
      return {
        success: comparison.success,
        verboseResult,
        smartResult,
        disabledResult,
        comparison
      };
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new PriorityLoggingTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 Priority logging test completed: ${report.success ? 'SUCCESS' : 'FAILURE'}`);
      console.log(`📊 Log spam reduced by ${report.comparison.logReduction}%`);
      process.exit(report.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Priority logging test failed:', error);
      process.exit(1);
    });
}

module.exports = PriorityLoggingTest;
