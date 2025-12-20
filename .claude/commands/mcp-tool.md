# /mcp-tool Command

## Purpose
Scaffold and implement a new MCP tool from API specification to production-ready code with tests.

## Usage
```
/mcp-tool <tool-name>
```

## Arguments
| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `tool-name` | string | Yes | camelCase name for the MCP tool (e.g., `getMinerStats`, `listWorkers`) |

## What This Command Does

1. **Load Skills**: Automatically loads `mcp-tool-builder` skill
2. **Review API.md**: Extracts endpoint specification for the tool
3. **Create Files**:
   - `src/schemas/{toolName}Input.ts` - Input validation schema
   - `src/schemas/{toolName}Response.ts` - Response validation schema
   - `src/tools/{toolName}.ts` - Tool handler implementation
   - `tests/unit/tools/{toolName}.test.ts` - Unit tests
4. **Update Exports**: Adds tool to `src/tools/index.ts`
5. **Run Tests**: Executes tests (should fail initially - TDD approach)
6. **Guide Implementation**: Provides step-by-step guidance to complete the tool

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Load mcp-tool-builder skill                     │
│   → Establishes implementation patterns                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Review API.md for endpoint specification        │
│   → Extract parameters, response format, cache TTL      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Create schema files                             │
│   → Input validation with Zod                           │
│   → Response validation for API data                    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Create test file with test cases                │
│   → Validation tests                                    │
│   → Cache hit/miss tests                                │
│   → Error handling tests                                │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Create tool handler (skeleton)                  │
│   → Cache-first pattern                                 │
│   → API integration                                     │
│   → Error handling                                      │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 6: Run tests and guide to passing                  │
│   → `npm test -- {toolName}`                            │
│   → Iterate until all tests pass                        │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Create getUserOverview Tool
```
User: /mcp-tool getUserOverview

Claude:
1. Loading mcp-tool-builder skill...
2. Found endpoint in API.md Section 5.1: GET /user/overview
3. Creating files:
   - src/schemas/getUserOverviewInput.ts ✓
   - src/schemas/getUserOverviewResponse.ts ✓
   - src/tools/getUserOverview.ts ✓
   - tests/unit/tools/getUserOverview.test.ts ✓
4. Running tests: npm test -- getUserOverview
   → 12 tests, 0 passing (expected - TDD)
5. Let's implement the handler...
```

### Example 2: Create listWorkers Tool with Pagination
```
User: /mcp-tool listWorkers

Claude:
1. Loading mcp-tool-builder skill...
2. Found endpoint in API.md Section 6.1: GET /workers
   → Pagination: page, pageSize
   → Filters: status, search, sortBy
3. Creating files with pagination support...
```

## Tool Naming Convention

| API Endpoint | Tool Name | Description |
|--------------|-----------|-------------|
| `GET /user/overview` | `getUserOverview` | Get user stats |
| `GET /workers` | `listWorkers` | List workers (paginated) |
| `GET /workers/{id}` | `getWorkerDetails` | Get single worker |
| `GET /workers/{id}/hashrate` | `getWorkerHashrate` | Worker hashrate timeseries |
| `GET /pool/stats` | `getPoolStats` | Pool statistics |
| `GET /network/stats` | `getNetworkStats` | Network statistics |

## Generated File Structure

After running `/mcp-tool getMinerStats`:

```
src/
├── schemas/
│   ├── getMinerStatsInput.ts      # NEW
│   └── getMinerStatsResponse.ts   # NEW
├── tools/
│   ├── getMinerStats.ts           # NEW
│   └── index.ts                   # UPDATED
tests/
└── unit/
    └── tools/
        └── getMinerStats.test.ts  # NEW
```

## Related Commands

- `/cache-design` - Design caching strategy for an endpoint
- `/validate-tool` - Validate an implemented tool
- `/api-sync` - Check implementation matches API.md

## Related Skills

- `mcp-tool-builder` - Core implementation workflow
- `mcp-schema-designer` - Schema design patterns
- `braiins-cache-strategist` - Caching decisions

## Requirements

Before running this command:
- [ ] TypeScript project is initialized
- [ ] Zod is installed (`npm install zod`)
- [ ] Test framework is set up (vitest/jest)
- [ ] API.md contains the endpoint specification

## Notes

- This command follows TDD (Test-Driven Development)
- Tests are created first and should fail initially
- Handler is implemented incrementally until tests pass
- Target test coverage: >80%
