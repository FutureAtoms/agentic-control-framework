const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function runCli(args, options = {}) {
  return new Promise((resolve) => {
    const acfBin = path.join(__dirname, '../../bin/acf');
    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, ...(options.env || {}) };
    const timeoutMs = options.timeoutMs || 15000; // default 15s guard

    const child = spawn('node', [acfBin, ...args], { cwd, env });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    const timer = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch (_) {}
      setTimeout(() => { try { child.kill('SIGKILL'); } catch (_) {} }, 1000);
      finish({ code: 124, stdout, stderr: stderr + `\n[TEST] CLI command timeout after ${timeoutMs}ms` });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      finish({ code, stdout, stderr });
    });
  });
}

function createTempWorkspace(prefix = 'acf-cli-test-') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return base;
}

function readTasksJson(workspace) {
  const tasksPath = path.join(workspace, '.acf', 'tasks.json');
  if (!fs.existsSync(tasksPath)) return null;
  return JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
}

module.exports = { runCli, createTempWorkspace, readTasksJson };
