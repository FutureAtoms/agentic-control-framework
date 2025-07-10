#!/usr/bin/env node

/**
 * Test complete MCP workflow via mcp-proxy
 * Demonstrates SSE connection and MCP tool usage
 */

const { EventSource } = require('eventsource');
const http = require('http');

async function testMCPWorkflow() {
    console.log('🧪 Testing Complete MCP Workflow');
    console.log('================================');
    
    console.log('\n1. Establishing SSE connection...');
    
    return new Promise((resolve, reject) => {
        const eventSource = new EventSource('http://localhost:8080/sse');
        let sessionId = null;
        let messageEndpoint = null;
        let toolsReceived = false;
        
        const timeout = setTimeout(() => {
            eventSource.close();
            if (toolsReceived) {
                resolve();
            } else {
                reject(new Error('Workflow timeout'));
            }
        }, 15000);
        
        eventSource.addEventListener('endpoint', (event) => {
            console.log('✅ SSE connection established');
            console.log('   Endpoint:', event.data);
            
            const match = event.data.match(/\/messages\?sessionId=([^&]+)/);
            if (match) {
                sessionId = match[1];
                messageEndpoint = event.data;
                console.log('   Session ID:', sessionId);
                
                // Now test MCP communication
                setTimeout(() => testMCPCommunication(messageEndpoint), 1000);
            }
        });
        
        eventSource.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('   MCP Message:', data.method || 'response', data.params?.message || '');
                
                if (data.result && data.result.tools) {
                    console.log('✅ Tools list received:', data.result.tools.length, 'tools');
                    console.log('   Sample tools:', data.result.tools.slice(0, 3).map(t => t.name));
                    toolsReceived = true;
                    
                    clearTimeout(timeout);
                    eventSource.close();
                    resolve();
                }
            } catch (e) {
                console.log('   Raw message:', event.data);
            }
        });
        
        eventSource.onerror = (error) => {
            console.log('❌ SSE error:', error);
            clearTimeout(timeout);
            eventSource.close();
            reject(error);
        };
        
        async function testMCPCommunication(endpoint) {
            console.log('\n2. Testing MCP communication...');
            
            try {
                const response = await makeMCPRequest(endpoint, {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list'
                });
                
                console.log('   MCP request sent successfully');
            } catch (error) {
                console.log('❌ MCP request failed:', error.message);
                clearTimeout(timeout);
                eventSource.close();
                reject(error);
            }
        }
    });
}

function makeMCPRequest(endpoint, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Timeout')));
        req.write(data);
        req.end();
    });
}

testMCPWorkflow()
    .then(() => {
        console.log('\n🎉 MCP workflow test completed successfully!');
        console.log('\n✅ Summary:');
        console.log('   - SSE connection established');
        console.log('   - Session management working');
        console.log('   - MCP protocol communication successful');
        console.log('   - Tools list retrieved');
        console.log('\n🚀 mcp-proxy integration is fully functional!');
    })
    .catch((error) => {
        console.log('\n❌ MCP workflow test failed:', error.message);
        process.exit(1);
    });
