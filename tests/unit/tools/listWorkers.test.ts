/**
 * Unit tests for listWorkers tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ListWorkersInputSchema, toApiParams } from '../../../src/schemas/listWorkersInput.js';
import {
  ListWorkersResponseSchema,
  WorkerSchema,
} from '../../../src/schemas/listWorkersResponse.js';

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

describe('listWorkers', () => {
  // Sample worker for testing
  const mockWorker = {
    id: 'worker-001',
    name: 'antminer-s19-rack1',
    status: 'active' as const,
    hashrate: {
      current: 110000000000000, // 110 TH/s
      avg_24h: 105000000000000, // 105 TH/s
    },
    shares: {
      valid: 1234567,
      invalid: 12,
    },
    last_share_at: '2025-01-10T12:30:00Z',
  };

  // Sample API response
  const mockApiResponse = {
    page: 1,
    page_size: 50,
    total: 3,
    workers: [
      mockWorker,
      {
        ...mockWorker,
        id: 'worker-002',
        name: 'antminer-s19-rack2',
        status: 'inactive' as const,
        hashrate: { current: 0, avg_24h: 0 },
        last_share_at: '2025-01-09T08:00:00Z',
      },
      {
        ...mockWorker,
        id: 'worker-003',
        name: 'whatsminer-m30s',
        status: 'disabled' as const,
        hashrate: { current: 0, avg_24h: 0 },
        last_share_at: null,
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
    it('should apply default values for empty object', () => {
      const result = ListWorkersInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(50);
        expect(result.data.status).toBe('all');
        expect(result.data.search).toBeUndefined();
        expect(result.data.sortBy).toBeUndefined();
      }
    });

    it('should accept valid pagination params', () => {
      const result = ListWorkersInputSchema.safeParse({
        page: 5,
        pageSize: 100,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.pageSize).toBe(100);
      }
    });

    it('should reject page less than 1', () => {
      const result = ListWorkersInputSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject pageSize greater than 200', () => {
      const result = ListWorkersInputSchema.safeParse({ pageSize: 201 });
      expect(result.success).toBe(false);
    });

    it('should reject pageSize less than 1', () => {
      const result = ListWorkersInputSchema.safeParse({ pageSize: 0 });
      expect(result.success).toBe(false);
    });

    it('should accept valid status filter', () => {
      const activeResult = ListWorkersInputSchema.safeParse({ status: 'active' });
      expect(activeResult.success).toBe(true);

      const inactiveResult = ListWorkersInputSchema.safeParse({ status: 'inactive' });
      expect(inactiveResult.success).toBe(true);

      const allResult = ListWorkersInputSchema.safeParse({ status: 'all' });
      expect(allResult.success).toBe(true);
    });

    it('should reject invalid status filter', () => {
      const result = ListWorkersInputSchema.safeParse({ status: 'unknown' });
      expect(result.success).toBe(false);
    });

    it('should accept search string', () => {
      const result = ListWorkersInputSchema.safeParse({ search: 'antminer' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe('antminer');
      }
    });

    it('should reject search string over 100 characters', () => {
      const result = ListWorkersInputSchema.safeParse({
        search: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid sort options', () => {
      const sortOptions = ['hashrate_desc', 'hashrate_asc', 'name_asc', 'name_desc', 'last_share'];

      for (const sortBy of sortOptions) {
        const result = ListWorkersInputSchema.safeParse({ sortBy });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sort option', () => {
      const result = ListWorkersInputSchema.safeParse({ sortBy: 'invalid_sort' });
      expect(result.success).toBe(false);
    });
  });

  describe('toApiParams', () => {
    it('should transform defaults correctly', () => {
      const input = ListWorkersInputSchema.parse({});
      const params = toApiParams(input);

      expect(params).toEqual({
        page: 1,
        page_size: 50,
      });
    });

    it('should include status when not "all"', () => {
      const input = ListWorkersInputSchema.parse({ status: 'active' });
      const params = toApiParams(input);

      expect(params.status).toBe('active');
    });

    it('should exclude status when "all"', () => {
      const input = ListWorkersInputSchema.parse({ status: 'all' });
      const params = toApiParams(input);

      expect(params.status).toBeUndefined();
    });

    it('should include search when provided', () => {
      const input = ListWorkersInputSchema.parse({ search: 'antminer' });
      const params = toApiParams(input);

      expect(params.search).toBe('antminer');
    });

    it('should not include empty search', () => {
      const input = ListWorkersInputSchema.parse({ search: '' });
      const params = toApiParams(input);

      expect(params.search).toBeUndefined();
    });

    it('should transform sortBy to sort_by', () => {
      const input = ListWorkersInputSchema.parse({ sortBy: 'hashrate_desc' });
      const params = toApiParams(input);

      expect(params.sort_by).toBe('hashrate_desc');
    });

    it('should transform pageSize to page_size', () => {
      const input = ListWorkersInputSchema.parse({ pageSize: 100 });
      const params = toApiParams(input);

      expect(params.page_size).toBe(100);
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = ListWorkersResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(3);
        expect(result.data.workers).toHaveLength(3);
      }
    });

    it('should validate empty workers array', () => {
      const emptyResponse = {
        page: 1,
        page_size: 50,
        total: 0,
        workers: [],
      };
      const result = ListWorkersResponseSchema.safeParse(emptyResponse);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidResponse = {
        page: 1,
        total: 3,
        // missing page_size and workers
      };
      const result = ListWorkersResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative total', () => {
      const invalidResponse = {
        ...mockApiResponse,
        total: -1,
      };
      const result = ListWorkersResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('Worker Schema', () => {
    it('should validate valid worker', () => {
      const result = WorkerSchema.safeParse(mockWorker);
      expect(result.success).toBe(true);
    });

    it('should validate worker with optional fields', () => {
      const workerWithOptionals = {
        ...mockWorker,
        location: 'datacenter-1',
        tags: ['production', 's19'],
      };
      const result = WorkerSchema.safeParse(workerWithOptionals);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBe('datacenter-1');
        expect(result.data.tags).toEqual(['production', 's19']);
      }
    });

    it('should accept null for last_share_at', () => {
      const workerNeverShared = {
        ...mockWorker,
        last_share_at: null,
      };
      const result = WorkerSchema.safeParse(workerNeverShared);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidWorker = {
        ...mockWorker,
        status: 'unknown',
      };
      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });

    it('should reject negative hashrate', () => {
      const invalidWorker = {
        ...mockWorker,
        hashrate: {
          current: -100,
          avg_24h: 105000000000000,
        },
      };
      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });

    it('should reject negative share counts', () => {
      const invalidWorker = {
        ...mockWorker,
        shares: {
          valid: -1,
          invalid: 12,
        },
      };
      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const invalidWorker = {
        ...mockWorker,
        last_share_at: 'not-a-date',
      };
      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });

    it('should reject empty worker id', () => {
      const invalidWorker = {
        ...mockWorker,
        id: '',
      };
      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');

      const mockClient = {
        listWorkers: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await listWorkersTool.handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      // Check header and format
      expect(text).toContain('Workers (Page 1');
      expect(text).toContain('Total workers');
      expect(text).toContain('antminer-s19-rack1');
      // Check status emoji formatting
      expect(text).toContain('🟢 active');
      expect(text).toContain('🔴 inactive');
      expect(text).toContain('⚫ disabled');
    });

    it('should handle pagination parameters', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');

      const mockClient = {
        listWorkers: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          page: 2,
          total: 150,
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await listWorkersTool.handler({ page: 2, pageSize: 50 });

      expect(mockClient.listWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          page_size: 50,
        })
      );

      const text = result.content[0].text;
      expect(text).toContain('Page 2');
    });

    it('should pass filters to API', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');

      const mockClient = {
        listWorkers: vi.fn().mockResolvedValue({
          ...mockApiResponse,
          workers: [mockWorker],
          total: 1,
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      await listWorkersTool.handler({
        status: 'active',
        search: 'antminer',
        sortBy: 'hashrate_desc',
      });

      expect(mockClient.listWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          search: 'antminer',
          sort_by: 'hashrate_desc',
        })
      );
    });

    it('should format empty results appropriately', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');

      const mockClient = {
        listWorkers: vi.fn().mockResolvedValue({
          page: 1,
          page_size: 50,
          total: 0,
          workers: [],
        }),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await listWorkersTool.handler({});

      const text = result.content[0].text;
      expect(text).toContain('No workers found');
    });

    it('should return error on API failure', async () => {
      const { getCachedBraiinsClient } = await import('../../../src/api/cachedBraiinsClient.js');
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        listWorkers: vi
          .fn()
          .mockRejectedValue(new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await listWorkersTool.handler({});

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
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        listWorkers: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getCachedBraiinsClient).mockReturnValue(mockClient as never);

      const result = await listWorkersTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.code).toBe('NETWORK_ERROR');
    });

    it('should return error for invalid input', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');

      const result = await listWorkersTool.handler({ page: -1 });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(String(result.content[0].text)) as {
        error: boolean;
        code: string;
      };
      expect(errorData.error).toBe(true);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      expect(listWorkersTool.name).toBe('listWorkers');
    });

    it('should have description', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      expect(listWorkersTool.description).toBeTruthy();
      expect(listWorkersTool.description.length).toBeGreaterThan(20);
    });

    it('should define page property in schema', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      expect(listWorkersTool.inputSchema.properties).toHaveProperty('page');
    });

    it('should define pageSize property in schema', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      expect(listWorkersTool.inputSchema.properties).toHaveProperty('pageSize');
    });

    it('should define status property with enum', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      const statusProp = (listWorkersTool.inputSchema.properties as Record<string, unknown>).status;
      expect(statusProp).toHaveProperty('enum');
    });

    it('should have no required params', async () => {
      const { listWorkersTool } = await import('../../../src/tools/listWorkers.js');
      expect(listWorkersTool.inputSchema.required).toEqual([]);
    });
  });
});
