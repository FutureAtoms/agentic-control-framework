/**
 * Filesystem tools for MCP
 * Provides secure file system operations through the Model Context Protocol
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const mime = require('mime-types');
const { globSync } = require('glob');

// Maximum file size for reading (10MB default)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates that a path is within allowed directories
 * @param {string} filePath - Path to validate
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {boolean} - Whether the path is allowed
 */
function isPathAllowed(filePath, allowedDirs) {
  if (!allowedDirs || !Array.isArray(allowedDirs) || allowedDirs.length === 0) {
    logger.error('No allowed directories configured');
    return false;
  }

  // Resolve to absolute path
  const resolvedPath = path.resolve(filePath);
  
  // Check if the path is within any of the allowed directories
  return allowedDirs.some(dir => {
    const resolvedDir = path.resolve(dir);
    return resolvedPath === resolvedDir || resolvedPath.startsWith(resolvedDir + path.sep);
  });
}

/**
 * Reads a file and returns its contents
 * @param {string} filePath - Path to the file
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with file content
 */
function readFile(filePath, allowedDirs) {
  try {
    if (!filePath) {
      return { success: false, message: 'No file path provided' };
    }

    if (!isPathAllowed(filePath, allowedDirs)) {
      return { success: false, message: `Access to path "${filePath}" is not allowed` };
    }

    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      return { success: false, message: `Path is a directory, not a file: ${filePath}` };
    }

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        message: `File is too large (${(stats.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` 
      };
    }

    // Determine file type
    const mimeType = mime.lookup(resolvedPath) || 'application/octet-stream';
    const isText = mimeType.startsWith('text/') || 
      ['application/json', 'application/javascript', 'application/xml'].includes(mimeType);

    // Read file based on type
    let content;
    if (isText) {
      content = fs.readFileSync(resolvedPath, 'utf8');
    } else {
      // For binary files, return base64 encoded data
      const buffer = fs.readFileSync(resolvedPath);
      content = buffer.toString('base64');
    }

    return {
      success: true,
      content,
      mimeType,
      isText,
      size: stats.size,
      path: filePath
    };
  } catch (error) {
    logger.error(`Error reading file: ${error.message}`);
    return { success: false, message: `Error reading file: ${error.message}` };
  }
}

/**
 * Reads multiple files at once
 * @param {Array<string>} filePaths - List of file paths to read
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with file contents
 */
function readMultipleFiles(filePaths, allowedDirs) {
  try {
    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return { success: false, message: 'No file paths provided' };
    }

    const results = filePaths.map(filePath => {
      const result = readFile(filePath, allowedDirs);
      return {
        path: filePath,
        success: result.success,
        content: result.success ? result.content : null,
        mimeType: result.mimeType,
        isText: result.isText,
        error: result.success ? null : result.message
      };
    });

    return {
      success: true,
      results
    };
  } catch (error) {
    logger.error(`Error reading multiple files: ${error.message}`);
    return { success: false, message: `Error reading multiple files: ${error.message}` };
  }
}

/**
 * Writes content to a file
 * @param {string} filePath - Path to the file
 * @param {string} content - Content to write
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object
 */
function writeFile(filePath, content, allowedDirs) {
  try {
    if (!filePath) {
      return { success: false, message: 'No file path provided' };
    }

    if (!content && content !== '') {
      return { success: false, message: 'No content provided' };
    }

    if (!isPathAllowed(filePath, allowedDirs)) {
      return { success: false, message: `Access to path "${filePath}" is not allowed` };
    }

    const resolvedPath = path.resolve(filePath);
    
    // Ensure the directory exists
    const directory = path.dirname(resolvedPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(resolvedPath, content);

    return {
      success: true,
      message: `File written successfully: ${filePath}`,
      path: filePath
    };
  } catch (error) {
    logger.error(`Error writing file: ${error.message}`);
    return { success: false, message: `Error writing file: ${error.message}` };
  }
}

/**
 * Lists files and directories in a directory
 * @param {string} dirPath - Path to the directory
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with directory contents
 */
function listDirectory(dirPath, allowedDirs) {
  try {
    if (!dirPath) {
      return { success: false, message: 'No directory path provided' };
    }

    if (!isPathAllowed(dirPath, allowedDirs)) {
      return { success: false, message: `Access to path "${dirPath}" is not allowed` };
    }

    const resolvedPath = path.resolve(dirPath);
    
    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `Directory not found: ${dirPath}` };
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return { success: false, message: `Path is not a directory: ${dirPath}` };
    }

    // Read directory contents
    const items = fs.readdirSync(resolvedPath);
    
    // Get information about each item
    const contents = items.map(item => {
      const itemPath = path.join(resolvedPath, item);
      const itemStats = fs.statSync(itemPath);
      const type = itemStats.isDirectory() ? 'directory' : 'file';
      
      return {
        name: item,
        type,
        path: path.join(dirPath, item),
        size: itemStats.size,
        modified: itemStats.mtime.toISOString()
      };
    });

    return {
      success: true,
      path: dirPath,
      contents
    };
  } catch (error) {
    logger.error(`Error listing directory: ${error.message}`);
    return { success: false, message: `Error listing directory: ${error.message}` };
  }
}

/**
 * Creates a directory
 * @param {string} dirPath - Path to the directory
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object
 */
function createDirectory(dirPath, allowedDirs) {
  try {
    if (!dirPath) {
      return { success: false, message: 'No directory path provided' };
    }

    if (!isPathAllowed(dirPath, allowedDirs)) {
      return { success: false, message: `Access to path "${dirPath}" is not allowed` };
    }

    const resolvedPath = path.resolve(dirPath);
    
    // Create the directory
    fs.mkdirSync(resolvedPath, { recursive: true });

    return {
      success: true,
      message: `Directory created successfully: ${dirPath}`,
      path: dirPath
    };
  } catch (error) {
    logger.error(`Error creating directory: ${error.message}`);
    return { success: false, message: `Error creating directory: ${error.message}` };
  }
}

/**
 * Moves or renames a file or directory
 * @param {string} sourcePath - Source path
 * @param {string} destinationPath - Destination path
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object
 */
function moveFile(sourcePath, destinationPath, allowedDirs) {
  try {
    if (!sourcePath) {
      return { success: false, message: 'No source path provided' };
    }

    if (!destinationPath) {
      return { success: false, message: 'No destination path provided' };
    }

    if (!isPathAllowed(sourcePath, allowedDirs) || !isPathAllowed(destinationPath, allowedDirs)) {
      return { success: false, message: 'Access to source or destination path is not allowed' };
    }

    const resolvedSourcePath = path.resolve(sourcePath);
    const resolvedDestPath = path.resolve(destinationPath);
    
    // Check if source exists
    if (!fs.existsSync(resolvedSourcePath)) {
      return { success: false, message: `Source not found: ${sourcePath}` };
    }

    // Check if destination exists
    if (fs.existsSync(resolvedDestPath)) {
      return { success: false, message: `Destination already exists: ${destinationPath}` };
    }

    // Ensure destination directory exists
    const destDir = path.dirname(resolvedDestPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Move/rename the file or directory
    fs.renameSync(resolvedSourcePath, resolvedDestPath);

    return {
      success: true,
      message: `Successfully moved ${sourcePath} to ${destinationPath}`,
      source: sourcePath,
      destination: destinationPath
    };
  } catch (error) {
    logger.error(`Error moving file: ${error.message}`);
    return { success: false, message: `Error moving file: ${error.message}` };
  }
}

/**
 * Searches for files and directories matching a pattern
 * @param {string} searchPath - Path to search in
 * @param {string} pattern - Search pattern
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with search results
 */
function searchFiles(searchPath, pattern, allowedDirs) {
  try {
    if (!searchPath) {
      return { success: false, message: 'No search path provided' };
    }

    if (!pattern) {
      return { success: false, message: 'No search pattern provided' };
    }

    if (!isPathAllowed(searchPath, allowedDirs)) {
      return { success: false, message: `Access to path "${searchPath}" is not allowed` };
    }

    const resolvedPath = path.resolve(searchPath);
    
    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `Directory not found: ${searchPath}` };
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return { success: false, message: `Path is not a directory: ${searchPath}` };
    }

    // Use glob to search for files
    const searchPattern = path.join(resolvedPath, '**', pattern);
    const matches = globSync(searchPattern, { nodir: false });
    
    // Convert absolute paths back to relative paths
    const results = matches.map(match => ({
      path: path.relative(process.cwd(), match),
      type: fs.statSync(match).isDirectory() ? 'directory' : 'file'
    }));

    return {
      success: true,
      results,
      count: results.length,
      pattern
    };
  } catch (error) {
    logger.error(`Error searching files: ${error.message}`);
    return { success: false, message: `Error searching files: ${error.message}` };
  }
}

/**
 * Gets information about a file or directory
 * @param {string} filePath - Path to the file or directory
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with file information
 */
function getFileInfo(filePath, allowedDirs) {
  try {
    if (!filePath) {
      return { success: false, message: 'No file path provided' };
    }

    if (!isPathAllowed(filePath, allowedDirs)) {
      return { success: false, message: `Access to path "${filePath}" is not allowed` };
    }

    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }

    // Get file stats
    const stats = fs.statSync(resolvedPath);
    const type = stats.isDirectory() ? 'directory' : 'file';
    
    // Determine MIME type for files
    let mimeType = null;
    if (type === 'file') {
      mimeType = mime.lookup(resolvedPath) || 'application/octet-stream';
    }

    return {
      success: true,
      path: filePath,
      type,
      size: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
      mimeType,
      permissions: {
        readable: fs.accessSync(resolvedPath, fs.constants.R_OK, () => false) || true,
        writable: fs.accessSync(resolvedPath, fs.constants.W_OK, () => false) || true,
        executable: fs.accessSync(resolvedPath, fs.constants.X_OK, () => false) || true
      }
    };
  } catch (error) {
    logger.error(`Error getting file info: ${error.message}`);
    return { success: false, message: `Error getting file info: ${error.message}` };
  }
}

/**
 * Copies a file or directory
 * @param {string} sourcePath - Source path
 * @param {string} destinationPath - Destination path
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object
 */
function copyFile(sourcePath, destinationPath, allowedDirs) {
  try {
    if (!sourcePath) {
      return { success: false, message: 'No source path provided' };
    }

    if (!destinationPath) {
      return { success: false, message: 'No destination path provided' };
    }

    if (!isPathAllowed(sourcePath, allowedDirs) || !isPathAllowed(destinationPath, allowedDirs)) {
      return { success: false, message: 'Access to source or destination path is not allowed' };
    }

    const resolvedSourcePath = path.resolve(sourcePath);
    const resolvedDestPath = path.resolve(destinationPath);
    
    // Check if source exists
    if (!fs.existsSync(resolvedSourcePath)) {
      return { success: false, message: `Source not found: ${sourcePath}` };
    }

    // Check if source is a directory or file
    const stats = fs.statSync(resolvedSourcePath);
    if (stats.isDirectory()) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(resolvedDestPath)) {
        fs.mkdirSync(resolvedDestPath, { recursive: true });
      }
      
      // Copy directory contents recursively
      const items = fs.readdirSync(resolvedSourcePath);
      for (const item of items) {
        const srcItemPath = path.join(resolvedSourcePath, item);
        const destItemPath = path.join(resolvedDestPath, item);
        if (fs.statSync(srcItemPath).isDirectory()) {
          // Recursive call for subdirectories
          copyFile(srcItemPath, destItemPath, allowedDirs);
        } else {
          // Copy file
          fs.copyFileSync(srcItemPath, destItemPath);
        }
      }
    } else {
      // Ensure destination directory exists
      const destDir = path.dirname(resolvedDestPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy file
      fs.copyFileSync(resolvedSourcePath, resolvedDestPath);
    }

    return {
      success: true,
      message: `Successfully copied ${sourcePath} to ${destinationPath}`,
      source: sourcePath,
      destination: destinationPath,
      type: stats.isDirectory() ? 'directory' : 'file'
    };
  } catch (error) {
    logger.error(`Error copying file: ${error.message}`);
    return { success: false, message: `Error copying file: ${error.message}` };
  }
}

/**
 * Deletes a file or directory
 * @param {string} filePath - Path to the file or directory
 * @param {boolean} recursive - Whether to delete directories recursively
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object
 */
function deleteFile(filePath, recursive, allowedDirs) {
  try {
    if (!filePath) {
      return { success: false, message: 'No file path provided' };
    }

    if (!isPathAllowed(filePath, allowedDirs)) {
      return { success: false, message: `Access to path "${filePath}" is not allowed` };
    }

    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `File not found: ${filePath}` };
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (stats.isDirectory()) {
      if (recursive) {
        // Recursively delete directory
        fs.rmSync(resolvedPath, { recursive: true, force: true });
      } else {
        // Check if directory is empty
        const items = fs.readdirSync(resolvedPath);
        if (items.length > 0) {
          return { 
            success: false, 
            message: `Directory is not empty: ${filePath}. Use recursive=true to delete non-empty directories.` 
          };
        }
        
        // Delete empty directory
        fs.rmdirSync(resolvedPath);
      }
    } else {
      // Delete file
      fs.unlinkSync(resolvedPath);
    }

    return {
      success: true,
      message: `Successfully deleted ${stats.isDirectory() ? 'directory' : 'file'}: ${filePath}`,
      path: filePath,
      type: stats.isDirectory() ? 'directory' : 'file'
    };
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    return { success: false, message: `Error deleting file: ${error.message}` };
  }
}

/**
 * Creates a tree representation of a directory
 * @param {string} dirPath - Path to the directory
 * @param {number} depth - Maximum depth to traverse
 * @param {boolean} followSymlinks - Whether to follow symbolic links
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with directory tree
 */
function createDirectoryTree(dirPath, depth = 3, followSymlinks = false, allowedDirs) {
  try {
    if (!dirPath) {
      return { success: false, message: 'No directory path provided' };
    }

    if (!isPathAllowed(dirPath, allowedDirs)) {
      return { success: false, message: `Access to path "${dirPath}" is not allowed` };
    }

    const resolvedPath = path.resolve(dirPath);
    
    // Check if directory exists
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, message: `Directory not found: ${dirPath}` };
    }

    // Check if it's a directory
    const stats = fs.statSync(resolvedPath);
    if (!stats.isDirectory()) {
      return { success: false, message: `Path is not a directory: ${dirPath}` };
    }

    // Function to recursively build tree
    function buildTree(currentPath, currentDepth) {
      if (currentDepth > depth) {
        return null;
      }

      const name = path.basename(currentPath);
      const stats = fs.statSync(currentPath);
      
      // Handle symlinks
      let isSymlink = false;
      let symlinkTarget = null;
      
      try {
        isSymlink = fs.lstatSync(currentPath).isSymbolicLink();
        if (isSymlink) {
          symlinkTarget = fs.readlinkSync(currentPath);
          
          // Don't follow symlinks if not allowed or if they point outside allowed dirs
          if (!followSymlinks || !isPathAllowed(symlinkTarget, allowedDirs)) {
            return {
              name,
              type: 'symlink',
              target: symlinkTarget,
              followed: false
            };
          }
          
          // Use target path for further operations if following symlinks
          if (followSymlinks) {
            currentPath = symlinkTarget;
          }
        }
      } catch (error) {
        // Ignore errors from symlink checking
      }
      
      if (stats.isDirectory()) {
        // Read directory contents
        let items;
        try {
          items = fs.readdirSync(currentPath);
        } catch (error) {
          return {
            name,
            type: 'directory',
            error: `Cannot read directory: ${error.message}`
          };
        }
        
        // Build tree for each item
        const children = items.map(item => {
          const itemPath = path.join(currentPath, item);
          return buildTree(itemPath, currentDepth + 1);
        }).filter(Boolean);
        
        return {
          name,
          type: 'directory',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          children,
          isSymlink,
          ...(isSymlink && { symlinkTarget })
        };
      } else {
        // File node
        return {
          name,
          type: 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          mimeType: mime.lookup(currentPath) || 'application/octet-stream',
          isSymlink,
          ...(isSymlink && { symlinkTarget })
        };
      }
    }

    // Build the tree
    const tree = buildTree(resolvedPath, 1);

    return {
      success: true,
      path: dirPath,
      tree
    };
  } catch (error) {
    logger.error(`Error creating directory tree: ${error.message}`);
    return { success: false, message: `Error creating directory tree: ${error.message}` };
  }
}

/**
 * Lists allowed directories
 * @param {Array<string>} allowedDirs - List of allowed directories
 * @returns {object} - Response object with allowed directories
 */
function listAllowedDirectories(allowedDirs) {
  try {
    if (!allowedDirs || !Array.isArray(allowedDirs) || allowedDirs.length === 0) {
      return { success: false, message: 'No allowed directories configured' };
    }

    // Resolve paths
    const resolvedDirs = allowedDirs.map(dir => ({
      path: dir,
      resolvedPath: path.resolve(dir),
      exists: fs.existsSync(path.resolve(dir))
    }));

    return {
      success: true,
      directories: resolvedDirs
    };
  } catch (error) {
    logger.error(`Error listing allowed directories: ${error.message}`);
    return { success: false, message: `Error listing allowed directories: ${error.message}` };
  }
}

module.exports = {
  readFile,
  readMultipleFiles,
  writeFile,
  listDirectory,
  createDirectory,
  moveFile,
  searchFiles,
  getFileInfo,
  copyFile,
  deleteFile,
  createDirectoryTree,
  listAllowedDirectories
}; 