/**
 * Response schema for listWorkers tool
 *
 * Validates the paginated API response from GET /workers endpoint.
 * Based on API.md Section 6.1 specification.
 */

import { z } from 'zod';

/**
 * Worker hashrate schema (simplified for list view)
 */
const WorkerHashrateSchema = z.object({
  current: z.number().nonnegative().describe('Current hashrate in H/s'),
  avg_24h: z.number().nonnegative().describe('24-hour average hashrate in H/s'),
});

/**
 * Worker shares schema
 */
const WorkerSharesSchema = z.object({
  valid: z.number().int().nonnegative().describe('Valid shares count'),
  invalid: z.number().int().nonnegative().describe('Invalid/rejected shares count'),
});

/**
 * Individual worker in list response
 */
export const WorkerSchema = z.object({
  id: z.string().min(1).describe('Unique worker identifier'),
  name: z.string().describe('Worker name/label'),
  status: z.enum(['active', 'inactive', 'disabled']).describe('Worker status'),
  hashrate: WorkerHashrateSchema.describe('Hashrate metrics'),
  shares: WorkerSharesSchema.describe('Share statistics'),
  last_share_at: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .describe('Last share timestamp (ISO 8601)'),
  location: z.string().optional().describe('Worker location/farm'),
  tags: z.array(z.string()).optional().describe('Worker tags/labels'),
});

/**
 * TypeScript type for individual worker
 */
export type Worker = z.infer<typeof WorkerSchema>;

/**
 * Paginated list response schema
 */
export const ListWorkersResponseSchema = z.object({
  page: z.number().int().min(1).describe('Current page number'),
  page_size: z.number().int().min(1).describe('Items per page'),
  total: z.number().int().nonnegative().describe('Total worker count'),
  workers: z.array(WorkerSchema).describe('Worker list for this page'),
});

/**
 * TypeScript type for complete response
 */
export type ListWorkersResponse = z.infer<typeof ListWorkersResponseSchema>;

/**
 * Type for hashrate data
 */
export type WorkerHashrate = z.infer<typeof WorkerHashrateSchema>;

/**
 * Type for shares data
 */
export type WorkerShares = z.infer<typeof WorkerSharesSchema>;
