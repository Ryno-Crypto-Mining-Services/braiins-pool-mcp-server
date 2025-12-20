# /api-sync Command

## Purpose
Synchronize implementation with API.md changes by comparing documented endpoints against implemented MCP tools.

## Usage
```
/api-sync
```

No arguments required - analyzes entire project.

## What This Command Does

1. **Parse API.md** - Extract all documented endpoints
2. **Scan Implementation** - Find all implemented MCP tools
3. **Compare** - Identify gaps and drift
4. **Report** - Generate sync status with action items

## Output Categories

### 1. Missing Tools
Endpoints in API.md without corresponding MCP tools:
```
❌ NOT IMPLEMENTED:
- GET /user/rewards → Suggested: getUserRewards
- GET /workers/{id}/hashrate → Suggested: getWorkerHashrate
```

### 2. Schema Drift
Tool schemas that don't match API.md:
```
⚠️ SCHEMA DRIFT:
- listWorkers: Missing parameter 'tags' (added in API.md v1.2)
- getWorkerDetails: Response field 'environment' changed type
```

### 3. Deprecated Endpoints
API.md endpoints marked deprecated but still implemented:
```
🚫 DEPRECATED:
- getMinerStats: Endpoint /miners deprecated, use /workers instead
```

### 4. Fully Synced
Tools that match API.md exactly:
```
✅ IN SYNC:
- getUserOverview
- listWorkers
- getPoolStats
- getNetworkStats
```

## Report Format

```markdown
# API Sync Report
Generated: 2025-12-18T10:30:00Z

## Summary
| Status | Count |
|--------|-------|
| In Sync | 4 |
| Missing | 2 |
| Schema Drift | 1 |
| Deprecated | 0 |

## API.md Endpoints
| Endpoint | Tool | Status |
|----------|------|--------|
| GET /user/overview | getUserOverview | ✅ Synced |
| GET /user/rewards | - | ❌ Missing |
| GET /workers | listWorkers | ⚠️ Drift |
| GET /workers/{id} | getWorkerDetails | ✅ Synced |
| GET /workers/{id}/hashrate | - | ❌ Missing |
| GET /pool/stats | getPoolStats | ✅ Synced |
| GET /network/stats | getNetworkStats | ✅ Synced |

## Action Items

### High Priority
1. Implement getUserRewards tool
   - Endpoint: GET /user/rewards
   - Run: /mcp-tool getUserRewards

2. Implement getWorkerHashrate tool
   - Endpoint: GET /workers/{id}/hashrate
   - Run: /mcp-tool getWorkerHashrate

### Medium Priority
3. Fix schema drift in listWorkers
   - Add 'tags' parameter to ListWorkersInputSchema
   - Update tests for new parameter

## Recommended Commands
/mcp-tool getUserRewards
/mcp-tool getWorkerHashrate
/validate-tool listWorkers
```

## Endpoint-to-Tool Mapping

Standard naming convention:

| HTTP Method | Path Pattern | Tool Name Pattern |
|-------------|--------------|-------------------|
| GET | /resource | listResources |
| GET | /resource/{id} | getResourceDetails |
| GET | /resource/{id}/sub | getResourceSub |
| GET | /resource/stats | getResourceStats |

**Examples**:
| Endpoint | Tool Name |
|----------|-----------|
| GET /user/overview | getUserOverview |
| GET /user/rewards | getUserRewards |
| GET /workers | listWorkers |
| GET /workers/{id} | getWorkerDetails |
| GET /workers/{id}/hashrate | getWorkerHashrate |
| GET /pool/stats | getPoolStats |
| GET /network/stats | getNetworkStats |

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Parse API.md                                    │
│   → Extract endpoint paths                              │
│   → Extract parameters                                  │
│   → Extract response schemas                            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Scan src/tools/                                 │
│   → List all tool files                                 │
│   → Extract tool names and schemas                      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Map endpoints to tools                          │
│   → Match by naming convention                          │
│   → Identify missing implementations                    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Compare schemas                                 │
│   → Check input parameters                              │
│   → Check response fields                               │
│   → Identify drift                                      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Generate report                                 │
│   → Categorize findings                                 │
│   → Create action items                                 │
│   → Suggest commands                                    │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Project at Start (No Tools)
```
User: /api-sync

Claude:
# API Sync Report

## Summary
| Status | Count |
|--------|-------|
| In Sync | 0 |
| Missing | 7 |
| Schema Drift | 0 |
| Deprecated | 0 |

All 7 endpoints need implementation!

## Recommended Order
1. /mcp-tool getUserOverview (P0 - core functionality)
2. /mcp-tool listWorkers (P0 - worker monitoring)
3. /mcp-tool getWorkerDetails (P0 - worker details)
4. /mcp-tool getPoolStats (P1 - pool info)
...
```

### Example 2: Project Partially Implemented
```
User: /api-sync

Claude:
# API Sync Report

## Summary
| Status | Count |
|--------|-------|
| In Sync | 4 |
| Missing | 2 |
| Schema Drift | 1 |
| Deprecated | 0 |

Good progress! 4 tools implemented, 2 remaining.

## Action Items
1. [HIGH] Implement getWorkerHashrate
2. [HIGH] Implement getUserRewards
3. [MEDIUM] Fix listWorkers schema drift (missing 'tags')
```

### Example 3: Fully Synced Project
```
User: /api-sync

Claude:
# API Sync Report

## Summary
| Status | Count |
|--------|-------|
| In Sync | 7 |
| Missing | 0 |
| Schema Drift | 0 |
| Deprecated | 0 |

🎉 All endpoints implemented and in sync!

No action items - implementation matches API.md perfectly.
```

## Related Commands

- `/mcp-tool` - Implement missing tools
- `/validate-tool` - Validate existing tools
- `/cache-design` - Design caching for endpoints

## Notes

- Run this command after API.md updates
- Run before code reviews to catch drift
- Use as part of CI/CD validation
- Keep API.md and implementation in sync
