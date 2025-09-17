const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const logger = require('../logger');

// Try to load sharp, but don't fail if it's not available
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  logger.warn('Sharp module not available - screenshot features will be disabled');
}

/**
 * Enhanced readFile that supports both local files and URLs
 */
async function readFileEnhanced(filePath, allowedDirs, options = {}) {
  try {
    // Check if it's a URL
    if (options.isUrl || (typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://')))) {
      return await readFileFromUrl(filePath, options);
    }
    
    // Otherwise, use the original readFile from filesystem_tools
    const filesystemTools = require('../filesystem_tools');
    return filesystemTools.readFile(filePath, allowedDirs);
    
  } catch (error) {
    logger.error(`Error in readFileEnhanced: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Read file content from a URL
 */
async function readFileFromUrl(url, options = {}) {
  try {
    // Validate URL
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (error) {
      return {
        success: false,
        message: `Invalid URL: ${url}`
      };
    }
    
    // Set timeout (default 30 seconds)
    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Fetch the content
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ACF-MCP/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          success: false,
          message: `HTTP error ${response.status}: ${response.statusText}`
        };
      }
      
      // Get content type
      const contentType = response.headers.get('content-type') || 'text/plain';
      const isText = contentType.startsWith('text/') || 
        contentType.includes('json') || 
        contentType.includes('xml') ||
        contentType.includes('javascript');
      
      // Handle different content types
      if (contentType.startsWith('image/')) {
        // Handle images
        const buffer = await response.buffer();
        
        // Convert to a format that can be displayed
        let processedBuffer = buffer;
        let processedType = contentType;
        
        // If it's a format that might not be supported, convert to JPEG
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType.split(';')[0])) {
          try {
            processedBuffer = await sharp(buffer).jpeg().toBuffer();
            processedType = 'image/jpeg';
          } catch (sharpError) {
            logger.warn(`Could not process image with sharp: ${sharpError.message}`);
          }
        }
        
        return {
          success: true,
          content: processedBuffer.toString('base64'),
          mimeType: processedType,
          isText: false,
          isUrl: true,
          url: url,
          size: processedBuffer.length
        };
      } else if (isText) {
        // Handle text content
        const text = await response.text();
        
        return {
          success: true,
          content: text,
          mimeType: contentType,
          isText: true,
          isUrl: true,
          url: url,
          size: text.length
        };
      } else {
        // Handle binary content
        const buffer = await response.buffer();
        
        return {
          success: true,
          content: buffer.toString('base64'),
          mimeType: contentType,
          isText: false,
          isUrl: true,
          url: url,
          size: buffer.length
        };
      }
      
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          message: `Request timeout after ${timeout}ms`
        };
      }
      throw fetchError;
    }
    
  } catch (error) {
    logger.error(`Error reading from URL: ${error.message}`);
    return {
      success: false,
      message: `Failed to read from URL: ${error.message}`
    };
  }
}

module.exports = {
  readFileEnhanced
};
