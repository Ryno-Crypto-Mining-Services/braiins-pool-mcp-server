/**
 * Input schema for listWorkers tool
 *
 * Supports pagination and filtering options for the GET /workers endpoint.
 * Uses camelCase in MCP interface, transforms to snake_case for API.
 *
 * @see API.md Section 6.1
 */

import { z } from 'zod';

/**
 * Worker status filter options
 */
export const WorkerStatusEnum = z.enum(['active', 'inactive', 'all']);
export type WorkerStatus = z.infer<typeof WorkerStatusEnum>;

/**
 * Sort options for worker list
 */
export const WorkerSortEnum = z.enum(['hashrate_desc', 'hashrate_asc', 'name_asc', 'name_desc', 'last_share']);
export type WorkerSort = z.infer<typeof WorkerSortEnum>;

/**
 * Input schema for listWorkers tool
 *
 * All parameters are optional with sensible defaults.
 */
export const ListWorkersInputSchema = z.object({
  // Pagination
  page: z
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1)
    .describe('Page number (starts at 1)'),

  pageSize: z
    .number()
    .int()
    .min(1, 'Page size must be at least 1')
    .max(200, 'Page size cannot exceed 200')
    .default(50)
    .describe('Number of workers per page (max 200)'),

  // Filters
  status: WorkerStatusEnum
    .default('all')
    .describe('Filter by worker status: active, inactive, or all'),

  search: z
    .string()
    .max(100, 'Search query too long')
    .optional()
    .describe('Search by worker name (partial match)'),

  sortBy: WorkerSortEnum
    .optional()
    .describe('Sort order for results'),
});

/**
 * TypeScript type inferred from schema
 */
export type ListWorkersInput = z.infer<typeof ListWorkersInputSchema>;

/**
 * Transform MCP input (camelCase) to API params (snake_case)
 */
export function toApiParams(input: ListWorkersInput): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: input.page,
    page_size: input.pageSize,
  };

  if (input.status !== 'all') {
    params.status = input.status;
  }

  if (input.search !== undefined && input.search !== '') {
    params.search = input.search;
  }

  if (input.sortBy !== undefined) {
    params.sort_by = input.sortBy;
  }

  return params;
}
