/**
 * Redis Cache Manager
 *
 * Provides a type-safe wrapper around Redis for caching API responses.
 * Implements graceful degradation when Redis is unavailable.
 */

import Redis from 'ioredis';
import { config } from '../config/settings.js';
import { logger } from '../utils/logger.js';

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  ratio: number;
}

/**
 * Redis Manager for caching operations
 *
 * Design principles:
 * - Never throws exceptions (cache is optimization, not requirement)
 * - Graceful degradation when Redis unavailable
 * - Type-safe get/set with JSON serialization
 * - Metrics tracking for observability
 */
export class RedisManager {
  private client: Redis | null = null;
  private connected = false;
  private connecting = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    ratio: 0,
  };

  /**
   * Initialize Redis connection
   * Called lazily on first cache operation
   */
  private async connect(): Promise<boolean> {
    // Skip if Redis is disabled
    if (!config.redisEnabled) {
      logger.debug('Redis caching disabled via configuration');
      return false;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.connecting) {
      return false;
    }

    // Already connected
    if (this.connected && this.client) {
      return true;
    }

    this.connecting = true;

    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times: number) => {
          // Only retry 3 times, then give up
          if (times > 3) {
            return null;
          }
          return Math.min(times * 200, 1000);
        },
        enableReadyCheck: true,
        connectTimeout: 5000,
        lazyConnect: true,
      });

      // Set up event handlers
      this.client.on('connect', () => {
        logger.info('Redis connected');
        this.connected = true;
      });

      this.client.on('error', (err: Error) => {
        logger.warn('Redis error', { error: err.message });
        this.connected = false;
        this.stats.errors++;
      });

      this.client.on('close', () => {
        logger.debug('Redis connection closed');
        this.connected = false;
      });

      // Attempt connection
      await this.client.connect();
      this.connected = true;
      logger.info('Redis cache initialized', { url: this.sanitizeUrl(config.redisUrl) });
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.warn('Failed to connect to Redis, caching disabled', {
        error: error.message,
      });
      this.connected = false;
      this.stats.errors++;
      return false;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Sanitize Redis URL for logging (remove password)
   */
  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '[REDACTED]';
      }
      return parsed.toString();
    } catch {
      return '[invalid-url]';
    }
  }

  /**
   * Update hit/miss ratio
   */
  private updateRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.ratio = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Get a value from cache
   *
   * @param key - Cache key
   * @returns Cached value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Ensure connection
      const isConnected = await this.connect();
      if (!isConnected || !this.client) {
        this.stats.misses++;
        this.updateRatio();
        return null;
      }

      const value = await this.client.get(key);

      if (value === null) {
        this.stats.misses++;
        this.updateRatio();
        logger.debug('Cache miss', { key });
        return null;
      }

      // Parse JSON value
      const parsed = JSON.parse(value) as T;
      this.stats.hits++;
      this.updateRatio();
      logger.debug('Cache hit', { key });
      return parsed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.warn('Cache get error', { key, error: error.message });
      this.stats.errors++;
      this.stats.misses++;
      this.updateRatio();
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   *
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttlSeconds - Time to live in seconds (default: 60)
   */
  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    try {
      // Ensure connection
      const isConnected = await this.connect();
      if (!isConnected || !this.client) {
        return;
      }

      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttlSeconds, serialized);
      logger.debug('Cache set', { key, ttl: ttlSeconds });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.warn('Cache set error', { key, error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Delete a value from cache
   *
   * @param key - Cache key
   * @returns true if key was deleted, false otherwise
   */
  async delete(key: string): Promise<boolean> {
    try {
      // Ensure connection
      const isConnected = await this.connect();
      if (!isConnected || !this.client) {
        return false;
      }

      const result = await this.client.del(key);
      logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.warn('Cache delete error', { key, error: error.message });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Flush all keys from cache
   */
  async flush(): Promise<void> {
    try {
      const isConnected = await this.connect();
      if (!isConnected || !this.client) {
        return;
      }

      await this.client.flushdb();
      logger.info('Cache flushed');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.warn('Cache flush error', { error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
      logger.debug('Redis connection closed');
    }
  }
}

/**
 * Singleton instance of Redis manager
 */
let managerInstance: RedisManager | null = null;

/**
 * Get the Redis manager instance (lazy initialization)
 */
export function getRedisManager(): RedisManager {
  if (!managerInstance) {
    managerInstance = new RedisManager();
  }
  return managerInstance;
}

/**
 * Reset the Redis manager instance (useful for testing)
 */
export async function resetRedisManager(): Promise<void> {
  if (managerInstance) {
    await managerInstance.close();
    managerInstance = null;
  }
}
