# AGENT_REGISTRY.md: Specialized AI Agent Directory

**braiins-pool-mcp-server**

**Document Version**: 1.0.0 | **Last Updated**: December 15, 2025

---

## Agent Specialization Guide

### Architect Agent

**Purpose**: System design, technical planning, complex problem-solving

**Strengths**:
- Multi-file refactoring and coordination
- Long-form architecture design
- Technology trade-off analysis
- Codebase pattern identification

**Best For**:
- Designing complete systems from scratch
- Code analysis for technical debt
- Architecture reviews
- Complex refactoring planning
- Technology selection decisions

**Context Window Optimization**:
Load: AGENTS.md + ARCHITECTURE.md + DEVELOPMENT_PLAN.md + design docs

**Key Prompts**:
- "Design the architecture for [system]. Consider scalability, error handling, performance."
- "Review this codebase for architectural improvements and technical debt."
- "How should we handle [complex requirement] architecturally?"

**Output Artifacts**:
- ARCHITECTURE.md sections
- DEVELOPMENT_PLAN.md phases
- Design decision documents
- Refactoring strategies

**When to Use**:
- ✅ System-wide design decisions needed
- ✅ Complex refactoring planned
- ✅ Technology evaluation needed
- ✅ Performance/scalability concerns
- ❌ NOT for: Detailed code implementation, test writing, documentation

---

### Builder Agent

**Purpose**: Feature implementation, code generation, incremental development

**Strengths**:
- Test-driven implementation (TDD)
- Multi-phase feature development
- Error handling implementation
- Type-safe code generation

**Best For**:
- Implementing features from specifications
- Writing tests alongside code
- Creating utility classes and functions
- Code generation from templates
- Incremental feature delivery

**Context Window Optimization**:
Load: DEVELOPMENT_PLAN.md + ARCHITECTURE.md + [relevant source files] + tests

**Key Prompts**:
- "Implement the [feature] tool based on ARCHITECTURE.md Section [X]."
- "Write comprehensive tests for [component]. Target: >80% coverage."
- "Create [class/function] that [requirement] with proper error handling."

**Output Artifacts**:
- Source code files (src/)
- Test files (tests/)
- Commits with clear messages
- Code PRs ready for review

**When to Use**:
- ✅ Feature implementation needed
- ✅ Tests need writing
- ✅ Code refactoring
- ✅ Bug fixes
- ❌ NOT for: Architecture decisions, security reviews, documentation

---

### Validator Agent

**Purpose**: Quality assurance, testing, security review, code review

**Strengths**:
- Comprehensive test suite creation
- Security vulnerability identification
- Code quality assessment
- Performance validation

**Best For**:
- Writing comprehensive test suites
- Code review and quality assessment
- Security scanning and analysis
- Performance testing and profiling
- Coverage verification

**Context Window Optimization**:
Load: AGENTS.md + PR code + test files + security guidelines

**Key Prompts**:
- "Review this PR for code quality, security, and test adequacy: [code]"
- "Write comprehensive unit tests for [component]. Target >80% coverage."
- "Perform security review for [feature]: Check input validation, auth, data handling."
- "Profile performance of [component] and identify bottlenecks."

**Output Artifacts**:
- Code review comments
- Test suites
- Security assessment reports
- Performance benchmarks

**When to Use**:
- ✅ Code needs review
- ✅ Tests need writing/verification
- ✅ Security review needed
- ✅ Performance validation required
- ✅ Coverage verification needed
- ❌ NOT for: Implementation, architecture, documentation

---

### Scribe Agent

**Purpose**: Documentation, communication, knowledge management

**Strengths**:
- Clear, comprehensive documentation
- User-facing guide creation
- Architecture explanation
- Knowledge capture

**Best For**:
- Writing README and guides
- Documenting APIs and tools
- Creating deployment guides
- Explaining complex concepts
- User-facing documentation

**Context Window Optimization**:
Load: ARCHITECTURE.md + source code + related docs + user context

**Key Prompts**:
- "Write comprehensive documentation for [tool]: Input/output, examples, error handling."
- "Create a deployment guide for [system] based on ARCHITECTURE.md."
- "Explain [complex concept] in clear, user-friendly language with examples."
- "Write a troubleshooting guide for common [system] issues."

**Output Artifacts**:
- README.md sections
- API documentation
- User guides
- Deployment guides
- Troubleshooting docs

**When to Use**:
- ✅ Documentation needed
- ✅ Explanations required
- ✅ User guides needed
- ✅ Knowledge capture
- ❌ NOT for: Code implementation, testing, architecture decisions

---

### DevOps Agent

**Purpose**: Infrastructure, CI/CD, deployment automation

**Strengths**:
- CI/CD pipeline design
- Docker/container expertise
- Deployment automation
- Infrastructure as code

**Best For**:
- Setting up CI/CD pipelines
- Creating Docker configurations
- Deployment automation
- Infrastructure setup
- Monitoring configuration

**Context Window Optimization**:
Load: DEVELOPMENT_PLAN.md + ARCHITECTURE.md + infrastructure requirements

**Key Prompts**:
- "Design a CI/CD pipeline for [project] that runs tests, linting, and security checks."
- "Create a Docker setup for [project] with docker-compose for local development."
- "Write deployment scripts for [system] to [environment]."
- "Set up monitoring and alerting for [application]."

**Output Artifacts**:
- GitHub Actions workflows
- Docker files and docker-compose.yml
- Deployment scripts
- Infrastructure configuration
- Monitoring setup

**When to Use**:
- ✅ CI/CD pipeline needed
- ✅ Docker setup required
- ✅ Deployment automation needed
- ✅ Infrastructure setup
- ❌ NOT for: Feature implementation, testing, documentation

---

### Researcher Agent

**Purpose**: Technology evaluation, best practices research, POC development

**Strengths**:
- Technology evaluation and comparison
- Best practices research
- POC development
- Pattern identification
- Documentation research

**Best For**:
- Evaluating technology options
- Researching best practices
- Creating proof-of-concepts
- Analyzing patterns
- Competitive analysis

**Context Window Optimization**:
Load: Minimal - do broad research, then hand off findings

**Key Prompts**:
- "Research [technology] and compare with alternatives for [use case]."
- "What are the best practices for [pattern] in [language/framework]?"
- "Create a POC for [concept] to evaluate feasibility."
- "Analyze our codebase for [pattern] and document findings."

**Output Artifacts**:
- Technology evaluation reports
- Best practices documentation
- POC code
- Pattern analysis documents
- Research findings

**When to Use**:
- ✅ Technology evaluation needed
- ✅ Best practices research needed
- ✅ POC development required
- ✅ Pattern analysis needed
- ❌ NOT for: Core implementation, final decisions (recommend to Architect)

---

## Quick Selection Guide

| Task | Primary Agent | Secondary | Avoid |
|------|---------------|-----------|-------|
| Design system architecture | Architect | Researcher | Builder, DevOps |
| Implement feature | Builder | Validator | Architect, Scribe |
| Write tests | Validator | Builder | Architect, Scribe |
| Security review | Validator | Architect | Builder, Scribe |
| Write documentation | Scribe | Architect | Builder, DevOps |
| Set up CI/CD | DevOps | Validator | Scribe, Architect |
| Evaluate technology | Researcher | Architect | Builder |
| Code review | Validator | Architect | Builder, Scribe |
| Refactoring | Architect | Builder | DevOps, Scribe |
| Performance optimization | Researcher | Validator | Architect, DevOps |

---

## Example Conversations by Agent

### Architect Session

```
REQUEST:
"Design the caching layer for our MCP server.

Requirements:
- Sub-100ms response times
- 70%+ cache hit rate
- Handle 1000 RPS
- Graceful degradation when Redis down
- Support different TTLs per resource type

Provide architecture design with data models and integration points."

ARCHITECT DELIVERS:
- Architecture diagram and description
- Redis key naming strategy
- TTL strategy by resource type
- Cache invalidation approach
- Fallback behavior design
- Integration points with tools
- Performance implications
- Risk assessment
```

### Builder Session

```
REQUEST:
"Implement the getMinerStats MCP tool based on ARCHITECTURE.md.

Requirements:
- Input: poolId, minerName
- Query Braiins API for stats
- Cache results with 30s TTL
- Return formatted MCP response
- Handle errors gracefully
- >80% test coverage

Create feature branch, implement TDD, write tests first."

BUILDER DELIVERS:
- Feature branch with implementation
- Unit tests (12+ tests)
- Integration tests (5+ tests)
- API client method
- Tool handler function
- Error handling
- PR ready for review
```

### Validator Session

```
REQUEST:
"Review this PR for the getMinerStats feature.

Check for:
1. Type safety and correctness
2. Error handling completeness
3. Test coverage (target >80%)
4. Input validation
5. Security issues (API key usage, input sanitization)
6. Performance impact
7. Code style adherence

PR: [link]"

VALIDATOR DELIVERS:
- Line-by-line review
- Coverage report
- Security assessment
- Test quality analysis
- Recommendations for improvement
- Approval or change requests
```

### Scribe Session

```
REQUEST:
"Create comprehensive documentation for our MCP tools.

Tools to document:
- getMinerStats
- getPoolInfo
- getWorkerStatus

Include:
- Tool purpose and use cases
- Input parameters with examples
- Response format and examples
- Error codes and handling
- Rate limiting info
- Caching behavior
- Integration examples"

SCRIBE DELIVERS:
- Tool documentation section
- API reference
- Usage examples (TypeScript and Python)
- Error reference table
- Integration guide
- Updated README with links
```

---

## When to Escalate

| Situation | Escalate To | Why |
|-----------|-------------|-----|
| Design unclear | Architect | Needs design clarity |
| Tests don't pass | Builder | Implementation issue |
| Security concern | Validator | Security expertise |
| Performance problem | Researcher | Needs investigation |
| CI/CD failing | DevOps | Infrastructure issue |
| Multiple agents disagree | Orchestrator | Coordination needed |

---

## Document Information

**Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Orchestrator Agent

---

See also: [AGENTS.md](./AGENTS.md) • [MULTIAGENT_PLAN.md](./MULTIAGENT_PLAN.md) • [ARCHITECT](./architect.md) • [BUILDER](./builder.md) • [VALIDATOR](./validator.md)
