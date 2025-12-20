# /validate-tool Command

## Purpose
Run comprehensive validation on an implemented MCP tool to ensure quality, security, and compliance with project standards.

## Usage
```
/validate-tool <tool-name>
```

## Arguments
| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `tool-name` | string | Yes | Name of the MCP tool to validate (e.g., `getMinerStats`) |

## Validation Checks

### 1. Schema Validation
- [ ] Input schema exists at `src/schemas/{toolName}Input.ts`
- [ ] Response schema exists at `src/schemas/{toolName}Response.ts`
- [ ] All parameters have validation rules
- [ ] String fields have `.max()` length limits
- [ ] ID fields have regex patterns (injection prevention)
- [ ] Enums used for fixed-choice parameters
- [ ] Error messages are user-friendly

### 2. Handler Implementation
- [ ] Handler exists at `src/tools/{toolName}.ts`
- [ ] Input validation uses `.safeParse()` (not `.parse()`)
- [ ] Cache-first pattern implemented
- [ ] API client call is properly awaited
- [ ] Response is validated with schema
- [ ] All error cases handled
- [ ] No `any` types in implementation

### 3. Error Handling
- [ ] 400 Bad Request (validation errors)
- [ ] 401 Unauthorized (auth failures)
- [ ] 403 Forbidden (permission denied)
- [ ] 404 Not Found (resource missing)
- [ ] 429 Too Many Requests (rate limit)
- [ ] 500 Internal Server Error (API failures)
- [ ] Cache errors don't break requests

### 4. Caching
- [ ] Cache key pattern is correct
- [ ] TTL matches data volatility
- [ ] Cache key doesn't contain raw user input
- [ ] Cache errors are caught and logged
- [ ] Fallthrough to API on cache miss

### 5. Test Coverage
- [ ] Test file exists at `tests/unit/tools/{toolName}.test.ts`
- [ ] Input validation tests (valid/invalid)
- [ ] Cache hit/miss tests
- [ ] Error handling tests
- [ ] Coverage >= 80%

### 6. Security Review
- [ ] No API tokens in logs
- [ ] No stack traces in error responses
- [ ] Input sanitization before cache key
- [ ] Rate limiting respected
- [ ] No sensitive data exposure

### 7. Documentation
- [ ] JSDoc comment on handler
- [ ] Tool registered in `src/tools/index.ts`
- [ ] Tool added to MCP server registration

## Output Format

```markdown
# Validation Report: {toolName}

## Summary
- Status: PASS / FAIL
- Score: {X}/7 categories passed
- Critical Issues: {count}
- Warnings: {count}

## Schema Validation
✅ Input schema exists
✅ Response schema exists
⚠️ Warning: String field 'search' missing max length
✅ ID fields have regex patterns
✅ Enums used for status field

## Handler Implementation
✅ Handler exists
✅ Input validation uses safeParse
⚠️ Warning: Line 45 - consider extracting to helper
✅ Cache-first pattern implemented
✅ Response validated

## Error Handling
✅ 400 Bad Request handled
✅ 401 Unauthorized handled
✅ 404 Not Found handled
❌ FAIL: 429 Rate limit not handled
✅ Cache errors don't break requests

## Caching
✅ Cache key pattern correct
✅ TTL appropriate (30s)
✅ No raw input in cache key
✅ Cache errors caught

## Test Coverage
✅ Test file exists
✅ Validation tests present
⚠️ Warning: Missing test for 429 error
Coverage: 85% (target: 80%) ✅

## Security Review
✅ No tokens in logs
✅ No stack traces exposed
✅ Input sanitization present
✅ Rate limiting respected

## Documentation
✅ JSDoc comment present
✅ Tool registered
✅ MCP registration complete

## Action Items
1. [CRITICAL] Add 429 rate limit error handling
2. [WARNING] Add max length to 'search' field
3. [WARNING] Add test for rate limit scenario
```

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Locate tool files                               │
│   → src/tools/{toolName}.ts                             │
│   → src/schemas/{toolName}Input.ts                      │
│   → src/schemas/{toolName}Response.ts                   │
│   → tests/unit/tools/{toolName}.test.ts                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Analyze schema files                            │
│   → Check validation rules                              │
│   → Verify security patterns                            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Review handler implementation                   │
│   → Check patterns against mcp-tool-builder             │
│   → Verify error handling                               │
│   → Check caching implementation                        │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Run tests and check coverage                    │
│   → npm test -- {toolName} --coverage                   │
│   → Analyze coverage report                             │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Generate validation report                      │
│   → Categorize findings                                 │
│   → List action items                                   │
│   → Provide fix suggestions                             │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Validate a Passing Tool
```
User: /validate-tool getUserOverview

Claude:
# Validation Report: getUserOverview

## Summary
- Status: PASS ✅
- Score: 7/7 categories passed
- Critical Issues: 0
- Warnings: 1

## Action Items
1. [WARNING] Consider adding rate limit test case

Tool is ready for production! 🎉
```

### Example 2: Validate a Tool with Issues
```
User: /validate-tool listWorkers

Claude:
# Validation Report: listWorkers

## Summary
- Status: FAIL ❌
- Score: 5/7 categories passed
- Critical Issues: 2
- Warnings: 3

## Critical Issues
1. Missing 429 rate limit error handling (Error Handling)
2. Test coverage at 72% (below 80% target)

## Action Items
1. [CRITICAL] Add rate limit error handling
2. [CRITICAL] Add tests to reach 80% coverage
3. [WARNING] Add max length to search parameter

Let me help fix these issues...
```

## Related Commands

- `/mcp-tool` - Create new MCP tools
- `/cache-design` - Design caching strategy
- `/api-sync` - Check API.md alignment

## Related Skills

- `mcp-validator` - Full validation workflow
- `security-auditor` - Deep security review
- `mcp-tool-builder` - Implementation patterns

## Notes

- Run this command after implementing a tool
- All critical issues must be fixed before deployment
- Warnings should be addressed when possible
- Use this before creating pull requests
