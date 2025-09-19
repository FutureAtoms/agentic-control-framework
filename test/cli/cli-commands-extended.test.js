const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { runCli, createTempWorkspace, readTasksJson } = require('./helpers');

describe('ACF CLI Extended Coverage', function() {
  this.timeout(30000);

  let workspace;

  before(async () => {
    workspace = createTempWorkspace('acf-cli-extended-');
    const res = await runCli([
      'init',
      '--project-name', 'CLI Extended Project',
      '--project-description', 'Extended CLI combinations'
    ], { cwd: workspace });
    expect(res.code).to.equal(0, `init failed: ${res.stderr}`);

    // Add baseline tasks
    let r;
    r = await runCli(['add', '--title', 'Base Task 1', '--description', 'First', '--priority', 'medium'], { cwd: workspace });
    expect(r.code).to.equal(0, r.stderr);
    r = await runCli(['add', '--title', 'Base Task 2', '--priority', '600'], { cwd: workspace });
    expect(r.code).to.equal(0, r.stderr);
    r = await runCli(['add-subtask', '1', '--title', 'Sub 1.1'], { cwd: workspace });
    expect(r.code).to.equal(0, r.stderr);
  });

  after(() => {
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  });

  it('lists with combinations: json/human/table and status filters', async () => {
    // json
    let res = await runCli(['list', '--json'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const data = JSON.parse(res.stdout);
    expect(data.tasks).to.be.an('array').that.is.not.empty;

    // human
    res = await runCli(['list', '--human'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout.toLowerCase()).to.include('id');

    // table
    res = await runCli(['list', '--table'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('ID');

    // status filter that likely yields none
    res = await runCli(['list', '--status', 'blocked', '--human'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
  });

  it('context for a task and remove a subtask', async () => {
    let res = await runCli(['context', '1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('Task Context for 1');

    res = await runCli(['remove', '1.1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    const t1 = tasks.tasks.find(t => t.id === 1);
    expect(t1.subtasks || []).to.satisfy(arr => !arr.some(s => s.id === '1.1'));
  });

  it('update with no options errors, then update fields correctly', async () => {
    // No options
    let res = await runCli(['update', '1'], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect(res.stderr.toLowerCase()).to.include('no update options');

    // With options
    res = await runCli(['update', '1', '--title', 'Base Task 1 Updated', '--priority', '750', '--depends-on', '2', '--related-files', 'x.js,y.js', '--tests', 'unit'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    const t1 = tasks.tasks.find(t => t.id === 1);
    expect(t1.title).to.equal('Base Task 1 Updated');
    expect(t1.dependsOn).to.include(2);
    expect(t1.relatedFiles).to.include('x.js');
  });

  it('status transitions (testing adds subtasks), done blocked by incomplete subtasks', async () => {
    // Use task 2 to avoid dependency issues
    let res = await runCli(['status', '2', 'testing', '--message', 'Begin testing'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    let t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect((t2.subtasks || []).some(s => /Write unit and integration tests/.test(s.title))).to.equal(true);

    // trying to mark done should fail (has incomplete subtasks)
    res = await runCli(['status', '2', 'done'], { cwd: workspace });
    expect(res.code).to.not.equal(0);
    expect(res.stderr.toLowerCase()).to.include('cannot mark task');
  });

  it('priority ops: bump, defer, prioritize (clamp), deprioritize (clamp)', async () => {
    let res = await runCli(['bump', '2', '--amount', '80'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    let t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.at.most(1000);

    res = await runCli(['defer', '2', '--amount', '300'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.at.least(1);

    res = await runCli(['prioritize', '2', '--priority', '9999'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.at.least(800).and.to.be.at.most(900);

    res = await runCli(['deprioritize', '2', '--priority', '1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.at.least(100).and.to.be.at.most(400);
  });

  it('priority analytics and recalculation flags', async () => {
    let res = await runCli(['priority-stats'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('Priority Statistics');

    res = await runCli(['dependency-analysis'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout.toLowerCase()).to.include('dependency');

    // Recalc defaults
    res = await runCli(['recalculate-priorities'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    // Recalc with extra flags
    res = await runCli(['recalculate-priorities', '--time-decay', '--effort-weighting'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
  });

  it('templates: list, suggest, calculate, add-with-template works', async () => {
    let res = await runCli(['list-templates'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    res = await runCli(['suggest-template', 'Refactor module', 'Improve maintainability'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    res = await runCli(['calculate-priority', 'feature', 'Implement feature X', 'Details', '--tags', 'ux,high-impact'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('Priority Calculation');

    res = await runCli(['add-with-template', 'feature', 'Feature Y', 'Details', '--tags', 'backend', '--depends-on', '1', '--related-files', 'src/app.js'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    expect(tasks.tasks.some(t => t.title === 'Feature Y')).to.equal(true);
  });

  it('file generation and watcher lifecycle does not hang', async () => {
    let res = await runCli(['generate-files'], { cwd: workspace, timeoutMs: 20000 });
    expect(res.code).to.equal(0, res.stderr);
    expect(fs.existsSync(path.join(workspace, 'tasks'))).to.equal(true);

    // Do not start the long-running watcher here to avoid hanging test process
    res = await runCli(['file-watcher-status'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    // Skip force-sync since no watcher is running
  });

  it('AI-backed commands error without GEMINI_API_KEY: expand-task and revise-tasks', async () => {
    // expand-task
    let res = await runCli(['expand-task', '1'], { cwd: workspace, env: { GEMINI_API_KEY: '' } });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.match(/gemini|api|error/i);

    // revise-tasks
    res = await runCli(['revise-tasks', '1', '--prompt', 'Change scope'], { cwd: workspace, env: { GEMINI_API_KEY: '' } });
    expect(res.code).to.not.equal(0);
    expect((res.stderr + res.stdout).toLowerCase()).to.match(/gemini|api|error/i);
  });
});
