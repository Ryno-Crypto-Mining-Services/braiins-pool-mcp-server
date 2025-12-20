/**
 * Braiins Pool MCP Server
 *
 * Main entry point for the MCP server that provides tools for
 * monitoring Bitcoin mining operations via the Braiins Pool API.
 *
 * @see https://modelcontextprotocol.io/
 * @see API.md for Braiins Pool API documentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config/settings.js';
import { logger } from './utils/logger.js';
import { tools, handleToolCall } from './tools/index.js';

/**
 * Initialize and start the MCP server
 */
async function main(): Promise<void> {
  // Validate configuration at startup
  const configResult = validateConfig();
  if (!configResult.success) {
    logger.error('Configuration validation failed', {
      errors: configResult.errors,
    });
    process.exit(1);
  }

  logger.info('Starting Braiins Pool MCP Server', {
    version: '0.1.0',
    environment: config.nodeEnv,
  });

  // Create MCP server instance
  const server = new Server(
    {
      name: 'braiins-pool-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, () => {
    logger.debug('Listing available tools');
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;
    logger.info('Tool call received', { tool: name });

    try {
      const result = await handleToolCall(name, args);
      logger.info('Tool call completed', { tool: name, success: true });
      return result;
    } catch (error) {
      logger.error('Tool call failed', {
        tool: name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });

  // Set up error handling
  server.onerror = (error): void => {
    logger.error('MCP Server error', { error });
  };

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down MCP server...');
    void server.close().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down MCP server...');
    void server.close().then(() => process.exit(0));
  });

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Braiins Pool MCP Server started successfully');
}

// Start the server
main().catch((error: unknown) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
