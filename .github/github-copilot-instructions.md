# .github/copilot-instructions.md

GitHub Copilot guidance for braiins-pool-mcp-server development

**Last Updated**: December 15, 2025

---

## Quick Context

This is a **Model Context Protocol (MCP) server** that connects AI models to the Braiins Bitcoin mining pool API.

- **Tech**: TypeScript/Node.js or Python 3.10+
- **Architecture**: MCP server → API client → Redis cache → Braiins API
- **Key Features**: 3 main tools (getMinerStats, getPoolInfo, getWorkerStatus)
- **Performance Target**: <100ms response times
- **Code Quality**: >85% test coverage, zero lint errors

---

## Before You Code

**Load this context for every session**:
```
#README.md (3-min overview)
#AGENTS.md (development standards)
#ARCHITECTURE.md (system design)
#src/schemas/ (type definitions)
#tests/ (test patterns)
```

This helps me understand:
- What the project does
- Code style and patterns
- Type definitions to use
- How to structure tests

---

## Key Files by Task

| I Need To... | Read These Files |
|-------------|-----------------|
| Build a new tool | ARCHITECTURE.md + src/tools/README.md |
| Write tests | tests/ folder examples + AGENTS.md testing section |
| Understand API integration | src/api/ folder + ARCHITECTURE.md |
| Use caching | src/cache/ folder + ARCHITECTURE.md |
| Add error handling | src/utils/errors.ts + AGENTS.md error handling |

---

## Code Style Summary

**TypeScript**:
- ✅ PascalCase for classes: `BraiinsClient`
- ✅ camelCase for functions: `getMinerStats()`
- ✅ Type everything (no `any`)
- ✅ JSDoc on all public functions
- ✅ Zod schemas for validation

**Python**:
- ✅ snake_case for functions: `get_miner_stats()`
- ✅ PascalCase for classes: `BraiinsClient`
- ✅ Type hints everywhere
- ✅ Docstrings on all public functions
- ✅ Pydantic models for validation

**Both**:
- ✅ Error handling always
- ✅ Input validation required
- ✅ Tests required
- ✅ Comments explain WHY, not WHAT
- ✅ No console.log in production code

---

## Common Tasks

### Implement an MCP Tool

1. Load: ARCHITECTURE.md (Tool Layer section)
2. Create: src/tools/[toolName].ts
3. Define: Input schema with Zod/Pydantic
4. Implement: Tool handler function
5. Test: Unit + integration tests (>80% coverage)
6. Return: Ready for review by human

**I can generate**: Tool definition, handler function, test skeleton  
**You should verify**: Error handling, validation, test coverage

### Write Unit Tests

1. Load: tests/unit/ (examples)
2. Structure: Describe → it() blocks (AAA pattern)
3. Use: vitest (TS) or pytest (Py) patterns
4. Mock: All external dependencies
5. Target: >80% coverage

**I can generate**: Test structure, mocking setup  
**You should verify**: Coverage, edge cases, assertions

### Create API Methods

1. Load: src/api/braiinsClient.ts (example)
2. Add: HTTP client method with auth
3. Parse: Response and validate type
4. Handle: Errors with custom types
5. Test: With mocked API

**I can generate**: Method body, error handling  
**You should verify**: Type safety, retry logic, security

### Add Caching

1. Load: src/cache/redisManager.ts
2. Add: Cache lookup in tool
3. Set: Appropriate TTL
4. Handle: Cache miss/errors
5. Test: Cache hit/miss scenarios

**I can generate**: Cache integration code  
**You should verify**: TTL values, fallback behavior

---

## What NOT To Do

❌ Don't use Copilot for:
- Architecture decisions (ask Architect agent first)
- Security-critical code (always review manually)
- Complex logic without explanation
- Anything you don't fully understand

⚠️ Always review:
- Type safety (no `any` types)
- Error handling completeness
- Input validation
- Performance implications
- Test coverage

---

## When Something Seems Wrong

**Verify Against**:
- AGENTS.md (development standards)
- ARCHITECTURE.md (design decisions)
- Existing code in src/ (patterns)
- Tests in tests/ (testing patterns)

**If still unsure**:
- Ask human reviewer
- Request Validator agent review
- Check original requirements

---

## References

- **Project Overview**: README.md
- **Development Standards**: AGENTS.md
- **System Design**: ARCHITECTURE.md
- **Code Examples**: Look at existing code in src/
- **Testing Examples**: Look at tests/
- **Copilot Guide**: COPILOT.md

---

## Performance Expectations

**Copilot works best for**:
- ✅ Boilerplate code (tool definitions, type definitions)
- ✅ Test structure and mocking patterns
- ✅ Error handling patterns
- ✅ Documentation and comments

**Copilot works okay for**:
- ⚠️ API integration code (verify security)
- ⚠️ Caching logic (verify correctness)

**Copilot struggles with**:
- ❌ Complex algorithms
- ❌ Architecture decisions
- ❌ Security-sensitive code

---

See also: [COPILOT.md](../COPILOT.md) • [AGENTS.md](../AGENTS.md)
