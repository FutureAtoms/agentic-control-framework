# 🎯 Numerical Priority System Documentation

**Author:** Abhilash Chadhar (FutureAtoms)
**Last Updated:** January 2025

## Overview

The Agentic Control Framework (ACF) features a sophisticated numerical priority system that replaces the traditional 4-level string priorities (low/medium/high/critical) with a flexible 1-1000 numerical scale. This system provides fine-grained priority control, automatic dependency management, and intelligent priority recalculation.

## 📊 Priority Scale (1-1000)

### Priority Ranges
- **🟢 Low (1-399)**: Routine tasks, documentation, minor improvements
- **🟡 Medium (400-699)**: Standard features, moderate bugs, regular development
- **🔴 High (700-899)**: Important features, significant bugs, urgent tasks
- **🚨 Critical (900-1000)**: Blocking issues, security fixes, production emergencies

### Priority Categories
The system automatically maps string priorities to numeric ranges for backward compatibility:
- `low` → 300
- `medium` → 500
- `high` → 700
- `critical` → 900

## 🔧 Core Features

### 1. Automatic Priority Uniqueness
Every task automatically receives a unique priority value to ensure proper ordering:
```bash
# Even if you try to set the same priority, the system adjusts automatically
./bin/acf add "Task A" --priority 500
./bin/acf add "Task B" --priority 500  # Becomes 501 automatically
```

### 2. Dependency-Based Priority Inheritance
Tasks with dependents automatically receive priority boosts:
- **Blocking Boost**: +100 points for each task blocked
- **Cascade Effect**: Priority increases propagate through dependency chains
- **Critical Path Analysis**: Identifies and prioritizes bottleneck tasks

### 3. Intelligent Priority Recalculation
The system continuously optimizes priorities based on:
- Task dependencies and blocking relationships
- Time-based decay (configurable)
- Distribution optimization
- Workload balancing

## 🚀 Usage Examples

### Basic Priority Assignment
```bash
# Using numeric priorities (1-1000)
./bin/acf add "Fix critical bug" --priority 950
./bin/acf add "Update documentation" --priority 200
./bin/acf add "Implement feature X" --priority 650

# Using string priorities (backward compatible)
./bin/acf add "Low priority task" --priority low
./bin/acf add "High priority task" --priority high
```

### Priority Manipulation Commands
```bash
# Increase priority by amount
./bin/acf bump 123 --amount 100

# Decrease priority by amount  
./bin/acf defer 123 --amount 50

# Set to high priority range
./bin/acf prioritize 123

# Set to low priority range
./bin/acf deprioritize 123

# Update priority directly
./bin/acf update 123 --priority 750
```

### Priority Analysis
```bash
# View priority statistics
./bin/acf priority-stats

# Analyze dependencies and critical paths
./bin/acf dependency-analysis

# Trigger manual recalculation
./bin/acf recalculate-priorities
```

## 📈 Advanced Features

### Priority Distribution Optimization
The system automatically balances priority distribution to:
- Prevent priority clustering
- Maintain meaningful priority differences
- Optimize task ordering for maximum efficiency

### Time-Based Priority Decay
Optional feature that gradually increases priority over time:
```javascript
// Configuration in .acf/config.json
{
  "priorityEngine": {
    "enableTimeDecay": true,
    "decayRate": 0.1,  // Points per day
    "maxDecayBoost": 100
  }
}
```

### Dependency Management
Advanced dependency features include:
- **Circular Dependency Detection**: Prevents infinite loops
- **Critical Path Analysis**: Identifies longest dependency chains
- **Blocking Task Detection**: Highlights tasks preventing others
- **Priority Inheritance**: Automatic priority boosts for blocking tasks

## 🔍 Priority Display Formats

### CLI Table Format
```
┌─────┬────────────────────┬──────────┐
│ ID  │ Title              │ Priority │
├─────┼────────────────────┼──────────┤
│ 24  │ Critical Bug Fix   │ 950      │
│ 25  │ Feature Request    │ 650      │
│ 26  │ Documentation      │ 200      │
└─────┴────────────────────┴──────────┘
```

### Human-Readable Format
Shows priority distribution and visual indicators:
```
📊 Priority Distribution:
🚨 Critical (900+): 2 | 🔴 High (700-899): 5 | 🟡 Medium (500-699): 8 | 🟢 Low (<500): 3

┌─────┬────────┬──────────┬────────────────────┐
│ ID  │ Status │ Priority │ Title              │
├─────┼────────┼──────────┼────────────────────┤
│ 24  │ ✅     │ 950      │ Critical Bug Fix   │
│ 25  │ 🔄     │ 650      │ Feature Request    │
└─────┴────────┴──────────┴────────────────────┘
```

### Markdown Format
Enhanced badges with progress indicators:
```markdown
| ID | Status | Priority | Title |
|----|--------|----------|-------|
| #24 | ✅ done | 950 | **Critical Bug Fix** |
| #25 | 🔄 inprogress | 650 | **Feature Request** |
```

## 🛠️ Configuration

### Priority Engine Settings
Configure priority behavior in `.acf/config.json`:
```json
{
  "priorityEngine": {
    "enableDependencyBoosts": true,
    "enableTimeDecay": false,
    "enableDistributionOptimization": true,
    "dependencyBoostMultiplier": 1.0,
    "blockingTaskBonus": 100,
    "cascadeEffectStrength": 0.5,
    "uniquenessEnforcement": true,
    "recalculationTriggers": ["taskAdd", "taskUpdate", "statusChange"]
  }
}
```

### Recalculation Options
```bash
# Manual recalculation with options
./bin/acf recalculate-priorities \
  --apply-dependency-boosts \
  --apply-time-decay \
  --optimize-distribution \
  --enforce-uniqueness
```

## 🔄 Migration from String Priorities

The system provides seamless backward compatibility:

1. **Existing string priorities** are automatically converted to numeric values
2. **Mixed usage** is supported - you can use both string and numeric priorities
3. **Display preferences** can be configured to show either format
4. **No data loss** - original priority intentions are preserved

### Migration Commands
```bash
# Check current priority distribution
./bin/acf priority-stats

# Convert all string priorities to numeric (optional)
./bin/acf recalculate-priorities --normalize-all

# Verify migration results
./bin/acf list --format table
```

## 📊 Performance and Scalability

### Performance Metrics
- **Task Creation**: ~300 tasks/second
- **Priority Recalculation**: <10ms for 100+ tasks
- **Dependency Analysis**: <50ms for complex graphs
- **Memory Usage**: Minimal overhead (~1MB for 1000 tasks)

### Scalability Features
- **Efficient Algorithms**: O(n log n) complexity for most operations
- **Incremental Updates**: Only affected tasks are recalculated
- **Caching**: Priority calculations are cached and invalidated intelligently
- **Batch Operations**: Multiple priority updates processed efficiently

## 🧪 Testing and Validation

The priority system includes comprehensive testing:
- **Unit Tests**: Core priority functions and algorithms
- **Integration Tests**: CLI commands and MCP tools
- **Performance Tests**: Scalability with large task sets
- **Dependency Tests**: Complex dependency scenarios
- **Edge Case Tests**: Boundary conditions and error handling

Run the test suite:
```bash
node test/unit/test-priority-system.js
```

## 🔗 API Reference

### Core Functions
- `normalizePriority(priority)` - Convert string/numeric priority to number
- `getDisplayPriority(priority)` - Get display format for priority
- `getPriorityString(priority)` - Convert numeric priority to category
- `ensureUniquePriority(tasks, priority)` - Ensure priority uniqueness
- `recalculatePriorities(options)` - Trigger priority recalculation

### CLI Commands
- `add --priority <value>` - Create task with priority
- `update --priority <value>` - Update task priority
- `bump --amount <value>` - Increase priority
- `defer --amount <value>` - Decrease priority
- `prioritize` - Set to high priority
- `deprioritize` - Set to low priority
- `priority-stats` - Show priority statistics
- `dependency-analysis` - Analyze dependencies

### MCP Tools
- `recalculatePriorities` - Trigger recalculation
- `getPriorityStatistics` - Get priority stats
- `getDependencyAnalysis` - Get dependency analysis
- `bumpTaskPriority` - Increase task priority
- `deferTaskPriority` - Decrease task priority
- `prioritizeTask` - Set high priority
- `deprioritizeTask` - Set low priority

## 🎯 Best Practices

### Priority Assignment Guidelines
1. **Reserve 900+** for true emergencies and blocking issues
2. **Use 700-899** for important features and significant bugs
3. **Use 400-699** for standard development work
4. **Use 1-399** for documentation, cleanup, and nice-to-have features

### Dependency Management
1. **Minimize dependencies** to reduce complexity
2. **Use clear dependency chains** rather than complex graphs
3. **Regularly review** blocking tasks and critical paths
4. **Break down large tasks** to reduce dependency bottlenecks

### Performance Optimization
1. **Use batch operations** for multiple priority updates
2. **Enable caching** for frequently accessed priority data
3. **Monitor recalculation frequency** and adjust triggers
4. **Regular cleanup** of completed tasks to maintain performance

## 📚 Examples and Use Cases

### Software Development Team
```bash
# Sprint planning with precise priorities
./bin/acf add "Security audit" --priority 950
./bin/acf add "User authentication" --priority 800
./bin/acf add "Database optimization" --priority 750
./bin/acf add "UI improvements" --priority 400
./bin/acf add "Code documentation" --priority 200

# Create dependencies
./bin/acf update 2 --depends-on 1  # Auth depends on security audit
./bin/acf update 3 --depends-on 2  # DB optimization depends on auth

# System automatically boosts priorities based on dependencies
./bin/acf dependency-analysis
```

### Bug Triage Workflow
```bash
# Precise bug prioritization
./bin/acf add "Data corruption bug" --priority 990
./bin/acf add "Performance regression" --priority 850
./bin/acf add "UI alignment issue" --priority 300
./bin/acf add "Typo in error message" --priority 100

# Adjust priorities based on impact
./bin/acf bump 3 --amount 150  # UI issue affects many users
./bin/acf defer 4 --amount 50  # Typo is very minor
```

### Release Management
```bash
# Release preparation with automatic priority management
./bin/acf add "Code freeze" --priority 900
./bin/acf add "Final testing" --priority 850 --depends-on 1
./bin/acf add "Documentation update" --priority 700 --depends-on 2
./bin/acf add "Release deployment" --priority 950 --depends-on 3

# System automatically optimizes the release pipeline priorities
./bin/acf recalculate-priorities --apply-dependency-boosts
```

## 🔧 Integration Examples

### CI/CD Pipeline Integration
```bash
#!/bin/bash
# In your CI/CD pipeline

# Create deployment task with high priority
TASK_ID=$(./bin/acf add "Deploy v$VERSION" --priority 900 --format json | jq -r '.taskId')

# Update priority based on branch
if [[ "$BRANCH" == "main" ]]; then
  ./bin/acf bump $TASK_ID --amount 50  # Production deployment
elif [[ "$BRANCH" == "staging" ]]; then
  ./bin/acf defer $TASK_ID --amount 100  # Staging deployment
fi

# Mark as complete after successful deployment
./bin/acf status $TASK_ID done --message "Deployed successfully to $ENVIRONMENT"
```

### Automated Priority Adjustment
```bash
#!/bin/bash
# Daily priority maintenance script

echo "🔄 Running daily priority maintenance..."

# Recalculate priorities with all optimizations
./bin/acf recalculate-priorities \
  --apply-dependency-boosts \
  --optimize-distribution \
  --enforce-uniqueness

# Show priority statistics
./bin/acf priority-stats

# Identify high-priority tasks without progress
./bin/acf list --status todo --priority-min 800 --format table

echo "✅ Priority maintenance complete"
```

### Team Standup Automation
```bash
#!/bin/bash
# Generate standup report with priority insights

echo "📊 Daily Standup Report - $(date)"
echo "=================================="

echo ""
echo "🔥 Critical Tasks (900+):"
./bin/acf list --priority-min 900 --status todo,inprogress --format table

echo ""
echo "⚡ High Priority In Progress:"
./bin/acf list --priority-min 700 --status inprogress --format table

echo ""
echo "📈 Priority Distribution:"
./bin/acf priority-stats

echo ""
echo "🔗 Dependency Analysis:"
./bin/acf dependency-analysis
```

---

For more information, see:
- [Migration Guide](migration-guide.md)
- [Complete Tutorial](COMPLETE_TUTORIAL.md)
- [MCP Integration Guide](MCP_INTEGRATION_GUIDE.md)
- [API Reference](../README.md#core-acf-tools)
