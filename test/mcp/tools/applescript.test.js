const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

// AppleScript only on macOS; skip by default. Enable only with ACF_ENABLE_APPLESCRIPT=1 and darwin.
const ENABLED = process.env.ACF_ENABLE_APPLESCRIPT === '1' && process.platform === 'darwin';
const describeOrSkip = ENABLED ? describe : describe.skip;

describeOrSkip('MCP Tools: AppleScript (macOS)', function() {
  this.timeout(20000);
  let server; let workspace;
  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-as-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('applescript_execute (simple)', async () => {
    const script = 'return "ok"';
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'applescript_execute', arguments:{ code_snippet: script, timeout: 10 } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true;
  });
});

