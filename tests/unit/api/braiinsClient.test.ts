/**
 * Unit tests for Braiins API Client
 *
 * Tests HTTP client behavior including:
 * - Authentication header handling
 * - Retry logic with exponential backoff
 * - Error transformation (4xx, 5xx, network errors)
 * - All API endpoint methods
 * - Singleton pattern
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Mock config
vi.mock('../../../src/config/settings.js', () => ({
  config: {
    nodeEnv: 'test',
    braiinsApiBaseUrl: 'https://pool.braiins.com/api/v1',
    braiinsApiToken: 'test-api-token',
    requestTimeout: 30000,
    maxRetries: 3,
    retryBaseDelay: 100, // Fast retries for tests
    logLevel: 'error',
    logFormat: 'json',
  },
}));

// Mock logger to suppress output during tests
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BraiinsClient', () => {
  let mockAxiosCreate: ReturnType<typeof vi.fn>;
  let mockAxiosInstance: {
    get: ReturnType<typeof vi.fn>;
    interceptors: {
      request: { use: ReturnType<typeof vi.fn> };
      response: { use: ReturnType<typeof vi.fn> };
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset module cache to get fresh instances
    vi.resetModules();

    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };
    mockAxiosCreate = vi.mocked(axios.create);
    mockAxiosCreate.mockReturnValue(mockAxiosInstance as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create axios instance with correct base configuration', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      new BraiinsClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://pool.braiins.com/api/v1',
          timeout: 30000,
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include Authorization header when token is present', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      new BraiinsClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-token',
          }),
        })
      );
    });

    it('should register request interceptor for logging', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      new BraiinsClient();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should register response interceptor for logging', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      new BraiinsClient();

      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Constructor without token', () => {
    beforeEach(() => {
      vi.doMock('../../../src/config/settings.js', () => ({
        config: {
          nodeEnv: 'test',
          braiinsApiBaseUrl: 'https://pool.braiins.com/api/v1',
          braiinsApiToken: '', // Empty token
          requestTimeout: 30000,
          maxRetries: 3,
          retryBaseDelay: 100,
          logLevel: 'error',
          logFormat: 'json',
        },
      }));
    });

    it('should not include Authorization header when token is empty', async () => {
      vi.resetModules();
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      new BraiinsClient();

      const createCall = mockAxiosCreate.mock.calls[0][0];
      expect(createCall.headers.Authorization).toBeUndefined();
    });
  });

  describe('API Methods', () => {
    it('should call getUserOverview endpoint', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { username: 'test_user' } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getUserOverview();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/overview');
      expect(result).toEqual({ username: 'test_user' });
    });

    it('should call listWorkers endpoint with params', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { workers: [], total: 0 } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const params = { page: 1, page_size: 50, status: 'active' };
      const result = await client.listWorkers(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workers', { params });
      expect(result).toEqual({ workers: [], total: 0 });
    });

    it('should call getWorkerDetails endpoint with encoded workerId', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { id: 'worker-001', name: 'Test Worker' } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getWorkerDetails('worker/special');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workers/worker%2Fspecial');
      expect(result).toEqual({ id: 'worker-001', name: 'Test Worker' });
    });

    it('should call getWorkerHashrate endpoint with workerId and params', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { points: [] } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const params = { from: '2025-01-01T00:00:00Z', granularity: 'hour' };
      const result = await client.getWorkerHashrate('worker-001', params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workers/worker-001/hashrate', {
        params,
      });
      expect(result).toEqual({ points: [] });
    });

    it('should call getUserRewards endpoint with params', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { rewards: [] } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const params = { granularity: 'day' };
      const result = await client.getUserRewards(params);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/rewards', { params });
      expect(result).toEqual({ rewards: [] });
    });

    it('should call getPoolStats endpoint', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { coin: 'BTC', pool_hashrate: 500000000000000000000 } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getPoolStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/pool/stats');
      expect(result).toEqual({ coin: 'BTC', pool_hashrate: 500000000000000000000 });
    });

    it('should call getNetworkStats endpoint', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const mockResponse = { data: { coin: 'BTC', difficulty: 90000000000000 } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.getNetworkStats();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/network/stats');
      expect(result).toEqual({ coin: 'BTC', difficulty: 90000000000000 });
    });
  });

  describe('Retry Logic', () => {
    it('should not retry on 4xx errors', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(401, 'Unauthorized');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.getUserOverview()).rejects.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on 5xx errors up to maxRetries', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(500, 'Internal Server Error');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      // Attach error handler immediately to prevent unhandled rejection
      let caughtError: unknown;
      const promise = client.getUserOverview().catch((e) => {
        caughtError = e;
      });

      // Fast-forward through all retries
      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(BraiinsApiError);
      // Initial call + 3 retries = 4 calls
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);
    });

    it('should succeed after retry if subsequent request succeeds', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(503, 'Service Unavailable');
      const successResponse = { data: { username: 'test_user' } };

      mockAxiosInstance.get
        .mockRejectedValueOnce(axiosError)
        .mockRejectedValueOnce(axiosError)
        .mockResolvedValueOnce(successResponse);

      const promise = client.getUserOverview();

      // Fast-forward through retries
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toEqual({ username: 'test_user' });
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delay', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(500, 'Internal Server Error');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      // Start the request and attach error handler immediately to prevent unhandled rejection
      let caughtError: unknown;
      const promise = client.getUserOverview().catch((e) => {
        caughtError = e;
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      // Second retry after 200ms (100 * 2^1)
      await vi.advanceTimersByTimeAsync(200);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);

      // Third retry after 400ms (100 * 2^2)
      await vi.advanceTimersByTimeAsync(400);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(4);

      // Wait for promise to fully settle
      await promise;
      expect(caughtError).toBeInstanceOf(BraiinsApiError);
    });
  });

  describe('Error Handling', () => {
    it('should transform 401 error to UNAUTHORIZED', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(401, 'Unauthorized');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await client.getUserOverview();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BraiinsApiError);
        expect((error as BraiinsApiError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should transform 403 error to FORBIDDEN', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(403, 'Forbidden');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await client.getUserOverview();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BraiinsApiError);
        expect((error as BraiinsApiError).code).toBe('FORBIDDEN');
      }
    });

    it('should transform 404 error to NOT_FOUND', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(404, 'Not Found');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await client.getWorkerDetails('nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BraiinsApiError);
        expect((error as BraiinsApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should transform 429 error to RATE_LIMITED', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(429, 'Too Many Requests');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await client.getUserOverview();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BraiinsApiError);
        expect((error as BraiinsApiError).code).toBe('RATE_LIMITED');
      }
    });

    it('should transform network error (ECONNREFUSED) to NetworkError', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const networkError = createNetworkError('ECONNREFUSED');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      // Attach error handler immediately to prevent unhandled rejection
      let caughtError: unknown;
      const promise = client.getUserOverview().catch((e) => {
        caughtError = e;
      });

      // Run timers for retry attempts
      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(NetworkError);
      expect((caughtError as NetworkError).code).toBe('NETWORK_ERROR');
    });

    it('should transform network error (ENOTFOUND) to NetworkError', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { NetworkError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const networkError = createNetworkError('ENOTFOUND');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      // Attach error handler immediately to prevent unhandled rejection
      let caughtError: unknown;
      const promise = client.getUserOverview().catch((e) => {
        caughtError = e;
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(caughtError).toBeInstanceOf(NetworkError);
      expect((caughtError as NetworkError).code).toBe('NETWORK_ERROR');
    });

    it('should include API error message in transformed error', async () => {
      const { BraiinsClient } = await import('../../../src/api/braiinsClient.js');
      const { BraiinsApiError } = await import('../../../src/utils/errors.js');
      const client = new BraiinsClient();

      const axiosError = createAxiosError(400, 'Bad Request', {
        message: 'Invalid page parameter',
      });
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      try {
        await client.listWorkers({ page: -1 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BraiinsApiError);
        expect((error as BraiinsApiError).message).toBe('Invalid page parameter');
      }
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple getBraiinsClient calls', async () => {
      const { getBraiinsClient, resetBraiinsClient } =
        await import('../../../src/api/braiinsClient.js');

      resetBraiinsClient(); // Ensure clean state

      const instance1 = getBraiinsClient();
      const instance2 = getBraiinsClient();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after resetBraiinsClient', async () => {
      const { getBraiinsClient, resetBraiinsClient } =
        await import('../../../src/api/braiinsClient.js');

      const instance1 = getBraiinsClient();
      resetBraiinsClient();
      const instance2 = getBraiinsClient();

      expect(instance1).not.toBe(instance2);
    });
  });
});

// Helper functions to create mock errors
function createAxiosError(
  status: number,
  statusText: string,
  data?: Record<string, unknown>
): AxiosError {
  const error = new Error(statusText) as AxiosError;
  error.isAxiosError = true;
  error.response = {
    status,
    statusText,
    data: data ?? {},
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  } as AxiosResponse;
  error.config = { url: '/test' } as InternalAxiosRequestConfig;
  return error;
}

function createNetworkError(code: string): AxiosError {
  const error = new Error(`Network error: ${code}`) as AxiosError;
  error.isAxiosError = true;
  error.code = code;
  error.config = { url: '/test' } as InternalAxiosRequestConfig;
  // No response for network errors
  error.response = undefined;
  return error;
}
