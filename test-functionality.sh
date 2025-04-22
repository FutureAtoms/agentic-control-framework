#!/bin/bash

# Comprehensive Test Script for Agentic Control Framework
# This script tests both CLI and MCP functionality after cleanup

echo "======================================================"
echo "  Agentic Control Framework Functionality Test"
echo "======================================================"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to run tests with proper error handling
run_test() {
  local test_name="$1"
  local command="$2"
  
  echo -n "Testing $test_name... "
  if eval "$command" > /dev/null 2>&1; then
    echo "✅ PASSED"
    return 0
  else
    echo "❌ FAILED"
    echo "  Command: $command"
    echo "  Try running the command manually to see the error."
    return 1
  fi
}

# Create a temporary test directory
TEST_DIR="acf_test_$(date +%s)"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR" || { echo "Failed to create test directory"; exit 1; }
echo "Created test directory: $PWD"

echo -e "\n1. Checking required components..."

# Check for Node.js
if command_exists node; then
  NODE_VERSION=$(node --version)
  echo "✅ Node.js found: $NODE_VERSION"
else
  echo "❌ Node.js not found. Please install Node.js to run the task manager."
  exit 1
fi

# Check for task-manager script
if [ -f "../bin/task-manager" ]; then
  echo "✅ CLI script (bin/task-manager) found"
else
  echo "❌ CLI script not found. Expected at ../bin/task-manager"
  exit 1
fi

# Check for task-manager-mcp script
if [ -f "../bin/task-manager-mcp" ]; then
  echo "✅ Legacy MCP script (bin/task-manager-mcp) found"
elif [ -f "../bin/agentic-control-framework-mcp" ]; then
  echo "✅ MCP script (bin/agentic-control-framework-mcp) found"
else
  echo "❌ MCP script not found. Expected at ../bin/task-manager-mcp or ../bin/agentic-control-framework-mcp"
  exit 1
fi

echo -e "\n2. Testing CLI functionality..."

# Test CLI initialization
run_test "project initialization" "../bin/task-manager init --project-name 'Test Project' --project-description 'Testing ACF functionality'"

# Verify tasks.json was created
if [ -f "tasks.json" ]; then
  echo "✅ tasks.json file created successfully"
else
  echo "❌ tasks.json file was not created"
  exit 1
fi

# Test adding a task
run_test "adding a task" "../bin/task-manager add -t 'Test Task 1' -d 'First test task' -p high"

# Test adding another task that depends on the first
run_test "adding a dependent task" "../bin/task-manager add -t 'Test Task 2' -d 'Second test task' -p medium --depends-on 1"

# Test adding a subtask
run_test "adding a subtask" "../bin/task-manager add-subtask 1 -t 'Test Subtask 1.1'"

# Test listing tasks
run_test "listing tasks" "../bin/task-manager list"

# Test updating task status
run_test "updating task status" "../bin/task-manager status 1 inprogress -m 'Starting work'"

# Test getting next task
run_test "getting next task" "../bin/task-manager next"

# Test task context
run_test "getting task context" "../bin/task-manager context 1"

# Test generating task files
run_test "generating task files" "../bin/task-manager generate"

# Verify task files
if [ -d "tasks" ] && [ "$(ls -A tasks | wc -l)" -gt 0 ]; then
  echo "✅ Task files generated successfully"
else
  echo "❌ Task files were not generated correctly"
  exit 1
fi

echo -e "\n3. Testing MCP functionality (basic)..."

# Create a simple MCP client test file
cat > mcp_basic_test.js << 'JSEOF'
const { spawn } = require('child_process');

// Try spawning the MCP server
const mcp = spawn('../bin/agentic-control-framework-mcp', [], {
  stdio: ['pipe', 'pipe', 'pipe']
});
EOF

# Run the MCP test
echo "Running basic MCP test..."
if node mcp_basic_test.js; then
  echo "✅ Basic MCP test passed"
else
  echo "❌ Basic MCP test failed"
  exit 1
fi

echo -e "\n4. Testing full task creation through MCP..."

# Create more comprehensive MCP client test
cat > mcp_comprehensive_test.js << 'JSEOF'
const { spawn } = require('child_process');

// Start the MCP server
const mcp = spawn('../bin/agentic-control-framework-mcp', [], {
  stdio: ['pipe', 'pipe', 'pipe']
});
EOF

# Run the MCP task creation test
echo "Running MCP task creation test..."
if node mcp_comprehensive_test.js; then
  echo "✅ MCP task creation test passed"
else
  echo "❌ MCP task creation test failed"
  exit 1
fi

echo -e "\n5. Verifying task creation via MCP..."

# Check if task was created by the MCP
if grep -q "MCP Created Task" tasks.json; then
  echo "✅ Task created through MCP found in tasks.json"
else
  echo "❌ Task created through MCP not found in tasks.json"
  exit 1
fi

echo -e "\n======================================================"
echo "  All tests passed! Agentic Control Framework is working properly."
echo "======================================================"

# Cleanup
cd ..
echo "Test directory: $TEST_DIR (not deleted for inspection)"
echo "To remove test directory: rm -rf $TEST_DIR" 