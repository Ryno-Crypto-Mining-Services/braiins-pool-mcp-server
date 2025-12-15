# COPILOT.md: GitHub Copilot Integration Guide

**braiins-pool-mcp-server** | Extends [AGENTS.md](./AGENTS.md)

**Document Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Audience**: GitHub Copilot, VS Code Integration

---

## Import Core Standards

**See [AGENTS.md](./AGENTS.md) for:**
- Project overview and tech stack
- Code standards (TypeScript/Python style guides)
- Testing strategy and coverage requirements
- Git operations and commit format
- Security policies
- Collaboration patterns

This document provides Copilot-specific usage patterns and optimization for this project.

---

## Copilot Configuration

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": false
  },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Keyboard Shortcuts

```
Ctrl+Enter (Win) / Cmd+Enter (Mac)  : Accept Copilot suggestion
Tab                                 : Accept suggestion
Esc                                 : Dismiss suggestion
Ctrl+] (Win) / Cmd+] (Mac)          : Next suggestion
Ctrl+[ (Win) / Cmd+[ (Mac)          : Previous suggestion
Ctrl+Shift+A (Win) / Cmd+Shift+A   : Open Copilot chat
```

---

## Best Practices for This Project

### 1. Use Copilot for Boilerplate Code

**Good Use Cases**:
- MCP tool definitions
- Test setup and fixtures
- Error handling boilerplate
- Type definitions and schemas

**Example**:
```typescript
// Type this and accept Copilot suggestion:
interface MinerStats {
  minerName: string;
  hashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  
  // Copilot suggests proper interface completion
}
```

### 2. Always Review Generated Code

**Verification Checklist**:
- [ ] Code follows AGENTS.md style guide
- [ ] Type safety (no `any` types)
- [ ] Error handling present
- [ ] Comments explain why, not what
- [ ] No hardcoded values (use config)

### 3. Use Context for Better Suggestions

**Load Project Context**:
```
#AGENTS.md
#ARCHITECTURE.md
#src/schemas/toolInputs.ts
```

This helps Copilot understand:
- Project patterns and conventions
- Type definitions to use
- Error handling approach
- Code style preferences

### 4. Copilot for Test Generation

**Pattern**:
```typescript
// Write test description:
describe('getMinerStats', () => {
  it('should return stats when API succeeds', async () => {
    // Copilot suggests test structure

  // Accept and fill in: mocking, assertions
```

**Let Copilot**:
- ✅ Generate test structure
- ✅ Create mock setups
- ✅ Add assertions
- ✅ Handle error cases

**You should**:
- ✅ Review all generated code
- ✅ Ensure proper mocking
- ✅ Verify coverage
- ✅ Check edge cases

### 5. Use Copilot for Documentation

**Great For**:
- JSDoc comments on functions
- Type documentation
- Example comments
- Error description comments

**Example**:
```typescript
/**
 * Retrieves mining statistics for a specific miner
 * 
 * @param {string} poolId - The pool identifier
 * @param {string} minerName - The miner name
 * @returns {Promise<MinerStatsResponse>} Miner statistics
 * @throws {BraiinsApiError} When API call fails
 */
// Copilot can generate this JSDoc quickly
```

### 6. Copilot for Error Handling

**Pattern**:
```typescript
try {
  const response = await braiinsClient.get(`/miners/${minerName}`);
  // Copilot suggests proper error handling for this context
} catch (error) {
  // Copilot knows to check for axios errors, throw BraiinsApiError, log properly
}
```

---

## Code Generation Patterns

### Pattern 1: API Methods

**Trigger**:
```typescript
class BraiinsClient {
  async getMinerStats(poolId: string, minerName: string): Promise<MinerStats> {
    // Copilot generates proper method body
```

**Copilot Should Generate**:
- ✅ Proper URL construction
- ✅ Bearer token auth
- ✅ Error handling
- ✅ Response typing
- ✅ Validation

### Pattern 2: Validation Schemas

**Trigger**:
```typescript
export const MinerStatsInputSchema = z.object({
  poolId: z.string().min(1).max(50),
  minerName: z.string(),
  // Copilot continues the pattern
```

**Copilot Knows**:
- ✅ Zod validation patterns
- ✅ Project constraint rules
- ✅ Error message format

### Pattern 3: Test Suites

**Trigger**:
```typescript
describe('RedisManager', () => {
  let manager: RedisManager;

  beforeEach(() => {
    manager = new RedisManager();
  });

  it('should get cached value when present', async () => {
    // Copilot generates test pattern
```

**Copilot Generates**:
- ✅ Test structure (Arrange-Act-Assert)
- ✅ Mocking pattern
- ✅ Assertions

### Pattern 4: Error Handling

**Trigger**:
```typescript
// Copilot completes error handling pattern
catch (error) {
  if (axios.isAxiosError(error)) {
    // Copilot knows project error patterns
```

---

## Commands for Copilot Chat

### Ask About Code

```
"What does this function do?"
"Explain this error handling approach"
"How should I test this component?"
```

### Request Code

```
"Generate a retry function with exponential backoff"
"Write unit tests for error handling"
"Create a validation schema for pool ID"
```

### Architecture Questions

```
"How should we structure the caching layer?"
"What error types should we define?"
"How should validation work in this project?"
```

### Debug Help

```
"Why is this test failing?"
"What could cause this error?"
"How should I handle this edge case?"
```

---

## When NOT to Use Copilot

❌ **Don't Use For**:
- Complex architectural decisions
- Security-sensitive code (use human review)
- Error messages that expose sensitive info
- API integration (too context-specific)
- Anything you don't fully understand

⚠️ **Always Review**:
- Type safety
- Error handling completeness
- Security implications
- Performance implications
- Test coverage

---

## Disabling Copilot for Specific Files

**In .copilotignore**:
```
# Configuration files
.env*
.secrets*

# Generated files
dist/
build/
*.min.js

# Test data with sensitive info
tests/fixtures/secrets*
```

---

## Performance Tips

### Optimize Suggestions Quality

1. **Load Relevant Context**:
   - Open related files before starting
   - This helps Copilot understand patterns

2. **Be Specific in Comments**:
   ```typescript
   // Bad: "get stats"
   // Good: "Query Braiins API for miner stats, cache 30s, validate with schema"
   ```

3. **Show Examples**:
   ```typescript
   // Copilot learns from existing code
   // Having similar functions helps it generate correctly
   ```

4. **Use Tab to Cycle**:
   - Press Tab multiple times to see alternatives
   - Pick the best suggestion

### Suggest Inline Completions

- **Use for**: Variable names, small expressions, error messages
- **Don't use for**: Complex logic, critical business logic

---

## Common Patterns Copilot Understands

| Pattern | Copilot Skill | Use Case |
|---------|---------------|----------|
| Error handling | ⭐⭐⭐⭐ | Try-catch, custom errors |
| Validation schemas | ⭐⭐⭐⭐ | Zod schemas, type guards |
| Test structure | ⭐⭐⭐⭐ | Unit tests, mocking |
| API methods | ⭐⭐⭐ | HTTP requests, auth |
| Documentation | ⭐⭐⭐⭐ | JSDoc, comments |
| Type definitions | ⭐⭐⭐⭐ | Interfaces, types |
| Refactoring | ⭐⭐ | Extract functions, simplify |
| Architecture | ⭐ | Complex design decisions |

---

## Troubleshooting Copilot Suggestions

### Problem: Suggestions Ignore Project Style

**Solution**:
1. Load AGENTS.md in context
2. Show examples of correct style
3. Correct first suggestion, accept second
4. Use Tab to cycle through options

### Problem: Suggestions Use Wrong Libraries

**Solution**:
1. Specify exact library in comment
2. Load file using library in context
3. Show import statement example

### Problem: Security Issues in Code

**Solution**:
1. Always review sensitive code manually
2. Use Copilot chat to ask about security
3. Request human review (Validator agent) for production code

---

## Integration with Development Workflow

### With GitHub Copilot for PRs

Copilot can comment on PRs in VS Code:
- Review suggestions before committing
- Check `npm run lint` catches style issues
- Verify tests pass locally

### With Testing

```typescript
// Copilot generates test boilerplate
// You verify it covers:
describe('Feature', () => {
  it('should work', async () => {
    // Copilot: generates test
    // You: verify coverage, edge cases
  });
});
```

### With Git Commit Messages

Copilot can suggest commit messages:
```bash
git commit -m "feat(miners): add stats caching layer"
# Copilot suggests conventional commit format
```

---

## Training Copilot on Your Patterns

Best Copilot works when it learns your code patterns:

1. **Write first implementations manually** - Copilot learns from them
2. **Keep similar code nearby** - Helps Copilot understand patterns
3. **Use consistent naming** - Copilot recognizes naming conventions
4. **Comment your intent** - Comments guide Copilot suggestions
5. **Correct suggestions** - Copilot improves from corrections

---

## Document Information

**Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Engineering Standards Committee

---

See also: [AGENTS.md](./AGENTS.md) • [CLAUDE.md](./CLAUDE.md) • [ARCHITECTURE.md](./ARCHITECTURE.md) • [.github/copilot-instructions.md](./.github/copilot-instructions.md)
