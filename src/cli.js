/**
 * Agentic Control Framework (ACF) - CLI Module
 *
 * @author Abhilash Chadhar (FutureAtoms)
 * @description CLI command definitions and argument parsing for ACF
 * @version 0.1.1
 */

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
  .option('-p, --priority <priority>', 'Priority (1-1000 numeric, or low/medium/high/critical)', 'medium')
  .option('--depends-on <ids>', 'Comma-separated list of task IDs this task depends on')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths')
  .option('--tests <tests>', 'Comma-separated list of tests to verify completion')
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

            // Populate table with simple numeric priority display
            tasksToDisplay.forEach(task => {
              const subtaskSummary = task.subtasks && task.subtasks.length > 0
                ? `${task.subtasks.filter(s => s.status === 'done').length}/${task.subtasks.length} done`
                : 'None';

              table.push([
                task.id,
                task.title,
                getStatusColor(task.status),
                task.priority, // Show just the numeric priority value
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

// add-subtask command
program
  .command('add-subtask <parent-id>')
  .description('Add a subtask to a parent task')
  .requiredOption('-t, --title <title>', 'Title of the subtask')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths')
  .option('--tests <tests>', 'Comma-separated list of tests to verify completion')
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
  .description('Update the status of a task or subtask (e.g., todo, inprogress, testing, done, blocked, error)')
  .option('-m, --message <message>', 'Add a message to the activity log')
  .option('--related-files <paths>', 'Comma-separated list of relevant file paths (required for "done" status)')
  .option('--skip-validation', 'Skip validation of related files for "done" status (use with caution)')
  .action((id, newStatus, options) => {
    try {
        const validStatuses = ['todo', 'inprogress', 'testing', 'done', 'blocked', 'error'];
        if (!validStatuses.includes(newStatus.toLowerCase())) {
          logger.warn(`"${newStatus}" is not a standard status. Allowed: ${validStatuses.join(', ')}`);
        }
        
        // For "done" status, ensure related files are specified or handle with the task update
        if (newStatus.toLowerCase() === 'done' && options.relatedFiles) {
          // First update the related files
          const updateResult = core.updateTask(process.cwd(), id, { relatedFiles: options.relatedFiles });
          if (!updateResult.success) {
            logger.error(`Error updating related files: ${updateResult.message}`);
            process.exitCode = 1;
            return;
          }
        }
        
        const result = core.updateStatus(
          process.cwd(), 
          id, 
          newStatus.toLowerCase(), 
          options.message, 
          { skipValidation: options.skipValidation }
        );
        
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
  .description('Update the details of a task')
  .option('-t, --title <title>', 'New title for the task')
  .option('-d, --description <description>', 'New description for the task')
  .option('-p, --priority <priority>', 'New priority (1-1000 numeric, or low/medium/high/critical)')
  .option('--depends-on <ids>', 'New comma-separated list of task IDs this task depends on')
  .option('--related-files <paths>', 'New comma-separated list of relevant file paths')
  .option('--tests <tests>', 'Comma-separated list of tests to verify completion')
  .option('-m, --message <message>', 'Add a message to the activity log')
  .action((id, options) => {
    try {
        // Build update options object from command-line arguments
        const updateOptions = {};
        if (options.title) updateOptions.title = options.title;
        if (options.description) updateOptions.description = options.description;
        if (options.priority) updateOptions.priority = options.priority;
        if (options.dependsOn) updateOptions.dependsOn = options.dependsOn.split(',').map(id => id.trim());
        if (options.relatedFiles) updateOptions.relatedFiles = options.relatedFiles.split(',').map(path => path.trim());
        if (options.tests) updateOptions.tests = options.tests.split(',').map(test => test.trim());
        if (options.message) updateOptions.message = options.message;
        
        // Check if any options are provided
        if (Object.keys(updateOptions).length === 0) {
            logger.error("No update options provided. Use -t, -d, -p, --depends-on, --related-files, --tests, or -m to specify changes.");
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
                
                // Show tests if available
                if (context.tests && context.tests.length > 0) {
                    logger.output(`\nTests:`);
                    context.tests.forEach(test => {
                        logger.output(`- ${test}`);
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

// New command for updating subtasks
program
    .command('update-subtask <id>')
    .description('Update the details of a subtask (e.g., title).')
    .option('-t, --title <title>', 'New title for the subtask.')
    // Add other options here if more subtask fields become updatable
    .action((id, options) => {
        if (!id.includes('.')) {
            console.error(chalk.red('Error: Invalid subtask ID. Subtask IDs must be in the format "parentID.subtaskID" (e.g., "1.1").'));
            return;
        }
        try {
            const result = core.updateSubtask(process.cwd(), id, options);
            console.log(chalk.green(result.message));
        } catch (error) {
            console.error(chalk.red(`Error: ${error.message}`));
        }
    });

// Priority manipulation commands
program
  .command('bump <id>')
  .description('Increase task priority by a specified amount')
  .option('-a, --amount <amount>', 'Amount to increase priority by', '50')
  .action((id, options) => {
    try {
      const amount = parseInt(options.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        logger.error('Amount must be a positive number');
        process.exitCode = 1;
        return;
      }

      // Get current task to calculate new priority
      const tasksData = core.readTasks(process.cwd());
      const task = tasksData.tasks.find(t => t.id === parseInt(id));
      if (!task) {
        logger.error(`Task with ID ${id} not found`);
        process.exitCode = 1;
        return;
      }

      const newPriority = Math.min(1000, task.priority + amount);
      const result = core.updateTask(process.cwd(), id, { priority: newPriority });

      if (result.success) {
        logger.output(`Task ${id} priority bumped from ${task.priority} to ${newPriority}`);
      } else {
        logger.error(`Error bumping priority: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error bumping priority: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('defer <id>')
  .description('Decrease task priority by a specified amount')
  .option('-a, --amount <amount>', 'Amount to decrease priority by', '50')
  .action((id, options) => {
    try {
      const amount = parseInt(options.amount, 10);
      if (isNaN(amount) || amount <= 0) {
        logger.error('Amount must be a positive number');
        process.exitCode = 1;
        return;
      }

      // Get current task to calculate new priority
      const tasksData = core.readTasks(process.cwd());
      const task = tasksData.tasks.find(t => t.id === parseInt(id));
      if (!task) {
        logger.error(`Task with ID ${id} not found`);
        process.exitCode = 1;
        return;
      }

      const newPriority = Math.max(1, task.priority - amount);
      const result = core.updateTask(process.cwd(), id, { priority: newPriority });

      if (result.success) {
        logger.output(`Task ${id} priority deferred from ${task.priority} to ${newPriority}`);
      } else {
        logger.error(`Error deferring priority: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error deferring priority: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('prioritize <id>')
  .description('Set task to high priority (800-900 range)')
  .option('-p, --priority <priority>', 'Specific priority value (800-900)', '850')
  .action((id, options) => {
    try {
      let priority = parseInt(options.priority, 10);
      if (isNaN(priority)) {
        priority = 850; // Default high priority
      }

      // Clamp to high priority range
      priority = Math.max(800, Math.min(900, priority));

      const result = core.updateTask(process.cwd(), id, { priority });

      if (result.success) {
        logger.output(`Task ${id} prioritized to ${priority}`);
      } else {
        logger.error(`Error prioritizing task: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error prioritizing task: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('deprioritize <id>')
  .description('Set task to low priority (100-400 range)')
  .option('-p, --priority <priority>', 'Specific priority value (100-400)', '300')
  .action((id, options) => {
    try {
      let priority = parseInt(options.priority, 10);
      if (isNaN(priority)) {
        priority = 300; // Default low priority
      }

      // Clamp to low priority range
      priority = Math.max(100, Math.min(400, priority));

      const result = core.updateTask(process.cwd(), id, { priority });

      if (result.success) {
        logger.output(`Task ${id} deprioritized to ${priority}`);
      } else {
        logger.error(`Error deprioritizing task: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error deprioritizing task: ${error.message}`);
      process.exitCode = 1;
    }
  });

// Priority management commands
program
  .command('recalculate-priorities')
  .description('Recalculate all task priorities using advanced algorithms')
  .option('--dependency-boosts', 'Apply dependency-based priority boosts', true)
  .option('--time-decay', 'Apply time-based priority decay', false)
  .option('--effort-weighting', 'Apply effort-weighted priority scoring', false)
  .option('--optimize-distribution', 'Optimize priority distribution', true)
  .action((options) => {
    try {
      const result = core.recalculatePriorities(process.cwd(), {
        applyDependencyBoosts: options.dependencyBoosts,
        applyTimeDecay: options.timeDecay,
        applyEffortWeighting: options.effortWeighting,
        optimizeDistribution: options.optimizeDistribution
      });

      if (result.success) {
        logger.output(result.message);
        if (result.adjustments && result.adjustments.length > 0) {
          logger.output('\nAdjustments made:');
          result.adjustments.forEach(adj => {
            logger.output(`  Task ${adj.taskId}: ${adj.oldPriority} → ${adj.newPriority} (${adj.type})`);
          });
        }
      } else {
        logger.error(`Error recalculating priorities: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error recalculating priorities: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('priority-stats')
  .description('Show priority statistics for all tasks')
  .action(() => {
    try {
      const result = core.getPriorityStatistics(process.cwd());

      if (result.success) {
        const stats = result.statistics;
        logger.output('\n📊 Priority Statistics:');
        logger.output(`Total tasks: ${stats.count}`);
        logger.output(`Priority range: ${stats.min} - ${stats.max}`);
        logger.output(`Average priority: ${stats.average}`);
        logger.output(`Utilization: ${(stats.utilizationRatio * 100).toFixed(1)}%`);
        logger.output('\nDistribution:');
        logger.output(`  🔥 Critical (800+): ${stats.distribution.critical}`);
        logger.output(`  🔴 High (600-799): ${stats.distribution.high}`);
        logger.output(`  🟡 Medium (400-599): ${stats.distribution.medium}`);
        logger.output(`  🟢 Low (<400): ${stats.distribution.low}`);
      } else {
        logger.error(`Error getting priority statistics: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error getting priority statistics: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('dependency-analysis')
  .description('Show dependency analysis and critical path information')
  .action(() => {
    try {
      const result = core.getDependencyAnalysis(process.cwd());

      if (result.success) {
        const analysis = result.analysis;
        logger.output('\n🔗 Dependency Analysis:');
        logger.output(`Total tasks: ${analysis.totalTasks}`);
        logger.output(`Tasks with dependencies: ${analysis.tasksWithDependencies}`);
        logger.output(`Root tasks (no dependencies): ${analysis.rootTasks}`);
        logger.output(`Leaf tasks (no dependents): ${analysis.leafTasks}`);
        logger.output(`Critical paths: ${analysis.criticalPaths}`);
        logger.output(`Longest dependency chain: ${analysis.longestPath} tasks`);

        if (analysis.blockingTasks.length > 0) {
          logger.output('\n🚧 Blocking Tasks:');
          analysis.blockingTasks.forEach(task => {
            logger.output(`  Task ${task.taskId}: "${task.title}" (blocking ${task.blockedCount} tasks)`);
          });
        }

        if (analysis.circularDependencies.length > 0) {
          logger.output('\n⚠️  Circular Dependencies Detected:');
          analysis.circularDependencies.forEach((cycle, index) => {
            logger.output(`  Cycle ${index + 1}: ${cycle.join(' → ')}`);
          });
        } else {
          logger.output('\n✅ No circular dependencies detected');
        }
      } else {
        logger.error(`Error getting dependency analysis: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error getting dependency analysis: ${error.message}`);
      process.exitCode = 1;
    }
  });

// Advanced priority algorithm configuration commands
program
  .command('configure-time-decay')
  .description('Configure time-based priority decay settings')
  .option('--enable', 'Enable time decay')
  .option('--disable', 'Disable time decay')
  .option('--model <model>', 'Decay model (linear, exponential, logarithmic, sigmoid, adaptive)')
  .option('--rate <rate>', 'Decay rate (0.001-0.2)', parseFloat)
  .option('--threshold <days>', 'Days before decay starts', parseInt)
  .option('--max-boost <boost>', 'Maximum aging boost for critical tasks', parseInt)
  .option('--priority-weight', 'Enable priority-weighted decay rates')
  .option('--no-priority-weight', 'Disable priority-weighted decay rates')
  .action((options) => {
    try {
      const result = core.configureTimeDecay(process.cwd(), {
        enabled: options.enable ? true : options.disable ? false : undefined,
        model: options.model,
        rate: options.rate,
        threshold: options.threshold,
        maxBoost: options.maxBoost,
        priorityWeight: options.priorityWeight !== undefined ? options.priorityWeight : undefined
      });

      if (result.success) {
        logger.output('✅ Time decay configuration updated');
        logger.output(`Current settings: ${JSON.stringify(result.config, null, 2)}`);
      } else {
        logger.error(`Error configuring time decay: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error configuring time decay: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('configure-effort-weighting')
  .description('Configure effort-weighted priority scoring settings')
  .option('--enable', 'Enable effort weighting')
  .option('--disable', 'Disable effort weighting')
  .option('--score-weight <weight>', 'Weight of effort score in priority calculation (0-1)', parseFloat)
  .option('--complexity-weight <weight>', 'Weight of complexity in effort calculation (0-1)', parseFloat)
  .option('--impact-weight <weight>', 'Weight of impact in effort calculation (0-1)', parseFloat)
  .option('--urgency-weight <weight>', 'Weight of urgency in effort calculation (0-1)', parseFloat)
  .option('--decay-rate <rate>', 'Effort score decay rate over time (0-0.1)', parseFloat)
  .option('--boost-threshold <threshold>', 'Effort score threshold for priority boost (0-1)', parseFloat)
  .action((options) => {
    try {
      const result = core.configureEffortWeighting(process.cwd(), {
        enabled: options.enable ? true : options.disable ? false : undefined,
        scoreWeight: options.scoreWeight,
        complexityWeight: options.complexityWeight,
        impactWeight: options.impactWeight,
        urgencyWeight: options.urgencyWeight,
        decayRate: options.decayRate,
        boostThreshold: options.boostThreshold
      });

      if (result.success) {
        logger.output('✅ Effort weighting configuration updated');
        logger.output(`Current settings: ${JSON.stringify(result.config, null, 2)}`);
      } else {
        logger.error(`Error configuring effort weighting: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error configuring effort weighting: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('show-algorithm-config')
  .description('Show current advanced priority algorithm configuration')
  .action(() => {
    try {
      const result = core.getAdvancedAlgorithmConfig(process.cwd());

      if (result.success) {
        logger.output('\n🎯 Advanced Priority Algorithm Configuration:');
        logger.output('=' .repeat(50));

        logger.output('\n⏰ Time Decay Settings:');
        const timeDecay = result.config.timeDecay;
        logger.output(`  Enabled: ${timeDecay.enabled ? '✅' : '❌'}`);
        logger.output(`  Model: ${timeDecay.model}`);
        logger.output(`  Rate: ${timeDecay.rate}`);
        logger.output(`  Threshold: ${timeDecay.threshold} days`);
        logger.output(`  Max Boost: ${timeDecay.maxBoost} points`);
        logger.output(`  Priority Weight: ${timeDecay.priorityWeight ? '✅' : '❌'}`);

        logger.output('\n🎯 Effort Weighting Settings:');
        const effort = result.config.effortWeighting;
        logger.output(`  Enabled: ${effort.enabled ? '✅' : '❌'}`);
        logger.output(`  Score Weight: ${effort.scoreWeight}`);
        logger.output(`  Complexity Weight: ${effort.complexityWeight}`);
        logger.output(`  Impact Weight: ${effort.impactWeight}`);
        logger.output(`  Urgency Weight: ${effort.urgencyWeight}`);
        logger.output(`  Decay Rate: ${effort.decayRate}`);
        logger.output(`  Boost Threshold: ${effort.boostThreshold}`);

        logger.output('\n📚 Available Decay Models:');
        result.config.availableModels.forEach(model => {
          logger.output(`  • ${model.name}: ${model.description}`);
          logger.output(`    Use case: ${model.useCase}`);
        });
      } else {
        logger.error(`Error getting algorithm configuration: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error getting algorithm configuration: ${error.message}`);
      process.exitCode = 1;
    }
  });

// File watcher management commands
program
  .command('start-file-watcher')
  .description('Start automatic file synchronization watcher')
  .option('--debounce-delay <ms>', 'Debounce delay in milliseconds', parseInt, 500)
  .option('--max-queue-size <size>', 'Maximum change queue size', parseInt, 10)
  .option('--enable-task-files', 'Enable individual task file generation')
  .option('--disable-task-files', 'Disable individual task file generation')
  .option('--enable-table-sync', 'Enable task table synchronization')
  .option('--disable-table-sync', 'Disable task table synchronization')
  .option('--enable-priority-recalc', 'Enable automatic priority recalculation')
  .option('--disable-priority-recalc', 'Disable automatic priority recalculation')
  .action((options) => {
    try {
      const watcherOptions = {
        debounceDelay: options.debounceDelay,
        maxQueueSize: options.maxQueueSize,
        enableTaskFiles: options.enableTaskFiles ? true : options.disableTaskFiles ? false : undefined,
        enableTableSync: options.enableTableSync ? true : options.disableTableSync ? false : undefined,
        enablePriorityRecalc: options.enablePriorityRecalc ? true : options.disablePriorityRecalc ? false : undefined
      };

      const result = core.initializeFileWatcher(process.cwd(), watcherOptions);

      if (result.success) {
        logger.output('✅ File watcher started successfully');
        logger.output(`Status: ${result.isActive ? 'Active' : 'Inactive'}`);
        logger.output(`Configuration: ${JSON.stringify(result.config, null, 2)}`);
      } else {
        logger.error(`Error starting file watcher: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error starting file watcher: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('stop-file-watcher')
  .description('Stop automatic file synchronization watcher')
  .action(() => {
    try {
      const result = core.stopFileWatcher(process.cwd());

      if (result.success) {
        logger.output('✅ File watcher stopped successfully');
      } else {
        logger.error(`Error stopping file watcher: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error stopping file watcher: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('file-watcher-status')
  .description('Show file watcher status and statistics')
  .action(() => {
    try {
      const result = core.getFileWatcherStatus(process.cwd());

      if (result.success) {
        if (result.stats.message) {
          logger.output(`📊 File Watcher Status: ${result.stats.message}`);
        } else {
          logger.output('\n📊 File Watcher Status:');
          logger.output('=' .repeat(30));
          logger.output(`Active: ${result.stats.isWatching ? '✅' : '❌'}`);
          logger.output(`Processing: ${result.stats.isProcessing ? '🔄' : '⏸️'}`);
          logger.output(`Queue Size: ${result.stats.queueSize}`);
          logger.output(`Changes Detected: ${result.stats.changesDetected}`);
          logger.output(`Changes Processed: ${result.stats.changesProcessed}`);
          logger.output(`Errors: ${result.stats.errors}`);
          logger.output(`Average Processing Time: ${Math.round(result.stats.averageProcessingTime)}ms`);

          if (result.stats.lastProcessed) {
            const lastProcessed = new Date(result.stats.lastProcessed);
            logger.output(`Last Processed: ${lastProcessed.toLocaleString()}`);
          }
        }
      } else {
        logger.error(`Error getting file watcher status: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error getting file watcher status: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('force-sync')
  .description('Force synchronization of all task files')
  .action(async () => {
    try {
      const result = await core.forceSyncTaskFiles(process.cwd());

      if (result.success) {
        logger.output('✅ Task files synchronized successfully');
      } else {
        logger.error(`Error synchronizing task files: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error synchronizing task files: ${error.message}`);
      process.exitCode = 1;
    }
  });

// Priority templates commands
program
  .command('list-templates')
  .description('List all available priority templates')
  .action(() => {
    try {
      const result = core.getPriorityTemplates(process.cwd());

      if (result.success) {
        logger.output('\n📋 Available Priority Templates:');
        logger.output('=' .repeat(40));

        Object.entries(result.templates).forEach(([key, template]) => {
          logger.output(`\n🏷️  ${template.name} (${key})`);
          logger.output(`   Base Priority: ${template.basePriority}`);
          logger.output(`   Description: ${template.description}`);

          if (template.custom) {
            logger.output('   Type: Custom Template');
          }

          logger.output('   Modifiers:');
          Object.entries(template.modifiers).forEach(([modifier, value]) => {
            const sign = value >= 0 ? '+' : '';
            logger.output(`     • ${modifier}: ${sign}${value}`);
          });
        });
      } else {
        logger.error(`Error getting priority templates: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error getting priority templates: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('suggest-template <title> [description]')
  .description('Suggest priority template for a task')
  .action((title, description = '') => {
    try {
      const result = core.suggestPriorityTemplate(process.cwd(), title, description);

      if (result.success) {
        if (result.suggestions.length === 0) {
          logger.output('No template suggestions found for this task.');
        } else {
          logger.output('\n🎯 Template Suggestions:');
          logger.output('=' .repeat(30));

          result.suggestions.forEach((suggestion, index) => {
            logger.output(`\n${index + 1}. ${suggestion.name} (${suggestion.template})`);
            logger.output(`   Score: ${suggestion.score}`);
            logger.output(`   Base Priority: ${suggestion.basePriority}`);
            logger.output(`   Matched Keywords: ${suggestion.matchedKeywords.join(', ')}`);
          });

          if (result.bestMatch) {
            logger.output(`\n✨ Best Match: ${result.bestMatch.name}`);
          }
        }
      } else {
        logger.error(`Error suggesting template: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error suggesting template: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('calculate-priority <template> <title> [description]')
  .description('Calculate priority using a template')
  .option('--tags <tags>', 'Comma-separated tags', (value) => value.split(','))
  .action((template, title, description = '', options) => {
    try {
      const tags = options.tags || [];
      const result = core.calculatePriorityFromTemplate(process.cwd(), template, title, description, tags);

      if (result.success) {
        logger.output('\n🧮 Priority Calculation:');
        logger.output('=' .repeat(25));
        logger.output(`Template: ${result.template}`);
        logger.output(`Base Priority: ${result.basePriority}`);
        logger.output(`Final Priority: ${result.priority}`);

        if (result.appliedModifiers.length > 0) {
          logger.output('\nApplied Modifiers:');
          result.appliedModifiers.forEach(modifier => {
            const sign = modifier.value >= 0 ? '+' : '';
            logger.output(`  • ${modifier.name}: ${sign}${modifier.value} (${modifier.reason})`);
          });
        } else {
          logger.output('\nNo modifiers applied');
        }
      } else {
        logger.error(`Error calculating priority: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error calculating priority: ${error.message}`);
      process.exitCode = 1;
    }
  });

program
  .command('add-with-template <template> <title> [description]')
  .description('Add a new task using a priority template')
  .option('--tags <tags>', 'Comma-separated tags', (value) => value.split(','))
  .option('--depends-on <taskIds>', 'Comma-separated list of task IDs this task depends on', (value) => value.split(',').map(id => parseInt(id.trim())))
  .option('--related-files <files>', 'Comma-separated list of related files')
  .action((template, title, description = '', options) => {
    try {
      const tags = options.tags || [];
      const taskOptions = {
        dependsOn: options.dependsOn || [],
        relatedFiles: options.relatedFiles ? options.relatedFiles.split(',') : []
      };

      const result = core.addTaskWithTemplate(process.cwd(), title, description, template, tags, taskOptions);

      if (result.success) {
        logger.output(`✅ Task created successfully with ID: ${result.taskId}`);
        logger.output(`Priority: ${result.priority} (calculated using ${template} template)`);

        if (result.priorityCalculation) {
          const calc = result.priorityCalculation;
          logger.output(`Base Priority: ${calc.basePriority}`);

          if (calc.appliedModifiers.length > 0) {
            logger.output('Applied Modifiers:');
            calc.appliedModifiers.forEach(modifier => {
              const sign = modifier.value >= 0 ? '+' : '';
              logger.output(`  • ${modifier.name}: ${sign}${modifier.value}`);
            });
          }
        }
      } else {
        logger.error(`Error creating task: ${result.message || 'Unknown error'}`);
        process.exitCode = 1;
      }
    } catch (error) {
      logger.error(`Error creating task: ${error.message}`);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);

// If no command is specified, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
