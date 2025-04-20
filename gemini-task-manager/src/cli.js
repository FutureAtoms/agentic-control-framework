const { Command } = require('commander');
const core = require('./core');
const program = new Command();
const readline = require('readline/promises'); // Import readline promises
const { stdin: input, stdout: output } = require('process'); // Import streams
const Table = require('cli-table3'); // Add cli-table3
const chalk = require('chalk'); // Add chalk

program
  .version('0.1.0')
  .description('Gemini Task Manager CLI');

// init command
program
  .command('init')
  .description('Initialize the task manager project')
  .option('--project-name <name>', 'Set the project name non-interactively')
  .option('--project-description <desc>', 'Set the project description non-interactively')
  .action(async (options) => {
    let projectName = options.projectName;
    let projectDescription = options.projectDescription;
    let interactive = false;

    if (!projectName || !projectDescription) {
        interactive = true;
        const rl = readline.createInterface({ input, output });
        try {
            console.log("Initializing Gemini Task Manager...");
            if (!projectName) {
                projectName = await rl.question('Enter Project Name: ');
            }
            if (!projectDescription) {
                projectDescription = await rl.question('Enter Project Goal/Description: ');
            }
        } catch (error) {
            console.error("Initialization failed during prompts:", error);
            if (rl) rl.close();
            process.exitCode = 1; 
            return;
        } finally {
            if (rl) rl.close();
        }
    } else {
        console.log("Initializing Gemini Task Manager non-interactively...");
    }

    try {
      // Call core.initProject and capture the result
      const result = core.initProject(process.cwd(), { projectName, projectDescription }); 
      if (result.success) {
          // Log the messages returned by core.initProject
          console.log(result.message); 
      } else {
          // Although core.initProject currently doesn't return failure, handle it just in case
          console.error(`Initialization failed: ${result.message || 'Unknown error from core.initProject'}`);
          process.exitCode = 1;
      }
    } catch (error) {
      console.error("Initialization failed:", error.message);
      process.exitCode = 1; // Set exit code on error
    }
  });

// add command
program
  .command('add')
  .description('Add a new task')
  .requiredOption('-t, --title <title>', 'Title of the task')
  .option('-d, --description <description>', 'Description of the task')
  .option('-p, --priority <priority>', 'Priority (low, medium, high)', 'medium')
  .option('--depends-on <ids>', 'Comma-separated list of task IDs this task depends on')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths')
  .action((options) => {
    try {
        const result = core.addTask(process.cwd(), options);
        if (result.success) {
            console.log(result.message);
        } else {
             // Log failure message if provided
            console.error(`Error adding task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Error adding task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// list command
program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter tasks by status (e.g., todo, inprogress, done)')
  .option('--json', 'Output the raw JSON task data')
  .action((options) => {
    try {
        const result = core.listTasks(process.cwd(), options);

        if (options.json) {
            // Output raw JSON if flag is set
            console.log(JSON.stringify(result, null, 2));
            return;
        }

        if (result && result.tasks) {
            const tasksToDisplay = result.tasks;

            if (tasksToDisplay.length === 0) {
              console.log(options.status ? `No tasks found with status: ${options.status}` : "No tasks found.");
              return;
            }
          
            // Define table structure
            const table = new Table({
              head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status'), chalk.cyan('Priority'), chalk.cyan('Depends On'), chalk.cyan('Subtasks')],
              colWidths: [5, 40, 12, 10, 12, 15], // Adjust widths as needed
              wordWrap: true
            });
          
            // Status coloring function
            const getStatusColor = (status) => {
                switch (status.toLowerCase()) {
                    case 'done': return chalk.green(status);
                    case 'inprogress': return chalk.yellow(status);
                    case 'blocked': return chalk.red(status);
                    case 'error': return chalk.bold.red(status);
                    case 'todo':
                    default: return chalk.gray(status);
                }
            };

            // Populate table
            tasksToDisplay.forEach(task => {
              const subtaskSummary = task.subtasks && task.subtasks.length > 0
                ? `${task.subtasks.filter(s => s.status === 'done').length}/${task.subtasks.length} done`
                : 'None';
                
              table.push([
                task.id,
                task.title,
                getStatusColor(task.status),
                task.priority,
                task.dependsOn.join(', ') || 'None',
                subtaskSummary
              ]);
            });
          
            console.log(table.toString());
          } else {
            console.log("Failed to retrieve tasks.");
          }
    } catch (error) {
        console.error(`Error listing tasks: ${error.message}`);
        process.exitCode = 1;
    }
  });

// add-subtask command
program
  .command('add-subtask <parent-id>')
  .description('Add a subtask to a specific parent task')
  .requiredOption('-t, --title <title>', 'Title of the subtask')
  .action((parentId, options) => {
    try {
        const result = core.addSubtask(process.cwd(), parentId, options);
        if (result.success) {
            console.log(result.message);
        } else {
            console.error(`Error adding subtask: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Error adding subtask: ${error.message}`);
        process.exitCode = 1;
    }
  });

// status command
program
  .command('status <id> <new-status>')
  .description('Update the status of a task or subtask (e.g., todo, inprogress, done, blocked, error)')
  .option('-m, --message <message>', 'Add a message to the activity log')
  .action((id, newStatus, options) => {
    try {
        const validStatuses = ['todo', 'inprogress', 'done', 'blocked', 'error'];
        if (!validStatuses.includes(newStatus.toLowerCase())) {
          console.warn(`Warning: "${newStatus}" is not a standard status. Allowed: ${validStatuses.join(', ')}`);
        }
        const result = core.updateStatus(process.cwd(), id, newStatus.toLowerCase(), options.message);
        if (result.success) {
            console.log(result.message);
        } else {
            console.error(`Error updating status: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Error updating status: ${error.message}`);
        process.exitCode = 1;
    }
  });

// next command
program
  .command('next')
  .description('Show the next actionable task based on status, dependencies, and priority')
  .action(() => {
    try {
        const result = core.getNextTask(process.cwd());
        if (result.success) {
            if (result.task) {
                // Print the task object as JSON, similar to previous behavior
                console.log(JSON.stringify(result.task, null, 2)); 
            } else {
                // Print the message explaining why no task was found
                console.log(result.message); 
            }
        } else {
            // Should not happen with current getNextTask logic, but handle just in case
            console.error(`Error getting next task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        console.error(`Error getting next task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// update command
program
  .command('update <id>')
  .description('Update details of a task or subtask')
  .option('-t, --title <title>', 'New title for the task/subtask')
  .option('-d, --description <description>', 'New description (main tasks only)')
  .option('-p, --priority <priority>', 'New priority (low, medium, high) (main tasks only)')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths (replaces existing, main tasks only)')
  .option('-m, --message <message>', 'Add a message to the activity log')
  .action((id, options) => {
      try {
        const result = core.updateTask(process.cwd(), id, options);
        if (result.success) {
            console.log(result.message);
        } else {
             console.error(`Error updating task: ${result.message || 'Unknown error'}`);
             process.exitCode = 1;
        }
      } catch(error) {
         console.error(`Error updating task: ${error.message}`);
         process.exitCode = 1;
      }
  });

// remove command
program
  .command('remove <id>')
  .alias('rm')
  .description('Remove a task or subtask by ID')
  .action((id) => {
     try {
        const result = core.removeTask(process.cwd(), id);
        if (result.success) {
            console.log(result.message);
        } else {
             console.error(`Error removing task: ${result.message || 'Unknown error'}`);
             process.exitCode = 1;
        }
     } catch (error) {
         console.error(`Error removing task: ${error.message}`);
         process.exitCode = 1;
     }
  });

// generate command
program
  .command('generate')
  .description('Generate individual Markdown task files in the tasks/ directory')
  .action(() => {
     try {
        const result = core.generateTaskFiles(process.cwd());
        if (result.success) {
            console.log(result.message);
        } else {
            console.error(`Error generating task files: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
     } catch (error) {
        console.error(`Error generating task files: ${error.message}`);
        process.exitCode = 1;
     }
  });

// get-context command
program
  .command('get-context <id>')
  .description('Get detailed context for a specific task or subtask as JSON')
  .action((id) => {
    try {
      const contextData = core.getContext(process.cwd(), id); 
      // Print the returned context object as JSON
      console.log(JSON.stringify(contextData, null, 2));
    } catch (error) {
      console.error(`Error getting context: ${error.message}`);
      process.exitCode = 1;
    }
  });

// parse-prd command
program
  .command('parse-prd <file-path>')
  .description('Parse a Product Requirements Document (PRD) using Gemini API to generate tasks')
  .action(async (filePath) => { // Make action async
    try {
      // Call the async core function
      const result = await core.parsePrd(process.cwd(), filePath);
      // Print the message from the result
      if (result.success) {
          console.log(result.message);
      } else {
           console.error(`Error parsing PRD: ${result.message || 'Unknown error'}`);
           process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Error parsing PRD: ${error.message}`);
      process.exitCode = 1;
    }
  });

// expand command
program
  .command('expand <task-id>')
  .description('Use Gemini API to break down a task into subtasks (overwrites existing)')
  .action(async (taskId) => { // Make action async
    try {
      // Call the async core function
      const result = await core.expandTask(process.cwd(), taskId);
      // Print the message from the result
      if (result.success) {
          console.log(result.message);
      } else {
          console.error(`Error expanding task: ${result.message || 'Unknown error'}`);
          process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Error expanding task: ${error.message}`);
      process.exitCode = 1;
    }
  });

// revise command
program
  .command('revise')
  .description('Use Gemini API to revise future tasks based on a prompt')
  .requiredOption('--from <task-id>', 'Task ID from which revision should start')
  .requiredOption('-p, --prompt <prompt>', 'User prompt describing the change')
  .action(async (options) => { // Make action async
    try {
       // Call the async core function with options object
       // FIXED: Pass fromTaskId correctly using the key expected by core.js
      const result = await core.reviseTasks(process.cwd(), { fromTaskId: options.from, prompt: options.prompt });
       // Print the message from the result
      if (result.success) {
          console.log(result.message);
      } else {
           console.error(`Error revising tasks: ${result.message || 'Unknown error'}`);
           process.exitCode = 1;
      }
    } catch (error) {
      console.error(`Error revising tasks: ${error.message}`);
      process.exitCode = 1;
    }
  });

// Catch-all for unknown commands
program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
