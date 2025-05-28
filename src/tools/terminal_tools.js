const execa = require('execa');
const treeKill = require('tree-kill');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// Active terminal sessions
const sessions = new Map();
let sessionCounter = 0;

// Configuration management
let config = {
  defaultShell: process.env.DEFAULT_SHELL || '/bin/bash',
  blockedCommands: (process.env.BLOCKED_COMMANDS || '').split(',').filter(Boolean),
  commandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '30000'),
};

// Load config from file if exists
const configPath = path.join(process.cwd(), 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
  } catch (error) {
    logger.error(`Failed to load config file: ${error.message}`);
  }
}

/**
 * Get the current configuration
 */
function getConfig() {
  try {
    return {
      success: true,
      ...config,
      version: require('../../package.json').version
    };
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Set a configuration value
 */
function setConfigValue(key, value) {
  try {
    if (!(key in config)) {
      return {
        success: false,
        message: `Unknown configuration key: ${key}`
      };
    }

    config[key] = value;

    // Save to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    logger.info(`Configuration updated: ${key} = ${JSON.stringify(value)}`);
    return {
      success: true,
      message: `Configuration updated: ${key}`,
      [key]: value
    };
  } catch (error) {
    logger.error(`Error setting config value: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Check if a command is blocked
 */
function isCommandBlocked(command) {
  const lowerCommand = command.toLowerCase().trim();
  return config.blockedCommands.some(blocked => 
    lowerCommand.includes(blocked.toLowerCase())
  );
}

/**
 * Execute a terminal command
 */
async function executeCommand(command, options = {}) {
  try {
    // Check for blocked commands
    if (isCommandBlocked(command)) {
      return {
        success: false,
        message: `Command blocked for security reasons: ${command}`,
        blockedCommand: true
      };
    }

    const shell = options.shell || config.defaultShell;
    const timeout = options.timeout_ms || config.commandTimeout;

    // Create a new session
    const sessionId = ++sessionCounter;
    const session = {
      id: sessionId,
      command,
      shell,
      startTime: Date.now(),
      output: [],
      error: [],
      status: 'running'
    };

    sessions.set(sessionId, session);

    // Execute the command
    const subprocess = execa(shell, ['-c', command], {
      timeout,
      buffer: false,
      reject: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    session.subprocess = subprocess;
    session.pid = subprocess.pid;

    // Collect output
    subprocess.stdout.on('data', (data) => {
      session.output.push(data.toString());
    });

    subprocess.stderr.on('data', (data) => {
      session.error.push(data.toString());
    });

    // Handle completion
    subprocess.then((result) => {
      session.status = result.failed ? 'failed' : 'completed';
      session.exitCode = result.exitCode;
      session.endTime = Date.now();
    }).catch((error) => {
      session.status = 'error';
      session.errorMessage = error.message;
      session.endTime = Date.now();
    });

    // Return initial response
    const initialOutput = await new Promise((resolve) => {
      let output = '';
      let resolved = false;

      const collectOutput = (data) => {
        if (!resolved) {
          output += data.toString();
          if (output.length > 1000 || Date.now() - session.startTime > 500) {
            resolved = true;
            resolve(output);
          }
        }
      };

      subprocess.stdout.on('data', collectOutput);
      subprocess.stderr.on('data', collectOutput);

      // Timeout for initial output
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(output || 'Command started, no output yet...');
        }
      }, 500);
    });

    return {
      success: true,
      pid: session.pid,
      sessionId,
      command,
      shell,
      initialOutput: initialOutput || 'Command started successfully',
      status: session.status,
      message: `Command started with PID ${session.pid}`
    };

  } catch (error) {
    logger.error(`Error executing command: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Read output from a running session
 */
function readOutput(pid) {
  try {
    // Find session by PID
    let session = null;
    for (const [id, s] of sessions) {
      if (s.pid === pid) {
        session = s;
        break;
      }
    }

    if (!session) {
      return {
        success: false,
        message: `No session found with PID ${pid}`
      };
    }

    const output = session.output.join('');
    const error = session.error.join('');

    // Clear read output
    session.output = [];
    session.error = [];

    return {
      success: true,
      pid,
      sessionId: session.id,
      status: session.status,
      output,
      error,
      exitCode: session.exitCode,
      duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime
    };

  } catch (error) {
    logger.error(`Error reading output: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Force terminate a session
 */
async function forceTerminate(pid) {
  try {
    // Find session by PID
    let session = null;
    for (const [id, s] of sessions) {
      if (s.pid === pid) {
        session = s;
        break;
      }
    }

    if (!session) {
      return {
        success: false,
        message: `No session found with PID ${pid}`
      };
    }

    // Kill the process tree
    await new Promise((resolve, reject) => {
      treeKill(pid, 'SIGKILL', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    session.status = 'terminated';
    session.endTime = Date.now();

    return {
      success: true,
      message: `Process ${pid} terminated successfully`,
      pid,
      sessionId: session.id
    };

  } catch (error) {
    logger.error(`Error terminating process: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * List all active sessions
 */
function listSessions() {
  try {
    const activeSessions = [];

    for (const [id, session] of sessions) {
      activeSessions.push({
        sessionId: id,
        pid: session.pid,
        command: session.command,
        shell: session.shell,
        status: session.status,
        startTime: new Date(session.startTime).toISOString(),
        duration: session.endTime ? session.endTime - session.startTime : Date.now() - session.startTime
      });
    }

    return {
      success: true,
      sessions: activeSessions,
      count: activeSessions.length
    };

  } catch (error) {
    logger.error(`Error listing sessions: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * List all running processes
 */
async function listProcesses() {
  try {
    // Dynamic import for ES module ps-list
    const psList = (await import('ps-list')).default;
    const processes = await psList();

    // Sort by CPU usage
    processes.sort((a, b) => (b.cpu || 0) - (a.cpu || 0));

    // Format the output
    const formattedProcesses = processes.slice(0, 50).map(proc => ({
      pid: proc.pid,
      name: proc.name,
      cpu: proc.cpu ? `${proc.cpu.toFixed(1)}%` : '0.0%',
      memory: proc.memory ? `${(proc.memory / 1024 / 1024).toFixed(1)} MB` : '0.0 MB',
      ppid: proc.ppid,
      cmd: proc.cmd
    }));

    return {
      success: true,
      processes: formattedProcesses,
      total: processes.length,
      showing: formattedProcesses.length
    };

  } catch (error) {
    logger.error(`Error listing processes: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Kill a process by PID
 */
async function killProcess(pid) {
  try {
    // Validate PID
    if (!pid || isNaN(pid)) {
      return {
        success: false,
        message: 'Invalid PID provided'
      };
    }

    // Don't allow killing critical system processes
    const criticalPids = [0, 1, process.pid];
    if (criticalPids.includes(pid)) {
      return {
        success: false,
        message: 'Cannot kill critical system process'
      };
    }

    // Kill the process
    process.kill(pid, 'SIGTERM');

    // Wait a moment and check if it's still running
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      process.kill(pid, 0); // Check if process exists
      // If we get here, process is still running, use SIGKILL
      process.kill(pid, 'SIGKILL');
    } catch (e) {
      // Process is already dead, which is what we want
    }

    return {
      success: true,
      message: `Process ${pid} terminated successfully`,
      pid
    };

  } catch (error) {
    if (error.code === 'ESRCH') {
      return {
        success: false,
        message: `Process ${pid} not found`
      };
    } else if (error.code === 'EPERM') {
      return {
        success: false,
        message: `Permission denied to kill process ${pid}`
      };
    }

    logger.error(`Error killing process: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

// Clean up completed sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.status !== 'running' && now - session.startTime > 300000) { // 5 minutes
      sessions.delete(id);
    }
  }
}, 60000); // Every minute

module.exports = {
  getConfig,
  setConfigValue,
  executeCommand,
  readOutput,
  forceTerminate,
  listSessions,
  listProcesses,
  killProcess
};
