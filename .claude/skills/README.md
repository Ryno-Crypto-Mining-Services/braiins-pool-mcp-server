# Skills Directory: Braiins Pool MCP Server

This directory contains project-specific skills for developing the braiins-pool-mcp-server. These skills encode domain knowledge, best practices, and implementation patterns for MCP server development with Braiins Pool API integration.

## Philosophy: Skills-First Development

This project uses a **skills-first approach** rather than multiple specialized agents:

| Traditional Approach | Skills-First Approach |
|---------------------|----------------------|
| Multiple agents (Builder, Validator, etc.) | Single agent + domain skills |
| Each agent has full context | Skills loaded on-demand |
| High token usage | 35% token reduction |
| Agent coordination overhead | Native skill composition |

**Result**: Faster iteration, consistent quality, portable workflows.

---

## Available Skills

### MCP Development Skills

| Skill | Purpose | Key Triggers |
|-------|---------|--------------|
| **[mcp-tool-builder](mcp-tool-builder/SKILL.md)** | Implement new MCP tools end-to-end | "create MCP tool", "implement tool" |
| **[mcp-schema-designer](mcp-schema-designer/SKILL.md)** | Design Zod validation schemas | "design schema", "input validation" |

### Braiins Integration Skills

| Skill | Purpose | Key Triggers |
|-------|---------|--------------|
| **[braiins-cache-strategist](braiins-cache-strategist/SKILL.md)** | Design Redis caching strategies | "cache strategy", "set TTL" |
| **[braiins-api-mapper](braiins-api-mapper/SKILL.md)** | Map API endpoints to MCP tools | "map endpoint", "API integration" |

### Quality Skills (Planned)

| Skill | Purpose | Status |
|-------|---------|--------|
| mcp-validator | Validate MCP implementations | Planned |
| security-auditor | Security review | Planned |
| performance-profiler | Performance optimization | Planned |

---

## Using Skills

Skills are invoked automatically based on task context, or explicitly:

```
User: "Create the getMinerStats MCP tool"
→ Claude loads: mcp-tool-builder skill
→ Follows structured workflow
→ Produces: schemas, handler, tests
```

### Explicit Invocation

```
User: "Use the mcp-schema-designer skill to create validation for worker IDs"
→ Claude loads specific skill
→ Applies schema design patterns
```

### Skill Composition

Skills can be chained for complex workflows:

```
1. mcp-schema-designer → Design schemas
2. braiins-cache-strategist → Determine TTL
3. mcp-tool-builder → Implement handler
```

---

## Skill Structure

Each skill follows this structure:

```
skills/
└── {skill-name}/
    ├── SKILL.md       # Main skill definition
    ├── templates/     # Code templates (optional)
    └── examples/      # Usage examples (optional)
```

### SKILL.md Format

```yaml
---
name: skill-name
version: 1.0.0
category: category
complexity: simple|moderate|complex
status: active|draft|deprecated
created: 2025-12-18
author: braiins-pool-mcp-server

description: |
  Multi-line description of what the skill does.

triggers:
  - "trigger phrase 1"
  - "trigger phrase 2"

dependencies:
  - other-skill-name
---

# Skill Name

## Description
...

## When to Use This Skill
...

## When NOT to Use This Skill
...

## Workflow
...

## Examples
...

## Quality Standards
...
```

---

## Integration with Commands

Skills power the project's custom commands:

| Command | Uses Skills |
|---------|-------------|
| `/mcp-tool` | mcp-tool-builder, mcp-schema-designer |
| `/validate-tool` | mcp-validator |
| `/cache-design` | braiins-cache-strategist |

See [../commands/](../commands/) for command documentation.

---

## Creating New Skills

1. **Identify repetitive workflow** that happens 3+ times
2. **Document the workflow** step-by-step
3. **Create skill file** at `.claude/skills/{skill-name}/SKILL.md`
4. **Include examples** with real data (not placeholders)
5. **Test the skill** with multiple scenarios
6. **Add to this README**

Use the skill-creator skill from the docs/claude reference:
```
User: "Use the skill-creator skill to build a skill for [your workflow]"
```

---

## Skill Quality Standards

Every skill in this repository must meet:

- [ ] Clear, action-oriented triggers (3-5 minimum)
- [ ] "When NOT to Use" section (prevents overlap)
- [ ] Step-by-step workflow with decision points
- [ ] 2-5 concrete examples with real data
- [ ] Quality checklist for outputs
- [ ] Common pitfalls section
- [ ] Version history

---

## Project-Specific Patterns

These patterns are embedded in our skills:

### Cache-First Data Access
```typescript
// Check cache → Miss? Call API → Store in cache → Return
const cached = await cache.get(key);
if (cached) return cached;
const data = await api.fetch();
await cache.set(key, data, ttl);
return data;
```

### Zod Validation Pattern
```typescript
const result = schema.safeParse(input);
if (!result.success) {
  return { error: 'VALIDATION_ERROR', details: result.error.flatten() };
}
```

### Error Response Pattern
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(errorResponse) }],
  isError: true,
};
```

---

## Resources

- **Skills Architecture**: [SKILLS_ARCHITECTURE.md](../../SKILLS_ARCHITECTURE.md)
- **API Reference**: [API.md](../../API.md)
- **System Architecture**: [ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Development Plan**: [DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md)

---

## Version

**Skills Library Version**: 1.0.0
**Last Updated**: December 18, 2025
**Skills Count**: 4 active, 3 planned
