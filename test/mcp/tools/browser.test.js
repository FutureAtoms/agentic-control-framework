const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

// Skip by default, and skip on Windows/Linux. Enable only with ACF_ENABLE_BROWSER_TOOLS=1 on macOS.
const ENABLED = process.env.ACF_ENABLE_BROWSER_TOOLS === '1' && process.platform === 'darwin';
const describeOrSkip = ENABLED ? describe : describe.skip;

describeOrSkip('MCP Tools: Browser (Playwright)', function() {
  this.timeout(30000);
  let server; let workspace;

  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-browser-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('browser_tab_new (data URL) and snapshot', async () => {
    const dataUrl = 'data:text/html,%3Chtml%3E%3Cbody%3E%3Ch1%3EHello%3C%2Fh1%3E%3C%2Fbody%3E%3C%2Fhtml%3E';
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'browser_tab_new', arguments:{ url: dataUrl } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true;

    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'browser_snapshot', arguments:{ random_string:'x' } } });
    const snap = JSON.parse(res.result.content[0].text);
    expect(snap.success).to.be.true;
  });

  it('browser_close', async () => {
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'browser_close', arguments:{} } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true;
  });
});

