import { EventEmitter } from 'events';
import { AuthErrorCode } from '../../shared/authTypes';
import { ConnectivityState } from '../../shared/syncTypes';

/** No dedicated ping/heartbeat subsystem — this can run unattended on a bar
 * terminal, so we infer connectivity purely from real request outcomes
 * rather than generating ambient network traffic. Any successful gateway
 * request flips state to 'online'; any NETWORK_ERROR flips it to 'offline'.
 * Consumers that want to react to a reconnect (e.g. draining the outbox)
 * subscribe via onChange rather than this module knowing about them. */
class ConnectivityTracker extends EventEmitter {
  private state: ConnectivityState = 'online';

  private lastCachedAt: number | undefined;

  getState(): ConnectivityState {
    return this.state;
  }

  getLastCachedAt(): number | undefined {
    return this.lastCachedAt;
  }

  reportSuccess(): void {
    if (this.state !== 'online') {
      this.state = 'online';
      this.emit('change', this.state);
    }
  }

  reportFailure(code: AuthErrorCode): void {
    if (code !== 'NETWORK_ERROR') return;
    if (this.state !== 'offline') {
      this.state = 'offline';
      this.emit('change', this.state);
    }
  }

  noteCachedServe(cachedAt: number): void {
    this.lastCachedAt = cachedAt;
  }

  onChange(cb: (state: ConnectivityState) => void): () => void {
    this.on('change', cb);
    return () => this.off('change', cb);
  }
}

export default new ConnectivityTracker();
