#!/usr/bin/env node
// This is a wrapper script to ensure a clean MCP connection
// Redirect all console.log to stderr to keep stdout clean for JSON-RPC
console.log = console.error;
console.error("MCP Safe Wrapper: Starting with clean stdout");
require("../src/mcp_server.js");
