import { EventEmitter } from 'events';
import log from 'electron-log';
import authService from '../auth/authService';
import { toAuthError } from '../auth/httpClient';
import { ApiRequestOptions } from '../../shared/authTypes';
import * as outbox from './outbox';
import * as localIdMap from './localIdMap';
import { resolvePolicy } from './offlinePolicy';
import connectivity from './connectivity';

const events = new EventEmitter();

/** Fired after a drain pass that synced at least one item, carrying the
 * aggregated react-query key prefixes to invalidate — so the renderer does
 * one batched sweep instead of per-item chatter. */
export function onDrainComplete(
  cb: (invalidates: string[][]) => void,
): () => void {
  events.on('drain-complete', cb);
  return () => events.off('drain-complete', cb);
}

let draining = false;

/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue --
 * this must process the outbox strictly in FIFO order, one request fully
 * completing before the next fires, so local-id dependencies resolve
 * correctly — an array-iteration/Promise.all style would break that. */
async function runDrainPass(): Promise<void> {
  const items = outbox.listReplayable();
  const invalidates: string[][] = [];

  for (const item of items) {
    const { path: resolvedPath, unresolved: pathUnresolved } =
      localIdMap.resolveInPath(item.path);
    const body = item.body ? JSON.parse(item.body) : undefined;
    const { body: resolvedBody, unresolved: bodyUnresolved } =
      localIdMap.resolveInBody(body);

    if (pathUnresolved.length > 0 || bodyUnresolved.length > 0) {
      outbox.markBlocked(item.id);
      continue;
    }

    outbox.markSyncing(item.id);
    const options: ApiRequestOptions = {
      method: item.method as ApiRequestOptions['method'],
      path: resolvedPath,
      body: resolvedBody,
    };
    const { rule, match } = resolvePolicy(options);

    const res = await authService.authorizedRequest(options, false, item.id);

    if (res.ok) {
      const mintedIds = outbox.getEchoLocalIds(item.id);
      if (mintedIds.length > 0) {
        const map = rule.resolveIds
          ? rule.resolveIds(mintedIds, res.data)
          : mintedIds.length === 1 && rule.extractServerId
            ? { [mintedIds[0]]: rule.extractServerId(res.data) ?? '' }
            : {};
        Object.entries(map).forEach(([localId, serverId]) => {
          if (serverId) localIdMap.recordMapping(localId, serverId);
        });
      }
      outbox.markSucceeded(item.id);
      invalidates.push(...rule.invalidates(match));
      connectivity.reportSuccess();
      continue;
    }

    const error = res.error ?? {
      code: 'UNKNOWN_ERROR',
      message: 'Sync failed.',
    };
    if (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'SERVICE_UNAVAILABLE'
    ) {
      outbox.markRetryable(item.id, error);
      connectivity.reportFailure(error.code);
      // Connectivity likely just dropped again — stop this pass rather than
      // hammering the remaining items.
      break;
    }
    log.warn(
      `Outbox item ${item.id} (${item.method} ${item.path}) rejected terminally`,
      error,
    );
    outbox.markConflict(item.id, error);
    // Terminal failure on one item doesn't block independent siblings —
    // only its own dependents, which converge to 'blocked' on the next pass.
  }

  if (invalidates.length > 0) {
    events.emit('drain-complete', invalidates);
  }
}
/* eslint-enable no-restricted-syntax, no-await-in-loop, no-continue */

/** Single-flight guarded — a reconnect event and the background timer can
 * both try to trigger a drain at once; only one pass runs at a time. */
export async function drainOutbox(): Promise<void> {
  if (draining) return;
  draining = true;
  try {
    await runDrainPass();
  } finally {
    draining = false;
  }
}

// Any real reconnect (not just a queued item succeeding) is worth an
// immediate drain attempt.
connectivity.onChange((state) => {
  if (state === 'online') {
    drainOutbox().catch((err) =>
      log.error('drainOutbox failed', toAuthError(err)),
    );
  }
});

/** No dedicated ping subsystem — this only re-attempts a drain if there's
 * actually something pending, so an idle till generates zero extra traffic. */
export function startBackgroundDrainTimer(): void {
  setInterval(() => {
    if (outbox.isEmpty()) return;
    drainOutbox().catch((err) =>
      log.error('drainOutbox failed', toAuthError(err)),
    );
  }, 25_000);
}
