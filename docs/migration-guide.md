# 🔄 Migration Guide: String to Numerical Priority System

## Overview

This guide helps you migrate from the legacy 4-level string priority system (low/medium/high/critical) to the new numerical priority system (1-1000). The migration is **completely backward compatible** - no existing data will be lost.

## 🚀 Quick Start Migration

### Step 1: Check Current System
```bash
# View current priority distribution
./bin/task-manager priority-stats

# List all tasks to see current priorities
./bin/task-manager list --format table
```

### Step 2: Understand the Mapping
Your existing string priorities are automatically mapped:
- `low` → 300 (🟢 Low range: 1-399)
- `medium` → 500 (🟡 Medium range: 400-699)  
- `high` → 700 (🔴 High range: 700-899)
- `critical` → 900 (🚨 Critical range: 900-1000)

### Step 3: Start Using Numerical Priorities
```bash
# You can now use specific numeric values
./bin/task-manager add "Urgent bug fix" --priority 950
./bin/task-manager add "Minor improvement" --priority 150
./bin/task-manager add "Important feature" --priority 750

# String priorities still work
./bin/task-manager add "Regular task" --priority medium
```

## 📊 Before and After Comparison

### Legacy String System
```bash
# Limited to 4 levels
./bin/task-manager add "Task A" --priority low
./bin/task-manager add "Task B" --priority medium  
./bin/task-manager add "Task C" --priority high
./bin/task-manager add "Task D" --priority critical

# No fine-grained control
# No automatic dependency management
# Manual priority conflicts
```

### New Numerical System
```bash
# Fine-grained control with 1000 levels
./bin/task-manager add "Task A" --priority 200
./bin/task-manager add "Task B" --priority 550
./bin/task-manager add "Task C" --priority 750
./bin/task-manager add "Task D" --priority 950

# Automatic uniqueness enforcement
# Dependency-based priority boosts
# Intelligent recalculation
```

## 🔧 Migration Strategies

### Strategy 1: Gradual Migration (Recommended)
Keep using string priorities for existing workflows while gradually adopting numerical priorities for new tasks:

```bash
# Continue using string priorities
./bin/task-manager add "Legacy task" --priority high

# Start using numerical priorities for new tasks
./bin/task-manager add "New task" --priority 725

# Both approaches work together seamlessly
```

### Strategy 2: Immediate Full Migration
Convert all existing priorities to numerical values:

```bash
# Trigger full recalculation and normalization
./bin/task-manager recalculate-priorities --normalize-all

# Verify results
./bin/task-manager list --format table
```

### Strategy 3: Hybrid Approach
Use string priorities for quick categorization and numerical priorities for fine-tuning:

```bash
# Quick categorization with strings
./bin/task-manager add "Bug fix" --priority high

# Fine-tune with numerical adjustment
./bin/task-manager update 123 --priority 785
```

## 🎯 Priority Mapping Examples

### Development Tasks
```bash
# Legacy approach
./bin/task-manager add "Critical security fix" --priority critical
./bin/task-manager add "Important feature" --priority high
./bin/task-manager add "Code cleanup" --priority low

# New numerical approach
./bin/task-manager add "Critical security fix" --priority 980
./bin/task-manager add "Important feature" --priority 750
./bin/task-manager add "Code cleanup" --priority 150
./bin/task-manager add "Urgent hotfix" --priority 920
./bin/task-manager add "Nice-to-have feature" --priority 400
./bin/task-manager add "Documentation update" --priority 250
```

### Bug Tracking
```bash
# Legacy: Limited granularity
./bin/task-manager add "Production bug" --priority critical
./bin/task-manager add "UI bug" --priority medium

# New: Precise prioritization
./bin/task-manager add "Data loss bug" --priority 990
./bin/task-manager add "Performance issue" --priority 850
./bin/task-manager add "UI alignment bug" --priority 450
./bin/task-manager add "Typo in tooltip" --priority 100
```

## 🔄 Workflow Changes

### Task Creation Workflow

**Before:**
```bash
# Limited options
./bin/task-manager add "Task" --priority [low|medium|high|critical]
```

**After:**
```bash
# Multiple options available
./bin/task-manager add "Task" --priority 750           # Specific numeric
./bin/task-manager add "Task" --priority high          # String (still works)
./bin/task-manager add "Task"                          # Auto-assigned priority
```

### Priority Adjustment Workflow

**Before:**
```bash
# Manual priority changes only
./bin/task-manager update 123 --priority high
```

**After:**
```bash
# Multiple adjustment methods
./bin/task-manager update 123 --priority 750          # Direct update
./bin/task-manager bump 123 --amount 100              # Relative increase
./bin/task-manager defer 123 --amount 50              # Relative decrease
./bin/task-manager prioritize 123                     # Quick high priority
./bin/task-manager deprioritize 123                   # Quick low priority
```

## 📈 Advanced Migration Features

### Dependency-Aware Migration
The new system automatically adjusts priorities based on dependencies:

```bash
# Create tasks with dependencies
./bin/task-manager add "Foundation task" --priority 500
./bin/task-manager add "Dependent task" --priority 400 --depends-on 1

# System automatically boosts foundation task priority
./bin/task-manager priority-stats  # Shows automatic adjustments
```

### Batch Migration Operations
```bash
# Recalculate all priorities with dependency boosts
./bin/task-manager recalculate-priorities --apply-dependency-boosts

# Optimize priority distribution
./bin/task-manager recalculate-priorities --optimize-distribution

# Ensure all priorities are unique
./bin/task-manager recalculate-priorities --enforce-uniqueness
```

## 🛠️ Configuration Migration

### Update Configuration Files
If you have custom configurations, update them to use numerical priorities:

**Before (.acf/config.json):**
```json
{
  "defaultPriority": "medium",
  "priorityLevels": ["low", "medium", "high", "critical"]
}
```

**After (.acf/config.json):**
```json
{
  "defaultPriority": 500,
  "priorityRange": [1, 1000],
  "priorityEngine": {
    "enableDependencyBoosts": true,
    "enableTimeDecay": false,
    "enableDistributionOptimization": true
  }
}
```

### Update Scripts and Automation
Update any scripts that use the old priority system:

**Before:**
```bash
#!/bin/bash
./bin/task-manager add "Daily backup" --priority low
./bin/task-manager add "Security scan" --priority high
```

**After:**
```bash
#!/bin/bash
./bin/task-manager add "Daily backup" --priority 200
./bin/task-manager add "Security scan" --priority 800
# Or keep using strings - both work!
./bin/task-manager add "Daily backup" --priority low
./bin/task-manager add "Security scan" --priority high
```

## 🔍 Validation and Testing

### Verify Migration Success
```bash
# Check priority distribution
./bin/task-manager priority-stats

# Verify no duplicate priorities
./bin/task-manager dependency-analysis

# Test priority manipulation
./bin/task-manager bump 1 --amount 50
./bin/task-manager defer 2 --amount 25
```

### Common Migration Issues

#### Issue 1: Priority Conflicts
**Problem:** Multiple tasks with same priority
**Solution:** 
```bash
./bin/task-manager recalculate-priorities --enforce-uniqueness
```

#### Issue 2: Unexpected Priority Changes
**Problem:** Priorities changed after migration
**Solution:** This is normal - the system optimizes priorities based on dependencies
```bash
./bin/task-manager dependency-analysis  # See why priorities changed
```

#### Issue 3: Performance Issues
**Problem:** Slow priority operations
**Solution:**
```bash
# Optimize priority distribution
./bin/task-manager recalculate-priorities --optimize-distribution
```

## 📚 Learning Resources

### Practice Exercises
1. **Basic Migration**: Convert 10 string priorities to numerical
2. **Dependency Practice**: Create tasks with dependencies and observe priority boosts
3. **Advanced Usage**: Use priority manipulation commands
4. **Performance Testing**: Create 100+ tasks and test recalculation speed

### Example Scenarios

#### Scenario 1: Software Development Team
```bash
# Sprint planning with numerical priorities
./bin/task-manager add "User authentication" --priority 800
./bin/task-manager add "Database optimization" --priority 750
./bin/task-manager add "UI polish" --priority 400
./bin/task-manager add "Documentation" --priority 200
```

#### Scenario 2: Bug Triage
```bash
# Precise bug prioritization
./bin/task-manager add "Security vulnerability" --priority 990
./bin/task-manager add "Data corruption bug" --priority 950
./bin/task-manager add "Performance regression" --priority 800
./bin/task-manager add "UI glitch" --priority 300
```

## 🎯 Best Practices for Migration

### Do's ✅
- **Start gradually** - migrate new tasks first
- **Use dependency features** - let the system optimize priorities
- **Monitor priority distribution** - use `priority-stats` regularly
- **Test thoroughly** - verify migration with small batches first
- **Keep backups** - backup `.acf/tasks.json` before major changes

### Don'ts ❌
- **Don't force immediate full migration** - gradual is safer
- **Don't ignore dependency warnings** - circular dependencies can cause issues
- **Don't manually set all priorities to extremes** - use the full range
- **Don't disable uniqueness enforcement** - it prevents conflicts
- **Don't skip testing** - validate migration results

## 🆘 Troubleshooting

### Common Commands for Issues
```bash
# Reset all priorities to defaults
./bin/task-manager recalculate-priorities --reset-all

# Fix circular dependencies
./bin/task-manager dependency-analysis  # Identify issues
./bin/task-manager update <task-id> --depends-on ""  # Remove problematic dependencies

# Performance issues
./bin/task-manager recalculate-priorities --optimize-distribution

# Backup and restore
cp .acf/tasks.json .acf/tasks.json.backup  # Backup
cp .acf/tasks.json.backup .acf/tasks.json  # Restore
```

### Getting Help
- Check the [Priority System Documentation](priority-system.md)
- Run `./bin/task-manager --help` for command reference
- Use `./bin/task-manager <command> --help` for specific command help
- Review the [Complete Tutorial](COMPLETE_TUTORIAL.md)

---

**Migration Complete!** 🎉

You're now ready to take advantage of the powerful numerical priority system. The migration preserves all your existing data while unlocking advanced features like dependency management, automatic priority optimization, and fine-grained priority control.
