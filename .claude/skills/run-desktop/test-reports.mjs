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
const page = app.windows()[0];
page.on('pageerror', (e) => { console.log('[PAGEERROR]', e.message); errors.push(e.message); });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()); });

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
async function body() { return page.evaluate(() => document.body.innerText); }
async function shot(name) { await page.screenshot({ path: `${SHOT_DIR}/${name}.png` }); console.log('screenshot:', name); }
async function visit(navText, shotName) {
  console.log(`\n--- ${navText} ---`);
  const errBefore = errors.length;
  await clickText(navText);
  await sleep(1800);
  console.log((await body()).slice(0, 500));
  await shot(shotName);
  if (errors.length > errBefore) console.log('*** NEW ERROR ***');
}

await sleep(1500);
await clickText('Go to till');
await sleep(1200);

await visit('Reports', '60-reports-sales-summary');
await visit('Top sellers', '61-top-sellers');
await visit('Peak hours', '62-peak-hours');
await visit('Customer trends', '63-customer-trends');
await visit('Profitability', '64-profitability');
await visit('Shift variance', '65-shift-variance');
await visit('Expense summary', '66-expense-summary');
await visit('Cross-branch', '67-cross-branch');
await visit('Report builder', '68-report-builder');

console.log('\n--- Create a report definition ---');
await clickText('New');
await sleep(1000);
await shot('69-new-report-dialog');
const nameFilled = await page.evaluate(() => {
  const input = document.getElementById('definitionName');
  if (!input) return 'NOT_FOUND';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Daily sales');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return 'OK';
});
console.log('fill name ->', nameFilled);
await clickText('Save report');
await sleep(1500);
console.log((await body()).slice(0, 500));
await shot('70-report-saved');

console.log('\n--- Run it ---');
await clickText('Daily sales');
await sleep(800);
await clickText('Run');
await sleep(1500);
console.log((await body()).slice(0, 700));
await shot('71-report-run');

console.log('\n--- Catalogue: edit item ---');
await clickText('Catalogue');
await sleep(1500);
console.log((await body()).slice(0, 500));
await shot('72-catalogue');

console.log('\n--- Receiving: item picker ---');
await clickText('Receive stock');
await sleep(1200);
await clickText('Search items…');
await sleep(500);
await page.keyboard.type('Johnnie');
await sleep(800);
console.log((await body()).slice(0, 500));
await shot('73-receiving-item-picker');

console.log('\n=== ERRORS ===');
console.log(errors.length === 0 ? 'none' : errors.join('\n---\n'));
await app.close();
console.log('DONE');
