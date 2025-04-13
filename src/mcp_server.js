const readline = require('readline');
const core = require('./core');

// Map MCP method names to core functions
// This mapping might need adjustment based on how Cursor formats its requests
const methodMap = {
    // Task reading
    'listTasks': core.listTasks,
    'getNextTask': core.getNextTask,
    // Task modification
    'initProject': core.initProject,
    'addTask': core.addTask,
    'addSubtask': core.addSubtask, // Expects [parentId, {title}]
    'updateStatus': core.updateStatus, // Expects [id, newStatus]
    'updateTask': core.updateTask, // Expects [id, {title?, description?, priority?}]
    'removeTask': core.removeTask, // Expects [id]
    'generateTaskFiles': core.generateTaskFiles,
    'parsePrd': core.parsePrd, // Expects [filePath]
    'expandTask': core.expandTask, // Expects [taskId]
    'reviseTasks': core.reviseTasks // Expects [{from, prompt}]
};

// Create readline interface for stdin/stdout
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false // Treat as a pipe
});

// Log server start
console.error('Gemini Task Manager MCP Server listening on stdin/stdout...');

rl.on('line', async (line) => {
    console.error(`MCP Server Received: ${line}`); // Log raw input for debugging
    let request;
    try {
        request = JSON.parse(line);
    } catch (e) {
        sendError(null, -32700, 'Parse error', e.message);
        return;
    }

    // Basic JSON-RPC validation
    if (!request.method || !request.id) {
        sendError(request.id || null, -32600, 'Invalid Request', 'Missing method or id');
        return;
    }

    const method = methodMap[request.method];
    if (!method) {
        sendError(request.id, -32601, 'Method not found', `Method ${request.method} is not supported.`);
        return;
    }

    const params = request.params || [];

    try {
        // Core functions might log directly, which isn't ideal for MCP.
        // Ideally, core functions should return data to be formatted here.
        // For now, we'll call them and return a generic success or specific data if possible.

        // Special handling for async methods like parsePrd
        let result;
        if (method.constructor.name === 'AsyncFunction') {
            result = await method(...params);
        } else {
            result = method(...params);
        }

        // Determine response based on method
        // (This is basic; ideally, core functions return structured data)
        let responsePayload = { success: true }; 
        if (request.method === 'listTasks' || request.method === 'getNextTask') {
            // TODO: Capture stdout from core functions or modify them to return data
            // For now, just acknowledge the call was made.
            console.error('Warning: listTasks/getNextTask output is currently on console, not structured in MCP response.');
            responsePayload = { message: 'Command executed. Check server logs for output.' };
        } else if (result !== undefined) {
            responsePayload = result; // If the function returned something useful
        }
        
        sendResponse(request.id, responsePayload);

    } catch (error) {
        console.error(`Error executing method ${request.method}:`, error); // Log error server-side
        sendError(request.id, -32603, 'Internal error', error.message);
    }
});

function sendResponse(id, result) {
    const response = JSON.stringify({ jsonrpc: '2.0', id: id, result: result });
    console.log(response); // Send response via stdout
    console.error(`MCP Server Sent: ${response}`); // Log for debugging
}

function sendError(id, code, message, data) {
    const response = JSON.stringify({
        jsonrpc: '2.0',
        id: id,
        error: {
            code: code,
            message: message,
            data: data
        }
    });
    console.log(response);
    console.error(`MCP Server Sent Error: ${response}`); // Log for debugging
}

// Handle potential close/error events on the stream
rl.on('close', () => {
    console.error('MCP Server input stream closed.');
});

process.stdin.on('error', (err) => {
    console.error('MCP Server stdin error:', err);
});
