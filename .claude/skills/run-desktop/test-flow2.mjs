import { _electron as electron } from 'playwright-core';

const APP_DIR = '/home/patrick-ojiambo/Documents/winery/winery-frontend/release/app';
const ELECTRON_BIN = '/home/patrick-ojiambo/Documents/winery/winery-frontend/node_modules/electron/dist/electron';
const SHOT_DIR = '/tmp/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: ['--no-sandbox', APP_DIR],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0', WINERY_API_BASE_URL: 'http://localhost:3000/api' },
  timeout: 30_000,
});

const errors = [];
let page = app.windows()[0];
page.on('pageerror', (e) => {
  console.log('[PAGEERROR]', e.message);
  errors.push(e.message);
});
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text());
});

async function clickText(text) {
  const r = await page.evaluate((t) => {
    const els = [...document.querySelectorAll('button, a, [role="button"], [role="tab"]')];
    const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
    if (!el) return 'NOT_FOUND';
    el.click();
    return 'OK';
  }, text);
  console.log(`click "${text}" ->`, r);
  return r;
}
async function body() {
  return page.evaluate(() => document.body.innerText);
}
async function shot(name) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
  console.log('screenshot:', name);
}
async function visit(navText, shotName) {
  console.log(`\n--- ${navText} ---`);
  const r = await clickText(navText);
  await sleep(1800);
  const errCountBefore = errors.length;
  const b = await body();
  console.log(b.slice(0, 400));
  await shot(shotName);
  if (errors.length > errCountBefore) console.log('*** NEW ERROR ON THIS SCREEN ***');
  return { clicked: r, body: b };
}

await sleep(1500);
console.log('start body:', (await body()).slice(0, 200));

await visit('Go to till', '20-till');
await visit('Stock overview', '21-stock-overview');
await visit('Catalogue', '22-catalogue');
await visit('Receive stock', '23-receiving');
await visit('Breakage & loss', '24-losses');
await visit('Transfers', '25-transfers');
await visit('Requisitions', '26-requisitions');
await visit('Stock takes', '27-stock-takes');
await visit('Reports', '28-inventory-reports'); // inventory reports (last "Reports" in sidebar, but Sales Reports may match first)
await visit('Menu', '29-menu');
await visit('M-PESA reconciliation', '30-mpesa');
await visit('Shifts', '31-shifts');
await visit('Expenses', '32-expenses');
await visit('Sync issues', '33-sync-issues');

console.log('\n=== ALL PAGE ERRORS ===');
console.log(errors.length === 0 ? 'none' : errors.join('\n---\n'));

await app.close();
console.log('DONE');
