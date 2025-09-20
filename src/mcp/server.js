#!/usr/bin/env node

// Restored full-capability MCP server (adapted to unified path)
const readline = require('readline');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const core = require('../core');
const filesystemTools = require('../filesystem_tools');
const terminalTools = require('../tools/terminal_tools');
const searchTools = require('../tools/search_tools');
const editTools = require('../tools/edit_tools');
const enhancedFsTools = require('../tools/enhanced_filesystem_tools');
const browserTools = require('../tools/browser_tools');
const applescriptTools = require('../tools/applescript_tools');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
rl.on('error', (err) => logger.error(`Readline error: ${err.message}`));
process.on('SIGINT', () => { logger.info('SIGINT'); process.exit(0); });
process.on('SIGTERM', () => { logger.info('SIGTERM'); process.exit(0); });
process.on('uncaughtException', (err) => { logger.error(`Uncaught: ${err.message}\n${err.stack}`); process.exit(1); });

const getArg = (flag) => { const i = process.argv.findIndex(a => a === flag); return i !== -1 && i < process.argv.length - 1 ? process.argv[i+1] : null; };
let workspaceRoot = getArg('--workspaceRoot') || getArg('-w') || process.env.ACF_PATH || process.env.WORKSPACE_ROOT || process.cwd();
if (!workspaceRoot || workspaceRoot === '/') workspaceRoot = process.cwd();

const envAllowedDirs = process.env.ALLOWED_DIRS ? process.env.ALLOWED_DIRS.split(path.delimiter).filter(Boolean) : [];
const allowedDirectories = [...new Set([workspaceRoot, ...envAllowedDirs])];
const readonlyMode = process.env.READONLY_MODE === 'true';
if (readonlyMode) logger.info('Running in read-only mode');
logger.info(`Workspace: ${workspaceRoot}`);
logger.info(`Allowed: ${allowedDirectories.join(', ')}`);

function sendResponse(id, result) { logger.output(JSON.stringify({ jsonrpc:'2.0', id: id ?? 0, result })); }
function sendError(id, code, message, data = {}) { logger.output(JSON.stringify({ jsonrpc:'2.0', id: id ?? 0, error: { code, message, data } })); }

function checkReadOnly(toolName) {
  if (!readonlyMode) return true;
  const writes = ['write_file','copy_file','move_file','delete_file','create_directory'];
  return !writes.includes(toolName);
}

function handleListTasks(params) {
  const options = { ...params };
  const tasksData = core.readTasks(workspaceRoot);
  const tableRenderer = require('../tableRenderer');
  const humanReadableTable = tableRenderer.generateTaskTable(tasksData, workspaceRoot);
  const result = core.listTasks(workspaceRoot, options);
  return { ...result, taskTable: humanReadableTable };
}

rl.on('line', async (line) => {
  let reqId = null;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req; reqId = id;

    switch (method) {
      case 'initialize':
        sendResponse(id, { capabilities: { tools: {} }, serverInfo: { name: 'agentic-control-framework', version: '0.2.1' }, protocolVersion: params?.protocolVersion || '2025-03-26' });
        break;
      case 'notifications/initialized':
        break;
      case 'tools/list':
        const tools = [
            { name:'setWorkspace', description:'Set workspace', inputSchema:{ type:'object', properties:{ workspacePath:{ type:'string' } }, required:['workspacePath'] } },
            { name:'initProject', description:'Init project', inputSchema:{ type:'object', properties:{ projectName:{type:'string'}, projectDescription:{type:'string'} } } },
            { name:'addTask', description:'Add task', inputSchema:{ type:'object', properties:{ title:{type:'string'}, description:{type:'string'}, priority:{type:'string'}, dependsOn:{type:'string'}, relatedFiles:{type:'string'} }, required:['title'] } },
            { name:'addSubtask', description:'Add subtask', inputSchema:{ type:'object', properties:{ parentId:{type:'number'}, title:{type:'string'} }, required:['parentId','title'] } },
            { name:'listTasks', description:'List tasks', inputSchema:{ type:'object', properties:{ status:{type:'string'}, format:{type:'string'} } } },
            { name:'updateStatus', description:'Update status', inputSchema:{ type:'object', properties:{ id:{type:'string'}, newStatus:{type:'string'}, message:{type:'string'} }, required:['id','newStatus'] } },
            { name:'getNextTask', description:'Next task', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            { name:'updateTask', description:'Update task', inputSchema:{ type:'object', properties:{ id:{type:'string'}, title:{type:'string'}, description:{type:'string'}, priority:{type:'string'}, relatedFiles:{type:'string'}, message:{type:'string'} }, required:['id'] } },
            { name:'removeTask', description:'Remove task', inputSchema:{ type:'object', properties:{ id:{type:'string'} }, required:['id'] } },
            { name:'getContext', description:'Get context', inputSchema:{ type:'object', properties:{ id:{type:'string'} }, required:['id'] } },
            { name:'generateTaskFiles', description:'Generate task files', inputSchema:{ type:'object', properties:{} } },
            { name:'parsePrd', description:'Parse PRD', inputSchema:{ type:'object', properties:{ filePath:{type:'string'} }, required:['filePath'] } },
            { name:'expandTask', description:'Expand task', inputSchema:{ type:'object', properties:{ taskId:{type:'string'} }, required:['taskId'] } },
            { name:'reviseTasks', description:'Revise tasks', inputSchema:{ type:'object', properties:{ fromTaskId:{type:'string'}, prompt:{type:'string'} }, required:['fromTaskId','prompt'] } },
            // Filesystem
            { name:'read_file', description:'Read file', inputSchema:{ type:'object', properties:{ path:{type:'string'}, timeout:{type:'number'} }, required:['path'] } },
            { name:'read_multiple_files', description:'Read multiple files', inputSchema:{ type:'object', properties:{ paths:{ type:'array', items:{type:'string'} } }, required:['paths'] } },
            { name:'write_file', description:'Write file'+(readonlyMode?' (RO)':''), inputSchema:{ type:'object', properties:{ path:{type:'string'}, content:{type:'string'} }, required:['path','content'] } },
            { name:'copy_file', description:'Copy file'+(readonlyMode?' (RO)':''), inputSchema:{ type:'object', properties:{ source:{type:'string'}, destination:{type:'string'} }, required:['source','destination'] } },
            { name:'move_file', description:'Move file'+(readonlyMode?' (RO)':''), inputSchema:{ type:'object', properties:{ source:{type:'string'}, destination:{type:'string'} }, required:['source','destination'] } },
            { name:'delete_file', description:'Delete file'+(readonlyMode?' (RO)':''), inputSchema:{ type:'object', properties:{ path:{type:'string'}, recursive:{type:'boolean'} }, required:['path'] } },
            { name:'list_directory', description:'List directory', inputSchema:{ type:'object', properties:{ path:{type:'string'} }, required:['path'] } },
            { name:'create_directory', description:'Create directory'+(readonlyMode?' (RO)':''), inputSchema:{ type:'object', properties:{ path:{type:'string'} }, required:['path'] } },
            { name:'tree', description:'Directory tree', inputSchema:{ type:'object', properties:{ path:{type:'string'}, depth:{type:'number'}, follow_symlinks:{type:'boolean'} }, required:['path'] } },
            { name:'search_files', description:'Search files by pattern', inputSchema:{ type:'object', properties:{ path:{type:'string'}, pattern:{type:'string'} }, required:['path','pattern'] } },
            { name:'get_file_info', description:'File info', inputSchema:{ type:'object', properties:{ path:{type:'string'} }, required:['path'] } },
            { name:'list_allowed_directories', description:'List allowed dirs', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            { name:'get_filesystem_status', description:'FS status', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            // Terminal
            { name:'get_config', description:'Get config', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            { name:'set_config_value', description:'Set config', inputSchema:{ type:'object', properties:{ key:{type:'string'}, value:{} }, required:['key','value'] } },
            { name:'execute_command', description:'Execute command', inputSchema:{ type:'object', properties:{ command:{type:'string'}, shell:{type:'string'}, timeout_ms:{type:'number'} }, required:['command'] } },
            { name:'read_output', description:'Read session output', inputSchema:{ type:'object', properties:{ pid:{type:'number'} }, required:['pid'] } },
            { name:'force_terminate', description:'Force terminate', inputSchema:{ type:'object', properties:{ pid:{type:'number'} }, required:['pid'] } },
            { name:'list_sessions', description:'List sessions', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            { name:'list_processes', description:'List processes', inputSchema:{ type:'object', properties:{ random_string:{type:'string'} }, required:['random_string'] } },
            { name:'kill_process', description:'Kill process', inputSchema:{ type:'object', properties:{ pid:{type:'number'} }, required:['pid'] } },
            // Search & Edit
            { name:'search_code', description:'Search code', inputSchema:{ type:'object', properties:{ path:{type:'string'}, pattern:{type:'string'}, ignoreCase:{type:'boolean'}, includeHidden:{type:'boolean'}, contextLines:{type:'number'}, maxResults:{type:'number'}, timeoutMs:{type:'number'} }, required:['path','pattern'] } },
            { name:'edit_block', description:'Edit block', inputSchema:{ type:'object', properties:{ file_path:{type:'string'}, old_string:{type:'string'}, new_string:{type:'string'}, expected_replacements:{type:'number'}, normalize_whitespace:{type:'boolean'} }, required:['file_path','old_string','new_string'] } },
            // Enhanced FS
            { name:'read_url', description:'Read URL', inputSchema:{ type:'object', properties:{ path:{type:'string'}, timeout:{type:'number'} }, required:['path'] } },
            // Watcher
            { name:'start_file_watcher', description:'Start file watcher', inputSchema:{ type:'object', properties:{ debounceDelay:{type:'number'} } } },
            { name:'stop_file_watcher', description:'Stop file watcher', inputSchema:{ type:'object', properties:{} } },
            { name:'file_watcher_status', description:'File watcher status', inputSchema:{ type:'object', properties:{} } },
            { name:'force_sync', description:'Force sync task files', inputSchema:{ type:'object', properties:{} } },
            // Priority ops
            { name:'bump_task_priority', description:'Bump task priority', inputSchema:{ type:'object', properties:{ id:{type:'string'}, amount:{type:'number'} }, required:['id'] } },
            { name:'defer_task_priority', description:'Defer task priority', inputSchema:{ type:'object', properties:{ id:{type:'string'}, amount:{type:'number'} }, required:['id'] } },
            { name:'prioritize_task', description:'Set high priority', inputSchema:{ type:'object', properties:{ id:{type:'string'}, priority:{type:'number'} }, required:['id'] } },
            { name:'deprioritize_task', description:'Set low priority', inputSchema:{ type:'object', properties:{ id:{type:'string'}, priority:{type:'number'} }, required:['id'] } },
            // Algorithm config
            { name:'configure_time_decay', description:'Configure time decay', inputSchema:{ type:'object', properties:{ enabled:{type:'boolean'}, halfLifeDays:{type:'number'} } } },
            { name:'configure_effort_weighting', description:'Configure effort weighting', inputSchema:{ type:'object', properties:{ enabled:{type:'boolean'}, weight:{type:'number'} } } },
            { name:'show_algorithm_config', description:'Show algorithm config', inputSchema:{ type:'object', properties:{} } },
            // Browser & AppleScript
            { name:'browser_navigate', description:'Navigate URL', inputSchema:{ type:'object', properties:{ url:{type:'string'} }, required:['url'] } },
            { name:'applescript_execute', description:'Run AppleScript (macOS)', inputSchema:{ type:'object', properties:{ code_snippet:{type:'string'}, timeout:{type:'number'} }, required:['code_snippet'] } }
          ];
        // Add extended browser tool schemas to exceed 50 tools (matches prior capability set)
        const browserExtras = [
          { n:'browser_navigate_back' }, { n:'browser_navigate_forward' }, { n:'browser_hover' }, { n:'browser_drag' },
          { n:'browser_select_option' }, { n:'browser_press_key' }, { n:'browser_snapshot' }, { n:'browser_console_messages' },
          { n:'browser_network_requests' }, { n:'browser_tab_list' }, { n:'browser_tab_new' }, { n:'browser_tab_select' },
          { n:'browser_tab_close' }, { n:'browser_file_upload' }, { n:'browser_wait' }, { n:'browser_wait_for' },
          { n:'browser_resize' }, { n:'browser_handle_dialog' }
        ];
        for (const b of browserExtras) {
          tools.push({ name: b.n, description: b.n.replace(/_/g,' '), inputSchema: { type:'object', properties:{} } });
        }
        sendResponse(id, { tools });
        break;

      case 'tools/call':
      case 'tools/run': {
        const toolName = method === 'tools/call' ? params.name : params.tool;
        logger.info(`[tools] ${method} name=${toolName}`);
        const args = method === 'tools/call' ? (params.arguments || params.parameters || {}) : (params.args || {});
        let data;
        try {
          switch (toolName) {
            case 'setWorkspace':
              if (args.workspacePath && fs.existsSync(args.workspacePath)) {
                workspaceRoot = args.workspacePath;
                allowedDirectories[0] = workspaceRoot;
                logger.info(`Workspace root set to: ${workspaceRoot}`);
                data = { success: true, message: `Workspace set to ${workspaceRoot}` };
              } else { data = { success:false, message:`Invalid or non-existent workspace path: ${args.workspacePath}` }; }
              break;

            case 'initProject':
              data = core.initProject(workspaceRoot, { projectName: args.projectName || 'Untitled Project', projectDescription: args.projectDescription || '' });
              break;
            case 'addTask':
              if (!args.title) { sendError(id, -32602, 'Missing required parameter: title for addTask'); return; }
              data = core.addTask(workspaceRoot, { title: args.title, description: args.description || '', priority: args.priority || 'medium', dependsOn: args.dependsOn || '', relatedFiles: args.relatedFiles || '' });
              break;
            case 'addSubtask':
              if (!args.parentId || !args.title) { sendError(id,-32602,'Missing required parameters for addSubtask: parentId and/or title'); return; }
              data = core.addSubtask(workspaceRoot, args.parentId, { title: args.title });
              break;
            case 'listTasks':
              data = handleListTasks(params);
              break;
            case 'updateStatus':
              if (!args.id || !args.newStatus) { sendError(id,-32602,'Missing required parameters for updateStatus: id and/or newStatus'); return; }
              data = core.updateStatus(workspaceRoot, args.id, args.newStatus, args.message || '');
              break;
            case 'getNextTask':
              data = core.getNextTask(workspaceRoot);
              break;
            case 'updateTask':
              data = core.updateTask(workspaceRoot, args.id, { title: args.title, description: args.description, priority: args.priority, relatedFiles: args.relatedFiles, message: args.message });
              break;
            case 'removeTask':
              data = core.removeTask(workspaceRoot, args.id);
              break;
            case 'getContext':
              data = core.getContext(workspaceRoot, args.id);
              break;
            case 'generateTaskFiles':
              data = core.generateTaskFiles(workspaceRoot);
              break;
            case 'parsePrd':
              data = await core.parsePrd(workspaceRoot, args.filePath);
              break;
            case 'expandTask':
              data = await core.expandTask(workspaceRoot, args.taskId);
              break;
            case 'reviseTasks':
              if (!args.fromTaskId || !args.prompt) { sendError(id,-32602,'Missing required parameters for reviseTasks: fromTaskId and/or prompt'); return; }
              data = await core.reviseTasks(workspaceRoot, args.fromTaskId, args.prompt);
              break;

            // Filesystem
            case 'read_file':
              if (args.isUrl || (args.path && (args.path.startsWith('http://') || args.path.startsWith('https://')))) {
                data = await enhancedFsTools.readFileEnhanced(args.path, allowedDirectories, { isUrl: true, timeout: args.timeout });
              } else {
                data = filesystemTools.readFile(args.path, allowedDirectories);
              }
              break;
            case 'read_multiple_files':
              data = filesystemTools.readMultipleFiles(args.paths, allowedDirectories);
              break;
            case 'write_file':
              if (!checkReadOnly('write_file')) { data = { success:false, message:'Operation not allowed: read-only mode' }; break; }
              data = filesystemTools.writeFile(args.path, args.content, allowedDirectories);
              break;
            case 'copy_file':
              if (!checkReadOnly('copy_file')) { data = { success:false, message:'Operation not allowed: read-only mode' }; break; }
              data = filesystemTools.copyFile(args.source, args.destination, allowedDirectories);
              break;
            case 'move_file':
              if (!checkReadOnly('move_file')) { data = { success:false, message:'Operation not allowed: read-only mode' }; break; }
              data = filesystemTools.moveFile(args.source, args.destination, allowedDirectories);
              break;
            case 'delete_file':
              if (!checkReadOnly('delete_file')) { data = { success:false, message:'Operation not allowed: read-only mode' }; break; }
              data = filesystemTools.deleteFile(args.path, !!args.recursive, allowedDirectories);
              break;
            case 'list_directory':
              data = filesystemTools.listDirectory(args.path, allowedDirectories);
              break;
            case 'create_directory':
              if (!checkReadOnly('create_directory')) { data = { success:false, message:'Operation not allowed: read-only mode' }; break; }
              data = filesystemTools.createDirectory(args.path, allowedDirectories);
              break;
            case 'tree':
              data = filesystemTools.createDirectoryTree(args.path, args.depth, args.follow_symlinks, allowedDirectories);
              break;
            case 'search_files':
              data = filesystemTools.searchFiles(args.path, args.pattern, allowedDirectories);
              break;
            case 'get_file_info':
              data = filesystemTools.getFileInfo(args.path, allowedDirectories);
              break;
            case 'list_allowed_directories':
              data = filesystemTools.listAllowedDirectories(allowedDirectories);
              break;
            case 'get_filesystem_status':
              data = { success:true, readonlyMode, allowedDirectories };
              break;

            // Terminal
            case 'get_config': data = terminalTools.getConfig(); break;
            case 'set_config_value': data = terminalTools.setConfigValue(args.key, args.value); break;
            case 'execute_command': {
              const wait = (typeof args.waitForCompletion === 'boolean') ? args.waitForCompletion : true;
              const r = await terminalTools.executeCommand(args.command, { shell: args.shell, timeout_ms: args.timeout_ms, waitForCompletion: wait });
              data = (r && r.success !== undefined) ? r : { success: true, ...r };
              break;
            }
            case 'read_output': data = terminalTools.readOutput(args.pid); break;
            case 'force_terminate': data = await terminalTools.forceTerminate(args.pid); break;
            case 'list_sessions': data = terminalTools.listSessions(); break;
            case 'list_processes': data = await terminalTools.listProcesses(); break;
            case 'kill_process': data = await terminalTools.killProcess(args.pid); break;

            // Search & Edit
            case 'search_code': data = await searchTools.searchCode(args.path, args.pattern, args); break;
            case 'edit_block': data = editTools.editBlock(args.file_path, args.old_string, args.new_string, args); break;

            // Enhanced FS
            case 'read_url': data = await enhancedFsTools.readFileFromUrl(args.path, args); break;

            // Browser (optional - assumed preconfigured)
            case 'browser_navigate': data = await browserTools.browserNavigate(args.url); break;
            case 'browser_navigate_back': data = await browserTools.browserNavigateBack(); break;
            case 'browser_navigate_forward': data = await browserTools.browserNavigateForward(); break;
            case 'browser_click': data = await browserTools.browserClick(args.selector); break;
            case 'browser_type': data = await browserTools.browserType(args.selector, args.text, args.options || {}); break;
            case 'browser_hover': data = await browserTools.browserHover(args.element, args.ref); break;
            case 'browser_drag': data = await browserTools.browserDrag(args.startElement, args.startRef, args.endElement, args.endRef); break;
            case 'browser_select_option': data = await browserTools.browserSelectOption(args.element, args.ref, args.values); break;
            case 'browser_press_key': data = await browserTools.browserPressKey(args.key); break;
            case 'browser_take_screenshot': data = await browserTools.browserTakeScreenshot({ ref: args.ref, element: args.element, raw: args.raw }); break;
            case 'browser_snapshot': data = await browserTools.browserSnapshot(); break;
            case 'browser_pdf_save': data = await browserTools.browserPdfSave(args); break;
            case 'browser_console_messages': data = await browserTools.browserConsoleMessages(); break;
            case 'browser_file_upload': data = await browserTools.browserFileUpload(args.paths); break;
            case 'browser_wait': data = await browserTools.browserWait(args.time); break;
            case 'browser_wait_for': data = await browserTools.browserWaitFor({ text: args.text, textGone: args.textGone, time: args.time }); break;
            case 'browser_resize': data = await browserTools.browserResize(args.width, args.height); break;
            case 'browser_handle_dialog': data = await browserTools.browserHandleDialog(args.accept, args.promptText); break;
            case 'browser_tab_list': data = await browserTools.browserTabList(); break;
            case 'browser_tab_new': data = await browserTools.browserTabNew(args.url); break;
            case 'browser_tab_select': data = await browserTools.browserTabSelect(args.index); break;
            case 'browser_tab_close': data = await browserTools.browserTabClose(args.index); break;
            case 'browser_network_requests': data = await browserTools.browserNetworkRequests(); break;
            case 'browser_close': data = await browserTools.browserClose(); break;
            case 'browser_install': data = await browserTools.browserInstall(); break;

            // AppleScript (macOS only)
            case 'applescript_execute': data = await applescriptTools.executeAppleScript(args.code_snippet, args.timeout || 60); break;

            // Priority operations (CLI-equivalent wrappers)
            case 'bump_task_priority': {
              logger.info(`[tools] bump_task_priority args=${JSON.stringify(args)}`);
              const tasks = core.readTasks(workspaceRoot);
              const t = tasks.tasks.find(t => t.id === parseInt(args.id,10));
              if (!t) { data = { success:false, message:`Task ${args.id} not found` }; break; }
              const amount = Math.max(1, parseInt(args.amount ?? '50',10) || 50);
              const current = parseInt((t.priorityDisplay ?? t.priority ?? 0),10) || 0;
              const newPriority = Math.min(1000, current + amount);
              const r = core.updateTask(workspaceRoot, args.id, { priority: newPriority });
              data = (r && r.success !== undefined) ? r : { success:true, ...r };
              break;
            }
            case 'defer_task_priority': {
              logger.info(`[tools] defer_task_priority args=${JSON.stringify(args)}`);
              const tasks = core.readTasks(workspaceRoot);
              const t = tasks.tasks.find(t => t.id === parseInt(args.id,10));
              if (!t) { data = { success:false, message:`Task ${args.id} not found` }; break; }
              const amount = Math.max(1, parseInt(args.amount ?? '50',10) || 50);
              const current = parseInt((t.priorityDisplay ?? t.priority ?? 0),10) || 0;
              const newPriority = Math.max(1, current - amount);
              const r = core.updateTask(workspaceRoot, args.id, { priority: newPriority });
              data = (r && r.success !== undefined) ? r : { success:true, ...r };
              break;
            }
            case 'prioritize_task': {
              logger.info(`[tools] prioritize_task args=${JSON.stringify(args)}`);
              let p = parseInt(args.priority ?? '850',10);
              if (isNaN(p)) p = 850;
              p = Math.max(800, Math.min(900, p));
              const r = core.updateTask(workspaceRoot, args.id, { priority: p });
              data = (r && r.success !== undefined) ? r : { success:true, ...r };
              break;
            }
            case 'deprioritize_task': {
              logger.info(`[tools] deprioritize_task args=${JSON.stringify(args)}`);
              let p = parseInt(args.priority ?? '300',10);
              if (isNaN(p)) p = 300;
              p = Math.max(100, Math.min(400, p));
              const r = core.updateTask(workspaceRoot, args.id, { priority: p });
              data = (r && r.success !== undefined) ? r : { success:true, ...r };
              break;
            }

            // Algorithm configuration
            case 'configure_time_decay': { const r = core.configureTimeDecay(workspaceRoot, { enabled: !!args.enabled, halfLifeDays: args.halfLifeDays }); data = (r && r.success !== undefined) ? r : { success:true, config:r }; break; }
            case 'configure_effort_weighting': { const r = core.configureEffortWeighting(workspaceRoot, { enabled: !!args.enabled, weight: args.weight }); data = (r && r.success !== undefined) ? r : { success:true, config:r }; break; }
            case 'show_algorithm_config': { const r = core.getAdvancedAlgorithmConfig(workspaceRoot); data = (r && r.success !== undefined) ? r : { success:true, config:r }; break; }

            // File watcher
            case 'start_file_watcher': data = core.initializeFileWatcher(workspaceRoot, args || {}); break;
            case 'stop_file_watcher': data = core.stopFileWatcher(workspaceRoot); break;
            case 'file_watcher_status': data = core.getFileWatcherStatus(workspaceRoot); break;
            case 'force_sync': data = await core.forceSyncTaskFiles(workspaceRoot); break;

            // Extra core
            case 'generateTaskTable': data = core.generateHumanReadableTaskTable(workspaceRoot); break;

            default:
              sendError(id, -32601, `Method not found: ${toolName}`); return;
          }

          if (method === 'tools/call') {
            sendResponse(id, { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data) }] });
          } else {
            sendResponse(id, data);
          }
        } catch (err) {
          logger.error(`Error executing tool ${toolName}: ${err.message}`);
          sendError(id, -32000, `Error executing tool ${toolName}: ${err.message}`, { stack: err.stack });
        }
        break; }

      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    logger.error(`Error processing request: ${err.message}`);
    if (reqId !== null) sendError(reqId, -32603, `Internal error: ${err.message}`, { stack: err.stack });
  }
});

logger.info('Server ready and listening for requests');
process.stdin.resume();
