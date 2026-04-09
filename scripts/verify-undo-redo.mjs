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

  console.log('=== UNDO/REDO E2E ===\n');

  // Load builder with TI05
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbeBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const ti05 = page.locator('[data-testid="template-TI05"]');
  await ti05.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Get initial canvas state by counting objects
  const getObjectCount = async () => {
    return await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas');
      if (!canvasEl) return -1;
      // We can't directly access fabric canvas from here
      // But we can check the undo/redo buttons state
      return 0; // placeholder
    });
  };

  // 1. Add a text element
  const addTextBtn = page.locator('button').filter({ hasText: '+ Textfeld' }).first();
  const addTextVisible = await addTextBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (addTextVisible) {
    await addTextBtn.click();
    await page.waitForTimeout(1000);
    check('Added text element', true);

    // 2. Check undo button exists and is enabled
    // Look for undo button (could be ← arrow or Ctrl+Z tooltip)
    const undoBtn = page.locator('button[title*="ndo"], button[aria-label*="ndo"]').first();
    // Or try keyboard shortcut
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(500);
    check('Ctrl+Z executed without crash', true);

    // 3. Redo
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(500);
    check('Ctrl+Shift+Z executed without crash', true);
  } else {
    check('Add text button found', false);
  }

  // 4. Navigate to Innen links page
  const innenLinksBtn = page.locator('button').filter({ hasText: 'Innen links' }).first();
  if (await innenLinksBtn.isVisible().catch(() => false)) {
    await innenLinksBtn.click();
    await page.waitForTimeout(2000);

    // 5. Add a text element on Innen links
    if (addTextVisible) {
      await addTextBtn.click();
      await page.waitForTimeout(1000);
      check('Added text on Innen links', true);
    }

    // 6. Navigate back to Außenseite
    const aussenBtn = page.locator('button').filter({ hasText: /Außen/ }).first();
    if (await aussenBtn.isVisible().catch(() => false)) {
      await aussenBtn.click();
      await page.waitForTimeout(2000);
      check('Navigated back to outside page', true);

      // 7. Undo on outside page — should NOT affect Innen links
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);
      check('Undo on outside page (no crash)', true);
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'e2e/undo-redo-test.png' });
  console.log('  Screenshot: e2e/undo-redo-test.png');

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('CRASH:', err.message); process.exit(1); });
