# ARCHITECTURE.md: System Design and Technical Architecture

**braiins-pool-mcp-server**

**Document Version**: 1.0.0  
**Last Updated**: December 15, 2025  
**Status**: Production Design

---

## Executive Summary

The braiins-pool-mcp-server is a Model Context Protocol (MCP) server that bridges Claude and other AI models with the Braiins Bitcoin mining pool API. The system provides AI agents with structured tools to query mining statistics, monitor worker performance, and manage pool operations with sub-second response times through intelligent caching.

**Key Characteristics**:
- **Type**: MCP Server (stdio + optional HTTP/SSE)
- **Architecture**: Modular monolith with clear separation of concerns
- **Performance**: <100ms response times via Redis caching layer
- **Reliability**: Graceful degradation when external services fail
- **Scale**: Handles 1000+ API calls/minute with <500MB memory footprint

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Models (Claude, etc.)                │
└───────────────────────────┬─────────────────────────────────┘
                            │ MCP Protocol (JSON-RPC 2.0)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MCP Server Layer                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tool Definitions & Request Routing                   │  │
│  │ - getMinerStats                                      │  │
│  │ - getPoolInfo                                        │  │
│  │ - getWorkerStatus                                    │  │
│  │ - [Additional tools...]                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Input Validation Layer (Zod/Pydantic)               │  │
│  │ - Validate all tool parameters                       │  │
│  │ - Type safety enforcement                            │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐ ┌──────────────────┐ ┌──────────────┐
│ Cache Layer   │ │ API Client       │ │ Error Handler│
│ (Redis)       │ │ (HTTP wrapper)   │ │ & Logging    │
│               │ │                  │ │              │
│ - get()       │ │ - Braiins API    │ │ - Unified    │
│ - set()       │ │   calls          │ │   errors     │
│ - delete()    │ │ - Retry logic    │ │ - Audit logs │
│ - Validation  │ │ - Rate limiting  │ │ - Metrics    │
│   of keys     │ │                  │ │              │
└───────────────┘ └──────────────────┘ └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │   Configuration & Settings        │
        │ - API keys & credentials          │
        │ - Cache TTL values                │
        │ - Rate limit thresholds           │
        │ - Environment variables           │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │   External Services               │
        ├─────────────────┬─────────────────┤
        │ Braiins API     │ Redis Server    │
        │ (HTTPS)         │ (TCP/IP)        │
        └─────────────────┴─────────────────┘
```

---

## Component Architecture

### 1. MCP Server Core (`src/index.ts` / `src/main.py`)

**Responsibilities**:
- Initialize and configure MCP server
- Set up transport layer (stdio)
- Register tool definitions
- Handle shutdown gracefully
- Manage server lifecycle

**Key Interfaces**:
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: (input: unknown) => Promise<ToolResponse>;
}

interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'document';
    text?: string;
    data?: Buffer;
  }>;
  isError?: boolean;
}
```

**Responsibilities of MCP Server**:
1. Bind tools to named endpoints
2. Route incoming requests to handlers
3. Validate inputs with schemas
4. Handle errors gracefully
5. Return formatted responses
6. Log all operations

---

### 2. Tool Layer (`src/tools/`)

**File Structure**:
```
src/tools/
├── minerStats.ts       # Query miner performance data
├── poolInfo.ts         # Retrieve pool configuration
├── workerStatus.ts     # Monitor individual workers
├── README.md           # Tool documentation
└── index.ts            # Export all tool definitions
```

**Each Tool File Contains**:
1. **Tool Definition**: Name, description, input schema
2. **Validation Schema**: Zod/Pydantic schema for inputs
3. **Handler Function**: Core business logic
4. **Error Handling**: Specific error cases for tool
5. **Examples**: Usage examples in comments

**Example Tool Structure**:
```typescript
// minerStats.ts
export const MinerStatsInputSchema = z.object({
  poolId: z.string().min(1).max(50),
  minerName: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(1000).optional(),
});

export const minerStatsTool = {
  name: 'getMinerStats',
  description: 'Get performance statistics for a specific miner',
  inputSchema: MinerStatsInputSchema,
  handler: async (input: unknown): Promise<ToolResponse> => {
    // Validation, caching, API call, formatting
  },
};
```

---

### 3. API Integration Layer (`src/api/`)

**File Structure**:
```
src/api/
├── braiinsClient.ts    # Braiins API wrapper
├── httpClient.ts       # Generic HTTP client with retry logic
├── types.ts            # API response type definitions
└── authentication.ts   # API key management
```

**BraiinsClient Responsibilities**:
1. **HTTP Communication**: Manage connection to Braiins API
2. **Authentication**: Add Bearer tokens to requests
3. **Retry Logic**: Exponential backoff on failures
4. **Rate Limiting**: Respect API rate limits (1 req/sec)
5. **Error Handling**: Parse API errors into custom exceptions
6. **Type Conversion**: Transform API responses to internal types

**Key Methods**:
```typescript
class BraiinsClient {
  async getPoolStats(poolId: string): Promise<PoolStatsResponse>;
  async getMinerStats(poolId: string, minerName: string): Promise<MinerStatsResponse>;
  async getWorkerStatus(workerId: string): Promise<WorkerStatusResponse>;
  
  private async request<T>(path: string, options?: RequestOptions): Promise<T>;
  private async retryWithBackoff<T>(fn: () => Promise<T>): Promise<T>;
}
```

---

### 4. Caching Layer (`src/cache/`)

**File Structure**:
```
src/cache/
├── redisManager.ts     # Redis client wrapper
├── cacheKeys.ts        # Cache key definitions
└── cachingStrategy.ts  # TTL and invalidation logic
```

**Caching Strategy**:
```
Cache Key Pattern: [resource-type]:[pool-id]:[resource-id]

Examples:
- miner-stats:braiins-main:john_doe      (30s TTL)
- pool-info:braiins-main:config          (60s TTL)
- worker-status:braiins-main:worker-123  (30s TTL)

TTL Guidelines:
- Real-time stats: 30s  (refresh frequently for accuracy)
- Pool metadata: 60s    (changes less often)
- Historical data: 300s (stable over time)
- Auth tokens: 3600s    (refreshed on demand)
```

**RedisManager Responsibilities**:
1. **Get/Set Operations**: Cache data with TTL
2. **Key Validation**: Prevent injection attacks
3. **Serialization**: JSON encode/decode values
4. **Error Handling**: Graceful fallback when Redis unavailable
5. **Metrics**: Track cache hit/miss rates
6. **Invalidation**: Clear cache on demand

```typescript
class RedisManager {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async delete(key: string): Promise<boolean>;
  async flush(): Promise<void>;
  
  getCacheStats(): { hits: number; misses: number; ratio: number };
}
```

---

### 5. Validation Layer (`src/schemas/`)

**File Structure**:
```
src/schemas/
├── toolInputs.ts       # Input validation for MCP tools
├── apiResponses.ts     # Schemas for Braiins API responses
└── config.ts           # Configuration schema
```

**Zod Schema Pattern**:
```typescript
// Input validation
export const GetPoolInfoInput = z.object({
  poolId: z.string()
    .min(1, 'Pool ID required')
    .max(50, 'Pool ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid pool ID format'),
  includeHistorical: z.boolean().optional(),
});

// API response validation
export const PoolInfoResponse = z.object({
  poolId: z.string(),
  name: z.string(),
  totalHashrate: z.number(),
  activeWorkers: z.number(),
  status: z.enum(['online', 'offline', 'degraded']),
  timestamp: z.date(),
});
```

---

### 6. Configuration Layer (`src/config/`)

**File Structure**:
```
src/config/
└── settings.ts         # Centralized configuration
```

**Configuration Source Priority** (highest to lowest):
1. Environment variables
2. `.env` file
3. `.env.development` file
4. Default values in code

**Essential Configuration**:
```typescript
interface AppSettings {
  // API Configuration
  braiinsApiUrl: string;           // https://api.braiins.com/
  braiinsApiKey: string;           // From BRAIINS_API_KEY
  
  // Redis Configuration
  redisHost: string;               // Default: localhost
  redisPort: number;               // Default: 6379
  redisPassword?: string;          // From REDIS_PASSWORD
  
  // Cache Strategy
  cacheTtlMinerStats: number;      // Default: 30 seconds
  cacheTtlPoolInfo: number;        // Default: 60 seconds
  cacheTtlWorkerStatus: number;    // Default: 30 seconds
  
  // Rate Limiting
  rateLimitRequestsPerSecond: number;    // Default: 1
  rateLimitBurstSize: number;            // Default: 5
  
  // Server
  serverPort: number;              // Default: 3000 (if HTTP)
  nodeEnv: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
```

---

### 7. Error Handling & Logging (`src/utils/`)

**Custom Error Types**:
```typescript
class BraiinsApiError extends Error {
  constructor(message: string, statusCode?: number, originalError?: Error);
}

class CacheError extends Error {
  constructor(message: string, operation: string, key: string);
}

class ValidationError extends Error {
  constructor(message: string, field: string, value: unknown);
}

class AuthenticationError extends Error {
  constructor(message: string, reason: 'invalid-key' | 'expired' | 'unauthorized');
}
```

**Logging Strategy**:
```typescript
logger.debug('Cache operation', { operation: 'get', key, hit: true });
logger.info('API request completed', { endpoint: path, duration: 150 });
logger.warn('Slow API response', { duration: 5000, endpoint: path });
logger.error('API error occurred', { 
  status: 500, 
  message: 'Internal Server Error',
  originalError: error.stack 
});
```

---

## Data Flow

### Request Flow: getMinerStats Tool

```
1. AI Model sends MCP request
   Input: { poolId: "braiins-main", minerName: "john_doe" }

2. MCP Server receives request
   → Route to getMinerStats handler
   → Validate input with schema

3. Cache Layer checks
   Key: "miner-stats:braiins-main:john_doe"
   → Found in cache (30s TTL valid)
   → Return cached data (100ms)

4. If cache miss:
   → API Client calls Braiins API
   → GET /pools/braiins-main/miners?name=john_doe
   → Parse response and validate
   → Store in Redis with 30s TTL
   → Return data

5. Format response
   Return ToolResponse with miner statistics

6. Send to AI Model
   Response: { content: [{ type: 'text', text: JSON.stringify(stats) }] }
```

### Error Handling Flow

```
Try API Call
    ↓
Success? → Return cached result (100ms)
    ↓
No, Network Error?
    ↓
Retry with backoff (1s, 2s, 4s, 8s)
    ↓
Max retries exceeded?
    ↓
Check if cached data available (even if stale)
    ↓
Yes? → Return stale data + warning
    ↓
No? → Return error response with details
```

---

## Design Patterns Used

### 1. Repository Pattern (Caching)
```typescript
// Cache acts as repository for API data
interface Repository<T> {
  get(id: string): Promise<T | null>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// Multiple implementations possible
class RedisRepository<T> implements Repository<T> { }
class MemoryRepository<T> implements Repository<T> { }
class FileRepository<T> implements Repository<T> { }
```

### 2. Factory Pattern (Tool Creation)
```typescript
// Create tools dynamically from definitions
interface ToolFactory {
  createTool(definition: ToolDefinition): MutableToolDefinition;
}

// Tools instantiated consistently
const tools = [
  toolFactory.create(minerStatsDefinition),
  toolFactory.create(poolInfoDefinition),
];
```

### 3. Circuit Breaker Pattern (API Resilience)
```typescript
// Fail fast when API is down
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 30000) {
        this.state = 'half-open'; // Try again
      } else {
        throw new Error('Circuit breaker open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 4. Strategy Pattern (Caching Strategy)
```typescript
// Different caching strategies for different data types
interface CachingStrategy {
  getTTL(resourceType: string): number;
  shouldInvalidate(lastCacheTime: number): boolean;
  getSerializationFormat(): 'json' | 'protobuf';
}

class HighFrequencyCacheStrategy implements CachingStrategy {
  getTTL(resourceType: string): number {
    return resourceType === 'miner-stats' ? 30 : 60;
  }
}
```

---

## Scalability Considerations

### Horizontal Scaling
```
Load Balancer
     ↓
   ┌─┴─┬─────────────┐
   ↓   ↓              ↓
[MCP] [MCP]       [MCP]
   ↓   ↓              ↓
   └─┬─┴─────────────┘
     ↓
  Redis (shared)
     ↓
  Braiins API
```

**Approach**:
- Run multiple MCP server instances
- Share Redis cache across instances
- Use load balancer for request distribution
- Rate limiting per instance, coordinated via Redis

### Vertical Scaling
```
Current: ~50MB memory for 1000 RPS
- Code: ~10MB
- Cache: ~20MB (with 1000 keys at ~20KB each)
- Runtime: ~20MB

Optimization options:
1. Reduce cache size (more frequent refreshes)
2. Use compression for cached data
3. Implement cache eviction policy (LRU)
4. Stream large responses instead of loading in memory
```

### Database Optimization
```
Current: No database (stateless)
Future options:
- Add persistent cache (PostgreSQL)
- Historical data storage
- Query optimization with indexes
```

---

## Failure Modes and Recovery

### Failure Mode 1: Redis Unavailable
```
Scenario: Redis connection lost
Detection: get() returns connection error
Recovery:
  → Fall through to API call directly
  → Increase API call frequency (no cache buffer)
  → Log warning to monitoring
  → Attempt reconnect every 30 seconds
User Impact: Slightly slower responses, higher API load
```

### Failure Mode 2: Braiins API Down
```
Scenario: API returns 5xx errors
Detection: API client gets error after retries
Recovery:
  → Return cached data (even if stale) + warning
  → If no cached data: Return error response
  → Continue retrying with circuit breaker
  → Alert monitoring system
User Impact: Stale data or service unavailable
```

### Failure Mode 3: Network Partition
```
Scenario: Network between MCP and Redis/API interrupted
Detection: Timeouts on both connections
Recovery:
  → Fail fast on cache operations (don't wait)
  → Retry API with backoff
  → Circuit breaker prevents repeated failures
  → Graceful degradation to in-memory cache
User Impact: Slightly slower, some data may be unavailable
```

---

## Security Architecture

### Authentication Flow
```
MCP Request (no auth needed - local stdio)
    ↓
API Request → Add Authorization Header
    ↓
Authorization: Bearer {BRAIINS_API_KEY}
    ↓
Braiins API validates token
    ↓
Response with data OR 401 Unauthorized
```

### Input Validation Flow
```
Untrusted Input (from AI model)
    ↓
Validate with Zod Schema
    ↓
Valid? No → Return ValidationError
    ↓
Yes → Type-safe usage in code
    ↓
Safe for Redis key/API parameter
```

### Secret Management
```
Development:
  .env.development (gitignored)
  BRAIINS_API_KEY=sk_...
  REDIS_PASSWORD=...

Production:
  Environment variables (from secrets manager)
  Never commit secrets
  Rotate keys periodically
  Audit access logs
```

---

## Performance Characteristics

### Response Time Targets
```
Cache Hit: <10ms (Redis round-trip)
API Miss (cached): ~150ms (network + processing)
API Miss (not cached): ~200ms (retry logic)
Error Response: <50ms (validation failure)

Overall SLA: <100ms for 95th percentile
```

### Resource Usage
```
Memory:
  - Idle: ~20MB
  - 1000 RPS sustained: ~50MB
  - Peak (10k keys cached): ~100MB

CPU:
  - Idle: <5%
  - 1000 RPS: ~30%
  - Peak: ~60%

Network:
  - Outbound: ~10 Mbps sustained (1000 RPS × 150ms × 1KB avg)
  - Inbound: ~5 Mbps
  - Redis: ~2 Mbps
```

---

## Deployment Architecture

### Development
```
localhost:stdio
    ↓
MCP Server (single process)
    ↓
localhost:6379 (Redis)
    ↓
https://api.braiins.com (production API)
```

### Production
```
Docker Container (MCP Server)
    ↓
Redis Container (or managed Redis)
    ↓
Braiins API HTTPS Endpoint
    ↓
Monitoring/Logging (CloudWatch, DataDog, etc.)
```

### Docker Compose
```yaml
version: '3'
services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BRAIINS_API_KEY=${BRAIINS_API_KEY}
      - REDIS_HOST=redis
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Testing Architecture

### Unit Test Strategy
```
Test pyramid:
  Top: E2E tests (few, slow, realistic)
  Middle: Integration tests (some, medium speed, tool + API mock)
  Bottom: Unit tests (many, fast, single component)

Coverage: >80% line coverage minimum
```

### Test Files
```
tests/unit/
  ├── api/braiinsClient.test.ts
  ├── cache/redisManager.test.ts
  ├── schemas/validation.test.ts
  └── tools/minerStats.test.ts

tests/integration/
  ├── tools/minerStats.test.ts
  └── errorRecovery.test.ts

tests/fixtures/
  ├── mockData.ts
  ├── mockRedis.ts
  └── mockBraiinsApi.ts
```

---

## Technology Justifications

### Why TypeScript?
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Self-documenting code with types
- Excellent testing experience with types

### Why Zod for Validation?
- Runtime validation (TypeScript types aren't runtime)
- Clear, composable schemas
- Excellent error messages
- Built-in transformations

### Why Redis for Caching?
- Sub-millisecond response times
- Simple key-value interface
- Battle-tested, production-ready
- Good memory efficiency

### Why Modular Architecture?
- Easy to test in isolation
- Clear separation of concerns
- Easier to onboard new developers
- Supports future scaling (microservices)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 15, 2025 | Initial architecture design |

---

See also: [AGENTS.md](./AGENTS.md) • [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) • [README.md](./README.md)
