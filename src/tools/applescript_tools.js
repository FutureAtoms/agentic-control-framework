/**
 * AppleScript tools for MCP
 * Provides AppleScript execution capabilities for macOS automation
 */

const { exec } = require('child_process');
const util = require('util');
const logger = require('../logger');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = util.promisify(exec);

/**
 * Executes AppleScript code
 * @param {string} scriptCode - The AppleScript code to execute
 * @param {number} timeout - Timeout in seconds (default: 60)
 * @returns {object} - Response object with execution result
 */
async function executeAppleScript(scriptCode, timeout = 60) {
  try {
    if (!scriptCode || typeof scriptCode !== 'string') {
      return { 
        success: false, 
        message: 'No AppleScript code provided' 
      };
    }

    // Check if we're on macOS
    if (os.platform() !== 'darwin') {
      return { 
        success: false, 
        message: 'AppleScript is only available on macOS' 
      };
    }

    logger.debug(`Executing AppleScript with timeout of ${timeout} seconds`);

    // Create a temporary file for the script
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'applescript-'));
    const scriptPath = path.join(tempDir, 'script.scpt');
    
    // Write the script to the temporary file
    await fs.writeFile(scriptPath, scriptCode, 'utf8');

    try {
      // Execute the AppleScript using osascript
      const { stdout, stderr } = await execAsync(
        `osascript "${scriptPath}"`,
        { 
          timeout: timeout * 1000,
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );

      // Clean up the temporary file
      await fs.rm(tempDir, { recursive: true, force: true });

      if (stderr && stderr.trim()) {
        logger.warn(`AppleScript stderr: ${stderr}`);
      }

      return {
        success: true,
        output: stdout.trim(),
        error: stderr ? stderr.trim() : null,
        executionTime: new Date().toISOString()
      };

    } catch (error) {
      // Clean up the temporary file on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      
      if (error.killed && error.signal === 'SIGTERM') {
        return {
          success: false,
          message: `AppleScript execution timed out after ${timeout} seconds`,
          error: error.message
        };
      }

      // Parse AppleScript errors
      const errorMessage = error.message || error.toString();
      const errorOutput = error.stderr || '';
      
      return {
        success: false,
        message: 'AppleScript execution failed',
        error: errorMessage,
        details: errorOutput,
        code: error.code
      };
    }

  } catch (error) {
    logger.error(`Error executing AppleScript: ${error.message}`);
    return {
      success: false,
      message: `Error executing AppleScript: ${error.message}`,
      error: error.stack
    };
  }
}

/**
 * Pre-built AppleScript templates for common operations
 */
const templates = {
  /**
   * Get all notes from Apple Notes
   */
  getNotes: () => `
    tell application "Notes"
      set notesList to {}
      repeat with aNote in notes
        set noteInfo to {name:name of aNote, body:body of aNote, id:id of aNote}
        set end of notesList to noteInfo
      end repeat
      return notesList
    end tell
  `,

  /**
   * Create a new note in Apple Notes
   */
  createNote: (title, body, folder = null) => {
    const folderScript = folder ? `of folder "${folder}"` : '';
    return `
      tell application "Notes"
        set newNote to make new note ${folderScript} with properties {name:"${title}", body:"${body}"}
        return {name:name of newNote, id:id of newNote}
      end tell
    `;
  },

  /**
   * Get calendar events
   */
  getCalendarEvents: (calendarName = null, daysAhead = 7) => {
    const calendarFilter = calendarName ? `of calendar "${calendarName}"` : '';
    return `
      tell application "Calendar"
        set today to current date
        set endDate to today + (${daysAhead} * days)
        set eventsList to {}
        
        repeat with anEvent in (every event ${calendarFilter} whose start date ≥ today and start date ≤ endDate)
          set eventInfo to {summary:summary of anEvent, startDate:start date of anEvent, endDate:end date of anEvent, location:location of anEvent}
          set end of eventsList to eventInfo
        end repeat
        
        return eventsList
      end tell
    `;
  },

  /**
   * Get system information
   */
  getSystemInfo: () => `
    set sysInfo to {}
    
    -- Get macOS version
    set sysInfo to sysInfo & {osVersion:system version of (system info)}
    
    -- Get computer name
    set sysInfo to sysInfo & {computerName:computer name of (system info)}
    
    -- Get user name
    set sysInfo to sysInfo & {userName:short user name of (system info)}
    
    -- Get disk info
    tell application "System Events"
      set diskList to {}
      repeat with aDisk in disks
        set diskInfo to {name:name of aDisk, capacity:capacity of aDisk, freeSpace:free space of aDisk}
        set end of diskList to diskInfo
      end repeat
    end tell
    
    set sysInfo to sysInfo & {disks:diskList}
    
    return sysInfo
  `,

  /**
   * Search for files using Spotlight
   */
  searchFiles: (query) => `
    do shell script "mdfind " & quoted form of "${query}"
  `,

  /**
   * Get Safari bookmarks
   */
  getSafariBookmarks: () => `
    tell application "Safari"
      set bookmarksList to {}
      repeat with aBookmark in bookmarks
        try
          set bookmarkInfo to {name:name of aBookmark, url:URL of aBookmark}
          set end of bookmarksList to bookmarkInfo
        end try
      end repeat
      return bookmarksList
    end tell
  `,

  /**
   * Send a message via Messages app
   */
  sendMessage: (recipient, message) => `
    tell application "Messages"
      set targetService to 1st account whose service type = iMessage
      set targetBuddy to participant "${recipient}" of targetService
      send "${message}" to targetBuddy
    end tell
  `,

  /**
   * Get contacts
   */
  getContacts: () => `
    tell application "Contacts"
      set contactsList to {}
      repeat with aPerson in people
        set contactInfo to {firstName:first name of aPerson, lastName:last name of aPerson, email:(value of first email of aPerson), phone:(value of first phone of aPerson)}
        set end of contactsList to contactInfo
      end repeat
      return contactsList
    end tell
  `,

  /**
   * Take a screenshot
   */
  takeScreenshot: (filepath = null) => {
    const file = filepath || `~/Desktop/screenshot_${Date.now()}.png`;
    return `do shell script "screencapture ${file}"`;
  },

  /**
   * Get running applications
   */
  getRunningApps: () => `
    tell application "System Events"
      set appsList to {}
      repeat with anApp in (every process whose background only is false)
        set appInfo to {name:name of anApp, frontmost:frontmost of anApp}
        set end of appsList to appInfo
      end repeat
      return appsList
    end tell
  `
};

/**
 * Execute a pre-built AppleScript template
 * @param {string} templateName - Name of the template
 * @param {object} params - Parameters for the template
 * @param {number} timeout - Timeout in seconds
 * @returns {object} - Response object
 */
async function executeTemplate(templateName, params = {}, timeout = 60) {
  try {
    const template = templates[templateName];
    if (!template) {
      return {
        success: false,
        message: `Unknown template: ${templateName}`,
        availableTemplates: Object.keys(templates)
      };
    }

    // Generate the script from the template
    const script = typeof template === 'function' ? template(...Object.values(params)) : template;
    
    // Execute the script
    const result = await executeAppleScript(script, timeout);
    
    // Add template info to the result
    if (result.success) {
      result.template = templateName;
      result.params = params;
    }
    
    return result;
  } catch (error) {
    logger.error(`Error executing template ${templateName}: ${error.message}`);
    return {
      success: false,
      message: `Error executing template ${templateName}: ${error.message}`,
      error: error.stack
    };
  }
}

/**
 * Get available AppleScript templates
 * @returns {object} - List of available templates with descriptions
 */
function getAvailableTemplates() {
  return {
    success: true,
    templates: {
      getNotes: {
        description: 'Get all notes from Apple Notes',
        params: []
      },
      createNote: {
        description: 'Create a new note in Apple Notes',
        params: ['title', 'body', 'folder (optional)']
      },
      getCalendarEvents: {
        description: 'Get calendar events',
        params: ['calendarName (optional)', 'daysAhead (optional, default: 7)']
      },
      getSystemInfo: {
        description: 'Get system information',
        params: []
      },
      searchFiles: {
        description: 'Search for files using Spotlight',
        params: ['query']
      },
      getSafariBookmarks: {
        description: 'Get Safari bookmarks',
        params: []
      },
      sendMessage: {
        description: 'Send a message via Messages app',
        params: ['recipient', 'message']
      },
      getContacts: {
        description: 'Get contacts from Contacts app',
        params: []
      },
      takeScreenshot: {
        description: 'Take a screenshot',
        params: ['filepath (optional)']
      },
      getRunningApps: {
        description: 'Get list of running applications',
        params: []
      }
    }
  };
}

module.exports = {
  executeAppleScript,
  executeTemplate,
  getAvailableTemplates,
  templates
};
