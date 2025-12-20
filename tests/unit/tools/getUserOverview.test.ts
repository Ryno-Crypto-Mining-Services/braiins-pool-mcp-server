/**
 * Unit tests for getUserOverview tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetUserOverviewInputSchema } from '../../../src/schemas/getUserOverviewInput.js';
import { GetUserOverviewResponseSchema } from '../../../src/schemas/getUserOverviewResponse.js';

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

describe('getUserOverview', () => {
  // Sample valid API response
  const mockApiResponse = {
    username: 'test_user',
    currency: 'BTC',
    hashrate: {
      current: 120000000000000, // 120 TH/s
      avg_1h: 118000000000000,
      avg_24h: 115000000000000,
    },
    rewards: {
      confirmed: '0.01234567',
      unconfirmed: '0.00012345',
      last_payout: '0.00100000',
      last_payout_at: '2025-01-01T10:00:00Z',
    },
    workers: {
      active: 42,
      inactive: 3,
      total: 45,
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
      const result = GetUserOverviewInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject extra properties in strict mode', () => {
      const result = GetUserOverviewInputSchema.safeParse({ extra: 'property' });
      expect(result.success).toBe(false);
    });

    it('should reject non-object input', () => {
      const result = GetUserOverviewInputSchema.safeParse('string');
      expect(result.success).toBe(false);
    });

    it('should reject null input', () => {
      const result = GetUserOverviewInputSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetUserOverviewResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('test_user');
        expect(result.data.hashrate.current).toBe(120000000000000);
      }
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = {
        username: 'test_user',
        // missing other required fields
      };
      const result = GetUserOverviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid hashrate type', () => {
      const invalidResponse = {
        ...mockApiResponse,
        hashrate: {
          current: 'not a number',
          avg_1h: 118000000000000,
          avg_24h: 115000000000000,
        },
      };
      const result = GetUserOverviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative hashrate values', () => {
      const invalidResponse = {
        ...mockApiResponse,
        hashrate: {
          current: -100,
          avg_1h: 118000000000000,
          avg_24h: 115000000000000,
        },
      };
      const result = GetUserOverviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept null for last_payout_at', () => {
      const responseWithNullPayout = {
        ...mockApiResponse,
        rewards: {
          ...mockApiResponse.rewards,
          last_payout_at: null,
        },
      };
      const result = GetUserOverviewResponseSchema.safeParse(responseWithNullPayout);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime format', () => {
      const invalidResponse = {
        ...mockApiResponse,
        updated_at: 'not-a-date',
      };
      const result = GetUserOverviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should validate worker counts are non-negative integers', () => {
      const invalidResponse = {
        ...mockApiResponse,
        workers: {
          active: -5,
          inactive: 3,
          total: 45,
        },
      };
      const result = GetUserOverviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      // Import after mocks are set up
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');

      const mockClient = {
        getUserOverview: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserOverviewTool.handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      expect(text).toContain('test_user');
      expect(text).toContain('120.00 TH/s');
      expect(text).toContain('0.01234567');
      expect(text).toContain('42'); // active workers
    });

    it('should return error on API failure', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getUserOverview: vi
          .fn()
          .mockRejectedValue(new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserOverviewTool.handler({});

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
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getUserOverview: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getUserOverviewTool.handler({});

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
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');
      expect(getUserOverviewTool.name).toBe('getUserOverview');
    });

    it('should have description', async () => {
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');
      expect(getUserOverviewTool.description).toBeTruthy();
      expect(getUserOverviewTool.description.length).toBeGreaterThan(20);
    });

    it('should have empty input schema (no required params)', async () => {
      const { getUserOverviewTool } = await import('../../../src/tools/getUserOverview.js');
      expect(getUserOverviewTool.inputSchema.type).toBe('object');
      expect(getUserOverviewTool.inputSchema.required).toEqual([]);
    });
  });
});
