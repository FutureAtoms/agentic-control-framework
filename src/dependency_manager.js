const logger = require('./logger');

/**
 * Advanced Dependency Management System
 * Provides sophisticated dependency-aware priority calculations including
 * cascade effects, blocking task detection, critical path analysis, and priority inheritance.
 */
class DependencyManager {
  constructor() {
    this.config = {
      // Priority inheritance settings
      inheritanceDecayFactor: 0.8,    // How much priority decays through dependency chain
      maxInheritanceDepth: 5,          // Maximum depth for priority inheritance
      minInheritedPriority: 50,        // Minimum priority that can be inherited
      
      // Critical path settings
      criticalPathBoost: 100,          // Priority boost for critical path tasks
      criticalPathThreshold: 0.8,      // Threshold for considering a path critical
      
      // Blocking detection settings
      blockingTaskBoost: 150,          // Priority boost for tasks blocking many others
      blockingThreshold: 3,            // Minimum blocked tasks to be considered blocking
      
      // Cascade settings
      cascadeEnabled: true,            // Enable priority cascade effects
      cascadeDecayRate: 0.7,          // How much priority decays in cascade
      maxCascadeDepth: 3               // Maximum cascade depth
    };
  }

  /**
   * Analyze and enhance task priorities based on dependency relationships
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of priority adjustments made
   */
  enhancePrioritiesWithDependencies(tasks) {
    const adjustments = [];
    
    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(tasks);
    
    // Step 1: Apply priority inheritance
    const inheritanceAdjustments = this.applyPriorityInheritance(tasks, dependencyGraph);
    adjustments.push(...inheritanceAdjustments);
    
    // Step 2: Detect and boost blocking tasks
    const blockingAdjustments = this.detectAndBoostBlockingTasks(tasks, dependencyGraph);
    adjustments.push(...blockingAdjustments);
    
    // Step 3: Analyze critical paths
    const criticalPathAdjustments = this.analyzeCriticalPaths(tasks, dependencyGraph);
    adjustments.push(...criticalPathAdjustments);
    
    // Step 4: Apply cascade effects
    if (this.config.cascadeEnabled) {
      const cascadeAdjustments = this.applyCascadeEffects(tasks, dependencyGraph);
      adjustments.push(...cascadeAdjustments);
    }
    
    return adjustments;
  }

  /**
   * Build a comprehensive dependency graph
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Dependency graph with forward and reverse mappings
   */
  buildDependencyGraph(tasks) {
    const graph = {
      forward: new Map(),  // task -> tasks that depend on it
      reverse: new Map(),  // task -> tasks it depends on
      taskMap: new Map()   // id -> task object
    };

    // Initialize maps
    tasks.forEach(task => {
      graph.forward.set(task.id, new Set());
      graph.reverse.set(task.id, new Set());
      graph.taskMap.set(task.id, task);
    });

    // Build relationships
    tasks.forEach(task => {
      if (task.dependsOn && Array.isArray(task.dependsOn)) {
        task.dependsOn.forEach(depId => {
          if (graph.forward.has(depId)) {
            graph.forward.get(depId).add(task.id);
            graph.reverse.get(task.id).add(depId);
          }
        });
      }
    });

    return graph;
  }

  /**
   * Apply priority inheritance through dependency chains
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of adjustments made
   */
  applyPriorityInheritance(tasks, dependencyGraph) {
    const adjustments = [];
    const visited = new Set();

    // Process tasks in topological order (dependencies first)
    const sortedTasks = this.topologicalSort(tasks, dependencyGraph);

    sortedTasks.forEach(task => {
      if (visited.has(task.id)) return;

      const inheritedPriority = this.calculateInheritedPriority(
        task, 
        dependencyGraph, 
        visited, 
        0
      );

      if (inheritedPriority > task.priority) {
        const oldPriority = task.priority;
        task.priority = Math.min(1000, inheritedPriority);
        
        adjustments.push({
          taskId: task.id,
          type: 'priority_inheritance',
          oldPriority,
          newPriority: task.priority,
          reason: `Priority inherited from dependent tasks (${oldPriority} → ${task.priority})`
        });
      }

      visited.add(task.id);
    });

    return adjustments;
  }

  /**
   * Calculate inherited priority for a task based on its dependents
   * @param {Object} task - Task object
   * @param {Object} dependencyGraph - Dependency graph
   * @param {Set} visited - Set of visited task IDs
   * @param {number} depth - Current inheritance depth
   * @returns {number} Calculated inherited priority
   */
  calculateInheritedPriority(task, dependencyGraph, visited, depth) {
    if (depth >= this.config.maxInheritanceDepth) {
      return task.priority;
    }

    let maxInheritedPriority = task.priority;
    const dependents = dependencyGraph.forward.get(task.id) || new Set();

    dependents.forEach(dependentId => {
      if (!visited.has(dependentId)) {
        const dependentTask = dependencyGraph.taskMap.get(dependentId);
        if (dependentTask) {
          // Recursively calculate inherited priority
          const dependentInheritedPriority = this.calculateInheritedPriority(
            dependentTask, 
            dependencyGraph, 
            visited, 
            depth + 1
          );

          // Apply decay factor for inheritance
          const inheritedFromDependent = Math.max(
            this.config.minInheritedPriority,
            Math.round(dependentInheritedPriority * Math.pow(this.config.inheritanceDecayFactor, depth + 1))
          );

          maxInheritedPriority = Math.max(maxInheritedPriority, inheritedFromDependent);
        }
      }
    });

    return maxInheritedPriority;
  }

  /**
   * Detect tasks that are blocking many others and boost their priority
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of adjustments made
   */
  detectAndBoostBlockingTasks(tasks, dependencyGraph) {
    const adjustments = [];

    tasks.forEach(task => {
      if (task.status === 'done') return; // Skip completed tasks

      const blockedTasks = this.getBlockedTasks(task.id, dependencyGraph);
      
      if (blockedTasks.size >= this.config.blockingThreshold) {
        const oldPriority = task.priority;
        const boost = Math.min(
          this.config.blockingTaskBoost,
          blockedTasks.size * 25 // 25 points per blocked task
        );
        
        task.priority = Math.min(1000, task.priority + boost);
        
        adjustments.push({
          taskId: task.id,
          type: 'blocking_task_boost',
          oldPriority,
          newPriority: task.priority,
          reason: `Priority boosted by ${boost} for blocking ${blockedTasks.size} task(s)`
        });
      }
    });

    return adjustments;
  }

  /**
   * Get all tasks that are blocked by a given task
   * @param {number} taskId - ID of the potentially blocking task
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Set} Set of blocked task IDs
   */
  getBlockedTasks(taskId, dependencyGraph) {
    const blocked = new Set();
    const visited = new Set();
    const queue = [taskId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const dependents = dependencyGraph.forward.get(currentId) || new Set();
      dependents.forEach(dependentId => {
        const dependentTask = dependencyGraph.taskMap.get(dependentId);
        if (dependentTask && dependentTask.status !== 'done') {
          blocked.add(dependentId);
          queue.push(dependentId);
        }
      });
    }

    return blocked;
  }

  /**
   * Analyze critical paths and boost priorities accordingly
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of adjustments made
   */
  analyzeCriticalPaths(tasks, dependencyGraph) {
    const adjustments = [];
    const criticalPaths = this.findCriticalPaths(tasks, dependencyGraph);

    criticalPaths.forEach(path => {
      const criticalityScore = this.calculateCriticalityScore(path, dependencyGraph);
      
      if (criticalityScore >= this.config.criticalPathThreshold) {
        path.forEach(taskId => {
          const task = dependencyGraph.taskMap.get(taskId);
          if (task && task.status !== 'done') {
            const oldPriority = task.priority;
            const boost = Math.round(this.config.criticalPathBoost * criticalityScore);
            
            task.priority = Math.min(1000, task.priority + boost);
            
            adjustments.push({
              taskId: task.id,
              type: 'critical_path_boost',
              oldPriority,
              newPriority: task.priority,
              reason: `Priority boosted by ${boost} for being on critical path (score: ${criticalityScore.toFixed(2)})`
            });
          }
        });
      }
    });

    return adjustments;
  }

  /**
   * Find critical paths in the dependency graph
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of critical paths (each path is an array of task IDs)
   */
  findCriticalPaths(tasks, dependencyGraph) {
    const paths = [];
    const visited = new Set();

    // Find root tasks (tasks with no dependencies)
    const rootTasks = tasks.filter(task => 
      !task.dependsOn || task.dependsOn.length === 0
    );

    // Traverse from each root to find all paths
    rootTasks.forEach(rootTask => {
      this.findPathsFromTask(rootTask.id, dependencyGraph, [], paths, visited);
    });

    return paths;
  }

  /**
   * Recursively find all paths from a given task
   * @param {number} taskId - Starting task ID
   * @param {Object} dependencyGraph - Dependency graph
   * @param {Array} currentPath - Current path being built
   * @param {Array} allPaths - Array to store all found paths
   * @param {Set} visited - Set of visited tasks in current path
   */
  findPathsFromTask(taskId, dependencyGraph, currentPath, allPaths, visited) {
    if (visited.has(taskId)) return; // Avoid cycles

    const newPath = [...currentPath, taskId];
    const dependents = dependencyGraph.forward.get(taskId) || new Set();

    if (dependents.size === 0) {
      // Leaf node - end of path
      allPaths.push(newPath);
    } else {
      // Continue exploring
      const newVisited = new Set(visited);
      newVisited.add(taskId);
      
      dependents.forEach(dependentId => {
        this.findPathsFromTask(dependentId, dependencyGraph, newPath, allPaths, newVisited);
      });
    }
  }

  /**
   * Calculate criticality score for a path
   * @param {Array} path - Array of task IDs in the path
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {number} Criticality score (0-1)
   */
  calculateCriticalityScore(path, dependencyGraph) {
    let totalPriority = 0;
    let totalTasks = path.length;
    let incompleteTasks = 0;

    path.forEach(taskId => {
      const task = dependencyGraph.taskMap.get(taskId);
      if (task) {
        totalPriority += task.priority;
        if (task.status !== 'done') {
          incompleteTasks++;
        }
      }
    });

    const avgPriority = totalPriority / totalTasks;
    const completionRatio = incompleteTasks / totalTasks;
    const lengthFactor = Math.min(1, totalTasks / 10); // Longer paths are more critical

    // Combine factors to get criticality score
    return (avgPriority / 1000) * completionRatio * lengthFactor;
  }

  /**
   * Apply cascade effects for priority changes
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of adjustments made
   */
  applyCascadeEffects(tasks, dependencyGraph) {
    const adjustments = [];
    
    // Find tasks with recently increased priorities (this would need to be tracked)
    // For now, we'll apply cascade to high-priority tasks
    const highPriorityTasks = tasks.filter(task => task.priority >= 800);

    highPriorityTasks.forEach(task => {
      const cascadeAdjustments = this.cascadePriorityToDependent(
        task.id, 
        task.priority, 
        dependencyGraph, 
        new Set(), 
        0
      );
      adjustments.push(...cascadeAdjustments);
    });

    return adjustments;
  }

  /**
   * Cascade priority to dependent tasks
   * @param {number} taskId - Source task ID
   * @param {number} sourcePriority - Source task priority
   * @param {Object} dependencyGraph - Dependency graph
   * @param {Set} visited - Set of visited task IDs
   * @param {number} depth - Current cascade depth
   * @returns {Array} Array of adjustments made
   */
  cascadePriorityToDependent(taskId, sourcePriority, dependencyGraph, visited, depth) {
    const adjustments = [];
    
    if (depth >= this.config.maxCascadeDepth || visited.has(taskId)) {
      return adjustments;
    }

    visited.add(taskId);
    const dependents = dependencyGraph.forward.get(taskId) || new Set();

    dependents.forEach(dependentId => {
      const dependentTask = dependencyGraph.taskMap.get(dependentId);
      if (dependentTask && dependentTask.status !== 'done') {
        const cascadedPriority = Math.round(
          sourcePriority * Math.pow(this.config.cascadeDecayRate, depth + 1)
        );

        if (cascadedPriority > dependentTask.priority) {
          const oldPriority = dependentTask.priority;
          dependentTask.priority = Math.min(1000, cascadedPriority);
          
          adjustments.push({
            taskId: dependentTask.id,
            type: 'cascade_effect',
            oldPriority,
            newPriority: dependentTask.priority,
            reason: `Priority cascaded from task ${taskId} (${oldPriority} → ${dependentTask.priority})`
          });

          // Continue cascading
          const furtherAdjustments = this.cascadePriorityToDependent(
            dependentId, 
            dependentTask.priority, 
            dependencyGraph, 
            new Set(visited), 
            depth + 1
          );
          adjustments.push(...furtherAdjustments);
        }
      }
    });

    return adjustments;
  }

  /**
   * Perform topological sort on tasks
   * @param {Array} tasks - Array of tasks
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Topologically sorted tasks
   */
  topologicalSort(tasks, dependencyGraph) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (taskId) => {
      if (visiting.has(taskId)) {
        logger.warn(`Circular dependency detected involving task ${taskId}`);
        return;
      }
      if (visited.has(taskId)) return;

      visiting.add(taskId);
      const dependencies = dependencyGraph.reverse.get(taskId) || new Set();
      
      dependencies.forEach(depId => {
        visit(depId);
      });

      visiting.delete(taskId);
      visited.add(taskId);
      
      const task = dependencyGraph.taskMap.get(taskId);
      if (task) {
        sorted.push(task);
      }
    };

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        visit(task.id);
      }
    });

    return sorted;
  }

  /**
   * Get dependency analysis report
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Dependency analysis report
   */
  getDependencyAnalysis(tasks) {
    const dependencyGraph = this.buildDependencyGraph(tasks);
    const criticalPaths = this.findCriticalPaths(tasks, dependencyGraph);
    
    const analysis = {
      totalTasks: tasks.length,
      tasksWithDependencies: tasks.filter(t => t.dependsOn && t.dependsOn.length > 0).length,
      rootTasks: tasks.filter(t => !t.dependsOn || t.dependsOn.length === 0).length,
      leafTasks: tasks.filter(t => {
        const dependents = dependencyGraph.forward.get(t.id) || new Set();
        return dependents.size === 0;
      }).length,
      criticalPaths: criticalPaths.length,
      longestPath: criticalPaths.reduce((max, path) => Math.max(max, path.length), 0),
      blockingTasks: [],
      circularDependencies: this.detectCircularDependencies(dependencyGraph)
    };

    // Find blocking tasks
    tasks.forEach(task => {
      const blockedTasks = this.getBlockedTasks(task.id, dependencyGraph);
      if (blockedTasks.size >= this.config.blockingThreshold) {
        analysis.blockingTasks.push({
          taskId: task.id,
          title: task.title,
          blockedCount: blockedTasks.size
        });
      }
    });

    return analysis;
  }

  /**
   * Detect circular dependencies in the graph
   * @param {Object} dependencyGraph - Dependency graph
   * @returns {Array} Array of circular dependency chains
   */
  detectCircularDependencies(dependencyGraph) {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    const detectCycle = (taskId, path) => {
      if (recursionStack.has(taskId)) {
        // Found a cycle
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart));
        return;
      }
      if (visited.has(taskId)) return;

      visited.add(taskId);
      recursionStack.add(taskId);
      
      const dependencies = dependencyGraph.reverse.get(taskId) || new Set();
      dependencies.forEach(depId => {
        detectCycle(depId, [...path, taskId]);
      });

      recursionStack.delete(taskId);
    };

    dependencyGraph.taskMap.forEach((task, taskId) => {
      if (!visited.has(taskId)) {
        detectCycle(taskId, []);
      }
    });

    return cycles;
  }
}

module.exports = DependencyManager;
