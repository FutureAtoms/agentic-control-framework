/**
 * Core.js API Fixes and Enhancements
 * This file contains fixes to ensure all API methods return consistent values
 * Import this after core.js to apply the fixes
 */

const path = require('path');
const fs = require('fs');

/**
 * Wrap the original addTask to ensure it always returns the task ID directly
 * in addition to the success object
 */
function enhanceAddTask(originalAddTask) {
  return function(workspaceRoot, options) {
    const result = originalAddTask(workspaceRoot, options);
    
    // Ensure backward compatibility - return both the object and the ID
    if (result && result.success && result.taskId) {
      // Add the ID as a direct property for easier access
      result.id = result.taskId;
      
      // Also return just the ID if accessed as a number
      result.valueOf = function() { return result.taskId; };
      result.toString = function() { return String(result.taskId); };
    }
    
    return result;
  };
}

/**
 * Wrap removeTask to ensure it returns a proper success object
 */
function enhanceRemoveTask(originalRemoveTask) {
  return function(workspaceRoot, id) {
    try {
      const result = originalRemoveTask(workspaceRoot, id);
      
      // Ensure we always return an object with success status
      if (typeof result === 'undefined') {
        return { success: true, message: `Task/subtask ${id} removed`, id: id };
      }
      
      // Add the removed ID for reference
      if (result && result.success) {
        result.id = id;
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: error.message || `Failed to remove task/subtask ${id}`,
        error: error.message 
      };
    }
  };
}

/**
 * Wrap updateTask to ensure it returns proper success object with task info
 */
function enhanceUpdateTask(originalUpdateTask) {
  return function(workspaceRoot, id, options) {
    const result = originalUpdateTask(workspaceRoot, id, options);
    
    // Ensure we have the task ID in the result
    if (result && result.success) {
      result.id = id;
      result.taskId = id;
    }
    
    return result;
  };
}

/**
 * Wrap addSubtask to ensure it returns the subtask ID properly
 */
function enhanceAddSubtask(originalAddSubtask) {
  return function(workspaceRoot, parentId, options, tasksData) {
    const result = originalAddSubtask(workspaceRoot, parentId, options, tasksData);
    
    // Ensure backward compatibility
    if (result && result.success && result.subtaskId) {
      result.id = result.subtaskId;
      
      // Allow numeric-style access
      result.valueOf = function() { return result.subtaskId; };
      result.toString = function() { return result.subtaskId; };
    }
    
    return result;
  };
}

/**
 * Fix dependency handling to accept both arrays and comma-separated strings
 */
function fixDependencyHandling(tasksData, dependencies) {
  if (!dependencies) return [];
  
  // If it's already an array of numbers, return as is
  if (Array.isArray(dependencies)) {
    return dependencies.map(d => parseInt(d)).filter(id => !isNaN(id));
  }
  
  // If it's a string, split by comma
  if (typeof dependencies === 'string') {
    return dependencies.split(',')
      .map(d => parseInt(d.trim()))
      .filter(id => !isNaN(id));
  }
  
  // If it's a single number
  if (typeof dependencies === 'number') {
    return [dependencies];
  }
  
  return [];
}

/**
 * Sanitize file paths to prevent path traversal attacks
 */
function sanitizePath(filePath, workspaceRoot) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }
  
  // Normalize the path
  const normalized = path.normalize(filePath);
  
  // Check for path traversal attempts
  if (normalized.includes('..') || normalized.startsWith('/')) {
    console.warn(`Path traversal attempt blocked: ${filePath}`);
    return null;
  }
  
  // Resolve relative to workspace
  const resolved = path.resolve(workspaceRoot, normalized);
  
  // Ensure it's within the workspace
  if (!resolved.startsWith(workspaceRoot)) {
    console.warn(`Path outside workspace blocked: ${filePath}`);
    return null;
  }
  
  return normalized;
}

/**
 * Enhanced version of parseCommaSeparated that handles arrays too
 */
function parseFlexibleInput(input) {
  if (!input) return [];
  
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }
  
  if (typeof input === 'string') {
    return input.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  return [input];
}

/**
 * Apply all fixes to the core module
 */
function applyCoreFixes(core) {
  // Store original functions
  const originals = {
    addTask: core.addTask,
    removeTask: core.removeTask,
    updateTask: core.updateTask,
    addSubtask: core.addSubtask
  };
  
  // Apply enhancements
  core.addTask = enhanceAddTask(originals.addTask);
  core.removeTask = enhanceRemoveTask(originals.removeTask);
  core.updateTask = enhanceUpdateTask(originals.updateTask);
  core.addSubtask = enhanceAddSubtask(originals.addSubtask);
  
  // Add utility functions
  core.sanitizePath = sanitizePath;
  core.fixDependencyHandling = fixDependencyHandling;
  core.parseFlexibleInput = parseFlexibleInput;
  
  // Store originals for potential restoration
  core._originals = originals;
  
  return core;
}

module.exports = {
  applyCoreFixes,
  enhanceAddTask,
  enhanceRemoveTask,
  enhanceUpdateTask,
  enhanceAddSubtask,
  sanitizePath,
  fixDependencyHandling,
  parseFlexibleInput
};