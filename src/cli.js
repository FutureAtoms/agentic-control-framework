const { Command } = require('commander');
const core = require('./core');
const program = new Command();

program
  .version('0.1.0')
  .description('Gemini Task Manager CLI');

// init command
program
  .command('init')
  .description('Initialize the task manager project (create tasks.json and .cursor rules folder)')
  .action(() => {
    core.initProject();
  });

// add command
program
  .command('add')
  .description('Add a new task')
  .requiredOption('-t, --title <title>', 'Title of the task')
  .option('-d, --description <description>', 'Description of the task')
  .option('-p, --priority <priority>', 'Priority (low, medium, high)', 'medium')
  .option('--depends-on <ids>', 'Comma-separated list of task IDs this task depends on')
  .action((options) => {
    core.addTask(options);
  });

// list command
program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter tasks by status (e.g., todo, inprogress, done)')
  .action((options) => {
    core.listTasks(options);
  });

// add-subtask command
program
  .command('add-subtask <parent-id>')
  .description('Add a subtask to a specific parent task')
  .requiredOption('-t, --title <title>', 'Title of the subtask')
  .action((parentId, options) => {
    core.addSubtask(parentId, options);
  });

// status command
program
  .command('status <id> <new-status>')
  .description('Update the status of a task or subtask (e.g., todo, inprogress, done, blocked)')
  .action((id, newStatus) => {
    // Basic validation for common statuses (can be expanded)
    const validStatuses = ['todo', 'inprogress', 'done', 'blocked'];
    if (!validStatuses.includes(newStatus.toLowerCase())) {
      console.warn(`Warning: "${newStatus}" is not a standard status. Allowed: ${validStatuses.join(', ')}`);
      // Proceed anyway, but warn the user
    }
    core.updateStatus(id, newStatus.toLowerCase()); // Store status consistently in lowercase
  });

// next command
program
  .command('next')
  .description('Show the next available task to work on based on dependencies and priority')
  .action(() => {
    core.getNextTask();
  });

// update command
program
  .command('update <id>')
  .description('Update details of a task or subtask')
  .option('-t, --title <title>', 'New title for the task/subtask')
  .option('-d, --description <description>', 'New description for the task (N/A for subtasks)')
  .option('-p, --priority <priority>', 'New priority for the task (low, medium, high) (N/A for subtasks)')
  .action((id, options) => {
      // Note: Current core.updateTask applies description/priority only to main tasks implicitly.
      // Subtasks currently only have title/status.
      // We might refine this later if subtasks need more fields.
      core.updateTask(id, options);
  });

// remove command
program
  .command('remove <id>')
  .alias('rm') // Add alias 'rm' for convenience
  .description('Remove a task or subtask by its ID')
  .action((id) => {
      // Optional: Add confirmation prompt here?
      core.removeTask(id);
  });

// generate command
program
  .command('generate')
  .description('Generate individual task files (e.g., task_001.md) in the tasks/ directory')
  .action(() => {
    core.generateTaskFiles();
  });

// parse-prd command
program
  .command('parse-prd <file-path>')
  .description('Parse a Product Requirements Document (PRD) using Gemini API to generate tasks')
  .action(async (filePath) => { // Make action async
    await core.parsePrd(filePath);
  });

// expand command
program
  .command('expand <task-id>')
  .description('Use Gemini API to break down a task into subtasks (overwrites existing subtasks)')
  .action(async (taskId) => {
    await core.expandTask(taskId);
  });

// revise command
program
  .command('revise')
  .description('Use Gemini API to revise future tasks based on a prompt/change')
  .requiredOption('--from <task-id>', 'The task ID from which revision should start')
  .requiredOption('-p, --prompt <prompt>', 'User prompt describing the change or new requirement')
  .action(async (options) => {
    await core.reviseTasks(options);
  });

// --- Placeholder for MCP server integration ---

// Always parse the arguments
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
