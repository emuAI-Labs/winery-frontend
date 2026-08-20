import log from 'electron-log';
import authService from '../auth/authService';
import { cacheKey, getCached, putCached } from '../db/responseCache';
import { ApiRequestOptions, ApiResponse } from '../../shared/authTypes';
import connectivity from './connectivity';
import * as outbox from './outbox';
import * as localIdMap from './localIdMap';
import { resolvePolicy } from './offlinePolicy';

async function handleRead<T>(
  options: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const key = cacheKey('GET', options.path, options.query);
  const res = await authService.authorizedRequest<T>(options);

  if (res.ok) {
    putCached(key, 'GET', options.path, options.query, res.data);
    connectivity.reportSuccess();
    return { ...res, meta: { servedFromCache: false } };
  }

  if (res.error?.code === 'NETWORK_ERROR') {
    connectivity.reportFailure(res.error.code);
    const cached = getCached(key);
    if (cached) {
      connectivity.noteCachedServe(cached.cachedAt);
      return {
        ok: true,
        status: 200,
        data: cached.data as T,
        meta: { servedFromCache: true, cachedAt: cached.cachedAt },
      };
    }
  }
  return res;
}

async function handleWrite<T>(
  options: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const res = await authService.authorizedRequest<T>(options);
  if (res.ok) {
    connectivity.reportSuccess();
    return { ...res, meta: { queued: false } };
  }
  if (res.error?.code !== 'NETWORK_ERROR') {
    // Real rejection (validation, forbidden, conflict, expired session) —
    // never queue something the server has actually refused.
    return res;
  }

  connectivity.reportFailure(res.error.code);
  const { rule } = resolvePolicy(options);

  if (rule.policy === 'network-only') {
    return res;
  }

  const { id } = outbox.enqueue({
    method: options.method ?? 'POST',
    path: options.path,
    body: options.body,
    policy: rule.policy,
  });

  if (rule.policy === 'queue-blind') {
    return {
      ok: true,
      status: 202,
      data: { queued: true } as unknown as T,
      meta: { queued: true, outboxId: id },
    };
  }

  // queue-with-echo
  if (!rule.echo) {
    log.error(
      `Policy for ${options.method} ${options.path} is queue-with-echo but has no echo builder`,
    );
    return {
      ok: true,
      status: 202,
      data: { queued: true } as unknown as T,
      meta: { queued: true, outboxId: id },
    };
  }
  const match = options.path.match(rule.pattern) as RegExpMatchArray;

  // Track exactly which local ids THIS call mints (not any pre-existing
  // ones already baked into the cached objects it reads/echoes back) —
  // that's what lets the drain loop later resolve only what this specific
  // outbox row is responsible for.
  const mintedIds: string[] = [];
  const trackedMintLocalId = () => {
    const localId = localIdMap.mintLocalId();
    mintedIds.push(localId);
    return localId;
  };

  const echoData = rule.echo(
    { options, mintLocalId: trackedMintLocalId },
    match,
  );
  outbox.setEchoLocalIds(id, mintedIds);

  return {
    ok: true,
    status: 202,
    data: echoData as T,
    meta: { queued: true, outboxId: id, estimated: true },
  };
}

/** The one new choke point every renderer request passes through (wired in
 * place of a direct authService.authorizedRequest call in auth/ipc.ts).
 * Wraps, rather than modifies, authorizedRequest so token-refresh/401 logic
 * stays untouched — this only ever sees its FINAL result. */
export default async function gatewayRequest<T = unknown>(
  options: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET';

  if (method === 'GET') {
    return handleRead<T>(options);
  }
  return handleWrite<T>(options);
}
