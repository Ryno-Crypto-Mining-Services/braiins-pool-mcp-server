/**
 * Unit tests for getNetworkStats tool
 *
 * Tests Bitcoin network statistics retrieval including difficulty,
 * hashrate, block timing, and difficulty adjustment ETA.
 *
 * @see API.md Section 7.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetNetworkStatsInputSchema } from '../../../src/schemas/getNetworkStatsInput.js';
import { GetNetworkStatsResponseSchema } from '../../../src/schemas/getNetworkStatsResponse.js';

// Mock the cachedBraiinsClient module
vi.mock('../../../src/api/cachedBraiinsClient.js', () => ({
  getCachedBraiinsClient: vi.fn(),
  resetCachedBraiinsClient: vi.fn(),
}));

// Mock config to avoid environment variable issues
vi.mock('../../../src/config/settings.js', () => ({
  config: {
    nodeEnv: 'test',
    braiinsApiBaseUrl: 'https://pool.braiins.com/api/v1',
    braiinsApiToken: 'test-token',
    logLevel: 'error',
    logFormat: 'json',
  },
}));

describe('getNetworkStats', () => {
  // Sample valid API response
  const mockApiResponse = {
    coin: 'BTC',
    difficulty: 90000000000000, // 90 trillion
    hashrate_estimate: 500000000000000000000, // 500 EH/s
    block_time_target: 600, // 10 minutes
    block_time_avg: 610, // slightly slow
    next_difficulty_change_eta: '2025-01-15T12:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Schema', () => {
    it('should accept empty object', () => {
      const result = GetNetworkStatsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject extra properties in strict mode', () => {
      const result = GetNetworkStatsInputSchema.safeParse({ extra: 'property' });
      expect(result.success).toBe(false);
    });

    it('should reject non-object input', () => {
      const result = GetNetworkStatsInputSchema.safeParse('string');
      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = GetNetworkStatsInputSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = GetNetworkStatsInputSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('should reject undefined input', () => {
      const result = GetNetworkStatsInputSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetNetworkStatsResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coin).toBe('BTC');
        expect(result.data.difficulty).toBe(90000000000000);
        expect(result.data.hashrate_estimate).toBe(500000000000000000000);
      }
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = {
        coin: 'BTC',
        // missing other required fields
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative difficulty', () => {
      const invalidResponse = {
        ...mockApiResponse,
        difficulty: -100,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept zero difficulty', () => {
      const response = {
        ...mockApiResponse,
        difficulty: 0,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject negative hashrate estimate', () => {
      const invalidResponse = {
        ...mockApiResponse,
        hashrate_estimate: -100,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive block time target', () => {
      const invalidResponse = {
        ...mockApiResponse,
        block_time_target: 0,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative block time target', () => {
      const invalidResponse = {
        ...mockApiResponse,
        block_time_target: -600,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer block time target', () => {
      const invalidResponse = {
        ...mockApiResponse,
        block_time_target: 600.5,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject non-positive block time avg', () => {
      const invalidResponse = {
        ...mockApiResponse,
        block_time_avg: 0,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept decimal block time avg', () => {
      const response = {
        ...mockApiResponse,
        block_time_avg: 605.5,
      };
      const result = GetNetworkStatsResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime format for next_difficulty_change_eta', () => {
      const invalidResponse = {
        ...mockApiResponse,
        next_difficulty_change_eta: 'not-a-date',
      };
      const result = GetNetworkStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept valid ISO 8601 datetime with timezone', () => {
      const response = {
        ...mockApiResponse,
        next_difficulty_change_eta: '2025-01-15T12:00:00+00:00',
      };
      const result = GetNetworkStatsResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      expect(text).toContain('Bitcoin Network Statistics');
      expect(text).toContain('500.00 EH/s');
      expect(text).toContain('90.00 T'); // difficulty in trillions
      expect(text).toContain('10m'); // target block time
    });

    it('should format hashrate correctly for EH/s scale', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          hashrate_estimate: 750000000000000000000, // 750 EH/s
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('750.00 EH/s');
    });

    it('should format difficulty in trillions', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          difficulty: 95500000000000, // 95.5 trillion
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('95.50 T');
    });

    it('should format difficulty in billions when appropriate', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          difficulty: 500000000000, // 500 billion
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('500.00 B');
    });

    it('should show "On Target" indicator when block time is normal', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          block_time_avg: 600, // exactly on target
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('On Target');
    });

    it('should show "Fast" indicator when blocks are faster than target', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          block_time_avg: 500, // much faster than target
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Fast');
    });

    it('should show "Slow" indicator when blocks are slower than target', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          block_time_avg: 700, // much slower than target
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Slow');
    });

    it('should format block time with minutes and seconds', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          block_time_avg: 625, // 10m 25s
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('10m 25s');
    });

    it('should return error on API failure', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getNetworkStats: vi
          .fn()
          .mockRejectedValue(new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.error).toBe(true);
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should handle network errors gracefully', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getNetworkStats: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('NETWORK_ERROR');
    });

    it('should handle rate limit errors', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getNetworkStats: vi
          .fn()
          .mockRejectedValue(new BraiinsApiError('Rate limited', ErrorCode.RATE_LIMITED, 429)),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('RATE_LIMITED');
    });

    it('should return raw data on validation failure', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      // Return data that doesn't match schema
      const invalidData = {
        coin: 'BTC',
        difficulty: 'not a number',
        hashrate_estimate: 500000000000000000000,
      };

      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue(invalidData),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});

      // Should return raw data, not error
      expect(result.isError).toBeUndefined();
      const responseText = result.content[0].text;
      expect(responseText).toContain('not a number');
    });

    it('should reject extra input parameters', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      const result = await getNetworkStatsTool.handler({ unexpected: 'param' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      expect(getNetworkStatsTool.name).toBe('getNetworkStats');
    });

    it('should have description', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      expect(getNetworkStatsTool.description).toBeTruthy();
      expect(getNetworkStatsTool.description.length).toBeGreaterThan(20);
    });

    it('should have empty input schema (no required params)', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      expect(getNetworkStatsTool.inputSchema.type).toBe('object');
      expect(getNetworkStatsTool.inputSchema.required).toEqual([]);
    });

    it('should have empty properties in input schema', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      expect(getNetworkStatsTool.inputSchema.properties).toEqual({});
    });

    it('should have handler function', async () => {
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');
      expect(typeof getNetworkStatsTool.handler).toBe('function');
    });
  });

  describe('Time Until Formatting', () => {
    it('should format time until in days and hours', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      // Set next adjustment to 3 days and 5 hours from now (with buffer for test execution)
      const future = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000 + 30 * 60 * 1000
      );
      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          next_difficulty_change_eta: future.toISOString(),
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      // Check for format pattern (3d Xh where X is 4-5 depending on timing)
      expect(text).toMatch(/3d [45]h/);
    });

    it('should format time until in hours only', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      // Set next adjustment to 12 hours from now (with buffer for test execution)
      const future = new Date(Date.now() + 12 * 60 * 60 * 1000 + 30 * 60 * 1000);
      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          next_difficulty_change_eta: future.toISOString(),
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      // Check for hour format (11-12h depending on timing)
      expect(text).toMatch(/1[12]h/);
    });

    it('should format time until in minutes when less than an hour', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      // Set next adjustment to 45 minutes from now (with buffer for test execution)
      const future = new Date(Date.now() + 46 * 60 * 1000);
      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          next_difficulty_change_eta: future.toISOString(),
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      // Check for minute format (44-46m depending on timing)
      expect(text).toMatch(/4[456]m/);
    });

    it('should show "Imminent" when adjustment is past or very soon', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getNetworkStatsTool } = await import('../../../src/tools/getNetworkStats.js');

      // Set next adjustment to the past
      const past = new Date(Date.now() - 60 * 1000);
      const mockClient = {
        getNetworkStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          next_difficulty_change_eta: past.toISOString(),
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getNetworkStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Imminent');
    });
  });
});
