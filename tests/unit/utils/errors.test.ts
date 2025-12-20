/**
 * Unit tests for custom error types
 */

import { describe, it, expect } from 'vitest';
import {
  BraiinsError,
  ValidationError,
  BraiinsApiError,
  CacheError,
  NetworkError,
  ConfigError,
  ErrorCode,
  isBraiinsError,
  toBraiinsError,
} from '../../../src/utils/errors.js';

describe('Custom Errors', () => {
  describe('BraiinsError', () => {
    it('should create error with correct properties', () => {
      const error = new BraiinsError(
        'Test error',
        ErrorCode.INTERNAL_ERROR,
        500,
        { detail: 'test' }
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('BraiinsError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new BraiinsError(
        'Test error',
        ErrorCode.BAD_REQUEST,
        400,
        { field: 'workerId' }
      );

      const json = error.toJSON();

      expect(json).toEqual({
        error: true,
        code: ErrorCode.BAD_REQUEST,
        message: 'Test error',
        details: { field: 'workerId' },
      });
    });

    it('should exclude details when not provided', () => {
      const error = new BraiinsError('No details', ErrorCode.INTERNAL_ERROR, 500);
      const json = error.toJSON();

      expect(json.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create error with validation code', () => {
      const error = new ValidationError('Invalid input', { field: 'workerId' });

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('BraiinsApiError', () => {
    it('should create API error correctly', () => {
      const error = new BraiinsApiError('API failed', ErrorCode.API_ERROR, 500);

      expect(error.name).toBe('BraiinsApiError');
      expect(error.code).toBe(ErrorCode.API_ERROR);
    });

    describe('fromHttpStatus', () => {
      const testCases = [
        { status: 400, code: ErrorCode.BAD_REQUEST },
        { status: 401, code: ErrorCode.UNAUTHORIZED },
        { status: 403, code: ErrorCode.FORBIDDEN },
        { status: 404, code: ErrorCode.NOT_FOUND },
        { status: 429, code: ErrorCode.RATE_LIMITED },
        { status: 500, code: ErrorCode.API_ERROR },
        { status: 502, code: ErrorCode.API_ERROR },
        { status: 503, code: ErrorCode.API_ERROR },
        { status: 504, code: ErrorCode.TIMEOUT_ERROR },
      ];

      testCases.forEach(({ status, code }) => {
        it(`should map status ${status} to ${code}`, () => {
          const error = BraiinsApiError.fromHttpStatus(status);
          expect(error.code).toBe(code);
          expect(error.statusCode).toBe(status);
        });
      });

      it('should use custom message when provided', () => {
        const error = BraiinsApiError.fromHttpStatus(404, 'Worker not found');
        expect(error.message).toBe('Worker not found');
      });

      it('should handle unknown status codes', () => {
        const error = BraiinsApiError.fromHttpStatus(418);
        expect(error.code).toBe(ErrorCode.API_ERROR);
      });
    });
  });

  describe('CacheError', () => {
    it('should create cache error correctly', () => {
      const error = new CacheError('Redis connection failed');

      expect(error.name).toBe('CacheError');
      expect(error.code).toBe(ErrorCode.CACHE_ERROR);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('NetworkError', () => {
    it('should create network error correctly', () => {
      const error = new NetworkError('Connection refused');

      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('ConfigError', () => {
    it('should create config error correctly', () => {
      const error = new ConfigError('Missing API token');

      expect(error.name).toBe('ConfigError');
      expect(error.code).toBe(ErrorCode.CONFIG_ERROR);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('isBraiinsError', () => {
    it('should return true for BraiinsError instances', () => {
      const error = new BraiinsError('Test', ErrorCode.INTERNAL_ERROR, 500);
      expect(isBraiinsError(error)).toBe(true);
    });

    it('should return true for derived error instances', () => {
      expect(isBraiinsError(new ValidationError('Test'))).toBe(true);
      expect(isBraiinsError(new BraiinsApiError('Test'))).toBe(true);
      expect(isBraiinsError(new CacheError('Test'))).toBe(true);
    });

    it('should return false for regular errors', () => {
      expect(isBraiinsError(new Error('Test'))).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isBraiinsError('error')).toBe(false);
      expect(isBraiinsError(null)).toBe(false);
      expect(isBraiinsError(undefined)).toBe(false);
    });
  });

  describe('toBraiinsError', () => {
    it('should return BraiinsError as-is', () => {
      const original = new BraiinsError('Test', ErrorCode.INTERNAL_ERROR, 500);
      const result = toBraiinsError(original);

      expect(result).toBe(original);
    });

    it('should convert Error to BraiinsError', () => {
      const original = new Error('Test error');
      const result = toBraiinsError(original);

      expect(isBraiinsError(result)).toBe(true);
      expect(result.message).toBe('Test error');
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it('should handle non-Error values', () => {
      const result = toBraiinsError('string error');

      expect(isBraiinsError(result)).toBe(true);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });
});
