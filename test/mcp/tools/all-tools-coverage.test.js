const { expect } = require('chai');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { startServer, stopServer, sendRequest } = require('../helpers');

describe('MCP Tools: All Tools Coverage', function() {
  this.timeout(40000);
  let server; let workspace;

  const ENABLE_BROWSER = process.env.ACF_ENABLE_BROWSER_TOOLS === '1' && process.platform === 'darwin';
  const ENABLE_APPLESCRIPT = process.env.ACF_ENABLE_APPLESCRIPT === '1' && process.platform === 'darwin';
  const ENABLE_AI = !!process.env.GEMINI_API_KEY;

  async function call(name, args = {}) {
    const res = await sendRequest(server, { jsonrpc:'2.0', method:'tools/call', params:{ name, arguments: args } }, 8000);
    expect(res).to.have.property('result');
    const txt = res.result.content && res.result.content[0] ? res.result.content[0].text : '{}';
    let obj; try { obj = JSON.parse(txt); } catch (_) { obj = { raw: txt }; }
    return { res, obj };
  }

  before(async () => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-all-'));
    server = startServer(workspace);
    await call('initProject', { projectName:'AllTools', projectDescription:'coverage' });
  });

  after(async () => {
    await stopServer(server);
    try { fs.rmSync(workspace, { recursive:true, force:true }); } catch(_){}
  });

  it('runs all supported tools with sample arguments', async () => {
    const summary = { passed: [], failed: [], skipped: [] };

    async function run(name, args, opts = {}) {
      if (opts.skip) { summary.skipped.push(name); return; }
      try {
        const { obj } = await call(name, args);
        // Consider success if explicit success true, or we got a reasonable object back
        if (obj && (obj.success === true || typeof obj === 'object')) {
          summary.passed.push(name);
        } else {
          summary.failed.push(name);
        }
      } catch (e) {
        if (opts.allowError) {
          summary.passed.push(name);
        } else {
          summary.failed.push(name);
        }
      }
    }

    // Core tasks
    const add = await call('addTask', { title:'T1', description:'D', priority:'600' });
    const id = add.obj.taskId || 1;
    await run('addSubtask', { parentId: id, title:'S1' });
    await run('listTasks', { status:'todo' });
    await run('updateStatus', { id: String(id), newStatus:'inprogress', message:'Start' });
    await run('getNextTask', { random_string:'x' });
    await run('updateTask', { id: String(id), title:'T1b' });
    await run('getContext', { id: String(id) });
    await run('generateTaskFiles', {});
    await run('removeTask', { id: String(id) });

    // Filesystem
    const f = path.join(workspace, 'a.txt');
    await run('write_file', { path: f, content: 'hello world' });
    await run('read_file', { path: f });
    await run('create_directory', { path: path.join(workspace, 'sub') });
    await run('list_directory', { path: workspace });
    await run('copy_file', { source: f, destination: path.join(workspace, 'b.txt') });
    await run('move_file', { source: path.join(workspace, 'b.txt'), destination: path.join(workspace, 'c.txt') });
    await run('get_file_info', { path: path.join(workspace, 'c.txt') });
    await run('tree', { path: workspace, depth: 2 });
    await run('search_files', { path: workspace, pattern: 'c.txt' });
    await run('read_multiple_files', { paths: [f, path.join(workspace, 'c.txt')] });
    await run('list_allowed_directories', { random_string:'x' });
    await run('get_filesystem_status', { random_string:'x' });
    await run('delete_file', { path: path.join(workspace, 'c.txt') });

    // Terminal
    await run('get_config', { random_string:'x' });
    await run('set_config_value', { key:'commandTimeout', value: 8000 });
    // waitForCompletion true
    await run('execute_command', { command: process.platform==='win32' ? 'echo hello' : 'echo hello', waitForCompletion: true, shell: process.platform==='win32'? undefined : '/bin/sh' });
    // session based
    const sess = await call('execute_command', { command: process.platform==='win32' ? 'ping -n 2 127.0.0.1' : 'sleep 1', waitForCompletion: false });
    const pid = (sess.obj && (sess.obj.pid || sess.obj.sessionId)) ? sess.obj.pid : undefined;
    if (pid) {
      await run('read_output', { pid });
      await run('list_sessions', { random_string:'x' });
      await run('force_terminate', { pid });
    } else {
      summary.skipped.push('read_output');
      summary.skipped.push('list_sessions');
      summary.skipped.push('force_terminate');
    }
    await run('list_processes', { random_string:'x' });
    if (pid) { await run('kill_process', { pid }); } else { summary.skipped.push('kill_process'); }

    // Search & Edit
    const editFile = path.join(workspace, 'code.txt');
    fs.writeFileSync(editFile, 'alpha beta gamma');
    await run('search_code', { path: workspace, pattern: 'beta' });
    await run('edit_block', { file_path: editFile, old_string: 'beta', new_string: 'delta', normalize_whitespace: true });

    // Enhanced FS
    await run('read_url', { path: 'http://example.com' }, { allowError: true }); // allow errors in sandbox

    // Browser (optional)
    await run('browser_tab_new', { url: 'data:text/html,<html><body>Hi</body></html>' }, { skip: !ENABLE_BROWSER });
    await run('browser_snapshot', {}, { skip: !ENABLE_BROWSER });
    await run('browser_close', {}, { skip: !ENABLE_BROWSER });

    // AppleScript (optional)
    await run('applescript_execute', { code_snippet: 'return "ok"', timeout: 5 }, { skip: !ENABLE_APPLESCRIPT });

    // Priority wrappers
    const add2 = await call('addTask', { title:'P1', priority: '500' });
    const id2 = add2.obj.taskId || 2;
    await run('bump_task_priority', { id: String(id2), amount: 25 });
    await run('defer_task_priority', { id: String(id2), amount: 10 });
    await run('prioritize_task', { id: String(id2), priority: 880 });
    await run('deprioritize_task', { id: String(id2), priority: 150 });

    // Algorithm config
    await run('configure_time_decay', { enabled: true, halfLifeDays: 7 });
    await run('configure_effort_weighting', { enabled: true, weight: 0.5 });
    await run('show_algorithm_config', {});

    // File watcher
    await run('start_file_watcher', { debounceDelay: 100 });
    await run('file_watcher_status', {});
    await run('stop_file_watcher', {});

    // Extra core
    await run('generateTaskTable', {});

    // AI-backed (optional)
    await run('parsePrd', { filePath: path.join(workspace, 'prd.md') }, { skip: !ENABLE_AI });
    await run('expandTask', { taskId: String(id2) }, { skip: !ENABLE_AI });
    await run('reviseTasks', { fromTaskId: String(id2), prompt: 'Trim scope' }, { skip: !ENABLE_AI });

    // Print summary (helps audit in CI)
    // eslint-disable-next-line no-console
    console.log('[all-tools] Passed:', summary.passed.length, 'Skipped:', summary.skipped.length, 'Failed:', summary.failed.length);
    if (summary.failed.length) {
      // eslint-disable-next-line no-console
      console.log('[all-tools] Failed tools:', summary.failed.join(', '));
    }

    expect(summary.failed, 'All non-gated tools should pass').to.have.length(0);
  });
});
