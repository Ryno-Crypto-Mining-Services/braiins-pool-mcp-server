/**
 * Response schema for getWorkerHashrate tool
 *
 * Validates timeseries response from GET /workers/{workerId}/hashrate.
 *
 * @see API.md Section 6.3
 */

import { z } from 'zod';

/**
 * Single data point in hashrate timeseries
 */
export const HashratePointSchema = z.object({
  timestamp: z.string().datetime({ offset: true }).describe('Data point timestamp (ISO 8601)'),
  hashrate: z.number().nonnegative().describe('Hashrate in H/s at this point'),
});

/**
 * Type for single hashrate point
 */
export type HashratePoint = z.infer<typeof HashratePointSchema>;

/**
 * Complete timeseries response schema
 */
export const GetWorkerHashrateResponseSchema = z.object({
  worker_id: z.string().min(1).describe('Worker identifier'),
  points: z.array(HashratePointSchema).describe('Timeseries data points'),
});

/**
 * TypeScript type for complete response
 */
export type GetWorkerHashrateResponse = z.infer<typeof GetWorkerHashrateResponseSchema>;
