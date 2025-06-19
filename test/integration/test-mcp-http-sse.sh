#!/bin/bash

# Test script for ACF MCP server functionality
#
# This script tests the core functionality of the Agentic Control Framework's
# MCP server. It interacts with the server directly via named pipes to avoid
# issues with HTTP proxies or port conflicts. This method tests the underlying
# tool handling logic, which is common to all transport layers (HTTP, SSE, etc.).
#
# NOTE: This test script is designed to be resilient to pre-existing state
# in the workspace (e.g., an existing .acf/tasks.json file). Instead of asserting
# exact state, it asserts state changes (e.g., task count increasing).

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
header() { echo -e "${PURPLE}[TEST]${NC} $1"; }

TEST_WORKSPACE=""
MCP_PID=""
REQUEST_COUNT=0
RESPONSE_FILE="/tmp/mcp_responses.log"
INPUT_PIPE="/tmp/mcp_input.pipe"

# Cleanup function
cleanup() {
    log "Cleaning up..."
    if [ -n "$MCP_PID" ]; then
        # Give a moment for the server to process final commands before killing
        sleep 1
        kill $MCP_PID 2>/dev/null || true
    fi
    if [ -d "$TEST_WORKSPACE" ]; then
        rm -rf "$TEST_WORKSPACE"
    fi
    rm -f "$RESPONSE_FILE"
    rm -f "$INPUT_PIPE"
}

trap cleanup EXIT

# Setup function for tests
setup() {
    TEST_WORKSPACE=$(mktemp -d -t acf-test-XXXXXX)
    log "Test workspace created at $TEST_WORKSPACE"
    # Clear and create response file and input pipe
    rm -f "$RESPONSE_FILE" "$INPUT_PIPE"
    touch "$RESPONSE_FILE"
    mkfifo "$INPUT_PIPE"
}

# Start MCP server
start_mcp_server() {
    log "Starting ACF MCP server..."
    # We run the server in the background, reading from a named pipe and writing to a log file.
    # This ensures we are testing in a clean environment.
    ./bin/agentic-control-framework-mcp --workspaceRoot "$TEST_WORKSPACE" < "$INPUT_PIPE" > "$RESPONSE_FILE" 2>/tmp/mcp_server_stderr.log &
    MCP_PID=$!
    
    # Give it a moment to start up
    sleep 2
    
    if ! ps -p $MCP_PID > /dev/null; then
        error "MCP server failed to start. Stderr: $(cat /tmp/mcp_server_stderr.log)"
    fi
    success "MCP server started successfully with PID $MCP_PID."
}

# Function to send a request to the server
send_request() {
    local request_body=$1
    local request_id=$2

    echo "$request_body" > "$INPUT_PIPE"
    
    # Wait for the response
    local result=""
    # Increased timeout for slower systems
    for i in {1..20}; do
        # Search for the full JSON object in the stream of responses
        result=$(grep -o "{\"jsonrpc\":\"2.0\",\"id\":$request_id,.*}" "$RESPONSE_FILE" | jq -c . 2>/dev/null || true)
        if [ -n "$result" ]; then
            break
        fi
        sleep 0.5
    done
    
    if [ -z "$result" ]; then
        error "Did not receive response for request ID $request_id. Check /tmp/mcp_server_stderr.log"
    fi
    
    echo "$result"
}

# Test: initProject
test_init_project() {
    header "Testing 'initProject' tool"

    # Create a dummy old rules file to test migration
    local old_rules_dir="$TEST_WORKSPACE/.cursor/rules"
    mkdir -p "$old_rules_dir"
    local old_rules_file="$old_rules_dir/task_manager_workflow.mdc"
    local old_content="OLD RULES CONTENT"
    echo "$old_content" > "$old_rules_file"
    log "Created dummy old rules file for migration test."

    ((REQUEST_COUNT++))
    local request_body="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"initProject\",\"args\":{\"projectName\":\"Test Project\", \"editor\":\"cursor\"}}}"
    local response=$(send_request "$request_body" "$REQUEST_COUNT")
    if echo "$response" | grep -q '"success":true'; then
        success "initProject successful."
    else
        error "initProject failed. Response: $response"
    fi

    # Verify that the new rules file contains the old content
    local new_rules_file="$TEST_WORKSPACE/.cursor/rules/acf_rules.md"
    if [ -f "$new_rules_file" ] && grep -q "$old_content" "$new_rules_file"; then
        success "Editor-specific rules file created and contains migrated content."
    else
        error "Editor-specific rules file was not created or does not contain migrated content."
    fi

    # Verify that the old rules file was deleted
    if [ ! -f "$old_rules_file" ]; then
        success "Old rules file was successfully deleted after migration."
    else
        error "Old rules file was not deleted after migration."
    fi
}

# Test: Task management tools
test_task_tools() {
    header "Testing Task Management Tools"

    # 1. Get initial task count
    ((REQUEST_COUNT++))
    local list_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"listTasks\",\"args\":{}}}"
    local initial_list_response=$(send_request "$list_req" "$REQUEST_COUNT")
    # Use jq to robustly count the number of tasks.
    local initial_task_count=$(echo "$initial_list_response" | jq '.result.tasks | length')
    log "Initial task count: $initial_task_count"

    # 2. Add a new task
    ((REQUEST_COUNT++))
    local add_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"addTask\",\"args\":{\"title\":\"My Test Task From Test Script\"}}}"
    local add_response=$(send_request "$add_req" "$REQUEST_COUNT")
    if echo "$add_response" | grep -q '"success":true'; then
        success "addTask successful."
    else
        error "addTask failed. Response: $add_response"
    fi

    # 3. Get new task count and verify it increased
    ((REQUEST_COUNT++))
    local list_req_2="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"listTasks\",\"args\":{}}}"
    local final_list_response=$(send_request "$list_req_2" "$REQUEST_COUNT")
    # Use jq to robustly count the number of tasks.
    local final_task_count=$(echo "$final_list_response" | jq '.result.tasks | length')
    log "Final task count: $final_task_count"

    if [ "$final_task_count" -eq "$((initial_task_count + 1))" ]; then
        success "Task count increased by 1 as expected."
    else
        error "Task count did not increase as expected. Initial: $initial_task_count, Final: $final_task_count"
    fi
}

# Test: Filesystem tools
test_filesystem_tools() {
    header "Testing Filesystem Tools"

    # 1. Write a file
    ((REQUEST_COUNT++))
    local test_file_path="$TEST_WORKSPACE/test_file.txt"
    local write_file_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"write_file\",\"args\":{\"path\":\"$test_file_path\",\"content\":\"hello world\"}}}"
    local write_response=$(send_request "$write_file_req" "$REQUEST_COUNT")
    if echo "$write_response" | grep -q '"success":true'; then
        success "write_file successful."
    else
        error "write_file failed. Response: $write_response"
    fi

    # 2. Verify file creation with list_directory
    ((REQUEST_COUNT++))
    local list_dir_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"list_directory\",\"args\":{\"path\":\"$TEST_WORKSPACE\"}}}"
    local list_response=$(send_request "$list_dir_req" "$REQUEST_COUNT")
    if echo "$list_response" | grep -q '"name":"test_file.txt"'; then
        success "Verified file creation using list_directory."
    else
        error "File verification failed with list_directory. Response: $list_response"
    fi

    # 3. Cleanup created file
    ((REQUEST_COUNT++))
    local delete_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"delete_file\",\"args\":{\"path\":\"$test_file_path\"}}}"
    local delete_response=$(send_request "$delete_req" "$REQUEST_COUNT")
     if echo "$delete_response" | grep -q '"success":true'; then
        success "delete_file successful."
    else
        error "delete_file failed. Response: $delete_response"
    fi
}

# Test: More filesystem tools
test_more_filesystem_tools() {
    header "Testing More Filesystem Tools"

    # 1. Create a directory
    ((REQUEST_COUNT++))
    local test_dir_path="$TEST_WORKSPACE/new_dir"
    local mkdir_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"create_directory\",\"args\":{\"path\":\"$test_dir_path\"}}}"
    local mkdir_response=$(send_request "$mkdir_req" "$REQUEST_COUNT")
    if echo "$mkdir_response" | grep -q '"success":true'; then
        success "create_directory successful."
    else
        error "create_directory failed. Response: $mkdir_response"
    fi

    # 2. Use 'tree' to verify directory creation
    ((REQUEST_COUNT++))
    local tree_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"tree\",\"args\":{\"path\":\"$TEST_WORKSPACE\"}}}"
    local tree_response=$(send_request "$tree_req" "$REQUEST_COUNT")
    if echo "$tree_response" | jq -e '.result.tree.children | any(.name == "new_dir")' > /dev/null; then
        success "Verified directory creation using tree."
    else
        error "Directory verification failed with tree. Response: $tree_response"
    fi

    # 3. Test read_file
    ((REQUEST_COUNT++))
    local test_file_path_for_read="$TEST_WORKSPACE/readable_file.txt"
    # Use shell redirection to create the file directly for this test
    echo "content to be read" > "$test_file_path_for_read"
    local read_file_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"read_file\",\"args\":{\"path\":\"$test_file_path_for_read\"}}}"
    local read_response=$(send_request "$read_file_req" "$REQUEST_COUNT")
    local content=$(echo "$read_response" | jq -r '.result.content')
    if [ "$content" = "content to be read" ]; then
        success "read_file successful."
    else
        error "read_file failed. Response: $read_response"
    fi
}

# Test: More Task Management tools
test_more_task_tools() {
    header "Testing More Task Management Tools"

    # 1. Add a task to be updated and removed
    ((REQUEST_COUNT++))
    local title_to_update="Task to be updated"
    local add_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"addTask\",\"args\":{\"title\":\"$title_to_update\"}}}"
    send_request "$add_req" "$REQUEST_COUNT" > /dev/null # We don't need to check this again
    
    # 2. Find the ID of the task we just added
    ((REQUEST_COUNT++))
    local list_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"listTasks\",\"args\":{}}}"
    local list_response=$(send_request "$list_req" "$REQUEST_COUNT")
    local task_id=$(echo "$list_response" | jq -r ".result.tasks[] | select(.title == \"$title_to_update\") | .id")

    if [ -z "$task_id" ]; then
        error "Could not find the task to update/remove."
    fi
    log "Found task with ID $task_id to modify."

    # 3. Update the task
    ((REQUEST_COUNT++))
    local new_title="Updated Task Title"
    local update_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"updateTask\",\"args\":{\"id\":\"$task_id\",\"title\":\"$new_title\"}}}"
    local update_response=$(send_request "$update_req" "$REQUEST_COUNT")
    if echo "$update_response" | grep -q '"success":true'; then
        success "updateTask successful."
    else
        error "updateTask failed. Response: $update_response"
    fi

    # 4. Remove the task
    ((REQUEST_COUNT++))
    local remove_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"removeTask\",\"args\":{\"id\":\"$task_id\"}}}"
    local remove_response=$(send_request "$remove_req" "$REQUEST_COUNT")
    if echo "$remove_response" | grep -q '"success":true'; then
        success "removeTask successful."
    else
        error "removeTask failed. Response: $remove_response"
    fi
}

# Test: Terminal command execution
test_terminal_tools() {
    header "Testing Terminal Execution Tools"

    # 1. Execute a simple command
    ((REQUEST_COUNT++))
    local command_to_run="echo 'hello from terminal'"
    local exec_req="{\"jsonrpc\":\"2.0\",\"id\":$REQUEST_COUNT,\"method\":\"tools/run\",\"params\":{\"tool\":\"execute_command\",\"args\":{\"command\":\"$command_to_run\"}}}"
    local exec_response=$(send_request "$exec_req" "$REQUEST_COUNT")

    # Check for success and expected output
    if echo "$exec_response" | grep -q '"exitCode":0' && echo "$exec_response" | grep -q 'hello from terminal'; then
        success "execute_command successful with expected output."
    else
        error "execute_command failed or produced unexpected output. Response: $exec_response"
    fi
}

# Main execution
main() {
    setup
    start_mcp_server
    
    test_init_project
    test_task_tools
    test_filesystem_tools
    test_more_filesystem_tools
    test_more_task_tools
    test_terminal_tools
    
    success "All tests passed!"
}

main