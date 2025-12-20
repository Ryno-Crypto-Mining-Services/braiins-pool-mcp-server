/**
 * Response schema for getNetworkStats tool
 *
 * Validates response from GET /network/stats endpoint.
 * Contains Bitcoin network statistics including difficulty,
 * hashrate, and block timing metrics.
 *
 * @see API.md Section 7.2
 */

import { z } from 'zod';

/**
 * Complete network stats response schema
 */
export const GetNetworkStatsResponseSchema = z.object({
  coin: z.string().describe('Cryptocurrency (e.g., BTC)'),
  difficulty: z
    .number()
    .nonnegative()
    .describe('Current network mining difficulty'),
  hashrate_estimate: z
    .number()
    .nonnegative()
    .describe('Estimated network-wide hashrate in H/s'),
  block_time_target: z
    .number()
    .int()
    .positive()
    .describe('Target block time in seconds (600 for BTC)'),
  block_time_avg: z
    .number()
    .positive()
    .describe('Average observed block time in seconds'),
  next_difficulty_change_eta: z
    .string()
    .datetime({ offset: true })
    .describe('Estimated time of next difficulty adjustment (ISO 8601)'),
});

/**
 * TypeScript type for complete response
 */
export type GetNetworkStatsResponse = z.infer<typeof GetNetworkStatsResponseSchema>;
