#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  return res.status === 0;
}

function main() {
  if (process.env.ACF_SKIP_POSTINSTALL === '1') {
    console.log('[postinstall] Skipped via ACF_SKIP_POSTINSTALL=1');
    return;
  }

  const projectRoot = path.resolve(__dirname, '..');
  console.log('[postinstall] Project root:', projectRoot);

  // 1) Make executables runnable on POSIX
  if (process.platform !== 'win32') {
    try {
      const binDir = path.join(projectRoot, 'bin');
      if (fs.existsSync(binDir)) {
        const files = fs.readdirSync(binDir);
        files.forEach(f => {
          try { fs.chmodSync(path.join(binDir, f), 0o755); } catch (_) {}
        });
        console.log('[postinstall] chmod +x bin/* completed');
      }
    } catch (e) {
      console.warn('[postinstall] chmod bin/* failed:', e.message);
    }
  }

  // 2) Install Playwright browsers
  try {
    console.log('[postinstall] Installing Playwright browsers...');
    run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'install']);
    if (process.platform === 'linux') {
      console.log('[postinstall] Installing Playwright Linux deps...');
      run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'install-deps']);
    }
  } catch (e) {
    console.warn('[postinstall] Playwright install step failed:', e.message);
  }

  // 3) Ripgrep presence check (best effort)
  try {
    const rgName = process.platform === 'win32' ? 'rg.exe' : 'rg';
    const rgVendored = path.join(projectRoot, 'node_modules', '@vscode', 'ripgrep', 'bin', rgName);
    if (fs.existsSync(rgVendored)) {
      console.log('[postinstall] ripgrep found (vendored)');
    } else {
      console.warn('[postinstall] ripgrep not found in vendor path; ensure rg is on PATH for best search performance.');
      if (process.platform === 'win32') {
        console.warn('  Windows: choco install ripgrep');
      } else if (process.platform === 'darwin') {
        console.warn('  macOS: brew install ripgrep');
      } else {
        console.warn('  Linux: apt-get install ripgrep (or use your package manager)');
      }
    }
  } catch (_) {}

  console.log('[postinstall] Completed');
}

main();

