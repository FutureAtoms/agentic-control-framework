const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { runCli, createTempWorkspace, readTasksJson } = require('./helpers');

describe('ACF CLI End-to-End', function() {
  this.timeout(20000);

  let workspace;

  before(async () => {
    workspace = createTempWorkspace();
    // init non-interactively
    const res = await runCli(['init', '--project-name', 'CLI Test Project', '--project-description', 'CLI end-to-end tests'], { cwd: workspace });
    expect(res.code).to.equal(0, `init failed: ${res.stderr}`);
    expect(fs.existsSync(path.join(workspace, '.acf', 'tasks.json'))).to.equal(true);
  });

  after(() => {
    try { fs.rmSync(workspace, { recursive: true, force: true }); } catch (_) {}
  });

  it('adds tasks and subtasks', async () => {
    let res = await runCli(['add', '--title', 'Task A', '--description', 'Alpha desc', '--priority', 'high'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    res = await runCli(['add', '--title', 'Task B', '--priority', '450', '--depends-on', '1', '--related-files', 'a.js,b.js', '--tests', 'unit,integ'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    res = await runCli(['add-subtask', '1', '--title', 'Subtask A.1'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    const tasks = readTasksJson(workspace);
    expect(tasks.tasks.length).to.be.greaterThan(1);
    const t1 = tasks.tasks.find(t => t.id === 1);
    expect(t1.subtasks).to.satisfy(st => Array.isArray(st) && st.length >= 1);
  });

  it('lists tasks in table and json and human formats', async () => {
    let res = await runCli(['list', '--json'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const parsed = JSON.parse(res.stdout);
    expect(parsed).to.have.property('tasks');
    expect(parsed.tasks).to.be.an('array').that.is.not.empty;

    res = await runCli(['list', '--human'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('|');

    res = await runCli(['list', '--table'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('ID');
  });

  it('updates status with related files and messages', async () => {
    // First complete subtask 1.1 to allow task 1 to complete
    let res = await runCli(['status', '1.1', 'done', '--message', 'Subtask done'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);

    res = await runCli(['status', '1', 'done', '--message', 'Completed', '--related-files', 'a.js'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    const t1 = tasks.tasks.find(t => t.id === 1);
    expect(t1.status).to.equal('done');
    expect(t1.relatedFiles).to.include('a.js');
  });

  it('gets next actionable task', async () => {
    const res = await runCli(['next'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout.toLowerCase()).to.include('task');
  });

  it('updates a task properties', async () => {
    const res = await runCli(['update', '2', '--title', 'Task B Updated', '--description', 'Updated desc', '--priority', '700', '--depends-on', '1,3', '--related-files', 'c.js,d.js', '--tests', 'smoke', '--message', 'Tweaked'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    const t2 = tasks.tasks.find(t => t.id === 2);
    expect(t2.title).to.equal('Task B Updated');
    // priority may be adjusted slightly for uniqueness; allow small drift
    expect(t2.priority).to.be.within(695, 705);
    expect(t2.relatedFiles).to.include('c.js');
  });

  it('updates a subtask title', async () => {
    const res = await runCli(['update-subtask', '1.1', '--title', 'Renamed subtask'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    const t1 = tasks.tasks.find(t => t.id === 1);
    expect(t1.subtasks.some(s => s.title === 'Renamed subtask')).to.equal(true);
  });

  it('bumps, defers, and prioritizes tasks', async () => {
    let res = await runCli(['bump', '2', '--amount', '25'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    let t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.within(720, 730);

    res = await runCli(['defer', '2', '--amount', '100'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.be.within(620, 630);

    res = await runCli(['prioritize', '2', '--priority', '905'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    t2 = readTasksJson(workspace).tasks.find(t => t.id === 2);
    expect(t2.priority).to.equal(900); // clamped
  });

  it('handles templates: list, suggest, calculate, add-with-template', async () => {
    let res = await runCli(['list-templates'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('Available Priority Templates');

    res = await runCli(['suggest-template', 'Fix critical bug', 'System crash'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.match(/Template Suggestions|Best Match/);

    res = await runCli(['calculate-priority', 'bug', 'Fix crash', 'Crash on startup', '--tags', 'backend,urgent'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout).to.include('Priority Calculation');

    res = await runCli(['add-with-template', 'bug', 'Crash BUG', 'Startup crash', '--tags', 'urgent', '--depends-on', '1,2', '--related-files', 'x.js'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    const tasks = readTasksJson(workspace);
    expect(tasks.tasks.some(t => /Crash BUG/.test(t.title))).to.equal(true);
  });

  it('generates files (and watcher status)', async () => {
    let res = await runCli(['generate-files'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(fs.existsSync(path.join(workspace, 'tasks'))).to.equal(true);

    // Avoid starting long-running watcher; just query status
    res = await runCli(['file-watcher-status'], { cwd: workspace });
    expect(res.code).to.equal(0, res.stderr);
    expect(res.stdout.toLowerCase()).to.include('file watcher status');

    // Skip force-sync since no watcher is running

    // No watcher was started, so no need to stop
  });

  it('returns errors for AI-backed commands without GEMINI_API_KEY', async () => {
    // prepare a dummy PRD file
    const prd = path.join(workspace, 'dummy_prd.md');
    fs.writeFileSync(prd, '# PRD\n\n- Feature: Something');
    const res = await runCli(['parse-prd', prd], { cwd: workspace, env: { GEMINI_API_KEY: '' } });
    expect(res.code).to.not.equal(0);
    expect(res.stderr).to.match(/GEMINI_API_KEY|Error parsing PRD/i);
  });
});
