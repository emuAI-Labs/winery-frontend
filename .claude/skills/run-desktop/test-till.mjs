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
async function fillByLabel(labelText, value) {
  const r = await page.evaluate(({ labelText, value }) => {
    const labels = [...document.querySelectorAll('label')];
    const label = labels.find((l) => l.textContent?.trim().toLowerCase().includes(labelText.toLowerCase()));
    if (!label) return 'LABEL_NOT_FOUND';
    const forId = label.getAttribute('for');
    const input = forId ? document.getElementById(forId) : label.querySelector('input');
    if (!input) return 'INPUT_NOT_FOUND';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'OK';
  }, { labelText, value });
  console.log(`fill "${labelText}" ->`, r);
  return r;
}
async function body() { return page.evaluate(() => document.body.innerText); }
async function shot(name) { await page.screenshot({ path: `${SHOT_DIR}/${name}.png` }); console.log('screenshot:', name); }

await sleep(1500);
await clickText('Go to till');
await sleep(1500);

console.log('\n--- Open shift ---');
await clickText('Open shift');
await sleep(800);
await fillByLabel('Opening cash float', '5000');
await shot('40-open-shift-filled');
await clickText('Start shift');
await sleep(1500);
console.log((await body()).slice(0, 300));
await shot('41-shift-opened');

console.log('\n--- New tab ---');
await clickText('New tab');
await sleep(1000);
await fillByLabel('Table (opt.)', 'T1');
await shot('42-new-tab-filled');
await clickText('Open tab');
await sleep(2000);
console.log((await body()).slice(0, 600));
await shot('43-order-detail');

console.log('\n--- Add menu item (Whisky Tot) ---');
await clickText('Whisky Tot');
await sleep(1500);
console.log((await body()).slice(0, 800));
await shot('44-line-added');

console.log('\n--- Send ---');
await clickText('Send');
await sleep(1200);
await shot('45-sent');

console.log('\n--- Serve ---');
await clickText('Serve');
await sleep(1500);
console.log((await body()).slice(0, 800));
await shot('46-served');

console.log('\n--- Pay (cash) ---');
await clickText('Pay');
await sleep(1000);
await shot('47-pay-dialog');
console.log((await body()).slice(0, 600));
await clickText('Record cash');
await sleep(2000);
console.log((await body()).slice(0, 800));
await shot('48-paid');

console.log('\n--- Close tab ---');
await clickText('Close tab');
await sleep(1500);
console.log((await body()).slice(0, 500));
await shot('49-closed');

console.log('\n=== ERRORS ===');
console.log(errors.length === 0 ? 'none' : errors.join('\n---\n'));
await app.close();
console.log('DONE');
