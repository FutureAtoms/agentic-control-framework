#!/usr/bin/env node

/**
 * Script to compare ACF tools with upstream MCP repositories
 * and identify new or updated tools
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const UPSTREAM_REPOS = {
  desktop_commander: {
    url: 'https://raw.githubusercontent.com/wonderwhy-er/DesktopCommanderMCP/main/src/server.js',
    name: 'Desktop Commander MCP'
  },
  playwright: {
    url: 'https://raw.githubusercontent.com/microsoft/playwright-mcp/main/src/index.ts',
    name: 'Playwright MCP'
  }
};

// Current ACF tools (extracted from unified server)
const ACF_TOOLS_PATH = path.join(__dirname, '../../src/mcp/server.js');

/**
 * Fetch content from a URL
 */
function fetchContent(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extract tool names from source code
 */
function extractTools(content, pattern) {
  const tools = new Set();
  const regex = new RegExp(pattern, 'g');
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      tools.add(match[1]);
    }
  }
  
  return Array.from(tools).sort();
}

/**
 * Get current ACF tools
 */
function getCurrentACFTools() {
  const content = fs.readFileSync(ACF_TOOLS_PATH, 'utf8');
  
  // Extract tool names from different patterns
  const patterns = [
    /name:\s*['"]([^'"]+)['"]/g,
    /case\s+['"]([^'"]+)['"]\s*:/g
  ];
  
  const tools = new Set();
  
  patterns.forEach(pattern => {
    const matches = extractTools(content, pattern.source);
    matches.forEach(tool => tools.add(tool));
  });
  
  return Array.from(tools).sort();
}

/**
 * Analyze Desktop Commander MCP tools
 */
async function analyzeDesktopCommander() {
  try {
    const content = await fetchContent(UPSTREAM_REPOS.desktop_commander.url);
    
    // Extract tools from the server implementation
    const patterns = [
      /tool:\s*['"]([^'"]+)['"]/g,
      /name:\s*['"]([^'"]+)['"]/g,
      /case\s+['"]([^'"]+)['"]/g
    ];
    
    const tools = new Set();
    
    patterns.forEach(pattern => {
      const matches = extractTools(content, pattern.source);
      matches.forEach(tool => tools.add(tool));
    });
    
    return Array.from(tools).sort();
  } catch (error) {
    console.error('Error analyzing Desktop Commander:', error.message);
    return [];
  }
}

/**
 * Analyze Playwright MCP tools
 */
async function analyzePlaywright() {
  try {
    const content = await fetchContent(UPSTREAM_REPOS.playwright.url);
    
    // Extract tools from TypeScript implementation
    const patterns = [
      /name:\s*['"]([^'"]+)['"]/g,
      /method:\s*['"]([^'"]+)['"]/g
    ];
    
    const tools = new Set();
    
    patterns.forEach(pattern => {
      const matches = extractTools(content, pattern.source);
      matches.forEach(tool => tools.add(tool));
    });
    
    return Array.from(tools).sort();
  } catch (error) {
    console.error('Error analyzing Playwright:', error.message);
    return [];
  }
}

/**
 * Compare tool lists and generate report
 */
function compareTools(acfTools, upstreamTools, repoName) {
  const missingInACF = upstreamTools.filter(tool => !acfTools.includes(tool));
  const uniqueToACF = acfTools.filter(tool => !upstreamTools.includes(tool));
  
  return {
    repoName,
    totalUpstream: upstreamTools.length,
    totalACF: acfTools.length,
    missingInACF,
    uniqueToACF,
    coverage: ((acfTools.filter(tool => upstreamTools.includes(tool)).length / upstreamTools.length) * 100).toFixed(1)
  };
}

/**
 * Generate comparison report
 */
function generateReport(comparisons) {
  let report = '# ACF Tool Comparison Report\n\n';
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  comparisons.forEach(comp => {
    report += `## ${comp.repoName}\n\n`;
    report += `- Total tools in upstream: ${comp.totalUpstream}\n`;
    report += `- Total tools in ACF: ${comp.totalACF}\n`;
    report += `- Coverage: ${comp.coverage}%\n\n`;
    
    if (comp.missingInACF.length > 0) {
      report += `### Missing in ACF (${comp.missingInACF.length} tools)\n\n`;
      comp.missingInACF.forEach(tool => {
        report += `- \`${tool}\`\n`;
      });
      report += '\n';
    }
    
    if (comp.uniqueToACF.length > 0) {
      report += `### Unique to ACF (${comp.uniqueToACF.length} tools)\n\n`;
      comp.uniqueToACF.forEach(tool => {
        report += `- \`${tool}\`\n`;
      });
      report += '\n';
    }
  });
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Analyzing ACF tools...');
  const acfTools = getCurrentACFTools();
  console.log(`Found ${acfTools.length} tools in ACF`);
  
  const comparisons = [];
  
  // Analyze Desktop Commander
  console.log('\n🔍 Analyzing Desktop Commander MCP...');
  const desktopCommanderTools = await analyzeDesktopCommander();
  console.log(`Found ${desktopCommanderTools.length} tools`);
  
  if (desktopCommanderTools.length > 0) {
    comparisons.push(compareTools(acfTools, desktopCommanderTools, 'Desktop Commander MCP'));
  }
  
  // Analyze Playwright
  console.log('\n🔍 Analyzing Playwright MCP...');
  const playwrightTools = await analyzePlaywright();
  console.log(`Found ${playwrightTools.length} tools`);
  
  if (playwrightTools.length > 0) {
    comparisons.push(compareTools(acfTools, playwrightTools, 'Playwright MCP'));
  }
  
  // Generate report
  const report = generateReport(comparisons);
  const reportPath = path.join(__dirname, '../docs/mcp-integration/tool-comparison-report.md');
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report generated: ${reportPath}`);
  
  // Print summary
  console.log('\n📊 Summary:');
  comparisons.forEach(comp => {
    console.log(`\n${comp.repoName}:`);
    console.log(`  - Missing in ACF: ${comp.missingInACF.length} tools`);
    console.log(`  - Coverage: ${comp.coverage}%`);
    
    if (comp.missingInACF.length > 0 && comp.missingInACF.length <= 5) {
      console.log(`  - Missing tools: ${comp.missingInACF.join(', ')}`);
    }
  });
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getCurrentACFTools, analyzeDesktopCommander, analyzePlaywright };
