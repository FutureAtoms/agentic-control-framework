#!/usr/bin/env node

/**
 * Manual test for mcp-proxy integration with ACF
 * Tests basic MCP functionality via HTTP/SSE
 */

const http = require('http');

async function testMCPProxy() {
    console.log('🧪 Testing MCP-Proxy Integration');
    console.log('================================');
    
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    try {
        const response = await makeRequest('GET', 'http://localhost:8080/sse');
        console.log('✅ SSE endpoint is accessible');
    } catch (error) {
        console.log('❌ SSE endpoint failed:', error.message);
        return;
    }
    
    // Test 2: MCP tools list request
    console.log('\n2. Testing MCP tools list...');
    try {
        const toolsResponse = await makeMCPRequest({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
        });
        
        if (toolsResponse && toolsResponse.result && toolsResponse.result.tools) {
            console.log(`✅ Tools list received: ${toolsResponse.result.tools.length} tools`);
            console.log('   Sample tools:', toolsResponse.result.tools.slice(0, 3).map(t => t.name));
        } else {
            console.log('❌ Invalid tools response:', toolsResponse);
        }
    } catch (error) {
        console.log('❌ Tools list failed:', error.message);
    }
    
    // Test 3: Test a simple tool call
    console.log('\n3. Testing simple tool call...');
    try {
        const callResponse = await makeMCPRequest({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'listTasks',
                arguments: {}
            }
        });
        
        if (callResponse && callResponse.result) {
            console.log('✅ Tool call successful');
            console.log('   Response type:', typeof callResponse.result.content);
        } else {
            console.log('❌ Tool call failed:', callResponse);
        }
    } catch (error) {
        console.log('❌ Tool call failed:', error.message);
    }
    
    console.log('\n🎉 MCP-Proxy test completed!');
}

function makeRequest(method, url) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, { method }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(res);
            } else {
                reject(new Error(`HTTP ${res.statusCode}`));
            }
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
    });
}

function makeMCPRequest(payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/stream',
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

// Run the test
testMCPProxy().catch(console.error);
