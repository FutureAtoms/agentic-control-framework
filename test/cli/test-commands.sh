#!/bin/bash

set -e
set -x

# --- Test Setup ---
TEST_WORKSPACE=$(mktemp -d -t acf-cli-test.XXXXXX)
ACF_ROOT=$(pwd)
TASK_MANAGER_CMD="node $ACF_ROOT/bin/task-cli.js --workspace $TEST_WORKSPACE"

# --- Helper Functions ---
assert_success() {
    if [ $? -ne 0 ]; then
        echo "Assertion failed: Command was expected to succeed but failed."
        exit 1
    fi
}

assert_fail() {
    set +e
    "$@"
    local exit_code=$?
    set -e
    if [ $exit_code -eq 0 ]; then
        echo "Assertion failed: Command was expected to fail but succeeded."
        exit 1
    fi
}

assert_contains() {
    if ! echo "$1" | grep -qF "$2"; then
        echo "Assertion failed: Expected output to contain '$2'. Actual: $1"
        exit 1
    fi
}

# --- Test Cases ---
test_init() {
    echo "Testing: init"
    output=$($TASK_MANAGER_CMD init --project-name "CLI Test Project" --project-description "A test project")
    assert_success
    assert_contains "$output" "Created initial tasks file"
}

test_add_and_list() {
    echo "Testing: add and list"
    $TASK_MANAGER_CMD add -t "Task 1: Critical" -p "critical" > /dev/null
    $TASK_MANAGER_CMD add -t "Task 2: High" -p "high" --depends-on 1 > /dev/null
    output_list=$($TASK_MANAGER_CMD list)
    assert_success
    assert_contains "$output_list" "Task 1: Critical"
    assert_contains "$output_list" "Task 2: High"
}

test_update_and_subtask() {
    echo "Testing: update and add-subtask"
    $TASK_MANAGER_CMD update 1 -t "Task 1: Updated" -p "low" > /dev/null
    $TASK_MANAGER_CMD add-subtask 1 -t "Subtask 1.1" > /dev/null
    output_list=$($TASK_MANAGER_CMD list --human)
    assert_success
    assert_contains "$output_list" "Task 1: Updated"
    assert_contains "$output_list" "low"
    assert_contains "$output_list" "Subtask 1.1"
}

test_dependency_and_workflow() {
    echo "Testing: dependency, priority, and status workflow"
    # 'next' should be Task 1, as it's the only one with no dependencies
    assert_contains "$($TASK_MANAGER_CMD next)" "Next actionable task (ID: 1)"

    # Trying to start Task 2 should fail
    assert_fail "$TASK_MANAGER_CMD" status 2 inprogress

    # Progress Task 1
    $TASK_MANAGER_CMD status 1 done > /dev/null
    
    # Now, 'next' should be Task 2
    assert_contains "$($TASK_MANAGER_CMD next)" "Next actionable task (ID: 2)"
    
    # Move Task 2 to 'testing'
    $TASK_MANAGER_CMD status 2 testing > /dev/null
    output_list=$($TASK_MANAGER_CMD list --human)
    assert_contains "$output_list" "Write unit and integration tests"

    # Trying to mark Task 2 as 'done' should fail
    assert_fail "$TASK_MANAGER_CMD" status 2 done
    
    # Complete subtasks and then the parent task
    $TASK_MANAGER_CMD status 2.1 done > /dev/null
    $TASK_MANAGER_CMD status 2.2 done > /dev/null
    $TASK_MANAGER_CMD status 2 done > /dev/null
    
    output_list=$($TASK_MANAGER_CMD list --human)
    assert_contains "$output_list" "✅ done"
}

test_remove() {
    echo "Testing: remove"
    $TASK_MANAGER_CMD remove 1 > /dev/null
    output_list=$($TASK_MANAGER_CMD list)
    set +e
    echo "$output_list" | grep -q "Task 1: Updated"
    local found=$?
    set -e
    if [ $found -eq 0 ]; then
        echo "Assertion failed: Task 1 was not removed."
        exit 1
    fi
}

# --- Main Execution ---
main() {
    cd "$TEST_WORKSPACE"
    test_init
    test_add_and_list
    test_update_and_subtask
    test_dependency_and_workflow
    test_remove
}

cleanup() {
    echo "Cleaning up CLI test workspace..."
    rm -rf "$TEST_WORKSPACE"
}

trap cleanup EXIT
main
echo "All CLI tests passed successfully!" 