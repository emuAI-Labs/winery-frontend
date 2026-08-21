import { _electron as electron } from 'playwright-core';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const app = await electron.launch({
  executablePath: '/home/patrick-ojiambo/Documents/winery/winery-frontend/node_modules/electron/dist/electron',
  args: ['--no-sandbox', '/home/patrick-ojiambo/Documents/winery/winery-frontend/release/app'],
  env: { ...process.env, DISPLAY: ':0', WINERY_API_BASE_URL: 'http://localhost:3000/api' },
  timeout: 30000,
});
const errors = [];
const page = app.windows()[0];
page.on('pageerror', (e) => { console.log('[PAGEERROR]', e.message); errors.push(e.message); });

async function robustClick(text) {
  const handle = await page.evaluateHandle((t) => {
    const els = [...document.querySelectorAll('button, a, [role="button"], [role="tab"]')];
    return els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t)) ?? null;
  }, text);
  const el = handle.asElement();
  if (!el) { console.log(`robustClick "${text}" -> NOT_FOUND`); return false; }
  await el.click({ force: true });
  console.log(`robustClick "${text}" -> OK`);
  return true;
}
async function body() { return page.evaluate(() => document.body.innerText); }

await sleep(1500);
await robustClick('Go to till');
await sleep(1200);
await robustClick('Reports');
await sleep(1500);
await robustClick('Report builder');
await sleep(1500);
console.log((await body()).slice(0, 400));
await page.screenshot({ path: '/tmp/shots/80-report-builder-tab.png' });

await robustClick('New');
await sleep(1000);
console.log((await body()).slice(0, 400));
await page.screenshot({ path: '/tmp/shots/81-new-report-dialog.png' });

const filled = await page.evaluate(() => {
  const input = document.getElementById('definitionName');
  if (!input) return 'NOT_FOUND';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'Daily sales');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return 'OK';
});
console.log('fill name ->', filled);

await robustClick('Save report');
await sleep(1500);
console.log((await body()).slice(0, 500));
await page.screenshot({ path: '/tmp/shots/82-report-saved.png' });

await robustClick('Daily sales');
await sleep(1000);
await robustClick('Run');
await sleep(1500);
console.log((await body()).slice(0, 800));
await page.screenshot({ path: '/tmp/shots/83-report-run.png' });

console.log('\n=== ERRORS ===', errors.length === 0 ? 'none' : errors.join('\n'));
await app.close();
console.log('DONE');
