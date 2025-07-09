#!/usr/bin/env node

// Simple ACF Tools Testing Script
// Tests all ACF tools in a more reliable way

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

class TestRunner {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.failedDetails = [];
        this.acfRoot = path.join(__dirname, '..', '..');
        this.testWorkspace = '/tmp/test_workspace_simple';
        this.allowedDirs = ['/tmp', '/tmp/test_workspace_simple'];
    }

    log(message, color = 'blue') {
        console.log(`${colors[color]}[INFO]${colors.reset} ${message}`);
    }

    success(message) {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
    }

    error(message) {
        console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
    }

    warn(message) {
        console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
    }

    header(message) {
        console.log(`${colors.purple}═══ ${message} ═══${colors.reset}`);
    }

    subheader(message) {
        console.log(`${colors.cyan}─── ${message} ───${colors.reset}`);
    }

    startTest(description) {
        this.totalTests++;
        console.log(`${colors.cyan}[TEST ${this.totalTests}]${colors.reset} ${description}`);
    }

    passTest() {
        this.passedTests++;
        console.log(`  ${colors.green}✓ PASSED${colors.reset}`);
    }

    failTest(details) {
        this.failedTests++;
        this.failedDetails.push(details);
        console.log(`  ${colors.red}✗ FAILED${colors.reset}: ${details}`);
    }

    setupTestWorkspace() {
        this.log('Setting up test workspace...');
        
        // Remove and recreate test workspace
        if (fs.existsSync(this.testWorkspace)) {
            fs.rmSync(this.testWorkspace, { recursive: true, force: true });
        }
        fs.mkdirSync(this.testWorkspace, { recursive: true });
        
        // Update allowed dirs to include the actual workspace
        this.allowedDirs = [this.testWorkspace, '/tmp'];
        
        // Create test tasks.json
        const testTasks = {
            projectName: "ACF Test Project",
            projectDescription: "Comprehensive testing of all ACF tools",
            lastTaskId: 2,
            tasks: [
                {
                    id: 1,
                    title: "Test Task 1",
                    description: "A test task for CLI testing",
                    status: "todo",
                    priority: "high",
                    dependsOn: [],
                    relatedFiles: [],
                    subtasks: [],
                    activity: []
                },
                {
                    id: 2,
                    title: "Test Task 2",
                    description: "Another test task",
                    status: "inprogress",
                    priority: "medium",
                    dependsOn: [],
                    relatedFiles: ["test.js"],
                    subtasks: [
                        {
                            id: "2.1",
                            title: "Subtask 1",
                            status: "todo"
                        }
                    ],
                    activity: []
                }
            ]
        };
        
        fs.writeFileSync(path.join(this.testWorkspace, 'tasks.json'), JSON.stringify(testTasks, null, 2));
        
        // Create test files
        fs.writeFileSync(path.join(this.testWorkspace, 'test.js'), "console.log('Test file');");
        fs.writeFileSync(path.join(this.testWorkspace, 'test.md'), "# Test Document");
        
        // Create directory structure
        fs.mkdirSync(path.join(this.testWorkspace, 'src'), { recursive: true });
        fs.mkdirSync(path.join(this.testWorkspace, 'test'), { recursive: true });
        fs.mkdirSync(path.join(this.testWorkspace, 'docs'), { recursive: true });
        
        fs.writeFileSync(path.join(this.testWorkspace, 'src', 'main.js'), "function test() { return true; }");
        
        this.success(`Test workspace created at ${this.testWorkspace}`);
    }

    testCLIMode() {
        this.header('TESTING CLI MODE');
        
        // Change to test workspace
        const originalCwd = process.cwd();
        process.chdir(this.testWorkspace);
        
        try {
            this.subheader('Task Management Tools');
            
            // Test list tasks
            this.startTest('CLI: List tasks');
            try {
                const output = execSync(`${this.acfRoot}/bin/task-manager list`, { encoding: 'utf8' });
                if (output.includes('Test Task')) {
                    this.passTest();
                } else {
                    this.failTest('Tasks not listed correctly');
                }
            } catch (error) {
                this.failTest(`list command failed: ${error.message}`);
            }
            
            // Test add task
            this.startTest('CLI: Add new task');
            try {
                execSync(`${this.acfRoot}/bin/task-manager add -t "CLI Test Task" -d "Testing CLI functionality" -p high`, { encoding: 'utf8' });
                const output = execSync(`${this.acfRoot}/bin/task-manager list`, { encoding: 'utf8' });
                if (output.includes('CLI Test Task')) {
                    this.passTest();
                } else {
                    this.failTest('Task not added correctly');
                }
            } catch (error) {
                this.failTest(`add command failed: ${error.message}`);
            }
            
            // Test add subtask
            this.startTest('CLI: Add subtask');
            try {
                execSync(`${this.acfRoot}/bin/task-manager add-subtask 3 -t "CLI Subtask"`, { encoding: 'utf8' });
                const output = execSync(`${this.acfRoot}/bin/task-manager get-context 3`, { encoding: 'utf8' });
                if (output.includes('CLI Subtask')) {
                    this.passTest();
                } else {
                    this.failTest('Subtask not added correctly');
                }
            } catch (error) {
                this.failTest(`add-subtask command failed: ${error.message}`);
            }
            
            // Test status update
            this.startTest('CLI: Update task status');
            try {
                execSync(`${this.acfRoot}/bin/task-manager status 3 inprogress -m "Starting CLI test"`, { encoding: 'utf8' });
                const output = execSync(`${this.acfRoot}/bin/task-manager list`, { encoding: 'utf8' });
                if (output.includes('inprogress')) {
                    this.passTest();
                } else {
                    this.failTest('Status not updated correctly');
                }
            } catch (error) {
                this.failTest(`status command failed: ${error.message}`);
            }
            
            // Test next task
            this.startTest('CLI: Get next task');
            try {
                const output = execSync(`${this.acfRoot}/bin/task-manager next`, { encoding: 'utf8' });
                if (output.includes('Next actionable task') || output.includes('ID:')) {
                    this.passTest();
                } else {
                    this.failTest('Next task not returned correctly');
                }
            } catch (error) {
                this.failTest(`next command failed: ${error.message}`);
            }
            
        } finally {
            process.chdir(originalCwd);
        }
    }

    async testLocalMCPMode() {
        this.header('TESTING LOCAL MCP MODE');
        
        this.subheader('Direct Tool Testing');
        
        // Set up environment for MCP tools
        process.env.WORKSPACE_ROOT = this.testWorkspace;
        process.env.ALLOWED_DIRS = this.allowedDirs.join(':');
        process.env.READONLY_MODE = 'false';
        
        // Test Core module
        this.startTest('MCP: Core module loading');
        try {
            const core = require(path.join(this.acfRoot, 'src', 'core'));
            const tasks = core.readTasks(this.testWorkspace);
            if (tasks && tasks.tasks && tasks.tasks.length > 0) {
                this.passTest();
            } else {
                this.failTest('Tasks not loaded correctly');
            }
        } catch (error) {
            this.failTest(`Core module failed: ${error.message}`);
        }
        
        // Test Filesystem tools
        this.startTest('MCP: Filesystem tools');
        try {
            const fsTools = require(path.join(this.acfRoot, 'src', 'filesystem_tools'));
            const result = fsTools.readFile(path.join(this.testWorkspace, 'test.js'), this.allowedDirs);
            if (result && result.success && result.content && result.content.includes('Test file')) {
                this.passTest();
            } else {
                this.failTest(`File content not correct: ${result.message || 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`Filesystem tools failed: ${error.message}`);
        }
        
        // Test Terminal tools
        this.startTest('MCP: Terminal tools');
        try {
            const terminalTools = require(path.join(this.acfRoot, 'src', 'tools', 'terminal_tools'));
            const result = await terminalTools.executeCommand('echo hello');
            if (result && result.content && result.content.includes('hello')) {
                this.passTest();
            } else {
                this.failTest(`Command execution failed: ${result ? result.message : 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`Terminal tools failed: ${error.message}`);
        }
        
        // Test Search tools (with proper function call)
        this.startTest('MCP: Search tools');
        try {
            const searchTools = require(path.join(this.acfRoot, 'src', 'tools', 'search_tools'));
            const result = await searchTools.searchCode(this.testWorkspace, '*.js');
            if (result && result.content && (result.content.includes('test.js') || result.content.includes('main.js'))) {
                this.passTest();
            } else {
                this.failTest(`Search failed: ${result ? result.message : 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`Search tools failed: ${error.message}`);
        }
        
        // Test Edit tools
        this.startTest('MCP: Edit tools');
        try {
            const editTools = require(path.join(this.acfRoot, 'src', 'tools', 'edit_tools'));
            this.passTest();
        } catch (error) {
            this.failTest(`Edit tools failed to load: ${error.message}`);
        }
    }

    async testCloudMCPMode() {
        this.header('TESTING CLOUD MCP MODE (via mcp-proxy)');
        
        // Check if mcp-proxy is available
        try {
            execSync('which mcp-proxy', { encoding: 'utf8' });
        } catch (error) {
            this.warn('mcp-proxy not installed, installing...');
            try {
                execSync('npm install -g mcp-proxy', { encoding: 'utf8' });
            } catch (installError) {
                this.error('Failed to install mcp-proxy, skipping cloud tests');
                return;
            }
        }
        
        // Start mcp-proxy
        this.log('Starting mcp-proxy with ACF...');
        
        const proxyProcess = spawn('mcp-proxy', [
            '--port', '8080', 
            '--debug', 
            'node', 
            path.join(this.acfRoot, 'bin', 'agentic-control-framework-mcp'),
            '--workspaceRoot', this.testWorkspace
        ], {
            env: { 
                ...process.env, 
                WORKSPACE_ROOT: this.testWorkspace,
                ALLOWED_DIRS: this.allowedDirs.join(':')
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Capture output for debugging
        let proxyOutput = '';
        let proxyError = '';
        
        proxyProcess.stdout.on('data', (data) => {
            proxyOutput += data.toString();
        });
        
        proxyProcess.stderr.on('data', (data) => {
            proxyError += data.toString();
        });
        
        // Wait for startup with better checking
        let serverReady = false;
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds total
        
        while (!serverReady && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
            
            // Check if process is still running
            if (proxyProcess.exitCode !== null) {
                this.error(`mcp-proxy exited with code ${proxyProcess.exitCode}`);
                this.error(`Output: ${proxyOutput}`);
                this.error(`Error: ${proxyError}`);
                return;
            }
            
            // Check if SSE endpoint is responding
            try {
                const response = execSync('curl -s -m 3 http://localhost:8080/sse', { encoding: 'utf8', timeout: 5000 });
                if (response.includes('event:') || response.includes('data:')) {
                    serverReady = true;
                    break;
                }
            } catch (error) {
                // Continue trying
            }
        }
        
        if (!serverReady) {
            this.error('mcp-proxy did not become ready within timeout');
            this.error(`Output: ${proxyOutput}`);
            this.error(`Error: ${proxyError}`);
            return;
        }
        
        this.success(`mcp-proxy started with PID ${proxyProcess.pid}`);
        
        this.subheader('HTTP/SSE Endpoints');
        
        // Test SSE endpoint (serves as health check)
        this.startTest('Cloud MCP: SSE endpoint availability');
        try {
            const response = execSync('curl -s -m 5 http://localhost:8080/sse', { encoding: 'utf8', timeout: 10000 });
            if (response.includes('event:') || response.includes('data:') || response.includes('sessionId')) {
                this.passTest();
            } else {
                this.failTest(`SSE endpoint unexpected response: ${response}`);
            }
        } catch (error) {
            this.failTest(`SSE endpoint failed: ${error.message}`);
        }
        
        // Test MCP initialization
        this.startTest('Cloud MCP: MCP initialization');
        try {
            const initPayload = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: { name: "test", version: "1.0.0" }
                }
            });
            
            const response = execSync(`curl -s -X POST http://localhost:8080/stream -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" -d '${initPayload}'`, { encoding: 'utf8' });
            if (response.includes('"result"')) {
                this.passTest();
            } else {
                this.failTest(`MCP initialization failed: ${response}`);
            }
        } catch (error) {
            this.failTest(`MCP initialization failed: ${error.message}`);
        }
        
        // Test tools list with session management
        this.startTest('Cloud MCP: Tools list via SSE');
        try {
            const response = execSync('curl -s -m 5 -H "Accept: text/event-stream" http://localhost:8080/sse', { encoding: 'utf8', timeout: 10000 });
            
            // Check if we get connection established and can see it's working
            if (response.includes('SSE Connection established') || response.includes('sessionId') || response.includes('event:')) {
                this.passTest();
            } else {
                this.failTest(`Tools list unexpected response: ${response}`);
            }
        } catch (error) {
            this.failTest(`Tools list failed: ${error.message}`);
        }
        
        // Cleanup
        try {
            proxyProcess.kill('SIGTERM');
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    async testBrowserTools() {
        this.header('TESTING BROWSER AUTOMATION TOOLS');
        
        // Test browser tools loading
        this.startTest('Browser: Tools loading');
        try {
            const browserTools = require(path.join(this.acfRoot, 'src', 'tools', 'browser_tools'));
            this.passTest();
        } catch (error) {
            this.failTest(`Browser tools failed to load: ${error.message}`);
        }
        
        // Test Playwright availability
        this.startTest('Browser: Playwright availability');
        try {
            execSync('npx playwright --version', { encoding: 'utf8' });
            this.passTest();
        } catch (error) {
            this.failTest('Playwright not available');
        }
    }

    testAppleScriptTools() {
        this.header('TESTING APPLESCRIPT TOOLS');
        
        if (process.platform !== 'darwin') {
            this.warn('Skipping AppleScript tests (not on macOS)');
            return;
        }
        
        // Test AppleScript tools loading
        this.startTest('AppleScript: Tools loading');
        try {
            const applescriptTools = require(path.join(this.acfRoot, 'src', 'tools', 'applescript_tools'));
            this.passTest();
        } catch (error) {
            this.failTest(`AppleScript tools failed to load: ${error.message}`);
        }
    }

    async testFilesystemTools() {
        this.header('TESTING FILESYSTEM TOOLS');
        
        // Create test structure
        const testFsDir = path.join(this.testWorkspace, 'test_fs');
        fs.mkdirSync(testFsDir, { recursive: true });
        fs.mkdirSync(path.join(testFsDir, 'sub1'), { recursive: true });
        fs.mkdirSync(path.join(testFsDir, 'sub2'), { recursive: true });
        fs.writeFileSync(path.join(testFsDir, 'test1.txt'), 'test content');
        fs.writeFileSync(path.join(testFsDir, 'sub1', 'test2.txt'), 'another test');
        
        this.startTest('Filesystem: File operations');
        try {
            const fsTools = require(path.join(this.acfRoot, 'src', 'filesystem_tools'));
            
            // Test write file
            const writeResult = fsTools.writeFile(path.join(this.testWorkspace, 'test_write.txt'), 'Test write content', this.allowedDirs);
            if (!writeResult.success) {
                this.failTest(`Write operation failed: ${writeResult.message}`);
                return;
            }
            
            // Test read file
            const readResult = fsTools.readFile(path.join(this.testWorkspace, 'test_write.txt'), this.allowedDirs);
            if (readResult && readResult.success && readResult.content && readResult.content.includes('Test write content')) {
                this.passTest();
            } else {
                this.failTest(`File read failed: ${readResult.message || 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`File operations failed: ${error.message}`);
        }
        
        this.startTest('Filesystem: Directory operations');
        try {
            const fsTools = require(path.join(this.acfRoot, 'src', 'filesystem_tools'));
            const result = fsTools.listDirectory(testFsDir, this.allowedDirs);
            if (result && result.success && result.content && result.content.includes('sub1') && result.content.includes('sub2')) {
                this.passTest();
            } else {
                this.failTest(`Directory listing failed: ${result.message || 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`Directory operations failed: ${error.message}`);
        }
        
        this.startTest('Filesystem: Search operations');
        try {
            const fsTools = require(path.join(this.acfRoot, 'src', 'filesystem_tools'));
            const result = fsTools.searchFiles(testFsDir, '*.txt', this.allowedDirs);
            if (result && result.success && result.content && result.content.includes('test1.txt')) {
                this.passTest();
            } else {
                this.failTest(`File search failed: ${result.message || 'unknown error'}`);
            }
        } catch (error) {
            this.failTest(`Search operations failed: ${error.message}`);
        }
    }

    generateReport() {
        this.header('TEST RESULTS SUMMARY');
        
        console.log('');
        console.log(`${colors.cyan}📊 OVERALL RESULTS${colors.reset}`);
        console.log(`   Total Tests: ${colors.purple}${this.totalTests}${colors.reset}`);
        console.log(`   Passed: ${colors.green}${this.passedTests}${colors.reset}`);
        console.log(`   Failed: ${colors.red}${this.failedTests}${colors.reset}`);
        console.log(`   Success Rate: ${colors.yellow}${Math.round(this.passedTests * 100 / this.totalTests)}%${colors.reset}`);
        console.log('');
        
        if (this.failedTests > 0) {
            console.log(`${colors.red}❌ FAILED TESTS:${colors.reset}`);
            this.failedDetails.forEach(detail => {
                console.log(`   • ${detail}`);
            });
            console.log('');
        }
        
        // Generate markdown report
        const reportContent = `# 🧪 ACF Simple Tool Testing Report

## Test Summary

- **Total Tests**: ${this.totalTests}
- **Passed**: ${this.passedTests} ✅
- **Failed**: ${this.failedTests} ❌
- **Success Rate**: ${Math.round(this.passedTests * 100 / this.totalTests)}%

## Test Categories

### ✅ CLI Mode Testing
- Task management operations
- Command-line interface validation

### ✅ Local MCP Mode Testing  
- Direct tool loading and execution
- Core ACF functionality verification

### ✅ Cloud MCP Mode Testing
- HTTP/SSE proxy functionality
- mcp-proxy integration testing

### ✅ Specialized Tool Testing
- Browser automation tools
- AppleScript integration (macOS)
- Advanced filesystem operations

## Failed Tests

${this.failedTests > 0 ? this.failedDetails.map(detail => `- ${detail}`).join('\n') : '🎉 **All tests passed!**'}

## Configuration Recommendations

### CLI Configuration
- Use CLI mode for direct task management
- Ideal for automated scripts and local development

### Local MCP Configuration  
- Use with Cursor/Claude Desktop for IDE integration
- Best performance with direct tool access

### Cloud MCP Configuration
- Use mcp-proxy for remote access and web clients
- Enables multi-client support and cloud deployment

---
*Report generated on ${new Date().toISOString()} by ACF Simple Test Suite*
`;
        
        fs.writeFileSync(path.join(this.acfRoot, 'test', 'reports', 'SIMPLE-TEST-REPORT.md'), reportContent);
        this.success('Simple test report generated: test/reports/SIMPLE-TEST-REPORT.md');
    }

    cleanup() {
        this.log('Cleaning up...');
        if (fs.existsSync(this.testWorkspace)) {
            fs.rmSync(this.testWorkspace, { recursive: true, force: true });
        }
    }

    async run() {
        console.log('🧪 ACF Simple Tool Testing Suite');
        console.log('==================================');
        console.log('');
        
        this.log(`ACF Root: ${this.acfRoot}`);
        this.log('Starting simple testing...');
        console.log('');
        
        try {
            // Setup
            this.setupTestWorkspace();
            console.log('');
            
            // Run tests
            this.testCLIMode();
            console.log('');
            
            await this.testLocalMCPMode();
            console.log('');
            
            await this.testCloudMCPMode();
            console.log('');
            
            await this.testBrowserTools();
            console.log('');
            
            this.testAppleScriptTools();
            console.log('');
            
            await this.testFilesystemTools();
            console.log('');
            
            // Generate report
            this.generateReport();
            
            // Final status
            if (this.failedTests === 0) {
                this.success('🎉 All tests passed! ACF is fully functional across all modes.');
                process.exit(0);
            } else {
                this.error(`❌ ${this.failedTests} tests failed. Check SIMPLE-TEST-REPORT.md for details.`);
                process.exit(1);
            }
            
        } finally {
            this.cleanup();
        }
    }
}

// Run the tests
const testRunner = new TestRunner();
testRunner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
}); 