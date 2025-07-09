const logger = require('./logger');

/**
 * Priority Templates System
 * Provides predefined priority templates for common task types with base priorities and modifiers
 */
class PriorityTemplates {
  constructor() {
    this.templates = {
      // Bug-related templates
      bug: {
        name: 'Bug Fix',
        basePriority: 750,
        description: 'General bug fix task',
        modifiers: {
          critical: 200,    // Critical bugs get +200
          security: 250,    // Security bugs get +250
          data_loss: 300,   // Data loss bugs get +300
          performance: 150, // Performance bugs get +150
          ui: 100,         // UI bugs get +100
          minor: -200,     // Minor bugs get -200
          typo: -300       // Typos get -300
        },
        keywords: {
          critical: ['critical', 'urgent', 'blocking', 'production', 'outage', 'crash'],
          security: ['security', 'vulnerability', 'exploit', 'breach', 'auth', 'permission'],
          data_loss: ['data loss', 'corruption', 'delete', 'missing data', 'lost'],
          performance: ['slow', 'performance', 'timeout', 'lag', 'memory', 'cpu'],
          ui: ['ui', 'interface', 'display', 'layout', 'visual', 'css'],
          minor: ['minor', 'cosmetic', 'polish'],
          typo: ['typo', 'spelling', 'grammar', 'text']
        }
      },

      // Feature-related templates
      feature: {
        name: 'Feature Development',
        basePriority: 600,
        description: 'New feature implementation',
        modifiers: {
          core: 200,        // Core features get +200
          user_facing: 150, // User-facing features get +150
          api: 100,         // API features get +100
          integration: 120, // Integration features get +120
          enhancement: 50,  // Enhancements get +50
          nice_to_have: -150 // Nice-to-have features get -150
        },
        keywords: {
          core: ['core', 'essential', 'fundamental', 'critical feature'],
          user_facing: ['user', 'ui', 'ux', 'interface', 'frontend'],
          api: ['api', 'endpoint', 'service', 'backend'],
          integration: ['integration', 'connect', 'sync', 'import', 'export'],
          enhancement: ['enhance', 'improve', 'upgrade', 'optimize'],
          nice_to_have: ['nice to have', 'optional', 'future', 'wishlist']
        }
      },

      // Refactoring templates
      refactor: {
        name: 'Code Refactoring',
        basePriority: 500,
        description: 'Code refactoring and cleanup',
        modifiers: {
          architecture: 200, // Architecture refactoring gets +200
          performance: 150,  // Performance refactoring gets +150
          security: 180,     // Security refactoring gets +180
          maintainability: 100, // Maintainability gets +100
          cleanup: 50,       // Code cleanup gets +50
          style: -50         // Style changes get -50
        },
        keywords: {
          architecture: ['architecture', 'structure', 'design', 'pattern'],
          performance: ['performance', 'optimize', 'speed', 'efficiency'],
          security: ['security', 'secure', 'vulnerability', 'safety'],
          maintainability: ['maintainability', 'readable', 'clean', 'organize'],
          cleanup: ['cleanup', 'remove', 'unused', 'dead code'],
          style: ['style', 'format', 'lint', 'prettier']
        }
      },

      // Documentation templates
      docs: {
        name: 'Documentation',
        basePriority: 350,
        description: 'Documentation tasks',
        modifiers: {
          api: 150,         // API docs get +150
          user_guide: 100,  // User guides get +100
          setup: 120,       // Setup docs get +120
          tutorial: 80,     // Tutorials get +80
          readme: 60,       // README updates get +60
          comments: 30,     // Code comments get +30
          changelog: 40     // Changelog updates get +40
        },
        keywords: {
          api: ['api', 'endpoint', 'reference', 'swagger'],
          user_guide: ['user guide', 'manual', 'how to', 'guide'],
          setup: ['setup', 'installation', 'config', 'getting started'],
          tutorial: ['tutorial', 'walkthrough', 'example'],
          readme: ['readme', 'overview'],
          comments: ['comments', 'documentation', 'jsdoc'],
          changelog: ['changelog', 'release notes', 'version']
        }
      },

      // Testing templates
      test: {
        name: 'Testing',
        basePriority: 550,
        description: 'Testing and quality assurance',
        modifiers: {
          unit: 100,        // Unit tests get +100
          integration: 120, // Integration tests get +120
          e2e: 150,         // E2E tests get +150
          performance: 130, // Performance tests get +130
          security: 140,    // Security tests get +140
          coverage: 80,     // Coverage improvements get +80
          flaky: 90         // Fixing flaky tests gets +90
        },
        keywords: {
          unit: ['unit test', 'unit testing'],
          integration: ['integration test', 'integration testing'],
          e2e: ['e2e', 'end to end', 'e2e test'],
          performance: ['performance test', 'load test', 'stress test'],
          security: ['security test', 'penetration test'],
          coverage: ['coverage', 'test coverage'],
          flaky: ['flaky', 'unstable', 'intermittent']
        }
      },

      // DevOps templates
      devops: {
        name: 'DevOps & Infrastructure',
        basePriority: 650,
        description: 'DevOps and infrastructure tasks',
        modifiers: {
          deployment: 150,  // Deployment tasks get +150
          monitoring: 120,  // Monitoring gets +120
          security: 180,    // Security tasks get +180
          backup: 140,      // Backup tasks get +140
          scaling: 130,     // Scaling tasks get +130
          automation: 100,  // Automation gets +100
          maintenance: 80   // Maintenance gets +80
        },
        keywords: {
          deployment: ['deploy', 'deployment', 'release', 'ci/cd'],
          monitoring: ['monitoring', 'logging', 'metrics', 'alerts'],
          security: ['security', 'firewall', 'ssl', 'certificate'],
          backup: ['backup', 'restore', 'recovery'],
          scaling: ['scaling', 'load balancing', 'capacity'],
          automation: ['automation', 'script', 'pipeline'],
          maintenance: ['maintenance', 'update', 'patch']
        }
      },

      // Research templates
      research: {
        name: 'Research & Investigation',
        basePriority: 400,
        description: 'Research and investigation tasks',
        modifiers: {
          spike: 100,       // Spike tasks get +100
          poc: 120,         // Proof of concept gets +120
          analysis: 80,     // Analysis gets +80
          investigation: 90, // Investigation gets +90
          feasibility: 110, // Feasibility studies get +110
          comparison: 70    // Comparisons get +70
        },
        keywords: {
          spike: ['spike', 'research spike'],
          poc: ['poc', 'proof of concept', 'prototype'],
          analysis: ['analysis', 'analyze', 'study'],
          investigation: ['investigate', 'investigation', 'debug'],
          feasibility: ['feasibility', 'viable', 'possible'],
          comparison: ['compare', 'comparison', 'evaluate']
        }
      }
    };

    // Custom templates (can be added by users)
    this.customTemplates = {};
  }

  /**
   * Get all available templates
   * @returns {Object} All templates
   */
  getAllTemplates() {
    return { ...this.templates, ...this.customTemplates };
  }

  /**
   * Get a specific template by name
   * @param {string} templateName - Name of the template
   * @returns {Object|null} Template object or null if not found
   */
  getTemplate(templateName) {
    return this.templates[templateName] || this.customTemplates[templateName] || null;
  }

  /**
   * Calculate priority for a task using templates
   * @param {string} templateName - Template to use
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @param {Array} tags - Optional tags
   * @returns {Object} Priority calculation result
   */
  calculatePriority(templateName, title = '', description = '', tags = []) {
    const template = this.getTemplate(templateName);
    if (!template) {
      return {
        success: false,
        message: `Template '${templateName}' not found`
      };
    }

    let priority = template.basePriority;
    const appliedModifiers = [];
    const text = `${title} ${description}`.toLowerCase();

    // Check for keyword matches and apply modifiers
    for (const [modifierName, keywords] of Object.entries(template.keywords)) {
      const hasKeyword = keywords.some(keyword => text.includes(keyword.toLowerCase()));
      const hasTag = tags.some(tag => tag.toLowerCase() === modifierName);

      if (hasKeyword || hasTag) {
        const modifier = template.modifiers[modifierName];
        priority += modifier;
        appliedModifiers.push({
          name: modifierName,
          value: modifier,
          reason: hasTag ? 'tag match' : 'keyword match'
        });
      }
    }

    // Ensure priority stays within bounds
    priority = Math.max(1, Math.min(1000, priority));

    return {
      success: true,
      priority,
      basePriority: template.basePriority,
      appliedModifiers,
      template: template.name
    };
  }

  /**
   * Suggest template based on task content
   * @param {string} title - Task title
   * @param {string} description - Task description
   * @returns {Object} Suggestion result
   */
  suggestTemplate(title = '', description = '') {
    const text = `${title} ${description}`.toLowerCase();
    const suggestions = [];

    for (const [templateName, template] of Object.entries(this.templates)) {
      let score = 0;
      const matchedKeywords = [];

      // Calculate score based on keyword matches
      for (const [modifierName, keywords] of Object.entries(template.keywords)) {
        for (const keyword of keywords) {
          if (text.includes(keyword.toLowerCase())) {
            score += 1;
            matchedKeywords.push(keyword);
          }
        }
      }

      if (score > 0) {
        suggestions.push({
          template: templateName,
          name: template.name,
          score,
          matchedKeywords,
          basePriority: template.basePriority
        });
      }
    }

    // Sort by score (highest first)
    suggestions.sort((a, b) => b.score - a.score);

    return {
      success: true,
      suggestions: suggestions.slice(0, 3), // Return top 3 suggestions
      bestMatch: suggestions[0] || null
    };
  }

  /**
   * Add a custom template
   * @param {string} name - Template name
   * @param {Object} template - Template configuration
   * @returns {Object} Result
   */
  addCustomTemplate(name, template) {
    try {
      // Validate template structure
      if (!template.basePriority || !template.modifiers || !template.keywords) {
        return {
          success: false,
          message: 'Template must have basePriority, modifiers, and keywords'
        };
      }

      this.customTemplates[name] = {
        name: template.name || name,
        basePriority: template.basePriority,
        description: template.description || '',
        modifiers: template.modifiers,
        keywords: template.keywords,
        custom: true
      };

      return {
        success: true,
        message: `Custom template '${name}' added successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error adding custom template: ${error.message}`
      };
    }
  }

  /**
   * Remove a custom template
   * @param {string} name - Template name
   * @returns {Object} Result
   */
  removeCustomTemplate(name) {
    if (this.customTemplates[name]) {
      delete this.customTemplates[name];
      return {
        success: true,
        message: `Custom template '${name}' removed successfully`
      };
    } else {
      return {
        success: false,
        message: `Custom template '${name}' not found`
      };
    }
  }
}

// Export singleton instance
module.exports = new PriorityTemplates();
