import log from 'electron-log';
import { ApiRequestOptions } from '../../shared/authTypes';
import { OfflinePolicyName } from '../../shared/syncTypes';
import { Order, Payment } from '../../shared/salesTypes';
import {
  echoAddOrderLine,
  echoLineStatus,
  echoOpenOrder,
  echoOrderStatus,
  echoRecordPayment,
  resolveAddLineChainIds,
} from './echoBuilders';

export interface EchoContext {
  options: ApiRequestOptions;
  mintLocalId: () => string;
}

export interface PolicyRule {
  method: string;
  pattern: RegExp;
  policy: OfflinePolicyName;
  /** react-query key prefixes to invalidate in the renderer once this item
   * finally syncs — mirrors what each hook's own onSuccess already
   * invalidates today, just triggered again from the sync-completion event. */
  invalidates: (match: RegExpMatchArray) => string[][];
  /** pulls the server-issued id out of a successful sync response — used
   * when a rule mints exactly one local id per call (open order, payment) */
  extractServerId?: (data: unknown) => string | undefined;
  /** for rules that can mint more than one local id per call (add order
   * line, which may also mint a new bill) — maps each minted id to its real
   * counterpart once the call finally syncs */
  resolveIds?: (mintedIds: string[], data: unknown) => Record<string, string>;
  /** only present for queue-with-echo rules */
  echo?: (ctx: EchoContext, match: RegExpMatchArray) => unknown;
}

const RULES: PolicyRule[] = [
  // --- auth: not routed through this gateway at all, listed for completeness ---

  // --- till / orders (queue-with-echo: the one domain that needs it) ---
  {
    method: 'POST',
    pattern: /^\/orders$/,
    policy: 'queue-with-echo',
    invalidates: () => [['orders']],
    extractServerId: (d) => (d as { order?: { id: string } }).order?.id,
    echo: (ctx) =>
      echoOpenOrder(
        ctx.options.body as Parameters<typeof echoOpenOrder>[0],
        ctx.mintLocalId,
      ),
  },
  {
    method: 'PATCH',
    pattern: /^\/orders\/([^/]+)\/(hold|resume|close)$/,
    policy: 'queue-with-echo',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
    echo: (ctx, [, id, action]) => {
      const status =
        action === 'close' ? 'closed' : action === 'hold' ? 'held' : 'open';
      return echoOrderStatus(id, status);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/orders\/([^/]+)\/transfer$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/([^/]+)\/lines$/,
    policy: 'queue-with-echo',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
    echo: (ctx, [, id]) =>
      echoAddOrderLine(
        id,
        ctx.options.body as Parameters<typeof echoAddOrderLine>[1],
        ctx.mintLocalId,
      ),
    resolveIds: (mintedIds, data) =>
      resolveAddLineChainIds(mintedIds, (data as { order: Order }).order),
  },
  {
    method: 'PATCH',
    pattern: /^\/orders\/([^/]+)\/lines\/([^/]+)\/send$/,
    policy: 'queue-with-echo',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
    echo: (_ctx, [, orderId, lineId]) =>
      echoLineStatus(orderId, lineId, 'sent'),
  },
  {
    method: 'PATCH',
    pattern: /^\/orders\/([^/]+)\/lines\/([^/]+)\/serve$/,
    policy: 'queue-with-echo',
    invalidates: ([, id]) => [
      ['orders', 'detail', id],
      ['orders'],
      ['items'],
      ['stock'],
    ],
    echo: (_ctx, [, orderId, lineId]) =>
      echoLineStatus(orderId, lineId, 'served'),
  },
  {
    method: 'POST',
    pattern: /^\/orders\/([^/]+)\/lines\/([^/]+)\/void$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/([^/]+)\/bills\/split$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/([^/]+)\/bills\/join$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['orders', 'detail', id], ['orders']],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/bills\/([^/]+)\/discounts$/,
    policy: 'queue-blind',
    invalidates: () => [['orders'], ['orders', 'detail']],
  },
  {
    method: 'POST',
    pattern: /^\/orders\/bills\/([^/]+)\/payments$/,
    policy: 'queue-with-echo',
    invalidates: ([, billId]) => [['orders'], ['payments', billId]],
    extractServerId: (d) => (d as { payment?: Payment }).payment?.id,
    echo: (ctx, [, billId]) =>
      echoRecordPayment(
        billId,
        ctx.options.body as Parameters<typeof echoRecordPayment>[1],
        ctx.mintLocalId,
      ),
  },
  {
    method: 'POST',
    pattern: /^\/orders\/payments\/([^/]+)\/void$/,
    policy: 'queue-blind',
    invalidates: () => [['orders']],
  },
  {
    method: 'PATCH',
    pattern: /^\/orders\/payments\/([^/]+)\/confirm-mpesa$/,
    policy: 'network-only',
    invalidates: () => [],
  },

  // --- menu / pricing (back office, low urgency) ---
  {
    method: 'POST',
    pattern: /^\/menu\/items$/,
    policy: 'queue-blind',
    invalidates: () => [['menu-items']],
  },
  {
    method: 'PATCH',
    pattern: /^\/menu\/items\/([^/]+)$/,
    policy: 'queue-blind',
    invalidates: () => [['menu-items']],
  },
  {
    method: 'POST',
    pattern: /^\/menu\/items\/([^/]+)\/pricing-rules$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['pricing-rules', id]],
  },
  {
    method: 'PATCH',
    pattern: /^\/menu\/pricing-rules\/([^/]+)$/,
    policy: 'queue-blind',
    invalidates: () => [['pricing-rules']],
  },

  // --- inventory ---
  {
    method: 'POST',
    pattern: /^\/inventory\/receipts$/,
    policy: 'queue-blind',
    invalidates: () => [['items'], ['stock'], ['expiry-warnings']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/losses$/,
    policy: 'queue-blind',
    invalidates: () => [['items'], ['stock']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/items$/,
    policy: 'queue-blind',
    invalidates: () => [['items']],
  },
  {
    method: 'PATCH',
    pattern: /^\/inventory\/items\/([^/]+)$/,
    policy: 'queue-blind',
    invalidates: () => [['items']],
  },
  {
    method: 'PUT',
    pattern: /^\/inventory\/items\/([^/]+)\/branch-stock\/([^/]+)$/,
    policy: 'queue-blind',
    invalidates: () => [['items']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/recipes$/,
    policy: 'queue-blind',
    invalidates: () => [['recipes']],
  },
  {
    method: 'PATCH',
    pattern: /^\/inventory\/recipes\/([^/]+)$/,
    policy: 'queue-blind',
    invalidates: () => [['recipes']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/requisitions\/auto-generate$/,
    policy: 'queue-blind',
    invalidates: () => [['requisitions']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/requisitions\/([^/]+)\/approve$/,
    policy: 'queue-blind',
    invalidates: () => [['requisitions']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/stock-counts$/,
    policy: 'queue-blind',
    invalidates: () => [['stock-counts']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/stock-counts\/([^/]+)\/lines$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['stock-counts', 'detail', id]],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/stock-counts\/([^/]+)\/submit$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [
      ['stock-counts', 'detail', id],
      ['items'],
      ['stock'],
    ],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/transfers$/,
    policy: 'queue-blind',
    invalidates: () => [['transfers']],
  },
  {
    method: 'POST',
    pattern: /^\/inventory\/transfers\/([^/]+)\/(approve|complete|cancel)$/,
    policy: 'queue-blind',
    invalidates: () => [['transfers'], ['items'], ['stock']],
  },

  // --- expenses / shifts ---
  {
    method: 'POST',
    pattern: /^\/expenses$/,
    policy: 'queue-blind',
    invalidates: () => [['expenses'], ['expenses-due']],
  },
  {
    method: 'PATCH',
    pattern: /^\/expenses\/([^/]+)\/mark-paid$/,
    policy: 'queue-blind',
    invalidates: () => [['expenses'], ['expenses-due']],
  },
  {
    method: 'POST',
    pattern: /^\/shifts$/,
    policy: 'queue-blind',
    invalidates: () => [['shifts']],
  },
  {
    method: 'PATCH',
    pattern: /^\/shifts\/([^/]+)\/close$/,
    policy: 'queue-blind',
    invalidates: () => [['shifts']],
  },

  // --- reporting: the report builder's config layer is the only writable
  // part of /reports — every report itself is a read-only GET, covered
  // automatically without a rule here ---
  {
    method: 'POST',
    pattern: /^\/reports\/definitions$/,
    policy: 'queue-blind',
    invalidates: () => [['report-definitions']],
  },
  {
    method: 'POST',
    pattern: /^\/reports\/definitions\/([^/]+)\/schedules$/,
    policy: 'queue-blind',
    invalidates: ([, id]) => [['report-schedules', id]],
  },

  // --- auth actions that must always be live ---
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    policy: 'network-only',
    invalidates: () => [],
  },
  {
    method: 'POST',
    pattern: /^\/auth\/change-password$/,
    policy: 'network-only',
    invalidates: () => [],
  },

  // --- staff account management: always live. There's no sensible echo for
  // a created user (server assigns the id, and a manager needs to know
  // immediately whether it actually landed), and it's not a till-blocking
  // action worth queuing blind while offline. ---
  {
    method: 'POST',
    pattern: /^\/users$/,
    policy: 'network-only',
    invalidates: () => [['users']],
  },
  {
    method: 'PATCH',
    pattern: /^\/users\/([^/]+)$/,
    policy: 'network-only',
    invalidates: ([, id]) => [['users'], ['users', 'detail', id]],
  },
  {
    method: 'PATCH',
    pattern: /^\/users\/([^/]+)\/status$/,
    policy: 'network-only',
    invalidates: ([, id]) => [['users'], ['users', 'detail', id]],
  },
  {
    method: 'POST',
    pattern: /^\/users\/([^/]+)\/reset-password$/,
    policy: 'network-only',
    invalidates: () => [['users']],
  },
];

const DEFAULT_RULE: PolicyRule = {
  method: '*',
  pattern: /.*/,
  policy: 'queue-blind',
  invalidates: () => [],
};

export function resolvePolicy(options: ApiRequestOptions): {
  rule: PolicyRule;
  match: RegExpMatchArray;
} {
  const method = options.method ?? 'GET';
  const found = RULES.filter((rule) => rule.method === method)
    .map((rule) => ({ rule, match: options.path.match(rule.pattern) }))
    .find(
      (entry): entry is { rule: PolicyRule; match: RegExpMatchArray } =>
        !!entry.match,
    );
  if (found) return found;
  log.warn(
    `No offline policy rule matched ${method} ${options.path} — defaulting to queue-blind`,
  );
  return {
    rule: DEFAULT_RULE,
    match: options.path.match(/.*/) as RegExpMatchArray,
  };
}
