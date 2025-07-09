# Workspace Indexing Proposal for ACF

**Author:** Abhilash Chadhar (FutureAtoms)
**Last Updated:** January 2025

## Summary

Add intelligent workspace indexing to ACF that automatically analyzes projects and provides context to LLMs, dramatically improving their ability to understand and work with codebases.

## Key Benefits

### For LLMs:
- **Instant Context**: Understand project structure, technologies, and conventions with one call
- **Smart Suggestions**: Know where to add features, what's missing, and follow patterns
- **Safer Operations**: Understand file relationships and dependencies before making changes
- **Better Code Generation**: Automatically follow project conventions and styles

### For Performance:
- **Reduced API Calls**: 1 index call replaces 10-20 exploration calls  
- **Caching**: Index cached for 5 minutes, instant subsequent access
- **Optimized Operations**: LLM can make targeted queries instead of broad searches

## Implementation Overview

### 1. Add Smart Indexer Tool
```javascript
// New tool in mcp_server.js
{
  name: 'index_workspace',
  description: 'Get comprehensive workspace analysis including structure, technologies, and recommendations'
}
```

### 2. Auto-Index on Workspace Setup
When `setWorkspace` is called, automatically index the project and return key insights.

### 3. Enhanced Existing Tools
- `listTasks` includes project context
- `addTask` gets smart priority suggestions
- `initProject` auto-generates helpful tasks

## Example Output

```json
{
  "projectType": "nextjs",
  "technologies": ["React", "TypeScript", "Prisma"],
  "structure": {
    "hasTests": true,
    "hasDocs": false,
    "organization": "well-organized"
  },
  "recommendations": [
    "No README.md found",
    "Add .env.example for security"
  ]
}
```

## Integration Steps

1. **Phase 1**: Add indexer as new tool (non-breaking)
2. **Phase 2**: Auto-index on workspace operations
3. **Phase 3**: Enhance existing tools with context
4. **Phase 4**: Add to optimized tool set

## Technical Details

- Uses existing filesystem tools internally
- Smart project type detection
- Respects .gitignore patterns
- Configurable depth and content inclusion
- 5-minute cache for performance

## Next Steps

1. Review and approve proposal
2. Implement workspace_indexer.js
3. Add minimal integration to mcp_server.js
4. Test with various project types
5. Document usage patterns

This enhancement would make ACF significantly more intelligent and useful for AI assistants working with code projects.