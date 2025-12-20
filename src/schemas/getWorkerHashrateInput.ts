/**
 * Input schema for getWorkerHashrate tool
 *
 * Validates path parameter (workerId) and optional query parameters
 * for time range and granularity.
 *
 * @see API.md Section 6.3
 */

import { z } from 'zod';

/**
 * Granularity options for timeseries data
 */
export const GranularityEnum = z.enum(['minute', 'hour', 'day']);
export type Granularity = z.infer<typeof GranularityEnum>;

/**
 * Input schema for getWorkerHashrate tool
 *
 * workerId is required; time range and granularity are optional.
 */
export const GetWorkerHashrateInputSchema = z
  .object({
    workerId: z
      .string()
      .min(1, 'Worker ID is required')
      .max(100, 'Worker ID is too long')
      .describe('Unique worker identifier'),

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

    granularity: GranularityEnum.optional().describe(
      'Data point granularity: minute, hour, or day'
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
export type GetWorkerHashrateInput = z.infer<typeof GetWorkerHashrateInputSchema>;

/**
 * Transform MCP input to API params (snake_case not needed here,
 * but we filter out undefined values)
 */
export function toApiParams(
  input: GetWorkerHashrateInput
): Record<string, string> {
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
