/**
 * Logging utility for Braiins Pool MCP Server
 *
 * Provides structured logging with different log levels
 * and formats (JSON for production, pretty for development).
 */

import { config } from '../config/settings.js';

/**
 * Log levels with numeric priority
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Format log entry as JSON
 */
function formatJson(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    context: sanitizeContext(entry.context),
  });
}

/**
 * Format log entry for human readability
 */
function formatPretty(entry: LogEntry): string {
  const levelColors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';

  const color = levelColors[entry.level];
  const contextStr = entry.context
    ? ` ${JSON.stringify(sanitizeContext(entry.context))}`
    : '';

  return `${entry.timestamp} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}${contextStr}`;
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const sensitiveKeys = [
    'token',
    'apiKey',
    'password',
    'secret',
    'authorization',
    'auth',
    'credential',
    'key',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((sensitive) =>
      lowerKey.includes(sensitive)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value instanceof Error) {
      sanitized[key] = {
        name: value.name,
        message: value.message,
        // Only include stack in development
        ...(config.nodeEnv === 'development' && { stack: value.stack }),
      };
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.logLevel as LogLevel];
}

/**
 * Write log entry to stderr (MCP servers use stdio, logs go to stderr)
 */
function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  const formatted =
    config.logFormat === 'json' ? formatJson(entry) : formatPretty(entry);

  // Write to stderr to not interfere with stdio MCP transport
  console.error(formatted);
}

/**
 * Logger instance with level-specific methods
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    writeLog('debug', message, context);
  },

  info(message: string, context?: Record<string, unknown>): void {
    writeLog('info', message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    writeLog('warn', message, context);
  },

  error(message: string, context?: Record<string, unknown>): void {
    writeLog('error', message, context);
  },
};
