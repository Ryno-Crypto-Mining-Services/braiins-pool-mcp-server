/**
 * Unit tests for getUserRewards tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GetUserRewardsInputSchema,
  toApiParams,
} from '../../../src/schemas/getUserRewardsInput.js';
import { GetUserRewardsResponseSchema } from '../../../src/schemas/getUserRewardsResponse.js';

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

describe('getUserRewards', () => {
  // Sample valid API response
  const mockApiResponse = {
    currency: 'BTC',
    points: [
      {
        timestamp: '2025-01-01T00:00:00Z',
        confirmed: '0.00010000',
        unconfirmed: '0.00001000',
        payout: '0.00000000',
      },
      {
        timestamp: '2025-01-02T00:00:00Z',
        confirmed: '0.00012000',
        unconfirmed: '0.00000500',
        payout: '0.00000000',
      },
      {
        timestamp: '2025-01-03T00:00:00Z',
        confirmed: '0.00011500',
        unconfirmed: '0.00001200',
        payout: '0.00100000',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Schema', () => {
    it('should accept empty object (all optional)', () => {
      const result = GetUserRewardsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid time range', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid granularity options', () => {
      const granularities = ['hour', 'day', 'week'];
      for (const granularity of granularities) {
        const result = GetUserRewardsInputSchema.safeParse({ granularity });
        expect(result.success).toBe(true);
      }
    });

    it('should reject minute granularity (not supported)', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        granularity: 'minute',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid granularity', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        granularity: 'month',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid from timestamp', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        from: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid to timestamp', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        to: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should reject when from is after to', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        from: '2025-01-10T00:00:00Z',
        to: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should accept only from without to', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        from: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept only to without from', () => {
      const result = GetUserRewardsInputSchema.safeParse({
        to: '2025-01-10T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('toApiParams', () => {
    it('should return empty object for empty input', () => {
      const input = GetUserRewardsInputSchema.parse({});
      const params = toApiParams(input);
      expect(params).toEqual({});
    });

    it('should include from when provided', () => {
      const input = GetUserRewardsInputSchema.parse({
        from: '2025-01-01T00:00:00Z',
      });
      const params = toApiParams(input);
      expect(params.from).toBe('2025-01-01T00:00:00Z');
    });

    it('should include to when provided', () => {
      const input = GetUserRewardsInputSchema.parse({
        to: '2025-01-10T00:00:00Z',
      });
      const params = toApiParams(input);
      expect(params.to).toBe('2025-01-10T00:00:00Z');
    });

    it('should include granularity when provided', () => {
      const input = GetUserRewardsInputSchema.parse({
        granularity: 'day',
      });
      const params = toApiParams(input);
      expect(params.granularity).toBe('day');
    });

    it('should include all params when all provided', () => {
      const input = GetUserRewardsInputSchema.parse({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'week',
      });
      const params = toApiParams(input);
      expect(params).toEqual({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'week',
      });
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetUserRewardsResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('BTC');
        expect(result.data.points).toHaveLength(3);
      }
    });

    it('should validate empty points array', () => {
      const emptyResponse = {
        currency: 'BTC',
        points: [],
      };
      const result = GetUserRewardsResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    it('should reject missing currency', () => {
      const invalidResponse = {
        points: mockApiResponse.points,
      };
      const result = GetUserRewardsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject missing points', () => {
      const invalidResponse = {
        currency: 'BTC',
      };
      const result = GetUserRewardsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid BTC amount format', () => {
      const invalidResponse = {
        currency: 'BTC',
        points: [
          {
            timestamp: '2025-01-01T00:00:00Z',
            confirmed: 'invalid',
            unconfirmed: '0.00001000',
            payout: '0.00000000',
          },
        ],
      };
      const result = GetUserRewardsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject BTC amount without decimal', () => {
      const invalidResponse = {
        currency: 'BTC',
        points: [
          {
            timestamp: '2025-01-01T00:00:00Z',
            confirmed: '1',
            unconfirmed: '0.00001000',
            payout: '0.00000000',
          },
        ],
      };
      const result = GetUserRewardsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept valid BTC amounts with various decimal places', () => {
      // Note: Our regex is ^\d+\.\d{1,8}$ so 9 decimals would fail
      for (const amount of ['0.1', '0.12345678', '1.0']) {
        const response = {
          currency: 'BTC',
          points: [
            {
              timestamp: '2025-01-01T00:00:00Z',
              confirmed: amount,
              unconfirmed: '0.0',
              payout: '0.0',
            },
          ],
        };
        const result = GetUserRewardsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid timestamp in points', () => {
      const invalidResponse = {
        currency: 'BTC',
        points: [
          {
            timestamp: 'not-a-date',
            confirmed: '0.00010000',
            unconfirmed: '0.00001000',
            payout: '0.00000000',
          },
        ],
      };
      const result = GetUserRewardsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');

      const mockClient = {
        getUserRewards: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserRewardsTool.handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      // Check header
      expect(text).toContain('Rewards History (BTC)');
      // Check totals section
      expect(text).toContain('Totals');
      expect(text).toContain('Confirmed');
      expect(text).toContain('Unconfirmed');
      expect(text).toContain('Payouts');
      // Check trend visualization
      expect(text).toContain('Earnings Trend');
      // Check recent rewards table
      expect(text).toContain('Recent Rewards');
    });

    it('should pass time range params to API', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');

      const mockClient = {
        getUserRewards: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      await getUserRewardsTool.handler({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'day',
      });

      expect(mockClient.getUserRewards).toHaveBeenCalledWith({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'day',
      });
    });

    it('should handle empty data points', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');

      const emptyResponse = {
        currency: 'BTC',
        points: [],
      };

      const mockClient = {
        getUserRewards: vi.fn().mockResolvedValue(emptyResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserRewardsTool.handler({});

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('No rewards data available');
    });

    it('should return error for invalid time range', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');

      const result = await getUserRewardsTool.handler({
        from: '2025-01-10T00:00:00Z',
        to: '2025-01-01T00:00:00Z',
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should return error on API failure', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getUserRewards: vi
          .fn()
          .mockRejectedValue(new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserRewardsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should handle network errors gracefully', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getUserRewards: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserRewardsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      expect(getUserRewardsTool.name).toBe('getUserRewards');
    });

    it('should have description', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      expect(getUserRewardsTool.description).toBeTruthy();
      expect(getUserRewardsTool.description.length).toBeGreaterThan(20);
    });

    it('should have no required params', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      expect(getUserRewardsTool.inputSchema.required).toEqual([]);
    });

    it('should define all input properties', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      const props = getUserRewardsTool.inputSchema.properties;
      expect(props).toHaveProperty('from');
      expect(props).toHaveProperty('to');
      expect(props).toHaveProperty('granularity');
    });

    it('should define granularity enum with correct values', async () => {
      const { getUserRewardsTool } = await import('../../../src/tools/getUserRewards.js');
      const granularityProp = (
        getUserRewardsTool.inputSchema.properties as Record<string, { enum?: string[] }>
      ).granularity;
      expect(granularityProp.enum).toEqual(['hour', 'day', 'week']);
    });
  });
});
