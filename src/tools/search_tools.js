const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('../logger');

// Try to find ripgrep binary
let ripgrepPath;
try {
  // First try @vscode/ripgrep package (rg on POSIX, rg.exe on Windows)
  const rgBinaryName = process.platform === 'win32' ? 'rg.exe' : 'rg';
  const vscodeRgPath = path.join(__dirname, '../../node_modules/@vscode/ripgrep/bin', rgBinaryName);
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

    // Check if pattern looks like a file pattern (e.g., *.js, *.py)
    let searchPattern = pattern;
    let filePattern = options.filePattern;
    
    if (pattern.startsWith('*.') || pattern.includes('*.')) {
      // This is likely a file pattern, not a search pattern
      filePattern = pattern;
      searchPattern = '.'; // Search for any character (i.e., any line)
    }

    // Build ripgrep arguments
    const args = [];
    
    // Add search pattern
    args.push(searchPattern);
    
    // Add path
    args.push(resolvedPath);
    
    // Add options
    if (options.ignoreCase !== false) {
      args.push('-i'); // Case insensitive by default
    }
    
    if (filePattern) {
      args.push('-g', filePattern);
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

    // Format content for display
    let content = '';
    if (matches.length === 0) {
      content = `No matches found for pattern "${pattern}" in ${resolvedPath}`;
    } else {
      const displayMatches = matches.slice(0, maxResults);
      content = `Found ${matches.length} matches for pattern "${pattern}":\n\n`;
      
      for (const match of displayMatches) {
        content += `${match.relativePath || match.path}:${match.lineNumber}: ${match.line}\n`;
      }
      
      if (matches.length > maxResults) {
        content += `\n... and ${matches.length - maxResults} more matches (truncated)`;
      }
    }

    return {
      success: true,
      content,
      searchPath: resolvedPath,
      pattern: searchPattern,
      filePattern,
      matchCount: matches.length,
      matches: matches.slice(0, maxResults),
      truncated: matches.length > maxResults,
      usingRipgrep: true,
      ripgrepPath
    };

  } catch (error) {
    logger.error(`Error in searchCode: ${error.message}`);
    
    // Check if it's a ripgrep not found error
    if (error.message.includes('ripgrep not found') || error.message.includes('ENOENT')) {
      // Try platform-specific fallback
      if (process.platform === 'win32') {
        return searchCodeWindowsFallback(searchPath, pattern, options);
      }
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

/**
 * Fallback search for Windows using findstr, or last-resort Node scanning
 */
async function searchCodeWindowsFallback(searchPath, pattern, options = {}) {
  const resolvedPath = path.resolve(searchPath);
  const maxResults = options.maxResults || 100;
  const ignoreCase = options.ignoreCase !== false;

  // Try findstr if available
  try {
    const args = ['/c', `for /r "${resolvedPath}" %f in (*) do @findstr ${ignoreCase ? '/i ' : ''}/n /c:"${pattern}" "%f"`];
    const result = await new Promise((resolve, reject) => {
      const proc = spawn('cmd', args, { cwd: process.cwd(), windowsVerbatimArguments: true, timeout: options.timeoutMs || 30000 });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d.toString());
      proc.stderr.on('data', d => stderr += d.toString());
      proc.on('error', reject);
      proc.on('close', code => resolve({ code, stdout, stderr }));
    });

    if (result.code === 0 || result.code === 1) {
      const lines = result.stdout.split('\n').filter(Boolean);
      const matches = [];
      for (const line of lines) {
        // Format: path:line:text OR sometimes: path(line): text — handle common case
        const m = line.match(/^(.*?):(\d+):(.*)$/);
        if (m) {
          matches.push({
            path: m[1],
            relativePath: path.relative(resolvedPath, m[1]),
            lineNumber: parseInt(m[2], 10),
            line: m[3].trim(),
            matchText: pattern
          });
          if (matches.length >= maxResults) break;
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
        usingFindstr: true,
        message: matches.length ? 'Using findstr fallback' : 'No matches found'
      };
    }
  } catch (_) { /* fall through to Node scan */ }

  // Last-resort: Node scan (portable, slower)
  const matches = [];
  const rx = new RegExp(pattern, ignoreCase ? 'i' : '');

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.name.startsWith('.') && !options.includeHidden) continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(full);
          if (matches.length >= maxResults) return;
        } else {
          try {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
              if (rx.test(lines[i])) {
                matches.push({
                  path: full,
                  relativePath: path.relative(resolvedPath, full),
                  lineNumber: i + 1,
                  line: lines[i].trim(),
                  matchText: pattern
                });
                break; // one hit per file for speed
              }
            }
          } catch (_) { /* skip unreadable */ }
        }
        if (matches.length >= maxResults) return;
      }
    } catch (_) { /* ignore */ }
  }

  walk(resolvedPath);

  return {
    success: true,
    searchPath: resolvedPath,
    pattern,
    matchCount: matches.length,
    matches,
    truncated: false,
    fallback: true,
    usingFindstr: false,
    message: matches.length ? 'Using Node scan fallback' : 'No matches found'
  };
}

module.exports = {
  searchCode
};
