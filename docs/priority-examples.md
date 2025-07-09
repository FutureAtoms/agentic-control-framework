# 🎯 Priority System Usage Examples

This document provides comprehensive examples of using the ACF numerical priority system in real-world scenarios.

## 🚀 Quick Start Examples

### Basic Priority Assignment
```bash
# Create tasks with specific numerical priorities
./bin/task-manager add "Critical security patch" --priority 980
./bin/task-manager add "Feature implementation" --priority 650
./bin/task-manager add "Code cleanup" --priority 200

# Use string priorities (automatically converted)
./bin/task-manager add "Bug fix" --priority high        # Becomes 700
./bin/task-manager add "Documentation" --priority low   # Becomes 300
```

### Priority Manipulation
```bash
# Increase priority by 100 points
./bin/task-manager bump 123 --amount 100

# Decrease priority by 50 points
./bin/task-manager defer 456 --amount 50

# Set to high priority range (700-899)
./bin/task-manager prioritize 789

# Set to low priority range (1-399)
./bin/task-manager deprioritize 321
```

## 📊 Analysis and Statistics

### Priority Distribution Analysis
```bash
# View comprehensive priority statistics
./bin/task-manager priority-stats

# Example output:
# 📊 Priority Statistics:
# Total tasks: 25
# Priority range: 150 - 980
# Average priority: 542
# Utilization: 82.3%
# 
# Distribution:
#   🔥 Critical (800+): 3
#   🔴 High (600-799): 8
#   🟡 Medium (400-599): 10
#   🟢 Low (<400): 4
```

### Dependency Analysis
```bash
# Analyze task dependencies and critical paths
./bin/task-manager dependency-analysis

# Example output:
# 🔗 Dependency Analysis:
# Total tasks: 25
# Tasks with dependencies: 15
# Root tasks (no dependencies): 5
# Leaf tasks (no dependents): 8
# Critical paths: 12
# Longest dependency chain: 4 tasks
# 
# 🚧 Blocking Tasks:
#   Task 24: "Core system" (blocking 5 tasks)
#   Task 25: "API layer" (blocking 3 tasks)
```

## 🏗️ Development Workflow Examples

### Sprint Planning
```bash
#!/bin/bash
# Sprint planning script with priority-based task assignment

echo "🎯 Sprint Planning - Priority-Based Task Assignment"
echo "=================================================="

# Create epic tasks with high priorities
./bin/task-manager add "User Authentication System" --priority 850
./bin/task-manager add "Payment Integration" --priority 800
./bin/task-manager add "Admin Dashboard" --priority 750

# Create supporting tasks with medium priorities
./bin/task-manager add "Unit Tests for Auth" --priority 600 --depends-on 1
./bin/task-manager add "Payment UI Components" --priority 550 --depends-on 2
./bin/task-manager add "Admin User Management" --priority 500 --depends-on 3

# Create documentation tasks with lower priorities
./bin/task-manager add "API Documentation" --priority 300
./bin/task-manager add "User Guide Updates" --priority 250

# Let the system optimize priorities based on dependencies
./bin/task-manager recalculate-priorities --apply-dependency-boosts

echo "✅ Sprint tasks created and prioritized"
./bin/task-manager priority-stats
```

### Bug Triage Workflow
```bash
#!/bin/bash
# Bug triage with precise priority assignment

echo "🐛 Bug Triage - Priority Assignment"
echo "=================================="

# Critical bugs (900-1000)
./bin/task-manager add "Data loss in user profiles" --priority 990
./bin/task-manager add "Security vulnerability in auth" --priority 980
./bin/task-manager add "Payment processing failure" --priority 970

# High priority bugs (700-899)
./bin/task-manager add "Performance regression in search" --priority 850
./bin/task-manager add "Mobile app crashes on iOS" --priority 800
./bin/task-manager add "Email notifications not sending" --priority 750

# Medium priority bugs (400-699)
./bin/task-manager add "UI alignment issues" --priority 500
./bin/task-manager add "Inconsistent error messages" --priority 450

# Low priority bugs (1-399)
./bin/task-manager add "Typo in footer text" --priority 150
./bin/task-manager add "Minor color inconsistency" --priority 100

echo "✅ Bugs triaged and prioritized"
./bin/task-manager list --priority-min 700 --format table
```

### Release Management
```bash
#!/bin/bash
# Release preparation with dependency-aware priorities

echo "🚀 Release v2.1.0 - Task Preparation"
echo "===================================="

# Create release milestone tasks
./bin/task-manager add "Code freeze for v2.1.0" --priority 950
./bin/task-manager add "Final QA testing" --priority 900 --depends-on 1
./bin/task-manager add "Documentation review" --priority 850 --depends-on 2
./bin/task-manager add "Release notes preparation" --priority 800 --depends-on 3
./bin/task-manager add "Production deployment" --priority 980 --depends-on 4

# Create pre-release tasks
./bin/task-manager add "Feature flag cleanup" --priority 700
./bin/task-manager add "Performance optimization" --priority 650
./bin/task-manager add "Security audit" --priority 750

# System automatically adjusts priorities based on dependencies
./bin/task-manager recalculate-priorities --apply-dependency-boosts

echo "✅ Release tasks created with optimized priorities"
./bin/task-manager dependency-analysis
```

## 🔄 Automated Priority Management

### Daily Priority Maintenance
```bash
#!/bin/bash
# Daily automated priority maintenance script

echo "🔄 Daily Priority Maintenance - $(date)"
echo "======================================="

# Recalculate priorities with all optimizations
./bin/task-manager recalculate-priorities \
  --apply-dependency-boosts \
  --optimize-distribution \
  --enforce-uniqueness

# Show current priority distribution
echo ""
echo "📊 Current Priority Distribution:"
./bin/task-manager priority-stats

# Identify stale high-priority tasks
echo ""
echo "⚠️  High-Priority Tasks Without Recent Activity:"
./bin/task-manager list --priority-min 800 --status todo --format table

# Show blocking tasks that need attention
echo ""
echo "🚧 Tasks Blocking Others:"
./bin/task-manager dependency-analysis | grep -A 10 "Blocking Tasks"

echo ""
echo "✅ Daily maintenance complete"
```

### CI/CD Integration
```bash
#!/bin/bash
# CI/CD pipeline with dynamic priority assignment

BRANCH=${GITHUB_REF##*/}
VERSION=${GITHUB_SHA:0:7}

echo "🔄 CI/CD Pipeline - Branch: $BRANCH, Version: $VERSION"
echo "===================================================="

# Create deployment task with branch-specific priority
if [[ "$BRANCH" == "main" ]]; then
  PRIORITY=950  # Production deployment
  DESCRIPTION="Production deployment for $VERSION"
elif [[ "$BRANCH" == "staging" ]]; then
  PRIORITY=800  # Staging deployment
  DESCRIPTION="Staging deployment for $VERSION"
else
  PRIORITY=600  # Feature branch deployment
  DESCRIPTION="Feature deployment for $VERSION"
fi

# Create deployment task
TASK_ID=$(./bin/task-manager add "$DESCRIPTION" --priority $PRIORITY --format json | jq -r '.taskId')

echo "📝 Created deployment task #$TASK_ID with priority $PRIORITY"

# Update priority based on test results
if [[ "$TEST_RESULTS" == "failed" ]]; then
  ./bin/task-manager defer $TASK_ID --amount 200
  echo "⚠️  Reduced priority due to test failures"
fi

# Mark as complete after successful deployment
if [[ "$DEPLOYMENT_STATUS" == "success" ]]; then
  ./bin/task-manager status $TASK_ID done --message "Deployed successfully to $ENVIRONMENT"
  echo "✅ Deployment task completed"
fi
```

## 📈 Advanced Priority Scenarios

### Multi-Team Coordination
```bash
#!/bin/bash
# Multi-team project with coordinated priorities

echo "👥 Multi-Team Project Coordination"
echo "=================================="

# Frontend team tasks (600-699 range)
./bin/task-manager add "React component library" --priority 680
./bin/task-manager add "Mobile responsive design" --priority 650
./bin/task-manager add "UI accessibility improvements" --priority 620

# Backend team tasks (700-799 range)
./bin/task-manager add "API rate limiting" --priority 780
./bin/task-manager add "Database optimization" --priority 750
./bin/task-manager add "Microservices refactoring" --priority 720

# DevOps team tasks (800-899 range)
./bin/task-manager add "Kubernetes migration" --priority 880
./bin/task-manager add "CI/CD pipeline optimization" --priority 850
./bin/task-manager add "Monitoring and alerting" --priority 820

# Cross-team dependencies
./bin/task-manager update 1 --depends-on 4  # Frontend depends on API
./bin/task-manager update 4 --depends-on 7  # API depends on infrastructure

# Optimize priorities across teams
./bin/task-manager recalculate-priorities --apply-dependency-boosts

echo "✅ Multi-team priorities coordinated"
./bin/task-manager dependency-analysis
```

### Emergency Response
```bash
#!/bin/bash
# Emergency response with priority escalation

echo "🚨 Emergency Response - Production Issue"
echo "========================================"

# Create emergency task with maximum priority
EMERGENCY_TASK=$(./bin/task-manager add "Production database outage" --priority 999 --format json | jq -r '.taskId')

# Create related emergency tasks
./bin/task-manager add "Investigate root cause" --priority 990 --depends-on $EMERGENCY_TASK
./bin/task-manager add "Implement hotfix" --priority 985 --depends-on $((EMERGENCY_TASK + 1))
./bin/task-manager add "Deploy emergency patch" --priority 980 --depends-on $((EMERGENCY_TASK + 2))
./bin/task-manager add "Post-mortem analysis" --priority 700 --depends-on $((EMERGENCY_TASK + 3))

# Defer all non-critical tasks
./bin/task-manager list --priority-max 800 --status todo --format json | \
  jq -r '.tasks[].id' | \
  xargs -I {} ./bin/task-manager defer {} --amount 200

echo "🚨 Emergency response tasks created and priorities adjusted"
./bin/task-manager list --priority-min 900 --format table
```

## 🎯 Best Practices Examples

### Priority Range Guidelines
```bash
# Critical Range (900-1000): Production emergencies only
./bin/task-manager add "Security breach response" --priority 999
./bin/task-manager add "Data corruption fix" --priority 990
./bin/task-manager add "Service outage resolution" --priority 980

# High Range (700-899): Important features and significant bugs
./bin/task-manager add "User authentication system" --priority 850
./bin/task-manager add "Payment processing bug" --priority 800
./bin/task-manager add "Performance optimization" --priority 750

# Medium Range (400-699): Standard development work
./bin/task-manager add "New feature implementation" --priority 600
./bin/task-manager add "Code refactoring" --priority 500
./bin/task-manager add "Unit test coverage" --priority 450

# Low Range (1-399): Documentation, cleanup, nice-to-have
./bin/task-manager add "API documentation update" --priority 300
./bin/task-manager add "Code style improvements" --priority 200
./bin/task-manager add "Dependency updates" --priority 150
```

### Dependency Management Best Practices
```bash
# Create clear dependency chains
./bin/task-manager add "Database schema design" --priority 800
./bin/task-manager add "API endpoint implementation" --priority 700 --depends-on 1
./bin/task-manager add "Frontend integration" --priority 600 --depends-on 2
./bin/task-manager add "End-to-end testing" --priority 500 --depends-on 3

# Let the system optimize the dependency chain
./bin/task-manager recalculate-priorities --apply-dependency-boosts

# Result: Database schema gets boosted to ~950 due to blocking 3 tasks
# API endpoints get boosted to ~850 due to blocking 2 tasks
# Frontend gets boosted to ~700 due to blocking 1 task
```

---

For more examples and detailed documentation:
- [Priority System Guide](priority-system.md)
- [Migration Guide](migration-guide.md)
- [Complete Tutorial](COMPLETE_TUTORIAL.md)
