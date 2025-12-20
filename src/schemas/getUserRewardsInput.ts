/**
 * Input schema for getUserRewards tool
 *
 * Validates optional query parameters for time range and granularity.
 * Similar to getWorkerHashrate but without path parameter.
 *
 * @see API.md Section 5.2
 */

import { z } from 'zod';

/**
 * Granularity options for rewards timeseries
 * Note: Different from hashrate - no 'minute' option, has 'week'
 */
export const RewardsGranularityEnum = z.enum(['hour', 'day', 'week']);
export type RewardsGranularity = z.infer<typeof RewardsGranularityEnum>;

/**
 * Input schema for getUserRewards tool
 *
 * All parameters are optional - API returns sensible defaults.
 */
export const GetUserRewardsInputSchema = z
  .object({
    from: z
      .string()
      .datetime({ offset: true, message: 'from must be ISO 8601 datetime' })
      .optional()
      .describe('Start timestamp (ISO 8601)'),

    to: z
      .string()
      .datetime({ offset: true, message: 'to must be ISO 8601 datetime' })
      .optional()
      .describe('End timestamp (ISO 8601)'),

    granularity: RewardsGranularityEnum.optional().describe(
      'Data point granularity: hour, day, or week'
    ),
  })
  .refine(
    (data) => {
      // If both from and to are provided, from must be before to
      if (data.from && data.to) {
        return new Date(data.from).getTime() < new Date(data.to).getTime();
      }
      return true;
    },
    {
      message: 'from timestamp must be before to timestamp',
      path: ['from'],
    }
  );

/**
 * TypeScript type inferred from schema
 */
export type GetUserRewardsInput = z.infer<typeof GetUserRewardsInputSchema>;

/**
 * Transform MCP input to API params
 */
export function toApiParams(input: GetUserRewardsInput): Record<string, string> {
  const params: Record<string, string> = {};

  if (input.from) {
    params.from = input.from;
  }

  if (input.to) {
    params.to = input.to;
  }

  if (input.granularity) {
    params.granularity = input.granularity;
  }

  return params;
}
