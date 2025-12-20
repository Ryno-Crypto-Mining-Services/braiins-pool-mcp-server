/**
 * listWorkers MCP Tool
 *
 * Retrieves a paginated list of mining workers for the authenticated
 * Braiins Pool account with filtering and sorting options.
 *
 * @see API.md Section 6.1
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { ListWorkersInputSchema, toApiParams } from '../schemas/listWorkersInput.js';
import {
  ListWorkersResponseSchema,
  type ListWorkersResponse,
  type Worker,
} from '../schemas/listWorkersResponse.js';
import { getCachedBraiinsClient } from '../api/cachedBraiinsClient.js';
import { ValidationError, toBraiinsError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition } from './index.js';

/**
 * Format hashrate for human readability
 * Converts H/s to appropriate unit (TH/s, PH/s, EH/s)
 */
function formatHashrate(hashrate: number): string {
  const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s'];
  let unitIndex = 0;
  let value = hashrate;

  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format relative time from a timestamp
 */
function formatRelativeTime(isoTimestamp: string | null): string {
  if (isoTimestamp === null || isoTimestamp === '') {
    return 'Never';
  }

  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;

  // Handle future timestamps or invalid dates
  if (diffMs < 0 || isNaN(diffMs)) {
    return 'Unknown';
  }

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Format status with visual indicator
 */
function formatStatus(status: string): string {
  switch (status) {
    case 'active':
      return '🟢 active';
    case 'inactive':
      return '🔴 inactive';
    case 'disabled':
      return '⚫ disabled';
    default:
      return status;
  }
}

/**
 * Format a single worker as a markdown table row
 *
 * Uses 24h average hashrate (more stable than current) and relative time
 * for last share to quickly identify problematic workers.
 *
 * @param worker - The worker object to format
 * @returns Markdown table row string
 */
function formatWorker(worker: Worker): string {
  const name = worker.name;
  const status = formatStatus(worker.status);
  const hashrate = formatHashrate(worker.hashrate.avg_24h);
  const lastShare = formatRelativeTime(worker.last_share_at);

  return `| ${name} | ${status} | ${hashrate} | ${lastShare} |`;
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: ListWorkersResponse, page: number, pageSize: number): string {
  const lines: string[] = [
    `## Workers (Page ${page} of ${Math.ceil(data.total / pageSize)})`,
    '',
    `**Total workers**: ${data.total} | **Showing**: ${data.workers.length}`,
    '',
  ];

  if (data.workers.length === 0) {
    lines.push('*No workers found matching your criteria.*');
  } else {
    // Add header row for table format
    lines.push('| Name | Status | Hashrate (24h avg) | Last Share |');
    lines.push('|------|--------|-------------------|------------|');

    // Format each worker
    for (const worker of data.workers) {
      lines.push(formatWorker(worker));
    }
  }

  // Add pagination info
  lines.push('');
  if (data.total > pageSize) {
    const totalPages = Math.ceil(data.total / pageSize);
    lines.push(`*Page ${page}/${totalPages}. Use \`page\` parameter to navigate.*`);
  }

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate and parse input with defaults
  const parseResult = ListWorkersInputSchema.safeParse(args);
  if (!parseResult.success) {
    const error = new ValidationError('Invalid input parameters', {
      issues: parseResult.error.issues,
    });
    logger.warn('Input validation failed', { error: error.message });
    return {
      content: [{ type: 'text', text: JSON.stringify(error.toJSON()) } as TextContent],
      isError: true,
    };
  }

  const input = parseResult.data;

  try {
    // Step 2: Transform to API params and call API
    const apiParams = toApiParams(input);
    logger.debug('Fetching workers from API', { params: apiParams });

    const client = getCachedBraiinsClient();
    const rawData = await client.listWorkers(apiParams);

    // Step 3: Validate response matches expected schema
    const validationResult = ListWorkersResponseSchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.error('API response validation failed', {
        issues: validationResult.error.issues,
      });
      // Return raw data if validation fails
      return {
        content: [{ type: 'text', text: JSON.stringify(rawData, null, 2) } as TextContent],
      };
    }

    // Step 4: Format and return response
    const formattedResponse = formatResponse(validationResult.data, input.page, input.pageSize);

    return {
      content: [{ type: 'text', text: formattedResponse } as TextContent],
    };
  } catch (error) {
    const braiinsError = toBraiinsError(error);
    logger.error('listWorkers failed', {
      code: braiinsError.code,
      message: braiinsError.message,
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(braiinsError.toJSON()) } as TextContent],
      isError: true,
    };
  }
}

/**
 * Tool definition for registration
 */
export const listWorkersTool: ToolDefinition = {
  name: 'listWorkers',
  description:
    'List mining workers for your Braiins Pool account with pagination and filtering. ' +
    'Filter by status (active/inactive), search by name, and sort by hashrate or name.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      page: {
        type: 'number',
        description: 'Page number (default: 1)',
      },
      pageSize: {
        type: 'number',
        description: 'Workers per page, max 200 (default: 50)',
      },
      status: {
        type: 'string',
        enum: ['active', 'inactive', 'all'],
        description: 'Filter by status (default: all)',
      },
      search: {
        type: 'string',
        description: 'Search by worker name',
      },
      sortBy: {
        type: 'string',
        enum: ['hashrate_desc', 'hashrate_asc', 'name_asc', 'name_desc', 'last_share'],
        description: 'Sort order',
      },
    },
    required: [],
  },
  handler,
};
