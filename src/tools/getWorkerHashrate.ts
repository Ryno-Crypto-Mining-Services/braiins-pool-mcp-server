/**
 * getWorkerHashrate MCP Tool
 *
 * Retrieves historical hashrate timeseries data for a specific worker.
 * Useful for performance monitoring, trend analysis, and debugging.
 *
 * @see API.md Section 6.3
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetWorkerHashrateInputSchema, toApiParams } from '../schemas/getWorkerHashrateInput.js';
import {
  GetWorkerHashrateResponseSchema,
  type GetWorkerHashrateResponse,
  type HashratePoint,
} from '../schemas/getWorkerHashrateResponse.js';
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
 * Calculate statistics from timeseries data
 */
function calculateStats(points: HashratePoint[]): {
  min: number;
  max: number;
  avg: number;
  latest: number;
} {
  if (points.length === 0) {
    return { min: 0, max: 0, avg: 0, latest: 0 };
  }

  const hashrates = points.map((p) => p.hashrate);
  const sum = hashrates.reduce((a, b) => a + b, 0);

  return {
    min: Math.min(...hashrates),
    max: Math.max(...hashrates),
    avg: sum / hashrates.length,
    latest: hashrates[hashrates.length - 1],
  };
}

/**
 * Generate a simple ASCII sparkline for hashrate trend
 */
function generateSparkline(points: HashratePoint[], width: number = 20): string {
  if (points.length === 0) return '';
  if (points.length === 1) return '━';

  const hashrates = points.map((p) => p.hashrate);
  const min = Math.min(...hashrates);
  const max = Math.max(...hashrates);
  const range = max - min;

  // If no variance, return flat line
  if (range === 0) return '━'.repeat(Math.min(width, points.length));

  // Sample points if we have more than width
  const sampleSize = Math.min(width, points.length);
  const step = points.length / sampleSize;
  const sampled: number[] = [];

  for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor(i * step);
    sampled.push(hashrates[idx]);
  }

  // Map to sparkline characters
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  return sampled
    .map((h) => {
      const normalized = (h - min) / range;
      const charIdx = Math.min(Math.floor(normalized * chars.length), chars.length - 1);
      return chars[charIdx];
    })
    .join('');
}

/**
 * Format the complete API response for MCP output
 */
function formatResponse(data: GetWorkerHashrateResponse, granularity?: string): string {
  const lines: string[] = [`## Hashrate History: ${data.worker_id}`, ''];

  if (data.points.length === 0) {
    lines.push('*No hashrate data available for the specified time range.*');
    return lines.join('\n');
  }

  // Time range info
  const firstPoint = data.points[0];
  const lastPoint = data.points[data.points.length - 1];
  lines.push(
    `**Period**: ${formatTimestamp(firstPoint.timestamp)} → ${formatTimestamp(lastPoint.timestamp)}`
  );
  lines.push(`**Data Points**: ${data.points.length}${granularity ? ` (${granularity})` : ''}`);
  lines.push('');

  // Statistics
  const stats = calculateStats(data.points);
  lines.push('### Statistics');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Latest | ${formatHashrate(stats.latest)} |`);
  lines.push(`| Average | ${formatHashrate(stats.avg)} |`);
  lines.push(`| Minimum | ${formatHashrate(stats.min)} |`);
  lines.push(`| Maximum | ${formatHashrate(stats.max)} |`);
  lines.push('');

  // Sparkline visualization
  const sparkline = generateSparkline(data.points);
  if (sparkline) {
    lines.push('### Trend');
    lines.push('```');
    lines.push(sparkline);
    lines.push('```');
    lines.push('');
  }

  // Recent data points (show last 10)
  const recentPoints = data.points.slice(-10);
  lines.push('### Recent Data Points');
  lines.push(`| Time | Hashrate |`);
  lines.push(`|------|----------|`);
  for (const point of recentPoints) {
    lines.push(`| ${formatTimestamp(point.timestamp)} | ${formatHashrate(point.hashrate)} |`);
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
  const parseResult = GetWorkerHashrateInputSchema.safeParse(args);
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
    logger.debug('Fetching worker hashrate from API', {
      workerId: input.workerId,
      params: apiParams,
    });

    const client = getBraiinsClient();
    const rawData = await client.getWorkerHashrate(input.workerId, apiParams);

    // Step 3: Validate response matches expected schema
    const validationResult = GetWorkerHashrateResponseSchema.safeParse(rawData);
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
    logger.error('getWorkerHashrate failed', {
      code: braiinsError.code,
      message: braiinsError.message,
      workerId: input.workerId,
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
export const getWorkerHashrateTool: ToolDefinition = {
  name: 'getWorkerHashrate',
  description:
    'Get historical hashrate timeseries data for a specific worker. ' +
    'Supports time range filtering and granularity options (minute, hour, day). ' +
    'Returns statistics, trend visualization, and recent data points.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workerId: {
        type: 'string',
        description: 'Unique worker identifier (required)',
      },
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
        enum: ['minute', 'hour', 'day'],
        description: 'Data point granularity (default varies by time range)',
      },
    },
    required: ['workerId'],
  },
  handler,
};
