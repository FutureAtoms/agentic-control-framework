const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('../../src/core');

const TEST_WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-mcp-test-'));

describe('MCP Core Logic Tests', () => {
    before(() => {
        core.initProject(TEST_WORKSPACE, { projectName: 'MCP Core Test' });
    });

    after(() => {
        fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    });

    it('should add tasks and subtasks', () => {
        const task1 = core.addTask(TEST_WORKSPACE, { title: 'Core Task 1', priority: 'critical' });
        const task2 = core.addTask(TEST_WORKSPACE, { title: 'Core Task 2', priority: 'high', dependsOn: task1.taskId.toString() });
        const subtask = core.addSubtask(TEST_WORKSPACE, task1.taskId, { title: 'Core Subtask 1.1' });
        
        expect(task1.success).to.be.true;
        expect(task2.success).to.be.true;
        expect(subtask.success).to.be.true;

        const tasksData = core.readTasks(TEST_WORKSPACE);
        expect(tasksData.tasks).to.have.lengthOf(2);
        expect(tasksData.tasks[0].subtasks).to.have.lengthOf(1);
    });

    it('should enforce dependencies for getNextTask', () => {
        let nextTask = core.getNextTask(TEST_WORKSPACE);
        expect(nextTask.task.id).to.equal(1);

        core.updateStatus(TEST_WORKSPACE, 1, 'done');

        nextTask = core.getNextTask(TEST_WORKSPACE);
        expect(nextTask.task.id).to.equal(2);
    });

    it('should enforce dependencies for updateStatus', () => {
        core.addTask(TEST_WORKSPACE, { title: 'Task 3', priority: 'high' });
        core.addTask(TEST_WORKSPACE, { title: 'Task 4', dependsOn: '3' });

        const result = core.updateStatus(TEST_WORKSPACE, 4, 'inprogress');
        expect(result.success).to.be.false;
        expect(result.message).to.contain('unmet dependencies');
    });
}); 