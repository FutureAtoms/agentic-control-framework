/**
 * logger.js - Standardized logging utility for the Task Manager
 * 
 * This module ensures all logs are directed to the appropriate output streams:
 * - All debug/info/warn/error messages go to stderr
 * - Only actual command output (data meant for piping) goes to stdout
 */

/**
 * Log a debug message to stderr
 * @param {string} message - The message to log
 */
function debug(message) {
  console.error(`[DEBUG] ${message}`);
}

/**
 * Log an info message to stderr
 * @param {string} message - The message to log
 */
function info(message) {
  console.error(`[INFO] ${message}`);
}

/**
 * Log a warning message to stderr
 * @param {string} message - The message to log
 */
function warn(message) {
  console.error(`[WARN] ${message}`);
}

/**
 * Log an error message to stderr
 * @param {string} message - The message to log
 */
function error(message) {
  console.error(`[ERROR] ${message}`);
}

/**
 * Output data to stdout (for command results)
 * This is the only function that should write to stdout
 * @param {string|object} data - The data to output
 */
function output(data) {
  if (typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

/**
 * Output a table to stdout using the provided table object
 * @param {Table} table - The cli-table3 table object to output
 */
function outputTable(table) {
  console.log(table.toString());
}

module.exports = {
  debug,
  info,
  warn,
  error,
  output,
  outputTable
}; 