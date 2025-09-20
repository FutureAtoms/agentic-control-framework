#!/usr/bin/env bash
set -euo pipefail

echo "[validate] Node version:" && node -v
echo "[validate] NPM version:" && npm -v

echo "[validate] Make executables runnable"
chmod +x bin/* || true

echo "[validate] CLI help"
./bin/acf --help | head -n 20

echo "[validate] Ensure workspace initialized"
if [ ! -f ".acf/tasks.json" ]; then
  ./bin/acf init --project-name "CI Validation" --project-description "Workspace for docs validation" >/dev/null 2>&1 || true
fi

echo "[validate] Quick CLI list"
./bin/acf list --table || true

echo "[validate] MCP stdio initialize (unified server)"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"validator","version":"1.0.0"}}}' | node src/mcp/server.js | head -n 1 || true

echo "[validate] MCP stdio tools/list (unified server)"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node src/mcp/server.js | head -n 1 || true

echo "[validate] DONE"
