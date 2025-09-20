const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Search & Edit', function() {
  this.timeout(15000);
  let server; let workspace;
  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-se-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('search_code finds patterns', async () => {
    const d = path.join(workspace, 'src'); fs.mkdirSync(d);
    const f = path.join(d, 'x.txt'); fs.writeFileSync(f, 'alpha\nbeta\ngamma');
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'search_code', arguments:{ path: d, pattern: 'beta', maxResults: 10 } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true; expect(out.matchCount).to.be.greaterThan(0);
  });

  it('edit_block replaces content with diff', async () => {
    const f = path.join(workspace, 'edit.txt'); fs.writeFileSync(f, 'hello world');
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'edit_block', arguments:{ file_path: f, old_string: 'world', new_string: 'ACF' } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true; expect(out.replacements).to.equal(1);
    const post = fs.readFileSync(f, 'utf8'); expect(post).to.equal('hello ACF');
  });
});

