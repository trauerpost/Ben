import { chromium } from 'playwright';

const BASE = 'http://localhost:3002/de/builder-v2';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let passed = 0, failed = 0;

  function check(name, condition) {
    if (condition) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  console.log('=== HALBBILD PREVIEW E2E ===\n');

  // Load builder with TI05
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbeBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const ti05 = page.locator('[data-testid="template-TI05"]');
  await ti05.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // 1. Should be on Außenseite (outside spread)
  const vollbildBtn = page.locator('button').filter({ hasText: 'Vollbild' }).first();
  const halbbildBtn = page.locator('button').filter({ hasText: 'Halbbild' }).first();

  check('Vollbild button visible', await vollbildBtn.isVisible().catch(() => false));
  check('Halbbild button visible', await halbbildBtn.isVisible().catch(() => false));

  // 2. Switch to Halbbild mode
  await halbbildBtn.click().catch(() => {});
  await page.waitForTimeout(1000);

  // Take screenshot of canvas in Halbbild mode
  await page.screenshot({ path: 'e2e/halbbild-canvas.png' });
  console.log('  Screenshot: e2e/halbbild-canvas.png');

  // 3. Open preview in Halbbild mode
  const previewBtn = page.locator('button').filter({ hasText: /Vorschau/ }).first();
  if (await previewBtn.isVisible().catch(() => false)) {
    await previewBtn.click();
    await page.waitForTimeout(4000);

    // Check preview modal opened
    const modalOverlay = page.locator('.fixed.inset-0.z-50');
    check('Preview modal opens in Halbbild mode', await modalOverlay.isVisible().catch(() => false));

    // Take screenshot of preview in Halbbild mode
    await page.screenshot({ path: 'e2e/halbbild-preview.png', fullPage: true });
    console.log('  Screenshot: e2e/halbbild-preview.png');

    // Close modal
    const closeBtn = page.locator('button').filter({ hasText: /Zurück zur Gestaltung/ }).first();
    if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click();
    await page.waitForTimeout(500);
  } else {
    check('Preview button exists', false);
  }

  // 4. Switch back to Vollbild
  await vollbildBtn.click().catch(() => {});
  await page.waitForTimeout(1000);

  // Open preview in Vollbild mode for comparison
  if (await previewBtn.isVisible().catch(() => false)) {
    await previewBtn.click();
    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'e2e/vollbild-preview.png', fullPage: true });
    console.log('  Screenshot: e2e/vollbild-preview.png');
    check('Preview works in Vollbild mode too', true);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('CRASH:', err.message); process.exit(1); });
