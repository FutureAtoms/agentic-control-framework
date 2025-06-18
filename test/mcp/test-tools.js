const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../../src/core');

describe('MCP Core Logic Tests', () => {
    let TEST_WORKSPACE;

    beforeEach(() => {
        TEST_WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-test-'));
        core.initProject(TEST_WORKSPACE, { projectName: 'MCP Core Test' });
    });

    afterEach(() => {
        fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    });

    it('should add tasks and subtasks', () => {
        const task1 = core.addTask(TEST_WORKSPACE, { title: 'Core Task 1', priority: 'critical' });
        core.addTask(TEST_WORKSPACE, { title: 'Core Task 2', priority: 'high', dependsOn: task1.taskId.toString() });
        core.addSubtask(TEST_WORKSPACE, task1.taskId, { title: 'Core Subtask 1.1' });
        
        const tasksData = core.readTasks(TEST_WORKSPACE);
        expect(tasksData.tasks).to.have.lengthOf(2);
        expect(tasksData.tasks[0].subtasks).to.have.lengthOf(1);
    });

    it('should enforce dependencies for getNextTask', () => {
        const task1 = core.addTask(TEST_WORKSPACE, { title: 'Task 1', priority: 'critical' });
        const task2 = core.addTask(TEST_WORKSPACE, { title: 'Task 2', priority: 'high', dependsOn: task1.taskId.toString() });

        let nextTask = core.getNextTask(TEST_WORKSPACE);
        expect(nextTask.task.id).to.equal(task1.taskId);

        core.updateStatus(TEST_WORKSPACE, task1.taskId, 'done');

        nextTask = core.getNextTask(TEST_WORKSPACE);
        expect(nextTask.task.id).to.equal(task2.taskId);
    });

    it('should enforce dependencies for updateStatus', () => {
        const task3 = core.addTask(TEST_WORKSPACE, { title: 'Task 3', priority: 'high' });
        const task4 = core.addTask(TEST_WORKSPACE, { title: 'Task 4', dependsOn: task3.taskId.toString() });

        const result = core.updateStatus(TEST_WORKSPACE, task4.taskId, 'inprogress');
        expect(result.success).to.be.false;
        expect(result.message).to.contain('unmet dependencies');
    });
}); 