# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Winery POS — an Electron + React desktop point-of-sale/back-office app for a
winery/bar business (till, inventory, sales, shifts, expenses, assets,
reporting). Built on the electron-react-boilerplate (ERB) toolchain
(`README.md` is the unmodified upstream ERB readme and does not describe this
app). The app talks to a separate backend HTTP API and works fully offline,
queuing writes locally and replaying them on reconnect.

## Commands

```bash
npm start              # dev mode: webpack-dev-server + electron, hot reload
npm run build           # build main + renderer into release/app/dist
npm run package          # full production package via electron-builder
npm run lint             # eslint . --ext .js,.jsx,.ts,.tsx
npm run lint:fix
npm exec tsc             # typecheck (no emit config; CI runs this separately from build)
npm test                 # jest
npm test -- path/to/file.test.tsx     # run a single test file
npm test -- -t "test name"            # run tests matching a name
```

CI (`.github/workflows/test.yml`) runs, in order: `npm run package`, `npm run
lint`, `npm exec tsc`, `npm test`, on macOS/Windows/Ubuntu. `npm run package`
running before lint/tsc means a build break is a valid CI failure mode
independent of type errors.

The backend API base URL is `WINERY_API_BASE_URL` (main-process env var,
defaults to `http://localhost:3000/api`) — see
`src/main/auth/httpClient.ts`.

### Running the app against a live backend / driving it programmatically

Use the `run-desktop` skill (`.claude/skills/run-desktop/SKILL.md`). Key
gotcha it documents: launching the unpacked `release/app` build directly
(vs. a real packaged install) needs `release/app/.erb/dll/preload.js`
manually copied there after every `npm run build`, or the app hangs forever
on the splash screen with no visible error (preload silently fails to
load). It also documents a Radix UI tab-switching quirk with plain DOM
`.click()` and the seeded superadmin login (`superadmin` /
`Winery#Dev2026`).

## Architecture

### Process split

- `src/main/` — Electron main process. Owns the backend HTTP client, auth
  token lifecycle, the local SQLite database, and the entire offline
  sync/outbox system. Nothing in the renderer talks to the backend or to
  SQLite directly.
- `src/renderer/` — React UI (renderer process). Talks to the main process
  exclusively through the IPC bridge exposed by `src/main/preload.ts`
  (`window.auth`, `window.api`, `window.sync`, `window.electron`).
- `src/shared/` — types shared by both processes (`*Types.ts` per domain:
  auth, inventory, sales, assets, audit, sync).

Path alias: `@/*` → `src/renderer/*` (see `tsconfig.json`), used throughout
renderer code instead of relative imports across features.

### The request gateway and offline sync (the core architectural idea)

Every renderer API call goes through `apiRequest()`
(`src/renderer/lib/apiClient.ts`) → `window.api.request` → IPC →
`src/main/sync/requestGateway.ts`. This is the single choke point that
decides, per request, what "offline" means:

- **GET requests** (`handleRead`): on success, cache the response
  (`src/main/db/responseCache.ts`, keyed by method+path+query). On a
  `NETWORK_ERROR`, fall back to the cached response if one exists (marked
  `meta.servedFromCache`).
- **Write requests** (`handleWrite`): on a real server rejection
  (validation, 403, 409, expired session, etc.) the error is returned as-is
  — never queued. Only a `NETWORK_ERROR` (request never reached the
  backend) triggers offline handling, per the policy in
  `src/main/sync/offlinePolicy.ts`:
  - `network-only` — never queue (e.g. login, change-password, M-Pesa
    confirm). Fails outright when offline.
  - `queue-blind` — enqueue in the SQLite outbox and return `{ queued: true
    }`; the UI doesn't get an optimistic shape back, just an ack.
  - `queue-with-echo` — enqueue *and* synthesize a plausible response
    (`src/main/sync/echoBuilders.ts`) using a client-minted local id
    (`local-…`, via `localIdMap.mintLocalId()`), so the till UI can keep
    working against a fake-but-shaped order/line/payment until the real one
    syncs. Used only where the till needs to keep operating uninterrupted
    (open order, add line, send/serve, record payment) — see the comment in
    `offlinePolicy.ts` on why it's the minority case.
  - Adding a new mutating endpoint means adding a `PolicyRule` in
    `offlinePolicy.ts` (method + path regex + policy + which react-query key
    prefixes to invalidate on eventual sync); an unmatched write defaults to
    `queue-blind` with a `log.warn`.
- **Draining the outbox** (`src/main/sync/drain.ts`, `outbox.ts`): on
  reconnect, queued requests replay in order; each mints an
  `Idempotency-Key` header for the replay (see
  `docs/BACKEND_IDEMPOTENCY_REQUIREMENTS.md` for the backend contract this
  depends on — several endpoints are **not yet safe to double-apply**
  server-side, so treat that doc as load-bearing, not aspirational).
  Once an item finally syncs, local ids are resolved to server ids
  (`localIdMap`) and the main process broadcasts `sync:invalidate` with the
  rule's `invalidates` key prefixes; the renderer's one global listener for
  this is `SyncInvalidationBridge` in `src/renderer/App.tsx` — individual
  hooks don't need their own offline-aware invalidation logic.
- Connectivity state itself (`src/main/sync/connectivity.ts`) is inferred
  from request success/failure, not a separate network probe.

When touching sync code, read `offlinePolicy.ts` top-to-bottom first — it's
the map of "what happens to every mutating endpoint when offline" and is
more informative than any individual hook.

### Renderer structure

- `src/renderer/features/<domain>/{pages,components,hooks}` — one folder per
  business domain (inventory, sales, assets, expenses, shifts, reports,
  audit, sync). Data-fetching hooks wrap `apiRequest` + TanStack Query
  (`useQuery`/`useMutation`), one hook file per resource
  (`useItems.ts`, `useOrders.ts`, ...). Mutations invalidate their own
  query-key prefix on success — see `useItems.ts` for the standard shape.
- `src/renderer/components/ui/` — shadcn/ui-style primitives wrapping
  Radix; generated/forwarding code, exempted from several lint rules (see
  `.eslintrc.js` overrides).
- `src/renderer/store/authStore.ts` — zustand store for auth state
  (`status`: `booting | signedOut | needsPasswordChange | signedIn`, etc.),
  bootstrapped once in `App.tsx`.
- `src/renderer/context/BranchContext.tsx` — selected-branch state,
  persisted to `localStorage`; most inventory/sales views are scoped to a
  branch.
- `src/renderer/context/ConnectivityContext.tsx` — surfaces main-process
  connectivity/sync status to the UI (offline banners, sync issue counts).
- Routing (`App.tsx`) is grouped by top-level area — `/till`, `/sales`,
  `/inventory`, `/assets`, `/audit` — each wrapped in `RequireAuth` and,
  per-route, `RequirePermission permission="…"`.

### Permissions (RBAC)

`src/renderer/lib/permissions.ts` defines a flat role hierarchy (`waiter <
bartender < supervisor < manager < owner < superadmin`) and a
`PERMISSION_MIN_ROLE` map from `Permission` strings (e.g.
`inventory:receive`, `sales:void`) to the minimum role that holds them.
`hasPermission(role, permission)` is a simple rank comparison — there's no
per-permission override or branch-scoping at this layer. `RequirePermission`
gates whole routes; check this file before assuming a role can/can't do
something, and add new permissions here (with `Permission` union) rather
than checking `role` directly in components.

### Testing

Jest + ts-jest + jsdom, config lives inline in `package.json` (not a
separate jest config file). `moduleNameMapper` stubs image/font imports and
CSS modules — see `package.json`'s `jest` key before adding a test that
imports either. Tests live under `src/__tests__/` currently (`App.test.tsx`
is the only one); there's no per-feature test convention established yet.
