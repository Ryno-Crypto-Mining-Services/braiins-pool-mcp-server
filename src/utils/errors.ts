/**
 * Custom error types for Braiins Pool MCP Server
 *
 * Provides structured error handling with error codes
 * that can be mapped to appropriate responses.
 */

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  // Validation errors (4xx equivalent)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',

  // Server/API errors (5xx equivalent)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Cache errors
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_CONNECTION_ERROR = 'CACHE_CONNECTION_ERROR',

  // Configuration errors
  CONFIG_ERROR = 'CONFIG_ERROR',
}

/**
 * Base error class for all custom errors
 */
export class BraiinsError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BraiinsError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to a safe, serializable format for responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: true,
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Error thrown when API validation fails
 */
export class ValidationError extends BraiinsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown for Braiins API errors
 */
export class BraiinsApiError extends BraiinsError {
  public readonly originalStatus?: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.API_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
    this.name = 'BraiinsApiError';
    this.originalStatus = statusCode;
  }

  /**
   * Create error from HTTP status code
   */
  static fromHttpStatus(
    status: number,
    message?: string,
    details?: Record<string, unknown>
  ): BraiinsApiError {
    const statusMap: Record<number, { code: ErrorCode; defaultMessage: string }> = {
      400: { code: ErrorCode.BAD_REQUEST, defaultMessage: 'Bad request to Braiins API' },
      401: { code: ErrorCode.UNAUTHORIZED, defaultMessage: 'Invalid or missing API token' },
      403: { code: ErrorCode.FORBIDDEN, defaultMessage: 'Access forbidden' },
      404: { code: ErrorCode.NOT_FOUND, defaultMessage: 'Resource not found' },
      429: { code: ErrorCode.RATE_LIMITED, defaultMessage: 'Rate limit exceeded' },
      500: { code: ErrorCode.API_ERROR, defaultMessage: 'Braiins API internal error' },
      502: { code: ErrorCode.API_ERROR, defaultMessage: 'Braiins API bad gateway' },
      503: { code: ErrorCode.API_ERROR, defaultMessage: 'Braiins API unavailable' },
      504: { code: ErrorCode.TIMEOUT_ERROR, defaultMessage: 'Braiins API timeout' },
    };

    const mapped = statusMap[status] ?? {
      code: ErrorCode.API_ERROR,
      defaultMessage: `Braiins API error (status: ${status})`,
    };

    return new BraiinsApiError(
      message !== undefined && message !== '' ? message : mapped.defaultMessage,
      mapped.code,
      status,
      details
    );
  }
}

/**
 * Error thrown for cache operations
 */
export class CacheError extends BraiinsError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CACHE_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message, code, 500, details);
    this.name = 'CacheError';
  }
}

/**
 * Error thrown for network/connection issues
 */
export class NetworkError extends BraiinsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.NETWORK_ERROR, 503, details);
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigError extends BraiinsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, ErrorCode.CONFIG_ERROR, 500, details);
    this.name = 'ConfigError';
  }
}

/**
 * Check if an error is a BraiinsError
 */
export function isBraiinsError(error: unknown): error is BraiinsError {
  return error instanceof BraiinsError;
}

/**
 * Convert any error to a BraiinsError
 */
export function toBraiinsError(error: unknown): BraiinsError {
  if (isBraiinsError(error)) {
    return error;
  }

  if (error !== null && error instanceof Error) {
    return new BraiinsError(error.message, ErrorCode.INTERNAL_ERROR, 500, {
      originalError: error.name,
    });
  }

  return new BraiinsError('An unknown error occurred', ErrorCode.INTERNAL_ERROR, 500);
}
