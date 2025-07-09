const logger = require('./logger');
const DependencyManager = require('./dependency_manager');

/**
 * Advanced Priority Recalculation Engine
 * Provides sophisticated priority management with dependency awareness,
 * time-based decay, and intelligent distribution algorithms.
 */
class PriorityEngine {
  constructor() {
    this.config = {
      // Priority ranges
      minPriority: 1,
      maxPriority: 1000,

      // Dependency boost settings
      dependencyBoostFactor: 0.1, // 10% boost for each dependent task
      maxDependencyBoost: 200,    // Maximum boost from dependencies

      // Time decay settings
      timeDecayEnabled: false,    // Disabled by default
      timeDecayModel: 'exponential', // 'linear', 'exponential', 'logarithmic', 'sigmoid'
      timeDecayRate: 0.05,       // Base decay rate (5% per week)
      timeDecayThreshold: 7,     // Days before decay starts
      timeDecayMaxBoost: 100,    // Maximum boost for aging tasks
      timeDecayMinRate: 0.001,   // Minimum decay rate
      timeDecayMaxRate: 0.2,     // Maximum decay rate
      timeDecayPriorityWeight: true, // Higher priority tasks decay slower

      // Effort-weighted scoring settings
      effortWeightingEnabled: false, // Disabled by default
      effortScoreWeight: 0.3,       // Weight of effort score in priority calculation
      complexityWeight: 0.4,        // Weight of complexity in effort calculation
      impactWeight: 0.6,           // Weight of impact in effort calculation
      urgencyWeight: 0.5,          // Weight of urgency in effort calculation
      effortDecayRate: 0.02,       // How effort score decays over time
      effortBoostThreshold: 0.7,   // Effort score threshold for priority boost

      // Distribution settings
      distributionSpacing: 5,    // Minimum spacing between priorities
      compressionThreshold: 0.8, // Compress when 80% of range is used
    };

    // Initialize dependency manager
    this.dependencyManager = new DependencyManager();
  }

  /**
   * Recalculate all task priorities with advanced algorithms
   * @param {Object} tasksData - The tasks data object
   * @param {Object} options - Recalculation options
   * @returns {Array} Array of priority adjustments made
   */
  recalculateAllPriorities(tasksData, options = {}) {
    if (!tasksData.tasks || tasksData.tasks.length === 0) {
      return [];
    }

    const adjustments = [];
    const tasks = [...tasksData.tasks]; // Work with a copy

    // Step 1: Apply dependency-based priority boosts
    if (options.applyDependencyBoosts !== false) {
      const dependencyAdjustments = this.applyDependencyBoosts(tasks);
      adjustments.push(...dependencyAdjustments);
    }

    // Step 1.5: Apply advanced dependency management (inheritance, blocking, critical paths)
    if (options.applyAdvancedDependencies !== false) {
      const advancedDependencyAdjustments = this.dependencyManager.enhancePrioritiesWithDependencies(tasks);
      adjustments.push(...advancedDependencyAdjustments);
    }

    // Step 2: Apply time-based decay (if enabled)
    if (this.config.timeDecayEnabled && options.applyTimeDecay !== false) {
      const decayAdjustments = this.applyTimeDecay(tasks);
      adjustments.push(...decayAdjustments);
    }

    // Step 2.5: Apply effort-weighted priority scoring (if enabled)
    if (this.config.effortWeightingEnabled && options.applyEffortWeighting !== false) {
      const effortAdjustments = this.applyEffortWeightedScoring(tasks);
      adjustments.push(...effortAdjustments);
    }

    // Step 3: Ensure unique priorities with intelligent distribution
    const uniquenessAdjustments = this.ensureUniquePrioritiesAdvanced(tasks);
    adjustments.push(...uniquenessAdjustments);

    // Step 4: Optimize priority distribution
    if (options.optimizeDistribution !== false) {
      const distributionAdjustments = this.optimizePriorityDistribution(tasks);
      adjustments.push(...distributionAdjustments);
    }

    return adjustments;
  }

  /**
   * Apply priority boosts based on task dependencies
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of adjustments made
   */
  applyDependencyBoosts(tasks) {
    const adjustments = [];
    const taskMap = new Map(tasks.map(task => [task.id, task]));

    // Calculate dependency counts for each task
    const dependentCounts = new Map();
    tasks.forEach(task => {
      if (task.dependsOn && Array.isArray(task.dependsOn)) {
        task.dependsOn.forEach(depId => {
          const count = dependentCounts.get(depId) || 0;
          dependentCounts.set(depId, count + 1);
        });
      }
    });

    // Apply boosts based on how many tasks depend on each task
    dependentCounts.forEach((dependentCount, taskId) => {
      const task = taskMap.get(taskId);
      if (task && dependentCount > 0) {
        const boost = Math.min(
          dependentCount * this.config.dependencyBoostFactor * task.priority,
          this.config.maxDependencyBoost
        );
        
        const oldPriority = task.priority;
        const newPriority = Math.min(
          this.config.maxPriority,
          Math.round(task.priority + boost)
        );

        if (newPriority !== oldPriority) {
          task.priority = newPriority;
          adjustments.push({
            taskId: task.id,
            type: 'dependency_boost',
            oldPriority,
            newPriority,
            reason: `Priority boosted by ${boost} due to ${dependentCount} dependent task(s)`
          });
        }
      }
    });

    return adjustments;
  }

  /**
   * Apply advanced time-based priority decay with multiple models
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of adjustments made
   */
  applyTimeDecay(tasks) {
    const adjustments = [];
    const now = new Date();

    tasks.forEach(task => {
      if (task.status === 'done' || !task.createdAt) {
        return; // Skip completed tasks or tasks without creation date
      }

      const createdDate = new Date(task.createdAt);
      const lastUpdated = task.updatedAt ? new Date(task.updatedAt) : createdDate;
      const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);
      const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);

      // Use the more recent of creation or update for decay calculation
      const effectiveDays = Math.min(daysSinceCreation, daysSinceUpdate);

      if (effectiveDays > this.config.timeDecayThreshold) {
        const decayDays = effectiveDays - this.config.timeDecayThreshold;
        const decayAmount = this.calculateTimeDecayAmount(task, decayDays);

        if (Math.abs(decayAmount) > 0) {
          const oldPriority = task.priority;
          let newPriority;

          if (decayAmount > 0) {
            // Positive decay = priority increase (aging boost)
            newPriority = Math.min(this.config.maxPriority, task.priority + decayAmount);
          } else {
            // Negative decay = priority decrease (traditional decay)
            newPriority = Math.max(this.config.minPriority, task.priority + decayAmount);
          }

          if (newPriority !== oldPriority) {
            task.priority = newPriority;
            const decayType = decayAmount > 0 ? 'aging_boost' : 'time_decay';
            const reason = decayAmount > 0
              ? `Priority boosted by ${decayAmount} due to aging (${Math.round(decayDays)} days)`
              : `Priority decayed by ${Math.abs(decayAmount)} after ${Math.round(decayDays)} days`;

            adjustments.push({
              taskId: task.id,
              type: decayType,
              oldPriority,
              newPriority,
              reason,
              model: this.config.timeDecayModel,
              days: Math.round(decayDays)
            });
          }
        }
      }
    });

    return adjustments;
  }

  /**
   * Calculate time decay amount using the configured model
   * @param {Object} task - Task object
   * @param {number} decayDays - Days since threshold
   * @returns {number} Decay amount (positive for boost, negative for decay)
   */
  calculateTimeDecayAmount(task, decayDays) {
    const basePriority = task.priority;
    const priorityWeight = this.config.timeDecayPriorityWeight
      ? (basePriority / this.config.maxPriority)
      : 1;

    // Adjust decay rate based on priority (higher priority tasks decay slower)
    const adjustedRate = this.config.timeDecayRate * (2 - priorityWeight);

    switch (this.config.timeDecayModel) {
      case 'linear':
        return this.calculateLinearDecay(basePriority, decayDays, adjustedRate);

      case 'exponential':
        return this.calculateExponentialDecay(basePriority, decayDays, adjustedRate);

      case 'logarithmic':
        return this.calculateLogarithmicDecay(basePriority, decayDays, adjustedRate);

      case 'sigmoid':
        return this.calculateSigmoidDecay(basePriority, decayDays, adjustedRate);

      case 'adaptive':
        return this.calculateAdaptiveDecay(task, decayDays, adjustedRate);

      default:
        return this.calculateExponentialDecay(basePriority, decayDays, adjustedRate);
    }
  }

  /**
   * Linear decay model - constant decay rate
   */
  calculateLinearDecay(priority, days, rate) {
    return -Math.floor(priority * rate * days);
  }

  /**
   * Exponential decay model - accelerating decay over time
   */
  calculateExponentialDecay(priority, days, rate) {
    const decayFactor = Math.pow(1 - rate, days);
    return -Math.floor(priority * (1 - decayFactor));
  }

  /**
   * Logarithmic decay model - diminishing decay over time
   */
  calculateLogarithmicDecay(priority, days, rate) {
    const logFactor = Math.log(1 + days) / Math.log(2); // Log base 2
    return -Math.floor(priority * rate * logFactor);
  }

  /**
   * Sigmoid decay model - S-curve decay with initial slow decay, then rapid, then slow again
   */
  calculateSigmoidDecay(priority, days, rate) {
    const sigmoidValue = 1 / (1 + Math.exp(-0.1 * (days - 30))); // Inflection at 30 days
    return -Math.floor(priority * rate * sigmoidValue * days);
  }

  /**
   * Adaptive decay model - considers task characteristics for intelligent decay
   */
  calculateAdaptiveDecay(task, days, rate) {
    let adaptiveRate = rate;

    // Adjust based on task status
    if (task.status === 'inprogress') {
      adaptiveRate *= 0.5; // Slower decay for active tasks
    } else if (task.status === 'blocked') {
      adaptiveRate *= 1.5; // Faster decay for blocked tasks
    }

    // Adjust based on dependencies
    if (task.dependsOn && task.dependsOn.length > 0) {
      adaptiveRate *= 0.7; // Slower decay for dependent tasks
    }

    // Adjust based on priority range
    if (task.priority >= 900) {
      // Critical tasks get aging boost instead of decay
      return Math.floor(this.config.timeDecayMaxBoost * (days / 30));
    } else if (task.priority >= 700) {
      adaptiveRate *= 0.8; // Slower decay for high priority
    } else if (task.priority < 400) {
      adaptiveRate *= 1.2; // Faster decay for low priority
    }

    // Use exponential model with adaptive rate
    const decayFactor = Math.pow(1 - adaptiveRate, days);
    return -Math.floor(task.priority * (1 - decayFactor));
  }

  /**
   * Apply effort-weighted priority scoring
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of adjustments made
   */
  applyEffortWeightedScoring(tasks) {
    const adjustments = [];

    tasks.forEach(task => {
      if (task.status === 'done') {
        return; // Skip completed tasks
      }

      const effortScore = this.calculateEffortScore(task);
      const currentPriority = task.priority;
      const effortAdjustment = this.calculateEffortPriorityAdjustment(effortScore);

      if (Math.abs(effortAdjustment) >= 1) {
        const oldPriority = task.priority;
        const newPriority = Math.max(
          this.config.minPriority,
          Math.min(this.config.maxPriority, currentPriority + effortAdjustment)
        );

        if (newPriority !== oldPriority) {
          task.priority = newPriority;
          task.effortScore = effortScore; // Store effort score for future reference

          adjustments.push({
            taskId: task.id,
            type: 'effort_weighting',
            oldPriority,
            newPriority,
            effortScore: Math.round(effortScore * 100) / 100,
            adjustment: Math.round(effortAdjustment),
            reason: `Priority adjusted by ${Math.round(effortAdjustment)} based on effort score ${Math.round(effortScore * 100) / 100}`
          });
        }
      }
    });

    return adjustments;
  }

  /**
   * Calculate effort score for a task based on multiple factors
   * @param {Object} task - Task object
   * @returns {number} Effort score (0-1)
   */
  calculateEffortScore(task) {
    // Base factors
    const complexity = this.assessComplexity(task);
    const impact = this.assessImpact(task);
    const urgency = this.assessUrgency(task);
    const workload = this.assessWorkload(task);

    // Weighted combination
    const effortScore = (
      complexity * this.config.complexityWeight +
      impact * this.config.impactWeight +
      urgency * this.config.urgencyWeight +
      workload * 0.3 // Additional workload factor
    ) / (this.config.complexityWeight + this.config.impactWeight + this.config.urgencyWeight + 0.3);

    // Apply time-based decay to effort score
    const timeDecay = this.calculateEffortTimeDecay(task);
    const adjustedScore = Math.max(0, Math.min(1, effortScore * timeDecay));

    return adjustedScore;
  }

  /**
   * Assess task complexity based on various indicators
   * @param {Object} task - Task object
   * @returns {number} Complexity score (0-1)
   */
  assessComplexity(task) {
    let complexity = 0.5; // Base complexity

    // Analyze title and description for complexity indicators
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    // High complexity indicators
    const highComplexityTerms = [
      'refactor', 'architecture', 'migration', 'integration', 'algorithm',
      'optimization', 'security', 'performance', 'scalability', 'infrastructure'
    ];

    // Low complexity indicators
    const lowComplexityTerms = [
      'typo', 'text', 'copy', 'documentation', 'readme', 'comment',
      'style', 'color', 'spacing', 'alignment'
    ];

    // Adjust based on keywords
    highComplexityTerms.forEach(term => {
      if (text.includes(term)) complexity += 0.1;
    });

    lowComplexityTerms.forEach(term => {
      if (text.includes(term)) complexity -= 0.1;
    });

    // Adjust based on dependencies
    if (task.dependsOn && task.dependsOn.length > 0) {
      complexity += task.dependsOn.length * 0.05;
    }

    // Adjust based on subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      complexity += task.subtasks.length * 0.03;
    }

    // Adjust based on related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      complexity += task.relatedFiles.length * 0.02;
    }

    return Math.max(0, Math.min(1, complexity));
  }

  /**
   * Assess task impact based on priority and dependencies
   * @param {Object} task - Task object
   * @returns {number} Impact score (0-1)
   */
  assessImpact(task) {
    let impact = task.priority / this.config.maxPriority; // Base impact from priority

    // Analyze title and description for impact indicators
    const text = `${task.title} ${task.description || ''}`.toLowerCase();

    // High impact indicators
    const highImpactTerms = [
      'critical', 'urgent', 'blocking', 'production', 'security', 'data loss',
      'outage', 'crash', 'failure', 'bug', 'fix', 'emergency'
    ];

    // User-facing impact indicators
    const userImpactTerms = [
      'user', 'customer', 'ui', 'ux', 'interface', 'experience',
      'frontend', 'mobile', 'web', 'accessibility'
    ];

    // Adjust based on keywords
    highImpactTerms.forEach(term => {
      if (text.includes(term)) impact += 0.1;
    });

    userImpactTerms.forEach(term => {
      if (text.includes(term)) impact += 0.05;
    });

    // Boost impact if task is blocking others (calculated elsewhere)
    // This would be enhanced by dependency analysis

    return Math.max(0, Math.min(1, impact));
  }

  /**
   * Assess task urgency based on age and status
   * @param {Object} task - Task object
   * @returns {number} Urgency score (0-1)
   */
  assessUrgency(task) {
    const now = new Date();
    const createdDate = new Date(task.createdAt);
    const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);

    let urgency = 0.5; // Base urgency

    // Increase urgency based on age
    if (daysSinceCreation > 30) {
      urgency += 0.3; // Old tasks become more urgent
    } else if (daysSinceCreation > 14) {
      urgency += 0.2;
    } else if (daysSinceCreation > 7) {
      urgency += 0.1;
    }

    // Adjust based on status
    if (task.status === 'blocked') {
      urgency += 0.2; // Blocked tasks need attention
    } else if (task.status === 'inprogress') {
      urgency += 0.1; // In-progress tasks have momentum
    }

    // Analyze for urgency keywords
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    const urgencyTerms = [
      'urgent', 'asap', 'immediate', 'now', 'today', 'deadline',
      'due', 'release', 'launch', 'deploy'
    ];

    urgencyTerms.forEach(term => {
      if (text.includes(term)) urgency += 0.15;
    });

    return Math.max(0, Math.min(1, urgency));
  }

  /**
   * Assess workload based on task characteristics
   * @param {Object} task - Task object
   * @returns {number} Workload score (0-1)
   */
  assessWorkload(task) {
    let workload = 0.5; // Base workload

    // Estimate based on description length
    const descriptionLength = (task.description || '').length;
    if (descriptionLength > 500) {
      workload += 0.2; // Detailed descriptions suggest more work
    } else if (descriptionLength < 50) {
      workload -= 0.1; // Brief descriptions suggest less work
    }

    // Adjust based on subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      workload += task.subtasks.length * 0.1;
    }

    // Adjust based on related files
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      workload += task.relatedFiles.length * 0.05;
    }

    // Analyze for workload indicators
    const text = `${task.title} ${task.description || ''}`.toLowerCase();
    const heavyWorkTerms = [
      'implement', 'develop', 'create', 'build', 'design', 'research',
      'analyze', 'test', 'migrate', 'refactor'
    ];

    const lightWorkTerms = [
      'update', 'fix', 'change', 'modify', 'adjust', 'tweak',
      'correct', 'edit', 'review'
    ];

    heavyWorkTerms.forEach(term => {
      if (text.includes(term)) workload += 0.1;
    });

    lightWorkTerms.forEach(term => {
      if (text.includes(term)) workload -= 0.05;
    });

    return Math.max(0, Math.min(1, workload));
  }

  /**
   * Calculate time-based decay for effort scores
   * @param {Object} task - Task object
   * @returns {number} Time decay factor (0-1)
   */
  calculateEffortTimeDecay(task) {
    const now = new Date();
    const createdDate = new Date(task.createdAt);
    const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);

    // Effort scores decay slowly over time
    const decayFactor = Math.pow(1 - this.config.effortDecayRate, daysSinceCreation);
    return Math.max(0.1, decayFactor); // Minimum 10% of original effort score
  }

  /**
   * Calculate priority adjustment based on effort score
   * @param {number} effortScore - Calculated effort score
   * @returns {number} Priority adjustment amount
   */
  calculateEffortPriorityAdjustment(effortScore) {
    const priorityRange = this.config.maxPriority - this.config.minPriority;

    // Calculate adjustment based on effort score deviation from expected
    const expectedEffort = 0.5; // Neutral effort score
    const effortDeviation = effortScore - expectedEffort;

    // Scale adjustment based on priority range and configuration
    const maxAdjustment = priorityRange * this.config.effortScoreWeight;
    const adjustment = effortDeviation * maxAdjustment;

    // Apply boost threshold
    if (effortScore > this.config.effortBoostThreshold) {
      return Math.max(adjustment, maxAdjustment * 0.1); // Minimum boost for high effort
    }

    return adjustment;
  }

  /**
   * Configure effort weighting settings
   * @param {Object} config - Effort weighting configuration
   */
  configureEffortWeighting(config) {
    if (config.enabled !== undefined) {
      this.config.effortWeightingEnabled = config.enabled;
    }
    if (config.scoreWeight !== undefined) {
      this.config.effortScoreWeight = config.scoreWeight;
    }
    if (config.complexityWeight !== undefined) {
      this.config.complexityWeight = config.complexityWeight;
    }
    if (config.impactWeight !== undefined) {
      this.config.impactWeight = config.impactWeight;
    }
    if (config.urgencyWeight !== undefined) {
      this.config.urgencyWeight = config.urgencyWeight;
    }
    if (config.decayRate !== undefined) {
      this.config.effortDecayRate = config.decayRate;
    }
    if (config.boostThreshold !== undefined) {
      this.config.effortBoostThreshold = config.boostThreshold;
    }

    logger.info(`Effort weighting configured: ${JSON.stringify(this.getEffortWeightingConfig())}`);
  }

  /**
   * Get current effort weighting configuration
   * @returns {Object} Effort weighting configuration
   */
  getEffortWeightingConfig() {
    return {
      enabled: this.config.effortWeightingEnabled,
      scoreWeight: this.config.effortScoreWeight,
      complexityWeight: this.config.complexityWeight,
      impactWeight: this.config.impactWeight,
      urgencyWeight: this.config.urgencyWeight,
      decayRate: this.config.effortDecayRate,
      boostThreshold: this.config.effortBoostThreshold
    };
  }

  /**
   * Configure time decay settings
   * @param {Object} config - Time decay configuration
   */
  configureTimeDecay(config) {
    if (config.enabled !== undefined) {
      this.config.timeDecayEnabled = config.enabled;
    }
    if (config.model !== undefined) {
      this.config.timeDecayModel = config.model;
    }
    if (config.rate !== undefined) {
      this.config.timeDecayRate = config.rate;
    }
    if (config.threshold !== undefined) {
      this.config.timeDecayThreshold = config.threshold;
    }
    if (config.maxBoost !== undefined) {
      this.config.timeDecayMaxBoost = config.maxBoost;
    }
    if (config.priorityWeight !== undefined) {
      this.config.timeDecayPriorityWeight = config.priorityWeight;
    }

    logger.info(`Time decay configured: ${JSON.stringify(this.getTimeDecayConfig())}`);
  }

  /**
   * Get current time decay configuration
   * @returns {Object} Time decay configuration
   */
  getTimeDecayConfig() {
    return {
      enabled: this.config.timeDecayEnabled,
      model: this.config.timeDecayModel,
      rate: this.config.timeDecayRate,
      threshold: this.config.timeDecayThreshold,
      maxBoost: this.config.timeDecayMaxBoost,
      priorityWeight: this.config.timeDecayPriorityWeight
    };
  }

  /**
   * Get available time decay models
   * @returns {Array} Array of available models with descriptions
   */
  getAvailableDecayModels() {
    return [
      {
        name: 'linear',
        description: 'Constant decay rate over time',
        useCase: 'Predictable, steady priority reduction'
      },
      {
        name: 'exponential',
        description: 'Accelerating decay over time',
        useCase: 'Rapid priority reduction for old tasks'
      },
      {
        name: 'logarithmic',
        description: 'Diminishing decay over time',
        useCase: 'Gentle priority reduction that slows down'
      },
      {
        name: 'sigmoid',
        description: 'S-curve decay with phases',
        useCase: 'Complex decay pattern with inflection point'
      },
      {
        name: 'adaptive',
        description: 'Intelligent decay based on task characteristics',
        useCase: 'Context-aware priority management'
      }
    ];
  }

  /**
   * Advanced unique priority enforcement with intelligent distribution
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of adjustments made
   */
  ensureUniquePrioritiesAdvanced(tasks) {
    const adjustments = [];
    const usedPriorities = new Set();
    
    // Sort tasks by priority (descending) then by creation date (ascending)
    tasks.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB; // Earlier tasks get priority in case of ties
    });

    tasks.forEach(task => {
      let newPriority = task.priority;
      
      if (usedPriorities.has(newPriority)) {
        // Find the best available priority near the target
        newPriority = this.findBestAvailablePriority(
          task.priority,
          usedPriorities,
          this.config.distributionSpacing
        );

        if (newPriority !== task.priority) {
          const oldPriority = task.priority;
          task.priority = newPriority;
          
          adjustments.push({
            taskId: task.id,
            type: 'uniqueness_enforcement',
            oldPriority,
            newPriority,
            reason: `Priority adjusted to ensure uniqueness`
          });
        }
      }

      usedPriorities.add(newPriority);
    });

    return adjustments;
  }

  /**
   * Find the best available priority near a target value
   * @param {number} targetPriority - Desired priority
   * @param {Set} usedPriorities - Set of already used priorities
   * @param {number} minSpacing - Minimum spacing between priorities
   * @returns {number} Best available priority
   */
  findBestAvailablePriority(targetPriority, usedPriorities, minSpacing = 1) {
    // Try the exact target first
    if (!usedPriorities.has(targetPriority)) {
      return targetPriority;
    }

    // Search in expanding ranges around the target
    for (let offset = minSpacing; offset <= 500; offset += minSpacing) {
      // Try higher priority first
      const higher = targetPriority + offset;
      if (higher <= this.config.maxPriority && !usedPriorities.has(higher)) {
        return higher;
      }

      // Try lower priority
      const lower = targetPriority - offset;
      if (lower >= this.config.minPriority && !usedPriorities.has(lower)) {
        return lower;
      }
    }

    // Fallback: find any available priority
    for (let p = this.config.maxPriority; p >= this.config.minPriority; p--) {
      if (!usedPriorities.has(p)) {
        return p;
      }
    }

    // This should never happen with 1000 priorities
    return targetPriority;
  }

  /**
   * Optimize priority distribution to avoid clustering
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of adjustments made
   */
  optimizePriorityDistribution(tasks) {
    const adjustments = [];
    const priorityCount = tasks.length;
    const usedRange = this.config.maxPriority - this.config.minPriority + 1;
    const utilizationRatio = priorityCount / usedRange;

    // Only optimize if we're approaching the compression threshold
    if (utilizationRatio < this.config.compressionThreshold) {
      return adjustments;
    }

    logger.debug(`Priority range utilization: ${(utilizationRatio * 100).toFixed(1)}% - optimizing distribution`);

    // Sort tasks by current priority
    tasks.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Redistribute priorities with optimal spacing
    const optimalSpacing = Math.max(1, Math.floor(usedRange / priorityCount));
    
    tasks.forEach((task, index) => {
      const optimalPriority = this.config.maxPriority - (index * optimalSpacing);
      const clampedPriority = Math.max(this.config.minPriority, optimalPriority);

      if (clampedPriority !== task.priority) {
        const oldPriority = task.priority;
        task.priority = clampedPriority;
        
        adjustments.push({
          taskId: task.id,
          type: 'distribution_optimization',
          oldPriority,
          newPriority: clampedPriority,
          reason: `Priority redistributed for optimal spacing (${optimalSpacing})`
        });
      }
    });

    return adjustments;
  }

  /**
   * Get priority statistics for the current task set
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Priority statistics
   */
  getPriorityStatistics(tasks) {
    if (!tasks || tasks.length === 0) {
      return { count: 0, min: 0, max: 0, average: 0, distribution: {} };
    }

    const priorities = tasks.map(task => task.priority || 0);
    const min = Math.min(...priorities);
    const max = Math.max(...priorities);
    const average = priorities.reduce((sum, p) => sum + p, 0) / priorities.length;

    // Calculate distribution by ranges
    const distribution = {
      critical: priorities.filter(p => p >= 800).length,
      high: priorities.filter(p => p >= 600 && p < 800).length,
      medium: priorities.filter(p => p >= 400 && p < 600).length,
      low: priorities.filter(p => p < 400).length
    };

    return {
      count: tasks.length,
      min,
      max,
      average: Math.round(average),
      distribution,
      utilizationRatio: tasks.length / (this.config.maxPriority - this.config.minPriority + 1)
    };
  }

  /**
   * Get comprehensive dependency analysis
   * @param {Array} tasks - Array of tasks
   * @returns {Object} Dependency analysis report
   */
  getDependencyAnalysis(tasks) {
    return this.dependencyManager.getDependencyAnalysis(tasks);
  }
}

module.exports = PriorityEngine;
