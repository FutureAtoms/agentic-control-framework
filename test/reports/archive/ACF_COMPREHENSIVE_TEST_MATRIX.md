# ACF CLI Comprehensive Test Matrix - Ultra Testing Framework

## Test Matrix Version 1.0 - Initial Draft
Generated: 2025-09-17
Status: Draft for Agent Review

## I. Core Command Testing

### 1. Project Initialization Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| INIT-001 | `acf init` | Initialize in empty directory | Creates .acf directory with tasks.json | Critical |
| INIT-002 | `acf init --project-name "Test"` | Init with project name | Creates project with specified name | High |
| INIT-003 | `acf init --editor cursor` | Init with cursor editor | Generates cursor-specific files | High |
| INIT-004 | `acf init --editor claude` | Init with claude editor | Generates claude-specific files | High |
| INIT-005 | `acf init` | Re-init in existing project | Should handle gracefully or error | Medium |
| INIT-006 | `acf init --project-description "Long desc"` | Init with description | Stores description correctly | Medium |
| INIT-007 | `acf init` | Init in read-only directory | Proper error handling | Low |
| INIT-008 | `acf init --editor invalid` | Init with invalid editor | Should reject invalid option | Medium |

### 2. Task Management Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| TASK-001 | `acf add` | Add task without title | Should prompt or error | High |
| TASK-002 | `acf add --title "Task 1"` | Add basic task | Creates task with ID | Critical |
| TASK-003 | `acf add --title "Task" --description "Desc"` | Add with description | Task created with details | High |
| TASK-004 | `acf add --title "Task" --priority high` | Add with priority | Task created with priority | High |
| TASK-005 | `acf add --title "Task" --priority 850` | Add with numeric priority | Task created with specific priority | Medium |
| TASK-006 | `acf add --title "Task" --depends-on 1,2` | Add with dependencies | Task created with dependencies | High |
| TASK-007 | `acf add --title "Task" --related-files "*.js"` | Add with files | Task linked to files | Medium |
| TASK-008 | `acf add --title "Task" --tests "test1,test2"` | Add with tests | Task includes test specs | Medium |
| TASK-009 | `acf add --title ""` | Add with empty title | Should reject empty title | High |
| TASK-010 | `acf add --title "Very long title..."` | Add with 500+ char title | Should handle or truncate | Low |

### 3. Subtask Management Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| SUB-001 | `acf add-subtask 1` | Add subtask without title | Should prompt or error | High |
| SUB-002 | `acf add-subtask 1 --title "Subtask"` | Add basic subtask | Creates subtask 1.1 | Critical |
| SUB-003 | `acf add-subtask 999` | Add to non-existent parent | Should error gracefully | High |
| SUB-004 | `acf add-subtask 1.1 --title "Nested"` | Add nested subtask | Creates subtask 1.1.1 | Medium |
| SUB-005 | `acf add-subtask 1 --related-files "*.md"` | Subtask with files | Links files to subtask | Medium |
| SUB-006 | `acf add-subtask invalid` | Invalid parent ID | Should reject invalid ID | High |

### 4. Status Update Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| STATUS-001 | `acf status 1 inprogress` | Update task status | Status changes to inprogress | Critical |
| STATUS-002 | `acf status 1.1 done` | Update subtask status | Subtask marked as done | Critical |
| STATUS-003 | `acf status 999 todo` | Update non-existent task | Error message | High |
| STATUS-004 | `acf status 1 invalid` | Invalid status value | Should reject | High |
| STATUS-005 | `acf status 1 done --message "Completed"` | Status with message | Updates with activity log | Medium |
| STATUS-006 | `acf status` | Missing parameters | Should show help | Medium |
| STATUS-007 | All statuses | Cycle through all statuses | Each status works | High |

### 5. List and Query Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| LIST-001 | `acf list` | List all tasks | Shows all tasks | Critical |
| LIST-002 | `acf list --status todo` | Filter by status | Shows only todo tasks | High |
| LIST-003 | `acf list --format json` | JSON output | Returns valid JSON | High |
| LIST-004 | `acf list --format table` | Table output | Formats as table | Medium |
| LIST-005 | `acf list --format human` | Human readable | Shows with checkboxes | Medium |
| LIST-006 | `acf next` | Get next task | Returns highest priority todo | Critical |
| LIST-007 | `acf context 1` | Get task context | Shows full task details | High |
| LIST-008 | `acf context 1.1` | Get subtask context | Shows subtask details | Medium |

### 6. Priority Management Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| PRI-001 | `acf bump 1` | Bump priority default | Increases by 50 | High |
| PRI-002 | `acf bump 1 --amount 100` | Bump specific amount | Increases by 100 | Medium |
| PRI-003 | `acf defer 1` | Defer priority | Decreases by 50 | High |
| PRI-004 | `acf prioritize 1` | Set high priority | Sets to 850 | High |
| PRI-005 | `acf deprioritize 1` | Set low priority | Sets to 300 | High |
| PRI-006 | `acf recalculate-priorities` | Recalc all | Updates all priorities | Critical |
| PRI-007 | `acf priority-stats` | Show statistics | Displays distribution | Medium |
| PRI-008 | `acf bump 1 --amount 9999` | Exceed max | Should cap at 1000 | Medium |

### 7. Advanced Priority Algorithm Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| ALG-001 | `acf configure-time-decay --enabled` | Enable time decay | Activates algorithm | Medium |
| ALG-002 | `acf configure-time-decay --model sigmoid` | Set decay model | Changes decay curve | Low |
| ALG-003 | `acf configure-effort-weighting --enabled` | Enable effort weight | Activates weighting | Medium |
| ALG-004 | `acf show-algorithm-config` | Show configuration | Displays all settings | Medium |
| ALG-005 | `acf dependency-analysis` | Analyze dependencies | Shows critical path | High |

### 8. Template Management Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| TMPL-001 | `acf list-templates` | List all templates | Shows available templates | Medium |
| TMPL-002 | `acf suggest-template "Bug fix"` | Suggest template | Recommends bug template | Medium |
| TMPL-003 | `acf calculate-priority bug "Title"` | Calculate priority | Returns priority value | Medium |
| TMPL-004 | `acf add-with-template bug "Fix issue"` | Add with template | Creates task with template | High |

### 9. File Management Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| FILE-001 | `acf generate-files` | Generate task files | Creates tasks/ directory | High |
| FILE-002 | `acf start-file-watcher` | Start watcher | Monitors file changes | Medium |
| FILE-003 | `acf stop-file-watcher` | Stop watcher | Stops monitoring | Medium |
| FILE-004 | `acf file-watcher-status` | Check watcher | Shows status | Low |
| FILE-005 | `acf force-sync` | Force sync | Synchronizes all files | Medium |

### 10. PRD and AI Integration Tests
| Test ID | Command | Scenario | Expected Result | Priority |
|---------|---------|----------|-----------------|----------|
| AI-001 | `acf parse-prd test.md` | Parse PRD file | Generates tasks from PRD | High |
| AI-002 | `acf expand-task 1` | Expand task to subtasks | Creates subtasks via AI | High |
| AI-003 | `acf revise-tasks 1 --prompt "Change"` | Revise future tasks | Updates tasks via AI | Medium |
| AI-004 | `acf parse-prd non-existent.md` | Parse missing file | Error handling | Medium |

## II. Edge Cases and Error Scenarios

### 1. Boundary Value Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| EDGE-001 | Create 1000+ tasks | Should handle large datasets | Medium |
| EDGE-002 | Create deeply nested subtasks (10+ levels) | Should handle or limit | Low |
| EDGE-003 | Task with 100+ dependencies | Should process correctly | Low |
| EDGE-004 | Circular dependencies | Should detect and prevent | High |
| EDGE-005 | Empty tasks.json | Should handle gracefully | High |
| EDGE-006 | Corrupted tasks.json | Should error with recovery | High |
| EDGE-007 | Unicode in task titles | Should support unicode | Medium |
| EDGE-008 | Special chars in titles (<>&"') | Should escape properly | High |

### 2. Concurrent Operation Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| CONC-001 | Multiple simultaneous adds | Should handle safely | High |
| CONC-002 | Read while writing | Should not corrupt | High |
| CONC-003 | Multiple status updates | Should queue properly | Medium |
| CONC-004 | Watcher + manual edits | Should sync correctly | Medium |

### 3. Permission and Environment Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| PERM-001 | No write permissions | Graceful error | Medium |
| PERM-002 | No read permissions | Graceful error | Medium |
| PERM-003 | Disk full scenario | Handle gracefully | Low |
| PERM-004 | Network issues (for AI features) | Timeout and retry | Medium |

## III. Integration Tests

### 1. MCP Server Integration
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| MCP-001 | Start MCP server | Server starts successfully | Critical |
| MCP-002 | Execute all MCP tools | Each tool responds | Critical |
| MCP-003 | MCP error handling | Graceful errors | High |
| MCP-004 | MCP resource listing | Lists all resources | Medium |

### 2. File System Tool Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| FS-001 | Read file | Reads correctly | Critical |
| FS-002 | Write file | Writes correctly | Critical |
| FS-003 | Create directory | Creates directory | High |
| FS-004 | Search files | Finds matching files | High |
| FS-005 | Tree structure | Returns correct tree | Medium |

### 3. Browser Tool Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| BROWSER-001 | Navigate to URL | Loads page | High |
| BROWSER-002 | Take screenshot | Captures image | Medium |
| BROWSER-003 | Click element | Performs click | High |
| BROWSER-004 | Type text | Enters text | High |
| BROWSER-005 | Tab management | Creates/switches tabs | Medium |

### 4. Terminal Tool Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| TERM-001 | Execute command | Runs command | Critical |
| TERM-002 | Command timeout | Times out properly | High |
| TERM-003 | Kill process | Terminates process | Medium |
| TERM-004 | List processes | Shows processes | Medium |

## IV. Performance and Load Tests

### 1. Performance Benchmarks
| Test ID | Scenario | Target | Priority |
|---------|----------|--------|----------|
| PERF-001 | Add 100 tasks | < 5 seconds | Medium |
| PERF-002 | List 1000 tasks | < 1 second | Medium |
| PERF-003 | Recalculate 500 priorities | < 3 seconds | Low |
| PERF-004 | Generate 100 task files | < 10 seconds | Low |

### 2. Memory Usage Tests
| Test ID | Scenario | Target | Priority |
|---------|----------|--------|----------|
| MEM-001 | Load large tasks.json (10MB) | < 100MB RAM | Medium |
| MEM-002 | File watcher for 24 hours | No memory leak | Medium |
| MEM-003 | 1000 concurrent operations | Stable memory | Low |

## V. Compatibility Tests

### 1. Node Version Tests
| Test ID | Version | Expected Result | Priority |
|---------|---------|-----------------|----------|
| NODE-001 | Node 18.x | Full compatibility | Critical |
| NODE-002 | Node 20.x | Full compatibility | High |
| NODE-003 | Node 22.x | Full compatibility | Medium |

### 2. OS Compatibility Tests
| Test ID | OS | Expected Result | Priority |
|---------|-----|-----------------|----------|
| OS-001 | macOS | Full compatibility | Critical |
| OS-002 | Linux | Full compatibility | High |
| OS-003 | Windows | Core features work | Medium |

### 3. Editor Integration Tests
| Test ID | Editor | Expected Result | Priority |
|---------|--------|-----------------|----------|
| EDITOR-001 | Cursor | Full integration | High |
| EDITOR-002 | Claude Desktop | Full integration | High |
| EDITOR-003 | VS Code | Basic compatibility | Medium |

## VI. Security Tests

### 1. Input Validation Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| SEC-001 | SQL injection in task title | Properly escaped | High |
| SEC-002 | Path traversal in file ops | Blocked | High |
| SEC-003 | Command injection | Prevented | Critical |
| SEC-004 | XSS in task description | Sanitized | Medium |

### 2. Permission Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| SEC-005 | Access outside workspace | Denied | High |
| SEC-006 | Execute blocked commands | Prevented | High |
| SEC-007 | Read sensitive files | Restricted | High |

## VII. User Experience Tests

### 1. Help and Documentation Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| UX-001 | `acf --help` | Shows comprehensive help | High |
| UX-002 | `acf <command> --help` | Shows command help | High |
| UX-003 | Invalid command | Suggests alternatives | Medium |
| UX-004 | Missing parameters | Clear error message | High |

### 2. Output Format Tests
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| UX-005 | Colored output | Displays correctly | Low |
| UX-006 | Progress indicators | Shows progress | Medium |
| UX-007 | Error messages | Clear and actionable | High |
| UX-008 | Success confirmations | Provides feedback | Medium |

## VIII. Regression Tests

### 1. Previous Bug Fixes
| Test ID | Scenario | Expected Result | Priority |
|---------|----------|-----------------|----------|
| REG-001 | Duplicate task IDs | No duplicates created | High |
| REG-002 | Lost subtasks on update | Subtasks preserved | High |
| REG-003 | Priority overflow | Capped at 1000 | Medium |
| REG-004 | File corruption on crash | Recovery possible | High |

## IX. Test Execution Plan

### Phase 1: Critical Path (Must Pass)
1. INIT-001, TASK-002, STATUS-001, LIST-001
2. MCP-001, MCP-002, FS-001, FS-002
3. TERM-001, NODE-001, OS-001

### Phase 2: Core Functionality
1. All TASK-* tests
2. All SUB-* tests
3. All STATUS-* tests
4. All LIST-* tests

### Phase 3: Advanced Features
1. All PRI-* tests
2. All AI-* tests
3. All TMPL-* tests
4. All FILE-* tests

### Phase 4: Edge Cases and Performance
1. All EDGE-* tests
2. All PERF-* tests
3. All CONC-* tests

### Phase 5: Integration and Security
1. All remaining MCP-* tests
2. All BROWSER-* tests
3. All SEC-* tests

## X. Test Automation Strategy

### 1. Automated Test Suites
- Unit tests for core functions
- Integration tests for MCP tools
- End-to-end CLI command tests
- Performance benchmarks

### 2. Manual Test Requirements
- Browser interaction tests
- UI/UX evaluation
- Error message clarity
- Cross-platform testing

## XI. Success Criteria

### Minimum Viable Testing (MVP)
- 100% pass rate for Critical priority tests
- 95% pass rate for High priority tests
- No data corruption scenarios
- No security vulnerabilities

### Comprehensive Testing
- 100% pass rate for Critical and High
- 90% pass rate for Medium
- Performance targets met
- All platforms tested

## XII. Known Limitations and Exclusions

1. Not testing third-party integrations beyond basic connectivity
2. Not testing with non-standard shells
3. Not testing internationalization beyond Unicode support
4. Not testing with network latencies > 5 seconds

---

## Revision History
- v1.0: Initial comprehensive test matrix
- Next: Agent review and refinement
- Target: Execute all scenarios in temporary workspace

## Test Execution Checklist
- [ ] Set up temporary test workspace
- [ ] Initialize test data sets
- [ ] Prepare test automation scripts
- [ ] Document test results
- [ ] Generate test report
- [ ] Clean up test artifacts