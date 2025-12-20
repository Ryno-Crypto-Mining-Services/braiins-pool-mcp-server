/**
 * Unit tests for caching strategy
 *
 * Tests TTL configuration, environment variable handling, and cache decisions.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_TTL,
  loadCacheConfig,
  getCacheConfig,
  resetCacheConfig,
  getTTL,
  shouldCache,
  getAllTTLs,
} from '../../../src/cache/cachingStrategy.js';

describe('cachingStrategy', () => {
  // Store original env values
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Reset cache config before each test
    resetCacheConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Reset cache config after each test
    resetCacheConfig();
  });

  describe('DEFAULT_TTL', () => {
    it('should have correct default TTL for user-overview (30s)', () => {
      expect(DEFAULT_TTL['user-overview']).toBe(30);
    });

    it('should have correct default TTL for workers-list (30s)', () => {
      expect(DEFAULT_TTL['workers-list']).toBe(30);
    });

    it('should have correct default TTL for worker-details (30s)', () => {
      expect(DEFAULT_TTL['worker-details']).toBe(30);
    });

    it('should have correct default TTL for worker-hashrate (300s)', () => {
      expect(DEFAULT_TTL['worker-hashrate']).toBe(300);
    });

    it('should have correct default TTL for user-rewards (300s)', () => {
      expect(DEFAULT_TTL['user-rewards']).toBe(300);
    });

    it('should have correct default TTL for pool-stats (60s)', () => {
      expect(DEFAULT_TTL['pool-stats']).toBe(60);
    });

    it('should have correct default TTL for network-stats (60s)', () => {
      expect(DEFAULT_TTL['network-stats']).toBe(60);
    });
  });

  describe('loadCacheConfig', () => {
    it('should load config with defaults when no env vars set', () => {
      const config = loadCacheConfig();
      expect(config.enabled).toBe(true);
      expect(config.ttl['user-overview']).toBe(30);
      expect(config.ttl['pool-stats']).toBe(60);
      expect(config.ttl['worker-hashrate']).toBe(300);
    });

    it('should disable cache when CACHE_ENABLED is false', () => {
      process.env.CACHE_ENABLED = 'false';
      const config = loadCacheConfig();
      expect(config.enabled).toBe(false);
    });

    it('should enable cache when CACHE_ENABLED is true', () => {
      process.env.CACHE_ENABLED = 'true';
      const config = loadCacheConfig();
      expect(config.enabled).toBe(true);
    });

    it('should enable cache when CACHE_ENABLED is any value except false', () => {
      process.env.CACHE_ENABLED = 'yes';
      const config = loadCacheConfig();
      expect(config.enabled).toBe(true);
    });

    it('should override user-overview TTL from env', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '120';
      const config = loadCacheConfig();
      expect(config.ttl['user-overview']).toBe(120);
    });

    it('should override workers TTL from env', () => {
      process.env.CACHE_TTL_WORKERS = '45';
      const config = loadCacheConfig();
      expect(config.ttl['workers-list']).toBe(45);
      expect(config.ttl['worker-details']).toBe(45);
    });

    it('should override historical TTL from env', () => {
      process.env.CACHE_TTL_HISTORICAL = '600';
      const config = loadCacheConfig();
      expect(config.ttl['worker-hashrate']).toBe(600);
      expect(config.ttl['user-rewards']).toBe(600);
    });

    it('should override pool-stats TTL from env', () => {
      process.env.CACHE_TTL_POOL_STATS = '90';
      const config = loadCacheConfig();
      expect(config.ttl['pool-stats']).toBe(90);
    });

    it('should override network-stats TTL from env', () => {
      process.env.CACHE_TTL_NETWORK_STATS = '120';
      const config = loadCacheConfig();
      expect(config.ttl['network-stats']).toBe(120);
    });

    it('should use default for invalid TTL value', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = 'invalid';
      const config = loadCacheConfig();
      expect(config.ttl['user-overview']).toBe(30);
    });

    it('should use default for negative TTL value', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '-10';
      const config = loadCacheConfig();
      expect(config.ttl['user-overview']).toBe(30);
    });

    it('should accept zero as valid TTL (disables caching for resource)', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '0';
      const config = loadCacheConfig();
      expect(config.ttl['user-overview']).toBe(0);
    });

    it('should use default for empty string', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '';
      const config = loadCacheConfig();
      expect(config.ttl['user-overview']).toBe(30);
    });
  });

  describe('getCacheConfig', () => {
    it('should return cached config on subsequent calls', () => {
      const config1 = getCacheConfig();
      const config2 = getCacheConfig();
      expect(config1).toBe(config2);
    });

    it('should return fresh config after reset', () => {
      const config1 = getCacheConfig();
      resetCacheConfig();
      process.env.CACHE_ENABLED = 'false';
      const config2 = getCacheConfig();
      expect(config1.enabled).toBe(true);
      expect(config2.enabled).toBe(false);
    });
  });

  describe('getTTL', () => {
    it('should return TTL for user-overview', () => {
      expect(getTTL('user-overview')).toBe(30);
    });

    it('should return TTL for workers-list', () => {
      expect(getTTL('workers-list')).toBe(30);
    });

    it('should return TTL for worker-details', () => {
      expect(getTTL('worker-details')).toBe(30);
    });

    it('should return TTL for worker-hashrate', () => {
      expect(getTTL('worker-hashrate')).toBe(300);
    });

    it('should return TTL for user-rewards', () => {
      expect(getTTL('user-rewards')).toBe(300);
    });

    it('should return TTL for pool-stats', () => {
      expect(getTTL('pool-stats')).toBe(60);
    });

    it('should return TTL for network-stats', () => {
      expect(getTTL('network-stats')).toBe(60);
    });

    it('should return custom TTL from env', () => {
      process.env.CACHE_TTL_POOL_STATS = '180';
      resetCacheConfig();
      expect(getTTL('pool-stats')).toBe(180);
    });
  });

  describe('shouldCache', () => {
    it('should return true when caching is enabled and TTL > 0', () => {
      expect(shouldCache('user-overview')).toBe(true);
      expect(shouldCache('pool-stats')).toBe(true);
      expect(shouldCache('worker-hashrate')).toBe(true);
    });

    it('should return false when caching is disabled', () => {
      process.env.CACHE_ENABLED = 'false';
      resetCacheConfig();
      expect(shouldCache('user-overview')).toBe(false);
      expect(shouldCache('pool-stats')).toBe(false);
    });

    it('should return false when TTL is 0', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '0';
      resetCacheConfig();
      expect(shouldCache('user-overview')).toBe(false);
    });

    it('should return true for other resources when one is disabled', () => {
      process.env.CACHE_TTL_USER_OVERVIEW = '0';
      resetCacheConfig();
      expect(shouldCache('user-overview')).toBe(false);
      expect(shouldCache('pool-stats')).toBe(true);
    });
  });

  describe('getAllTTLs', () => {
    it('should return all TTL values', () => {
      const ttls = getAllTTLs();
      expect(ttls).toEqual({
        'user-overview': 30,
        'workers-list': 30,
        'worker-details': 30,
        'worker-hashrate': 300,
        'user-rewards': 300,
        'pool-stats': 60,
        'network-stats': 60,
      });
    });

    it('should reflect custom env values', () => {
      process.env.CACHE_TTL_POOL_STATS = '120';
      process.env.CACHE_TTL_HISTORICAL = '600';
      resetCacheConfig();

      const ttls = getAllTTLs();
      expect(ttls['pool-stats']).toBe(120);
      expect(ttls['worker-hashrate']).toBe(600);
      expect(ttls['user-rewards']).toBe(600);
    });

    it('should return a copy, not the original object', () => {
      const ttls1 = getAllTTLs();
      const ttls2 = getAllTTLs();
      expect(ttls1).not.toBe(ttls2);
      expect(ttls1).toEqual(ttls2);
    });
  });

  describe('resetCacheConfig', () => {
    it('should allow reloading config with new env values', () => {
      // Get initial config
      const config1 = getCacheConfig();
      expect(config1.ttl['pool-stats']).toBe(60);

      // Change env and reset
      process.env.CACHE_TTL_POOL_STATS = '999';
      resetCacheConfig();

      // Get new config
      const config2 = getCacheConfig();
      expect(config2.ttl['pool-stats']).toBe(999);
    });
  });
});
