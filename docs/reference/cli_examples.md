# ACF CLI — Complete Examples

This document shows end‑to‑end examples for every ACF CLI command. Outputs are representative; IDs, timestamps, and paths may differ on your machine.

Prerequisites
- From repo root: `cd agentic-control-framework && npm ci && chmod +x bin/*`
- Run commands from your desired workspace directory.
- Disable colors in samples by exporting `NO_COLOR=1`.

Conventions
- CLI binary: `./bin/acf` (or `acf` if linked globally)
- Workspace: current working directory (CWD)

## Init & Basics

### init
Initialize the project in the current directory.

Command
```
./bin/acf init --project-name "Demo" --project-description "Getting started"
```
Sample output
```
✅ Project initialized at /path/to/workspace
📄 Created .acf/tasks.json
🗂  You can now start adding tasks.
```

### add
Create a new task.

Command
```
./bin/acf add -t "Implement login" -d "JWT + refresh" -p high
```
Sample output
```
✅ Added new task (ID: 1): "Implement login"
```

With dependencies/files/tests
```
./bin/acf add -t "API auth" -d "Token verify" -p 650 \
  --depends-on 1 --related-files src/auth.js,src/jwt.js --tests "npm test auth"
```

### list
List tasks in different formats.

Commands
```
./bin/acf list               # default
./bin/acf list --human       # human‑readable
./bin/acf list --table       # table
./bin/acf list --json        # raw JSON
```
Sample output (human)
```
[TODO] #1 (700) Implement login — JWT + refresh
[TODO] #2 (650) API auth — Token verify (depends on: 1)
```

## Subtasks & Status

### add-subtask
Add a subtask to a parent.

Command
```
./bin/acf add-subtask 1 -t "Add unit tests" --related-files test/auth.test.js
```
Sample output
```
✅ Added new subtask (ID: 1.1) to task 1: "Add unit tests"
```

### status
Update status for a task or subtask.

Commands
```
./bin/acf status 1 inprogress --message "Starting implementation"
./bin/acf status 1 done --related-files src/auth.js --message "PR merged"
```
Sample output
```
Status of task 1 updated to inprogress.
```

## Planning & Updates

### next
Get the next actionable task (priority + dependency aware).

Command
```
./bin/acf next
```
Sample output
```
✅ Next actionable task: #2 API auth (priority 650)
```

### update
Update fields on a task.

Command
```
./bin/acf update 1 --title "Login service" --priority 750 \
  --related-files src/login.js --message "Renamed for clarity"
```
Sample output
```
Task 1 updated successfully.
```

### remove
Remove task or subtask.

Commands
```
./bin/acf remove 1.1
./bin/acf remove 2
```
Sample output
```
Removed task/subtask "Add unit tests" (ID: 1.1).
```

### context
Show detailed context.

Command
```
./bin/acf context 1
```
Sample output
```
Task Context for 1: Login service
Status: inprogress
Priority: 750
Related files:
 - src/login.js
Activity Log:
 - [time] Title updated to: "Login service"
 - [time] Status updated to inprogress
```

### generate-files
Materialize per‑task Markdown files into `tasks/`.

Command
```
./bin/acf generate-files
```
Sample output
```
✅ Generated task files in ./tasks
```

## AI‑Backed (optional)
Requires `GEMINI_API_KEY`. Without it, commands return a clear error.

### parse-prd
```
GEMINI_API_KEY=... ./bin/acf parse-prd docs/prd.md
```
Sample output without key
```
Error parsing PRD: Missing GEMINI_API_KEY
```

### expand-task
```
GEMINI_API_KEY=... ./bin/acf expand-task 1
```
Sample output without key
```
Error expanding task: Missing GEMINI_API_KEY
```

### revise-tasks
```
GEMINI_API_KEY=... ./bin/acf revise-tasks 1 --message "Scope reduced to MVP"
```
Sample output without key
```
Error revising tasks: Missing GEMINI_API_KEY
```

## Priority Controls

### bump
Increase priority by N.
```
./bin/acf bump 1 --amount 50
```
Sample output
```
Task 1 priority bumped from 750 to 800
```

### defer
Decrease priority by N.
```
./bin/acf defer 1 --amount 25
```
Sample output
```
Task 1 priority deferred from 800 to 775
```

### prioritize
Force into high band (800–900).
```
./bin/acf prioritize 1 --priority 880
```
Sample output
```
Task 1 prioritized to 880
```

### deprioritize
Force into low band (100–400).
```
./bin/acf deprioritize 1 --priority 150
```
Sample output
```
Task 1 deprioritized to 150
```

### recalculate-priorities
Re‑run algorithms.
```
./bin/acf recalculate-priorities --dependency-boosts --time-decay --effort-weighting
```
Sample output
```
Recalculated priorities successfully.
Adjustments made:
  Task 1: 150 → 540 (dependency-boost)
```

### priority-stats
```
./bin/acf priority-stats
```
Sample output
```
📊 Priority Statistics:
Total tasks: 3
Priority range: 150 - 880
Average priority: 523
Distribution:
  🔥 Critical (800+): 1
  🔴 High (600-799): 1
  🟡 Medium (400-599): 1
  🟢 Low (<400): 0
```

### dependency-analysis
```
./bin/acf dependency-analysis
```
Sample output
```
🔗 Dependency Analysis:
Total tasks: 3
Tasks with dependencies: 1
Root tasks (no dependencies): 2
Leaf tasks (no dependents): 1
Critical paths: 1
Longest dependency chain: 2 tasks
```

## Algorithm Config

### configure-time-decay
Enable + set parameters.
```
./bin/acf configure-time-decay --enable --model exponential --rate 0.02 --threshold 5 --max-boost 100 --priority-weight
```
Sample output
```
Time decay configuration updated
```

### configure-effort-weighting
Enable + set weights.
```
./bin/acf configure-effort-weighting --enable --score-weight 0.5 --complexity-weight 0.2 --impact-weight 0.2 --urgency-weight 0.1 --decay-rate 0.01 --boost-threshold 0.6
```
Sample output
```
Effort weighting configuration updated
```

### show-algorithm-config
```
./bin/acf show-algorithm-config
```
Sample output
```
Advanced algorithm configuration:
 - Time Decay: enabled (exponential, rate 0.02)
 - Effort Weighting: enabled (scoreWeight 0.5)
 - Available Models: linear, exponential, logarithmic, sigmoid, adaptive
```

## File Watcher

### start-file-watcher
```
./bin/acf start-file-watcher --debounce-delay 300 --enable-task-files --enable-table-sync --enable-priority-recalc
```
Sample output
```
File watcher initialized successfully
```

### file-watcher-status
```
./bin/acf file-watcher-status
```
Sample output
```
Watcher status: active
```

### stop-file-watcher
```
./bin/acf stop-file-watcher
```
Sample output
```
File watcher stopped successfully
```

### force-sync
Force re-sync of all task files.
```
./bin/acf force-sync
```
Sample output
```
Task files synchronized successfully
```

## Templates

### list-templates
```
./bin/acf list-templates
```
Sample output
```
Available templates: bugfix, refactor, feature, test, chore, docs
```

### suggest-template
```
./bin/acf suggest-template "Refactor auth module" "Remove legacy session code"
```
Sample output
```
Suggested template: refactor
```

### calculate-priority
```
./bin/acf calculate-priority "refactor" "Refactor auth" "Remove legacy" --tags security,backend
```
Sample output
```
Calculated priority: 640 (template refactor)
```

### add-with-template
```
./bin/acf add-with-template "bugfix" "Fix login redirect" "Safari login not redirecting" \
  --tags web,auth --depends-on 2,3 --related-files src/login.js,src/router.js
```
Sample output
```
✅ Added new task (ID: 4): "Fix login redirect"
```

---

Tips
- Append `--message "..."` to `status` or `update` to persist a log entry in `.acf/tasks.json` (persistent memory).
- For MCP usage and IDE configs, see `docs/INTEGRATIONS.md` and `config/examples/`.

