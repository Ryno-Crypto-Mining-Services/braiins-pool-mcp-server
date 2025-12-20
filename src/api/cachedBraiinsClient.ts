/**
 * Cached Braiins Pool API Client
 *
 * Wraps the BraiinsClient with Redis caching for improved performance.
 * Implements cache-aside pattern: check cache first, fall through to API on miss.
 */

import { BraiinsClient, getBraiinsClient } from './braiinsClient.js';
import {
  getRedisManager,
  buildUserOverviewKey,
  buildWorkersListKey,
  buildWorkerDetailsKey,
  buildWorkerHashrateKey,
  buildUserRewardsKey,
  buildPoolStatsKey,
  buildNetworkStatsKey,
  getTTL,
  shouldCache,
} from '../cache/index.js';
import { logger } from '../utils/logger.js';
import type { GetUserOverviewResponse } from '../schemas/getUserOverviewResponse.js';
import type { ListWorkersResponse } from '../schemas/listWorkersResponse.js';
import type { GetWorkerDetailsResponse } from '../schemas/getWorkerDetailsResponse.js';
import type { GetWorkerHashrateResponse } from '../schemas/getWorkerHashrateResponse.js';
import type { GetUserRewardsResponse } from '../schemas/getUserRewardsResponse.js';
import type { GetPoolStatsResponse } from '../schemas/getPoolStatsResponse.js';
import type { GetNetworkStatsResponse } from '../schemas/getNetworkStatsResponse.js';

/**
 * Cached Braiins API Client
 *
 * Provides the same interface as BraiinsClient but with transparent caching.
 * Cache failures are handled gracefully - API calls proceed on cache errors.
 */
export class CachedBraiinsClient {
  private readonly client: BraiinsClient;

  constructor() {
    this.client = getBraiinsClient();
  }

  /**
   * Get user overview with caching
   */
  async getUserOverview(): Promise<GetUserOverviewResponse> {
    const cacheKey = buildUserOverviewKey();

    if (shouldCache('user-overview')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetUserOverviewResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getUserOverview();

    // Store in cache (fire-and-forget)
    if (shouldCache('user-overview')) {
      const cache = getRedisManager();
      const ttl = getTTL('user-overview');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache user overview', { error: err.message });
      });
    }

    return data;
  }

  /**
   * List workers with caching
   */
  async listWorkers(params: Record<string, string | number>): Promise<ListWorkersResponse> {
    const cacheKey = buildWorkersListKey(params);

    if (shouldCache('workers-list')) {
      const cache = getRedisManager();
      const cached = await cache.get<ListWorkersResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.listWorkers(params);

    // Store in cache (fire-and-forget)
    if (shouldCache('workers-list')) {
      const cache = getRedisManager();
      const ttl = getTTL('workers-list');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache workers list', { error: err.message });
      });
    }

    return data;
  }

  /**
   * Get worker details with caching
   */
  async getWorkerDetails(workerId: string): Promise<GetWorkerDetailsResponse> {
    const cacheKey = buildWorkerDetailsKey(workerId);

    if (shouldCache('worker-details')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetWorkerDetailsResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getWorkerDetails(workerId);

    // Store in cache (fire-and-forget)
    if (shouldCache('worker-details')) {
      const cache = getRedisManager();
      const ttl = getTTL('worker-details');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache worker details', { error: err.message });
      });
    }

    return data;
  }

  /**
   * Get worker hashrate with caching
   */
  async getWorkerHashrate(
    workerId: string,
    params: Record<string, string> = {}
  ): Promise<GetWorkerHashrateResponse> {
    const cacheKey = buildWorkerHashrateKey(workerId, params);

    if (shouldCache('worker-hashrate')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetWorkerHashrateResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getWorkerHashrate(workerId, params);

    // Store in cache (fire-and-forget)
    if (shouldCache('worker-hashrate')) {
      const cache = getRedisManager();
      const ttl = getTTL('worker-hashrate');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache worker hashrate', { error: err.message });
      });
    }

    return data;
  }

  /**
   * Get user rewards with caching
   */
  async getUserRewards(params: Record<string, string> = {}): Promise<GetUserRewardsResponse> {
    const cacheKey = buildUserRewardsKey(params);

    if (shouldCache('user-rewards')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetUserRewardsResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getUserRewards(params);

    // Store in cache (fire-and-forget)
    if (shouldCache('user-rewards')) {
      const cache = getRedisManager();
      const ttl = getTTL('user-rewards');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache user rewards', { error: err.message });
      });
    }

    return data;
  }

  /**
   * Get pool statistics with caching
   */
  async getPoolStats(): Promise<GetPoolStatsResponse> {
    const cacheKey = buildPoolStatsKey();

    if (shouldCache('pool-stats')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetPoolStatsResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getPoolStats();

    // Store in cache (fire-and-forget)
    if (shouldCache('pool-stats')) {
      const cache = getRedisManager();
      const ttl = getTTL('pool-stats');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache pool stats', { error: err.message });
      });
    }

    return data;
  }

  /**
   * Get network statistics with caching
   */
  async getNetworkStats(): Promise<GetNetworkStatsResponse> {
    const cacheKey = buildNetworkStatsKey();

    if (shouldCache('network-stats')) {
      const cache = getRedisManager();
      const cached = await cache.get<GetNetworkStatsResponse>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss - call API
    const data = await this.client.getNetworkStats();

    // Store in cache (fire-and-forget)
    if (shouldCache('network-stats')) {
      const cache = getRedisManager();
      const ttl = getTTL('network-stats');
      cache.set(cacheKey, data, ttl).catch((err: Error) => {
        logger.debug('Failed to cache network stats', { error: err.message });
      });
    }

    return data;
  }
}

/**
 * Singleton instance of the cached Braiins client
 */
let cachedClientInstance: CachedBraiinsClient | null = null;

/**
 * Get the cached Braiins client instance (lazy initialization)
 */
export function getCachedBraiinsClient(): CachedBraiinsClient {
  if (!cachedClientInstance) {
    cachedClientInstance = new CachedBraiinsClient();
  }
  return cachedClientInstance;
}

/**
 * Reset the cached client instance (useful for testing)
 */
export function resetCachedBraiinsClient(): void {
  cachedClientInstance = null;
}
