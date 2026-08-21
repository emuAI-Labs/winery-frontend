import { _electron as electron } from 'playwright-core';

const APP_DIR = '/home/patrick-ojiambo/Documents/winery/winery-frontend/release/app';
const ELECTRON_BIN = '/home/patrick-ojiambo/Documents/winery/winery-frontend/node_modules/electron/dist/electron';
const SHOT_DIR = '/tmp/shots';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  const f = `${SHOT_DIR}/${name}.png`;
  await page.screenshot({ path: f });
  console.log('screenshot:', f);
}

async function clickText(page, text) {
  const r = await page.evaluate((t) => {
    const els = [...document.querySelectorAll('button, a, [role="button"], [role="tab"]')];
    const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
    if (!el) return 'NOT_FOUND';
    el.click();
    return 'OK: ' + el.tagName + ' "' + el.textContent.trim().slice(0, 40) + '"';
  }, text);
  console.log(`click-text "${text}" ->`, r);
  return r;
}

async function fillByLabel(page, labelText, value) {
  const r = await page.evaluate(
    ({ labelText, value }) => {
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
    },
    { labelText, value },
  );
  console.log(`fill "${labelText}" ->`, r);
  return r;
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function step(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    await fn();
  } catch (e) {
    console.log('STEP ERROR:', e.message);
  }
}

const app = await electron.launch({
  executablePath: ELECTRON_BIN,
  args: ['--no-sandbox', APP_DIR],
  env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' },
  timeout: 30_000,
});

const consoleErrors = [];
app.on('console', (msg) => {
  const line = `[renderer console] ${msg.type()}: ${msg.text()}`;
  console.log(line);
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

let page = app.windows().find((w) => !w.url().startsWith('devtools://')) ?? (await app.firstWindow());
await page.waitForLoadState('domcontentloaded');
await sleep(2000);

await step('Initial load (should be login page)', async () => {
  console.log(await bodyText(page));
  await shot(page, '01-initial');
});

await step('Login as superadmin', async () => {
  await fillByLabel(page, 'Username', 'superadmin');
  await fillByLabel(page, 'Password', 'Winery#Dev2026');
  await shot(page, '02-login-filled');
  await clickText(page, 'Sign in');
  await sleep(2500);
  console.log(await bodyText(page));
  await shot(page, '03-after-login');
});

await step('Forced password change', async () => {
  const text = await bodyText(page);
  if (!text.includes('new password')) {
    console.log('Did NOT land on change-password screen as expected. Body:', text);
    return;
  }
  await fillByLabel(page, 'Current password', 'Winery#Dev2026');
  await fillByLabel(page, 'New password', 'NewSuper#2026');
  await fillByLabel(page, 'Confirm new password', 'NewSuper#2026');
  await shot(page, '04-change-password-filled');
  await clickText(page, 'Save new password');
  await sleep(2500);
  console.log(await bodyText(page));
  await shot(page, '05-after-password-change');
});

await step('Till home', async () => {
  console.log('URL/body check:', (await bodyText(page)).slice(0, 200));
  await shot(page, '06-till-home');
});

await step('Navigate to Till orders', async () => {
  await clickText(page, 'Go to till');
  await sleep(2000);
  console.log(await bodyText(page));
  await shot(page, '07-till-orders');
});

await step('Open new tab dialog', async () => {
  await clickText(page, 'New tab');
  await sleep(1000);
  console.log(await bodyText(page));
  await shot(page, '08-new-tab-dialog');
  // close dialog via Escape
  await page.keyboard.press('Escape');
  await sleep(500);
});

await step('Navigate to Inventory via nav sidebar', async () => {
  const r = await clickText(page, 'Stock overview');
  if (r === 'NOT_FOUND') {
    // maybe not in AppShell yet; go via URL nav using in-app link
    console.log('Stock overview link not found on this screen');
  }
  await sleep(2000);
  console.log(await bodyText(page));
  await shot(page, '09-inventory-stock-overview');
});

await step('Inventory nav: Catalogue', async () => {
  await clickText(page, 'Catalogue');
  await sleep(1500);
  console.log(await bodyText(page));
  await shot(page, '10-inventory-catalogue');
});

await step('Sales nav: Menu', async () => {
  await clickText(page, 'Menu');
  await sleep(1500);
  console.log(await bodyText(page));
  await shot(page, '11-sales-menu');
});

await step('Sales nav: Reports', async () => {
  await clickText(page, 'Reports');
  await sleep(2000);
  console.log(await bodyText(page));
  await shot(page, '12-reports');
});

await step('Reports tab: Sales summary contents check', async () => {
  console.log((await bodyText(page)).slice(0, 500));
});

await step('Sales nav: Shifts', async () => {
  await clickText(page, 'Shifts');
  await sleep(1500);
  console.log(await bodyText(page));
  await shot(page, '13-shifts');
});

await step('Sales nav: Expenses', async () => {
  await clickText(page, 'Expenses');
  await sleep(1500);
  console.log(await bodyText(page));
  await shot(page, '14-expenses');
});

await step('Sales nav: Sync issues', async () => {
  await clickText(page, 'Sync issues');
  await sleep(1500);
  console.log(await bodyText(page));
  await shot(page, '15-sync-issues');
});

await step('Check for offline banner (should be absent, backend is up)', async () => {
  const text = await bodyText(page);
  console.log('Contains "Offline":', text.includes('Offline'));
});

console.log('\n=== Console errors seen ===');
console.log(consoleErrors.length === 0 ? 'none' : consoleErrors.join('\n'));

await app.close();
console.log('\nDONE');
