import fs from 'fs';
import path from 'path';
import { app, safeStorage } from 'electron';
import log from 'electron-log';
import { AuthUser } from '../../shared/authTypes';

interface PersistedSession {
  refreshToken: string;
  user: AuthUser;
}

const SESSION_FILE = () => path.join(app.getPath('userData'), 'session.dat');

/**
 * Refresh token is the real credential (30 day lifetime) — it must never
 * touch localStorage/renderer or plain disk. We encrypt it at rest with the
 * OS keychain via safeStorage and only ever hold it here, in the main
 * process. The cached user travels alongside it purely so a cold start with
 * no network can still show who was last signed in (offline banner), never
 * to authenticate anything.
 */
class TokenStore {
  private cached: PersistedSession | null = null;

  private loaded = false;

  private load(): PersistedSession | null {
    if (this.loaded) return this.cached;
    this.loaded = true;
    try {
      const raw = fs.readFileSync(SESSION_FILE());
      const canDecrypt = safeStorage.isEncryptionAvailable();
      const json = canDecrypt
        ? safeStorage.decryptString(raw)
        : raw.toString('utf-8');
      this.cached = JSON.parse(json) as PersistedSession;
    } catch {
      this.cached = null;
    }
    return this.cached;
  }

  getRefreshToken(): string | null {
    return this.load()?.refreshToken ?? null;
  }

  getCachedUser(): AuthUser | null {
    return this.load()?.user ?? null;
  }

  save(refreshToken: string, user: AuthUser): void {
    this.cached = { refreshToken, user };
    this.loaded = true;
    const json = JSON.stringify(this.cached);
    try {
      const canEncrypt = safeStorage.isEncryptionAvailable();
      const payload = canEncrypt
        ? safeStorage.encryptString(json)
        : Buffer.from(json, 'utf-8');
      if (!canEncrypt) {
        log.warn(
          'safeStorage encryption unavailable — session persisted unencrypted. ' +
            'This is expected on some Linux dev setups without a keyring; ' +
            'never ship a build like this to a till.',
        );
      }
      fs.mkdirSync(path.dirname(SESSION_FILE()), { recursive: true });
      fs.writeFileSync(SESSION_FILE(), payload, { mode: 0o600 });
    } catch (err) {
      log.error('Failed to persist session', err);
    }
  }

  clear(): void {
    this.cached = null;
    this.loaded = true;
    try {
      fs.rmSync(SESSION_FILE(), { force: true });
    } catch (err) {
      log.error('Failed to clear persisted session', err);
    }
  }
}

export default new TokenStore();
