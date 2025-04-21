#!/usr/bin/env node

// This is a wrapper script that ensures clean stdout before executing the MCP server
// Save a reference to the original stdout write method
const originalStdoutWrite = process.stdout.write;

// Redirect all stdout to stderr temporarily
process.stdout.write = function(chunk, encoding, callback) {
  return process.stderr.write(chunk, encoding, callback);
};

// Log to stderr that we're starting the wrapper
process.stderr.write('MCP Wrapper: Starting with clean stdout\n');

// Get the original command line arguments
const args = process.argv.slice(2);

// Restore the original stdout.write just before requiring the actual script
// This ensures no unexpected output goes to stdout before JSON-RPC communication starts
process.stderr.write('MCP Wrapper: Restoring stdout and starting actual MCP server\n');
process.stdout.write = originalStdoutWrite;

// Execute the original MCP server script
require('../src/mcp_server.js'); 