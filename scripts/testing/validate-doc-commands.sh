#!/usr/bin/env bash
set -euo pipefail

echo "[validate] Node version:" && node -v
echo "[validate] NPM version:" && npm -v

echo "[validate] Make executables runnable"
chmod +x bin/* || true

echo "[validate] CLI help"
./bin/acf --help | head -n 20

echo "[validate] Quick CLI list (repo has .acf/tasks.json)"
./bin/acf list --table || true

echo "[validate] MCP stdio initialize (v1 server)"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"validator","version":"1.0.0"}}}' | node src/mcp_server.js | head -n 1 || true

echo "[validate] MCP stdio tools/list (v1 server)"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node src/mcp_server.js | head -n 1 || true

echo "[validate] DONE"

