# CLAUDE.md: Claude-Specific AI Development Instructions

**braiins-pool-mcp-server** | Extends [AGENTS.md](./AGENTS.md)

**Document Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Audience**: Claude AI model

---

## Import Core Standards

**See [AGENTS.md](./AGENTS.md) for:**
- Project overview and technology stack
- Code discovery and directory structure
- Code editing standards (TypeScript/Python style guides)
- Testing strategy and quality standards
- Git operations and commit message format
- Security policies and authentication patterns
- Collaboration patterns and agent roles
- Emergency protocols

This document provides Claude-specific enhancements and preferred workflows.

---

## Claude-Specific Capabilities

### Context Window Utilization
- **Window Size**: 200,000 tokens
- **Strategy**: Load complete architecture documents + multiple source files simultaneously
- **Best For**: 
  - Multi-file refactoring (up to 5 related files)
  - Comprehensive system redesign
  - Complex architectural decisions requiring full codebase understanding

#### Recommended Context Loading
```
Load together (stay under 150k tokens):
@AGENTS.md                    (~8k tokens)
@ARCHITECTURE.md              (~12k tokens)
@DEVELOPMENT_PLAN.md          (~10k tokens)
@[service-file.ts/py]         (~5k tokens per file, max 3)
@[test-file.test.ts/py]       (~5k tokens)
@[schema-file.ts/py]          (~3k tokens)
REMAINING: ~100k for conversation
```

### Multi-File Refactoring
Claude excels at refactoring across multiple related files:

**Pattern: Refactor Authentication System**
```markdown
REQUEST:
"I need to refactor the authentication system to support OAuth 2.0.
Currently we have JWT token handling in:
- src/auth/jwtManager.ts
- src/middleware/authMiddleware.ts
- tests/auth/jwt.test.ts

Update all three files consistently, including tests."

CLAUDE APPROACH:
1. Load all three files + AGENTS.md + ARCHITECTURE.md
2. Design complete OAuth2 solution
3. Generate all three files with coordinated changes
4. Provide migration guide for existing JWT code
5. Update test suite comprehensively
```

### Architecture Planning from Scratch
Claude is excellent for greenfield project architecture:

**Pattern: Design Complete System Architecture**
```markdown
REQUEST:
"Design the complete architecture for a caching layer between
our MCP server and the Braiins API. Consider:
- Redis cache with multi-level TTL strategy
- Cache invalidation on API updates
- Fallback behavior when Redis is unavailable
- Performance monitoring
- Test strategy

Provide architecture document, data models, and implementation plan."

CLAUDE APPROACH:
1. Ask clarifying questions about requirements
2. Design comprehensive system with diagrams (ASCII art)
3. Create ARCHITECTURE.md section
4. Generate TypeScript interfaces/Python Pydantic models
5. Create DEVELOPMENT_PLAN.md with phases
6. Provide test strategy document
```

### Code Analysis and Technical Debt Assessment
Claude can analyze complex codebases and provide improvement recommendations:

**Pattern: Legacy Code Modernization**
```markdown
REQUEST:
"Analyze our existing Bitcoin mining pool client code for:
1. Technical debt (patterns that need updating)
2. Security vulnerabilities
3. Performance bottlenecks
4. Type safety issues (if TypeScript)
5. Testing gaps

Provide detailed assessment with improvement roadmap."

CLAUDE APPROACH:
1. Read entire codebase systematically
2. Map dependencies and data flow
3. Identify problematic patterns
4. Assess severity and impact
5. Propose refactoring strategy with timeline
6. Create prioritized TODO list
```

---

## Preferred Workflows

### Workflow 1: Feature Development Orchestration
Claude can oversee complete feature development:

**Step 1: Requirements Analysis**
```
Input: User story or feature request
Output: Structured requirements document
- Acceptance criteria
- Data models
- API endpoints
- Integration points
- Testing strategy
```

**Step 2: Architecture Design**
```
Input: Requirements, existing architecture
Output: Design document with
- Component breakdown
- Data flow diagrams (ASCII)
- Interface definitions
- Error handling strategy
```

**Step 3: Implementation Guide**
```
Input: Design, architecture
Output: Phased implementation plan
- Phase breakdown
- Individual tasks
- Dependencies
- Effort estimates
- Testing checkpoints
```

**Step 4: Code Generation**
```
Input: Design, implementation plan
Output: Production-ready code
- Complete implementations
- Comprehensive tests (>80% coverage)
- Type-safe interfaces
- Error handling
```

### Workflow 2: Code Review and Optimization
Claude excels at comprehensive code review:

**Review Request Format**:
```markdown
REQUEST:
"Review this pull request for the miner stats feature:

CHANGES:
@src/tools/minerStats.ts (200 lines)
@src/api/braiinsClient.ts (150 lines)
@tests/unit/minerStats.test.ts (180 lines)

FOCUS AREAS:
1. Type safety and error handling
2. Performance (Redis caching impact)
3. Security (API key usage, input validation)
4. Test coverage adequacy
5. Adherence to AGENTS.md standards

CONSTRAINTS:
- Must maintain existing API contracts
- Should not change database schema
- Performance critical path"

CLAUDE REVIEW INCLUDES:
- Line-by-line analysis with explanations
- Risk assessment for each change
- Specific improvement suggestions with code examples
- Test coverage analysis
- Performance impact prediction
- Security vulnerability scan
```

### Workflow 3: Documentation Generation
Claude creates comprehensive, accurate technical documentation:

**Documentation Request Pattern**:
```markdown
REQUEST:
"Generate complete API documentation for our MCP tools.

TOOLS TO DOCUMENT:
- getMinerStats
- getPoolInfo
- getWorkerStatus

INCLUDE:
1. Overview section
2. Usage examples (TypeScript and Python)
3. Parameter documentation
4. Response schemas
5. Error codes and handling
6. Rate limiting information
7. Caching behavior
8. Integration examples"

OUTPUT:
- Formatted markdown with examples
- JSON schemas for responses
- Complete error reference
- Real-world usage patterns
- Integration guides
```

---

## Tool Permissions and Boundaries

### Claude's Allowed Operations
```yaml
Read & Analyze:
  - ALL project files
  - Git history and diffs
  - Test results and coverage
  - Architecture documents
  - Configuration files

Create & Modify:
  - Source code in feature branches
  - Test code (always)
  - Documentation and READMEs
  - Architecture/planning documents
  - Configuration files (non-credentials)

Restricted:
  - NO commits directly (user does after review)
  - NO pushing to remote (user handles)
  - NO modifying .env files
  - NO accessing credentials/secrets
  - NO production deployments
```

### When to Escalate to Other Agents

| Situation | Escalate To | Reason |
|-----------|-------------|--------|
| Code needs security review | Validator | Security expertise required |
| Performance profiling needed | Researcher | Benchmarking and optimization analysis |
| Infrastructure setup required | DevOps | Container, CI/CD, monitoring config |
| Cross-team communication needed | Scribe | Documentation and stakeholder communication |
| Third-party integration | Researcher | Technology evaluation and POC |

---

## Code Generation Best Practices for Claude

### Pattern 1: Generate with Tests-First
```typescript
REQUEST:
"Generate TypeScript implementation for Redis cache manager with these requirements:
- Methods: get(key), set(key, value, ttl), delete(key), flush()
- Handle connection errors gracefully
- Return null for cache misses
- Support different TTLs per key type

INCLUDE: Comprehensive unit tests (>90% coverage)"

CLAUDE GENERATES:
1. Interface definitions with TypeDoc comments
2. Class implementation with error handling
3. Comprehensive test suite with vitest
4. Example usage in main application context
```

### Pattern 2: Generate with Type Safety
```typescript
REQUEST:
"Generate TypeScript API client for Braiins Pool API.

API ENDPOINTS:
- GET /pools/{poolId}/miners (returns array of miner objects)
- GET /pools/{poolId}/info (returns pool metadata)
- POST /workers/{workerId}/restart (restarts specific worker)

REQUIREMENTS:
- Full type safety (no 'any' types)
- Retry logic with exponential backoff
- Request/response validation with zod
- Comprehensive error handling"

CLAUDE GENERATES:
1. Zod schemas for all request/response types
2. Strongly-typed client class
3. Complete error enum and handling
4. Full TypeDoc documentation
5. Integration test examples
```

### Pattern 3: Generate with Security Built-In
```typescript
REQUEST:
"Generate authentication middleware for MCP server.

REQUIREMENTS:
- Validate Bearer token in Authorization header
- Check against allow-list of valid API keys
- Support multiple API key types (read-only, admin)
- Rate limiting (100 requests/minute per key)
- Audit logging for failed attempts"

CLAUDE GENERATES:
1. Type-safe middleware function
2. In-memory rate limiter
3. Audit logging integration
4. Permission validation logic
5. Comprehensive test coverage
6. Security documentation
```

---

## Claude's Architectural Analysis Strengths

### System Design Review
Claude can evaluate and improve complete system architectures:

```markdown
REQUEST:
"Review our MCP server architecture for:
1. Scalability (can we handle 1000+ API calls/minute?)
2. Reliability (failure modes and recovery)
3. Maintainability (code organization, testing)
4. Security (auth, authorization, data protection)
5. Performance (caching strategy effectiveness)

Provide detailed assessment with recommendations."

CLAUDE OUTPUT:
- Architecture review document
- Risk assessment matrix
- Improvement roadmap (prioritized)
- Implementation estimates
- Code examples for key improvements
- Performance benchmarks (estimated)
```

### Pattern Identification
Claude identifies recurring patterns and suggests refactoring:

```markdown
REQUEST:
"Analyze our codebase for common patterns that could be:
1. Extracted into reusable utilities
2. Centralized in a single location
3. Made more efficient
4. Reduced code duplication

Focus on: API client calls, error handling, caching logic."

CLAUDE ANALYSIS:
- Lists specific code locations
- Explains duplication/inefficiency
- Proposes refactoring approach
- Provides before/after examples
- Estimates impact (LOC reduction, clarity improvement)
```

---

## Integration Points with Other Agents

### With Builder Agent
```markdown
HANDOFF FROM CLAUDE → BUILDER:

"Architecture and plan complete. Ready for implementation.

IMPLEMENTATION GUIDE:
- Phase 1 (4h): Foundation layer [details...]
- Phase 2 (6h): Business logic [details...]
- Phase 3 (5h): API/integration [details...]

CRITICAL DECISIONS:
[List of key architectural decisions]

POTENTIAL ISSUES TO WATCH:
[Known challenges and mitigation strategies]

START WITH: src/cache/redisManager.ts
REFERENCE: DEVELOPMENT_PLAN.md Section 2
"
```

### With Validator Agent
```markdown
HANDOFF FROM CLAUDE → VALIDATOR:

"Code generation complete. Ready for review.

FILES CHANGED:
- src/api/braiinsClient.ts (150 LOC)
- src/cache/redisManager.ts (120 LOC)
- tests/unit/ (280 LOC)

COVERAGE: 86% (goal was 80%)
COMPLEXITY: All functions <15 cyclomatic complexity
TYPES: 100% type safety (no 'any')

VALIDATION REQUESTS:
- [ ] Security review of API key handling
- [ ] Performance analysis of caching strategy
- [ ] Test coverage adequacy
- [ ] Error handling completeness
"
```

### With Scribe Agent
```markdown
HANDOFF FROM CLAUDE → SCRIBE:

"Generate documentation for new MCP tools.

TOOLS TO DOCUMENT:
- minerStats (query miner performance data)
- poolInfo (retrieve pool configuration)
- workerStatus (monitor individual workers)

INCLUDE:
- User-facing documentation
- API reference
- Integration examples
- Troubleshooting guide

REFERENCE CODE:
- src/tools/minerStats.ts
- tests/integration/tools.test.ts
"
```

---

## Conversation Starters with Claude

### For System Architecture
```
"You're a software architect helping design a Bitcoin mining pool MCP server.
The system needs to:
1. Connect to Braiins Pool API with caching via Redis
2. Expose tools via Model Context Protocol for AI models
3. Handle 1000+ API calls/minute with sub-second response times
4. Support multiple API keys with different permission levels
5. Provide comprehensive error handling and recovery

Design the system architecture."
```

### For Code Generation
```
"I need a production-ready TypeScript implementation of [component].
Follow these standards (see AGENTS.md):
- 80%+ test coverage
- Type safety (no 'any' types)
- Comprehensive error handling
- Clear documentation
- Following project conventions

Generate the complete implementation with tests."
```

### For Code Review
```
"Review this pull request for the [feature] feature:

[PASTE CODE]

Focus on:
1. Correctness and edge cases
2. Type safety and error handling
3. Performance implications
4. Security considerations
5. Test coverage
6. Adherence to AGENTS.md standards

Provide specific improvement suggestions with code examples."
```

### For Refactoring Guidance
```
"Our [module] has these issues [LIST ISSUES].

Can you design a refactoring strategy that:
1. Addresses all issues
2. Maintains existing APIs
3. Improves test coverage
4. Reduces code complexity
5. Maintains or improves performance

Provide: design document, migration guide, risk assessment."
```

---

## Performance Optimization Guidance

Claude can analyze and optimize performance-critical code:

### Performance Analysis Request
```markdown
REQUEST:
"Analyze performance of our Redis caching layer:

CURRENT METRICS:
- Cache hit rate: 60%
- Average response time: 250ms
- Redis latency: 2ms average
- API call latency: 150ms average

BOTTLENECK: Still too slow for dashboard updates (should be <100ms)

ANALYSIS NEEDED:
1. Cache hit rate improvement opportunities
2. Batch request optimization
3. Background refresh strategy
4. Query optimization at API level
5. Network optimization possibilities

CONSTRAINTS:
- Can't modify Braiins API
- Redis deployment is fixed
- MCP protocol constraints"

CLAUDE OUTPUT:
- Performance analysis report
- Specific optimization recommendations
- Implementation approach for each
- Performance impact estimates (with ranges)
- Trade-off analysis
- Implementation roadmap
```

---

## Troubleshooting With Claude

### When Something Goes Wrong
Provide Claude with:
1. **Error message**: Complete stack trace
2. **Context**: What were you trying to do?
3. **Reproduction steps**: How to recreate the issue?
4. **Relevant code**: File contents or snippets
5. **Environment info**: Node/Python version, OS
6. **Git info**: Current branch, recent commits

Claude will:
- Diagnose root cause
- Explain what happened
- Provide fix with explanation
- Suggest prevention strategies
- Update relevant documentation

---

## Quality Assurance with Claude

### Before PR/Handoff Checklist
Have Claude verify:
```markdown
VERIFICATION REQUEST:

Code Files:
- [ ] All type safety (no 'any' types in TypeScript)
- [ ] All imports used and correct
- [ ] Error handling on every code path
- [ ] Input validation for all parameters
- [ ] Output matches interface definitions

Tests:
- [ ] Coverage >80% (__coverage__ report)
- [ ] All edge cases tested
- [ ] Mock setup is correct
- [ ] Test descriptions are clear
- [ ] All tests passing locally

Documentation:
- [ ] Inline comments for complex logic
- [ ] JSDoc/Docstrings complete
- [ ] README updated
- [ ] Type definitions documented
- [ ] API examples provided

Standards:
- [ ] Code follows AGENTS.md style guide
- [ ] Commits follow Conventional Commits
- [ ] No console.log/print in source
- [ ] No commented-out code
- [ ] Dependencies documented
```

---

## Claude's Blind Spots (When to Ask for Help)

| Area | Why Claude Can't Help | Escalate To |
|------|---------------------|-------------|
| Security vulnerabilities in prod | Needs manual testing | Validator + DevOps |
| Cryptographic algorithm selection | Needs expert review | Researcher + Security team |
| Performance under load | Requires profiling | Validator + DevOps |
| Complex DevOps setup | Infrastructure knowledge | DevOps agent |
| Legal/Compliance issues | Needs legal review | Project management |

---

## Quick Reference: Claude Capabilities

### Excellent At ⭐⭐⭐
- Multi-file refactoring
- Architecture design
- Code generation with tests
- Documentation creation
- Code review and analysis
- Pattern identification
- Optimization suggestions

### Good At ⭐⭐
- Git workflow guidance
- Debugging help (with logs)
- Performance analysis
- Dependency selection

### Limited ⭐
- Production deployment
- Live system debugging
- Infrastructure configuration
- Security penetration testing

---

## Best Practices for Claude Sessions

### Session Opening
```markdown
I'm working on the braiins-pool-mcp-server project.

See [AGENTS.md](./AGENTS.md) for project context and standards.

Today's task: [Specific task description]

Reference documents: [Links to relevant docs]

[Paste code or context if needed]

Can you help with: [Specific request]
```

### Session Closing
```markdown
SUMMARY:
- Completed: [What was done]
- Outputs: [Files created/modified]
- Next steps: [What comes next]
- Handoff: [To which agent]

All work follows [AGENTS.md] standards.
Ready for [review/implementation/deployment].
```

---

## Document Information

**Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Engineering Standards Committee  
**Next Review**: March 15, 2026

---

See also: [AGENTS.md](./AGENTS.md) • [ARCHITECTURE.md](./ARCHITECTURE.md) • [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) • [COPILOT.md](./COPILOT.md)
