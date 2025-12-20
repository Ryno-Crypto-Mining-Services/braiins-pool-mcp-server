/**
 * Tool registry and routing for Braiins Pool MCP Server
 *
 * This module exports all available MCP tools and handles
 * routing tool calls to the appropriate handlers.
 */

import type { Tool, CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';
import { BraiinsError, ErrorCode, toBraiinsError } from '../utils/errors.js';

/**
 * Tool handler function type - returns MCP SDK's CallToolResult
 */
export type ToolHandler = (
  args: Record<string, unknown>
) => Promise<CallToolResult>;

/**
 * Internal tool definition with handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Tool['inputSchema'];
  handler: ToolHandler;
}

/**
 * Re-export CallToolResult for use in tool implementations
 */
export type { CallToolResult };

/**
 * Registry of all available tools
 * New tools should be imported and added here
 */
const toolRegistry: Map<string, ToolDefinition> = new Map();

/**
 * Register a tool in the registry
 */
export function registerTool(tool: ToolDefinition): void {
  if (toolRegistry.has(tool.name)) {
    logger.warn('Tool already registered, overwriting', { tool: tool.name });
  }
  toolRegistry.set(tool.name, tool);
  logger.debug('Tool registered', { tool: tool.name });
}

/**
 * Get all registered tools (for listing)
 */
export const tools: ToolDefinition[] = [];

/**
 * Handle a tool call by routing to the appropriate handler
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown> = {}
): Promise<CallToolResult> {
  const tool = toolRegistry.get(name);

  if (!tool) {
    logger.error('Unknown tool called', { tool: name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            code: ErrorCode.NOT_FOUND,
            message: `Unknown tool: ${name}`,
          }),
        } as TextContent,
      ],
      isError: true,
    };
  }

  try {
    return await tool.handler(args);
  } catch (error) {
    const braiinsError = toBraiinsError(error);
    logger.error('Tool execution failed', {
      tool: name,
      error: braiinsError.message,
      code: braiinsError.code,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(braiinsError.toJSON()),
        } as TextContent,
      ],
      isError: true,
    };
  }
}

/**
 * Create a successful tool response
 */
export function createSuccessResponse(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      } as TextContent,
    ],
  };
}

/**
 * Create an error tool response
 */
export function createErrorResponse(error: BraiinsError): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(error.toJSON()),
      } as TextContent,
    ],
    isError: true,
  };
}

// ============================================================================
// Tool Imports
// ----------------------------------------------------------------------------
// Import and register tools here as they are implemented.
// ============================================================================

import { getUserOverviewTool } from './getUserOverview.js';
import { listWorkersTool } from './listWorkers.js';
import { getWorkerDetailsTool } from './getWorkerDetails.js';
import { getWorkerHashrateTool } from './getWorkerHashrate.js';

// Register all tools
registerTool(getUserOverviewTool);
tools.push(getUserOverviewTool);

registerTool(listWorkersTool);
tools.push(listWorkersTool);

registerTool(getWorkerDetailsTool);
tools.push(getWorkerDetailsTool);

registerTool(getWorkerHashrateTool);
tools.push(getWorkerHashrateTool);

logger.debug('Tool registry initialized', { toolCount: tools.length });
