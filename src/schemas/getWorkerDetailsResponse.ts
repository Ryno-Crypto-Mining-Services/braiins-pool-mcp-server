/**
 * Response schema for getWorkerDetails tool
 *
 * Validates the detailed worker response from GET /workers/{workerId}.
 * Includes extended data not available in list view: hardware, environment, stale shares.
 *
 * @see API.md Section 6.2
 */

import { z } from 'zod';

/**
 * Extended hashrate schema (includes 1h average)
 */
const WorkerHashrateDetailSchema = z.object({
  current: z.number().nonnegative().describe('Current hashrate in H/s'),
  avg_1h: z.number().nonnegative().describe('1-hour average hashrate in H/s'),
  avg_24h: z.number().nonnegative().describe('24-hour average hashrate in H/s'),
});

/**
 * Extended shares schema (includes stale)
 */
const WorkerSharesDetailSchema = z.object({
  valid: z.number().int().nonnegative().describe('Valid shares count'),
  invalid: z.number().int().nonnegative().describe('Invalid/rejected shares count'),
  stale: z.number().int().nonnegative().describe('Stale shares count'),
});

/**
 * Hardware information schema
 */
const WorkerHardwareSchema = z.object({
  model: z.string().describe('Hardware model (e.g., Antminer S19 Pro)'),
  firmware: z.string().describe('Firmware version'),
  power_mode: z.string().optional().describe('Power mode (e.g., performance, balanced)'),
});

/**
 * Temperature schema
 */
const TemperatureSchema = z.object({
  avg: z.number().describe('Average temperature'),
  max: z.number().describe('Maximum temperature'),
  unit: z.enum(['C', 'F']).default('C').describe('Temperature unit'),
});

/**
 * Environment information schema
 */
const WorkerEnvironmentSchema = z.object({
  temperature: TemperatureSchema.describe('Temperature readings'),
});

/**
 * Complete worker details response schema
 */
export const GetWorkerDetailsResponseSchema = z.object({
  id: z.string().min(1).describe('Unique worker identifier'),
  name: z.string().describe('Worker name/label'),
  status: z.enum(['active', 'inactive', 'disabled']).describe('Worker status'),
  hashrate: WorkerHashrateDetailSchema.describe('Hashrate metrics'),
  shares: WorkerSharesDetailSchema.describe('Share statistics'),
  hardware: WorkerHardwareSchema.optional().describe('Hardware information'),
  environment: WorkerEnvironmentSchema.optional().describe('Environment readings'),
  last_share_at: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .describe('Last share timestamp (ISO 8601)'),
  created_at: z
    .string()
    .datetime({ offset: true })
    .describe('Worker creation timestamp'),
  updated_at: z
    .string()
    .datetime({ offset: true })
    .describe('Last update timestamp'),
});

/**
 * TypeScript type for complete response
 */
export type GetWorkerDetailsResponse = z.infer<typeof GetWorkerDetailsResponseSchema>;

/**
 * Type for hashrate detail
 */
export type WorkerHashrateDetail = z.infer<typeof WorkerHashrateDetailSchema>;

/**
 * Type for shares detail
 */
export type WorkerSharesDetail = z.infer<typeof WorkerSharesDetailSchema>;

/**
 * Type for hardware info
 */
export type WorkerHardware = z.infer<typeof WorkerHardwareSchema>;

/**
 * Type for environment info
 */
export type WorkerEnvironment = z.infer<typeof WorkerEnvironmentSchema>;
