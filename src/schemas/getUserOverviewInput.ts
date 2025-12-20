/**
 * Input schema for getUserOverview tool
 *
 * The /user/overview endpoint requires no parameters - it returns
 * data for the authenticated user based on the API token.
 */

import { z } from 'zod';

/**
 * Input schema - this endpoint has no parameters
 * The empty object schema validates that no unexpected params are passed
 */
export const GetUserOverviewInputSchema = z
  .object({})
  .strict()
  .describe('No input parameters required - uses authenticated user context');

/**
 * TypeScript type inferred from schema
 */
export type GetUserOverviewInput = z.infer<typeof GetUserOverviewInputSchema>;
