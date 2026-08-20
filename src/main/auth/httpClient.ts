import axios, { AxiosError } from 'axios';
import { AuthError, AuthErrorCode } from '../../shared/authTypes';

export const API_BASE_URL =
  process.env.WINERY_API_BASE_URL || 'http://localhost:3000/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

interface BackendErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
}

const KNOWN_CODES = new Set<AuthErrorCode>([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'TOKEN_EXPIRED',
  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'ACCOUNT_INACTIVE',
  'PASSWORD_CHANGE_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'SERVICE_UNAVAILABLE',
]);

/**
 * Turns any axios failure into our normalized AuthError shape. A response
 * with no `response` object means the request never reached the backend
 * (offline, DNS, timeout, connection refused) — that's NETWORK_ERROR, and
 * callers must treat it very differently from a real 401 (never force a
 * logout for it).
 */
export function toAuthError(err: unknown): AuthError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<BackendErrorBody>;
    if (!axiosErr.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Could not reach the server. Check your connection.',
      };
    }
    const body = axiosErr.response.data;
    const code =
      body?.code && KNOWN_CODES.has(body.code as AuthErrorCode)
        ? (body.code as AuthErrorCode)
        : 'UNKNOWN_ERROR';
    return {
      code,
      message: body?.message || axiosErr.message,
      details: body?.details,
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: err instanceof Error ? err.message : 'Unknown error',
  };
}
