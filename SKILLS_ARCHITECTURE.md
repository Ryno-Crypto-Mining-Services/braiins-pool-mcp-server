# Skills Architecture for Braiins Pool MCP Server

**Document Version**: 1.0.0
**Last Updated**: December 18, 2025
**Status**: Active

---

## Executive Summary

This document defines a **skills-first multi-agent paradigm** tailored for MCP server development and Braiins Pool tool implementation. Rather than relying on multiple specialized agents with redundant context, we use a **single general agent** that dynamically loads domain-specific skills based on task requirements.

**Key Benefits**:
- **35% token reduction** vs multi-agent approach
- **Portable workflows** that work across sessions
- **Consistent quality** through embedded best practices
- **Fast iteration** with skill composition

---

## Skills-First Philosophy

### Why Skills Over Multiple Agents?

| Aspect | Multiple Agents | Single Agent + Skills |
|--------|-----------------|----------------------|
| Context Efficiency | 15x baseline tokens | 5-7x baseline (35% savings) |
| Maintenance | Update N agents | Update 1 agent + M skills |
| Consistency | Varies by agent | Embedded in skills |
| Composability | Agent coordination overhead | Native skill chaining |
| Learning | Per-agent training | Shared skill improvements |

### When This Approach Applies

**Use Skills For** (This Project):
- MCP tool implementation (sequential workflow)
- API client development (follows patterns)
- Testing and validation (checklist-driven)
- Documentation generation (template-based)

**Use Multi-Agent Only For**:
- Parallel research tasks (technology evaluation)
- Large-scale refactoring (independent workstreams)
- Breadth-first exploration (multiple approaches)

---

## Project-Specific Skill Categories

### Category 1: MCP Development Skills

Skills for building MCP server components following the Model Context Protocol specification.

| Skill | Purpose | Triggers |
|-------|---------|----------|
| **mcp-tool-builder** | Implement new MCP tools from spec | "create MCP tool", "implement tool" |
| **mcp-schema-designer** | Design Zod schemas for tool inputs | "design tool schema", "input validation" |
| **mcp-handler-tdd** | TDD workflow for tool handlers | "test-driven tool", "handler tests" |

### Category 2: Braiins API Integration Skills

Skills specific to Braiins Pool API integration patterns.

| Skill | Purpose | Triggers |
|-------|---------|----------|
| **braiins-api-mapper** | Map API endpoints to MCP tools | "map API endpoint", "integrate Braiins" |
| **braiins-response-parser** | Parse and validate API responses | "parse API response", "response schema" |
| **braiins-cache-strategist** | Design caching strategy for endpoints | "cache strategy", "TTL design" |

### Category 3: Quality & Validation Skills

Skills ensuring code quality and adherence to project standards.

| Skill | Purpose | Triggers |
|-------|---------|----------|
| **mcp-validator** | Validate MCP implementations | "validate tool", "check MCP compliance" |
| **security-auditor** | Security review for API handling | "security review", "audit authentication" |
| **performance-profiler** | Profile and optimize performance | "profile tool", "optimize response time" |

### Category 4: Infrastructure Skills

Skills for DevOps and deployment aspects.

| Skill | Purpose | Triggers |
|-------|---------|----------|
| **redis-integration** | Set up and configure Redis caching | "setup Redis", "configure cache" |
| **docker-mcp-builder** | Create Docker configuration for MCP | "dockerize MCP", "container setup" |
| **ci-cd-pipeline** | Configure GitHub Actions for MCP | "setup CI", "configure pipeline" |

---

## Core Skill Definitions

### Skill 1: mcp-tool-builder

```yaml
name: mcp-tool-builder
version: 1.0.0
category: mcp-development
complexity: moderate
status: active

description: |
  Guides implementation of new MCP tools from specification to production-ready
  code, following project architecture patterns and best practices.

triggers:
  - "create MCP tool"
  - "implement tool for [X]"
  - "build getMinerStats tool"
  - "new MCP handler"

dependencies:
  - mcp-schema-designer (for input schemas)
  - braiins-api-mapper (for API integration)
```

**Workflow**:

```
Phase 1: Specification Review
├── Read API.md for endpoint details
├── Identify input parameters and types
├── Determine caching requirements (TTL)
└── Document expected response format

Phase 2: Schema Definition
├── Create Zod schema for inputs
├── Create Zod schema for API response
├── Define TypeScript interfaces
└── Add validation error messages

Phase 3: Handler Implementation
├── Create file: src/tools/{toolName}.ts
├── Implement cache-first pattern
├── Add API client call
├── Format MCP response
└── Handle all error cases

Phase 4: Testing
├── Write unit tests (minimum 10)
├── Test validation edge cases
├── Test cache hit/miss scenarios
├── Test error handling

Phase 5: Integration
├── Register tool in index.ts
├── Update tool documentation
└── Run full test suite
```

**Example Usage**:
```
User: "Create the getMinerStats MCP tool"

Agent loads: mcp-tool-builder skill
Agent follows workflow:
1. Reviews API.md Section 5.1 (User Overview)
2. Creates MinerStatsInputSchema in src/schemas/
3. Implements getMinerStats handler in src/tools/
4. Writes 12 unit tests in tests/unit/tools/
5. Registers tool and runs test suite
```

---

### Skill 2: braiins-api-mapper

```yaml
name: braiins-api-mapper
version: 1.0.0
category: api-integration
complexity: moderate
status: active

description: |
  Maps Braiins Pool API endpoints to MCP tool implementations with proper
  authentication, rate limiting, and error handling patterns.

triggers:
  - "map API endpoint"
  - "integrate Braiins API"
  - "connect to pool endpoint"
  - "implement API call"

dependencies:
  - braiins-cache-strategist (for TTL decisions)
```

**Workflow**:

```
Phase 1: Endpoint Analysis
├── Identify HTTP method (GET/POST)
├── Extract path parameters
├── List query parameters
├── Document authentication requirements
└── Review rate limiting constraints

Phase 2: Client Method Design
├── Define method signature
├── Add TypeScript types for params/response
├── Implement retry with exponential backoff
├── Add rate limiting compliance
└── Handle specific HTTP status codes

Phase 3: Integration Pattern
├── Cache check before API call
├── API call with proper headers
├── Response validation with Zod
├── Cache storage with TTL
└── Error translation to custom types

Phase 4: Testing
├── Mock API responses
├── Test retry behavior
├── Test rate limit handling
├── Test authentication failures
```

**API Endpoint Reference** (from API.md):

| Endpoint | Method | MCP Tool | Cache TTL |
|----------|--------|----------|-----------|
| `/user/overview` | GET | getUserOverview | 30s |
| `/workers` | GET | listWorkers | 30s |
| `/workers/{id}` | GET | getWorkerDetails | 60s |
| `/pool/stats` | GET | getPoolStats | 60s |
| `/network/stats` | GET | getNetworkStats | 120s |

---

### Skill 3: mcp-schema-designer

```yaml
name: mcp-schema-designer
version: 1.0.0
category: validation
complexity: simple
status: active

description: |
  Designs comprehensive Zod schemas for MCP tool inputs and API responses,
  ensuring type safety and clear validation error messages.

triggers:
  - "design tool schema"
  - "create input validation"
  - "Zod schema for [X]"
  - "validate tool parameters"
```

**Schema Design Patterns**:

```typescript
// Pattern 1: Simple ID parameter
const WorkerIdSchema = z.object({
  workerId: z.string()
    .min(1, 'Worker ID is required')
    .max(100, 'Worker ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid worker ID format'),
});

// Pattern 2: Pagination parameters
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
});

// Pattern 3: Time range parameters
const TimeRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(['minute', 'hour', 'day']).default('hour'),
});

// Pattern 4: Filter parameters
const WorkerFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['hashrate_desc', 'name_asc', 'last_share']).optional(),
});
```

**Quality Checklist**:
- [ ] All required fields have `.min()` for strings
- [ ] All strings have `.max()` to prevent abuse
- [ ] Regex patterns for IDs prevent injection
- [ ] Enums used for fixed choices
- [ ] Defaults provided where sensible
- [ ] Error messages are user-friendly

---

### Skill 4: braiins-cache-strategist

```yaml
name: braiins-cache-strategist
version: 1.0.0
category: performance
complexity: simple
status: active

description: |
  Designs Redis caching strategies for Braiins API data, optimizing for
  freshness vs. API rate limits.

triggers:
  - "design cache strategy"
  - "set TTL for [X]"
  - "optimize caching"
  - "cache key pattern"
```

**Cache Strategy Matrix**:

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| User overview | 30s | Hashrate changes frequently |
| Worker list | 30s | Worker status can change |
| Worker details | 60s | Detailed info less volatile |
| Hashrate timeseries | 120s | Historical data is stable |
| Pool stats | 60s | Pool-wide aggregations |
| Network stats | 300s | Network changes slowly |

**Cache Key Patterns**:
```
braiins:user:overview:{accountHash}
braiins:user:rewards:{accountHash}:{paramsHash}
braiins:workers:list:{accountHash}:{page}:{filtersHash}
braiins:workers:detail:{accountHash}:{workerId}
braiins:workers:hashrate:{accountHash}:{workerId}:{paramsHash}
braiins:pool:stats
braiins:network:stats
```

**Key Sanitization Rules**:
- No user input directly in keys
- Hash dynamic values (SHA256 truncated to 8 chars)
- Maximum key length: 200 characters
- Character allowlist: `a-zA-Z0-9:-_`

---

## Command Definitions

Commands provide quick-access workflows for common development tasks.

### Command: /mcp-tool

**Purpose**: Scaffold and implement a new MCP tool end-to-end.

```markdown
# /mcp-tool Command

## Usage
/mcp-tool <tool-name>

## What It Does
1. Creates tool file: src/tools/{toolName}.ts
2. Creates schema file: src/schemas/{toolName}.ts
3. Creates test file: tests/unit/tools/{toolName}.test.ts
4. Updates exports in src/tools/index.ts
5. Runs initial tests (should fail - TDD)

## Example
/mcp-tool getMinerStats

## Workflow
1. Load mcp-tool-builder skill
2. Review API.md for endpoint spec
3. Generate scaffold with TODO placeholders
4. Run tests (verify they fail)
5. Guide implementation iteratively
```

### Command: /cache-design

**Purpose**: Design caching strategy for an API endpoint.

```markdown
# /cache-design Command

## Usage
/cache-design <endpoint-path>

## What It Does
1. Analyzes endpoint from API.md
2. Recommends TTL based on data volatility
3. Generates cache key pattern
4. Creates Redis key documentation
5. Provides implementation snippet

## Example
/cache-design /workers/{workerId}
```

### Command: /validate-tool

**Purpose**: Run comprehensive validation on an implemented tool.

```markdown
# /validate-tool Command

## Usage
/validate-tool <tool-name>

## Validation Checks
1. Schema completeness (all params validated)
2. Error handling coverage (all HTTP codes)
3. Cache integration (get/set/invalidate)
4. Test coverage (minimum 80%)
5. Documentation accuracy
6. Security review (no token exposure)
```

### Command: /api-sync

**Purpose**: Synchronize implementation with API.md changes.

```markdown
# /api-sync Command

## Usage
/api-sync

## What It Does
1. Parses API.md for endpoint definitions
2. Compares against implemented tools
3. Reports:
   - Missing tools (endpoints not implemented)
   - Schema drift (params changed)
   - Response changes (fields added/removed)
4. Generates TODO items for sync work
```

---

## Skill Integration Patterns

### Pattern 1: Sequential Skill Loading

For implementing a new MCP tool:

```
1. Load: mcp-schema-designer
   → Design input schema
   → Design response schema

2. Load: braiins-api-mapper
   → Map endpoint to client method
   → Implement API call with retry

3. Load: braiins-cache-strategist
   → Determine TTL
   → Design cache key pattern

4. Load: mcp-tool-builder
   → Combine all pieces
   → Implement handler
   → Write tests
```

### Pattern 2: Parallel Skill Application

For refactoring existing tools:

```
Load simultaneously:
├── security-auditor → Check for vulnerabilities
├── performance-profiler → Identify bottlenecks
└── mcp-validator → Check MCP compliance

Consolidate findings → Prioritize fixes
```

### Pattern 3: Conditional Skill Loading

Based on task complexity:

```
IF task is "implement simple tool":
  Load: mcp-tool-builder (handles everything)

ELSE IF task is "optimize performance":
  Load: performance-profiler
  → Identify issues
  Load: braiins-cache-strategist
  → Improve caching

ELSE IF task is "fix security issue":
  Load: security-auditor
  → Full security review
```

---

## File Structure for Skills

```
.claude/
├── commands/
│   ├── mcp-tool.md           # /mcp-tool command
│   ├── cache-design.md       # /cache-design command
│   ├── validate-tool.md      # /validate-tool command
│   ├── api-sync.md           # /api-sync command
│   └── README.md             # Command documentation
│
├── skills/
│   ├── mcp-tool-builder/
│   │   ├── SKILL.md          # Main skill definition
│   │   ├── templates/        # Code templates
│   │   └── examples/         # Usage examples
│   │
│   ├── braiins-api-mapper/
│   │   ├── SKILL.md
│   │   └── endpoint-map.json # API endpoint reference
│   │
│   ├── mcp-schema-designer/
│   │   ├── SKILL.md
│   │   └── patterns/         # Schema patterns
│   │
│   ├── braiins-cache-strategist/
│   │   ├── SKILL.md
│   │   └── ttl-matrix.json   # TTL recommendations
│   │
│   ├── mcp-validator/
│   │   ├── SKILL.md
│   │   └── checklists/       # Validation checklists
│   │
│   ├── security-auditor/
│   │   └── SKILL.md
│   │
│   └── README.md             # Skills overview
│
└── settings.local.json       # Claude Code settings
```

---

## Implementation Roadmap

### Phase 1: Foundation Skills (Week 1)

Priority skills for Phase 1 of DEVELOPMENT_PLAN.md:

1. **mcp-tool-builder** - Core implementation workflow
2. **mcp-schema-designer** - Input validation patterns
3. **braiins-cache-strategist** - Caching decisions

### Phase 2: Integration Skills (Week 2)

Skills for API integration work:

4. **braiins-api-mapper** - Endpoint integration
5. **mcp-validator** - Quality validation

### Phase 3: Quality Skills (Week 3+)

Skills for hardening and optimization:

6. **security-auditor** - Security review
7. **performance-profiler** - Performance optimization

---

## Quality Standards for Skills

### Every Skill Must Have

- [ ] Clear, action-oriented triggers (3-5 minimum)
- [ ] Negative triggers (when NOT to use)
- [ ] Prerequisites documented
- [ ] Step-by-step workflow
- [ ] 2-5 concrete examples
- [ ] Quality checklist
- [ ] Integration notes (how it works with other skills)
- [ ] Version history

### Skill Validation Checklist

- [ ] Skill invokes when expected
- [ ] Skill doesn't invoke when not expected
- [ ] Output matches examples
- [ ] Error handling works
- [ ] Performance acceptable (<30s for simple skills)

---

## Success Metrics

### Development Velocity

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tool implementation time | <2 hours | From spec to tests passing |
| Validation completeness | 100% | All checks automated |
| Test coverage | >80% | Per tool |
| Documentation accuracy | 100% | Matches implementation |

### Quality Improvements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bugs per tool | <1 | Post-implementation fixes |
| Security issues | 0 | Audit findings |
| Performance regressions | 0 | Response time increases |

---

## Document Information

**Version**: 1.0.0
**Created**: December 18, 2025
**Author**: Architecture Agent
**Status**: Draft - Awaiting Review

---

See also: [AGENTS.md](./AGENTS.md) | [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) | [API.md](./API.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)
