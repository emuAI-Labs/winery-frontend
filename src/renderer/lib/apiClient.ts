import { ApiRequestOptions, AuthError } from '../../shared/authTypes';

export class ApiError extends Error {
  code: AuthError['code'];

  details?: unknown;

  constructor(error: AuthError) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
  }
}

/** Thin wrapper over window.api.request — every inventory (and future
 * feature) call goes through the main process, which owns token attachment
 * and refresh-on-401. Throws ApiError on failure so react-query's error
 * channel "just works". */
export default async function apiRequest<T = unknown>(
  options: ApiRequestOptions,
): Promise<T> {
  const res = await window.api.request<T>(options);
  if (!res.ok) {
    throw new ApiError(
      res.error ?? { code: 'UNKNOWN_ERROR', message: 'Request failed.' },
    );
  }
  return res.data as T;
}
