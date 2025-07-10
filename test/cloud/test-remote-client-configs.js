#!/usr/bin/env node

/**
 * Test remote client configurations for various MCP clients
 * Validates that configurations work with mcp-proxy
 */

const fs = require('fs');
const path = require('path');
const { EventSource } = require('eventsource');

async function testRemoteClientConfigs() {
    console.log('🧪 Testing Remote Client Configurations');
    console.log('======================================');
    
    const configDir = 'client-configurations';
    const remoteConfigs = [
        'claude-desktop-remote.json',
        'cursor-remote.json', 
        'claude-code-remote.json'
    ];
    
    for (const configFile of remoteConfigs) {
        const configPath = path.join(configDir, configFile);
        
        if (!fs.existsSync(configPath)) {
            console.log(`❌ Config file not found: ${configFile}`);
            continue;
        }
        
        console.log(`\n📋 Testing ${configFile}...`);
        
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            await testConfiguration(config, configFile);
        } catch (error) {
            console.log(`❌ Failed to test ${configFile}:`, error.message);
        }
    }
    
    console.log('\n🎉 Remote client configuration testing completed!');
}

async function testConfiguration(config, configName) {
    // Extract server configurations
    const servers = config.mcpServers || config['mcp.servers'] || {};
    
    for (const [serverName, serverConfig] of Object.entries(servers)) {
        if (serverConfig.url && serverConfig.url.includes('localhost:8080')) {
            console.log(`   Testing server: ${serverName}`);
            
            try {
                const isConnectable = await testSSEConnection(serverConfig.url);
                if (isConnectable) {
                    console.log(`   ✅ ${serverName} - Connection successful`);
                } else {
                    console.log(`   ❌ ${serverName} - Connection failed`);
                }
            } catch (error) {
                console.log(`   ❌ ${serverName} - Error: ${error.message}`);
            }
        } else if (serverConfig.url) {
            console.log(`   ⏭️  ${serverName} - Skipping cloud URL (${serverConfig.url})`);
        } else if (serverConfig.transport && serverConfig.transport.url) {
            // Claude Code format
            if (serverConfig.transport.url.includes('localhost:8080')) {
                console.log(`   Testing server: ${serverName}`);
                
                try {
                    const isConnectable = await testSSEConnection(serverConfig.transport.url);
                    if (isConnectable) {
                        console.log(`   ✅ ${serverName} - Connection successful`);
                    } else {
                        console.log(`   ❌ ${serverName} - Connection failed`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${serverName} - Error: ${error.message}`);
                }
            } else {
                console.log(`   ⏭️  ${serverName} - Skipping cloud URL`);
            }
        }
    }
}

function testSSEConnection(url) {
    return new Promise((resolve, reject) => {
        const eventSource = new EventSource(url);
        let connected = false;
        
        const timeout = setTimeout(() => {
            eventSource.close();
            if (!connected) {
                reject(new Error('Connection timeout'));
            }
        }, 5000);
        
        eventSource.addEventListener('endpoint', (event) => {
            connected = true;
            clearTimeout(timeout);
            eventSource.close();
            resolve(true);
        });
        
        eventSource.addEventListener('message', (event) => {
            if (!connected) {
                connected = true;
                clearTimeout(timeout);
                eventSource.close();
                resolve(true);
            }
        });
        
        eventSource.onerror = (error) => {
            clearTimeout(timeout);
            eventSource.close();
            if (!connected) {
                reject(error);
            }
        };
    });
}

// Validate configuration files
function validateConfigurations() {
    console.log('\n🔍 Validating configuration file syntax...');
    
    const configDir = 'client-configurations';
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.json'));
    
    for (const configFile of configFiles) {
        const configPath = path.join(configDir, configFile);
        
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(`   ✅ ${configFile} - Valid JSON`);
            
            // Basic structure validation
            if (config.mcpServers || config['mcp.servers']) {
                console.log(`   ✅ ${configFile} - Valid MCP structure`);
            } else {
                console.log(`   ⚠️  ${configFile} - No MCP servers found`);
            }
        } catch (error) {
            console.log(`   ❌ ${configFile} - Invalid JSON: ${error.message}`);
        }
    }
}

// Run tests
validateConfigurations();
testRemoteClientConfigs().catch(console.error);
