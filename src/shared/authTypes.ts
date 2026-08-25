export type UserRole =
  | 'superadmin'
  | 'owner'
  | 'manager'
  | 'supervisor'
  | 'bartender'
  | 'waiter';

export type UserStatus = 'active' | 'suspended' | 'disabled';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  employeeCode?: string | null;
  phone?: string | null;
  email?: string | null;
  branch?: string | null;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export type AuthErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: unknown;
}

export type AuthResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: AuthError };

export interface BootstrapResult {
  user: AuthUser | null;
  /** true when we could not reach the backend and are relying on a locally cached session */
  offline: boolean;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

export interface ApiResponseMeta {
  /** true when this response was served from the local cache because the
   * backend was unreachable */
  servedFromCache?: boolean;
  /** epoch ms the cached copy was last refreshed from the server */
  cachedAt?: number;
  /** true when a mutation was queued locally instead of sent immediately */
  queued?: boolean;
  outboxId?: string;
  /** true when a queued mutation's response was synthesized client-side
   * (e.g. an estimated price) and will be corrected once it syncs */
  estimated?: boolean;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: AuthError;
  meta?: ApiResponseMeta;
}
