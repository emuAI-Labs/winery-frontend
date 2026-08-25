import os from 'os';
import log from 'electron-log';
import { http, toAuthError } from './httpClient';
import tokenStore from './tokenStore';
import {
  ApiRequestOptions,
  ApiResponse,
  AuthUser,
  BootstrapResult,
} from '../../shared/authTypes';

interface LoginResponseBody {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Owns the whole auth lifecycle for the app. Lives only in the main
 * process: the renderer never sees a raw token, only user/session state
 * over IPC. See src/main/auth/tokenStore.ts for why.
 */
class AuthService {
  private accessToken: string | null = null;

  private currentUser: AuthUser | null = null;

  /** Single-flight guard: every concurrent 401 awaits this same refresh
   * instead of racing the backend's single-use refresh-token rotation
   * (a second concurrent refresh call would be treated as token reuse and
   * kill every session for the user). */
  private refreshPromise: Promise<boolean> | null = null;

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  private setSession(body: LoginResponseBody) {
    this.accessToken = body.accessToken;
    this.currentUser = body.user;
    tokenStore.save(body.refreshToken, body.user);
  }

  private clearSession() {
    this.accessToken = null;
    this.currentUser = null;
    tokenStore.clear();
  }

  async login(
    username: string,
    password: string,
    deviceLabel?: string,
  ): Promise<ApiResponse<{ user: AuthUser }>> {
    try {
      const { data } = await http.post<LoginResponseBody>('/auth/login', {
        username,
        password,
        deviceLabel: deviceLabel || os.hostname(),
      });
      this.setSession(data);
      return { ok: true, status: 200, data: { user: data.user } };
    } catch (err) {
      const error = toAuthError(err);
      return { ok: false, status: 0, error };
    }
  }

  /** Rotates the refresh token. Never call this concurrently — always go
   * through ensureFreshAccessToken(), which single-flights it. */
  private async doRefresh(): Promise<boolean> {
    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const { data } = await http.post<LoginResponseBody>('/auth/refresh', {
        refreshToken,
      });
      this.setSession(data);
      return true;
    } catch (err) {
      const error = toAuthError(err);
      if (
        error.code === 'NETWORK_ERROR' ||
        error.code === 'SERVICE_UNAVAILABLE'
      ) {
        // Backend unreachable — keep the persisted refresh token, this is
        // not proof it's invalid, just that we're offline. Caller decides
        // how to degrade.
        log.warn('Refresh failed: backend unreachable, staying offline');
        return false;
      }
      // Real auth rejection (invalid/reused/expired token, inactive account).
      log.warn('Refresh rejected by backend, clearing session', error.code);
      this.clearSession();
      return false;
    }
  }

  private async ensureFreshAccessToken(): Promise<boolean> {
    if (this.accessToken) return true;
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  /** Called once on app cold start. */
  async bootstrap(): Promise<BootstrapResult> {
    const hasRefreshToken = !!tokenStore.getRefreshToken();
    if (!hasRefreshToken) return { user: null, offline: false };

    const refreshed = await this.ensureFreshAccessToken();
    if (refreshed) {
      // Don't trust the cached user indefinitely — role/status may have
      // changed server-side since the last session.
      const me = await this.authorizedRequest<{ user: AuthUser }>({
        method: 'GET',
        path: '/auth/me',
      });
      if (me.ok && me.data) {
        this.currentUser = me.data.user;
        return { user: me.data.user, offline: false };
      }
      if (me.error?.code === 'NETWORK_ERROR') {
        return { user: tokenStore.getCachedUser(), offline: true };
      }
      // /auth/me rejected the token outright.
      this.clearSession();
      return { user: null, offline: false };
    }

    if (tokenStore.getRefreshToken()) {
      // Refresh failed but session wasn't cleared -> it was a network
      // failure. Let the till keep running against the last known identity.
      return { user: tokenStore.getCachedUser(), offline: true };
    }
    return { user: null, offline: false };
  }

  /** Generic authenticated request used for every endpoint beyond
   * login/refresh — this is the one place 401-retry-once-after-refresh
   * logic lives, so every future feature module reuses it via api:request. */
  async authorizedRequest<T = unknown>(
    options: ApiRequestOptions,
    _isRetry = false,
    /** set only by the outbox drain loop when replaying a queued mutation —
     * the live/first-attempt path never has an id to key yet */
    idempotencyKey: string | undefined = undefined,
  ): Promise<ApiResponse<T>> {
    const ready = await this.ensureFreshAccessToken();
    if (!ready || !this.accessToken) {
      return {
        ok: false,
        status: 0,
        error: tokenStore.getRefreshToken()
          ? { code: 'NETWORK_ERROR', message: 'Could not reach the server.' }
          : { code: 'UNAUTHORIZED', message: 'Not signed in.' },
      };
    }

    try {
      const { data, status } = await http.request<T>({
        url: options.path,
        method: options.method || 'GET',
        data: options.body,
        params: options.query,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
      });
      return { ok: true, status, data };
    } catch (err) {
      const error = toAuthError(err);
      if (
        (error.code === 'UNAUTHORIZED' || error.code === 'TOKEN_EXPIRED') &&
        !_isRetry
      ) {
        this.accessToken = null;
        const refreshed = await this.ensureFreshAccessToken();
        if (refreshed) {
          return this.authorizedRequest<T>(options, true, idempotencyKey);
        }
        if (!tokenStore.getRefreshToken()) {
          return {
            ok: false,
            status: 401,
            error: { code: 'UNAUTHORIZED', message: 'Session expired.' },
          };
        }
        return {
          ok: false,
          status: 0,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Could not reach the server.',
          },
        };
      }
      return { ok: false, status: 0, error };
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<{ message: string }>> {
    // The backend returns just a confirmation message here, not an updated
    // user — patch our own cached copy instead of expecting one back.
    const res = await this.authorizedRequest<{ message: string }>({
      method: 'POST',
      path: '/auth/change-password',
      body: { currentPassword, newPassword },
    });
    if (res.ok && this.currentUser) {
      this.currentUser = { ...this.currentUser, mustChangePassword: false };
    }
    return res;
  }

  async logout(allDevices = false): Promise<void> {
    if (this.accessToken) {
      try {
        await http.post(
          '/auth/logout',
          { allDevices },
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        );
      } catch {
        log.warn(
          'Logout call failed (offline?), clearing local session anyway',
        );
      }
    }
    this.clearSession();
  }
}

export default new AuthService();
