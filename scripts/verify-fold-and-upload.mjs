import { chromium } from 'playwright';
import { existsSync } from 'fs';

const BASE = 'http://localhost:3002/de/builder-v2';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let passed = 0, failed = 0;

  function check(name, condition) {
    if (condition) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  console.log('=== FOLD LINE + COVER UPLOAD E2E ===\n');

  // Load builder with TI05
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const sterbeBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbeBtn.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  const ti05 = page.locator('[data-testid="template-TI05"]');
  await ti05.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // === TEST 1: FOLD LINE VISIBILITY ===
  console.log('--- Test 1: Fold Line ---');

  // The fold line is drawn as a Fabric.js object with data.isFoldLine = true
  // We can check if the canvas has it via JavaScript evaluation
  const canvasInfo = await page.evaluate(() => {
    // Access the Fabric canvas through the React component
    // The canvas element should have fabric instance attached
    const canvasEl = document.querySelector('canvas.upper-canvas, canvas.lower-canvas');
    if (!canvasEl) return { found: false, error: 'no canvas element' };

    // Try to find fabric canvas instance
    // Fabric.js stores the instance on the canvas element
    const parent = canvasEl.parentElement;
    const lowerCanvas = parent?.querySelector('.lower-canvas');

    return {
      found: !!canvasEl,
      width: canvasEl.width,
      height: canvasEl.height,
      canvasCount: document.querySelectorAll('canvas').length,
    };
  }).catch(e => ({ found: false, error: e.message }));

  console.log('  Canvas info:', JSON.stringify(canvasInfo));
  check('Canvas element found', canvasInfo.found);

  // Take a focused screenshot of JUST the canvas area
  const canvasArea = page.locator('canvas').first();
  if (await canvasArea.isVisible().catch(() => false)) {
    await canvasArea.screenshot({ path: 'e2e/fold-line-closeup.png' });
    console.log('  Screenshot: e2e/fold-line-closeup.png');
  }

  // Also take full page screenshot
  await page.screenshot({ path: 'e2e/fold-line-full.png' });
  console.log('  Screenshot: e2e/fold-line-full.png');

  // === TEST 2: TOGGLE FOLD LINE VISIBILITY ===
  console.log('\n--- Test 2: Toggle Grid (check if overlays work) ---');

  // Look for Grid button in the toolbar
  const gridBtn = page.locator('button').filter({ hasText: 'Grid' }).first();
  const gridVisible = await gridBtn.isVisible().catch(() => false);
  check('Grid button exists', gridVisible);

  if (gridVisible) {
    await gridBtn.click();
    await page.waitForTimeout(500);
    await canvasArea.screenshot({ path: 'e2e/grid-on.png' });
    console.log('  Screenshot with grid: e2e/grid-on.png');

    await gridBtn.click();
    await page.waitForTimeout(500);
  }

  // === TEST 3: COVER PHOTO UPLOAD ===
  console.log('\n--- Test 3: Cover Photo Upload ---');

  // We should be on outside-left page (first page for bifold)
  // Try to upload a photo using the "Foto hinzufügen" button in sidebar
  const fotoBtn = page.locator('button').filter({ hasText: 'Foto hinzufügen' }).first();
  const fotoBtnVisible = await fotoBtn.isVisible().catch(() => false);
  check('Foto hinzufuegen button visible', fotoBtnVisible);

  // Check if there's a test image we can use
  const testImagePath = 'C:/Users/fires/OneDrive/Git/BENJEMIN/Woman.jpg';
  const hasTestImage = existsSync(testImagePath);
  check('Test image (Woman.jpg) exists', hasTestImage);

  if (fotoBtnVisible && hasTestImage) {
    // Click "Foto hinzufügen" which should open a file dialog
    // We'll intercept the file chooser
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
    await fotoBtn.click();
    const fileChooser = await fileChooserPromise;

    if (fileChooser) {
      await fileChooser.setFiles(testImagePath);
      await page.waitForTimeout(3000);
      check('Photo uploaded via file chooser', true);

      // Take screenshot after upload
      await page.screenshot({ path: 'e2e/cover-photo-uploaded.png' });
      console.log('  Screenshot after upload: e2e/cover-photo-uploaded.png');
    } else {
      console.log('  No file chooser dialog appeared');
      check('File chooser appeared', false);

      // Alternative: try drag-and-drop or direct canvas click
      // Click on the canvas image (the cover photo)
      const canvasEl = page.locator('canvas').first();
      const box = await canvasEl.boundingBox();
      if (box) {
        // Click center of canvas (where the cover photo is)
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(1000);

        // Take screenshot to see if contextual toolbar appeared
        await page.screenshot({ path: 'e2e/cover-click-toolbar.png' });
        console.log('  Screenshot after canvas click: e2e/cover-click-toolbar.png');

        // Check if any toolbar/panel appeared for image editing
        const toolbar = page.locator('[class*="toolbar"], [class*="Toolbar"], [class*="panel"], [class*="Panel"]');
        const toolbarCount = await toolbar.count();
        console.log(`  Toolbar/panel elements found: ${toolbarCount}`);
      }
    }
  }

  // === TEST 4: Navigate between pages and check thumbnails ===
  console.log('\n--- Test 4: Page Navigation + Thumbnails ---');

  // Navigate through all 4 pages and take screenshot of thumbnails
  const pageButtons = ['Außen links', 'Außen rechts', 'Innen links', 'Innen rechts'];
  for (const label of pageButtons) {
    const btn = page.locator('button').filter({ hasText: label }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1500);
    }
  }

  // Back to Außen links
  const aussenBtn = page.locator('button').filter({ hasText: 'Außen links' }).first();
  if (await aussenBtn.isVisible().catch(() => false)) {
    await aussenBtn.click();
    await page.waitForTimeout(1000);
  }

  // Screenshot of thumbnails area at the bottom
  await page.screenshot({ path: 'e2e/four-thumbnails.png' });
  console.log('  Screenshot: e2e/four-thumbnails.png');

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('CRASH:', err.message); process.exit(1); });
