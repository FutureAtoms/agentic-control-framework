#!/bin/bash

# CLI Testing Script for Task Manager
echo "==========================================="
echo "Starting Task Manager CLI Testing"
echo "==========================================="

# Create test directory
TEST_DIR="cli_test_$(date +%s)"
mkdir -p $TEST_DIR
cd $TEST_DIR

echo "Test directory: $(pwd)"

# Function to check command success
check_success() {
  if [ $? -eq 0 ]; then
    echo "✅ PASS: $1"
  else
    echo "❌ FAIL: $1"
    FAILED_TESTS+=("$1")
  fi
}

FAILED_TESTS=()

# Initialize project
echo -e "\n--- Testing: Initialize Project ---"
node ../bin/task-manager init --projectName "Test Project" --projectDescription "CLI Test Project"
check_success "Initialize project"

# List tasks (should show initial task)
echo -e "\n--- Testing: List Tasks ---"
node ../bin/task-manager list
check_success "List tasks"

# Add tasks
echo -e "\n--- Testing: Add Tasks ---"
node ../bin/task-manager add --title "Task 1" --description "First test task" --priority "high"
check_success "Add task 1"

node ../bin/task-manager add --title "Task 2" --description "Second test task" --priority "medium" --dependsOn "1"
check_success "Add task 2"

node ../bin/task-manager add --title "Task 3" --description "Third test task" --priority "low"
check_success "Add task 3"

# List tasks with different format options
echo -e "\n--- Testing: List Tasks with Format Options ---"
node ../bin/task-manager list --format table
check_success "List tasks (table format)"

node ../bin/task-manager list --format json
check_success "List tasks (json format)"

# Add subtasks
echo -e "\n--- Testing: Add Subtasks ---"
node ../bin/task-manager subtask --parentId 1 --title "Subtask 1.1"
check_success "Add subtask 1.1"

node ../bin/task-manager subtask --parentId 1 --title "Subtask 1.2"
check_success "Add subtask 1.2"

# Update task status
echo -e "\n--- Testing: Update Task Status ---"
node ../bin/task-manager status --id "1.1" --newStatus "inprogress" --message "Started working on subtask"
check_success "Update subtask status to in-progress"

node ../bin/task-manager status --id "1.1" --newStatus "done" --message "Completed subtask"
check_success "Update subtask status to done"

# Get next task
echo -e "\n--- Testing: Get Next Task ---"
node ../bin/task-manager next
check_success "Get next task"

# Update task details
echo -e "\n--- Testing: Update Task Details ---"
node ../bin/task-manager update --id "3" --title "Updated Task 3" --description "Updated description" --priority "high"
check_success "Update task details"

# Get task context
echo -e "\n--- Testing: Get Task Context ---"
node ../bin/task-manager context --id "1"
check_success "Get task context"

# Generate task files
echo -e "\n--- Testing: Generate Task Files ---"
node ../bin/task-manager generate-files
check_success "Generate task files"

# Generate task table
echo -e "\n--- Testing: Generate Task Table ---"
node ../bin/task-manager generate-table
check_success "Generate task table"

# Remove a task
echo -e "\n--- Testing: Remove Task ---"
node ../bin/task-manager remove --id "3"
check_success "Remove task"

# Verify task removal
echo -e "\n--- Verifying Task Removal ---"
node ../bin/task-manager list
check_success "List tasks after removal"

# Testing error handling
echo -e "\n--- Testing: Error Handling ---"
node ../bin/task-manager status --id "999" --newStatus "done" || true
check_success "Handle non-existent task ID"

# Print summary
echo -e "\n==========================================="
echo "CLI Testing Summary"
echo "==========================================="

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo "All tests passed successfully! ✅"
else
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "- $test"
  done
  echo "Total: ${#FAILED_TESTS[@]} failed tests"
fi

echo -e "\n--- Cleaning up ---"
cd ..
echo "Test results remain in: $TEST_DIR" 