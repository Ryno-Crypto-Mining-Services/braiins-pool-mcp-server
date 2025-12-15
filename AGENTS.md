# AGENTS.md: Universal AI Coding Agent Instructions

**braiins-pool-mcp-server** | [GitHub](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server)

**Document Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Audience**: All AI coding agents (Claude, Copilot, Cursor, Gemini)

---

## Project Overview

### Project Identity
- **Name**: braiins-pool-mcp-server
- **Type**: Model Context Protocol (MCP) Server
- **Purpose**: Connect Claude and other AI models to the Braiins Bitcoin mining pool API via a standardized MCP interface
- **Business Context**: Enable AI agents to query mining pool statistics, monitor worker performance, and manage pool operations programmatically

### Technology Stack Summary

#### Core Framework
- **Language**: TypeScript (primary) OR Python 3.10+ (alternative)
- **MCP SDK**: 
  - TypeScript: `@modelcontextprotocol/sdk` v0.5+
  - Python: `fastmcp` or `mcp` package v1.0+
- **Runtime**: Node.js 18+ (TS) or Python 3.10+ (Py)

#### Transport Layer
- **Primary**: stdio (local connections, development)
- **Optional**: StreamableHTTPServerTransport (remote/production)
- **Protocol**: JSON-RPC 2.0 for MCP messaging

#### API Integration
- **Target API**: Braiins Pool API [Documentation](https://academy.braiins.com/en/braiins-pool/monitoring/#api-configuration)
- **HTTP Client**:
  - TypeScript: `axios` or `node-fetch`
  - Python: `httpx` (async) or `requests`
- **Authentication**: Bearer tokens via API keys
- **Rate Limiting**: Implement 1-second backoff between requests per Braiins guidelines

#### Performance & Caching
- **Cache Layer**: Redis server
- **Client Library**: 
  - TypeScript: `redis` or `ioredis` v5+
  - Python: `redis` or `aioredis`
- **Cache Strategy**:
  - Miner stats: 30-second TTL
  - Pool info: 60-second TTL
  - Historical data: 300-second TTL
  - Auth tokens: 3600-second TTL (1 hour)

#### Validation & Type Safety
- **TypeScript**: `zod` v3+ for runtime schema validation
- **Python**: `pydantic` v2+ for data models and settings
- **JSON Schema**: Validate MCP tool definitions at initialization

#### Development Tools
- **TypeScript**:
  - Build: `esbuild` or `tsup`
  - Package manager: `npm` or `pnpm`
  - Runtime development: `tsx` or `ts-node`
  - Environment: `dotenv`
  
- **Python**:
  - Server: `uvicorn` (ASGI)
  - Package manager: `pip` or `poetry`
  - Environment: `python-dotenv`
  - Type checking: `mypy`

#### Testing & Quality
- **Testing Framework**:
  - TypeScript: `vitest` v1+ or `jest` v29+
  - Python: `pytest` v7+
- **Coverage Target**: Minimum 80% line coverage
- **Linting**:
  - TypeScript: `eslint` v8+ with `@typescript-eslint`
  - Python: `ruff` (linting) + `black` (formatting)
- **Pre-commit Hooks**: husky (TS) or pre-commit (Py)

#### Security & Credentials
- **Secrets Management**:
  - `.env` files (development only)
  - Environment variables (all environments)
  - Never commit credentials
- **API Key Validation**: All requests validated against allow-listed keys
- **Input Sanitization**: All user inputs validated with zod/pydantic before API calls

### Architecture Pattern
- **Overall**: Monolithic with modular components
- **Components**:
  1. MCP Server (main entry point, tool definitions)
  2. Braiins API Client (HTTP wrapper with retry logic)
  3. Redis Cache Manager (performance layer)
  4. Data Models/Schemas (validation and typing)
  5. Error Handlers (unified error response)
  6. Configuration Manager (env vars and settings)

---

## Code Discovery

### Directory Structure

```
braiins-pool-mcp-server/
├── src/
│   ├── index.ts OR main.py           # Entry point, server initialization
│   ├── server.ts OR server.py         # MCP server setup
│   ├── tools/
│   │   ├── minerStats.ts OR miner_stats.py
│   │   ├── poolInfo.ts OR pool_info.py
│   │   ├── workerStatus.ts OR worker_status.py
│   │   └── README.md                 # Tool descriptions
│   ├── api/
│   │   ├── braiinsClient.ts OR braiins_client.py
│   │   ├── httpClient.ts OR http_client.py
│   │   └── types.ts OR types.py      # API response types
│   ├── cache/
│   │   ├── redisManager.ts OR redis_manager.py
│   │   └── cacheKeys.ts OR cache_keys.py
│   ├── schemas/
│   │   ├── toolInputs.ts OR tool_inputs.py    # Input validation
│   │   ├── apiResponses.ts OR api_responses.py # Response schemas
│   │   └── config.ts OR config.py             # Configuration schemas
│   ├── utils/
│   │   ├── logger.ts OR logger.py
│   │   ├── errors.ts OR errors.py
│   │   └── helpers.ts OR helpers.py
│   └── config/
│       └── settings.ts OR settings.py
├── tests/
│   ├── unit/
│   │   ├── tools/
│   │   ├── api/
│   │   ├── cache/
│   │   └── utils/
│   ├── integration/
│   │   ├── mcpServer.test.ts
│   │   └── braiinsApi.test.ts
│   └── fixtures/
│       └── mockData.ts OR mock_data.py
├── .env.example              # Environment variable template
├── .env.development          # Development-only secrets (gitignored)
├── .env.test                 # Test-only variables
├── .eslintrc.json OR .ruff.toml  # Linting config
├── .prettierrc.json OR pyproject.toml # Formatting config
├── tsconfig.json OR pyproject.toml    # Compilation config
├── package.json OR requirements.txt   # Dependencies
├── docker-compose.yml        # Redis + local dev environment
├── README.md                 # Project overview
├── AGENTS.md                 # This file
├── CLAUDE.md                 # Claude-specific instructions
├── ARCHITECTURE.md           # System design details
├── DEVELOPMENT_PLAN.md       # Phased roadmap
├── TODO.md                   # Task list
├── MULTIAGENT_PLAN.md        # Agent coordination
├── AGENT_REGISTRY.md         # Agent roles and capabilities
├── COPILOT.md               # GitHub Copilot instructions
└── .github/
    ├── copilot-instructions.md
    └── instructions/
        ├── testing.md
        ├── api-design.md
        ├── security.md
        └── deployment.md
```

### File Naming Conventions

**Source Code**:
- `camelCase.ts` (TypeScript files)
- `snake_case.py` (Python files)
- `utils/` for shared utilities
- `tools/` for MCP tool implementations
- `api/` for external API integrations
- `cache/` for caching logic
- `schemas/` for validation and types

**Tests**:
- `*.test.ts` or `*_test.py` (collocated with source)
- `tests/unit/` for unit tests
- `tests/integration/` for integration tests
- `tests/fixtures/` for test data and mocks

**Documentation**:
- `README.md` (project overview)
- `AGENTS.md` (universal instructions - THIS FILE)
- Agent-specific: `CLAUDE.md`, `COPILOT.md`
- Architecture: `ARCHITECTURE.md`, `DEVELOPMENT_PLAN.md`
- Tasks: `TODO.md`, coordination in `MULTIAGENT_PLAN.md`

### Code Search Patterns

#### Finding Tool Implementations
```bash
# Locate specific MCP tool
grep -r "name.*minerStats\|name.*miner_stats" src/

# List all tool definitions
grep -r "tools\s*=" src/ | grep -v "\.test"

# Find tool handler functions
grep -r "processTool\|process_tool" src/
```

#### Finding API Integration Code
```bash
# Locate Braiins API calls
grep -r "braiinsClient\|braiins_client" src/

# Find HTTP requests
grep -r "axios\|httpx\|requests\." src/ | grep -v test

# View API configuration
grep -r "BRAIINS_API\|BRAIINS_URL" src/
```

#### Finding Cache Operations
```bash
# Locate Redis calls
grep -r "redis\|getFromCache\|get_from_cache" src/

# Find cache key definitions
grep -r "cacheKey\|cache_key" src/cache/

# View TTL configurations
grep -r "TTL\|ttl\|EX\|ex" src/cache/
```

#### Finding Configuration
```bash
# View environment variable usage
grep -r "process.env\|os.environ" src/ | grep -v test

# Find settings definitions
grep -r "class.*Settings\|SETTINGS" src/

# Locate configuration files
find . -name "*.env*" -o -name "*config*" | grep -v node_modules
```

---

## Code Editing Standards

### TypeScript Style Guide

#### File Structure
```typescript
// 1. Package imports (external)
import { ServerResource } from '@modelcontextprotocol/sdk/shared/messages.js';
import axios from 'axios';
import { createClient } from 'redis';

// 2. Relative imports
import { BraiinsClient } from './api/braiinsClient.js';
import { validateToolInput } from './schemas/toolInputs.js';

// 3. Type definitions
interface MinerStatsRequest {
  poolId: string;
  minerName: string;
}

interface MinerStatsResponse {
  minerName: string;
  hashrate: number;
  acceptedShares: number;
  rejectedShares: number;
  lastSeen: Date;
}

// 4. Constants
const DEFAULT_CACHE_TTL = 30; // seconds
const BRAIINS_API_BASE_URL = 'https://api.braiins.com/';

// 5. Class/function definitions
export class MinerStatsService {
  // ...
}

// 6. Exports
export { MinerStatsService };
export type { MinerStatsRequest, MinerStatsResponse };
```

#### Naming Conventions
- **Classes**: PascalCase (`BraiinsClient`, `RedisManager`)
- **Functions**: camelCase (`getMinerStats`, `validateInput`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CACHE_TTL`, `BRAIINS_API_URL`)
- **Types/Interfaces**: PascalCase (`MinerStats`, `ApiResponse`)
- **Private members**: `#private` (ES2022) or `_private` prefix

#### Code Formatting
```typescript
// Use prettier configuration in .prettierrc.json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "arrowParens": "always"
}

// ESLint rules in .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/explicit-function-return-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Python Style Guide

#### File Structure
```python
# 1. Standard library imports
import os
from typing import Optional, Dict, List
from datetime import datetime

# 2. Third-party imports
import httpx
from pydantic import BaseModel, Field
from redis import Redis

# 3. Relative imports
from .api.braiins_client import BraiinsClient
from .schemas.tool_inputs import MinerStatsRequest

# 4. Type definitions and constants
class MinerStatsResponse(BaseModel):
    miner_name: str
    hashrate: float
    accepted_shares: int
    rejected_shares: int
    last_seen: datetime

DEFAULT_CACHE_TTL: int = 30  # seconds
BRAIINS_API_BASE_URL: str = "https://api.braiins.com/"

# 5. Class/function definitions
class MinerStatsService:
    pass

# 6. Main execution
if __name__ == "__main__":
    pass
```

#### Naming Conventions
- **Classes**: PascalCase (`BraiinsClient`, `RedisManager`)
- **Functions**: snake_case (`get_miner_stats`, `validate_input`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_CACHE_TTL`, `BRAIINS_API_URL`)
- **Private**: `_private_method` or `__very_private`
- **Modules**: snake_case (`braiins_client.py`, `redis_manager.py`)

#### Code Formatting
```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py310']

[tool.ruff]
line-length = 100
target-version = "py310"
select = ["E", "F", "I", "N", "UP", "RUF"]
```

### Error Handling

#### TypeScript Error Pattern
```typescript
// Define custom errors
export class BraiinsApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'BraiinsApiError';
  }
}

// Use with try-catch
async function getMinerStats(poolId: string): Promise<MinerStatsResponse> {
  try {
    const response = await braiinsClient.get(`/pool/${poolId}/miners`);
    return validateResponse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('Braiins API error', {
        status: error.response?.status,
        message: error.message,
        poolId,
      });
      throw new BraiinsApiError(
        `Failed to fetch miner stats: ${error.message}`,
        error.response?.status,
        error
      );
    }
    throw error;
  }
}

// In MCP tool handler
try {
  const result = await minerStatsService.getStats(request.poolId);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  return {
    isError: true,
    content: [{ type: 'text', text: `Error: ${error.message}` }],
  };
}
```

#### Python Error Pattern
```python
# Define custom errors
class BraiinsApiError(Exception):
    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        original_error: Optional[Exception] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.original_error = original_error
        super().__init__(message)

# Use with try-except
async def get_miner_stats(pool_id: str) -> MinerStatsResponse:
    try:
        response = await braiins_client.get(f"/pool/{pool_id}/miners")
        return validate_response(response.json())
    except httpx.HTTPError as e:
        logger.error(
            "Braiins API error",
            extra={
                "status": e.response.status_code if hasattr(e, 'response') else None,
                "message": str(e),
                "pool_id": pool_id,
            },
        )
        raise BraiinsApiError(
            f"Failed to fetch miner stats: {str(e)}",
            status_code=getattr(e.response, 'status_code', None),
            original_error=e,
        ) from e
```

### Follow-up Actions After Code Edits

After creating or modifying code files:

1. **Run Formatting**
   ```bash
   # TypeScript
   npm run format
   
   # Python
   black src/ && isort src/
   ```

2. **Run Linting**
   ```bash
   # TypeScript
   npm run lint
   
   # Python
   ruff check src/
   ```

3. **Write/Update Tests**
   - Update corresponding test files in `tests/`
   - Ensure new code has test coverage
   - Run `npm test` or `pytest` before commit

4. **Update Documentation**
   - Add inline comments for complex logic
   - Update README.md if changing public APIs
   - Update tool definitions in `src/tools/README.md`

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(module): description of change"
   ```

---

## Code Quality Standards

### Testing Philosophy

#### Test-Driven Development (TDD)
```
1. Write failing test (Red phase)
2. Implement minimal code to pass (Green phase)
3. Refactor for quality (Refactor phase)
4. Repeat for next feature
```

#### Test Structure
```typescript
// TypeScript example with vitest
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinerStatsService } from '../src/services/MinerStatsService';
import { mockBraiinsResponse } from '../tests/fixtures/mockData';

describe('MinerStatsService', () => {
  let service: MinerStatsService;
  
  beforeEach(() => {
    // Setup
    service = new MinerStatsService();
  });

  describe('getStats', () => {
    it('should return miner stats when API succeeds', async () => {
      // Arrange
      const poolId = 'test-pool';
      vi.spyOn(service['client'], 'get').mockResolvedValue(mockBraiinsResponse);
      
      // Act
      const result = await service.getStats(poolId);
      
      // Assert
      expect(result).toEqual(expect.objectContaining({
        minerName: expect.any(String),
        hashrate: expect.any(Number),
      }));
    });

    it('should throw BraiinsApiError when API fails', async () => {
      // Arrange
      const poolId = 'test-pool';
      vi.spyOn(service['client'], 'get').mockRejectedValue(new Error('API Error'));
      
      // Act & Assert
      await expect(service.getStats(poolId)).rejects.toThrow('BraiinsApiError');
    });
  });
});
```

#### Coverage Requirements
- **Minimum**: 80% line coverage
- **Unit tests**: Cover all public functions and edge cases
- **Integration tests**: Test MCP tool execution end-to-end
- **Coverage reports**: Generate and review before PR
  ```bash
  npm run coverage           # TypeScript
  pytest --cov src/ tests/   # Python
  ```

### Code Quality Metrics

#### Linting Standards
- **Zero errors** before commit (warnings allowed with justification)
- **ESLint** (TS): Recommended rules + strict TypeScript rules
- **Ruff** (Py): F (pyflakes), E (pycodestyle), I (isort)
- **Pre-commit hooks**: Prevent commits with linting violations

#### Complexity Limits
- **Cyclomatic complexity**: Max 10 per function
- **Function length**: Max 40 lines (hard limit)
- **File length**: Max 400 lines (split into modules if exceeded)
- **Nesting depth**: Max 4 levels

#### Code Review Checklist
- [ ] Tests included and passing
- [ ] Code formatted and linted
- [ ] No console.log/print statements in production code
- [ ] Error handling for all failure paths
- [ ] Type safety (no `any` in TypeScript)
- [ ] Security review (input validation, auth checks)
- [ ] Documentation updated

---

## Tool Use: AI Agents

### Allowed Tool Operations

#### Read Operations (Always Allowed)
- Read any project file
- Search codebase with grep/find
- Review git history
- List directory contents
- View file diffs

#### Write Operations (With Restrictions)
- **Create source code**: Only in feature branches
- **Modify tests**: Always allowed
- **Update documentation**: Always allowed
- **Create commits**: Feature branches only
- **Push to remote**: Never (only to feature branches)

#### Restricted Operations
- ❌ Merge to main/develop branches (Validator only)
- ❌ Modify .env.development or .env files (never commit secrets)
- ❌ Delete files without explicit approval
- ❌ Force-push to any branch
- ❌ Modify CI/CD configuration without review

### Command Execution Permissions

```yaml
Allowed:
  - npm install / pip install
  - npm test / pytest
  - npm run format / black
  - npm run lint / ruff check
  - git checkout / git commit / git push (feature branches)
  - git log / git diff / git status
  - npx / python -m (for tools)

Restricted:
  - npm publish / pip upload
  - git reset --hard
  - rm -rf / rm -f (destructive)
  - docker run (without approval)
  - Database operations (migrations require review)

Never:
  - deploy / npm run deploy
  - git push origin main
  - git merge (to main/develop)
  - curl with credentials
  - export secrets
```

### Context Injection Standards

#### For Each Session
Load these files in order:
1. `AGENTS.md` (this file) - universal standards
2. Agent-specific file (`CLAUDE.md`, `COPILOT.md`)
3. `ARCHITECTURE.md` - system design
4. `DEVELOPMENT_PLAN.md` - current phase goals
5. Relevant source files (only files being modified)

#### Context Management
- Don't load entire repository if not needed
- Summarize large files (>1000 lines) rather than copying
- Use git diff to understand recent changes
- Reference documentation links rather than copying content

---

## Git Operations

### Branch Strategy: Git Flow

#### Branch Types
- **main**: Production-ready code, tagged releases only
- **develop**: Integration branch, basis for feature branches
- **feature/\***: Individual feature development
- **bugfix/\***: Bug fixes for unreleased features
- **hotfix/\***: Urgent production fixes

#### Feature Branch Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/miner-stats-api

# 2. Make commits (multiple allowed)
git add .
git commit -m "feat(miners): add stats caching layer"

# 3. Keep updated with develop
git fetch origin develop
git rebase origin/develop

# 4. Push to origin
git push origin feature/miner-stats-api

# 5. Create pull request (via GitHub UI)
# DO NOT merge yourself

# 6. After PR merged
git checkout develop
git pull origin develop
git branch -d feature/miner-stats-api
```

### Commit Message Format: Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Test additions or updates
- **chore**: Build, dependencies, tooling

#### Scopes
- `miners` - Miner-related functionality
- `pool` - Pool-level operations
- `api` - API client and integration
- `cache` - Redis caching layer
- `auth` - Authentication/authorization
- `mcp` - MCP server and tools
- `docs` - Documentation
- `test` - Testing infrastructure

#### Subject Line
- Imperative mood ("add feature" not "added feature")
- No period at end
- Max 50 characters
- Lowercase first letter

#### Body
- Wrap at 72 characters
- Explain WHAT and WHY, not HOW
- Separate from subject with blank line
- Optional but recommended

#### Footer
- Reference issues: `Fixes #123`
- Document breaking changes: `BREAKING CHANGE: description`

#### Examples

```
feat(miners): add real-time hashrate tracking via WebSocket

- Implement WebSocket connection to Braiins pool
- Parse hashrate updates and cache in Redis
- Add MCP tool for live stats queries
- All tests passing, 85% coverage

Fixes #42
```

```
fix(cache): prevent stale data in rapid-fire requests

The Redis TTL refresh was not triggered on cache hits,
causing clients to receive stale stats. Now refreshes
TTL on each cache hit to maintain consistency.

Fixes #89
Refs: #88
```

#### Merge Strategy
- **Squash merge** for feature branches (clean history)
- **No-ff merge** for releases (preserve branch structure)
- Require code review before any merge to main/develop

---

## Testing Strategy

### Test Types and Locations

#### Unit Tests
**Location**: `tests/unit/`
**Pattern**: Test single function/class in isolation
**Mocking**: Mock all external dependencies (HTTP, Redis, etc.)

```typescript
// tests/unit/api/braiinsClient.test.ts
describe('BraiinsClient', () => {
  describe('getPoolStats', () => {
    it('should parse response correctly', async () => {
      // Test function logic, mock HTTP layer
    });
  });
});
```

**Run**: `npm test unit` or `pytest tests/unit/`

#### Integration Tests
**Location**: `tests/integration/`
**Pattern**: Test MCP tool execution with mock API
**Mocking**: Mock Braiins API, real Redis cache

```typescript
// tests/integration/tools/minerStats.test.ts
describe('minerStats MCP Tool', () => {
  it('should return formatted stats from end-to-end', async () => {
    // Call MCP tool, verify output format
  });
});
```

**Run**: `npm test integration` or `pytest tests/integration/`

#### End-to-End Tests (Optional)
**Location**: `tests/e2e/`
**Pattern**: Test against real services in test environment
**When**: Before production deployment only

```bash
# Run with docker-compose test environment
docker-compose -f docker-compose.test.yml up
npm run test:e2e
```

### Coverage Requirements

#### Minimum Coverage
- **Lines**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Statements**: 80%

#### Coverage Report Generation
```bash
# TypeScript
npm run coverage
# Opens coverage/index.html

# Python
pytest --cov=src --cov-report=html tests/
# Opens htmlcov/index.html
```

#### Coverage Enforcement
- CI/CD blocks merges if coverage drops below 80%
- All new code must have corresponding tests
- Coverage reports required in PR descriptions

### Test Execution Commands

```bash
# TypeScript
npm test                      # Run all tests
npm test -- --watch          # Watch mode
npm run coverage              # Coverage report
npm test unit                 # Unit only
npm test integration          # Integration only

# Python
pytest                        # Run all tests
pytest -v                     # Verbose output
pytest --cov src/ tests/      # Coverage report
pytest tests/unit/            # Unit only
pytest tests/integration/     # Integration only
```

---

## Security Policies

### Authentication Patterns

#### API Key Management
```typescript
// DO: Load from environment at startup
interface ApiConfig {
  braiinsApiKey: string;
  redisPassword?: string;
}

const config: ApiConfig = {
  braiinsApiKey: process.env.BRAIINS_API_KEY || '',
  redisPassword: process.env.REDIS_PASSWORD,
};

if (!config.braiinsApiKey) {
  throw new Error('BRAIINS_API_KEY environment variable is required');
}

// DO: Use in Authorization header
const headers = {
  'Authorization': `Bearer ${config.braiinsApiKey}`,
  'Content-Type': 'application/json',
};

// DON'T: Log or expose API keys
console.log(config.braiinsApiKey); // ❌ NEVER
logger.debug('Config loaded', config); // ❌ NEVER

// DON'T: Hardcode credentials
const apiKey = 'sk-1234567890'; // ❌ NEVER
```

#### Token Management
```typescript
// Cache bearer token with refresh
const cacheKey = 'auth:braiins:token';
const cachedToken = await redis.get(cacheKey);

if (!cachedToken) {
  // Refresh token from API
  const newToken = await refreshBraiinsToken();
  await redis.setex(cacheKey, 3600, newToken); // 1 hour TTL
  return newToken;
}

return cachedToken;
```

### Authorization Rules

#### MCP Tool Access Control
```typescript
// Validate user permissions before executing tool
interface ToolRequest {
  name: string;
  arguments: Record<string, unknown>;
  userId?: string; // Optional, from MCP context
}

async function executeTool(request: ToolRequest): Promise<ToolResponse> {
  // 1. Validate tool exists
  const toolDef = getToolDefinition(request.name);
  if (!toolDef) {
    throw new Error(`Unknown tool: ${request.name}`);
  }

  // 2. Validate input parameters
  const validated = validateToolInput(request.name, request.arguments);

  // 3. Check user authorization (if user context available)
  if (request.userId && !hasPermission(request.userId, request.name)) {
    throw new AuthorizationError(`User lacks permission for ${request.name}`);
  }

  // 4. Execute tool
  return await toolDef.handler(validated);
}
```

### Data Handling

#### Input Validation
```typescript
// Validate all user input with schema
import { z } from 'zod';

const MinerStatsInputSchema = z.object({
  poolId: z.string().min(1).max(50),
  minerName: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(1000).optional(),
});

function validateInput(input: unknown): MinerStatsInput {
  const result = MinerStatsInputSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(`Invalid input: ${result.error.message}`);
  }
  return result.data;
}
```

#### Sensitive Data Handling
```typescript
// Redact sensitive info from logs
function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['apiKey', 'password', 'token', 'secret'];
  const sanitized = { ...data };
  
  sensitiveKeys.forEach(key => {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

// Usage
logger.info('API call made', sanitizeForLogging(request));
```

#### Database Security
```typescript
// Always use parameterized queries (not applicable here, but principle)
// Never concatenate user input into queries
// Validate cache keys to prevent injection

// Good: Validated key
const cacheKey = `miner:${poolId}:${minerName}`;
if (!/^[\w\-:]+$/.test(cacheKey)) {
  throw new Error('Invalid cache key format');
}

// Bad: Unsanitized key
const badKey = `data:${userInput}`; // ❌ Potential injection
```

### API Key Validation Allow-List

```typescript
// Define allowed operations per API key
const apiKeyPermissions: Record<string, string[]> = {
  'monitoring': ['getMinerStats', 'getPoolInfo', 'getWorkerStatus'],
  'reporting': ['getMinerStats', 'getPoolInfo'],
  'admin': ['*'], // All operations
};

function validateApiKeyPermission(apiKey: string, toolName: string): boolean {
  const perms = apiKeyPermissions[apiKey];
  if (!perms) return false;
  
  return perms.includes('*') || perms.includes(toolName);
}
```

### Vulnerability Scanning

#### Pre-commit Scanning
```bash
# Run security scan before commit
npm install --save-dev snyk
npx snyk test

# Python equivalent
pip install bandit
bandit -r src/
```

#### CI/CD Security Checks
```yaml
# .github/workflows/security.yml
- name: Run security scan
  run: npm run security
  
- name: Check dependencies
  run: npm audit --audit-level=moderate
```

---

## Collaboration Patterns

### Agent Roles and Responsibilities

| Agent | Primary Responsibility | Output Artifacts |
|-------|------------------------|------------------|
| **Architect** | System design, planning | ARCHITECTURE.md, DEVELOPMENT_PLAN.md, TODO.md |
| **Builder** | Feature implementation | Source code, tests, commits |
| **Validator** | Quality assurance, reviews | PR reviews, test execution, bug reports |
| **Scribe** | Documentation | README.md, API docs, tool descriptions |
| **Researcher** | Technology evaluation | Technology assessment, patterns, examples |
| **DevOps** | Infrastructure & deployment | CI/CD config, docker files, monitoring |

### Handoff Protocol

#### Format for Agent-to-Agent Handoff
```markdown
---
TO: [Agent Name]
PRIORITY: [CRITICAL / HIGH / MEDIUM / LOW]
TYPE: [Implementation / Review / Documentation / Deployment]

## Summary
[Brief description of what needs to be done]

## Context
- Reference document: [Link]
- Related tasks: [Links to related items]
- Dependencies: [What must complete first]

## Acceptance Criteria
- [ ] Specific, measurable criterion 1
- [ ] Specific, measurable criterion 2
- [ ] Specific, measurable criterion 3

## Resources
- Documentation: [Links]
- Code references: [File paths]
- Previous work: [Related commits/PRs]

## Timeline
Needed by: [Date/Time]
Estimated effort: [Hours]

---
```

#### Example: Architect to Builder
```markdown
---
TO: Builder Agent
PRIORITY: HIGH
TYPE: Implementation

## Summary
Implement Redis caching layer for Braiins API responses per ARCHITECTURE.md

## Context
- Reference: ARCHITECTURE.md Section 2.3 "Caching Strategy"
- Related PR: braiins-pool-mcp-server#15
- Tech: TypeScript, redis, zod validation

## Acceptance Criteria
- [ ] RedisManager class with get/set/delete methods
- [ ] 80% unit test coverage for caching logic
- [ ] Implements TTL per cache key type (30s for stats, 60s for pool info)
- [ ] Graceful fallback when Redis unavailable
- [ ] All tests passing, zero linting errors

## Resources
- ARCHITECTURE.md (sections 2.3, 3.2)
- src/cache/ directory structure
- tests/unit/cache/ for test patterns

## Timeline
Needed by: December 20, 2025
Estimated: 6-8 hours

---
```

### Communication Standards

#### Status Updates
When working on assigned task, provide updates in this format:
```markdown
## Status Update: [Task Name]

**Progress**: [X% complete]
**Current Phase**: [What you're working on now]
**Completed**:
- [Item 1]
- [Item 2]

**In Progress**:
- [Item 1]

**Blockers**:
- [Issue and mitigation if any]

**Next Steps**:
- [What's next]

**ETA to completion**: [Date/time]
```

#### Issue Escalation
If you encounter problems that block progress:
```markdown
## ⚠️ Blocker: [Brief description]

**Issue**:
[Detailed explanation of what's blocking progress]

**Attempted Solutions**:
1. [Solution attempt 1 and result]
2. [Solution attempt 2 and result]

**Recommended Resolution**:
[Suggested path forward]

**Impact**:
- Blocks: [What tasks are blocked]
- Timeline risk: [Effect on timeline]

**Request**:
[Specific ask for support]
```

---

## Quality Assurance Checklist

### Before Committing Code
- [ ] All tests pass locally
- [ ] Code coverage >= 80%
- [ ] Linting passes with zero errors
- [ ] Code formatted with project formatter
- [ ] No console.log/print statements in source
- [ ] No commented-out code blocks
- [ ] Error handling for all failure paths
- [ ] Commit message follows Conventional Commits
- [ ] Related issue referenced in commit footer

### Before Creating Pull Request
- [ ] Feature branch created from develop
- [ ] All commits have descriptive messages
- [ ] No merge conflicts with develop
- [ ] Feature works end-to-end (manual test)
- [ ] PR description complete and accurate
- [ ] Screenshots/logs attached if relevant
- [ ] Documentation updated (README, inline comments)
- [ ] DEVELOPMENT_PLAN.md updated with progress

### Before Handing Off to Next Agent
- [ ] All acceptance criteria met
- [ ] Handoff message created with context
- [ ] Documentation current and accurate
- [ ] Previous agent notified of status
- [ ] Dependencies documented and noted

### Definition of Done (Per Feature)
1. ✅ Code written with >80% test coverage
2. ✅ All tests passing in CI/CD
3. ✅ Code reviewed and approved
4. ✅ Documentation updated
5. ✅ Merged to develop branch
6. ✅ Deployed to staging environment
7. ✅ Smoke tests passing in staging
8. ✅ Ready for next phase

---

## Emergency Protocols

### When Merge Conflict Occurs
```bash
# 1. Update your feature branch
git fetch origin develop
git rebase origin/develop

# 2. Resolve conflicts in your editor
# Edit files marked with <<<<<<< HEAD

# 3. Mark resolved
git add [resolved-files]
git rebase --continue

# 4. Force push to your feature branch
git push origin feature/name --force-with-lease
```

### When Tests Fail Unexpectedly
1. **Reproduce locally**: Run exact test command that failed
2. **Isolate problem**: Run just the failing test with -v flag
3. **Debug**: Add console.log/print statements, check git diff
4. **Fix cause**: Modify implementation, not test
5. **Verify**: Re-run full test suite
6. **Escalate**: If root cause unclear, ask Researcher agent

### When Dependency Conflicts Occur
1. **Document conflict**: What packages? What versions?
2. **Research resolution**: Check package docs, npm registry
3. **Test isolation**: Create test branch with potential fix
4. **Notify DevOps**: Inform of new dependency requirements
5. **Update lock files**: npm ci or pip lock
6. **Commit**: Include detailed explanation of resolution

### When Timeline Slips
1. **Assess impact**: How far behind schedule?
2. **Identify root cause**: Technical, resource, or requirement issue?
3. **Report immediately**: Update MULTI_AGENT_PLAN.md with revised timeline
4. **Propose mitigation**: Scope reduction, parallel work, additional resources?
5. **Escalate**: If >1 day impact, notify project lead

---

## Continuous Improvement

### Agent Self-Reflection
After completing major deliverable (feature, review, documentation):
1. What went well in this work?
2. What was challenging?
3. How would you approach this differently next time?
4. What knowledge gaps were exposed?
5. How can the process/docs be improved?

### Document Updates
- This file (AGENTS.md) reviewed quarterly
- Add lessons learned to relevant sections
- Update examples based on actual project experience
- Remove or deprecate patterns that aren't working

### Metrics to Track
- Average time per task type (helps with estimation)
- Bug escape rate (bugs found in QA vs during dev)
- Code review cycle time (time from PR to merge)
- Test coverage trends (should increase over time)

---

## Quick Reference

### Key Files
| File | Purpose | Owner |
|------|---------|-------|
| AGENTS.md | Universal standards (THIS FILE) | All agents |
| CLAUDE.md | Claude-specific instructions | Claude |
| COPILOT.md | GitHub Copilot instructions | Copilot |
| ARCHITECTURE.md | System design | Architect |
| DEVELOPMENT_PLAN.md | Phased roadmap | Architect |
| TODO.md | Task list | Architect/Builder |
| MULTIAGENT_PLAN.md | Coordination hub | Orchestrator |
| README.md | Project overview | Scribe |

### Most Used Commands
```bash
# TypeScript
npm install                  # Install dependencies
npm test                     # Run tests
npm run lint                 # Check code quality
npm run format               # Auto-format code
npm run build                # Build project

# Python
pip install -r requirements.txt
pytest
ruff check src/
black src/
python -m src.main

# Git
git checkout -b feature/name
git commit -m "feat(scope): description"
git push origin feature/name
```

### Emergency Contacts
- **Technical Questions**: Architect agent via MULTIAGENT_PLAN.md
- **Code Issues**: Validator agent, provide detailed error logs
- **Timeline Issues**: Project lead, include impact assessment
- **Security Concerns**: DevOps agent, flag as CRITICAL

---

## Document Information

**Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Maintained By**: Engineering Standards Committee  
**Next Review**: March 15, 2026

---

See also: [CLAUDE.md](./CLAUDE.md) • [ARCHITECTURE.md](./ARCHITECTURE.md) • [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) • [MULTIAGENT_PLAN.md](./MULTIAGENT_PLAN.md)
