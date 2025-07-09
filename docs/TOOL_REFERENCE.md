# ACF Tool Reference Guide

## Tool Ecosystem Overview

```mermaid
mindmap
  root((ACF Tools<br/>83 Total))
    Core ACF Tools
      Task Management
        Basic Operations
          listTasks
          addTask
          updateStatus
          removeTask
        Advanced Features
          getNextTask
          generateTaskFiles
          parsePrd
          expandTask
      Priority System
        Calculation
          recalculatePriorities
          getPriorityStatistics
          getDependencyAnalysis
        Manipulation
          bumpTaskPriority
          deferTaskPriority
          prioritizeTask
          deprioritizeTask
      File Watching
        Control
          initializeFileWatcher
          stopFileWatcher
        Status
          getFileWatcherStatus
          forceSyncTaskFiles
      Templates
        Management
          getPriorityTemplates
          suggestPriorityTemplate
        Usage
          calculatePriorityFromTemplate
          addTaskWithTemplate
    File Operations
      Basic Operations
        read_file
        write_file
        copy_file
        move_file
        delete_file
      Directory Management
        list_directory
        create_directory
        tree
        search_files
      Information
        get_file_info
        list_allowed_directories
        get_filesystem_status
    Terminal Operations
      Command Execution
        execute_command
        read_output
        force_terminate
      Process Management
        list_sessions
        list_processes
        kill_process
    Browser Automation
      Navigation
        browser_navigate
        browser_navigate_back
        browser_navigate_forward
        browser_close
      Interaction
        browser_click
        browser_type
        browser_hover
        browser_drag
        browser_select_option
        browser_press_key
      Capture & Analysis
        browser_take_screenshot
        browser_snapshot
        browser_pdf_save
        browser_console_messages
        browser_network_requests
      Tab Management
        browser_tab_list
        browser_tab_new
        browser_tab_select
        browser_tab_close
      Utilities
        browser_file_upload
        browser_wait
        browser_wait_for
        browser_resize
        browser_handle_dialog
        browser_install
    Search & Edit
      search_code
      edit_block
    System Integration
      AppleScript
        applescript_execute
      Configuration
        get_config
        set_config_value
```

## Tool Categories

### 1. Core ACF Tools (33 tools)

#### Task Management Flow

```mermaid
stateDiagram-v2
    [*] --> Create: addTask
    Create --> List: listTasks
    List --> Update: updateTask
    Update --> Status: updateStatus
    Status --> Next: getNextTask
    Next --> Context: getContext
    Context --> Generate: generateTaskFiles
    Generate --> Remove: removeTask
    Remove --> [*]
    
    Create --> Subtask: addSubtask
    Subtask --> Update
    
    List --> Priority: Priority Tools
    Priority --> Recalc: recalculatePriorities
    Recalc --> Stats: getPriorityStatistics
    Stats --> Analysis: getDependencyAnalysis
    
    Create --> AI: AI Tools
    AI --> Parse: parsePrd
    Parse --> Expand: expandTask
    Expand --> Revise: reviseTasks
```

#### Priority System Tools

```mermaid
graph TD
    subgraph "Priority Calculation"
        RECALC[recalculatePriorities]
        STATS[getPriorityStatistics]
        DEPS[getDependencyAnalysis]
    end
    
    subgraph "Priority Manipulation"
        BUMP[bumpTaskPriority]
        DEFER[deferTaskPriority]
        PRIO[prioritizeTask]
        DEPRIO[deprioritizeTask]
    end
    
    subgraph "Advanced Configuration"
        TIME[configureTimeDecay]
        EFFORT[configureEffortWeighting]
        CONFIG[getAdvancedAlgorithmConfig]
    end
    
    subgraph "Template System"
        TEMPLATES[getPriorityTemplates]
        SUGGEST[suggestPriorityTemplate]
        CALC[calculatePriorityFromTemplate]
        ADD[addTaskWithTemplate]
    end
    
    RECALC --> STATS
    STATS --> DEPS
    
    BUMP --> RECALC
    DEFER --> RECALC
    PRIO --> RECALC
    DEPRIO --> RECALC
    
    TIME --> RECALC
    EFFORT --> RECALC
    CONFIG --> RECALC
    
    TEMPLATES --> SUGGEST
    SUGGEST --> CALC
    CALC --> ADD
    ADD --> RECALC
```

### 2. File Operations (12 tools)

#### File Operation Flow

```mermaid
sequenceDiagram
    participant Client
    participant Security
    participant FileTools
    participant FileSystem
    
    Client->>Security: Request file operation
    Security->>Security: Validate path
    Security->>Security: Check permissions
    
    alt Path allowed
        Security->>FileTools: Execute operation
        FileTools->>FileSystem: Perform I/O
        FileSystem-->>FileTools: Result
        FileTools->>FileTools: Format response
        FileTools-->>Security: Success
        Security-->>Client: File data/confirmation
    else Path denied
        Security-->>Client: Permission denied
    end
```

#### File Tools Hierarchy

```mermaid
graph TD
    subgraph "Basic Operations"
        READ[read_file]
        READM[read_multiple_files]
        WRITE[write_file]
        COPY[copy_file]
        MOVE[move_file]
        DELETE[delete_file]
    end
    
    subgraph "Directory Operations"
        LIST[list_directory]
        CREATE[create_directory]
        TREE[tree]
        SEARCH[search_files]
    end
    
    subgraph "Information & Security"
        INFO[get_file_info]
        ALLOWED[list_allowed_directories]
        STATUS[get_filesystem_status]
    end
    
    READ --> INFO
    WRITE --> STATUS
    COPY --> STATUS
    MOVE --> STATUS
    DELETE --> STATUS
    
    LIST --> TREE
    CREATE --> STATUS
    SEARCH --> INFO
    
    ALLOWED --> STATUS
```

### 3. Terminal Operations (6 tools)

#### Terminal Tool Workflow

```mermaid
graph LR
    subgraph "Command Execution"
        EXEC[execute_command]
        READ[read_output]
        TERM[force_terminate]
    end
    
    subgraph "Process Management"
        SESSIONS[list_sessions]
        PROCESSES[list_processes]
        KILL[kill_process]
    end
    
    EXEC --> READ
    READ --> TERM
    
    EXEC --> SESSIONS
    SESSIONS --> PROCESSES
    PROCESSES --> KILL
    
    KILL --> SESSIONS
```

### 4. Browser Automation (25 tools)

#### Browser Automation Flow

```mermaid
stateDiagram-v2
    [*] --> Install: browser_install
    Install --> Navigate: browser_navigate
    Navigate --> Interact: Interaction Tools
    Interact --> Capture: Capture Tools
    Capture --> Manage: Tab Management
    Manage --> Close: browser_close
    Close --> [*]
    
    Navigate --> Back: browser_navigate_back
    Back --> Forward: browser_navigate_forward
    Forward --> Navigate
    
    Interact --> Click: browser_click
    Click --> Type: browser_type
    Type --> Hover: browser_hover
    Hover --> Drag: browser_drag
    Drag --> Select: browser_select_option
    Select --> Key: browser_press_key
    
    Capture --> Screenshot: browser_take_screenshot
    Screenshot --> Snapshot: browser_snapshot
    Snapshot --> PDF: browser_pdf_save
    PDF --> Console: browser_console_messages
    Console --> Network: browser_network_requests
    
    Manage --> List: browser_tab_list
    List --> New: browser_tab_new
    New --> Switch: browser_tab_select
    Switch --> CloseTab: browser_tab_close
```

#### Browser Tool Categories

```mermaid
graph TD
    subgraph "Navigation Tools"
        NAV[browser_navigate]
        BACK[browser_navigate_back]
        FORWARD[browser_navigate_forward]
        INSTALL[browser_install]
    end
    
    subgraph "Interaction Tools"
        CLICK[browser_click]
        TYPE[browser_type]
        HOVER[browser_hover]
        DRAG[browser_drag]
        SELECT[browser_select_option]
        KEY[browser_press_key]
    end
    
    subgraph "Capture Tools"
        SCREENSHOT[browser_take_screenshot]
        SNAPSHOT[browser_snapshot]
        PDF[browser_pdf_save]
        CONSOLE[browser_console_messages]
        NETWORK[browser_network_requests]
    end
    
    subgraph "Management Tools"
        TABS[browser_tab_list]
        NEWTAB[browser_tab_new]
        SELTAB[browser_tab_select]
        CLOSETAB[browser_tab_close]
        UPLOAD[browser_file_upload]
        WAIT[browser_wait]
        WAITFOR[browser_wait_for]
        RESIZE[browser_resize]
        DIALOG[browser_handle_dialog]
        CLOSE[browser_close]
    end
    
    NAV --> CLICK
    CLICK --> SCREENSHOT
    SCREENSHOT --> TABS
```

### 5. Search & Edit Tools (2 tools)

#### Search and Edit Workflow

```mermaid
sequenceDiagram
    participant User
    participant SearchTool
    participant EditTool
    participant FileSystem
    
    User->>SearchTool: search_code
    SearchTool->>FileSystem: Search with ripgrep
    FileSystem-->>SearchTool: Matching results
    SearchTool-->>User: Search results
    
    User->>EditTool: edit_block
    EditTool->>EditTool: Validate replacement
    EditTool->>FileSystem: Apply changes
    FileSystem-->>EditTool: Confirmation
    EditTool-->>User: Edit result
```

### 6. System Integration Tools

#### AppleScript Integration

```mermaid
graph TD
    subgraph "AppleScript Tool"
        APPLE[applescript_execute]
    end
    
    subgraph "macOS Applications"
        NOTES[Notes]
        CALENDAR[Calendar]
        CONTACTS[Contacts]
        MAIL[Mail]
        FINDER[Finder]
        SAFARI[Safari]
        MESSAGES[Messages]
    end
    
    subgraph "System Features"
        SPOTLIGHT[Spotlight Search]
        BATTERY[Battery Status]
        NETWORK[Network Info]
        DISK[Disk Space]
        SHELL[Shell Commands]
    end
    
    APPLE --> NOTES
    APPLE --> CALENDAR
    APPLE --> CONTACTS
    APPLE --> MAIL
    APPLE --> FINDER
    APPLE --> SAFARI
    APPLE --> MESSAGES
    
    APPLE --> SPOTLIGHT
    APPLE --> BATTERY
    APPLE --> NETWORK
    APPLE --> DISK
    APPLE --> SHELL
```

#### Configuration Tools

```mermaid
graph LR
    subgraph "Configuration Management"
        GET[get_config]
        SET[set_config_value]
        STATUS[get_filesystem_status]
    end
    
    subgraph "Configuration Areas"
        SERVER[Server Settings]
        SECURITY[Security Settings]
        LOGGING[Logging Settings]
        PERFORMANCE[Performance Settings]
    end
    
    GET --> SERVER
    GET --> SECURITY
    GET --> LOGGING
    GET --> PERFORMANCE
    
    SET --> SERVER
    SET --> SECURITY
    SET --> LOGGING
    SET --> PERFORMANCE
    
    STATUS --> SECURITY
```

## Tool Usage Patterns

### Common Workflows

#### 1. Project Setup Workflow

```mermaid
sequenceDiagram
    participant User
    participant ACF
    participant FileSystem
    participant TaskManager
    
    User->>ACF: initProject
    ACF->>FileSystem: Create .acf directory
    ACF->>TaskManager: Initialize task database
    
    User->>ACF: addTask("Setup project structure")
    ACF->>TaskManager: Create task with priority
    
    User->>ACF: generateTaskFiles
    ACF->>FileSystem: Create task markdown files
    
    User->>ACF: generateTaskTable
    ACF->>FileSystem: Create tasks-table.md
```

#### 2. Code Review Workflow

```mermaid
sequenceDiagram
    participant Reviewer
    participant ACF
    participant FileSystem
    participant Browser
    
    Reviewer->>ACF: search_code("TODO")
    ACF->>FileSystem: Search for TODO comments
    FileSystem-->>ACF: Found TODOs
    
    loop For each TODO
        Reviewer->>ACF: addTask(TODO description)
        ACF->>ACF: Create task with appropriate priority
    end
    
    Reviewer->>ACF: browser_navigate(staging_url)
    ACF->>Browser: Open staging site
    
    Reviewer->>ACF: browser_take_screenshot
    ACF->>Browser: Capture screenshot
    Browser-->>ACF: Screenshot saved
```

#### 3. Deployment Workflow

```mermaid
sequenceDiagram
    participant CI/CD
    participant ACF
    participant Terminal
    participant TaskManager
    
    CI/CD->>ACF: addTask("Deploy v1.2.3")
    ACF->>TaskManager: Create deployment task
    
    CI/CD->>ACF: updateStatus(task_id, "inprogress")
    ACF->>TaskManager: Update task status
    
    CI/CD->>ACF: execute_command("npm test")
    ACF->>Terminal: Run tests
    Terminal-->>ACF: Test results
    
    alt Tests pass
        CI/CD->>ACF: updateStatus(task_id, "done")
        CI/CD->>ACF: addTask("Monitor deployment")
    else Tests fail
        CI/CD->>ACF: updateStatus(task_id, "error")
        CI/CD->>ACF: addTask("Fix failing tests", priority="high")
    end
```

## Tool Performance Characteristics

### Response Time Categories

```mermaid
graph TD
    subgraph "Fast Tools (< 100ms)"
        FAST[listTasks<br/>updateStatus<br/>getNextTask<br/>get_config]
    end
    
    subgraph "Medium Tools (100-500ms)"
        MEDIUM[read_file<br/>write_file<br/>execute_command<br/>search_files]
    end
    
    subgraph "Slow Tools (500ms+)"
        SLOW[browser_navigate<br/>search_code<br/>recalculatePriorities<br/>expandTask]
    end
    
    subgraph "Variable Tools"
        VARIABLE[parsePrd<br/>applescript_execute<br/>browser_take_screenshot]
    end
    
    FAST --> |Cached/Memory| RESULT[Tool Result]
    MEDIUM --> |File I/O| RESULT
    SLOW --> |Complex Processing| RESULT
    VARIABLE --> |External Dependencies| RESULT
```

### Resource Usage Patterns

```mermaid
graph LR
    subgraph "CPU Intensive"
        CPU[search_code<br/>recalculatePriorities<br/>getDependencyAnalysis]
    end
    
    subgraph "Memory Intensive"
        MEM[read_multiple_files<br/>browser_snapshot<br/>tree]
    end
    
    subgraph "I/O Intensive"
        IO[write_file<br/>copy_file<br/>generateTaskFiles]
    end
    
    subgraph "Network Intensive"
        NET[browser_navigate<br/>browser_network_requests<br/>parsePrd]
    end
    
    CPU --> |Optimize algorithms| PERF[Performance]
    MEM --> |Stream processing| PERF
    IO --> |Async operations| PERF
    NET --> |Connection pooling| PERF
```

## Error Handling Patterns

### Tool Error Categories

```mermaid
graph TD
    subgraph "Input Errors"
        VALIDATION[Validation Errors]
        SCHEMA[Schema Errors]
        PARAMS[Parameter Errors]
    end
    
    subgraph "System Errors"
        PERMISSION[Permission Denied]
        NOTFOUND[File Not Found]
        TIMEOUT[Operation Timeout]
    end
    
    subgraph "External Errors"
        NETWORK[Network Errors]
        SERVICE[Service Unavailable]
        BROWSER[Browser Errors]
    end
    
    subgraph "Recovery Strategies"
        RETRY[Retry Logic]
        FALLBACK[Fallback Options]
        GRACEFUL[Graceful Degradation]
    end
    
    VALIDATION --> RETRY
    SCHEMA --> FALLBACK
    PARAMS --> GRACEFUL
    
    PERMISSION --> FALLBACK
    NOTFOUND --> GRACEFUL
    TIMEOUT --> RETRY
    
    NETWORK --> RETRY
    SERVICE --> FALLBACK
    BROWSER --> GRACEFUL
```

This tool reference provides comprehensive documentation for all 83 tools in the ACF ecosystem, including their relationships, workflows, and usage patterns.
