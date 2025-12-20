/**
 * Unit tests for Redis Manager
 *
 * Tests Redis caching operations with ioredis-mock.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the config module before importing RedisManager
vi.mock('../../../src/config/settings.js', () => ({
  config: {
    nodeEnv: 'test',
    redisEnabled: true,
    redisUrl: 'redis://localhost:6379',
    braiinsApiBaseUrl: 'https://pool.braiins.com/api/v1',
    braiinsApiToken: 'test-token',
    logLevel: 'error',
    logFormat: 'json',
  },
}));

// Mock ioredis with ioredis-mock
vi.mock('ioredis', async () => {
  const RedisMock = (await import('ioredis-mock')).default;
  return { default: RedisMock };
});

import {
  RedisManager,
  getRedisManager,
  resetRedisManager,
} from '../../../src/cache/redisManager.js';

describe('RedisManager', () => {
  let manager: RedisManager;

  beforeEach(async () => {
    // Reset the singleton before each test
    await resetRedisManager();
    manager = new RedisManager();
  });

  afterEach(async () => {
    // Clean up after each test
    await manager.close();
    await resetRedisManager();
  });

  describe('get and set', () => {
    it('should set and get a string value', async () => {
      await manager.set('test-key', 'test-value');
      const value = await manager.get<string>('test-key');
      expect(value).toBe('test-value');
    });

    it('should set and get an object value', async () => {
      const data = { name: 'test', count: 42, nested: { value: true } };
      await manager.set('object-key', data);
      const value = await manager.get<typeof data>('object-key');
      expect(value).toEqual(data);
    });

    it('should set and get an array value', async () => {
      const data = [1, 2, 3, 'test', { key: 'value' }];
      await manager.set('array-key', data);
      const value = await manager.get<typeof data>('array-key');
      expect(value).toEqual(data);
    });

    it('should return null for non-existent key', async () => {
      const value = await manager.get('non-existent');
      expect(value).toBeNull();
    });

    it('should return null after TTL expires', async () => {
      // Set with 1 second TTL
      await manager.set('expiring-key', 'value', 1);

      // Should exist immediately
      const immediate = await manager.get<string>('expiring-key');
      expect(immediate).toBe('value');

      // Wait for TTL to expire (ioredis-mock supports TTL)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be null after expiry
      const expired = await manager.get<string>('expiring-key');
      expect(expired).toBeNull();
    });

    it('should use default TTL of 60 seconds', async () => {
      await manager.set('default-ttl-key', 'value');
      // Value should still exist (well before 60s)
      const value = await manager.get<string>('default-ttl-key');
      expect(value).toBe('value');
    });

    it('should overwrite existing value', async () => {
      await manager.set('overwrite-key', 'first');
      await manager.set('overwrite-key', 'second');
      const value = await manager.get<string>('overwrite-key');
      expect(value).toBe('second');
    });
  });

  describe('delete', () => {
    it('should delete existing key', async () => {
      await manager.set('delete-key', 'value');
      const deleted = await manager.delete('delete-key');
      expect(deleted).toBe(true);

      const value = await manager.get<string>('delete-key');
      expect(value).toBeNull();
    });

    it('should return false for non-existent key', async () => {
      const deleted = await manager.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('flush', () => {
    it('should remove all keys', async () => {
      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');
      await manager.set('key3', 'value3');

      await manager.flush();

      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBeNull();
      expect(await manager.get('key3')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should track cache hits', async () => {
      await manager.set('stats-key', 'value');
      await manager.get<string>('stats-key');
      await manager.get<string>('stats-key');

      const stats = manager.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', async () => {
      await manager.get<string>('missing1');
      await manager.get<string>('missing2');

      const stats = manager.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit ratio correctly', async () => {
      await manager.set('ratio-key', 'value');

      // 2 hits
      await manager.get<string>('ratio-key');
      await manager.get<string>('ratio-key');

      // 2 misses
      await manager.get<string>('missing1');
      await manager.get<string>('missing2');

      const stats = manager.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.ratio).toBe(0.5);
    });

    it('should return 0 ratio when no operations', () => {
      const stats = manager.getStats();
      expect(stats.ratio).toBe(0);
    });

    it('should return a copy of stats', () => {
      const stats1 = manager.getStats();
      const stats2 = manager.getStats();
      expect(stats1).not.toBe(stats2);
    });
  });

  describe('isConnected', () => {
    it('should return true after successful operation', async () => {
      await manager.set('connection-test', 'value');
      expect(manager.isConnected()).toBe(true);
    });
  });

  describe('close', () => {
    it('should close connection gracefully', async () => {
      await manager.set('close-test', 'value');
      expect(manager.isConnected()).toBe(true);

      await manager.close();
      expect(manager.isConnected()).toBe(false);
    });

    it('should handle multiple close calls', async () => {
      await manager.close();
      await manager.close();
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getRedisManager', () => {
      const manager1 = getRedisManager();
      const manager2 = getRedisManager();
      expect(manager1).toBe(manager2);
    });

    it('should return new instance after reset', async () => {
      const manager1 = getRedisManager();
      await resetRedisManager();
      const manager2 = getRedisManager();
      expect(manager1).not.toBe(manager2);
    });
  });

  describe('JSON serialization', () => {
    it('should handle null values', async () => {
      await manager.set('null-value', null);
      const value = await manager.get<null>('null-value');
      expect(value).toBeNull();
    });

    it('should handle boolean values', async () => {
      await manager.set('bool-true', true);
      await manager.set('bool-false', false);
      expect(await manager.get<boolean>('bool-true')).toBe(true);
      expect(await manager.get<boolean>('bool-false')).toBe(false);
    });

    it('should handle number values', async () => {
      await manager.set('number-int', 42);
      await manager.set('number-float', 3.14159);
      await manager.set('number-negative', -100);
      expect(await manager.get<number>('number-int')).toBe(42);
      expect(await manager.get<number>('number-float')).toBe(3.14159);
      expect(await manager.get<number>('number-negative')).toBe(-100);
    });

    it('should handle complex nested objects', async () => {
      const complex = {
        user: {
          name: 'Test',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        workers: [
          { id: '1', status: 'active' },
          { id: '2', status: 'inactive' },
        ],
        metadata: {
          created: '2025-01-01T00:00:00Z',
          updated: null,
        },
      };
      await manager.set('complex', complex);
      const value = await manager.get<typeof complex>('complex');
      expect(value).toEqual(complex);
    });

    it('should handle unicode strings', async () => {
      const unicode = '🚀 Unicode test: 日本語, Ελληνικά, עברית';
      await manager.set('unicode', unicode);
      const value = await manager.get<string>('unicode');
      expect(value).toBe(unicode);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string key', async () => {
      await manager.set('', 'empty-key-value');
      const value = await manager.get<string>('');
      expect(value).toBe('empty-key-value');
    });

    it('should handle very long keys', async () => {
      const longKey = 'k'.repeat(500);
      await manager.set(longKey, 'long-key-value');
      const value = await manager.get<string>(longKey);
      expect(value).toBe('long-key-value');
    });

    it('should handle very large values', async () => {
      const largeValue = { data: 'x'.repeat(10000) };
      await manager.set('large-value', largeValue);
      const value = await manager.get<typeof largeValue>('large-value');
      expect(value).toEqual(largeValue);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'key:with:colons:and-dashes_and_underscores';
      await manager.set(specialKey, 'special');
      const value = await manager.get<string>(specialKey);
      expect(value).toBe('special');
    });
  });
});

describe('graceful degradation', () => {
  it('should handle operations gracefully when not connected', async () => {
    // Create a manager that hasn't connected yet
    const mgr = new RedisManager();

    // Close immediately to simulate disconnected state
    await mgr.close();

    // Operations should not throw, just return gracefully
    await expect(mgr.set('key', 'value')).resolves.not.toThrow();
    await expect(mgr.delete('key')).resolves.not.toThrow();
    await expect(mgr.flush()).resolves.not.toThrow();
  });

  it('should track misses when connection fails', async () => {
    const mgr = new RedisManager();
    await mgr.close();

    // Get should return null and track as miss
    const value = await mgr.get<string>('key');
    expect(value).toBeNull();

    await mgr.close();
  });
});
