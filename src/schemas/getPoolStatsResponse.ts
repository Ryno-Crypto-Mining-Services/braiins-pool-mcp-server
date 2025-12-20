/**
 * Response schema for getPoolStats tool
 *
 * Validates response from GET /pool/stats endpoint.
 * Contains global pool statistics including hashrate, blocks, and luck.
 *
 * @see API.md Section 7.1
 */

import { z } from 'zod';

/**
 * Last block found by the pool
 */
const LastBlockSchema = z.object({
  height: z.number().int().nonnegative().describe('Block height'),
  found_at: z.string().datetime({ offset: true }).describe('When block was found (ISO 8601)'),
  reward: z.string().describe('Block reward in BTC'),
});

/**
 * Pool luck statistics
 */
const LuckSchema = z.object({
  window_blocks: z
    .number()
    .int()
    .positive()
    .describe('Number of blocks in luck calculation window'),
  value: z.number().describe('Luck value (>1 = lucky, <1 = unlucky)'),
});

/**
 * Complete pool stats response schema
 */
export const GetPoolStatsResponseSchema = z.object({
  coin: z.string().describe('Cryptocurrency (e.g., BTC)'),
  pool_hashrate: z.number().nonnegative().describe('Total pool hashrate in H/s'),
  workers_active: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of active workers across all accounts'),
  last_block: LastBlockSchema.describe('Most recently found block'),
  luck: LuckSchema.describe('Pool luck statistics'),
  updated_at: z.string().datetime({ offset: true }).describe('Last update timestamp'),
});

/**
 * TypeScript type for complete response
 */
export type GetPoolStatsResponse = z.infer<typeof GetPoolStatsResponseSchema>;

/**
 * Type for last block data
 */
export type LastBlock = z.infer<typeof LastBlockSchema>;

/**
 * Type for luck data
 */
export type Luck = z.infer<typeof LuckSchema>;
