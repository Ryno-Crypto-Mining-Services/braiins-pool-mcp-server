/**
 * Input schema for getPoolStats tool
 *
 * No parameters required - returns global pool statistics.
 *
 * @see API.md Section 7.1
 */

import { z } from 'zod';

/**
 * Input schema for getPoolStats tool
 *
 * Empty object - no parameters needed.
 */
export const GetPoolStatsInputSchema = z.object({}).strict();

/**
 * TypeScript type inferred from schema
 */
export type GetPoolStatsInput = z.infer<typeof GetPoolStatsInputSchema>;
