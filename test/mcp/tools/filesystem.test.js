const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Filesystem', function() {
  this.timeout(15000);
  let server; let workspace;

  before(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-fs-'));
    server = startServer(workspace);
  });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive: true, force: true}); } catch(_){} });

  it('read_file / write_file', async () => {
    const f = path.join(workspace, 'a.txt');
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'write_file', arguments:{ path: f, content:'hello' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'read_file', arguments:{ path: f } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true; expect(out.content).to.equal('hello');
  });

  it('create_directory / list_directory / get_file_info', async () => {
    const d = path.join(workspace, 'sub');
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'create_directory', arguments:{ path: d } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'list_directory', arguments:{ path: workspace } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'get_file_info', arguments:{ path: d } } });
    const info = JSON.parse(res.result.content[0].text);
    expect(info.success).to.be.true; expect(info.type).to.exist;
  });

  it('copy_file / move_file / delete_file', async () => {
    const src = path.join(workspace, 'src.txt');
    const cp = path.join(workspace, 'cp.txt');
    const mv = path.join(workspace, 'mv.txt');
    fs.writeFileSync(src, 'x');
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'copy_file', arguments:{ source: src, destination: cp } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'move_file', arguments:{ source: cp, destination: mv } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'delete_file', arguments:{ path: mv } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
  });

  it('tree / search_files', async () => {
    const d2 = path.join(workspace, 'dir2'); fs.mkdirSync(d2);
    const f2 = path.join(d2, 'b.txt'); fs.writeFileSync(f2, 'needle here');
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'tree', arguments:{ path: workspace, depth: 2 } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'search_files', arguments:{ path: workspace, pattern: 'b.txt' } } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true; expect(out.matches || out.results).to.exist;
  });

  it('list_allowed_directories / get_filesystem_status', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'list_allowed_directories', arguments:{ random_string:'x' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'get_filesystem_status', arguments:{ random_string:'x' } } });
    const st = JSON.parse(res.result.content[0].text);
    expect(st.success).to.be.true; expect(st.allowedDirectories).to.be.an('array');
  });
});

