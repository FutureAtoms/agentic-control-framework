#!/usr/bin/env node

/**
 * Task Table Format Test
 * Tests the new compact task table format across various scenarios
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../src/core');

class TaskTableFormatTest {
  constructor() {
    this.testWorkspaces = [];
    this.results = [];
  }

  async createTestWorkspace(name, description) {
    const workspace = path.join(os.tmpdir(), `acf-table-test-${name}-${Date.now()}`);
    
    if (!fs.existsSync(workspace)) {
      fs.mkdirSync(workspace, { recursive: true });
    }
    
    // Initialize project
    const initResult = core.initProject(workspace, {
      projectName: `Table Test: ${name}`,
      projectDescription: description
    });
    
    if (!initResult.success) {
      throw new Error(`Failed to initialize test workspace: ${initResult.message}`);
    }
    
    this.testWorkspaces.push(workspace);
    return workspace;
  }

  async testEmptyProject() {
    console.log('\n📋 Testing Empty Project...');
    
    const workspace = await this.createTestWorkspace('Empty', 'Project with no tasks');
    
    // Generate task table
    const result = core.generateHumanReadableTaskTable(workspace, { force: true });
    
    // Read the generated table
    const tablePath = path.join(workspace, 'tasks-table.md');
    const tableContent = fs.readFileSync(tablePath, 'utf8');
    
    console.log('Generated table for empty project:');
    console.log('---');
    console.log(tableContent);
    console.log('---');
    
    return {
      scenario: 'Empty Project',
      workspace,
      result,
      tableContent,
      issues: this.analyzeTableContent(tableContent, 'empty')
    };
  }

  async testBasicProject() {
    console.log('\n📋 Testing Basic Project...');
    
    const workspace = await this.createTestWorkspace('Basic', 'Project with basic task variety');
    
    // Add diverse tasks
    const tasks = [
      { title: 'Critical Bug Fix', description: 'Fix production issue', priority: 'critical' },
      { title: 'High Priority Feature', description: 'Important new feature', priority: 'high' },
      { title: 'Medium Task', description: 'Standard development task', priority: 'medium' },
      { title: 'Low Priority Enhancement', description: 'Nice to have improvement', priority: 'low' }
    ];
    
    for (const task of tasks) {
      core.addTask(workspace, task);
    }
    
    // Update some task statuses
    core.updateStatus(workspace, '2', 'inprogress');
    core.updateStatus(workspace, '3', 'done');
    core.updateStatus(workspace, '4', 'blocked');
    
    // Generate task table
    const result = core.generateHumanReadableTaskTable(workspace, { force: true });
    
    // Read the generated table
    const tablePath = path.join(workspace, 'tasks-table.md');
    const tableContent = fs.readFileSync(tablePath, 'utf8');
    
    console.log('Generated table for basic project:');
    console.log('---');
    console.log(tableContent.substring(0, 500) + '...');
    console.log('---');
    
    return {
      scenario: 'Basic Project',
      workspace,
      result,
      tableContent,
      issues: this.analyzeTableContent(tableContent, 'basic')
    };
  }

  async testComplexProject() {
    console.log('\n📋 Testing Complex Project...');
    
    const workspace = await this.createTestWorkspace('Complex', 'Project with complex scenarios');
    
    // Add many tasks with various priorities and statuses
    const tasks = [
      { title: 'Critical Task 1', description: 'Critical issue 1', priority: 950 },
      { title: 'Critical Task 2', description: 'Critical issue 2', priority: 920 },
      { title: 'High Priority Task 1', description: 'High priority work', priority: 800 },
      { title: 'High Priority Task 2', description: 'Another high priority', priority: 750 },
      { title: 'Medium Task 1', description: 'Medium priority work', priority: 600 },
      { title: 'Medium Task 2', description: 'Another medium task', priority: 550 },
      { title: 'Low Task 1', description: 'Low priority work', priority: 300 },
      { title: 'Low Task 2', description: 'Another low task', priority: 200 },
      { title: 'Very Low Task', description: 'Very low priority', priority: 100 }
    ];
    
    for (const task of tasks) {
      core.addTask(workspace, task);
    }
    
    // Add subtasks to some tasks
    core.addSubtask(workspace, 2, { title: 'Subtask 1', relatedFiles: 'sub1.js' });
    core.addSubtask(workspace, 2, { title: 'Subtask 2', relatedFiles: 'sub2.js' });
    core.addSubtask(workspace, 5, { title: 'Another Subtask', relatedFiles: 'sub3.js' });
    
    // Update various statuses
    core.updateStatus(workspace, '2', 'done');
    core.updateStatus(workspace, '3', 'done');
    core.updateStatus(workspace, '4', 'inprogress');
    core.updateStatus(workspace, '5', 'testing');
    core.updateStatus(workspace, '6', 'blocked');
    core.updateStatus(workspace, '7', 'error');
    
    // Generate task table
    const result = core.generateHumanReadableTaskTable(workspace, { force: true });
    
    // Read the generated table
    const tablePath = path.join(workspace, 'tasks-table.md');
    const tableContent = fs.readFileSync(tablePath, 'utf8');
    
    console.log('Generated table for complex project:');
    console.log('---');
    console.log(tableContent.substring(0, 800) + '...');
    console.log('---');
    
    return {
      scenario: 'Complex Project',
      workspace,
      result,
      tableContent,
      issues: this.analyzeTableContent(tableContent, 'complex')
    };
  }

  async testEdgeCases() {
    console.log('\n📋 Testing Edge Cases...');
    
    const workspace = await this.createTestWorkspace('EdgeCases', 'Project with edge case scenarios');
    
    // Add tasks with edge case scenarios
    const tasks = [
      { 
        title: 'Task with Very Long Title That Should Be Truncated Properly in the Table Display', 
        description: 'This is a very long description that contains multiple sentences and should test how the system handles longer text content. It includes various details about implementation requirements, testing needs, and documentation updates that might be needed for this particular task.',
        priority: 999 
      },
      { 
        title: 'Special Characters & Symbols', 
        description: 'Testing: @#$%^&*()[]{}|\\:";\'<>?,./', 
        priority: 1 
      },
      { 
        title: 'Unicode Test 🚀🎯✨', 
        description: 'Testing unicode characters: 中文 العربية русский', 
        priority: 500 
      }
    ];
    
    for (const task of tasks) {
      core.addTask(workspace, task);
    }
    
    // Test all possible statuses
    core.updateStatus(workspace, '2', 'done');
    core.updateStatus(workspace, '3', 'testing');
    
    // Generate task table
    const result = core.generateHumanReadableTaskTable(workspace, { force: true });
    
    // Read the generated table
    const tablePath = path.join(workspace, 'tasks-table.md');
    const tableContent = fs.readFileSync(tablePath, 'utf8');
    
    console.log('Generated table for edge cases:');
    console.log('---');
    console.log(tableContent);
    console.log('---');
    
    return {
      scenario: 'Edge Cases',
      workspace,
      result,
      tableContent,
      issues: this.analyzeTableContent(tableContent, 'edge')
    };
  }

  analyzeTableContent(content, scenario) {
    const issues = [];
    
    // Check for quote box format
    if (!content.includes('> ## 📈 Project Summary')) {
      issues.push('Missing quote box format for project summary');
    }
    
    // Check for progress bar
    if (!content.includes('**Progress**:') || !content.includes('`')) {
      issues.push('Missing or malformed progress bar');
    }
    
    // Check for priority distribution
    if (!content.includes('**Priorities**:')) {
      issues.push('Missing priority distribution');
    }
    
    // Check for priority names
    const priorityLine = content.match(/\*\*Priorities\*\*:.*$/m);
    if (priorityLine) {
      const line = priorityLine[0];
      if (!line.includes('**Critical**:') || !line.includes('**High**:') || 
          !line.includes('**Medium**:') || !line.includes('**Low**:')) {
        issues.push('Missing priority names in distribution');
      }
    }
    
    // Check for redundant sections
    if (content.includes('### Priority Distribution') || 
        content.includes('Priority Distribution Chart:')) {
      issues.push('Contains redundant priority distribution sections');
    }
    
    // Check for redundant tables
    if (content.match(/\| Priority \| Count \| Percentage \|/)) {
      issues.push('Contains redundant priority percentage table');
    }
    
    // Check for proper task table
    if (!content.includes('## Tasks') || !content.includes('| ID | Status | Priority |')) {
      issues.push('Missing or malformed task table');
    }
    
    // Check for emoji indicators
    if (!content.includes('🚨') || !content.includes('🔴') || 
        !content.includes('🟡') || !content.includes('🟢')) {
      issues.push('Missing priority emoji indicators');
    }
    
    // Check for status emojis
    if (!content.includes('✅') || !content.includes('⬜')) {
      issues.push('Missing status emoji indicators');
    }
    
    // Scenario-specific checks
    if (scenario === 'empty') {
      // Empty project should still have proper structure
      if (!content.includes('0/1 tasks')) {
        issues.push('Empty project should show 0/1 task count');
      }
    }
    
    if (scenario === 'complex') {
      // Complex project should show various statuses
      if (!content.includes('🔬 Testing') && content.includes('testing')) {
        issues.push('Complex project missing testing status display');
      }
    }
    
    return issues;
  }

  generateReport(results) {
    console.log('\n📊 TASK TABLE FORMAT TEST REPORT');
    console.log('=================================');
    
    let totalIssues = 0;
    let totalScenarios = results.length;
    
    results.forEach(result => {
      console.log(`\n🔍 ${result.scenario}:`);
      console.log(`   Workspace: ${result.workspace}`);
      console.log(`   Generation Success: ${result.result.success ? '✅' : '❌'}`);
      console.log(`   Issues Found: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`     ⚠️  ${issue}`);
        });
        totalIssues += result.issues.length;
      } else {
        console.log('     ✅ No issues detected');
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`   Total scenarios tested: ${totalScenarios}`);
    console.log(`   Total issues found: ${totalIssues}`);
    console.log(`   Success rate: ${((totalScenarios - totalIssues) / totalScenarios * 100).toFixed(1)}%`);
    
    const overallSuccess = totalIssues === 0;
    console.log(`\n🏆 Overall Result: ${overallSuccess ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
    
    if (overallSuccess) {
      console.log('✅ All task table format changes are working correctly across all scenarios!');
    } else {
      console.log('⚠️  Some issues detected that need to be addressed.');
    }
    
    return {
      totalScenarios,
      totalIssues,
      overallSuccess,
      results
    };
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test workspaces...');
    
    for (const workspace of this.testWorkspaces) {
      try {
        if (fs.existsSync(workspace)) {
          fs.rmSync(workspace, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup ${workspace}: ${error.message}`);
      }
    }
    
    console.log('✅ Cleanup complete');
  }

  async run() {
    try {
      console.log('🚀 Starting Task Table Format Test...');
      
      const results = [
        await this.testEmptyProject(),
        await this.testBasicProject(),
        await this.testComplexProject(),
        await this.testEdgeCases()
      ];
      
      const report = this.generateReport(results);
      
      await this.cleanup();
      
      return report;
    } catch (error) {
      console.error('❌ Task table format test failed:', error.message);
      await this.cleanup();
      throw error;
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const test = new TaskTableFormatTest();
  test.run()
    .then(report => {
      console.log(`\n🏁 Task table format test completed: ${report.overallSuccess ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
      process.exit(report.overallSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Task table format test failed:', error);
      process.exit(1);
    });
}

module.exports = TaskTableFormatTest;
