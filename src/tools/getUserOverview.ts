/**
 * getUserOverview MCP Tool
 *
 * Retrieves high-level account summary including hashrate, rewards,
 * and worker counts for the authenticated Braiins Pool user.
 *
 * @see API.md Section 5.1
 */

import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { GetUserOverviewInputSchema } from '../schemas/getUserOverviewInput.js';
import {
  GetUserOverviewResponseSchema,
  type GetUserOverviewResponse,
} from '../schemas/getUserOverviewResponse.js';
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
 * Format the API response for MCP output
 * Creates a human-readable summary with key metrics
 */
function formatResponse(data: GetUserOverviewResponse): string {
  const lines = [
    `## Mining Overview for ${data.username}`,
    '',
    '### Hashrate',
    `- **Current**: ${formatHashrate(data.hashrate.current)}`,
    `- **1h Average**: ${formatHashrate(data.hashrate.avg_1h)}`,
    `- **24h Average**: ${formatHashrate(data.hashrate.avg_24h)}`,
    '',
    '### Rewards (BTC)',
    `- **Confirmed**: ${data.rewards.confirmed}`,
    `- **Unconfirmed**: ${data.rewards.unconfirmed}`,
    `- **Last Payout**: ${data.rewards.last_payout}`,
    data.rewards.last_payout_at !== null && data.rewards.last_payout_at !== ''
      ? `- **Last Payout At**: ${new Date(data.rewards.last_payout_at).toLocaleString()}`
      : '- **Last Payout At**: Never',
    '',
    '### Workers',
    `- **Active**: ${data.workers.active}`,
    `- **Inactive**: ${data.workers.inactive}`,
    `- **Total**: ${data.workers.total}`,
    '',
    `*Last updated: ${new Date(data.updated_at).toLocaleString()}*`,
  ];

  return lines.join('\n');
}

/**
 * Tool handler implementation
 */
async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  // Step 1: Validate input (even though this endpoint has no params)
  const parseResult = GetUserOverviewInputSchema.safeParse(args);
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
    // Step 2: Call API (TODO: Add cache lookup before this)
    logger.debug('Fetching user overview from API');
    const client = getBraiinsClient();
    const rawData = await client.getUserOverview();

    // Step 3: Validate response matches expected schema
    const validationResult = GetUserOverviewResponseSchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.error('API response validation failed', {
        issues: validationResult.error.issues,
      });
      // If validation fails, we can't safely format the response
      // Return raw data as JSON instead
      return {
        content: [{ type: 'text', text: JSON.stringify(rawData, null, 2) } as TextContent],
      };
    }

    // Step 4: Format and return response
    // TODO: Cache the result with 30s TTL
    const formattedResponse = formatResponse(validationResult.data);

    return {
      content: [{ type: 'text', text: formattedResponse } as TextContent],
    };
  } catch (error) {
    const braiinsError = toBraiinsError(error);
    logger.error('getUserOverview failed', {
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
export const getUserOverviewTool: ToolDefinition = {
  name: 'getUserOverview',
  description:
    'Get a high-level summary of your Braiins Pool mining account including current hashrate, rewards balance, and worker status.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
  handler,
};
