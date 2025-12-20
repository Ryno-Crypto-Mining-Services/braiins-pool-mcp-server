/**
 * Response schema for getUserOverview tool
 *
 * Validates the API response from GET /user/overview endpoint.
 * Based on API.md Section 5.1 specification.
 */

import { z } from 'zod';

/**
 * Hashrate metrics schema
 * All values are in H/s (hashes per second)
 */
const HashrateSchema = z.object({
  current: z.number().nonnegative().describe('Current hashrate in H/s'),
  avg_1h: z.number().nonnegative().describe('1-hour average hashrate in H/s'),
  avg_24h: z.number().nonnegative().describe('24-hour average hashrate in H/s'),
});

/**
 * Rewards schema
 * Amounts are strings to preserve decimal precision (BTC values)
 */
const RewardsSchema = z.object({
  confirmed: z.string().describe('Confirmed rewards (BTC)'),
  unconfirmed: z.string().describe('Unconfirmed/pending rewards (BTC)'),
  last_payout: z.string().describe('Last payout amount (BTC)'),
  last_payout_at: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .describe('Last payout timestamp (ISO 8601)'),
});

/**
 * Worker counts schema
 */
const WorkersSchema = z.object({
  active: z.number().int().nonnegative().describe('Number of active workers'),
  inactive: z.number().int().nonnegative().describe('Number of inactive workers'),
  total: z.number().int().nonnegative().describe('Total worker count'),
});

/**
 * Complete user overview response schema
 */
export const GetUserOverviewResponseSchema = z.object({
  username: z.string().min(1).describe('Braiins Pool username'),
  currency: z.string().default('BTC').describe('Currency (typically BTC)'),
  hashrate: HashrateSchema.describe('Hashrate metrics'),
  rewards: RewardsSchema.describe('Reward balances and last payout'),
  workers: WorkersSchema.describe('Worker counts'),
  updated_at: z.string().datetime({ offset: true }).describe('Last update timestamp (ISO 8601)'),
});

/**
 * TypeScript type inferred from schema
 */
export type GetUserOverviewResponse = z.infer<typeof GetUserOverviewResponseSchema>;

/**
 * Type for individual nested objects (useful for formatting)
 */
export type HashrateData = z.infer<typeof HashrateSchema>;
export type RewardsData = z.infer<typeof RewardsSchema>;
export type WorkersData = z.infer<typeof WorkersSchema>;
