---
name: run-desktop
description: Build, run, and drive the Winery POS Electron desktop app against a live backend. Use when asked to start the app, screenshot it, or verify a change against the real API.
---

Winery POS is an Electron app. For agent/automated use, drive it via the
Playwright `_electron` REPL at `driver.mjs` in this directory. A real X
display was available in this environment (`DISPLAY=:0`, `xdpyinfo` confirms
it) — no `xvfb` was needed; use `xvfb-run` only if no display exists.

All paths are relative to the repo root unless noted.

## Build

```bash
npm run build   # builds both main and renderer into release/app/dist
```

## Gotcha: preload script path when launching the unpacked build directly

`src/main/main.ts` resolves the preload script differently depending on
`app.isPackaged`:
- packaged (real installs via `npm run package` / electron-builder): loads
  `dist/main/preload.js` — works out of the box.
- **not packaged** (which is what launching `electron release/app` directly
  for testing counts as, even though it's a production build): loads
  `../../.erb/dll/preload.js` relative to `dist/main`, i.e.
  `release/app/.erb/dll/preload.js` — which the plain `npm run build` never
  creates. Without it, `window.auth`/`window.api`/`window.sync` are all
  `undefined` and the app hangs forever on the splash screen with no visible
  error (only a silent preload-load failure in Electron's own log).

Workaround for local/agent testing (not needed for real packaged installs):

```bash
mkdir -p release/app/.erb/dll
cp release/app/dist/main/preload.js release/app/.erb/dll/preload.js
```

Redo this copy after every `npm run build`.

## Run (agent path)

```bash
DISPLAY=:0 WINERY_API_BASE_URL=http://localhost:3000/api \
  node .claude/skills/run-desktop/driver.mjs
```

`WINERY_API_BASE_URL` defaults to `http://localhost:3000/api` if unset — only
pass it explicitly if the backend runs elsewhere.

### Commands

| command | what it does |
|---|---|
| `launch` | launch the app, wait for windows |
| `ss [name]` | screenshot → `/tmp/shots/<name>.png` |
| `click <css-sel>` | click element via DOM `.click()` |
| `click-text <text>` | click first button/link/tab whose text matches |
| `fill <css-sel> <value>` | set an input's value via the React-safe native setter + input/change events |
| `type <text>` / `press <key>` | keyboard input |
| `wait <css-sel>` | wait for element, 10s timeout |
| `eval <js>` | evaluate in the page, print JSON |
| `text [css-sel]` | print innerText |
| `windows` | list windows |
| `quit` | close app, exit |

**`click-text`/DOM `.click()` doesn't always trigger Radix UI tab switches**
(seen on `TabsTrigger`) — if a click silently doesn't change what's on
screen, retry via a real Playwright element click instead:

```js
const h = await page.evaluateHandle((t) => {
  const els = [...document.querySelectorAll('[role="tab"]')];
  return els.find((e) => e.textContent?.includes(t));
}, 'Report builder');
await h.asElement().click({ force: true });
```

This was needed for the Reports page's tab bar; plain `page.evaluate(() =>
el.click())` looked like it worked (no error) but the tab content never
actually changed.

## Login for manual/agent testing

Seeded superadmin: `superadmin` / `Winery#Dev2026`, forces a password change
on first login (by design — see `ChangePasswordPage`).

## Run (human path)

```bash
npm start   # dev mode: webpack-dev-server + electron, opens a real window
```

## Troubleshooting

- **App stuck on "Loading…" forever, no console error**: preload script
  failed to load — see the Gotcha above.
- **`t.find is not a function` / similar minified pageerror on a fresh
  install with no seeded data**: check whether a hook assumes a bare-array
  API response where the backend actually wraps it in `{ resourceName:
  [...] }` — this class of bug has hit `branches`, `recipes`,
  `pricing-rules`, and `expiry-warnings` before; always verify a new
  endpoint's real response shape with `curl` against the live backend rather
  than trusting the integration-guide doc alone.
