/**
 * Braiins Pool API Client
 *
 * HTTP client for communicating with Braiins Pool monitoring API.
 * Implements retry logic, authentication, and error handling.
 */

import axios, { type AxiosInstance, type AxiosError, type AxiosResponse } from 'axios';
import { config } from '../config/settings.js';
import { logger } from '../utils/logger.js';
import { BraiinsApiError, NetworkError } from '../utils/errors.js';
import type { GetUserOverviewResponse } from '../schemas/getUserOverviewResponse.js';
import type { ListWorkersResponse } from '../schemas/listWorkersResponse.js';

/**
 * Braiins API Client
 *
 * Provides type-safe methods for calling Braiins Pool API endpoints.
 */
export class BraiinsClient {
  private readonly client: AxiosInstance;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;

  constructor() {
    this.maxRetries = config.maxRetries;
    this.retryBaseDelay = config.retryBaseDelay;

    const hasToken = config.braiinsApiToken !== undefined && config.braiinsApiToken !== '';
    this.client = axios.create({
      baseURL: config.braiinsApiBaseUrl,
      timeout: config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...(hasToken && {
          Authorization: `Bearer ${config.braiinsApiToken}`,
        }),
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      logger.debug('API request', {
        method: request.method?.toUpperCase(),
        url: request.url,
      });
      return request;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: AxiosError) => {
        logger.warn('API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute request with exponential backoff retry
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<AxiosResponse<T>>,
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Don't retry client errors (4xx) - these won't succeed on retry
      if (axiosError.response && axiosError.response.status < 500) {
        throw this.handleApiError(axiosError);
      }

      // Check if we have retries left
      if (retryCount >= this.maxRetries) {
        throw this.handleApiError(axiosError);
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s...
      const delay = this.retryBaseDelay * Math.pow(2, retryCount);
      logger.info('Retrying API request', {
        attempt: retryCount + 1,
        maxRetries: this.maxRetries,
        delayMs: delay,
      });

      await this.sleep(delay);
      return this.retryWithBackoff(fn, retryCount + 1);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convert Axios errors to our custom error types
   */
  private handleApiError(error: AxiosError): BraiinsApiError | NetworkError {
    // Network error (no response received)
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || !error.response) {
      return new NetworkError(
        `Cannot connect to Braiins API: ${error.message}`,
        { code: error.code }
      );
    }

    // API returned an error response
    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;
    const message = typeof data?.message === 'string' ? data.message : undefined;

    return BraiinsApiError.fromHttpStatus(status, message, {
      url: error.config?.url,
      data,
    });
  }

  // ============================================================================
  // API Methods
  // ============================================================================

  /**
   * Get user overview
   *
   * Returns high-level summary for the authenticated user including
   * hashrate, rewards, and worker counts.
   *
   * @see API.md Section 5.1
   */
  async getUserOverview(): Promise<GetUserOverviewResponse> {
    return this.retryWithBackoff(() =>
      this.client.get<GetUserOverviewResponse>('/user/overview')
    );
  }

  /**
   * List workers
   *
   * Returns a paginated list of workers for the authenticated account.
   * Supports filtering by status and search, with sorting options.
   *
   * @param params - Query parameters (already in snake_case for API)
   * @see API.md Section 6.1
   */
  async listWorkers(params: Record<string, string | number>): Promise<ListWorkersResponse> {
    return this.retryWithBackoff(() =>
      this.client.get<ListWorkersResponse>('/workers', { params })
    );
  }
}

/**
 * Singleton instance of the Braiins client
 */
let clientInstance: BraiinsClient | null = null;

/**
 * Get the Braiins client instance (lazy initialization)
 */
export function getBraiinsClient(): BraiinsClient {
  if (!clientInstance) {
    clientInstance = new BraiinsClient();
  }
  return clientInstance;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetBraiinsClient(): void {
  clientInstance = null;
}
