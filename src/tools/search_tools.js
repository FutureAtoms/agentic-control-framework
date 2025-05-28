const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('../logger');

// Try to find ripgrep binary
let ripgrepPath;
try {
  // First try @vscode/ripgrep package
  const vscodeRgPath = path.join(__dirname, '../../node_modules/@vscode/ripgrep/bin/rg');
  if (fs.existsSync(vscodeRgPath)) {
    ripgrepPath = vscodeRgPath;
  } else {
    // Fallback to system rg
    ripgrepPath = 'rg';
  }
} catch (e) {
  ripgrepPath = 'rg';
}

/**
 * Search for code/text patterns using ripgrep
 */
async function searchCode(searchPath, pattern, options = {}) {
  try {
    // Validate inputs
    if (!searchPath || !pattern) {
      return {
        success: false,
        message: 'Both path and pattern are required'
      };
    }

    // Resolve the search path
    const resolvedPath = path.resolve(searchPath);
    
    // Check if path exists
    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        message: `Path not found: ${resolvedPath}`
      };
    }

    // Build ripgrep arguments
    const args = [];
    
    // Add pattern
    args.push(pattern);
    
    // Add path
    args.push(resolvedPath);
    
    // Add options
    if (options.ignoreCase !== false) {
      args.push('-i'); // Case insensitive by default
    }
    
    if (options.filePattern) {
      args.push('-g', options.filePattern);
    }
    
    if (options.contextLines && options.contextLines > 0) {
      args.push('-C', options.contextLines.toString());
    }
    
    if (options.includeHidden) {
      args.push('--hidden');
    }
    
    // Always include line numbers
    args.push('-n');
    
    // Add JSON output for easier parsing
    args.push('--json');
    
    // Limit results
    const maxResults = options.maxResults || 100;
    args.push('--max-count', maxResults.toString());

    // Set timeout
    const timeout = options.timeoutMs || 30000;

    // Execute ripgrep
    const results = await new Promise((resolve, reject) => {
      const rg = spawn(ripgrepPath, args, {
        cwd: process.cwd(),
        timeout
      });

      let stdout = '';
      let stderr = '';

      rg.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rg.on('error', (error) => {
        if (error.code === 'ENOENT') {
          reject(new Error('ripgrep not found. Please install ripgrep to use code search.'));
        } else {
          reject(error);
        }
      });

      rg.on('close', (code) => {
        if (code === 0 || code === 1) { // 0 = found matches, 1 = no matches
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`ripgrep exited with code ${code}: ${stderr}`));
        }
      });

      // Handle timeout
      setTimeout(() => {
        rg.kill('SIGTERM');
        reject(new Error('Search timeout exceeded'));
      }, timeout);
    });

    // Parse results
    const matches = [];
    const lines = results.stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        
        if (json.type === 'match') {
          const match = {
            path: json.data.path.text,
            lineNumber: json.data.line_number,
            line: json.data.lines.text.trim(),
            column: json.data.submatches[0]?.start || 0,
            matchText: json.data.submatches[0]?.match.text || ''
          };
          
          // Make path relative to search path for cleaner output
          match.relativePath = path.relative(resolvedPath, match.path);
          
          matches.push(match);
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }

    return {
      success: true,
      searchPath: resolvedPath,
      pattern,
      matchCount: matches.length,
      matches: matches.slice(0, maxResults),
      truncated: matches.length > maxResults,
      usingRipgrep: true,
      ripgrepPath
    };

  } catch (error) {
    logger.error(`Error in searchCode: ${error.message}`);
    
    // Check if it's a ripgrep not found error
    if (error.message.includes('ripgrep not found')) {
      // Try using native grep as fallback
      return searchCodeFallback(searchPath, pattern, options);
    }
    
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Fallback search using native grep when ripgrep is not available
 */
async function searchCodeFallback(searchPath, pattern, options = {}) {
  try {
    logger.info('Using grep fallback for code search');
    
    const resolvedPath = path.resolve(searchPath);
    
    // Build grep arguments
    const args = ['-r', '-n']; // Recursive with line numbers
    
    if (options.ignoreCase !== false) {
      args.push('-i');
    }
    
    if (options.contextLines && options.contextLines > 0) {
      args.push('-C', options.contextLines.toString());
    }
    
    // Add pattern and path
    args.push(pattern, resolvedPath);

    // Execute grep
    const result = await new Promise((resolve, reject) => {
      const grep = spawn('grep', args, {
        cwd: process.cwd(),
        timeout: options.timeoutMs || 30000
      });

      let stdout = '';
      let stderr = '';

      grep.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      grep.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      grep.on('close', (code) => {
        if (code === 0 || code === 1) { // 0 = found, 1 = not found
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`grep exited with code ${code}`));
        }
      });

      grep.on('error', reject);
    });

    // Parse grep output
    const matches = [];
    const lines = result.stdout.split('\n').filter(line => line.trim());
    const maxResults = options.maxResults || 100;

    for (const line of lines.slice(0, maxResults)) {
      const match = line.match(/^(.+?):(\d+):(.*)$/);
      if (match) {
        matches.push({
          path: match[1],
          relativePath: path.relative(resolvedPath, match[1]),
          lineNumber: parseInt(match[2]),
          line: match[3].trim(),
          matchText: pattern
        });
      }
    }

    return {
      success: true,
      searchPath: resolvedPath,
      pattern,
      matchCount: matches.length,
      matches,
      truncated: lines.length > maxResults,
      fallback: true,
      message: 'Using grep fallback. Install ripgrep for better performance.'
    };

  } catch (error) {
    logger.error(`Error in searchCodeFallback: ${error.message}`);
    return {
      success: false,
      message: `Search failed: ${error.message}`
    };
  }
}

module.exports = {
  searchCode
};
