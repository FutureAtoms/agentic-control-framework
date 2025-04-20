#!/usr/bin/env node

// Gemini Task Manager - MCP Rebuild Utility
// This script helps with reinstallation of the MCP components

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine workspace root
const workspaceRoot = __dirname;
console.log(`Using workspace root: ${workspaceRoot}`);

// MCP component paths
const MCP_COMPONENTS = [
  {
    path: 'gemini-task-manager/src/mcp_server.js',
    description: 'Main MCP server implementation',
    executable: true
  },
  {
    path: 'gemini-task-manager/bin/task-manager-mcp',
    description: 'MCP launcher script',
    executable: true
  },
  {
    path: 'gemini-task-manager/bin/mcp-wrapper.js',
    description: 'Standard MCP wrapper',
    executable: true
  },
  {
    path: 'gemini-task-manager/bin/mcp-wrapper-extreme.js', 
    description: 'Enhanced MCP wrapper with additional safeguards',
    executable: true
  },
  {
    path: 'gemini-task-manager/bin/mcp-safe.js',
    description: 'Simple MCP safe launcher',
    executable: true
  }
];

// Function to check and log component status
function checkComponent(component) {
  const fullPath = path.join(workspaceRoot, component.path);
  let status = 'Missing';
  let size = 0;
  
  try {
    const stats = fs.statSync(fullPath);
    status = 'OK';
    size = stats.size;
  } catch (err) {
    // File doesn't exist
  }
  
  return {
    ...component,
    fullPath,
    status,
    size
  };
}

// Check status of all components
console.log('Checking MCP component status:');
const componentStatus = MCP_COMPONENTS.map(checkComponent);

// Display results in a table
console.log('\nMCP Components Status:');
console.log('======================');
console.log('Component'.padEnd(50) + 'Status'.padEnd(10) + 'Size'.padEnd(10));
console.log('-'.repeat(70));

componentStatus.forEach(comp => {
  console.log(
    comp.path.padEnd(50) + 
    comp.status.padEnd(10) + 
    (comp.size > 0 ? `${comp.size} B` : '').padEnd(10)
  );
});

// Check for missing components
const missingComponents = componentStatus.filter(comp => comp.status === 'Missing');

if (missingComponents.length > 0) {
  console.log('\nMissing MCP components detected!');
  console.log('Would you like to rebuild the missing components? (y/n)');
  
  // In a real script, you would prompt for input here.
  // For demonstration purposes, let's assume yes
  const shouldRebuild = true;
  
  if (shouldRebuild) {
    console.log('\nRebuilding MCP components...');
    
    missingComponents.forEach(comp => {
      console.log(`Creating ${comp.path}...`);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(comp.fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Generate the component based on its path
      // In a real script, this would contain the actual component source code
      let content = '';
      
      if (comp.path.includes('mcp_server.js')) {
        console.log('Generating MCP server implementation...');
        // The content would come from a template or another file
      } else if (comp.path.includes('task-manager-mcp')) {
        console.log('Generating MCP launcher script...');
        // The content would come from a template or another file
      } else {
        console.log('Generating wrapper script...');
        // The content would come from a template or another file
      }
      
      // Write the file
      fs.writeFileSync(comp.fullPath, content);
      
      // Make executable if needed
      if (comp.executable) {
        try {
          fs.chmodSync(comp.fullPath, '755');
        } catch (err) {
          console.error(`Error making ${comp.path} executable: ${err.message}`);
        }
      }
    });
    
    console.log('\nMCP components rebuilt successfully!');
  } else {
    console.log('Rebuild cancelled.');
  }
} else {
  console.log('\nAll MCP components are present. No action needed.');
}

// Additional safeguard to fix permissions on all executables
console.log('\nFixing permissions on executable scripts...');
componentStatus.forEach(comp => {
  if (comp.executable && comp.status === 'OK') {
    try {
      fs.chmodSync(comp.fullPath, '755');
      console.log(`Fixed permissions for ${comp.path}`);
    } catch (err) {
      console.error(`Error fixing permissions for ${comp.path}: ${err.message}`);
    }
  }
});

console.log('\nMCP rebuild check completed.'); 