const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { runCli, createTempWorkspace, readTasksJson } = require('./helpers');

describe('ACF CLI Edge Cases & Full Combinations', function() {
  this.timeout(30000);

  let workspace;
  let task1Id;
  let task2Id;

  before(async () => {
    workspace = createTempWorkspace('acf-cli-edges-');
    let res = await runCli(['init', '--project-name', 'Edge Project', '--project-description', 'Edge cases'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    // Add baseline tasks
    res = await runCli(['add', '--title', 'E Task 1', '--description', 'E1', '--priority', '500'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    res = await runCli(['add', '--title', 'E Task 2', '--priority', '600', '--depends-on', '1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    res = await runCli(['add-subtask', '1', '--title', 'E Sub 1.1', '--related-files', 'a.js,b.js', '--tests', 'unit'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    // Capture actual IDs assigned (init creates a default task with ID 1)
    const tasks = readTasksJson(workspace).tasks;
    task1Id = tasks.find(t => t.title === 'E Task 1').id;
    task2Id = tasks.find(t => t.title === 'E Task 2').id;
  });

  after(() => {
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  });

  it('status fails when dependencies are unmet', async () => {
    const t2a = readTasksJson(workspace).tasks.find(t => t.id === task2Id);
    expect(t2a.dependsOn).to.include(1);
    const res = await runCli([ 'status', String(task2Id), 'inprogress' ], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.include('unmet dependencies');
  });

  it('bump/defer invalid amount errors', async () => {
    let res = await runCli(['bump', '1', '--amount', '-5'], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.include('amount must be a positive number');

    res = await runCli(['defer', '1', '--amount', '0'], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.include('amount must be a positive number');
  });

  it('prioritize/deprioritize invalid input clamps to defaults', async () => {
    let res = await runCli(['prioritize', '1', '--priority', 'abc'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    let t1 = readTasksJson(workspace).tasks.find(t => t.id === 1);
    expect(t1.priority).to.be.within(800, 900);

    res = await runCli(['deprioritize', '1', '--priority', 'zzz'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t1 = readTasksJson(workspace).tasks.find(t => t.id === 1);
    expect(t1.priority).to.be.within(100, 400);
  });

  it('remove non-existent returns error', async () => {
    const res = await runCli(['remove', '9999'], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.include('not found');
  });

  it('context shows related files when present', async () => {
    let res = await runCli(['update', '1', '--related-files', 'a.js,b.js'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    res = await runCli(['context', '1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const out = res.stdout.toLowerCase();
    expect(out).to.include('related files');
    expect(out).to.include('a.js');
  });

  it('list with unknown status prints none found', async () => {
    const res = await runCli(['list', '--status', 'unknown-state'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect((res.stdout + res.stderr).toLowerCase()).to.match(/no tasks found/);
  });
});
