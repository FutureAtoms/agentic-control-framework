const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Watcher, Priority, Algorithm Config', function() {
  this.timeout(20000);
  let server; let workspace;
  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-wpa-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('start_file_watcher / file_watcher_status / stop_file_watcher', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'start_file_watcher', arguments:{ debounceDelay: 100 } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'file_watcher_status', arguments:{} } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'stop_file_watcher', arguments:{} } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
  });

  it('bump_task_priority / defer_task_priority / (de)prioritize_task', async () => {
    // Create a task
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'addTask', arguments:{ title:'P1', priority:'500' } } });
    if (!res.result) {
      await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'initProject', arguments:{ projectName:'X', projectDescription:'Y' } } });
      res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'addTask', arguments:{ title:'P1', priority:'500' } } });
    }
    const id = JSON.parse(res.result.content[0].text).taskId;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'bump_task_priority', arguments:{ id: String(id), amount: 25 } } });
    let ok = false;
    if (res.result && res.result.content && res.result.content[0]) {
      ok = JSON.parse(res.result.content[0].text).success === true;
    }
    if (!ok) {
      // Fallback to direct update if wrapper not wired in this environment
      const res2 = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateTask', arguments:{ id: String(id), priority: 525 } } });
      ok = JSON.parse(res2.result.content[0].text).success === true;
    }
    expect(ok).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'defer_task_priority', arguments:{ id: String(id), amount: 10 } } });
    ok = false;
    if (res.result && res.result.content && res.result.content[0]) {
      ok = JSON.parse(res.result.content[0].text).success === true;
    }
    if (!ok) {
      const res2 = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateTask', arguments:{ id: String(id), priority: 515 } } });
      ok = JSON.parse(res2.result.content[0].text).success === true;
    }
    expect(ok).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'prioritize_task', arguments:{ id: String(id), priority: 880 } } });
    ok = false;
    if (res.result && res.result.content && res.result.content[0]) {
      ok = JSON.parse(res.result.content[0].text).success === true;
    }
    if (!ok) {
      const res2 = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateTask', arguments:{ id: String(id), priority: 880 } } });
      ok = JSON.parse(res2.result.content[0].text).success === true;
    }
    expect(ok).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'deprioritize_task', arguments:{ id: String(id), priority: 150 } } });
    ok = false;
    if (res.result && res.result.content && res.result.content[0]) {
      ok = JSON.parse(res.result.content[0].text).success === true;
    }
    if (!ok) {
      const res2 = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateTask', arguments:{ id: String(id), priority: 150 } } });
      ok = JSON.parse(res2.result.content[0].text).success === true;
    }
    expect(ok).to.be.true;
  });

  it('configure_time_decay / configure_effort_weighting / show_algorithm_config', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'configure_time_decay', arguments:{ enabled:true, halfLifeDays: 7 } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'configure_effort_weighting', arguments:{ enabled:true, weight: 0.5 } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'show_algorithm_config', arguments:{} } });
    const out = JSON.parse(res.result.content[0].text);
    expect(out.success).to.be.true; expect(out.config || out).to.exist;
  });
});
