#!/bin/bash

set -e
set -x

# --- Test Setup ---
TEST_WORKSPACE=$(mktemp -d -t acf-cli-test.XXXXXX)
ACF_ROOT=$(pwd)
TASK_MANAGER_CMD="node $ACF_ROOT/bin/task-cli.js"

# --- Helper Functions ---
assert_success() {
    if [ $? -ne 0 ]; then
        echo "Assertion failed: Command was expected to succeed but failed."
        exit 1
    fi
}

assert_fail() {
    set +e
    "$@" > /dev/null 2>&1
    local exit_code=$?
    set -e
    if [ $exit_code -eq 0 ]; then
        echo "Assertion failed: Command was expected to fail but succeeded."
        exit 1
    fi
}

assert_contains() {
    if ! echo "$1" | grep -iqF "$2"; then
        echo "Assertion failed: Expected output to contain '$2'. Actual: $1"
        exit 1
    fi
}

# --- Test Cases ---
test_init() {
    echo "Testing: init"
    output=$($TASK_MANAGER_CMD init --project-name "CLI Test Project" --project-description "A test project for the CLI")
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

    # 'next' should return Task 2 (ID 2) due to 'critical' priority.
    # The output is a table, so we check for the title.
    local next_output
    next_output=$($TASK_MANAGER_CMD next)
    assert_contains "$next_output" "Task 1: Critical"

    # Trying to start Task 3 should fail as its dependency (Task 1) is not 'done'.
    assert_fail $TASK_MANAGER_CMD status 3 inprogress

    # Complete Task 2.
    $TASK_MANAGER_CMD status 2 done > /dev/null
    
    # 'next' should now return Task 1 (ID 1).
    # Note: test_update_and_subtask has changed its title to "Task 1: Updated".
    next_output=$($TASK_MANAGER_CMD next)
    assert_contains "$next_output" "Task 1: Updated"
    
    # Must complete subtask 1.1 before parent task 1
    $TASK_MANAGER_CMD status 1.1 done > /dev/null

    # Complete Task 1.
    $TASK_MANAGER_CMD status 1 done > /dev/null

    # Now that Task 1 is done, 'next' should return Task 3.
    next_output=$($TASK_MANAGER_CMD next)
    assert_contains "$next_output" "Task 2: High"

    # Move Task 3 to 'testing', which should auto-generate subtasks.
    $TASK_MANAGER_CMD status 3 testing > /dev/null
    output_list=$($TASK_MANAGER_CMD list --human)
    assert_contains "$output_list" "Write unit and integration tests"

    # Trying to mark Task 3 'done' should fail because its subtasks are not complete.
    assert_fail $TASK_MANAGER_CMD status 3 done
    
    # Complete the auto-generated subtasks.
    $TASK_MANAGER_CMD status 3.1 done > /dev/null
    $TASK_MANAGER_CMD status 3.2 done > /dev/null

    # Now, completing Task 3 should succeed.
    $TASK_MANAGER_CMD status 3 done > /dev/null
    
    # Verify Task 3 is marked 'done' in the human-readable list.
    output_list=$($TASK_MANAGER_CMD list --human)
    task_3_line=$(echo "$output_list" | grep '| #3 |')
    assert_contains "$task_3_line" "✅ done"
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