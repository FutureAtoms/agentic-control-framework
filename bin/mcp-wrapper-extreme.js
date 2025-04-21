#!/usr/bin/env node

// MCP Extreme Wrapper
// This wrapper adds extreme measures to ensure clean and reliable JSON-RPC communication
// It intercepts and handles any unexpected errors that could corrupt stdout

// Save original stdout methods
const originalStdoutWrite = process.stdout.write;
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleDir = console.dir;

// Redirect all stdout writing methods to stderr
process.stdout.write = function(chunk, encoding, callback) {
  return process.stderr.write(chunk, encoding, callback);
};

// Redirect all console output methods to stderr
console.log = console.error;
console.info = console.error;
console.dir = function(...args) {
  return console.error(...args);
};

// Log to stderr about what's happening
process.stderr.write('MCP Extreme Wrapper: Starting with fully protected stdout\n');

// Create a clean stdout protection layer
process.on('uncaughtException', (err) => {
  process.stderr.write(`MCP Extreme Wrapper: FATAL UNCAUGHT EXCEPTION: ${err.message}\n`);
  process.stderr.write(err.stack + '\n');
  // Exit with error code
  process.exit(1);
});

// Also handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`MCP Extreme Wrapper: UNHANDLED PROMISE REJECTION: ${reason}\n`);
  // Continue execution
});

// Get the original command line arguments
const args = process.argv.slice(2);
process.stderr.write(`MCP Extreme Wrapper: Passing args: ${args.join(' ')}\n`);

// Restore the original stdout methods ONLY for specific JSON-RPC communication
// This ensures only valid JSON-RPC responses go to stdout
process.stderr.write('MCP Extreme Wrapper: Restoring controlled stdout access for JSON-RPC only\n');

// Create a safe console.log replacement that only allows JSON objects
console.log = function(message) {
  try {
    // Only allow strings that parse as JSON
    if (typeof message === 'string') {
      JSON.parse(message); // Will throw if not valid JSON
      // If we got here, it's valid JSON, so write to stdout
      return originalStdoutWrite.call(process.stdout, message + '\n');
    } else {
      // Non-string, convert to JSON first
      const jsonString = JSON.stringify(message);
      return originalStdoutWrite.call(process.stdout, jsonString + '\n');
    }
  } catch (e) {
    // Not valid JSON, redirect to stderr
    process.stderr.write(`MCP Extreme Wrapper: Prevented non-JSON output: ${message}\n`);
    return true;
  }
};

// Execute the MCP server script
require('../src/mcp_server.js'); 