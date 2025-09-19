const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

describe('MCP Client Config Templates', function () {
  it('Claude Desktop config (claude.json) is present and valid', function () {
    const p = path.join(__dirname, '../../claude.json');
    expect(fs.existsSync(p)).to.equal(true, 'claude.json missing');
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    expect(cfg).to.have.property('mcpServers');
    const server = cfg.mcpServers['agentic-control-framework'];
    expect(server).to.be.an('object');
    expect(server).to.have.property('command');
    expect(server).to.have.property('args');
  });

  it('Claude Code (VSCode) example config is present and valid', function () {
    const p = path.join(__dirname, '../../config/examples/claude_code.json');
    expect(fs.existsSync(p)).to.equal(true, 'claude_code.json missing');
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    expect(cfg).to.have.property('mcpServers');
    const server = cfg.mcpServers['agentic-control-framework'];
    expect(server).to.be.an('object');
    expect(server.command).to.equal('node');
    expect(server.args).to.be.an('array');
    expect(server.args[0]).to.match(/agentic-control-framework-mcp$/);
  });

  it('Cursor mcp.json example is present and valid with type=stdio', function () {
    const p = path.join(__dirname, '../../config/examples/cursor.mcp.json');
    expect(fs.existsSync(p)).to.equal(true, 'cursor.mcp.json missing');
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
    const server = cfg.mcpServers['agentic-control-framework'];
    expect(server).to.be.an('object');
    expect(server.type).to.equal('stdio');
    expect(server.command).to.equal('node');
    expect(server.args).to.be.an('array');
    // ensure the bin path is referenced in args
    expect(server.args.some(a => typeof a === 'string' && a.includes('agentic-control-framework-mcp'))).to.equal(true);
  });

  it('Codex CLI TOML includes mcp_servers entry', function () {
    const p = path.join(__dirname, '../../config/examples/codex.config.toml');
    expect(fs.existsSync(p)).to.equal(true, 'codex.config.toml missing');
    const text = fs.readFileSync(p, 'utf8');
    // Simple checks without a TOML parser
    expect(text).to.match(/\[mcp_servers\.agentic-control-framework\]/);
    expect(text).to.match(/command\s*=\s*"node"/);
    expect(text).to.match(/agentic-control-framework-mcp/);
  });
});

