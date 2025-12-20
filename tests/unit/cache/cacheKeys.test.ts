/**
 * Unit tests for cache key builder
 *
 * Tests type-safe cache key generation, sanitization, and hashing.
 */

import { describe, it, expect } from 'vitest';
import {
  buildUserOverviewKey,
  buildWorkersListKey,
  buildWorkerDetailsKey,
  buildWorkerHashrateKey,
  buildUserRewardsKey,
  buildPoolStatsKey,
  buildNetworkStatsKey,
  buildCacheKey,
  parseCacheKey,
} from '../../../src/cache/cacheKeys.js';

describe('cacheKeys', () => {
  describe('buildUserOverviewKey', () => {
    it('should return consistent key', () => {
      const key = buildUserOverviewKey();
      expect(key).toBe('braiins:user-overview');
    });

    it('should return same key on multiple calls', () => {
      const key1 = buildUserOverviewKey();
      const key2 = buildUserOverviewKey();
      expect(key1).toBe(key2);
    });
  });

  describe('buildWorkersListKey', () => {
    it('should return base key without params', () => {
      const key = buildWorkersListKey();
      expect(key).toBe('braiins:workers-list');
    });

    it('should return base key with empty params', () => {
      const key = buildWorkersListKey({});
      expect(key).toBe('braiins:workers-list');
    });

    it('should include hash suffix with params', () => {
      const key = buildWorkersListKey({ status: 'active', page: 1 });
      expect(key).toMatch(/^braiins:workers-list:[a-f0-9]{16}$/);
    });

    it('should return same key for same params', () => {
      const key1 = buildWorkersListKey({ status: 'active', limit: 10 });
      const key2 = buildWorkersListKey({ status: 'active', limit: 10 });
      expect(key1).toBe(key2);
    });

    it('should return same key regardless of param order', () => {
      const key1 = buildWorkersListKey({ status: 'active', page: 1 });
      const key2 = buildWorkersListKey({ page: 1, status: 'active' });
      expect(key1).toBe(key2);
    });

    it('should return different keys for different params', () => {
      const key1 = buildWorkersListKey({ status: 'active' });
      const key2 = buildWorkersListKey({ status: 'inactive' });
      expect(key1).not.toBe(key2);
    });
  });

  describe('buildWorkerDetailsKey', () => {
    it('should include sanitized worker ID', () => {
      const key = buildWorkerDetailsKey('worker-001');
      expect(key).toBe('braiins:worker-details:worker-001');
    });

    it('should sanitize special characters', () => {
      const key = buildWorkerDetailsKey('Worker@123!test');
      expect(key).toBe('braiins:worker-details:worker_123_test');
    });

    it('should convert to lowercase', () => {
      const key = buildWorkerDetailsKey('WORKER-ABC');
      expect(key).toBe('braiins:worker-details:worker-abc');
    });

    it('should handle dots and underscores', () => {
      const key = buildWorkerDetailsKey('farm1.rack2_miner01');
      expect(key).toBe('braiins:worker-details:farm1_rack2_miner01');
    });

    it('should collapse multiple underscores', () => {
      const key = buildWorkerDetailsKey('test___worker');
      expect(key).toBe('braiins:worker-details:test_worker');
    });

    it('should truncate long identifiers', () => {
      const longId = 'a'.repeat(100);
      const key = buildWorkerDetailsKey(longId);
      // Identifier should be truncated to 64 chars
      expect(key.length).toBeLessThan(100);
    });
  });

  describe('buildWorkerHashrateKey', () => {
    it('should include worker ID without params', () => {
      const key = buildWorkerHashrateKey('worker-001');
      expect(key).toBe('braiins:worker-hashrate:worker-001');
    });

    it('should include worker ID with empty params', () => {
      const key = buildWorkerHashrateKey('worker-001', {});
      expect(key).toBe('braiins:worker-hashrate:worker-001');
    });

    it('should include hash suffix with params', () => {
      const key = buildWorkerHashrateKey('worker-001', {
        from: '2025-01-01',
        to: '2025-01-10',
        granularity: 'hour',
      });
      expect(key).toMatch(/^braiins:worker-hashrate:worker-001:[a-f0-9]{16}$/);
    });

    it('should return same key for same params regardless of order', () => {
      const key1 = buildWorkerHashrateKey('worker-001', { from: '2025-01-01', to: '2025-01-10' });
      const key2 = buildWorkerHashrateKey('worker-001', { to: '2025-01-10', from: '2025-01-01' });
      expect(key1).toBe(key2);
    });
  });

  describe('buildUserRewardsKey', () => {
    it('should return base key without params', () => {
      const key = buildUserRewardsKey();
      expect(key).toBe('braiins:user-rewards');
    });

    it('should include hash suffix with params', () => {
      const key = buildUserRewardsKey({ from: '2025-01-01', granularity: 'day' });
      expect(key).toMatch(/^braiins:user-rewards:[a-f0-9]{16}$/);
    });
  });

  describe('buildPoolStatsKey', () => {
    it('should return consistent key', () => {
      const key = buildPoolStatsKey();
      expect(key).toBe('braiins:pool-stats');
    });
  });

  describe('buildNetworkStatsKey', () => {
    it('should return consistent key', () => {
      const key = buildNetworkStatsKey();
      expect(key).toBe('braiins:network-stats');
    });
  });

  describe('buildCacheKey', () => {
    it('should build key with resource type only', () => {
      const key = buildCacheKey('pool-stats');
      expect(key).toBe('braiins:pool-stats');
    });

    it('should build key with identifier', () => {
      const key = buildCacheKey('worker-details', 'worker-001');
      expect(key).toBe('braiins:worker-details:worker-001');
    });

    it('should build key with params', () => {
      const key = buildCacheKey('workers-list', undefined, { status: 'active' });
      expect(key).toMatch(/^braiins:workers-list:[a-f0-9]{16}$/);
    });

    it('should build key with identifier and params', () => {
      const key = buildCacheKey('worker-hashrate', 'worker-001', { granularity: 'hour' });
      expect(key).toMatch(/^braiins:worker-hashrate:worker-001:[a-f0-9]{16}$/);
    });

    it('should handle very long keys by hashing', () => {
      const longIdentifier = 'a'.repeat(200);
      const key = buildCacheKey('worker-details', longIdentifier);
      expect(key.length).toBeLessThanOrEqual(256);
    });
  });

  describe('parseCacheKey', () => {
    it('should parse simple key', () => {
      const parsed = parseCacheKey('braiins:pool-stats');
      expect(parsed.prefix).toBe('braiins');
      expect(parsed.resourceType).toBe('pool-stats');
      expect(parsed.identifier).toBeUndefined();
      expect(parsed.paramsHash).toBeUndefined();
    });

    it('should parse key with identifier', () => {
      const parsed = parseCacheKey('braiins:worker-details:worker-001');
      expect(parsed.prefix).toBe('braiins');
      expect(parsed.resourceType).toBe('worker-details');
      expect(parsed.identifier).toBe('worker-001');
      expect(parsed.paramsHash).toBeUndefined();
    });

    it('should parse key with identifier and hash', () => {
      const parsed = parseCacheKey('braiins:worker-hashrate:worker-001:abc123');
      expect(parsed.prefix).toBe('braiins');
      expect(parsed.resourceType).toBe('worker-hashrate');
      expect(parsed.identifier).toBe('worker-001');
      expect(parsed.paramsHash).toBe('abc123');
    });

    it('should handle empty string', () => {
      const parsed = parseCacheKey('');
      expect(parsed.prefix).toBe('');
      expect(parsed.resourceType).toBe('');
    });
  });

  describe('hash consistency', () => {
    it('should produce same hash for identical objects', () => {
      const key1 = buildWorkersListKey({ a: 1, b: 'test', c: true });
      const key2 = buildWorkersListKey({ a: 1, b: 'test', c: true });
      expect(key1).toBe(key2);
    });

    it('should produce different hash for different values', () => {
      const key1 = buildWorkersListKey({ value: 1 });
      const key2 = buildWorkersListKey({ value: 2 });
      expect(key1).not.toBe(key2);
    });

    it('should produce different hash for different types', () => {
      const key1 = buildWorkersListKey({ value: '1' });
      const key2 = buildWorkersListKey({ value: 1 });
      expect(key1).not.toBe(key2);
    });

    it('should handle nested objects', () => {
      const key = buildWorkersListKey({ nested: { value: 1 } });
      expect(key).toMatch(/^braiins:workers-list:[a-f0-9]{16}$/);
    });

    it('should handle arrays', () => {
      const key = buildWorkersListKey({ ids: [1, 2, 3] });
      expect(key).toMatch(/^braiins:workers-list:[a-f0-9]{16}$/);
    });
  });
});
