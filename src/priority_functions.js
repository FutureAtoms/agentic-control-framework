// --- Priority Uniqueness System ---
// Function to ensure all tasks have unique numerical priorities
function ensureUniquePriorities(tasksData) {
  if (!tasksData.tasks || tasksData.tasks.length === 0) return;

  // Separate tasks by priority type
  const stringPriorityTasks = [];
  const numericPriorityTasks = [];
  
  tasksData.tasks.forEach(task => {
    // Check if the task is using a backward-compatible string priority
    if (typeof task.priorityDisplay === 'string' && 
        PRIORITY_MAPPING[task.priorityDisplay.toLowerCase()] === task.priority) {
      stringPriorityTasks.push(task);
    } else {
      numericPriorityTasks.push(task);
    }
  });

  // Sort numeric priority tasks by priority (descending) and then by ID (ascending)
  numericPriorityTasks.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.id - b.id; // If same priority, sort by ID to maintain consistency
  });

  // Check for conflicts and adjust
  const usedPriorities = new Set();
  const adjustedTasks = [];

  // First, record all string-based priorities as "used"
  stringPriorityTasks.forEach(task => {
    usedPriorities.add(task.priority);
  });

  // Process numeric priority tasks
  numericPriorityTasks.forEach(task => {
    let newPriority = task.priority;
    let adjustmentAttempts = 0;
    const maxAttempts = 1000; // Prevent infinite loops

    // Find a unique priority
    while (usedPriorities.has(newPriority) && adjustmentAttempts < maxAttempts) {
      // Try decreasing by 1 first (to maintain relative order)
      newPriority--;
      
      // Ensure we stay within bounds
      if (newPriority < 1) {
        // If we hit the lower bound, try increasing from original
        newPriority = task.priority + adjustmentAttempts;
        if (newPriority > 1000) {
          // If we exceed upper bound, compress the range
          newPriority = Math.floor(Math.random() * 900) + 50; // Random between 50-950
        }
      }
      
      adjustmentAttempts++;
    }

    // If priority was adjusted, update the task and log it
    if (newPriority !== task.priority) {
      const oldPriority = task.priority;
      task.priority = newPriority;
      
      // Update priorityDisplay if it was numeric
      if (typeof task.priorityDisplay === 'number') {
        task.priorityDisplay = newPriority;
      }
      
      // Add activity log entry
      addActivityLog(task, `Priority automatically adjusted from ${oldPriority} to ${newPriority} to ensure uniqueness.`);
      adjustedTasks.push({ id: task.id, oldPriority, newPriority });
    }

    usedPriorities.add(newPriority);
  });

  // Return information about adjustments made
  return adjustedTasks;
}

// Function to suggest the next available priority near a target
function getNextAvailablePriority(tasksData, targetPriority, excludeTaskId = null) {
  const usedPriorities = new Set();
  
  // Collect all used priorities except the excluded task
  tasksData.tasks.forEach(task => {
    if (task.id !== excludeTaskId) {
      usedPriorities.add(task.priority);
    }
  });

  // If target is available, use it
  if (!usedPriorities.has(targetPriority)) {
    return targetPriority;
  }

  // Search for nearest available priority
  let offset = 1;
  const maxOffset = 500;

  while (offset <= maxOffset) {
    // Try higher priority first
    const higher = targetPriority + offset;
    if (higher <= 1000 && !usedPriorities.has(higher)) {
      return higher;
    }

    // Try lower priority
    const lower = targetPriority - offset;
    if (lower >= 1 && !usedPriorities.has(lower)) {
      return lower;
    }

    offset++;
  }

  // If no nearby priority is available, find any available
  for (let p = 1000; p >= 1; p--) {
    if (!usedPriorities.has(p)) {
      return p;
    }
  }

  // This should never happen with 1000 priorities and reasonable task counts
  return targetPriority;
}
// --- End Priority Uniqueness System ---

module.exports = {
  ensureUniquePriorities,
  getNextAvailablePriority
};
