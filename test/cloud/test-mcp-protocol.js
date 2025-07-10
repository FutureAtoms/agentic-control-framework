const { spawn } = require('child_process');

// Test MCP JSON-RPC protocol
async function testMCPProtocol() {
    console.log('🧪 Testing MCP JSON-RPC Protocol...');
    
    const server = spawn('node', ['./bin/agentic-control-framework-mcp', '--workspaceRoot', process.cwd()]);
    
    let responseData = '';
    let initReceived = false;
    
    server.stdout.on('data', (data) => {
        responseData += data.toString();
        
        // Look for JSON-RPC responses
        const lines = responseData.split('\n');
        for (const line of lines) {
            if (line.trim() && line.startsWith('{')) {
                try {
                    const response = JSON.parse(line);
                    if (response.result && response.result.capabilities) {
                        console.log('✅ MCP initialization response received');
                        console.log('✅ Server capabilities:', Object.keys(response.result.capabilities));
                        initReceived = true;
                    }
                    if (response.result && response.result.tools) {
                        console.log('✅ Tools list received:', response.result.tools.length, 'tools');
                        server.kill('SIGTERM');
                        return;
                    }
                } catch (e) {
                    // Not JSON, ignore
                }
            }
        }
    });
    
    server.stderr.on('data', (data) => {
        // Server logs go to stderr, this is normal
    });
    
    // Wait for server to start
    setTimeout(() => {
        // Send initialize request
        const initRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "test-client", version: "1.0.0" }
            }
        };
        
        server.stdin.write(JSON.stringify(initRequest) + '\n');
        
        // Send tools/list request after a delay
        setTimeout(() => {
            const toolsRequest = {
                jsonrpc: "2.0",
                id: 2,
                method: "tools/list",
                params: {}
            };
            server.stdin.write(JSON.stringify(toolsRequest) + '\n');
        }, 1000);
        
    }, 1000);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        if (!initReceived) {
            console.log('❌ MCP protocol test timed out');
        }
        server.kill('SIGTERM');
    }, 10000);
}

testMCPProtocol().catch(console.error);
