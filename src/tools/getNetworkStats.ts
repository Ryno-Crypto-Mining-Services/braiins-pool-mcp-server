/**
 * getNetworkStats MCP Tool
 *
 * Retrieves Bitcoin network statistics including difficulty,
 * estimated hashrate, block timing, and next difficulty adjustment ETA.
 *
 * @see API.md Section 7.2
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetNetworkStatsInputSchema } from '../schemas/getNetworkStatsInput.js';
import {
  GetNetworkStatsResponseSchema,
  type GetNetworkStatsResponse,
} from '../schemas/getNetworkStatsResponse.js';
import { getBraiinsClient } from '../api/braiinsClient.js';
import { ValidationError, toBraiinsError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition } from './index.js';

/**
 * Format hashrate for human readability
 * Network hashrate is typically in EH/s (10^18 H/s)
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
 * Format difficulty with appropriate notation
 * Bitcoin difficulty is a very large number (90+ trillion)
 */
function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)} T`;
  }
  if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)} B`;
  }
  if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(2)} M`;
  }
  return difficulty.toLocaleString();
}

/**
 * Format block time in seconds to human readable
 */
function formatBlockTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format time until next difficulty adjustment
 */
function formatTimeUntil(isoTimestamp: string): string {
  const now = Date.now();
  const target = new Date(isoTimestamp).getTime();
  const diffMs = target - now;

  if (diffMs <= 0 || isNaN(diffMs)) {
    return 'Imminent';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days}d`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${minutes}m`;
}

/**
 * Get block time variance indicator
 */
function getBlockTimeIndicator(actual: number, target: number): string {
  const ratio = actual / target;
  if (ratio < 0.9) return '⚡ Fast';
  if (ratio > 1.1) return '🐢 Slow';
  return '✅ On Target';
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: GetNetworkStatsResponse): string {
  const blockTimeIndicator = getBlockTimeIndicator(data.block_time_avg, data.block_time_target);

  const lines: string[] = [
    `## Bitcoin Network Statistics`,
    '',
    '### Network Metrics',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Network Hashrate | ${formatHashrate(data.hashrate_estimate)} |`,
    `| Mining Difficulty | ${formatDifficulty(data.difficulty)} |`,
    '',
    '### Block Timing',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Target Block Time | ${formatBlockTime(data.block_time_target)} |`,
    `| Average Block Time | ${formatBlockTime(data.block_time_avg)} ${blockTimeIndicator} |`,
    '',
    '### Difficulty Adjustment',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Next Adjustment | ${formatTimeUntil(data.next_difficulty_change_eta)} |`,
    `| Adjustment Date | ${new Date(data.next_difficulty_change_eta).toLocaleDateString()} |`,
  ];

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate input (should be empty object)
  const parseResult = GetNetworkStatsInputSchema.safeParse(args);
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
    logger.debug('Fetching network stats from API');
    const client = getBraiinsClient();
    const rawData = await client.getNetworkStats();

    // Step 3: Validate response matches expected schema
    const validationResult = GetNetworkStatsResponseSchema.safeParse(rawData);
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
    logger.error('getNetworkStats failed', {
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
export const getNetworkStatsTool: ToolDefinition = {
  name: 'getNetworkStats',
  description:
    'Get Bitcoin network statistics including current mining difficulty, ' +
    'estimated network hashrate, block timing metrics, and next difficulty adjustment ETA.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
  handler,
};
