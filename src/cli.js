const { Command } = require('commander');
const core = require('./core');
const logger = require('./logger'); // Import our logger
const program = new Command();
const readline = require('readline/promises'); // Import readline promises
const { stdin: input, stdout: output } = require('process'); // Import streams
const Table = require('cli-table3'); // Add cli-table3
const chalk = require('chalk'); // Add chalk
const path = require('path');

program
  .version('0.1.0')
  .description('Agentic Control Framework CLI');

// init command
program
  .command('init')
  .description('Initialize the task manager project')
  .option('--project-name <n>', 'Set the project name non-interactively')
  .option('--project-description <desc>', 'Set the project description non-interactively')
  .action(async (options) => {
    let projectName = options.projectName;
    let projectDescription = options.projectDescription;
    let interactive = false;

    if (!projectName || !projectDescription) {
        interactive = true;
        const rl = readline.createInterface({ input, output });
        try {
            logger.info("Initializing Agentic Control Framework...");
            if (!projectName) {
                projectName = await rl.question('Enter Project Name: ');
            }
            if (!projectDescription) {
                projectDescription = await rl.question('Enter Project Goal/Description: ');
            }
        } catch (error) {
            logger.error(`Initialization failed during prompts: ${error}`);
            if (rl) rl.close();
            process.exitCode = 1; 
            return;
        } finally {
            if (rl) rl.close();
        }
    } else {
        logger.info("Initializing Agentic Control Framework non-interactively...");
    }

    try {
      // Call core.initProject and capture the result
      const result = core.initProject(process.cwd(), { projectName, projectDescription }); 
      if (result.success) {
          // Log the messages returned by core.initProject
          logger.output(result.message); 
      } else {
          // Although core.initProject currently doesn't return failure, handle it just in case
          logger.error(`Initialization failed: ${result.message || 'Unknown error from core.initProject'}`);
          process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Initialization failed: ${error.message}`);
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
            logger.output(result.message);
        } else {
             // Log failure message if provided
            logger.error(`Error adding task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error adding task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// list command
program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter tasks by status (e.g., todo, inprogress, done)')
  .option('--json', 'Output the raw JSON task data')
  .option('--table', 'Output tasks in a table format')
  .option('--human', 'Output tasks in a human-readable format with checkboxes')
  .action((options) => {
    try {
        // If human-readable format is requested, include that option
        if (options.human) {
            // Load the tableRenderer module
            const tableRenderer = require('./tableRenderer');
            const tasksData = core.readTasks(process.cwd());
            
            // Generate and output the human-readable table
            const humanReadableTable = tableRenderer.generateTaskTable(tasksData, process.cwd());
            logger.output(humanReadableTable);
            return;
        }
        
        const result = core.listTasks(process.cwd(), options);

        if (options.json) {
            // Output raw JSON if flag is set
            logger.output(result);
            return;
        }

        if (result && result.tasks) {
            const tasksToDisplay = result.tasks;

            if (tasksToDisplay.length === 0) {
              logger.output(options.status ? `No tasks found with status: ${options.status}` : "No tasks found.");
              return;
            }
          
            // Only display the table if specifically requested or no other display format is specified
            if (options.table || (!options.json && !options.human)) {
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
          
            logger.outputTable(table);
            }
          } else {
            logger.error("Failed to retrieve tasks.");
          }
    } catch (error) {
        logger.error(`Error listing tasks: ${error.message}`);
        process.exitCode = 1;
    }
  });

// generate-table command
program
  .command('generate-table')
  .description('Generate a human-readable task table with checkboxes')
  .action(() => {
    try {
      const tableRenderer = require('./tableRenderer');
      const result = core.listTasks(process.cwd(), { humanReadable: true });
      
      if (result && result.success) {
        const taskTablePath = path.resolve(process.cwd(), 'tasks-table.md');
        tableRenderer.writeTaskTable(core.readTasks(process.cwd()), process.cwd());
        logger.output(`Human-readable task table generated at: ${taskTablePath}`);
      } else {
        logger.error("Failed to generate task table.");
      }
    } catch (error) {
      logger.error(`Error generating task table: ${error.message}`);
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
            logger.output(result.message);
        } else {
            logger.error(`Error adding subtask: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error adding subtask: ${error.message}`);
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
          logger.warn(`"${newStatus}" is not a standard status. Allowed: ${validStatuses.join(', ')}`);
        }
        const result = core.updateStatus(process.cwd(), id, newStatus.toLowerCase(), options.message);
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error updating status: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error updating status: ${error.message}`);
        process.exitCode = 1;
    }
  });

// next command
program
  .command('next')
  .description('Get the next actionable task')
  .action(() => {
    try {
        const result = core.getNextTask(process.cwd());
        if (result.success) {
            if (result.task) {
                // Display the next task in a readable format
                const task = result.task;
                // Create a table for better formatting
                const table = new Table({
                  head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status'), chalk.cyan('Priority'), chalk.cyan('Description')],
                  colWidths: [5, 30, 12, 10, 50],
                  wordWrap: true
                });
                
                table.push([
                  task.id,
                  task.title,
                  task.status,
                  task.priority,
                  task.description || 'No description'
                ]);
                
                logger.output("Next actionable task:");
                logger.outputTable(table);
                
                if (task.subtasks && task.subtasks.length > 0) {
                  const subtasksTable = new Table({
                    head: [chalk.cyan('ID'), chalk.cyan('Subtask'), chalk.cyan('Status')],
                    colWidths: [10, 70, 12],
                    wordWrap: true
                  });
                  
                  task.subtasks.forEach(subtask => {
                    subtasksTable.push([
                      subtask.id,
                      subtask.title,
                      subtask.status
                    ]);
                  });
                  
                  logger.output("Subtasks:");
                  logger.outputTable(subtasksTable);
                }
            } else {
                logger.output("No actionable tasks found.");
            }
        } else {
            logger.error(`Error getting next task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error getting next task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// update command
program
  .command('update <id>')
  .description('Update task or subtask details')
  .option('-t, --title <title>', 'New title')
  .option('-d, --description <description>', 'New description')
  .option('-p, --priority <priority>', 'New priority (low, medium, high)')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths')
  .option('-m, --message <message>', 'Add a message to the activity log')
  .action((id, options) => {
    try {
        // Build update options object from command-line arguments
        const updateOptions = {};
        if (options.title) updateOptions.title = options.title;
        if (options.description) updateOptions.description = options.description;
        if (options.priority) updateOptions.priority = options.priority;
        if (options.relatedFiles) updateOptions.relatedFiles = options.relatedFiles;
        if (options.message) updateOptions.message = options.message;
        
        // Check if any options are provided
        if (Object.keys(updateOptions).length === 0) {
            logger.error("No update options provided. Use -t, -d, -p, --related-files, or -m to specify changes.");
            process.exitCode = 1;
            return;
        }
        
        const result = core.updateTask(process.cwd(), id, updateOptions);
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error updating task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error updating task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// remove command
program
  .command('remove <id>')
  .description('Remove a task or subtask')
  .action((id) => {
    try {
        const result = core.removeTask(process.cwd(), id);
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error removing task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error removing task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// context command
program
  .command('context <id>')
  .description('Get detailed context for a task or subtask')
  .action((id) => {
    try {
        const result = core.getContext(process.cwd(), id);
        if (result.success) {
            if (result.context) {
                // Format and display the context
                const context = result.context;
                logger.output(`Task Context for ${context.id}: ${context.title}`);
                logger.output(`Status: ${context.status}`);
                logger.output(`Priority: ${context.priority}`);
                if (context.description) logger.output(`Description: ${context.description}`);
                
                // Show related files if available
                if (context.relatedFiles && context.relatedFiles.length > 0) {
                    logger.output(`\nRelated Files:`);
                    context.relatedFiles.forEach(file => {
                        logger.output(`- ${file}`);
                    });
                }
                
                // Show dependencies
                if (context.dependsOn && context.dependsOn.length > 0) {
                    logger.output(`\nDepends On: ${context.dependsOn.join(', ')}`);
                }
                
                // Show subtasks
                if (context.subtasks && context.subtasks.length > 0) {
                    logger.output(`\nSubtasks:`);
                    context.subtasks.forEach(subtask => {
                        logger.output(`- ${subtask.id}: ${subtask.title} [${subtask.status}]`);
                    });
                }
                
                // Show activity log
                if (context.activityLog && context.activityLog.length > 0) {
                    logger.output(`\nActivity Log:`);
                    context.activityLog.forEach(entry => {
                        const date = new Date(entry.timestamp).toLocaleString();
                        logger.output(`[${date}] ${entry.type}: ${entry.message}`);
                    });
                }
            } else {
                logger.output("No context found for the specified task.");
            }
        } else {
            logger.error(`Error getting task context: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error getting task context: ${error.message}`);
        process.exitCode = 1;
    }
  });

// generate-files command
program
  .command('generate-files')
  .description('Generate individual Markdown files for each task in the tasks/ directory')
  .action(() => {
    try {
        const result = core.generateTaskFiles(process.cwd());
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error generating task files: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error generating task files: ${error.message}`);
        process.exitCode = 1;
    }
  });

// parse-prd command
program
  .command('parse-prd <file-path>')
  .description('Parse a PRD document using Gemini and generate tasks')
  .action(async (filePath) => {
    try {
        logger.info(`Parsing PRD file: ${filePath}`);
        const result = await core.parsePrd(process.cwd(), filePath);
        
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error parsing PRD: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error parsing PRD: ${error.message}`);
        process.exitCode = 1;
    }
  });

// expand-task command
program
  .command('expand-task <id>')
  .description('Use Gemini to break down a task into subtasks')
  .action(async (id) => {
    try {
        logger.info(`Expanding task with ID: ${id}`);
        const result = await core.expandTask(process.cwd(), id);
        
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error expanding task: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error expanding task: ${error.message}`);
        process.exitCode = 1;
    }
  });

// revise-tasks command
program
  .command('revise-tasks <from-task-id>')
  .requiredOption('-p, --prompt <prompt>', 'Prompt describing the changes')
  .description('Use Gemini to revise future tasks based on a prompt (starting from a specific task ID)')
  .action(async (fromTaskId, options) => {
    try {
        if (!options.prompt) {
            logger.error("A prompt is required. Use -p or --prompt to specify changes.");
            process.exitCode = 1;
            return;
        }
        
        logger.info(`Revising tasks starting from ID ${fromTaskId}`);
        const result = await core.reviseTasks(process.cwd(), fromTaskId, options.prompt);
        
        if (result.success) {
            logger.output(result.message);
        } else {
            logger.error(`Error revising tasks: ${result.message || 'Unknown error'}`);
            process.exitCode = 1;
        }
    } catch (error) {
        logger.error(`Error revising tasks: ${error.message}`);
        process.exitCode = 1;
    }
  });

program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
