/**
 * getPoolStats MCP Tool
 *
 * Retrieves global Braiins Pool statistics including total hashrate,
 * active workers, last block found, and luck metrics.
 *
 * @see API.md Section 7.1
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetPoolStatsInputSchema } from '../schemas/getPoolStatsInput.js';
import {
  GetPoolStatsResponseSchema,
  type GetPoolStatsResponse,
} from '../schemas/getPoolStatsResponse.js';
import { getBraiinsClient } from '../api/braiinsClient.js';
import { ValidationError, toBraiinsError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition } from './index.js';

/**
 * Format hashrate for human readability
 * Pool hashrate is typically in EH/s (10^18 H/s)
 */
function formatHashrate(hashrate: number): string {
  const units = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
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
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;

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
 * Format luck value with indicator
 */
function formatLuck(value: number): string {
  const percentage = (value * 100).toFixed(1);
  if (value >= 1.1) return `🍀 ${percentage}% (Very Lucky)`;
  if (value >= 1.0) return `✨ ${percentage}% (Lucky)`;
  if (value >= 0.9) return `📊 ${percentage}% (Normal)`;
  if (value >= 0.8) return `📉 ${percentage}% (Unlucky)`;
  return `⚠️ ${percentage}% (Very Unlucky)`;
}

/**
 * Format number with thousands separators
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: GetPoolStatsResponse): string {
  const lines: string[] = [
    `## Braiins Pool Statistics (${data.coin})`,
    '',
    '### Pool Performance',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Hashrate | ${formatHashrate(data.pool_hashrate)} |`,
    `| Active Workers | ${formatNumber(data.workers_active)} |`,
    '',
    '### Last Block Found',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Block Height | ${formatNumber(data.last_block.height)} |`,
    `| Reward | ${data.last_block.reward} BTC |`,
    `| Found | ${formatRelativeTime(data.last_block.found_at)} |`,
    '',
    '### Pool Luck',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Luck (${data.luck.window_blocks} blocks) | ${formatLuck(data.luck.value)} |`,
    '',
    '---',
    `*Last updated: ${new Date(data.updated_at).toLocaleString()}*`,
  ];

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate input (should be empty object)
  const parseResult = GetPoolStatsInputSchema.safeParse(args);
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

  try {
    // Step 2: Call API
    logger.debug('Fetching pool stats from API');
    const client = getBraiinsClient();
    const rawData = await client.getPoolStats();

    // Step 3: Validate response matches expected schema
    const validationResult = GetPoolStatsResponseSchema.safeParse(rawData);
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
    const formattedResponse = formatResponse(validationResult.data);

    return {
      content: [{ type: 'text', text: formattedResponse } as TextContent],
    };
  } catch (error) {
    const braiinsError = toBraiinsError(error);
    logger.error('getPoolStats failed', {
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
export const getPoolStatsTool: ToolDefinition = {
  name: 'getPoolStats',
  description:
    'Get global Braiins Pool statistics including total pool hashrate, ' +
    'number of active workers, last block found, and pool luck metrics.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
  handler,
};
