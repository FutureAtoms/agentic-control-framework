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
  defaultShell: process.env.DEFAULT_SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash'),
  blockedCommands: (process.env.BLOCKED_COMMANDS || '').split(',').filter(Boolean),
  commandTimeout: parseInt(process.env.COMMAND_TIMEOUT || '30000'),
};

// Load config from file if exists
const configPath = path.join(__dirname, '../../config.json');
if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
    // Ensure commandTimeout is always a number
    if (config.commandTimeout !== undefined) {
      config.commandTimeout = parseInt(config.commandTimeout, 10);
    }
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
    const timeout = options.timeout_ms ? parseInt(options.timeout_ms, 10) : config.commandTimeout;
    const waitForCompletion = options.waitForCompletion !== false; // Default to true

    // For simple commands, wait for completion
    if (waitForCompletion) {
      try {
        const { shellCmd, shellArgs } = getShellCommand(shell, command);
        const result = await execa(shellCmd, shellArgs, {
          timeout,
          reject: false
        });

        const output = result.stdout || '';
        const error = result.stderr || '';
        const success = result.exitCode === 0;

        return {
          success,
          content: output || error || (success ? 'Command completed successfully' : 'Command failed'),
          command,
          shell,
          exitCode: result.exitCode,
          stdout: output,
          stderr: error,
          message: success ? 'Command completed successfully' : `Command failed with exit code ${result.exitCode}`
        };
      } catch (error) {
        if (error.code === 'ETIMEDOUT') {
          return {
            success: false,
            message: `Command timed out after ${timeout}ms`,
            command,
            content: 'Command timed out'
          };
        }
        throw error;
      }
    }

    // For long-running commands, return session info
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
    const { shellCmd, shellArgs } = getShellCommand(shell, command);
    const subprocess = execa(shellCmd, shellArgs, {
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

    // Return initial response for session-based execution
    return {
      success: true,
      pid: session.pid,
      sessionId,
      command,
      shell,
      status: session.status,
      message: `Command started with PID ${session.pid}`,
      content: `Command started with PID ${session.pid}`
    };

  } catch (error) {
    logger.error(`Error executing command: ${error.message}`);
    return {
      success: false,
      message: error.message,
      content: error.message
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

    // Kill the process tree (cross-platform)
    await new Promise((resolve, reject) => {
      treeKill(pid, undefined, (err) => {
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

    if (process.platform === 'win32') {
      await new Promise((resolve, reject) => {
        treeKill(pid, undefined, (err) => (err ? reject(err) : resolve()));
      });
    } else {
      // POSIX signals
      process.kill(pid, 'SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        process.kill(pid, 0); // still running
        process.kill(pid, 'SIGKILL');
      } catch (_) {
        // already exited
      }
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

// Helper to build shell command per platform
function getShellCommand(shell, command) {
  const isWin = process.platform === 'win32';
  const sh = (shell || '').toLowerCase();
  if (isWin) {
    if (sh.includes('powershell')) {
      return { shellCmd: shell, shellArgs: ['-NoProfile', '-Command', command] };
    }
    if (sh.includes('cmd')) {
      return { shellCmd: shell, shellArgs: ['/c', command] };
    }
    if (sh.includes('bash')) {
      return { shellCmd: shell, shellArgs: ['-c', command] };
    }
    // Fallback to powershell
    return { shellCmd: 'powershell.exe', shellArgs: ['-NoProfile', '-Command', command] };
  }
  // POSIX shells
  return { shellCmd: shell || '/bin/bash', shellArgs: ['-c', command] };
}
