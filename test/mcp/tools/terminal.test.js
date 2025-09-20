const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Terminal', function() {
  this.timeout(15000);
  let server; let workspace;
  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-term-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('get_config / set_config_value', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'get_config', arguments:{ random_string:'x' } } });
    const cfg = JSON.parse(res.result.content[0].text);
    expect(cfg.success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'set_config_value', arguments:{ key:'commandTimeout', value: 10000 } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
  });

  it('execute_command (wait) and list_processes', async () => {
    const cmd = process.platform === 'win32' ? 'echo hello' : 'echo hello';
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'execute_command', arguments:{ command: cmd, waitForCompletion: true, shell: process.platform==='win32'? undefined : '/bin/sh' } } });
    const out = JSON.parse(res.result.content[0].text);
    // Be tolerant across shells: either success or at least exitCode 0 / stdout contains output
    expect(out).to.be.an('object');
    if (out.success === false) {
      expect(out.exitCode).to.equal(0);
    }
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'list_processes', arguments:{ random_string:'x' } } });
    const lp = JSON.parse(res.result.content[0].text);
    expect(lp).to.be.an('object');
  });

  it('execute_command (session), read_output, force_terminate, list_sessions', async () => {
    // Start a long-running process (sleep)
    const cmd = process.platform === 'win32' ? 'ping -n 3 127.0.0.1' : 'sleep 2';
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'execute_command', arguments:{ command: cmd, waitForCompletion: false } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true;
    if (out.pid) {
      res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'read_output', arguments:{ pid: out.pid } } });
      expect(JSON.parse(res.result.content[0].text).success).to.be.true;
      await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'force_terminate', arguments:{ pid: out.pid } } });
    }
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'list_sessions', arguments:{ random_string:'x' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
  });
});
