const { expect } = require('chai');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');

const TEST_WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'acf-e2e-test-'));
const ACF_ROOT = path.resolve(__dirname, '../../');
const MCP_SERVER_PATH = path.join(ACF_ROOT, 'src', 'mcp_server.js');
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess;

describe('MCP Server E2E Tests', () => {
    before(done => {
        fs.writeFileSync(path.join(TEST_WORKSPACE, 'config.json'), JSON.stringify({ MCP_PORT: PORT, WORKSPACE: TEST_WORKSPACE }));
        
        serverProcess = spawn('node', [MCP_SERVER_PATH], { cwd: ACF_ROOT, env: { ...process.env, ACF_WORKSPACE: TEST_WORKSPACE } });

        const serverReady = (data) => {
            if (data.toString().includes('Server ready and listening')) {
                done();
            }
        };
        
        serverProcess.stdout.on('data', serverReady);
        serverProcess.stderr.on('data', serverReady);
    });

    after(() => {
        serverProcess.kill();
        fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
    });

    it('should initialize a project via HTTP', async () => {
        const response = await axios.post(`${BASE_URL}/tool`, {
            tool: 'initProject',
            parameters: { projectName: 'E2E Test Project' }
        });
        expect(response.status).to.equal(200);
        expect(response.data.result).to.contain('Created initial tasks file');
    });

    it('should add a task via HTTP', async () => {
        const response = await axios.post(`${BASE_URL}/tool`, {
            tool: 'addTask',
            parameters: { title: 'E2E Task', priority: 'high' }
        });
        expect(response.status).to.equal(200);
        expect(response.data.result).to.contain('Added new task');
    });
}); 