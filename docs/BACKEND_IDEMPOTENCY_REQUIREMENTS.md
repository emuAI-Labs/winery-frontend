# Backend requirement: idempotency-key support for offline replay

## Why

The Electron frontend now works offline: any write that fails with a network
error is queued locally (SQLite) and replayed automatically once connectivity
returns. Replays reuse the exact same request the client originally tried to
send, tagged with a client-generated key.

Without server-side dedup on that key, a replay after a **partial success**
double-applies the write — e.g. the server received and processed a
`POST /inventory/receipts` call, but the connection dropped before the
client saw the response. The client has no way to distinguish "the server
never got this" from "the server got it but I never heard back," so on
reconnect it retries. Today that means the stock gets received twice.

## Contract

- The client sends an `Idempotency-Key: <uuid>` header on every **replayed**
  request. (Not on a request's first live attempt — only once it's been
  queued and is being retried after reconnect.)
- On receiving a request with an `Idempotency-Key` the server has already
  seen **for that endpoint**, do not re-execute the write's side effects —
  return the original response (same status code and body) instead.
- Store `(endpoint, idempotency_key) -> original response` for a bounded
  window — 24–48 hours is plenty; the client only ever retries within a
  single reconnect cycle, never days later.
- Key scope is **per endpoint**, not global — the client mints one key per
  queued item, one item per logical write, so `(method, path-template, key)`
  is the natural uniqueness scope. Two different endpoints seeing the same
  key value is not a collision.
- Recommended (not required by the client today, but worth adopting
  broadly): accept the same header on a request's first live attempt too,
  not just replays. That covers the same "processed but the response never
  arrived" case for an online user whose request timed out — the client
  doesn't currently send a key on first attempts, but could be updated to if
  the backend supports it everywhere below.

## Endpoints needing this, in priority order

Ranked by blast radius if double-applied:

1. **`POST /orders/bills/:billId/payments`** — double-payment risk. A
   duplicate cash/card/mpesa payment record overstates a bill as paid (or
   double-counts a cashier's till reconciliation).
2. **`POST /inventory/receipts`** — already flagged non-idempotent in the
   codebase (`useReceiveStock`'s own code comment) before this project
   started. Stock quantity double-counted on replay.
3. **`POST /inventory/losses`** — stock quantity double-deducted on replay.
4. **`POST /orders/:orderId/lines/:lineId/void`**
5. **`POST /orders/payments/:paymentId/void`**
6. **`POST /orders/:orderId/bills/split`**
7. **`POST /orders/:orderId/bills/join`**
8. **`POST /orders/bills/:billId/discounts`**
9. **`POST /inventory/stock-counts/:id/submit`** — generates stock
   adjustments; a duplicate submit would double-adjust.
10. **`POST /inventory/transfers/:id/complete`**
11. **`POST /inventory/transfers/:id/cancel`**
12. **`POST /inventory/requisitions/auto-generate`** — **open question, not
    an assumption**: its own doc comment already says "safe to call
    repeatedly — it won't create duplicates, only adjusts quantities on the
    existing open one." If that's accurate, this endpoint may already be
    naturally idempotent and not need a key at all. Please confirm rather
    than have us guess.

## Already safe — no change needed

- **`PATCH /orders/:orderId/lines/:lineId/serve`** — already documented
  idempotent server-side (keyed internally); the frontend already retries
  this one freely.
- Any plain `PUT` (e.g. `PUT /inventory/items/:itemId/branch-stock/:branchId`)
  — idempotent by HTTP semantics already.

## Out of scope for the backend

Everything else involved in making the till work offline — minting
temporary client-side ids for a not-yet-synced order/line/bill, estimating a
line's price from cached menu data until the real price syncs, caching GET
responses for offline reads — is entirely client-owned. A client-generated
`local-` id is always resolved to the real server-issued id before any
request reaches the backend; the backend will never see one.
