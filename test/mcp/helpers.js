const { spawn } = require('child_process');
const path = require('path');
const treeKill = require('tree-kill');

function startServer(workspaceRoot) {
  const serverPath = path.join(__dirname, '../../bin/agentic-control-framework-mcp');
  const child = spawn('node', [serverPath, '--workspaceRoot', workspaceRoot], {
    env: { ...process.env, WORKSPACE_ROOT: workspaceRoot },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return child;
}

function stopServer(proc) {
  return new Promise((resolve) => {
    if (!proc || !proc.pid) return resolve();
    try {
      treeKill(proc.pid, 'SIGKILL', () => resolve());
    } catch (_) {
      try { proc.kill('SIGKILL'); } catch (_) {}
      resolve();
    }
  });
}

function sendRequest(proc, req, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const id = req.id || Math.floor(Math.random() * 1e9);
    req.id = id;
    let out = '';
    let err = '';
    const onOut = (d) => {
      out += d.toString();
      const lines = out.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.id === id) {
            cleanup();
            return resolve(json);
          }
        } catch (_) {}
      }
    };
    const onErr = (d) => { err += d.toString(); };
    const cleanup = () => {
      proc.stdout.off('data', onOut);
      proc.stderr.off('data', onErr);
      clearTimeout(to);
    };
    const to = setTimeout(() => { cleanup(); reject(new Error(`Timeout waiting for response. Stderr: ${err}`)); }, timeoutMs);
    proc.stdout.on('data', onOut);
    proc.stderr.on('data', onErr);
    proc.stdin.write(JSON.stringify(req) + '\n');
  });
}

module.exports = { startServer, stopServer, sendRequest };

