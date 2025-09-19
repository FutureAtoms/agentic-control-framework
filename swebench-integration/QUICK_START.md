# Quick Start Guide: SWE-bench with ACF MCP

## 🚀 Get Started in 5 Minutes

### Step 1: Run Setup
```bash
cd /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework/swebench-integration
./setup.sh
```

### Step 2: Start ACF MCP Server
In one terminal:
```bash
cd /Users/abhilashchadhar/uncloud/acf-sep/agentic-control-framework
npm run start:mcp
```

### Step 3: Run Your First Evaluation
In another terminal:
```bash
cd swebench-integration
source venv/bin/activate

# Test a single instance first
python test_single.py sympy__sympy-20590 --verbose

# Or run a small evaluation
python run_evaluation.py --max-instances 3 --agent-strategy advanced
```

## 📊 What You Get

The integration provides:
- **80+ ACF Tools** for autonomous code editing
- **Task Management** for breaking down complex problems
- **Code Search** with ripgrep for fast codebase exploration
- **Surgical Edits** with edit_block for precise changes
- **Process Management** for running tests safely
- **Multiple Strategies** (basic, advanced, custom, hybrid)

## 🎯 Key Commands

### Basic Evaluation
```bash
python run_evaluation.py \
    --dataset-name princeton-nlp/SWE-bench_Lite \
    --max-instances 10 \
    --agent-strategy basic
```

### Advanced with Task Management
```bash
python run_evaluation.py \
    --dataset-name princeton-nlp/SWE-bench_Lite \
    --max-instances 10 \
    --agent-strategy advanced \
    --use-task-manager
```

### Test Single Instance
```bash
python test_single.py django__django-11099 --verbose
```

### Custom Configuration
```bash
python run_evaluation.py --config custom_config.yaml
```

## 🔧 Configuration

Edit `config.yaml` to customize:
- Agent strategies
- Tool preferences
- Docker settings
- Parallel execution
- Logging levels

## 📁 Project Structure

```
swebench-integration/
├── README.md              # Full documentation
├── QUICK_START.md        # This file
├── setup.sh              # Automated setup script
├── requirements.txt      # Python dependencies
├── config.yaml          # Configuration
├── run_evaluation.py    # Main evaluation runner
├── test_single.py       # Single instance tester
├── agent_strategies.py  # Strategy implementations
├── results/            # Evaluation outputs
├── logs/              # Execution logs
└── metrics/           # Performance metrics
```

## 🎨 Agent Strategies

### Basic Strategy
- Simple search → read → edit → test workflow
- Good for simple bug fixes
- Minimal tool usage

### Advanced Strategy
- Problem classification
- Task decomposition
- Comprehensive tool chains
- Intelligent search patterns

### Hybrid Strategy
- Analyzes problem complexity
- Chooses appropriate approach
- Multi-phase for complex problems

### Custom Strategy
- Define your own workflows
- Conditional execution
- Parallel tool execution

## 📈 Monitor Progress

1. **ACF Task Dashboard**: Real-time task tracking
2. **Console Output**: Colored progress indicators
3. **Log Files**: Detailed execution logs in `logs/`
4. **Metrics**: Performance data in `metrics/`

## 🐛 Troubleshooting

### ACF Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process if needed
kill -9 <PID>
```

### Docker Issues
```bash
# Ensure Docker is running
docker ps

# Check Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

### Python Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## 🔗 Useful Links

- [SWE-bench Official Site](https://www.swebench.com)
- [ACF GitHub](https://github.com/FutureAtoms/agentic-control-framework)
- [SWE-bench Paper](https://arxiv.org/abs/2310.06770)

## 💡 Tips for Best Results

1. **Start Small**: Test with 1-5 instances first
2. **Use Verbose Mode**: Add `--verbose` for debugging
3. **Monitor Resources**: Docker can be resource-intensive
4. **Check Logs**: Always check `logs/` for detailed info
5. **Iterate on Strategies**: Customize based on your needs

## 🤝 Contributing

Found a bug or have an improvement? Please:
1. Check existing issues
2. Create a new issue with details
3. Submit a PR with your fix

## ❓ Need Help?

- Check the full README.md
- Review config.yaml comments
- Look at agent_strategies.py examples
- Ask in GitHub Issues

---

**Happy Coding! 🎉**

Remember: This integration is a starting point. The real power comes from:
1. Integrating with an LLM for actual code generation
2. Customizing strategies for your specific needs
3. Fine-tuning the tool chains for different problem types

Start simple, iterate, and build up to more complex evaluations!
