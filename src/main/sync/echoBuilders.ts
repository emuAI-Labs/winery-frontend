import {
  cacheKey,
  findAllCached,
  findByPath,
  getCached,
  putCached,
} from '../db/responseCache';
import { hasResolvedTo, isLocalToken } from './localIdMap';
import {
  Bill,
  MenuItem,
  Order,
  OrderLine,
  OrderLineStatus,
  OrderStatus,
  Payment,
} from '../../shared/salesTypes';

/** The only file in the sync engine with sales-domain knowledge — kept
 * isolated so the rest of the engine (cache, outbox, drain, local-id map)
 * stays domain-agnostic. Every function here reads/writes the SAME
 * response_cache entries the real GET endpoints populate, so the existing
 * react-query polling (`useOrder`'s 10s refetchInterval, etc.) picks up the
 * optimistic change automatically on its next offline-served read — no
 * renderer-side cache-patching needed. */

function orderCachePath(orderId: string): string {
  return `/orders/${orderId}`;
}

function getCachedOrder(orderId: string): Order | null {
  const entry = getCached(cacheKey('GET', orderCachePath(orderId)));
  if (!entry) return null;
  return (entry.data as { order: Order }).order;
}

function putCachedOrder(order: Order): void {
  const path = orderCachePath(order.id);
  putCached(cacheKey('GET', path), 'GET', path, undefined, { order });
}

function paymentsCachePath(billId: string): string {
  return `/orders/bills/${billId}/payments`;
}

function getCachedPayments(billId: string): Payment[] {
  const entry = getCached(cacheKey('GET', paymentsCachePath(billId)));
  if (!entry) return [];
  return (entry.data as { payments: Payment[] }).payments;
}

function putCachedPayments(billId: string, payments: Payment[]): void {
  const path = paymentsCachePath(billId);
  putCached(cacheKey('GET', path), 'GET', path, undefined, { payments });
}

function findMenuItem(menuItemId: string): MenuItem | null {
  const found = findByPath('/menu/items')
    .flatMap((entry) => (entry.data as { items?: MenuItem[] }).items ?? [])
    .find((item) => item.id === menuItemId);
  return found ?? null;
}

/** Bills only ever appear nested inside an order-detail cache entry, and
 * the record-payment endpoint's path only carries a billId — this walks
 * every cached order looking for the one that owns it. Cache stays small
 * for a single-branch till, so a full scan is cheap. */
function findOrderContainingBill(billId: string): Order | null {
  const found = findAllCached()
    .filter(({ path }) => /^\/orders\/[^/]+$/.test(path))
    .map(({ data }) => (data as { order?: Order }).order)
    .find((order) => order?.bills.some((b) => b.id === billId));
  return found ?? null;
}

export function echoOpenOrder(
  body: {
    branchId: string;
    orderType?: string;
    tableLabel?: string;
    seatLabel?: string;
    guestCount?: number;
  },
  mintLocalId: () => string,
): { order: Order } {
  const order: Order = {
    id: mintLocalId(),
    branchId: body.branchId,
    status: 'open',
    orderType: (body.orderType as Order['orderType']) ?? 'bar',
    tableLabel: body.tableLabel ?? null,
    seatLabel: body.seatLabel ?? null,
    guestCount: body.guestCount ?? null,
    lines: [],
    bills: [],
    createdAt: new Date().toISOString(),
  };
  putCachedOrder(order);
  return { order };
}

export function echoOrderStatus(
  orderId: string,
  status: OrderStatus,
): { order: Order } | null {
  const order = getCachedOrder(orderId);
  if (!order) return null;
  order.status = status;
  putCachedOrder(order);
  return { order };
}

/** Price is estimated client-side from the cached menu item's base price —
 * pricing rules (happy hour / quantity discount) are deliberately not
 * replicated here, matching the sales integration guide's own guidance that
 * client-side price preview is for display only, never authoritative. The
 * line is flagged `estimated: true` and corrected once the real request
 * syncs and the order is re-fetched from the server. */
export function echoAddOrderLine(
  orderId: string,
  body: {
    menuItemId: string;
    quantity: number;
    seatLabel?: string;
    notes?: string;
  },
  mintLocalId: () => string,
): { order: Order } | null {
  const order = getCachedOrder(orderId);
  if (!order) return null;

  const menuItem = findMenuItem(body.menuItemId);
  const unitPriceCents = menuItem?.priceCents ?? 0;
  const lineTotalCents = unitPriceCents * body.quantity;

  let bill = order.bills[0];
  if (!bill) {
    bill = {
      id: mintLocalId(),
      status: 'open',
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
    };
    order.bills = [...order.bills, bill];
  }

  const line: OrderLine = {
    id: mintLocalId(),
    menuItemId: body.menuItemId,
    billId: bill.id,
    quantity: body.quantity,
    unitPriceCents,
    lineTotalCents,
    status: 'pending',
    appliedRuleId: null,
    seatLabel: body.seatLabel ?? null,
    notes: body.notes ?? null,
    menuItem: menuItem ?? undefined,
    estimated: true,
  };
  order.lines = [...order.lines, line];
  bill.subtotalCents += lineTotalCents;
  bill.totalCents = bill.subtotalCents - bill.discountCents;

  putCachedOrder(order);
  return { order };
}

/** Resolves the local id(s) minted by one echoAddOrderLine call against the
 * server's response once that call finally syncs. `mintedIds` is exactly
 * what was minted during that one call, in call order: a bill id first if a
 * new bill was needed (echoAddOrderLine mints it before the line), then
 * always the line id. Because the drain loop replays add-line calls for the
 * same order strictly one at a time — never two in flight together — there
 * is always exactly one not-yet-attributed real line/bill after each
 * successful sync, so matching "the first real line/bill nothing has
 * resolved to yet" is unambiguous. */
export function resolveAddLineChainIds(
  mintedIds: string[],
  serverOrder: Order,
): Record<string, string> {
  const result: Record<string, string> = {};
  if (mintedIds.length === 0) return result;

  const unmappedLine = serverOrder.lines.find(
    (l) => !isLocalToken(l.id) && !hasResolvedTo(l.id),
  );
  const unmappedBill = serverOrder.bills.find(
    (b) => !isLocalToken(b.id) && !hasResolvedTo(b.id),
  );

  if (mintedIds.length === 2) {
    const [billLocalId, lineLocalId] = mintedIds;
    if (unmappedBill) result[billLocalId] = unmappedBill.id;
    if (unmappedLine) result[lineLocalId] = unmappedLine.id;
  } else if (mintedIds.length === 1 && unmappedLine) {
    result[mintedIds[0]] = unmappedLine.id;
  }
  return result;
}

export function echoLineStatus(
  orderId: string,
  lineId: string,
  status: OrderLineStatus,
): { order: Order } | null {
  const order = getCachedOrder(orderId);
  if (!order) return null;
  const line = order.lines.find((l) => l.id === lineId);
  if (!line) return null;
  line.status = status;
  if (status === 'served') line.servedAt = new Date().toISOString();
  putCachedOrder(order);
  return { order };
}

export function echoRecordPayment(
  billId: string,
  body: { method: Payment['method']; amountCents: number; mpesaCode?: string },
  mintLocalId: () => string,
): { payment: Payment } {
  const payment: Payment = {
    id: mintLocalId(),
    billId,
    method: body.method,
    amountCents: body.amountCents,
    mpesaCode: body.mpesaCode ?? null,
    mpesaStatus: body.method === 'mpesa' ? 'pending_confirmation' : null,
    voidedAt: null,
    createdAt: new Date().toISOString(),
    unsynced: true,
  };

  const payments = [...getCachedPayments(billId), payment];
  putCachedPayments(billId, payments);

  const order = findOrderContainingBill(billId);
  if (order) {
    const bill = order.bills.find((b): b is Bill => b.id === billId);
    if (bill) {
      const covered = payments
        .filter((p) => !p.voidedAt)
        .reduce((sum, p) => sum + p.amountCents, 0);
      if (covered >= bill.totalCents) bill.status = 'paid';
      putCachedOrder(order);
    }
  }

  return { payment };
}
