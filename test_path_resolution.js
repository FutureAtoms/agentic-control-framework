#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { resolvePath } = require('./src/core');

// Test script to demonstrate path resolution
const workspaceRoot = process.cwd();
console.log(`Current workspace root: ${workspaceRoot}`);

// Test with a relative path
const relativePath = 'prd.md';
const resolvedPath = resolvePath(workspaceRoot, relativePath);
console.log(`Resolved path for '${relativePath}': ${resolvedPath}`);

// Check if the file exists
console.log(`File exists at resolved path: ${fs.existsSync(resolvedPath)}`);

// Test with an absolute path
const absolutePath = path.join(workspaceRoot, 'prd.md');
const resolvedAbsolutePath = resolvePath(workspaceRoot, absolutePath);
console.log(`Resolved path for '${absolutePath}': ${resolvedAbsolutePath}`);

// Check if the file exists
console.log(`File exists at resolved absolute path: ${fs.existsSync(resolvedAbsolutePath)}`); 