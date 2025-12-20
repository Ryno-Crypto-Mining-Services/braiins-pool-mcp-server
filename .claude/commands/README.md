# Commands Directory: Braiins Pool MCP Server

This directory contains project-specific slash commands for developing the braiins-pool-mcp-server. Commands provide quick-access workflows for common development tasks.

## Available Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/mcp-tool` | Scaffold and implement new MCP tool | `/mcp-tool <tool-name>` |
| `/validate-tool` | Run comprehensive tool validation | `/validate-tool <tool-name>` |
| `/cache-design` | Design Redis caching strategy | `/cache-design <endpoint>` |
| `/api-sync` | Check implementation vs API.md | `/api-sync` |

---

## Command Details

### /mcp-tool

**Purpose**: Scaffold and implement a new MCP tool from API specification to production-ready code with tests.

```bash
/mcp-tool getUserOverview
```

**Creates**:
- `src/schemas/{toolName}Input.ts`
- `src/schemas/{toolName}Response.ts`
- `src/tools/{toolName}.ts`
- `tests/unit/tools/{toolName}.test.ts`

**Uses Skills**: `mcp-tool-builder`, `mcp-schema-designer`

---

### /validate-tool

**Purpose**: Run comprehensive validation on an implemented MCP tool.

```bash
/validate-tool getUserOverview
```

**Checks**:
- Schema completeness
- Handler implementation
- Error handling coverage
- Caching integration
- Test coverage (>80%)
- Security review
- Documentation

**Uses Skills**: `mcp-validator`

---

### /cache-design

**Purpose**: Design a Redis caching strategy for a specific API endpoint.

```bash
/cache-design /workers/{workerId}
```

**Outputs**:
- TTL recommendation
- Cache key pattern
- Implementation snippets
- Metrics recommendations

**Uses Skills**: `braiins-cache-strategist`

---

### /api-sync

**Purpose**: Synchronize implementation with API.md changes.

```bash
/api-sync
```

**Reports**:
- Missing tools (endpoints not implemented)
- Schema drift (params/response changed)
- Deprecated endpoints
- Fully synced tools

**Uses Skills**: `braiins-api-mapper`

---

## Command Workflow

Commands integrate with skills to provide structured workflows:

```
User invokes command
        ↓
Claude loads relevant skill(s)
        ↓
Skill workflow guides execution
        ↓
Output follows consistent format
        ↓
Quality standards embedded
```

---

## Creating New Commands

1. **Identify common workflow** that happens 3+ times
2. **Create command file** at `.claude/commands/{command-name}.md`
3. **Define**: Purpose, usage, arguments, output format, workflow
4. **Link to skill(s)** that implement the workflow
5. **Add examples** with real data
6. **Update this README**

### Command File Template

```markdown
# /{command-name} Command

## Purpose
Brief description of what the command does.

## Usage
```
/{command-name} <arguments>
```

## Arguments
| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `arg1` | string | Yes | Description |

## What This Command Does
1. Step 1
2. Step 2
3. ...

## Output Format
...

## Examples
...

## Related Commands
...

## Related Skills
...
```

---

## Integration with Skills

Commands are the user-facing interface to skills:

| Command | Primary Skill | Supporting Skills |
|---------|--------------|-------------------|
| `/mcp-tool` | mcp-tool-builder | mcp-schema-designer, braiins-api-mapper |
| `/validate-tool` | mcp-validator | security-auditor |
| `/cache-design` | braiins-cache-strategist | - |
| `/api-sync` | braiins-api-mapper | - |

See [../skills/README.md](../skills/README.md) for skill documentation.

---

## Version

**Commands Library Version**: 1.0.0
**Last Updated**: December 18, 2025
**Commands Count**: 4 active

---

See also: [Skills Directory](../skills/README.md) • [SKILLS_ARCHITECTURE.md](../../SKILLS_ARCHITECTURE.md) • [DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md)
