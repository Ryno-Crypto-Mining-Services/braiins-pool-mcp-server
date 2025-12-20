/**
 * Unit tests for getPoolStats tool
 *
 * Tests global Braiins Pool statistics retrieval including hashrate,
 * active workers, last block found, and luck metrics.
 *
 * @see API.md Section 7.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetPoolStatsInputSchema } from '../../../src/schemas/getPoolStatsInput.js';
import { GetPoolStatsResponseSchema } from '../../../src/schemas/getPoolStatsResponse.js';

// Mock the braiinsClient module
vi.mock('../../../src/api/braiinsClient.js', () => ({
  getBraiinsClient: vi.fn(),
  resetBraiinsClient: vi.fn(),
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

describe('getPoolStats', () => {
  // Sample valid API response
  const mockApiResponse = {
    coin: 'BTC',
    pool_hashrate: 725000000000000000000, // 725 EH/s
    workers_active: 1250000,
    last_block: {
      height: 875432,
      found_at: '2025-01-10T08:15:30Z',
      reward: '3.125',
    },
    luck: {
      window_blocks: 1000,
      value: 1.05,
    },
    updated_at: '2025-01-10T12:34:56Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Schema', () => {
    it('should accept empty object', () => {
      const result = GetPoolStatsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject extra properties in strict mode', () => {
      const result = GetPoolStatsInputSchema.safeParse({ extra: 'property' });
      expect(result.success).toBe(false);
    });

    it('should reject non-object input', () => {
      const result = GetPoolStatsInputSchema.safeParse('string');
      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = GetPoolStatsInputSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('should reject array input', () => {
      const result = GetPoolStatsInputSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it('should reject undefined input', () => {
      const result = GetPoolStatsInputSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetPoolStatsResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coin).toBe('BTC');
        expect(result.data.pool_hashrate).toBe(725000000000000000000);
        expect(result.data.workers_active).toBe(1250000);
      }
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = {
        coin: 'BTC',
        // missing other required fields
      };
      const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative pool hashrate', () => {
      const invalidResponse = {
        ...mockApiResponse,
        pool_hashrate: -100,
      };
      const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept zero pool hashrate', () => {
      const response = {
        ...mockApiResponse,
        pool_hashrate: 0,
      };
      const result = GetPoolStatsResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject negative worker count', () => {
      const invalidResponse = {
        ...mockApiResponse,
        workers_active: -5,
      };
      const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer worker count', () => {
      const invalidResponse = {
        ...mockApiResponse,
        workers_active: 1250.5,
      };
      const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format for updated_at', () => {
      const invalidResponse = {
        ...mockApiResponse,
        updated_at: 'not-a-date',
      };
      const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    describe('Last Block Schema', () => {
      it('should validate valid last block data', () => {
        const result = GetPoolStatsResponseSchema.safeParse(mockApiResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.last_block.height).toBe(875432);
          expect(result.data.last_block.reward).toBe('3.125');
        }
      });

      it('should reject negative block height', () => {
        const invalidResponse = {
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            height: -1,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject non-integer block height', () => {
        const invalidResponse = {
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            height: 875432.5,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject invalid datetime format for found_at', () => {
        const invalidResponse = {
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            found_at: 'invalid-date',
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should accept valid reward string', () => {
        const response = {
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            reward: '6.25',
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });

    describe('Luck Schema', () => {
      it('should validate valid luck data', () => {
        const result = GetPoolStatsResponseSchema.safeParse(mockApiResponse);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.luck.window_blocks).toBe(1000);
          expect(result.data.luck.value).toBe(1.05);
        }
      });

      it('should reject non-positive window_blocks', () => {
        const invalidResponse = {
          ...mockApiResponse,
          luck: {
            window_blocks: 0,
            value: 1.0,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should reject negative window_blocks', () => {
        const invalidResponse = {
          ...mockApiResponse,
          luck: {
            window_blocks: -100,
            value: 1.0,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(invalidResponse);
        expect(result.success).toBe(false);
      });

      it('should accept luck value below 1 (unlucky)', () => {
        const response = {
          ...mockApiResponse,
          luck: {
            window_blocks: 1000,
            value: 0.75,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });

      it('should accept luck value above 1 (lucky)', () => {
        const response = {
          ...mockApiResponse,
          luck: {
            window_blocks: 1000,
            value: 1.25,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });

      it('should accept very high luck value', () => {
        const response = {
          ...mockApiResponse,
          luck: {
            window_blocks: 100,
            value: 2.5,
          },
        };
        const result = GetPoolStatsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      expect(text).toContain('Braiins Pool Statistics');
      expect(text).toContain('BTC');
      expect(text).toContain('725.00 EH/s');
      expect(text).toContain('1,250,000'); // workers formatted with commas
      expect(text).toContain('875,432'); // block height formatted
      expect(text).toContain('3.125 BTC'); // reward
    });

    it('should format luck as lucky when value >= 1.0', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          luck: { window_blocks: 1000, value: 1.05 },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Lucky');
      expect(text).toContain('105.0%');
    });

    it('should format luck as very lucky when value >= 1.1', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          luck: { window_blocks: 1000, value: 1.15 },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Very Lucky');
      expect(text).toContain('115.0%');
    });

    it('should format luck as unlucky when value < 0.9', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          luck: { window_blocks: 1000, value: 0.85 },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Unlucky');
      expect(text).toContain('85.0%');
    });

    it('should format luck as very unlucky when value < 0.8', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          luck: { window_blocks: 1000, value: 0.65 },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Very Unlucky');
      expect(text).toContain('65.0%');
    });

    it('should format luck as normal when value between 0.9 and 1.0', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          luck: { window_blocks: 1000, value: 0.95 },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Normal');
      expect(text).toContain('95.0%');
    });

    it('should format hashrate correctly for different scales', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      // Test PH/s scale
      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          pool_hashrate: 5500000000000000, // 5.5 PH/s
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('5.50 PH/s');
    });

    it('should return error on API failure', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getPoolStats: vi.fn().mockRejectedValue(
          new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)
        ),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe(true);
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should handle network errors gracefully', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getPoolStats: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('NETWORK_ERROR');
    });

    it('should handle rate limit errors', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getPoolStats: vi.fn().mockRejectedValue(
          new BraiinsApiError('Rate limited', ErrorCode.RATE_LIMITED, 429)
        ),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('RATE_LIMITED');
    });

    it('should return raw data on validation failure', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      // Return data that doesn't match schema
      const invalidData = {
        coin: 'BTC',
        pool_hashrate: 'not a number',
        workers_active: 1000,
      };

      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue(invalidData),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});

      // Should return raw data, not error
      expect(result.isError).toBeUndefined();
      const responseText = result.content[0].text;
      expect(responseText).toContain('not a number');
    });

    it('should reject extra input parameters', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const result = await getPoolStatsTool.handler({ unexpected: 'param' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      expect(getPoolStatsTool.name).toBe('getPoolStats');
    });

    it('should have description', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      expect(getPoolStatsTool.description).toBeTruthy();
      expect(getPoolStatsTool.description.length).toBeGreaterThan(20);
    });

    it('should have empty input schema (no required params)', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      expect(getPoolStatsTool.inputSchema.type).toBe('object');
      expect(getPoolStatsTool.inputSchema.required).toEqual([]);
    });

    it('should have empty properties in input schema', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      expect(getPoolStatsTool.inputSchema.properties).toEqual({});
    });

    it('should have handler function', async () => {
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');
      expect(typeof getPoolStatsTool.handler).toBe('function');
    });
  });

  describe('Relative Time Formatting', () => {
    it('should format time as "Just now" for recent blocks', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const now = new Date();
      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            found_at: now.toISOString(),
          },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('Just now');
    });

    it('should format time as minutes ago', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            found_at: thirtyMinutesAgo.toISOString(),
          },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('30m ago');
    });

    it('should format time as hours ago', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            found_at: fiveHoursAgo.toISOString(),
          },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('5h ago');
    });

    it('should format time as days ago', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getPoolStatsTool } = await import('../../../src/tools/getPoolStats.js');

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const mockClient = {
        getPoolStats: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          last_block: {
            ...mockApiResponse.last_block,
            found_at: threeDaysAgo.toISOString(),
          },
        }),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getPoolStatsTool.handler({});
      const text = result.content[0].text;

      expect(text).toContain('3d ago');
    });
  });
});
