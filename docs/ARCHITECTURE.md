# ACF Architecture Documentation

**Author:** Abhilash Chadhar (FutureAtoms)
**Last Updated:** January 2025

## System Overview

The Agentic Control Framework (ACF) is designed as a modular, scalable system that provides autonomous agent capabilities through multiple interfaces and deployment modes.

## High-Level Architecture

```mermaid
graph TB
    subgraph "User Interfaces"
        CLI[CLI Interface]
        CC[Claude Code]
        CD[Claude Desktop]
        CU[Cursor IDE]
        VS[VS Code]
        WEB[Web Clients]
    end
    
    subgraph "Protocol & Transport Layer"
        MCP[MCP Protocol 2025-03-26]
        HTTP[HTTP Transport]
        SSE[Server-Sent Events]
        STDIO[STDIO Transport]
        PROXY[mcp-proxy]
    end
    
    subgraph "ACF Core System"
        MS[MCP Server]
        TM[Task Manager Core]
        PE[Priority Engine]
        FW[File Watcher]
        LOG[Logger]
        SEC[Security Layer]
    end
    
    subgraph "Tool Ecosystem"
        CT[Core ACF Tools]
        FT[File Operations]
        TT[Terminal Tools]
        BT[Browser Automation]
        ST[Search & Edit]
        AT[AppleScript]
        CFT[Configuration]
    end
    
    subgraph "Data & Storage"
        DB[Task Database JSON]
        FS[File System]
        CACHE[Priority Cache]
        LOGS[Log Files]
    end
    
    subgraph "External Systems"
        BR[Browser Engine]
        OS[Operating System]
        AI[AI Services]
        CLOUD[Cloud Platforms]
    end
    
    CLI --> TM
    CC --> MCP
    CD --> MCP
    CU --> MCP
    VS --> MCP
    WEB --> HTTP
    
    MCP --> MS
    HTTP --> PROXY
    SSE --> PROXY
    STDIO --> MS
    PROXY --> MS
    
    MS --> TM
    MS --> PE
    MS --> FW
    MS --> LOG
    MS --> SEC
    
    TM --> CT
    MS --> FT
    MS --> TT
    MS --> BT
    MS --> ST
    MS --> AT
    MS --> CFT
    
    CT --> DB
    FT --> FS
    TT --> OS
    BT --> BR
    PE --> CACHE
    LOG --> LOGS
    FW --> FS
    
    CT --> AI
    MS --> CLOUD
```

## Core Components

### 1. MCP Server (`src/mcp_server.js`)

The central hub that implements the MCP protocol and coordinates all tool operations.

```mermaid
graph LR
    subgraph "MCP Server"
        INIT[Initialize]
        TOOLS[Tools Registry]
        CALL[Tool Calls]
        RESP[Response Handler]
        ERR[Error Handler]
    end
    
    subgraph "Tool Categories"
        CORE[Core Tools]
        FILE[File Tools]
        TERM[Terminal Tools]
        BROWSER[Browser Tools]
        SEARCH[Search Tools]
        APPLE[AppleScript]
        CONFIG[Config Tools]
    end
    
    INIT --> TOOLS
    TOOLS --> CALL
    CALL --> RESP
    CALL --> ERR
    
    TOOLS --> CORE
    TOOLS --> FILE
    TOOLS --> TERM
    TOOLS --> BROWSER
    TOOLS --> SEARCH
    TOOLS --> APPLE
    TOOLS --> CONFIG
```

**Key Responsibilities:**
- Protocol negotiation and capability declaration
- Tool registration and discovery
- Request routing and response formatting
- Error handling and logging
- Security enforcement

### 2. Task Manager Core (`src/core.js`)

Manages task lifecycle, dependencies, and data persistence.

```mermaid
stateDiagram-v2
    [*] --> todo
    todo --> inprogress: Start Work
    todo --> blocked: Dependencies
    inprogress --> testing: Ready for Test
    inprogress --> blocked: Blocked
    testing --> done: Tests Pass
    testing --> error: Tests Fail
    testing --> inprogress: Rework Needed
    blocked --> todo: Unblocked
    blocked --> inprogress: Direct Start
    error --> inprogress: Fix Applied
    error --> todo: Reset
    done --> [*]
```

**Key Features:**
- CRUD operations for tasks and subtasks
- Status workflow management
- Dependency tracking and validation
- Activity logging and audit trail
- Data persistence and caching

### 3. Priority Engine (`src/priority_engine.js`)

Advanced priority calculation and optimization system.

```mermaid
graph TD
    subgraph "Priority Calculation"
        BASE[Base Priority<br/>1-1000]
        DEP[Dependency Boost]
        TIME[Time Decay]
        EFFORT[Effort Weighting]
        UNIQUE[Uniqueness Check]
    end
    
    subgraph "Algorithms"
        CRIT[Critical Path]
        DIST[Distribution Optimization]
        BOOST[Dependency Propagation]
        DECAY[Time-based Decay]
    end
    
    subgraph "Output"
        FINAL[Final Priority]
        STATS[Statistics]
        ANALYSIS[Dependency Analysis]
    end
    
    BASE --> DEP
    DEP --> TIME
    TIME --> EFFORT
    EFFORT --> UNIQUE
    
    UNIQUE --> CRIT
    UNIQUE --> DIST
    UNIQUE --> BOOST
    UNIQUE --> DECAY
    
    CRIT --> FINAL
    DIST --> FINAL
    BOOST --> FINAL
    DECAY --> FINAL
    
    FINAL --> STATS
    FINAL --> ANALYSIS
```

## Tool Architecture

### Tool Registration System

```mermaid
sequenceDiagram
    participant Client
    participant MCP Server
    participant Tool Registry
    participant Tool Implementation
    
    Client->>MCP Server: tools/list
    MCP Server->>Tool Registry: Get all tools
    Tool Registry->>Tool Registry: Collect tool schemas
    Tool Registry-->>MCP Server: Tool definitions
    MCP Server-->>Client: Tool list with schemas
    
    Client->>MCP Server: tools/call
    MCP Server->>Tool Registry: Route to tool
    Tool Registry->>Tool Implementation: Execute with args
    Tool Implementation->>Tool Implementation: Validate & process
    Tool Implementation-->>Tool Registry: Result
    Tool Registry-->>MCP Server: Formatted response
    MCP Server-->>Client: Tool result
```

### Security Model

```mermaid
graph TD
    subgraph "Security Layers"
        AUTH[Authentication]
        AUTHZ[Authorization]
        VALID[Input Validation]
        SANDBOX[Sandboxing]
        AUDIT[Audit Logging]
    end
    
    subgraph "File System Security"
        ALLOWED[Allowed Directories]
        READONLY[Read-only Mode]
        PERMS[Permission Checks]
        GUARD[Path Traversal Guards]
    end
    
    subgraph "Process Security"
        TIMEOUT[Command Timeouts]
        WHITELIST[Command Whitelist]
        ISOLATION[Process Isolation]
        LIMITS[Resource Limits]
    end
    
    AUTH --> AUTHZ
    AUTHZ --> VALID
    VALID --> SANDBOX
    SANDBOX --> AUDIT
    
    VALID --> ALLOWED
    VALID --> READONLY
    VALID --> PERMS
    VALID --> GUARD
    
    VALID --> TIMEOUT
    VALID --> WHITELIST
    VALID --> ISOLATION
    VALID --> LIMITS
```

## Deployment Architectures

### Local Development

```mermaid
graph LR
    subgraph "Developer Machine"
        IDE[IDE/Editor]
        ACF[ACF Local]
        FS[File System]
        TASKS[tasks.json]
    end
    
    IDE -->|MCP STDIO| ACF
    ACF -->|Read/Write| FS
    ACF -->|Persist| TASKS
```

### Cloud Deployment

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Clients]
        MOBILE[Mobile Apps]
        API[API Clients]
    end
    
    subgraph "Load Balancer"
        LB[Load Balancer]
    end
    
    subgraph "Application Layer"
        PROXY1[mcp-proxy 1]
        PROXY2[mcp-proxy 2]
        PROXY3[mcp-proxy N]
    end
    
    subgraph "ACF Instances"
        ACF1[ACF Instance 1]
        ACF2[ACF Instance 2]
        ACF3[ACF Instance N]
    end
    
    subgraph "Storage Layer"
        DB[Shared Storage]
        CACHE[Redis Cache]
        LOGS[Log Storage]
    end
    
    WEB --> LB
    MOBILE --> LB
    API --> LB
    
    LB --> PROXY1
    LB --> PROXY2
    LB --> PROXY3
    
    PROXY1 --> ACF1
    PROXY2 --> ACF2
    PROXY3 --> ACF3
    
    ACF1 --> DB
    ACF2 --> DB
    ACF3 --> DB
    
    ACF1 --> CACHE
    ACF2 --> CACHE
    ACF3 --> CACHE
    
    ACF1 --> LOGS
    ACF2 --> LOGS
    ACF3 --> LOGS
```

## Data Flow

### Task Management Flow

```mermaid
sequenceDiagram
    participant User
    participant MCP Server
    participant Task Manager
    participant Priority Engine
    participant File Watcher
    participant Storage
    
    User->>MCP Server: addTask
    MCP Server->>Task Manager: Create task
    Task Manager->>Priority Engine: Calculate priority
    Priority Engine-->>Task Manager: Priority value
    Task Manager->>Storage: Persist task
    Storage-->>Task Manager: Confirmation
    Task Manager->>File Watcher: Notify change
    File Watcher->>File Watcher: Update task files
    Task Manager-->>MCP Server: Task created
    MCP Server-->>User: Success response
```

### File Operation Flow

```mermaid
sequenceDiagram
    participant Client
    participant MCP Server
    participant Security Layer
    participant File Tools
    participant File System
    
    Client->>MCP Server: read_file
    MCP Server->>Security Layer: Validate path
    Security Layer->>Security Layer: Check permissions
    Security Layer-->>MCP Server: Authorized
    MCP Server->>File Tools: Execute read
    File Tools->>File System: Read file
    File System-->>File Tools: File content
    File Tools->>File Tools: Process & format
    File Tools-->>MCP Server: Formatted result
    MCP Server-->>Client: File content
```

## Performance Considerations

### Caching Strategy

```mermaid
graph TD
    subgraph "Cache Layers"
        L1[L1: In-Memory Cache]
        L2[L2: File System Cache]
        L3[L3: Database Cache]
    end
    
    subgraph "Cache Types"
        TASK[Task Data]
        PRIO[Priority Calculations]
        FILE[File Metadata]
        DEPS[Dependency Graph]
    end
    
    L1 --> TASK
    L1 --> PRIO
    L2 --> FILE
    L2 --> DEPS
    L3 --> TASK
    
    TASK -->|TTL: 5min| L1
    PRIO -->|TTL: 1min| L1
    FILE -->|TTL: 30min| L2
    DEPS -->|TTL: 10min| L2
```

### Scaling Patterns

- **Horizontal Scaling**: Multiple ACF instances behind load balancer
- **Vertical Scaling**: Increased resources per instance
- **Caching**: Multi-layer caching for performance
- **Async Processing**: Background task processing
- **Connection Pooling**: Efficient resource utilization

## Extension Points

### Custom Tool Development

```mermaid
graph LR
    subgraph "Tool Development"
        SCHEMA[Define Schema]
        IMPL[Implement Logic]
        REG[Register Tool]
        TEST[Test Tool]
    end
    
    subgraph "Integration"
        MCP[MCP Server]
        TOOLS[Tool Registry]
        VALID[Validation]
        EXEC[Execution]
    end
    
    SCHEMA --> IMPL
    IMPL --> REG
    REG --> TEST
    
    REG --> TOOLS
    TOOLS --> MCP
    MCP --> VALID
    VALID --> EXEC
```

### Plugin Architecture

- **Tool Plugins**: Custom tool implementations
- **Priority Plugins**: Custom priority algorithms
- **Transport Plugins**: Custom communication protocols
- **Storage Plugins**: Custom persistence layers
- **Security Plugins**: Custom authentication/authorization

This architecture provides a solid foundation for building autonomous agents while maintaining flexibility, security, and scalability.
