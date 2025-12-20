/**
 * getUserRewards MCP Tool
 *
 * Retrieves historical rewards timeseries data for the authenticated account.
 * Useful for earnings tracking, trend analysis, and payout monitoring.
 *
 * @see API.md Section 5.2
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetUserRewardsInputSchema, toApiParams } from '../schemas/getUserRewardsInput.js';
import {
  GetUserRewardsResponseSchema,
  type GetUserRewardsResponse,
  type RewardsPoint,
} from '../schemas/getUserRewardsResponse.js';
import { getCachedBraiinsClient } from '../api/cachedBraiinsClient.js';
import { ValidationError, toBraiinsError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ToolDefinition } from './index.js';

/**
 * Format BTC amount for display
 * Adds proper formatting with satoshi precision indicator
 */
function formatBtc(amount: string): string {
  const num = parseFloat(amount);
  if (num === 0) return '0 BTC';
  if (num < 0.00001) return `${amount} BTC (${Math.round(num * 100000000)} sats)`;
  return `${amount} BTC`;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date only (for day/week granularity)
 */
function formatDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate total rewards from points
 */
function calculateTotals(points: RewardsPoint[]): {
  totalConfirmed: number;
  totalUnconfirmed: number;
  totalPayout: number;
} {
  return points.reduce(
    (acc, point) => ({
      totalConfirmed: acc.totalConfirmed + parseFloat(point.confirmed),
      totalUnconfirmed: acc.totalUnconfirmed + parseFloat(point.unconfirmed),
      totalPayout: acc.totalPayout + parseFloat(point.payout),
    }),
    { totalConfirmed: 0, totalUnconfirmed: 0, totalPayout: 0 }
  );
}

/**
 * Generate a simple ASCII sparkline for rewards trend
 */
function generateSparkline(points: RewardsPoint[], width: number = 20): string {
  if (points.length === 0) return '';
  if (points.length === 1) return '━';

  // Use confirmed rewards for the trend
  const values = points.map((p) => parseFloat(p.confirmed));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // If no variance, return flat line
  if (range === 0) return '━'.repeat(Math.min(width, points.length));

  // Sample points if we have more than width
  const sampleSize = Math.min(width, points.length);
  const step = points.length / sampleSize;
  const sampled: number[] = [];

  for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor(i * step);
    sampled.push(values[idx]);
  }

  // Map to sparkline characters
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return sampled
    .map((v) => {
      const normalized = (v - min) / range;
      const charIdx = Math.min(Math.floor(normalized * chars.length), chars.length - 1);
      return chars[charIdx];
    })
    .join('');
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: GetUserRewardsResponse, granularity?: string): string {
  const lines: string[] = [`## Rewards History (${data.currency})`, ''];

  if (data.points.length === 0) {
    lines.push('*No rewards data available for the specified time range.*');
    return lines.join('\n');
  }

  // Time range info
  const firstPoint = data.points[0];
  const lastPoint = data.points[data.points.length - 1];
  const formatFn = granularity === 'hour' ? formatTimestamp : formatDate;

  lines.push(`**Period**: ${formatFn(firstPoint.timestamp)} → ${formatFn(lastPoint.timestamp)}`);
  lines.push(`**Data Points**: ${data.points.length}${granularity ? ` (${granularity})` : ''}`);
  lines.push('');

  // Totals
  const totals = calculateTotals(data.points);
  lines.push('### Totals');
  lines.push(`| Type | Amount |`);
  lines.push(`|------|--------|`);
  lines.push(`| Confirmed | ${formatBtc(totals.totalConfirmed.toFixed(8))} |`);
  lines.push(`| Unconfirmed | ${formatBtc(totals.totalUnconfirmed.toFixed(8))} |`);
  lines.push(`| Payouts | ${formatBtc(totals.totalPayout.toFixed(8))} |`);
  lines.push('');

  // Sparkline visualization
  const sparkline = generateSparkline(data.points);
  if (sparkline) {
    lines.push('### Earnings Trend');
    lines.push('```');
    lines.push(sparkline);
    lines.push('```');
    lines.push('');
  }

  // Recent data points (show last 10)
  const recentPoints = data.points.slice(-10);
  lines.push('### Recent Rewards');
  lines.push(`| Date | Confirmed | Unconfirmed | Payout |`);
  lines.push(`|------|-----------|-------------|--------|`);
  for (const point of recentPoints) {
    const date = formatFn(point.timestamp);
    lines.push(`| ${date} | ${point.confirmed} | ${point.unconfirmed} | ${point.payout} |`);
  }

  if (data.points.length > 10) {
    lines.push(`*Showing last 10 of ${data.points.length} points*`);
  }

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate and parse input
  const parseResult = GetUserRewardsInputSchema.safeParse(args);
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
    logger.debug('Fetching user rewards from API', { params: apiParams });

    const client = getCachedBraiinsClient();
    const rawData = await client.getUserRewards(apiParams);

    // Step 3: Validate response matches expected schema
    const validationResult = GetUserRewardsResponseSchema.safeParse(rawData);
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
    const formattedResponse = formatResponse(validationResult.data, input.granularity);

    return {
      content: [{ type: 'text', text: formattedResponse } as TextContent],
    };
  } catch (error) {
    const braiinsError = toBraiinsError(error);
    logger.error('getUserRewards failed', {
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
export const getUserRewardsTool: ToolDefinition = {
  name: 'getUserRewards',
  description:
    'Get historical rewards timeseries data for your Braiins Pool account. ' +
    'Shows confirmed and unconfirmed earnings, payouts, and earnings trends. ' +
    'Supports time range filtering and granularity options (hour, day, week).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      from: {
        type: 'string',
        description: 'Start timestamp (ISO 8601, e.g., 2025-01-01T00:00:00Z)',
      },
      to: {
        type: 'string',
        description: 'End timestamp (ISO 8601, e.g., 2025-01-10T00:00:00Z)',
      },
      granularity: {
        type: 'string',
        enum: ['hour', 'day', 'week'],
        description: 'Data point granularity (default varies by time range)',
      },
    },
    required: [],
  },
  handler,
};
