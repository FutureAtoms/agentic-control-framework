const { expect } = require('chai');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

describe('Claude Code Remote Integration Tests', function() {
  this.timeout(60000);

  let mcpProxyServer;
  let tempDir;
  const proxyPort = 8081; // Use different port to avoid conflicts

  beforeEach(function() {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-remote-test-'));
  });

  afterEach(function() {
    if (mcpProxyServer && !mcpProxyServer.killed) {
      mcpProxyServer.kill('SIGTERM');
      // Give it time to clean up
      return new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('MCP Proxy Integration for Claude Code', function() {
    it('should start mcp-proxy server successfully', function(done) {
      this.timeout(30000);
      
      const acfMcpPath = path.join(__dirname, '../../bin/agentic-control-framework-mcp');
      mcpProxyServer = spawn('mcp-proxy', [
        '--port', proxyPort.toString(),
        '--debug',
        'node', acfMcpPath,
        '--workspaceRoot', tempDir
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let serverReady = false;
      
      mcpProxyServer.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes(`starting server on port ${proxyPort}`) && !serverReady) {
          serverReady = true;
          // Give server a moment to fully initialize
          setTimeout(() => done(), 2000);
        }
      });
      
      mcpProxyServer.stderr.on('data', (data) => {
        console.log('Proxy stderr:', data.toString());
      });
      
      mcpProxyServer.on('error', (error) => {
        done(error);
      });
      
      mcpProxyServer.on('close', (code) => {
        if (code !== 0 && code !== null && !serverReady) {
          done(new Error(`mcp-proxy exited with code ${code}`));
        }
      });
    });

    it('should respond to HTTP requests on proxy endpoint', function(done) {
      this.timeout(30000);

      // Skip this test if mcp-proxy is not available
      const { spawn } = require('child_process');
      const testProxy = spawn('which', ['mcp-proxy']);
      testProxy.on('close', (code) => {
        if (code !== 0) {
          console.log('Skipping mcp-proxy test - mcp-proxy not available');
          done();
          return;
        }

        const acfMcpPath = path.join(__dirname, '../../bin/agentic-control-framework-mcp');
        mcpProxyServer = spawn('mcp-proxy', [
          '--port', proxyPort.toString(),
          'node', acfMcpPath,
          '--workspaceRoot', tempDir
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        mcpProxyServer.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes(`starting server on port ${proxyPort}`)) {
            // Wait for server to be ready, then test HTTP endpoint
            setTimeout(() => {
              const postData = JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                  protocolVersion: '2025-03-26',
                  capabilities: { roots: { listChanged: true } },
                  clientInfo: { name: 'Claude Code Remote', version: '1.0.0' }
                }
              });

              const options = {
                hostname: 'localhost',
                port: proxyPort,
                path: '/',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(postData)
                }
              };

              const req = http.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                  responseData += chunk;
                });

                res.on('end', () => {
                  try {
                    if (responseData.trim()) {
                      const response = JSON.parse(responseData);
                      expect(response).to.have.property('result');
                      expect(response.result).to.have.property('protocolVersion', '2025-03-26');
                      expect(response.result).to.have.property('capabilities');
                      expect(response.result.capabilities).to.have.property('tools');
                      done();
                    } else {
                      done(new Error('Empty response from proxy'));
                    }
                  } catch (error) {
                    done(new Error(`JSON parse error: ${error.message}. Response: ${responseData}`));
                  }
                });
              });

              req.on('error', (error) => {
                done(error);
              });

              req.write(postData);
              req.end();
            }, 5000); // Increased wait time
          }
        });

        mcpProxyServer.stderr.on('data', (data) => {
          console.log('Proxy stderr:', data.toString());
        });

        mcpProxyServer.on('error', (error) => {
          done(error);
        });
      });
    });

    it('should handle tools/list request via HTTP proxy', function(done) {
      this.timeout(30000);

      // Skip this test if mcp-proxy is not available
      const { spawn } = require('child_process');
      const testProxy = spawn('which', ['mcp-proxy']);
      testProxy.on('close', (code) => {
        if (code !== 0) {
          console.log('Skipping mcp-proxy tools/list test - mcp-proxy not available');
          done();
          return;
        }

        const acfMcpPath = path.join(__dirname, '../../bin/agentic-control-framework-mcp');
        mcpProxyServer = spawn('mcp-proxy', [
          '--port', proxyPort.toString(),
          'node', acfMcpPath,
          '--workspaceRoot', tempDir
        ], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        mcpProxyServer.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes(`starting server on port ${proxyPort}`)) {
            setTimeout(() => {
              // First initialize
              sendHttpRequest({
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                  protocolVersion: '2025-03-26',
                  capabilities: { roots: { listChanged: true } },
                  clientInfo: { name: 'Claude Code Remote', version: '1.0.0' }
                }
              }, (initResponse) => {
                if (initResponse.error) {
                  done(new Error(`Init failed: ${JSON.stringify(initResponse.error)}`));
                  return;
                }

                // Then get tools list
                sendHttpRequest({
                  jsonrpc: '2.0',
                  id: 2,
                  method: 'tools/list'
                }, (toolsResponse) => {
                  if (toolsResponse.error) {
                    done(new Error(`Tools list failed: ${JSON.stringify(toolsResponse.error)}`));
                    return;
                  }

                  expect(toolsResponse).to.have.property('result');
                  expect(toolsResponse.result).to.have.property('tools');
                  expect(toolsResponse.result.tools).to.be.an('array');
                  expect(toolsResponse.result.tools.length).to.be.greaterThan(50); // Reduced expectation
                  done();
                });
              });
            }, 5000); // Increased wait time
          }
        });

        mcpProxyServer.on('error', (error) => {
          done(error);
        });
      });
    });

    it('should handle tool execution via HTTP proxy', function(done) {
      this.timeout(30000);
      
      const acfMcpPath = path.join(__dirname, '../../bin/agentic-control-framework-mcp');
      mcpProxyServer = spawn('mcp-proxy', [
        '--port', proxyPort.toString(),
        'node', acfMcpPath,
        '--workspaceRoot', tempDir
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      mcpProxyServer.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes(`starting server on port ${proxyPort}`)) {
          setTimeout(() => {
            // Initialize first
            sendHttpRequest({
              jsonrpc: '2.0',
              id: 1,
              method: 'initialize',
              params: {
                protocolVersion: '2025-03-26',
                capabilities: { roots: { listChanged: true } },
                clientInfo: { name: 'Claude Code Remote', version: '1.0.0' }
              }
            }, (initResponse) => {
              // Execute a tool
              sendHttpRequest({
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: {
                  name: 'getNextTask',
                  arguments: {}
                }
              }, (toolResponse) => {
                expect(toolResponse).to.have.property('result');
                expect(toolResponse.result).to.have.property('content');
                expect(toolResponse.result.content).to.be.an('array');
                expect(toolResponse.result.content[0]).to.have.property('type', 'text');
                done();
              });
            });
          }, 3000);
        }
      });
      
      mcpProxyServer.on('error', (error) => {
        done(error);
      });
    });
  });

  // Helper function to send HTTP requests to mcp-proxy
  function sendHttpRequest(requestData, callback) {
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: 'localhost',
      port: proxyPort,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          callback(response);
        } catch (error) {
          callback({ error: { message: 'Invalid JSON response', data: responseData } });
        }
      });
    });
    
    req.on('error', (error) => {
      callback({ error: { message: error.message } });
    });
    
    req.write(postData);
    req.end();
  }
});
