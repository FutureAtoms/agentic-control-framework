#!/usr/bin/env node

// Comprehensive Priority System Testing Script
// Tests all numerical priority system features including core functions,
// dependency management, priority inheritance, and advanced algorithms

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
    red: '\033[0;31m',
    green: '\033[0;32m',
    yellow: '\033[1;33m',
    blue: '\033[0;34m',
    purple: '\033[0;35m',
    cyan: '\033[0;36m',
    reset: '\033[0m'
};

class PrioritySystemTestRunner {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.failedDetails = [];
        this.acfRoot = path.join(__dirname, '..', '..');
        this.testWorkspace = '/tmp/test_priority_system';
        this.core = null;
        this.PriorityEngine = null;
        this.DependencyManager = null;
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async setup() {
        this.log('\n🔧 Setting up Priority System Test Environment...', 'blue');
        
        // Clean and create test workspace
        if (fs.existsSync(this.testWorkspace)) {
            fs.rmSync(this.testWorkspace, { recursive: true, force: true });
        }
        fs.mkdirSync(this.testWorkspace, { recursive: true });
        
        // Change to ACF root directory
        process.chdir(this.acfRoot);
        
        // Load modules
        try {
            this.core = require(path.join(this.acfRoot, 'src', 'core.js'));
            this.PriorityEngine = require(path.join(this.acfRoot, 'src', 'priority_engine.js'));
            this.DependencyManager = require(path.join(this.acfRoot, 'src', 'dependency_manager.js'));
            this.log('✅ Modules loaded successfully', 'green');
        } catch (error) {
            this.log(`❌ Failed to load modules: ${error.message}`, 'red');
            throw error;
        }
        
        // Initialize test project
        try {
            this.core.initProject(this.testWorkspace, 'Priority System Test', 'Testing numerical priority system');
            this.log('✅ Test project initialized', 'green');
        } catch (error) {
            this.log(`❌ Failed to initialize test project: ${error.message}`, 'red');
            throw error;
        }
    }

    async runTest(testName, testFunction) {
        this.totalTests++;
        try {
            this.log(`\n🧪 Running: ${testName}`, 'cyan');
            await testFunction();
            this.passedTests++;
            this.log(`✅ PASSED: ${testName}`, 'green');
        } catch (error) {
            this.failedTests++;
            this.failedDetails.push({ test: testName, error: error.message });
            this.log(`❌ FAILED: ${testName} - ${error.message}`, 'red');
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    assertRange(value, min, max, message) {
        if (value < min || value > max) {
            throw new Error(`${message}: expected value between ${min} and ${max}, got ${value}`);
        }
    }

    // Test Core Priority Functions
    async testCorePriorityFunctions() {
        // Test normalizePriority
        this.assertEqual(this.core.normalizePriority('low'), 300, 'Low priority normalization');
        this.assertEqual(this.core.normalizePriority('medium'), 500, 'Medium priority normalization');
        this.assertEqual(this.core.normalizePriority('high'), 700, 'High priority normalization');
        this.assertEqual(this.core.normalizePriority('critical'), 900, 'Critical priority normalization');
        this.assertEqual(this.core.normalizePriority(850), 850, 'Numeric priority passthrough');
        this.assertEqual(this.core.normalizePriority('850'), 850, 'String numeric priority conversion');

        // Test getDisplayPriority
        this.assertEqual(this.core.getDisplayPriority('high'), 'high', 'String priority display');
        this.assertEqual(this.core.getDisplayPriority(750), 750, 'Numeric priority display');

        // Test getPriorityString
        this.assertEqual(this.core.getPriorityString(300), 'low', 'Low priority string conversion');
        this.assertEqual(this.core.getPriorityString(500), 'medium', 'Medium priority string conversion');
        this.assertEqual(this.core.getPriorityString(700), 'high', 'High priority string conversion');
        this.assertEqual(this.core.getPriorityString(900), 'critical', 'Critical priority string conversion');
        this.assertEqual(this.core.getPriorityString(850), 'critical', 'Custom numeric priority string maps to critical');
    }

    // Test Task Creation with Priorities
    async testTaskCreationWithPriorities() {
        // Test string priority task creation
        const stringResult = this.core.addTask(this.testWorkspace, {
            title: 'String Priority Task',
            description: 'Testing string priority',
            priority: 'high'
        });
        this.assert(stringResult.success, 'String priority task creation should succeed');
        
        // Test numeric priority task creation
        const numericResult = this.core.addTask(this.testWorkspace, {
            title: 'Numeric Priority Task',
            description: 'Testing numeric priority',
            priority: '850'
        });
        this.assert(numericResult.success, 'Numeric priority task creation should succeed');
        
        // Verify priorities were set correctly
        const tasks = this.core.readTasks(this.testWorkspace);
        const stringTask = tasks.tasks.find(t => t.title === 'String Priority Task');
        const numericTask = tasks.tasks.find(t => t.title === 'Numeric Priority Task');

        this.assertEqual(stringTask.priority, 700, 'String priority task should have numeric priority 700');
        this.assertEqual(numericTask.priority, 850, 'Numeric priority task should have priority 850');
    }

    // Test Priority Uniqueness
    async testPriorityUniqueness() {
        // Create multiple tasks with same priority
        for (let i = 0; i < 5; i++) {
            this.core.addTask(this.testWorkspace, {
                title: `Duplicate Priority Task ${i}`,
                description: 'Testing priority uniqueness',
                priority: '600'
            });
        }
        
        const tasks = this.core.readTasks(this.testWorkspace);
        const duplicateTasks = tasks.tasks.filter(t => t.title.includes('Duplicate Priority Task'));
        
        // Check that all tasks have unique priorities
        const priorities = duplicateTasks.map(t => t.priority);
        const uniquePriorities = new Set(priorities);
        
        this.assertEqual(priorities.length, uniquePriorities.size, 'All tasks should have unique priorities');
        
        // Check that priorities are in reasonable range around 600
        priorities.forEach(priority => {
            this.assertRange(priority, 580, 620, 'Priority should be near target value');
        });
    }

    // Test Dependency Management
    async testDependencyManagement() {
        // Create tasks with dependencies
        const taskA = this.core.addTask(this.testWorkspace, {
            title: 'Task A - Foundation',
            description: 'Base task',
            priority: '500'
        });
        
        const taskB = this.core.addTask(this.testWorkspace, {
            title: 'Task B - Depends on A',
            description: 'Depends on Task A',
            priority: '400',
            dependsOn: taskA.taskId.toString()
        });
        
        const taskC = this.core.addTask(this.testWorkspace, {
            title: 'Task C - Depends on B',
            description: 'Depends on Task B',
            priority: '300',
            dependsOn: taskB.taskId.toString()
        });
        
        // Test dependency boost
        const recalcResult = this.core.recalculatePriorities(this.testWorkspace, {
            applyDependencyBoosts: true,
            applyAdvancedDependencies: true
        });
        
        this.assert(recalcResult.success, 'Priority recalculation should succeed');
        
        // Verify that Task A got priority boost (it has dependents)
        const updatedTasks = this.core.readTasks(this.testWorkspace);
        const updatedTaskA = updatedTasks.tasks.find(t => t.id === taskA.taskId);
        
        this.assert(updatedTaskA.priority > 500, 'Task A should have received priority boost');
    }

    // Test Priority Engine
    async testPriorityEngine() {
        const engine = new this.PriorityEngine();
        
        // Create test tasks
        const testTasks = [
            { id: 1, priority: 500, dependsOn: [], status: 'todo', createdAt: new Date().toISOString() },
            { id: 2, priority: 600, dependsOn: [1], status: 'todo', createdAt: new Date().toISOString() },
            { id: 3, priority: 700, dependsOn: [1], status: 'todo', createdAt: new Date().toISOString() }
        ];
        
        const tasksData = { tasks: testTasks };
        
        // Test priority recalculation
        const adjustments = engine.recalculateAllPriorities(tasksData);
        this.assert(Array.isArray(adjustments), 'Adjustments should be an array');
        
        // Test priority statistics
        const stats = engine.getPriorityStatistics(testTasks);
        this.assertEqual(stats.count, 3, 'Statistics should count all tasks');
        // Note: After recalculation, priorities may have changed due to dependency boosts
        this.assert(stats.min >= 500, 'Minimum priority should be at least 500');
        this.assert(stats.max >= 700, 'Maximum priority should be at least 700');
    }

    // Test Dependency Manager
    async testDependencyManager() {
        const depManager = new this.DependencyManager();
        
        // Create test tasks with complex dependencies
        const testTasks = [
            { id: 1, priority: 500, dependsOn: [], status: 'todo', title: 'Root Task' },
            { id: 2, priority: 400, dependsOn: [1], status: 'todo', title: 'Level 1 Task A' },
            { id: 3, priority: 400, dependsOn: [1], status: 'todo', title: 'Level 1 Task B' },
            { id: 4, priority: 300, dependsOn: [2, 3], status: 'todo', title: 'Level 2 Task' },
            { id: 5, priority: 200, dependsOn: [4], status: 'todo', title: 'Final Task' }
        ];
        
        // Test dependency graph building
        const graph = depManager.buildDependencyGraph(testTasks);
        this.assert(graph.forward.has(1), 'Dependency graph should have forward mapping');
        this.assert(graph.reverse.has(5), 'Dependency graph should have reverse mapping');
        
        // Test dependency analysis
        const analysis = depManager.getDependencyAnalysis(testTasks);
        this.assertEqual(analysis.totalTasks, 5, 'Analysis should count all tasks');
        this.assertEqual(analysis.rootTasks, 1, 'Should identify 1 root task');
        this.assertEqual(analysis.leafTasks, 1, 'Should identify 1 leaf task');
        this.assert(analysis.criticalPaths > 0, 'Should find critical paths');
        
        // Test blocking task detection
        const adjustments = depManager.enhancePrioritiesWithDependencies(testTasks);
        this.assert(Array.isArray(adjustments), 'Should return adjustments array');
    }

    // Test CLI Priority Commands
    async testCLIPriorityCommands() {
        const taskManagerPath = path.join(this.acfRoot, 'bin', 'task-manager');
        
        try {
            // Test priority-stats command
            const statsOutput = execSync(`${taskManagerPath} priority-stats`, {
                cwd: this.testWorkspace,
                encoding: 'utf8',
                timeout: 10000
            });
            this.assert(statsOutput.includes('Priority Statistics'), 'Priority stats should show statistics');
            
            // Test dependency-analysis command
            const analysisOutput = execSync(`${taskManagerPath} dependency-analysis`, {
                cwd: this.testWorkspace,
                encoding: 'utf8',
                timeout: 10000
            });
            this.assert(analysisOutput.includes('Dependency Analysis'), 'Dependency analysis should show analysis');
            
            // Test bump command
            const tasks = this.core.readTasks(this.testWorkspace);
            if (tasks.tasks.length > 0) {
                const firstTaskId = tasks.tasks[0].id;
                const originalPriority = tasks.tasks[0].priority;
                
                execSync(`${taskManagerPath} bump ${firstTaskId} -a 50`, {
                    cwd: this.testWorkspace,
                    timeout: 10000
                });
                
                const updatedTasks = this.core.readTasks(this.testWorkspace);
                const updatedTask = updatedTasks.tasks.find(t => t.id === firstTaskId);
                
                this.assert(updatedTask.priority > originalPriority, 'Bump command should increase priority');
            }
            
        } catch (error) {
            throw new Error(`CLI command failed: ${error.message}`);
        }
    }

    // Test Performance
    async testPerformance() {
        this.log('🚀 Running performance tests...', 'yellow');
        
        // Create many tasks for performance testing
        const startTime = Date.now();
        
        for (let i = 0; i < 100; i++) {
            this.core.addTask(this.testWorkspace, {
                title: `Performance Test Task ${i}`,
                description: `Performance testing task ${i}`,
                priority: Math.floor(Math.random() * 1000) + 1,
                dependsOn: i > 0 ? [Math.floor(Math.random() * i) + 1].toString() : undefined
            });
        }
        
        const creationTime = Date.now() - startTime;
        this.log(`📊 Created 100 tasks in ${creationTime}ms`, 'blue');
        
        // Test priority recalculation performance
        const recalcStartTime = Date.now();
        const recalcResult = this.core.recalculatePriorities(this.testWorkspace);
        const recalcTime = Date.now() - recalcStartTime;
        
        this.log(`📊 Recalculated priorities in ${recalcTime}ms`, 'blue');
        this.assert(recalcResult.success, 'Priority recalculation should succeed with many tasks');
        this.assert(recalcTime < 5000, 'Priority recalculation should complete within 5 seconds');
    }

    async cleanup() {
        this.log('\n🧹 Cleaning up test environment...', 'blue');
        if (fs.existsSync(this.testWorkspace)) {
            fs.rmSync(this.testWorkspace, { recursive: true, force: true });
        }
        this.log('✅ Cleanup completed', 'green');
    }

    async runAllTests() {
        try {
            await this.setup();
            
            this.log('\n🎯 Starting Priority System Comprehensive Tests', 'purple');
            this.log('=' .repeat(60), 'purple');
            
            await this.runTest('Core Priority Functions', () => this.testCorePriorityFunctions());
            await this.runTest('Task Creation with Priorities', () => this.testTaskCreationWithPriorities());
            await this.runTest('Priority Uniqueness', () => this.testPriorityUniqueness());
            await this.runTest('Dependency Management', () => this.testDependencyManagement());
            await this.runTest('Priority Engine', () => this.testPriorityEngine());
            await this.runTest('Dependency Manager', () => this.testDependencyManager());
            await this.runTest('CLI Priority Commands', () => this.testCLIPriorityCommands());
            await this.runTest('Performance Tests', () => this.testPerformance());
            
            await this.cleanup();
            
            // Print summary
            this.log('\n📊 TEST SUMMARY', 'purple');
            this.log('=' .repeat(60), 'purple');
            this.log(`Total Tests: ${this.totalTests}`, 'blue');
            this.log(`Passed: ${this.passedTests}`, 'green');
            this.log(`Failed: ${this.failedTests}`, this.failedTests > 0 ? 'red' : 'green');
            
            if (this.failedTests > 0) {
                this.log('\n❌ FAILED TESTS:', 'red');
                this.failedDetails.forEach(failure => {
                    this.log(`  • ${failure.test}: ${failure.error}`, 'red');
                });
            }
            
            const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
            this.log(`\nSuccess Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');
            
            if (this.failedTests === 0) {
                this.log('\n🎉 ALL TESTS PASSED! Priority system is working perfectly!', 'green');
            }
            
            return this.failedTests === 0;
            
        } catch (error) {
            this.log(`\n💥 Test setup failed: ${error.message}`, 'red');
            await this.cleanup();
            return false;
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new PrioritySystemTestRunner();
    runner.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = PrioritySystemTestRunner;
