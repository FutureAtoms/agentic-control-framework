const fs = require('fs');
const path = require('path');
const diff = require('diff');
const logger = require('../logger');

/**
 * Apply surgical text replacements to files
 */
function editBlock(filePath, oldString, newString, options = {}) {
  try {
    // Validate inputs
    if (!filePath || !oldString || newString === undefined) {
      return {
        success: false,
        message: 'file_path, old_string, and new_string are required'
      };
    }

    // Resolve file path
    const resolvedPath = path.resolve(filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        message: `File not found: ${resolvedPath}`
      };
    }

    // Read the file
    let content = fs.readFileSync(resolvedPath, 'utf8');
    
    // Count expected replacements (default is 1)
    const expectedReplacements = options.expected_replacements || 1;
    
    // Check for normalize_whitespace option (new feature)
    const normalizeWhitespace = options.normalize_whitespace || false;
    
    // If normalize_whitespace is true, normalize both content and search strings
    let searchString = oldString;
    let replaceString = newString;
    let originalContent = content;
    
    if (normalizeWhitespace) {
      // Normalize line endings and multiple spaces
      searchString = oldString.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');
      replaceString = newString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ');
    }
    
    // Find all occurrences
    const occurrences = findOccurrences(content, searchString);
    
    if (occurrences.length === 0) {
      // Try fuzzy matching if exact match not found
      const fuzzyMatch = findFuzzyMatch(originalContent, oldString);
      
      if (fuzzyMatch) {
        return {
          success: false,
          message: `No exact match found. Did you mean this?`,
          suggestion: fuzzyMatch.suggestion,
          diff: fuzzyMatch.diff,
          hint: 'The search string was not found exactly as provided. Check whitespace and formatting. You can also try setting normalize_whitespace: true.'
        };
      }
      
      return {
        success: false,
        message: 'Search string not found in file',
        searchString: oldString,
        hint: 'Try setting normalize_whitespace: true if whitespace differences are causing issues'
      };
    }
    
    if (occurrences.length !== expectedReplacements) {
      return {
        success: false,
        message: `Expected ${expectedReplacements} occurrence(s), but found ${occurrences.length}`,
        occurrences: occurrences.map(o => ({
          line: o.line,
          column: o.column,
          preview: o.preview
        })),
        hint: expectedReplacements === 1 ? 
          'Include more context to make the search string unique' : 
          `Set expected_replacements to ${occurrences.length} to replace all occurrences`
      };
    }
    
    // Perform the replacement
    let newContent = normalizeWhitespace ? originalContent : content;
    let replacementCount = 0;
    
    if (expectedReplacements === 1) {
      // Replace only the first occurrence
      if (normalizeWhitespace) {
        // For normalized whitespace, we need to be more careful
        const index = content.indexOf(searchString);
        if (index !== -1) {
          // Find the actual position in original content
          let originalIndex = findOriginalPosition(originalContent, content, index);
          if (originalIndex !== -1) {
            // Determine the actual length to replace in original content
            let endIndex = findOriginalPosition(originalContent, content, index + searchString.length);
            newContent = originalContent.substring(0, originalIndex) + 
                        replaceString + 
                        originalContent.substring(endIndex);
            replacementCount = 1;
          }
        }
      } else {
        newContent = content.replace(oldString, newString);
        replacementCount = 1;
      }
    } else {
      // Replace specified number of occurrences
      if (normalizeWhitespace) {
        // Complex case - need to map positions
        let normalizedContent = content;
        let workingContent = originalContent;
        
        for (let i = 0; i < expectedReplacements && i < occurrences.length; i++) {
          const index = normalizedContent.indexOf(searchString);
          if (index !== -1) {
            let originalIndex = findOriginalPosition(workingContent, normalizedContent, index);
            let endIndex = findOriginalPosition(workingContent, normalizedContent, index + searchString.length);
            
            if (originalIndex !== -1 && endIndex !== -1) {
              workingContent = workingContent.substring(0, originalIndex) + 
                             replaceString + 
                             workingContent.substring(endIndex);
              
              // Update normalized content for next iteration
              normalizedContent = normalizedContent.substring(0, index) + 
                                replaceString.replace(/[ \t]+/g, ' ') + 
                                normalizedContent.substring(index + searchString.length);
              
              replacementCount++;
            }
          }
        }
        newContent = workingContent;
      } else {
        // Simple case - direct replacement
        let lastIndex = 0;
        for (let i = 0; i < expectedReplacements && i < occurrences.length; i++) {
          const index = content.indexOf(oldString, lastIndex);
          if (index !== -1) {
            newContent = newContent.substring(0, index) + 
                        newString + 
                        newContent.substring(index + oldString.length);
            lastIndex = index + newString.length;
            replacementCount++;
          }
        }
      }
    }
    
    // Check line limit warning
    const lineCount = newContent.split('\n').length;
    const lineLimit = parseInt(process.env.FILE_WRITE_LINE_LIMIT || '50');
    
    if (lineCount > lineLimit * 2) {
      logger.warn(`File has ${lineCount} lines, which exceeds recommended limit of ${lineLimit * 2} for edit_block`);
    }
    
    // Write the file
    fs.writeFileSync(resolvedPath, newContent, 'utf8');
    
    // Generate a diff for confirmation
    const patches = diff.createPatch(filePath, originalContent, newContent);
    
    return {
      success: true,
      message: `Successfully replaced ${replacementCount} occurrence(s)`,
      path: resolvedPath,
      replacements: replacementCount,
      diff: patches,
      lineCount,
      normalizedWhitespace: normalizeWhitespace
    };
    
  } catch (error) {
    logger.error(`Error in editBlock: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Find the original position in content given a position in normalized content
 */
function findOriginalPosition(original, normalized, normalizedPos) {
  let origPos = 0;
  let normPos = 0;
  
  while (normPos < normalizedPos && origPos < original.length) {
    // Skip whitespace differences
    if (/\s/.test(original[origPos]) && /\s/.test(normalized[normPos])) {
      // Skip all whitespace in original
      let origStart = origPos;
      while (origPos < original.length && /\s/.test(original[origPos])) {
        origPos++;
      }
      // Skip single space in normalized
      normPos++;
    } else if (original[origPos] === normalized[normPos]) {
      origPos++;
      normPos++;
    } else {
      // Mismatch - this shouldn't happen if normalization is correct
      return -1;
    }
  }
  
  return origPos;
}

/**
 * Find all occurrences of a string in content
 */
function findOccurrences(content, searchString) {
  const occurrences = [];
  const lines = content.split('\n');
  let totalIndex = 0;
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let columnIndex = 0;
    
    while ((columnIndex = line.indexOf(searchString, columnIndex)) !== -1) {
      occurrences.push({
        line: lineNum + 1,
        column: columnIndex + 1,
        index: totalIndex + columnIndex,
        preview: getPreview(lines, lineNum, columnIndex, searchString.length)
      });
      columnIndex += searchString.length;
    }
    
    totalIndex += line.length + 1; // +1 for newline
  }
  
  return occurrences;
}

/**
 * Get a preview of the occurrence with context
 */
function getPreview(lines, lineNum, column, length) {
  const line = lines[lineNum];
  const start = Math.max(0, column - 30);
  const end = Math.min(line.length, column + length + 30);
  
  let preview = '';
  if (start > 0) preview += '...';
  preview += line.substring(start, end);
  if (end < line.length) preview += '...';
  
  return preview;
}

/**
 * Try to find a fuzzy match for the search string
 */
function findFuzzyMatch(content, searchString) {
  // Normalize whitespace in search string
  const normalizedSearch = searchString.replace(/\s+/g, ' ').trim();
  const searchLines = searchString.split('\n').map(l => l.trim());
  
  if (searchLines.length > 1) {
    // Multi-line search - try to find similar content
    const contentLines = content.split('\n');
    
    for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
      let match = true;
      let matchedLines = [];
      
      for (let j = 0; j < searchLines.length; j++) {
        const contentLine = contentLines[i + j].trim();
        const searchLine = searchLines[j];
        
        if (!contentLine.includes(searchLine) && !searchLine.includes(contentLine)) {
          match = false;
          break;
        }
        matchedLines.push(contentLines[i + j]);
      }
      
      if (match) {
        const suggestion = matchedLines.join('\n');
        const patches = diff.createPatch('fuzzy', searchString, suggestion);
        
        return {
          suggestion,
          diff: patches,
          startLine: i + 1,
          endLine: i + searchLines.length
        };
      }
    }
  } else {
    // Single line search - find best match
    const lines = content.split('\n');
    let bestMatch = null;
    let bestScore = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const score = similarityScore(normalizedSearch, line);
      
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = {
          line: line,
          lineNum: i + 1,
          score: score
        };
      }
    }
    
    if (bestMatch) {
      const patches = diff.createPatch('fuzzy', searchString, bestMatch.line);
      
      return {
        suggestion: bestMatch.line,
        diff: patches,
        line: bestMatch.lineNum,
        similarity: Math.round(bestMatch.score * 100) + '%'
      };
    }
  }
  
  return null;
}

/**
 * Calculate similarity score between two strings
 */
function similarityScore(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

module.exports = {
  editBlock
};
