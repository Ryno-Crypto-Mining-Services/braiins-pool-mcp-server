/**
 * Caching Strategy
 *
 * Defines TTL values and caching rules for different resource types.
 * TTL values are configurable via environment variables with sensible defaults.
 */

import type { ResourceType } from './cacheKeys.js';

/**
 * Default TTL values in seconds
 *
 * Based on data volatility:
 * - Real-time stats (hashrate, worker status): 30s - frequently changing
 * - Pool/Network stats: 60s - changes less often
 * - Historical data: 300s - stable over time
 */
export const DEFAULT_TTL = {
  'user-overview': 30,
  'workers-list': 30,
  'worker-details': 30,
  'worker-hashrate': 300, // Historical data
  'user-rewards': 300, // Historical data
  'pool-stats': 60,
  'network-stats': 60,
} as const;

/**
 * Cache configuration loaded from environment
 * Defaults are used if environment variables are not set
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: Record<ResourceType, number>;
}

/**
 * Parse TTL from environment variable with fallback
 */
function parseTtl(envVar: string | undefined, defaultValue: number): number {
  if (envVar === undefined || envVar === '') {
    return defaultValue;
  }
  const parsed = parseInt(envVar, 10);
  if (isNaN(parsed) || parsed < 0) {
    return defaultValue;
  }
  return parsed;
}

/**
 * Load cache configuration from environment
 */
export function loadCacheConfig(): CacheConfig {
  return {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: {
      'user-overview': parseTtl(process.env.CACHE_TTL_USER_OVERVIEW, DEFAULT_TTL['user-overview']),
      'workers-list': parseTtl(process.env.CACHE_TTL_WORKERS, DEFAULT_TTL['workers-list']),
      'worker-details': parseTtl(process.env.CACHE_TTL_WORKERS, DEFAULT_TTL['worker-details']),
      'worker-hashrate': parseTtl(process.env.CACHE_TTL_HISTORICAL, DEFAULT_TTL['worker-hashrate']),
      'user-rewards': parseTtl(process.env.CACHE_TTL_HISTORICAL, DEFAULT_TTL['user-rewards']),
      'pool-stats': parseTtl(process.env.CACHE_TTL_POOL_STATS, DEFAULT_TTL['pool-stats']),
      'network-stats': parseTtl(process.env.CACHE_TTL_NETWORK_STATS, DEFAULT_TTL['network-stats']),
    },
  };
}

/**
 * Singleton cache config instance
 */
let cacheConfigInstance: CacheConfig | null = null;

/**
 * Get cache configuration (lazy loaded)
 */
export function getCacheConfig(): CacheConfig {
  if (!cacheConfigInstance) {
    cacheConfigInstance = loadCacheConfig();
  }
  return cacheConfigInstance;
}

/**
 * Reset cache config (for testing)
 */
export function resetCacheConfig(): void {
  cacheConfigInstance = null;
}

/**
 * Get TTL for a specific resource type
 *
 * @param resourceType - Type of resource
 * @returns TTL in seconds
 */
export function getTTL(resourceType: ResourceType): number {
  const config = getCacheConfig();
  return config.ttl[resourceType];
}

/**
 * Check if caching should be used for a resource type
 *
 * @param resourceType - Type of resource
 * @returns true if caching is enabled for this resource
 */
export function shouldCache(resourceType: ResourceType): boolean {
  const config = getCacheConfig();
  return config.enabled && config.ttl[resourceType] > 0;
}

/**
 * Get all TTL values for debugging/monitoring
 */
export function getAllTTLs(): Record<ResourceType, number> {
  const config = getCacheConfig();
  return { ...config.ttl };
}
