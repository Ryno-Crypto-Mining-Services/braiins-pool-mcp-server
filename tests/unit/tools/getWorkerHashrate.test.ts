/**
 * Unit tests for getWorkerHashrate tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  GetWorkerHashrateInputSchema,
  toApiParams,
} from '../../../src/schemas/getWorkerHashrateInput.js';
import { GetWorkerHashrateResponseSchema } from '../../../src/schemas/getWorkerHashrateResponse.js';

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

describe('getWorkerHashrate', () => {
  // Sample valid API response
  const mockApiResponse = {
    worker_id: 'worker-001',
    points: [
      { timestamp: '2025-01-10T12:00:00Z', hashrate: 100000000000000 },
      { timestamp: '2025-01-10T13:00:00Z', hashrate: 105000000000000 },
      { timestamp: '2025-01-10T14:00:00Z', hashrate: 98000000000000 },
      { timestamp: '2025-01-10T15:00:00Z', hashrate: 110000000000000 },
      { timestamp: '2025-01-10T16:00:00Z', hashrate: 108000000000000 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Schema', () => {
    it('should accept valid workerId only', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workerId).toBe('worker-001');
        expect(result.data.from).toBeUndefined();
        expect(result.data.to).toBeUndefined();
        expect(result.data.granularity).toBeUndefined();
      }
    });

    it('should accept valid time range', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid granularity options', () => {
      const granularities = ['minute', 'hour', 'day'];
      for (const granularity of granularities) {
        const result = GetWorkerHashrateInputSchema.safeParse({
          workerId: 'worker-001',
          granularity,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid granularity', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        granularity: 'week',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing workerId', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty workerId', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid from timestamp', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        from: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid to timestamp', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        to: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('should reject when from is after to', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        from: '2025-01-10T00:00:00Z',
        to: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should accept when from equals to minus one second', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-01T00:00:01Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept only from without to', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept only to without from', () => {
      const result = GetWorkerHashrateInputSchema.safeParse({
        workerId: 'worker-001',
        to: '2025-01-10T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('toApiParams', () => {
    it('should return empty object for workerId only', () => {
      const input = GetWorkerHashrateInputSchema.parse({ workerId: 'worker-001' });
      const params = toApiParams(input);
      expect(params).toEqual({});
    });

    it('should include from when provided', () => {
      const input = GetWorkerHashrateInputSchema.parse({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
      });
      const params = toApiParams(input);
      expect(params.from).toBe('2025-01-01T00:00:00Z');
    });

    it('should include to when provided', () => {
      const input = GetWorkerHashrateInputSchema.parse({
        workerId: 'worker-001',
        to: '2025-01-10T00:00:00Z',
      });
      const params = toApiParams(input);
      expect(params.to).toBe('2025-01-10T00:00:00Z');
    });

    it('should include granularity when provided', () => {
      const input = GetWorkerHashrateInputSchema.parse({
        workerId: 'worker-001',
        granularity: 'hour',
      });
      const params = toApiParams(input);
      expect(params.granularity).toBe('hour');
    });

    it('should include all params when all provided', () => {
      const input = GetWorkerHashrateInputSchema.parse({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'day',
      });
      const params = toApiParams(input);
      expect(params).toEqual({
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'day',
      });
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetWorkerHashrateResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.worker_id).toBe('worker-001');
        expect(result.data.points).toHaveLength(5);
      }
    });

    it('should validate empty points array', () => {
      const emptyResponse = {
        worker_id: 'worker-001',
        points: [],
      };
      const result = GetWorkerHashrateResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    it('should reject missing worker_id', () => {
      const invalidResponse = {
        points: mockApiResponse.points,
      };
      const result = GetWorkerHashrateResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject missing points', () => {
      const invalidResponse = {
        worker_id: 'worker-001',
      };
      const result = GetWorkerHashrateResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative hashrate', () => {
      const invalidResponse = {
        worker_id: 'worker-001',
        points: [{ timestamp: '2025-01-10T12:00:00Z', hashrate: -100 }],
      };
      const result = GetWorkerHashrateResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid timestamp in points', () => {
      const invalidResponse = {
        worker_id: 'worker-001',
        points: [{ timestamp: 'not-a-date', hashrate: 100000000000000 }],
      };
      const result = GetWorkerHashrateResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );

      const mockClient = {
        getWorkerHashrate: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerHashrateTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      // Check header
      expect(text).toContain('Hashrate History: worker-001');
      // Check statistics section
      expect(text).toContain('Statistics');
      expect(text).toContain('Latest');
      expect(text).toContain('Average');
      expect(text).toContain('Minimum');
      expect(text).toContain('Maximum');
      // Check trend visualization
      expect(text).toContain('Trend');
      // Check data points
      expect(text).toContain('Recent Data Points');
    });

    it('should pass time range params to API', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );

      const mockClient = {
        getWorkerHashrate: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      await getWorkerHashrateTool.handler({
        workerId: 'worker-001',
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'hour',
      });

      expect(mockClient.getWorkerHashrate).toHaveBeenCalledWith('worker-001', {
        from: '2025-01-01T00:00:00Z',
        to: '2025-01-10T00:00:00Z',
        granularity: 'hour',
      });
    });

    it('should handle empty data points', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );

      const emptyResponse = {
        worker_id: 'worker-001',
        points: [],
      };

      const mockClient = {
        getWorkerHashrate: vi.fn().mockResolvedValue(emptyResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerHashrateTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('No hashrate data available');
    });

    it('should return error for missing workerId', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );

      const result = await getWorkerHashrateTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for invalid time range', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );

      const result = await getWorkerHashrateTool.handler({
        workerId: 'worker-001',
        from: '2025-01-10T00:00:00Z',
        to: '2025-01-01T00:00:00Z',
      });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should return error on API failure', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getWorkerHashrate: vi.fn().mockRejectedValue(
          new BraiinsApiError('Worker not found', ErrorCode.NOT_FOUND, 404)
        ),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerHashrateTool.handler({ workerId: 'nonexistent' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('NOT_FOUND');
    });

    it('should handle network errors gracefully', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getWorkerHashrate: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerHashrateTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      expect(getWorkerHashrateTool.name).toBe('getWorkerHashrate');
    });

    it('should have description', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      expect(getWorkerHashrateTool.description).toBeTruthy();
      expect(getWorkerHashrateTool.description.length).toBeGreaterThan(20);
    });

    it('should require workerId parameter', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      expect(getWorkerHashrateTool.inputSchema.required).toContain('workerId');
    });

    it('should define all input properties', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      const props = getWorkerHashrateTool.inputSchema.properties;
      expect(props).toHaveProperty('workerId');
      expect(props).toHaveProperty('from');
      expect(props).toHaveProperty('to');
      expect(props).toHaveProperty('granularity');
    });

    it('should define granularity enum', async () => {
      const { getWorkerHashrateTool } = await import(
        '../../../src/tools/getWorkerHashrate.js'
      );
      const granularityProp = (
        getWorkerHashrateTool.inputSchema.properties as Record<string, unknown>
      ).granularity;
      expect(granularityProp).toHaveProperty('enum');
    });
  });
});
