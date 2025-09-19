# Documentation Reorganization Plan

## Objective
Transform the current documentation structure into a clean, professional, and maintainable system following industry best practices.

## Target Structure

```
Repository Root (Minimal Documentation)
├── README.md                    # Main project overview
├── CONTRIBUTING.md              # Contribution guidelines
├── LICENSE                      # License file
└── CHANGELOG.md                 # Version history

docs/                           # All documentation lives here
├── README.md                   # Documentation index
├── getting-started/            
│   ├── installation.md         # Consolidated installation guide
│   ├── quick-start.md          # 5-minute quick start
│   └── requirements.md         # System requirements
│
├── setup/                      
│   ├── claude-code.md          # Claude Code setup
│   ├── claude-desktop.md       # Claude Desktop setup
│   ├── cursor.md               # Cursor IDE setup
│   ├── vscode.md               # VS Code setup
│   └── troubleshooting.md     # Common issues
│
├── deployment/                 
│   ├── README.md               # Deployment overview
│   ├── cloud-run.md           
│   ├── docker.md              
│   ├── fly-io.md              
│   ├── railway.md             
│   └── remote-setup.md        
│
├── architecture/               
│   ├── overview.md            # System architecture
│   ├── mcp-protocol.md        # MCP protocol details
│   ├── priority-system.md     # Priority engine
│   └── tool-reference.md      # Tool documentation
│
├── api/                        
│   ├── tools/                 # Tool-specific docs
│   ├── endpoints.md           # API endpoints
│   └── authentication.md      # Auth documentation
│
├── testing/                    
│   ├── README.md              # Testing overview
│   ├── test-guide.md          # How to test
│   └── reports/               # Test reports (archived)
│
├── tutorials/                  
│   ├── basic-usage.md         
│   ├── advanced-features.md   
│   └── examples/              
│
└── reference/                  
    ├── changelog.md           # Moved from root
    ├── migration-guide.md     
    ├── faq.md                 
    └── archive/               # Old/outdated docs
```

## Actions Required

### 1. Root Level Cleanup
- Keep only: README.md, CONTRIBUTING.md, LICENSE, CHANGELOG.md
- Move all other .md files to appropriate docs/ subdirectories

### 2. File Consolidation
- Merge duplicate installation guides into docs/getting-started/installation.md
- Combine PR-related docs into CONTRIBUTING.md
- Consolidate setup guides in docs/setup/

### 3. Naming Standardization
- Use lowercase with hyphens for all documentation files
- Keep acronyms uppercase in content but lowercase in filenames
- Example: CLAUDE-DESKTOP-SETUP.md → claude-desktop.md

### 4. Content Organization
- Group related documentation by function
- Create clear parent-child relationships
- Ensure no more than 3 levels of nesting

### 5. Reference Updates
- Update all internal links to new locations
- Create redirects or notices for moved files
- Update index files with new structure

## Implementation Priority

1. **High Priority**: Root cleanup, file consolidation
2. **Medium Priority**: Naming standardization, folder reorganization  
3. **Low Priority**: Archive old docs, create redirects

## Success Metrics

- ✅ Maximum 4 files at repository root
- ✅ No duplicate documentation
- ✅ Consistent naming convention
- ✅ Clear navigation hierarchy
- ✅ All links working
- ✅ Professional appearance