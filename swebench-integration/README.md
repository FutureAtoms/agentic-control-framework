# SWE-bench Integration with ACF MCP

This integration allows you to run SWE-bench evaluations using the Agentic Control Framework (ACF) MCP server, leveraging its 80+ tools for autonomous code editing, file management, and terminal operations.

## Prerequisites

1. **ACF MCP Setup** (already installed in parent directory)
2. **Python 3.8+** with pip
3. **Docker** installed and running
4. **Node.js 18+** (for ACF MCP server)

## Installation Steps

### 1. Clone and Install SWE-bench

```bash
# From this directory
git clone https://github.com/princeton-nlp/SWE-bench.git
cd SWE-bench
pip install -e .
cd ..
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure ACF MCP Server

The ACF MCP server is already configured in the parent directory. Ensure it's running:

```bash
cd ..
npm run start:mcp
```

## Architecture Overview

```
┌─────────────────┐
│   SWE-bench     │
│   Test Suite    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ACF-SWE Agent  │ ◄─── Your custom agent using ACF tools
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ACF MCP       │
│    Server       │
├─────────────────┤
│ • File ops      │
│ • Code search   │
│ • Edit blocks   │
│ • Terminal      │
│ • Task manager  │
└─────────────────┘
```

## Key Features

### ACF Tools for SWE-bench

1. **Code Analysis & Search**
   - `search_code`: Ripgrep-powered code search
   - `read_file`: Read source files
   - `tree`: Explore project structure

2. **Code Modification**
   - `edit_block`: Surgical text replacements
   - `write_file`: Create new files
   - `str_replace`: Replace unique strings

3. **Test Execution**
   - `execute_command`: Run tests with timeout
   - `list_processes`: Monitor running processes
   - `read_output`: Stream command output

4. **Task Management**
   - `addTask`: Break down complex fixes
   - `updateStatus`: Track progress
   - `getNextTask`: Prioritize work

## Usage Examples

### Basic Evaluation Run

```python
python run_evaluation.py \
    --dataset_name princeton-nlp/SWE-bench_Lite \
    --num_workers 4 \
    --max_instances 10
```

### With Custom Agent Strategy

```python
python run_evaluation.py \
    --dataset_name princeton-nlp/SWE-bench_Lite \
    --agent_strategy advanced \
    --use_task_manager \
    --max_retries 3
```

### Test Single Instance

```python
python test_single.py \
    --instance_id sympy__sympy-20590 \
    --verbose
```

## Configuration

Edit `config.yaml` to customize:
- ACF MCP server URL and port
- Docker settings
- Timeout values
- Agent strategies
- Tool preferences

## Monitoring & Debugging

1. **ACF Task Dashboard**: Track task progress in real-time
2. **Logs**: Check `logs/` directory for detailed execution logs
3. **Metrics**: View performance metrics in `metrics/`

## Tips for Best Results

1. **Use Task Decomposition**: Let ACF break down complex issues into subtasks
2. **Leverage Code Search**: Use ripgrep for efficient codebase exploration
3. **Incremental Testing**: Run tests frequently to validate changes
4. **Monitor Resources**: ACF provides process management tools

## Troubleshooting

### Common Issues

1. **MCP Server Not Running**
   ```bash
   cd .. && npm run start:mcp
   ```

2. **Docker Permission Issues**
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Port Conflicts**
   - Check if port 3000 is available
   - Update `config.yaml` if needed

## Advanced Features

### Custom Tool Chains

Create custom tool chains for specific problem types:

```python
# In agent_strategies.py
def create_debug_chain():
    return [
        'search_code',    # Find the bug
        'addTask',        # Plan the fix
        'edit_block',     # Apply changes
        'execute_command', # Run tests
    ]
```

### Parallel Execution

ACF supports parallel file operations and task execution:

```python
# Enable in config.yaml
parallel:
  enabled: true
  max_workers: 8
```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

- **Issues**: [GitHub Issues](https://github.com/FutureAtoms/agentic-control-framework/issues)
- **Documentation**: [ACF Docs](../docs/)
- **SWE-bench**: [Official Site](https://www.swebench.com)
