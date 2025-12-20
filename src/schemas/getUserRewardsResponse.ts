/**
 * Response schema for getUserRewards tool
 *
 * Validates timeseries response from GET /user/rewards.
 * Amounts are strings to preserve BTC precision.
 *
 * @see API.md Section 5.2
 */

import { z } from 'zod';

/**
 * BTC amount pattern - string with up to 8 decimal places
 */
const BtcAmountSchema = z
  .string()
  .regex(/^\d+\.\d{1,8}$/, 'Invalid BTC amount format')
  .describe('BTC amount as string (e.g., "0.00123456")');

/**
 * Single data point in rewards timeseries
 */
export const RewardsPointSchema = z.object({
  timestamp: z.string().datetime({ offset: true }).describe('Data point timestamp (ISO 8601)'),
  confirmed: BtcAmountSchema.describe('Confirmed rewards for this period'),
  unconfirmed: BtcAmountSchema.describe('Unconfirmed rewards for this period'),
  payout: BtcAmountSchema.describe('Payout amount for this period'),
});

/**
 * Type for single rewards point
 */
export type RewardsPoint = z.infer<typeof RewardsPointSchema>;

/**
 * Complete rewards timeseries response schema
 */
export const GetUserRewardsResponseSchema = z.object({
  currency: z.string().describe('Currency code (e.g., BTC)'),
  points: z.array(RewardsPointSchema).describe('Timeseries data points'),
});

/**
 * TypeScript type for complete response
 */
export type GetUserRewardsResponse = z.infer<typeof GetUserRewardsResponseSchema>;
