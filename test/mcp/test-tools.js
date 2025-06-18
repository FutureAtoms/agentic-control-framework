const assert = require('assert');
const fs = require('fs');
const path = require('path');
const core = require('../../src/core');

const TEST_WORKSPACE = fs.mkdtempSync(path.join(require('os').tmpdir(), 'acf-test-'));

function test_addTask() {
    console.log('Testing: addTask');
    const options = { title: 'MCP Task', priority: 'critical' };
    const result = core.addTask(TEST_WORKSPACE, options);
    assert.strictEqual(result.success, true, 'addTask should succeed');
    assert(result.message.includes('MCP Task'), 'addTask success message is incorrect');

    const tasksData = core.readTasks(TEST_WORKSPACE);
    const task = tasksData.tasks.find(t => t.title === 'MCP Task');
    assert(task, 'Task was not added to tasks.json');
    assert.strictEqual(task.priority, 'critical', 'Task priority is incorrect');
}

function runTests() {
    try {
        core.initProject(TEST_WORKSPACE, { projectName: 'MCP Test' });
        test_addTask();
        console.log('MCP tool tests completed successfully.');
    } finally {
        fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    }
}

runTests(); 