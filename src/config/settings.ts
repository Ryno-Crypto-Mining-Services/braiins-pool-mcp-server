/**
 * Configuration management for Braiins Pool MCP Server
 *
 * Loads and validates configuration from environment variables.
 * Uses Zod for type-safe validation with clear error messages.
 */

import { z } from 'zod';

/**
 * Configuration schema with validation rules
 */
const ConfigSchema = z.object({
  // Node environment
  nodeEnv: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Braiins Pool API configuration
  braiinsApiBaseUrl: z
    .string()
    .url('BRAIINS_API_BASE_URL must be a valid URL')
    .default('https://pool.braiins.com/api/v1'),

  braiinsApiToken: z
    .string()
    .min(1, 'BRAIINS_POOL_API_TOKEN is required')
    .optional(),

  // Redis configuration
  redisUrl: z
    .string()
    .url('REDIS_URL must be a valid URL')
    .default('redis://localhost:6379'),

  redisEnabled: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Logging configuration
  logLevel: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  logFormat: z
    .enum(['json', 'pretty'])
    .default('json'),

  // Rate limiting
  rateLimitRequestsPerSecond: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(10))
    .default('1'),

  rateLimitBurstSize: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(20))
    .default('5'),

  // Request timeout (ms)
  requestTimeout: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000).max(60000))
    .default('30000'),

  // Retry configuration
  maxRetries: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0).max(5))
    .default('3'),

  retryBaseDelay: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(100).max(5000))
    .default('1000'),
});

/**
 * Configuration type inferred from schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Validation result type
 */
export interface ConfigValidationResult {
  success: boolean;
  errors?: string[];
}

/**
 * Load configuration from environment variables
 */
function loadConfig(): Config {
  const envConfig = {
    nodeEnv: process.env.NODE_ENV,
    braiinsApiBaseUrl: process.env.BRAIINS_API_BASE_URL,
    braiinsApiToken: process.env.BRAIINS_POOL_API_TOKEN,
    redisUrl: process.env.REDIS_URL,
    redisEnabled: process.env.REDIS_ENABLED,
    logLevel: process.env.LOG_LEVEL,
    logFormat: process.env.LOG_FORMAT,
    rateLimitRequestsPerSecond: process.env.RATE_LIMIT_RPS,
    rateLimitBurstSize: process.env.RATE_LIMIT_BURST,
    requestTimeout: process.env.REQUEST_TIMEOUT,
    maxRetries: process.env.MAX_RETRIES,
    retryBaseDelay: process.env.RETRY_BASE_DELAY,
  };

  const result = ConfigSchema.safeParse(envConfig);

  if (!result.success) {
    // In development, return defaults with warning
    // In production, this will fail validation
    console.warn('Configuration warning:', result.error.flatten().fieldErrors);
    return ConfigSchema.parse({});
  }

  return result.data;
}

/**
 * Validate configuration and return detailed errors
 */
export function validateConfig(): ConfigValidationResult {
  const envConfig = {
    nodeEnv: process.env.NODE_ENV,
    braiinsApiBaseUrl: process.env.BRAIINS_API_BASE_URL,
    braiinsApiToken: process.env.BRAIINS_POOL_API_TOKEN,
    redisUrl: process.env.REDIS_URL,
    redisEnabled: process.env.REDIS_ENABLED,
    logLevel: process.env.LOG_LEVEL,
    logFormat: process.env.LOG_FORMAT,
    rateLimitRequestsPerSecond: process.env.RATE_LIMIT_RPS,
    rateLimitBurstSize: process.env.RATE_LIMIT_BURST,
    requestTimeout: process.env.REQUEST_TIMEOUT,
    maxRetries: process.env.MAX_RETRIES,
    retryBaseDelay: process.env.RETRY_BASE_DELAY,
  };

  const result = ConfigSchema.safeParse(envConfig);

  if (!result.success) {
    const errors = Object.entries(result.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
      .filter(Boolean);

    // In production, API token is required
    const apiToken = process.env.BRAIINS_POOL_API_TOKEN;
    if (process.env.NODE_ENV === 'production' && (apiToken === undefined || apiToken === '')) {
      errors.push('BRAIINS_POOL_API_TOKEN is required in production');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }
  }

  return { success: true };
}

/**
 * Exported configuration instance
 */
export const config = loadConfig();
