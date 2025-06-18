#!/bin/bash

set -e

# --- Test Setup ---
TEST_WORKSPACE=$(mktemp -d)
ACF_ROOT=$(pwd)
TASK_MANAGER_CMD="node $ACF_ROOT/bin/task-cli.js"

# --- Helper Functions ---
assert_success() {
    if [ $? -ne 0 ]; then
        echo "Assertion failed: Command was expected to succeed."
        exit 1
    fi
}

assert_fail() {
    if [ $? -eq 0 ]; then
        echo "Assertion failed: Command was expected to fail."
        exit 1
    fi
}

assert_contains() {
    if ! echo "$1" | grep -q "$2"; then
        echo "Assertion failed: Expected output to contain '$2'."
        exit 1
    fi
}

# --- Test Cases ---
test_init() {
    echo "Testing: init"
    output=$($TASK_MANAGER_CMD init --project-name "Test Project" --project-description "A test project" --workspace "$TEST_WORKSPACE")
    assert_success
    assert_contains "$output" "Created initial tasks file"
    if [ ! -f "$TEST_WORKSPACE/tasks.json" ]; then
        echo "Assertion failed: tasks.json was not created."
        exit 1
    fi
    if [ ! -f "$TEST_WORKSPACE/tasks-table.md" ]; then
        echo "Assertion failed: tasks-table.md was not created."
        exit 1
    fi
}

test_add_and_list() {
    echo "Testing: add and list"
    $TASK_MANAGER_CMD add -t "Task 1" -p "high" --workspace "$TEST_WORKSPACE"
    assert_success
    output=$($TASK_MANAGER_CMD list --workspace "$TEST_WORKSPACE")
    assert_success
    assert_contains "$output" "Task 1"
}

# --- Run Tests ---
cd "$TEST_WORKSPACE"
test_init
test_add_and_list

# --- Cleanup ---
rm -rf "$TEST_WORKSPACE"

echo "CLI tests completed successfully." 