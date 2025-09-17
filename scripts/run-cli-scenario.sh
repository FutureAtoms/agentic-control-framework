#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WS_DIR="$ROOT_DIR/workspaces/acf-demo"
CMD="$ROOT_DIR/bin/acf"

echo "[CLI] Using workspace: $WS_DIR"
mkdir -p "$WS_DIR"
pushd "$WS_DIR" >/dev/null

chmod +x "$ROOT_DIR"/bin/* || true

echo "[CLI] init"
"$CMD" init --project-name "ACF Demo" --project-description "End-to-end CLI scenario" || true

echo "[CLI] add tasks"
"$CMD" add -t "Critical: Bootstrap project" -p critical -d "Set up repo and scaffolding"
"$CMD" add -t "High: Implement feature" -p high --depends-on 1 -d "Core feature"
"$CMD" add -t "Medium: Documentation" -p medium -d "Write docs"
"$CMD" add-subtask 1 -t "Create README"

echo "[CLI] list variants"
"$CMD" list
"$CMD" list --table
"$CMD" list --human

echo "[CLI] priority operations"
"$CMD" bump 2 --amount 25
"$CMD" defer 3 --amount 50
"$CMD" prioritize 3 --priority 880
"$CMD" deprioritize 3 --priority 120 || true
"$CMD" recalculate-priorities
"$CMD" priority-stats
"$CMD" dependency-analysis

echo "[CLI] context and next"
"$CMD" context 1 || true
"$CMD" next

echo "[CLI] status workflow"
"$CMD" status 1.1 done
"$CMD" status 1 inprogress -m "Start work"
"$CMD" status 1 testing || true
# Complete any auto-generated testing subtasks if present
for sid in 1.1 1.2 1.3 1.4; do
  "$CMD" status "$sid" done || true
done
"$CMD" status 1 done --skip-validation || true

echo "[CLI] update & templates"
"$CMD" update 2 -t "High: Implement feature X" -d "Refined scope"
"$CMD" list-templates
"$CMD" suggest-template "Add OAuth login" "security, auth"
"$CMD" calculate-priority feature "Add OAuth login" "Implement login with OAuth" --tags security,backend
"$CMD" add-with-template feature "Add OAuth login" "Implement login with OAuth" --tags security,backend --depends-on 2

echo "[CLI] files & watcher"
"$CMD" generate-files || true
"$CMD" start-file-watcher --debounce-delay 300 --max-queue-size 20 || true
sleep 0.5
"$CMD" file-watcher-status || true
"$CMD" force-sync || true
"$CMD" stop-file-watcher || true

echo "[CLI] optional Gemini features (skipped if no key)"
if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  echo "# Demo PRD" > demo.prd.md
  echo "Feature: Search" >> demo.prd.md
  "$CMD" parse-prd demo.prd.md || true
  "$CMD" expand-task 2 || true
  "$CMD" revise-tasks 2 -p "Scope changed: include filters" || true
else
  echo "[CLI] GEMINI_API_KEY not set; skipping parse-prd/expand-task/revise-tasks"
fi

echo "[CLI] cleanup and remove"
"$CMD" remove 3 || true
"$CMD" list --table

popd >/dev/null
echo "[CLI] Scenario complete"
