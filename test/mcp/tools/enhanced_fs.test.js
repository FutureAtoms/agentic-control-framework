const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Enhanced FS', function() {
  this.timeout(15000);
  let server; let workspace;
  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-efs-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('read_url returns error for invalid URL', async () => {
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'read_url', arguments:{ path: 'not-a-url' } } });
    if (res.error) {
      // Accept either MCP error or tool-level error JSON
      expect(res.error).to.be.an('object');
    } else {
      const out = JSON.parse(res.result.content[0].text);
      expect(out.success).to.be.false;
    }
  });
});
