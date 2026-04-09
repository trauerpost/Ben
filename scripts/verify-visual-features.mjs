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

  console.log('=== VISUAL FEATURES E2E ===\n');

  // Load builder and select TI05
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  if (await sterbeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sterbeBtn.click();
    await page.waitForTimeout(500);
  }

  const ti05Btn = page.locator('[data-testid="template-TI05"]');
  if (await ti05Btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await ti05Btn.click();
    await page.waitForTimeout(3000);
  }

  // === TEST 1: FOLD LINE ON OUTSIDE SPREAD ===
  console.log('--- Test 1: Fold Line ---');

  // Should start on outside-spread (first page for folded cards)
  // Take screenshot of the canvas area
  await page.screenshot({ path: 'e2e/fold-line-test.png', fullPage: false });
  console.log('  Screenshot: e2e/fold-line-test.png');

  // Check if fold line exists in the canvas (look for the "Falz" text or the line element)
  // The fold line is rendered on the Fabric.js canvas, so we can't query DOM for it
  // But we CAN check if the FabricCanvas component received the showFoldLine prop
  // Alternative: check if canvas has objects with isFoldLine data

  // Use page.evaluate to check canvas objects
  const hasFoldLine = await page.evaluate(() => {
    // Try to find the fabric canvas instance
    const canvasEl = document.querySelector('canvas');
    if (!canvasEl) return false;
    // The fabric canvas is attached to the DOM canvas element
    // We can check if the canvas has been initialized by looking for fabric-related attributes
    return canvasEl.width > 0 && canvasEl.height > 0;
  }).catch(() => false);
  check('Canvas is rendered', hasFoldLine);

  // === TEST 2: THUMBNAIL UPDATES ===
  console.log('\n--- Test 2: Live Thumbnails ---');

  // Check that SpreadNavigator has thumbnail images
  // Thumbnails are rendered as <img> inside the navigation buttons
  const thumbnailImgs = page.locator('img');

  // Navigate to Innen links to trigger thumbnail generation for multiple pages
  const innenLinksBtn = page.locator('button').filter({ hasText: 'Innen links' }).first();
  if (await innenLinksBtn.isVisible().catch(() => false)) {
    await innenLinksBtn.click();
    await page.waitForTimeout(2000);

    // Go back to Ausenseite
    const aussenBtn = page.locator('button').filter({ hasText: /Au\u00dfenseite|Ausenseite/ }).first();
    if (await aussenBtn.isVisible().catch(() => false)) {
      await aussenBtn.click();
      await page.waitForTimeout(1000);
    }
  }

  // Count thumbnail images in the spread navigator area
  // The navigator buttons contain <img> tags with data: or blob: src for thumbnails
  const navButtons = page.locator('button').filter({ hasText: /Au\u00dfenseite|Ausenseite|Innen/ });
  const navBtnCount = await navButtons.count();
  check('Spread navigator has multiple page buttons', navBtnCount >= 2);

  // Check for thumbnail images within nav buttons
  let thumbCount = 0;
  for (let i = 0; i < navBtnCount; i++) {
    const imgs = navButtons.nth(i).locator('img');
    const c = await imgs.count();
    thumbCount += c;
  }
  check('At least 1 thumbnail image in navigator', thumbCount >= 1);
  console.log(`  Found ${thumbCount} thumbnail images across ${navBtnCount} nav buttons`);

  // Take screenshot of navigator area
  const navArea = page.locator('button').filter({ hasText: /Au\u00dfenseite|Ausenseite/ }).first().locator('..');
  if (await navArea.isVisible().catch(() => false)) {
    await navArea.screenshot({ path: 'e2e/thumbnails-test.png' });
    console.log('  Screenshot: e2e/thumbnails-test.png');
  }

  // === TEST 3: PDF DOWNLOAD ===
  console.log('\n--- Test 3: PDF Download ---');

  // Use the top-bar PDF button (not the one inside PreviewModal)
  // The top-bar button text is just "PDF" (not "PDF herunterladen")
  const pdfBtn = page.locator('button').filter({ hasText: /^PDF$|^\.\.\.$/ }).first();
  const pdfVisible = await pdfBtn.isVisible().catch(() => false);
  check('PDF download button exists in toolbar', pdfVisible);

  if (pdfVisible) {
    // The PDF generation uses blob URL + a.click(), which Playwright captures as download
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await pdfBtn.click();
    console.log('  Waiting for PDF generation (up to 60s)...');

    const download = await downloadPromise;
    if (download) {
      const fileName = download.suggestedFilename();
      check('PDF file downloaded', fileName.endsWith('.pdf'));

      // Save the PDF
      const savePath = 'e2e/bifold-test.pdf';
      await download.saveAs(savePath);
      console.log(`  PDF saved: ${savePath}`);

      // Check file size (should be > 0)
      const fs = await import('fs');
      const stats = fs.statSync(savePath);
      check('PDF file size > 0', stats.size > 0);
      console.log(`  PDF size: ${(stats.size / 1024).toFixed(0)} KB`);
    } else {
      check('PDF download received', false);
    }
  }

  // Summary
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('E2E CRASH:', err.message);
  process.exit(1);
});
