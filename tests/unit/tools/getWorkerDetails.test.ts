/**
 * Unit tests for getWorkerDetails tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetWorkerDetailsInputSchema } from '../../../src/schemas/getWorkerDetailsInput.js';
import { GetWorkerDetailsResponseSchema } from '../../../src/schemas/getWorkerDetailsResponse.js';

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

describe('getWorkerDetails', () => {
  // Sample valid API response
  const mockApiResponse = {
    id: 'worker-001',
    name: 'antminer-s19-rack1',
    status: 'active' as const,
    hashrate: {
      current: 110000000000000, // 110 TH/s
      avg_1h: 108000000000000, // 108 TH/s
      avg_24h: 105000000000000, // 105 TH/s
    },
    shares: {
      valid: 1234567,
      invalid: 123,
      stale: 45,
    },
    hardware: {
      model: 'Antminer S19 Pro',
      firmware: 'braiins-os-plus-23.10',
      power_mode: 'performance',
    },
    environment: {
      temperature: {
        avg: 70.5,
        max: 80.0,
        unit: 'C' as const,
      },
    },
    last_share_at: '2025-01-10T12:30:00Z',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2025-01-10T12:34:56Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Schema', () => {
    it('should accept valid workerId', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({ workerId: 'worker-001' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.workerId).toBe('worker-001');
      }
    });

    it('should reject empty workerId', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({ workerId: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing workerId', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject workerId over 100 characters', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({
        workerId: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept workerId with special characters', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({
        workerId: 'farm1-rack2-s19_pro.01',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-string workerId', () => {
      const result = GetWorkerDetailsInputSchema.safeParse({ workerId: 12345 });
      expect(result.success).toBe(false);
    });
  });

  describe('Response Schema', () => {
    it('should validate valid API response', () => {
      const result = GetWorkerDetailsResponseSchema.safeParse(mockApiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('worker-001');
        expect(result.data.name).toBe('antminer-s19-rack1');
        expect(result.data.hashrate.avg_1h).toBe(108000000000000);
      }
    });

    it('should validate response without optional hardware', () => {
      const responseNoHardware = {
        ...mockApiResponse,
        hardware: undefined,
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(responseNoHardware);
      expect(result.success).toBe(true);
    });

    it('should validate response without optional environment', () => {
      const responseNoEnv = {
        ...mockApiResponse,
        environment: undefined,
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(responseNoEnv);
      expect(result.success).toBe(true);
    });

    it('should validate response with null last_share_at', () => {
      const responseNeverShared = {
        ...mockApiResponse,
        last_share_at: null,
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(responseNeverShared);
      expect(result.success).toBe(true);
    });

    it('should reject response missing required fields', () => {
      const invalidResponse = {
        id: 'worker-001',
        name: 'antminer-s19-rack1',
        // missing status, hashrate, shares, etc.
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid status value', () => {
      const invalidResponse = {
        ...mockApiResponse,
        status: 'running', // not a valid enum value
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative hashrate values', () => {
      const invalidResponse = {
        ...mockApiResponse,
        hashrate: {
          current: -100,
          avg_1h: 108000000000000,
          avg_24h: 105000000000000,
        },
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative share counts', () => {
      const invalidResponse = {
        ...mockApiResponse,
        shares: {
          valid: -1,
          invalid: 123,
          stale: 45,
        },
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const invalidResponse = {
        ...mockApiResponse,
        created_at: 'not-a-date',
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should validate hardware without power_mode', () => {
      const responseNoPowerMode = {
        ...mockApiResponse,
        hardware: {
          model: 'Antminer S19 Pro',
          firmware: 'braiins-os-plus-23.10',
          // no power_mode
        },
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(responseNoPowerMode);
      expect(result.success).toBe(true);
    });

    it('should accept F as temperature unit', () => {
      const responseFahrenheit = {
        ...mockApiResponse,
        environment: {
          temperature: {
            avg: 158.9,
            max: 176.0,
            unit: 'F' as const,
          },
        },
      };
      const result = GetWorkerDetailsResponseSchema.safeParse(responseFahrenheit);
      expect(result.success).toBe(true);
    });
  });

  describe('Tool Handler', () => {
    it('should return formatted response on success', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');

      const mockClient = {
        getWorkerDetails: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerDetailsTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const text = result.content[0].text;
      // Check header and formatting
      expect(text).toContain('Worker: antminer-s19-rack1');
      expect(text).toContain('worker-001');
      expect(text).toContain('🟢 Active');
      // Check hashrate section
      expect(text).toContain('110.00 TH/s');
      expect(text).toContain('1h Average');
      expect(text).toContain('24h Average');
      // Check shares section
      expect(text).toContain('1,234,567');
      expect(text).toContain('Rejection Rate');
      // Check hardware section
      expect(text).toContain('Antminer S19 Pro');
      expect(text).toContain('braiins-os-plus-23.10');
      expect(text).toContain('performance');
      // Check environment section
      expect(text).toContain('Temperature');
      expect(text).toContain('70.5');
    });

    it('should pass workerId to API client', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');

      const mockClient = {
        getWorkerDetails: vi.fn().mockResolvedValue(mockApiResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      await getWorkerDetailsTool.handler({ workerId: 'my-worker-123' });

      expect(mockClient.getWorkerDetails).toHaveBeenCalledWith('my-worker-123');
    });

    it('should handle response without optional fields', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');

      const minimalResponse = {
        id: 'worker-001',
        name: 'basic-worker',
        status: 'inactive' as const,
        hashrate: { current: 0, avg_1h: 0, avg_24h: 0 },
        shares: { valid: 0, invalid: 0, stale: 0 },
        last_share_at: null,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2025-01-10T12:34:56Z',
      };

      const mockClient = {
        getWorkerDetails: vi.fn().mockResolvedValue(minimalResponse),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerDetailsTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBeUndefined();
      const text = result.content[0].text;
      expect(text).toContain('🔴 Inactive');
      expect(text).toContain('Never'); // last_share_at is null
      expect(text).not.toContain('Hardware');
      expect(text).not.toContain('Temperature');
    });

    it('should return error for missing workerId', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');

      const result = await getWorkerDetailsTool.handler({});

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe(true);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should return error for empty workerId', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');

      const result = await getWorkerDetailsTool.handler({ workerId: '' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('VALIDATION_ERROR');
    });

    it('should return error on API failure', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getWorkerDetails: vi.fn().mockRejectedValue(
          new BraiinsApiError('Worker not found', ErrorCode.NOT_FOUND, 404)
        ),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerDetailsTool.handler({ workerId: 'nonexistent' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.error).toBe(true);
      expect(errorData.code).toBe('NOT_FOUND');
    });

    it('should return error on unauthorized', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      const { BraiinsApiError, ErrorCode } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getWorkerDetails: vi.fn().mockRejectedValue(
          new BraiinsApiError('Unauthorized', ErrorCode.UNAUTHORIZED, 401)
        ),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerDetailsTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('UNAUTHORIZED');
    });

    it('should handle network errors gracefully', async () => {
      const { getBraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');

      const mockClient = {
        getWorkerDetails: vi.fn().mockRejectedValue(new NetworkError('Connection refused')),
      };
      vi.mocked(getBraiinsClient).mockReturnValue(mockClient as never);

      const result = await getWorkerDetailsTool.handler({ workerId: 'worker-001' });

      expect(result.isError).toBe(true);
      const errorData = JSON.parse(result.content[0].text);
      expect(errorData.code).toBe('NETWORK_ERROR');
    });
  });

  describe('Tool Definition', () => {
    it('should have correct name', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      expect(getWorkerDetailsTool.name).toBe('getWorkerDetails');
    });

    it('should have description', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      expect(getWorkerDetailsTool.description).toBeTruthy();
      expect(getWorkerDetailsTool.description.length).toBeGreaterThan(20);
    });

    it('should require workerId parameter', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      expect(getWorkerDetailsTool.inputSchema.required).toContain('workerId');
    });

    it('should define workerId property in schema', async () => {
      const { getWorkerDetailsTool } = await import('../../../src/tools/getWorkerDetails.js');
      expect(getWorkerDetailsTool.inputSchema.properties).toHaveProperty('workerId');
    });
  });
});
