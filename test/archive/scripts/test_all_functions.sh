#!/bin/bash

# Test script for Agentic Control Framework
# This script tests all functions in both CLI and MCP modes

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Agentic Control Framework Test Suite ===${NC}"

# Create a temporary test directory
TEST_DIR="./test_acf_$(date +%s)"
mkdir -p "$TEST_DIR"
echo -e "\nCreated test directory: $TEST_DIR"

# Function to log results
log_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}PASS${NC}: $2"
  else
    echo -e "${RED}FAIL${NC}: $2 (Exit code: $1)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

# Initialize counter for failed tests
FAILED_TESTS=0

# ============ CLI Mode Tests ============
echo -e "\n${YELLOW}Testing CLI Mode${NC}"

# Test init
./bin/task-manager init --project-name "Test Project" --project-description "Testing all functions" --workspace "$TEST_DIR"
log_result $? "Initialize project"

# Test add
./bin/task-manager add -t "First Task" -d "This is the first task" -p high --workspace "$TEST_DIR"
log_result $? "Add task"

# Test list
./bin/task-manager list --workspace "$TEST_DIR"
log_result $? "List tasks"

# Test add-subtask
./bin/task-manager add-subtask 1 -t "Subtask 1" --workspace "$TEST_DIR"
log_result $? "Add subtask"

# Test status
./bin/task-manager status 1.1 inprogress -m "Working on subtask" --workspace "$TEST_DIR"
log_result $? "Update status"

# Test get-context
./bin/task-manager get-context 1 --workspace "$TEST_DIR"
log_result $? "Get task context"

# Test update
./bin/task-manager update 1 -t "Updated Task" --workspace "$TEST_DIR"
log_result $? "Update task"

# Test generate-files
./bin/task-manager generate-files --workspace "$TEST_DIR"
log_result $? "Generate task files"

# Create a sample PRD file for testing parsePrd
echo -e "# Sample PRD\n\n## Feature 1\n- Requirement 1\n- Requirement 2\n\n## Feature 2\n- Requirement 3" > "$TEST_DIR/sample_prd.md"

# Test parse-prd (if Gemini API key is available)
if [ -n "$GEMINI_API_KEY" ]; then
  ./bin/task-manager parse-prd "$TEST_DIR/sample_prd.md" --workspace "$TEST_DIR"
  log_result $? "Parse PRD"
else
  echo -e "${YELLOW}Skipping parse-prd test: GEMINI_API_KEY not set${NC}"
fi

# Test expand-task (if Gemini API key is available)
if [ -n "$GEMINI_API_KEY" ]; then
  ./bin/task-manager expand-task 1 --workspace "$TEST_DIR"
  log_result $? "Expand task"
else
  echo -e "${YELLOW}Skipping expand-task test: GEMINI_API_KEY not set${NC}"
fi

# Test revise-tasks (if Gemini API key is available)
if [ -n "$GEMINI_API_KEY" ]; then
  ./bin/task-manager revise-tasks 1 -p "Change priority to focus on security" --workspace "$TEST_DIR"
  log_result $? "Revise tasks"
else
  echo -e "${YELLOW}Skipping revise-tasks test: GEMINI_API_KEY not set${NC}"
fi

# Test remove
./bin/task-manager remove 1.1 --workspace "$TEST_DIR"
log_result $? "Remove subtask"

# ============ MCP Mode Tests ============
echo -e "\n${YELLOW}Testing MCP Mode${NC}"

# To test MCP mode, we'd need to set up a proper MCP client
# This would typically be done through Cursor IDE
# Here, we'll just do a quick check to make sure the MCP server can start

echo "Starting MCP server..."
./bin/agentic-control-framework-mcp --test-mode &
MCP_PID=$!
sleep 1

# Check if the process is still running
if ps -p $MCP_PID > /dev/null; then
  echo -e "${GREEN}MCP server started successfully${NC}"
  kill $MCP_PID
else
  echo -e "${RED}Failed to start MCP server${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ============ Path Resolution Tests ============
echo -e "\n${YELLOW}Testing Path Resolution${NC}"

# Test absolute and relative path resolution
node test_path_resolution.js
log_result $? "Path resolution"

# ============ Summary ============
echo -e "\n${YELLOW}Test Summary${NC}"
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
else
  echo -e "${RED}$FAILED_TESTS test(s) failed${NC}"
fi

# Clean up (uncomment to remove test directory)
# echo -e "\nCleaning up test directory..."
# rm -rf "$TEST_DIR"

exit $FAILED_TESTS 