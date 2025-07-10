#!/usr/bin/env node

/**
 * Test HTTP/SSE endpoints for mcp-proxy
 */

const http = require('http');
const { EventSource } = require('eventsource');

async function testEndpoints() {
    console.log('🧪 Testing HTTP/SSE Endpoints');
    console.log('=============================');
    
    // Test 1: SSE endpoint and extract session ID
    console.log('\n1. Testing SSE endpoint...');
    let sessionId = null;
    
    try {
        sessionId = await new Promise((resolve, reject) => {
            const eventSource = new EventSource('http://localhost:8080/sse');
            let timeout = setTimeout(() => {
                eventSource.close();
                reject(new Error('SSE timeout'));
            }, 5000);
            
            eventSource.onmessage = (event) => {
                console.log('   SSE Event:', event.type, event.data);
            };
            
            eventSource.addEventListener('endpoint', (event) => {
                console.log('   SSE Endpoint event:', event.data);
                const match = event.data.match(/sessionId=([^&]+)/);
                if (match) {
                    clearTimeout(timeout);
                    eventSource.close();
                    resolve(match[1]);
                }
            });
            
            eventSource.onerror = (error) => {
                clearTimeout(timeout);
                eventSource.close();
                reject(error);
            };
        });
        
        console.log('✅ SSE endpoint working, session ID:', sessionId);
    } catch (error) {
        console.log('❌ SSE endpoint failed:', error.message);
        return;
    }
    
    // Test 2: Stream endpoint with session ID
    if (sessionId) {
        console.log('\n2. Testing stream endpoint with session ID...');
        try {
            const response = await makeMCPRequest(`/messages?sessionId=${sessionId}`, {
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/list'
            });
            
            if (response && response.result) {
                console.log('✅ Stream endpoint working');
                console.log(`   Tools available: ${response.result.tools ? response.result.tools.length : 'unknown'}`);
            } else {
                console.log('❌ Stream endpoint response invalid:', response);
            }
        } catch (error) {
            console.log('❌ Stream endpoint failed:', error.message);
        }
    }
    
    // Test 3: JSON-RPC over HTTP
    console.log('\n3. Testing JSON-RPC over HTTP...');
    try {
        const response = await makeMCPRequest('/stream', {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list'
        });
        
        console.log('   Response:', response);
    } catch (error) {
        console.log('❌ JSON-RPC failed:', error.message);
    }
    
    console.log('\n🎉 Endpoint testing completed!');
}

function makeMCPRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: path,
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
                    reject(new Error(`Parse error: ${error.message}, body: ${body}`));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Timeout')));
        req.write(data);
        req.end();
    });
}

// Install eventsource if not available
try {
    require('eventsource');
} catch (e) {
    console.log('Installing eventsource...');
    require('child_process').execSync('npm install eventsource', { stdio: 'inherit' });
}

testEndpoints().catch(console.error);
