#!/usr/bin/env node
/*
 End-to-end MCP tool scenario for ACF using JSON-RPC over stdio.
 - Starts MCP server bound to the demo workspace
 - Exercises core, filesystem, terminal, search/edit, and browser tools (headless)
*/
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.join(ROOT, 'workspaces', 'acf-demo');
const SERVER = path.join(ROOT, 'bin', 'agentic-control-framework-mcp');

if (!fs.existsSync(WORKSPACE)) {
  fs.mkdirSync(WORKSPACE, { recursive: true });
}

const proc = spawn('node', [SERVER, '--workspaceRoot', WORKSPACE], {
  cwd: ROOT,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    ACF_PATH: ROOT,
    WORKSPACE_ROOT: WORKSPACE,
    ALLOWED_DIRS: `${WORKSPACE}:/tmp`,
    READONLY_MODE: 'false',
    BROWSER_HEADLESS: 'true'
  }
});

proc.stderr.on('data', (d) => {
  // log server diagnostics to stderr
  process.stderr.write(d);
});

let id = 0;
function req(method, params = {}) {
  id += 1;
  const message = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
  proc.stdin.write(message);
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.id === id) {
            proc.stdout.off('data', onData);
            resolve(obj);
            return;
          }
        } catch (_) {
          // ignore partial lines
        }
      }
    };
    proc.stdout.on('data', onData);
    setTimeout(() => reject(new Error(`Timeout waiting for response to ${method}`)), 20000);
  });
}

function unwrapCall(res) {
  // tools/call returns {result: {content: [{text}]}}
  if (res && res.result && Array.isArray(res.result.content)) {
    const t = res.result.content.find((c) => c.type === 'text');
    if (t) {
      try { return JSON.parse(t.text); } catch { return { raw: t.text }; }
    }
  }
  return res.result;
}

async function main() {
  console.log(`[MCP] Workspace: ${WORKSPACE}`);
  // Initialize
  await req('initialize', { protocolVersion: '2024-11-05' });
  // notifications/initialized is a notification; no response expected
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

  // Tools list
  const tools = await req('tools/list');
  console.log(`[MCP] tools/list count=${tools.result.tools.length}`);

  // Workspace + project
  console.log('[MCP] setWorkspace');
  console.log(unwrapCall(await req('tools/call', { name: 'setWorkspace', arguments: { workspacePath: WORKSPACE } })));

  console.log('[MCP] initProject');
  console.log(unwrapCall(await req('tools/call', { name: 'initProject', arguments: { projectName: 'ACF Demo', projectDescription: 'MCP scenario' } })));

  // Filesystem
  const demoDir = path.join(WORKSPACE, 'mcp-demo');
  const demoFile = path.join(demoDir, 'hello.txt');
  console.log('[MCP] create_directory');
  console.log(unwrapCall(await req('tools/call', { name: 'create_directory', arguments: { path: demoDir } })));

  console.log('[MCP] write_file');
  console.log(unwrapCall(await req('tools/call', { name: 'write_file', arguments: { path: demoFile, content: 'hello from mcp' } })));

  console.log('[MCP] read_file');
  console.log(unwrapCall(await req('tools/call', { name: 'read_file', arguments: { path: demoFile } })));

  console.log('[MCP] list_directory');
  console.log(unwrapCall(await req('tools/call', { name: 'list_directory', arguments: { path: WORKSPACE } })));

  // Terminal
  console.log('[MCP] execute_command');
  console.log(unwrapCall(await req('tools/call', { name: 'execute_command', arguments: { command: 'echo ACF_OK', timeout: 2000 } })));

  // Search & Edit
  console.log('[MCP] search_code');
  console.log(unwrapCall(await req('tools/call', { name: 'search_code', arguments: { query: 'ACF Demo', path: WORKSPACE, case_sensitive: false } })));

  console.log('[MCP] edit_block');
  const indexHtml = path.join(WORKSPACE, 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log(unwrapCall(await req('tools/call', { name: 'edit_block', arguments: { file_path: indexHtml, old_string: 'ACF Demo Workspace', new_string: 'ACF MCP Demo Workspace', expected_replacements: 1 } })));
  } else {
    console.log({ skip: 'index.html not found' });
  }

  // Browser (headless, local file URL)
  console.log('[MCP] browser_navigate to file URL');
  const fileUrl = 'file://' + indexHtml;
  console.log(unwrapCall(await req('tools/call', { name: 'browser_navigate', arguments: { url: fileUrl } })));

  console.log('[MCP] browser_tab_list');
  console.log(unwrapCall(await req('tools/call', { name: 'browser_tab_list', arguments: { random_string: 'x' } })));

  console.log('[MCP] browser_resize 800x600');
  console.log(unwrapCall(await req('tools/call', { name: 'browser_resize', arguments: { width: 800, height: 600 } })));

  console.log('[MCP] Completed scenario');
  proc.kill('SIGTERM');
}

main().catch((err) => {
  console.error('[MCP] Scenario error:', err.message);
  try { proc.kill('SIGTERM'); } catch {}
  process.exit(1);
});
