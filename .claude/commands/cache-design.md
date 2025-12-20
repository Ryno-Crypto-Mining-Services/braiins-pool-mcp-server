# /cache-design Command

## Purpose
Design a comprehensive Redis caching strategy for a specific Braiins API endpoint, including TTL recommendations, cache key patterns, and implementation snippets.

## Usage
```
/cache-design <endpoint-path>
```

## Arguments
| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `endpoint-path` | string | Yes | API endpoint path (e.g., `/workers/{workerId}`, `/user/overview`) |

## What This Command Does

1. **Load Skill**: Automatically loads `braiins-cache-strategist` skill
2. **Analyze Endpoint**: Reviews API.md for endpoint specification
3. **Determine TTL**: Recommends TTL based on data volatility
4. **Design Cache Key**: Creates sanitized key pattern
5. **Generate Code**: Provides implementation snippets

## Output Format

```markdown
# Cache Design: {endpoint}

## Analysis
- **Endpoint**: {path}
- **Method**: GET
- **Data Type**: {category}
- **Update Frequency**: {estimate}

## Recommendations

### TTL Strategy
- **Recommended TTL**: {seconds}s
- **Rationale**: {explanation}
- **Cache Hit Target**: {percentage}%

### Cache Key Pattern
```
braiins:{resource}:{scope}:{identifier}:{filterHash}
```

**Example**:
```
braiins:workers:detail:abc123:def456
```

### Key Sanitization Rules
- Hash user input with SHA256 (first 8 chars)
- Maximum key length: 200 characters
- Character allowlist: a-zA-Z0-9:-_

## Implementation

### Cache Get Pattern
```typescript
const cacheKey = `braiins:workers:detail:${accountHash}:${workerId}`;
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
```

### Cache Set Pattern
```typescript
const ttl = 60; // seconds
await redis.setex(cacheKey, ttl, JSON.stringify(data));
```

### Full Implementation
```typescript
async getWorkerDetails(workerId: string): Promise<WorkerDetails> {
  const cacheKey = this.buildCacheKey('workers', 'detail', workerId);

  // Check cache first
  const cached = await this.cache.get<WorkerDetails>(cacheKey);
  if (cached) {
    this.metrics.cacheHit('workers.detail');
    return cached;
  }

  // Cache miss - call API
  this.metrics.cacheMiss('workers.detail');
  const data = await this.api.getWorkerDetails(workerId);

  // Store in cache
  await this.cache.set(cacheKey, data, 60);

  return data;
}
```

## Metrics to Track
- Cache hit rate (target: >70%)
- Average latency (cache hit vs miss)
- Cache size for this key pattern
```

## TTL Reference Matrix

From `braiins-cache-strategist` skill:

| Data Type | TTL | Volatility | Rationale |
|-----------|-----|------------|-----------|
| User overview | 30s | High | Hashrate changes frequently |
| User rewards | 60s | Medium | Reward updates less frequent |
| Worker list | 30s | High | Workers go online/offline |
| Worker detail | 60s | Medium | Individual worker status |
| Worker hashrate | 120s | Low | Historical data stable |
| Pool stats | 60s | Medium | Aggregated pool data |
| Network stats | 300s | Very Low | Network changes slowly |

## Cache Key Patterns Reference

```
# User data (account-scoped)
braiins:user:overview:{accountHash}
braiins:user:rewards:{accountHash}:{paramsHash}

# Worker data (account + worker scoped)
braiins:workers:list:{accountHash}:{page}:{filtersHash}
braiins:workers:detail:{accountHash}:{workerId}
braiins:workers:hashrate:{accountHash}:{workerId}:{paramsHash}

# Pool/Network data (global)
braiins:pool:stats
braiins:network:stats
```

## Examples

### Example 1: Worker Detail Endpoint
```
User: /cache-design /workers/{workerId}

Claude:
# Cache Design: /workers/{workerId}

## Analysis
- **Endpoint**: GET /workers/{workerId}
- **Data Type**: Worker Detail
- **Update Frequency**: Every 30-60 seconds (worker status updates)

## Recommendations

### TTL Strategy
- **Recommended TTL**: 60s
- **Rationale**: Worker details (hardware, hashrate) update periodically but not instantly
- **Cache Hit Target**: 75%

### Cache Key Pattern
```
braiins:workers:detail:{accountHash}:{workerId}
```

...
```

### Example 2: Network Stats Endpoint
```
User: /cache-design /network/stats

Claude:
# Cache Design: /network/stats

## Analysis
- **Endpoint**: GET /network/stats
- **Data Type**: Network Statistics
- **Update Frequency**: Block time (~10 minutes)

## Recommendations

### TTL Strategy
- **Recommended TTL**: 300s (5 minutes)
- **Rationale**: Network difficulty and block data change per block
- **Cache Hit Target**: 90%

### Cache Key Pattern
```
braiins:network:stats
```
(Global key, no user/resource scoping needed)

...
```

## Workflow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Parse endpoint path                             │
│   → Extract resource type (user, workers, pool)         │
│   → Identify path parameters                            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 2: Look up endpoint in API.md                      │
│   → Find response schema                                │
│   → Identify data volatility                            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 3: Determine TTL from matrix                       │
│   → Match data type to TTL recommendation               │
│   → Consider rate limits                                │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 4: Design cache key pattern                        │
│   → Include resource scope                              │
│   → Add identifier placeholders                         │
│   → Apply sanitization rules                            │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Step 5: Generate implementation code                    │
│   → Cache get/set patterns                              │
│   → Full handler integration example                    │
│   → Metrics recommendations                             │
└─────────────────────────────────────────────────────────┘
```

## Related Commands

- `/mcp-tool` - Create MCP tool with caching
- `/validate-tool` - Validate cache implementation
- `/api-sync` - Check endpoint alignment

## Related Skills

- `braiins-cache-strategist` - Full caching strategy
- `mcp-tool-builder` - Tool implementation with cache
- `braiins-api-mapper` - API endpoint integration

## Notes

- Always validate cache keys don't contain raw user input
- Monitor cache hit rates and adjust TTLs as needed
- Consider stale-while-revalidate for non-critical data
- Use Redis SCAN for pattern-based invalidation
