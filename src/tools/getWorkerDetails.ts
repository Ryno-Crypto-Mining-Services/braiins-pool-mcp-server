/**
 * getWorkerDetails MCP Tool
 *
 * Retrieves detailed information for a specific mining worker including
 * hardware specs, environment data, and extended statistics.
 *
 * @see API.md Section 6.2
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetWorkerDetailsInputSchema } from '../schemas/getWorkerDetailsInput.js';
import {
  GetWorkerDetailsResponseSchema,
  type GetWorkerDetailsResponse,
} from '../schemas/getWorkerDetailsResponse.js';
import { getBraiinsClient } from '../api/braiinsClient.js';
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
      return '🟢 Active';
    case 'inactive':
      return '🔴 Inactive';
    case 'disabled':
      return '⚫ Disabled';
    default:
      return status;
  }
}

/**
 * Format temperature with unit
 */
function formatTemperature(avg: number, max: number, unit: string): string {
  return `${avg.toFixed(1)}°${unit} avg / ${max.toFixed(1)}°${unit} max`;
}

/**
 * Calculate share rejection rate
 */
function calculateRejectionRate(valid: number, invalid: number, stale: number): string {
  const total = valid + invalid + stale;
  if (total === 0) return '0.00%';
  const rejected = invalid + stale;
  return `${((rejected / total) * 100).toFixed(2)}%`;
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: GetWorkerDetailsResponse): string {
  const lines: string[] = [
    `## Worker: ${data.name}`,
    '',
    `**ID**: \`${data.id}\``,
    `**Status**: ${formatStatus(data.status)}`,
    `**Last Share**: ${formatRelativeTime(data.last_share_at)}`,
    '',
    '### Hashrate',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Current | ${formatHashrate(data.hashrate.current)} |`,
    `| 1h Average | ${formatHashrate(data.hashrate.avg_1h)} |`,
    `| 24h Average | ${formatHashrate(data.hashrate.avg_24h)} |`,
    '',
    '### Shares',
    `| Type | Count |`,
    `|------|-------|`,
    `| Valid | ${data.shares.valid.toLocaleString()} |`,
    `| Invalid | ${data.shares.invalid.toLocaleString()} |`,
    `| Stale | ${data.shares.stale.toLocaleString()} |`,
    `| **Rejection Rate** | ${calculateRejectionRate(data.shares.valid, data.shares.invalid, data.shares.stale)} |`,
  ];

  // Hardware section (optional)
  if (data.hardware) {
    lines.push('');
    lines.push('### Hardware');
    lines.push(`- **Model**: ${data.hardware.model}`);
    lines.push(`- **Firmware**: ${data.hardware.firmware}`);
    if (data.hardware.power_mode) {
      lines.push(`- **Power Mode**: ${data.hardware.power_mode}`);
    }
  }

  // Environment section (optional)
  if (data.environment?.temperature) {
    lines.push('');
    lines.push('### Environment');
    const temp = data.environment.temperature;
    lines.push(`- **Temperature**: ${formatTemperature(temp.avg, temp.max, temp.unit)}`);
  }

  // Timestamps
  lines.push('');
  lines.push('---');
  lines.push(`*Created: ${new Date(data.created_at).toLocaleString()}*`);
  lines.push(`*Updated: ${new Date(data.updated_at).toLocaleString()}*`);

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate and parse input
  const parseResult = GetWorkerDetailsInputSchema.safeParse(args);
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

  const { workerId } = parseResult.data;

  try {
    // Step 2: Call API
    logger.debug('Fetching worker details from API', { workerId });
    const client = getBraiinsClient();
    const rawData = await client.getWorkerDetails(workerId);

    // Step 3: Validate response matches expected schema
    const validationResult = GetWorkerDetailsResponseSchema.safeParse(rawData);
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
    logger.error('getWorkerDetails failed', {
      code: braiinsError.code,
      message: braiinsError.message,
      workerId,
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
export const getWorkerDetailsTool: ToolDefinition = {
  name: 'getWorkerDetails',
  description:
    'Get detailed information for a specific mining worker including hardware specs, ' +
    'temperature readings, share statistics, and performance metrics.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workerId: {
        type: 'string',
        description: 'Unique worker identifier (required)',
      },
    },
    required: ['workerId'],
  },
  handler,
};
