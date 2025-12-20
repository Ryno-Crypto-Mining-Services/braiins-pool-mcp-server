/**
 * Cache Key Builder
 *
 * Type-safe cache key generation with validation and sanitization.
 * Follows the pattern: [resource-type]:[identifier]:[params-hash]
 */

import { createHash } from 'crypto';

/**
 * Resource types for cache keys
 */
export type ResourceType =
  | 'user-overview'
  | 'workers-list'
  | 'worker-details'
  | 'worker-hashrate'
  | 'user-rewards'
  | 'pool-stats'
  | 'network-stats';

/**
 * Cache key prefix for namespacing
 */
const CACHE_PREFIX = 'braiins';

/**
 * Maximum cache key length (Redis limit is 512MB but keep practical)
 */
const MAX_KEY_LENGTH = 256;

/**
 * Sanitize a string for use in cache keys
 * Removes/replaces special characters that could cause issues
 */
function sanitize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 64);
}

/**
 * Hash an object to create a consistent cache key suffix
 * Used for complex parameter objects
 */
function hashParams(params: Record<string, unknown>): string {
  // Sort keys for consistent hashing
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, unknown>
    );

  const json = JSON.stringify(sorted);
  return createHash('sha256').update(json).digest('hex').substring(0, 16);
}

/**
 * Build cache key for user overview
 */
export function buildUserOverviewKey(): string {
  return `${CACHE_PREFIX}:user-overview`;
}

/**
 * Build cache key for workers list
 *
 * @param params - Query parameters (status, page, limit, etc.)
 */
export function buildWorkersListKey(params: Record<string, unknown> = {}): string {
  const hasParams = Object.keys(params).length > 0;
  if (!hasParams) {
    return `${CACHE_PREFIX}:workers-list`;
  }
  const hash = hashParams(params);
  return `${CACHE_PREFIX}:workers-list:${hash}`;
}

/**
 * Build cache key for worker details
 *
 * @param workerId - Unique worker identifier
 */
export function buildWorkerDetailsKey(workerId: string): string {
  const sanitized = sanitize(workerId);
  return `${CACHE_PREFIX}:worker-details:${sanitized}`;
}

/**
 * Build cache key for worker hashrate
 *
 * @param workerId - Unique worker identifier
 * @param params - Query parameters (from, to, granularity)
 */
export function buildWorkerHashrateKey(
  workerId: string,
  params: Record<string, unknown> = {}
): string {
  const sanitized = sanitize(workerId);
  const hasParams = Object.keys(params).length > 0;
  if (!hasParams) {
    return `${CACHE_PREFIX}:worker-hashrate:${sanitized}`;
  }
  const hash = hashParams(params);
  return `${CACHE_PREFIX}:worker-hashrate:${sanitized}:${hash}`;
}

/**
 * Build cache key for user rewards
 *
 * @param params - Query parameters (from, to, granularity)
 */
export function buildUserRewardsKey(params: Record<string, unknown> = {}): string {
  const hasParams = Object.keys(params).length > 0;
  if (!hasParams) {
    return `${CACHE_PREFIX}:user-rewards`;
  }
  const hash = hashParams(params);
  return `${CACHE_PREFIX}:user-rewards:${hash}`;
}

/**
 * Build cache key for pool stats
 */
export function buildPoolStatsKey(): string {
  return `${CACHE_PREFIX}:pool-stats`;
}

/**
 * Build cache key for network stats
 */
export function buildNetworkStatsKey(): string {
  return `${CACHE_PREFIX}:network-stats`;
}

/**
 * Generic cache key builder for custom resources
 *
 * @param resourceType - Type of resource
 * @param identifier - Optional identifier (e.g., worker ID)
 * @param params - Optional parameters to hash
 */
export function buildCacheKey(
  resourceType: ResourceType,
  identifier?: string,
  params?: Record<string, unknown>
): string {
  let key = `${CACHE_PREFIX}:${resourceType}`;

  if (identifier) {
    key += `:${sanitize(identifier)}`;
  }

  if (params && Object.keys(params).length > 0) {
    key += `:${hashParams(params)}`;
  }

  // Ensure key doesn't exceed max length
  if (key.length > MAX_KEY_LENGTH) {
    // Hash the entire key if too long
    const hash = createHash('sha256').update(key).digest('hex');
    key = `${CACHE_PREFIX}:${resourceType}:${hash}`;
  }

  return key;
}

/**
 * Parse a cache key to extract components
 * Useful for debugging and logging
 */
export function parseCacheKey(key: string): {
  prefix: string;
  resourceType: string;
  identifier?: string;
  paramsHash?: string;
} {
  const parts = key.split(':');
  return {
    prefix: parts[0] || '',
    resourceType: parts[1] || '',
    identifier: parts[2],
    paramsHash: parts[3],
  };
}
