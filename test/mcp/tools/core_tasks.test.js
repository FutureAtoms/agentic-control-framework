const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: Core Task Ops', function() {
  this.timeout(20000);
  let server; let workspace;

  before(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-core-')); server = startServer(workspace); });
  after(async () => { await stopServer(server); try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){} });

  it('initProject / addTask / addSubtask / listTasks', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'initProject', arguments:{ projectName:'X', projectDescription:'Y' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'addTask', arguments:{ title:'T1', description:'D1', priority:'high' } } });
    const addOut = JSON.parse(res.result.content[0].text);
    expect(addOut.success).to.be.true;
    const id = addOut.taskId || 2;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'addSubtask', arguments:{ parentId: id, title:'S1' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'listTasks', arguments:{ status:'todo' } } });
    const list = JSON.parse(res.result.content[0].text);
    expect(list.success).to.be.true; expect(list.tasks).to.be.an('array');
  });

  it('updateStatus / getNextTask / updateTask / getContext', async () => {
    let res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'addTask', arguments:{ title:'T2' } } });
    const id = JSON.parse(res.result.content[0].text).taskId;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateStatus', arguments:{ id: String(id), newStatus:'inprogress', message:'Start' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'getNextTask', arguments:{ random_string:'x' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'updateTask', arguments:{ id: String(id), title:'T2b', description:'Z' } } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
    res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'getContext', arguments:{ id: String(id) } } });
    const ctx = JSON.parse(res.result.content[0].text);
    expect(ctx.success).to.be.true; expect(ctx.context || ctx).to.exist;
  });

  it('generateTaskFiles', async () => {
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name:'generateTaskFiles', arguments:{} } });
    expect(JSON.parse(res.result.content[0].text).success).to.be.true;
  });
});

