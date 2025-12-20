/**
 * Input schema for getNetworkStats tool
 *
 * No parameters required - returns global Bitcoin network statistics.
 *
 * @see API.md Section 7.2
 */

import { z } from 'zod';

/**
 * Input schema for getNetworkStats tool
 *
 * Empty object - no parameters needed.
 */
export const GetNetworkStatsInputSchema = z.object({}).strict();

/**
 * TypeScript type inferred from schema
 */
export type GetNetworkStatsInput = z.infer<typeof GetNetworkStatsInputSchema>;
