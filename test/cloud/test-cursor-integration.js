// Test Cursor MCP Integration
const { spawn } = require('child_process');

async function testCursorIntegration() {
    console.log('🧪 Testing Cursor MCP Integration...');
    
    // Test 1: Verify MCP server can start with Cursor-like configuration
    console.log('📋 Test 1: MCP Server Startup');
    const server = spawn('node', ['./bin/agentic-control-framework-mcp', '--workspaceRoot', process.cwd()]);
    
    let serverReady = false;
    let toolsAvailable = false;
    
    server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('MCP server ready')) {
            serverReady = true;
            console.log('✅ MCP server started successfully');
        }
    });
    
    server.stderr.on('data', (data) => {
        // Server logs go to stderr
    });
    
    // Wait for server startup
    setTimeout(() => {
        // Test 2: Send tools/list request (simulating Cursor)
        console.log('📋 Test 2: Tool Discovery');
        const toolsRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list",
            params: {}
        };
        
        server.stdin.write(JSON.stringify(toolsRequest) + '\n');
        
        // Test 3: Test a sample tool call
        setTimeout(() => {
            console.log('📋 Test 3: Sample Tool Call');
            const toolCall = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: {
                    name: "listTasks_table",
                    arguments: {}
                }
            };
            
            server.stdin.write(JSON.stringify(toolCall) + '\n');
            
            setTimeout(() => {
                console.log('✅ Cursor integration tests completed');
                server.kill('SIGTERM');
            }, 2000);
            
        }, 1000);
        
    }, 1000);
    
    // Timeout
    setTimeout(() => {
        server.kill('SIGTERM');
    }, 8000);
}

testCursorIntegration().catch(console.error);
