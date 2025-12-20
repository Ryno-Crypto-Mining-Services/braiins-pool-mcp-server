/**
 * Input schema for getWorkerDetails tool
 *
 * Validates the required workerId path parameter.
 *
 * @see API.md Section 6.2
 */

import { z } from 'zod';

/**
 * Input schema for getWorkerDetails tool
 *
 * Requires workerId - the unique identifier for the worker to retrieve.
 */
export const GetWorkerDetailsInputSchema = z.object({
  workerId: z
    .string()
    .min(1, 'Worker ID is required')
    .max(100, 'Worker ID is too long')
    .describe('Unique worker identifier'),
});

/**
 * TypeScript type inferred from schema
 */
export type GetWorkerDetailsInput = z.infer<typeof GetWorkerDetailsInputSchema>;
