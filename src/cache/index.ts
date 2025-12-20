/**
 * Cache Module Exports
 *
 * Re-exports all cache-related functionality for easy importing.
 */

// Redis Manager
export {
  RedisManager,
  getRedisManager,
  resetRedisManager,
  type CacheStats,
} from './redisManager.js';

// Cache Keys
export {
  type ResourceType,
  buildCacheKey,
  buildUserOverviewKey,
  buildWorkersListKey,
  buildWorkerDetailsKey,
  buildWorkerHashrateKey,
  buildUserRewardsKey,
  buildPoolStatsKey,
  buildNetworkStatsKey,
  parseCacheKey,
} from './cacheKeys.js';

// Caching Strategy
export {
  DEFAULT_TTL,
  type CacheConfig,
  getCacheConfig,
  resetCacheConfig,
  getTTL,
  shouldCache,
  getAllTTLs,
} from './cachingStrategy.js';
