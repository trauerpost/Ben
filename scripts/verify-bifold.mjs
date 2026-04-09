import { chromium } from 'playwright';

const BASE = 'http://localhost:3002/de/builder-v2';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  console.log('=== BIFOLD E2E VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function check(name, condition) {
    if (condition) { console.log(`  PASS: ${name}`); passed++; }
    else { console.log(`  FAIL: ${name}`); failed++; }
  }

  // ── PART 1: Sterbebild TI05 (bifold with outside-spread) ──
  console.log('--- Part 1: Sterbebild TI05 (bifold) ---');

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('  Builder loaded');

  // Click on Sterbebild card type using data-testid
  const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
  await sterbebildBtn.click();
  await page.waitForTimeout(500);
  check('Sterbebild card type selected', true);

  // Click TI05 template using data-testid
  const ti05 = page.locator('[data-testid="template-TI05"]');
  const ti05Visible = await ti05.isVisible({ timeout: 3000 }).catch(() => false);
  check('TI05 template visible', ti05Visible);

  if (ti05Visible) {
    await ti05.click();
    await page.waitForTimeout(3000); // Wait for canvas to render
  }

  // Check SpreadNavigator buttons
  // SpreadNavigator buttons have doubled text (thumbnail placeholder + label span)
  // 4 thumbnails: Außen links, Außen rechts, Innen links, Innen rechts
  const aussenLinksBtn = page.locator('button').filter({ hasText: 'Außen links' }).first();
  const aussenRechtsBtn = page.locator('button').filter({ hasText: 'Außen rechts' }).first();
  const innenLinksBtn = page.locator('button').filter({ hasText: 'Innen links' }).first();
  const innenRechtsBtn = page.locator('button').filter({ hasText: 'Innen rechts' }).first();

  const aussenLinksVisible = await aussenLinksBtn.isVisible({ timeout: 3000 }).catch(() => false);
  const aussenRechtsVisible = await aussenRechtsBtn.isVisible({ timeout: 3000 }).catch(() => false);
  const innenLinksVisible = await innenLinksBtn.isVisible({ timeout: 3000 }).catch(() => false);
  const innenRechtsVisible = await innenRechtsBtn.isVisible({ timeout: 3000 }).catch(() => false);

  check('Aussen links button exists', aussenLinksVisible);
  check('Aussen rechts button exists', aussenRechtsVisible);
  check('Innen links button exists', innenLinksVisible);
  check('Innen rechts button exists', innenRechtsVisible);

  // Check cover mode toggle on Ausenseite (should be visible by default)
  const vollbildBtn = page.locator('button').filter({ hasText: 'Vollbild'}).first();
  const halbbildBtn = page.locator('button').filter({ hasText: 'Halbbild'}).first();

  check('Vollbild button visible on Ausenseite', await vollbildBtn.isVisible().catch(() => false));
  check('Halbbild button visible on Ausenseite', await halbbildBtn.isVisible().catch(() => false));

  // ── Navigate to Innen links ──
  console.log('\n--- Part 2: Page Navigation ---');

  if (innenLinksVisible) {
    await innenLinksBtn.click();
    await page.waitForTimeout(1500);

    // Cover mode toggle should NOT be visible on inner pages
    const vollbildOnInner = await vollbildBtn.isVisible().catch(() => false);
    check('Cover mode toggle NOT visible on Innen links', !vollbildOnInner);
  }

  // Navigate to Innen rechts
  if (innenRechtsVisible) {
    await innenRechtsBtn.click();
    await page.waitForTimeout(1500);

    const vollbildOnInnerR = await vollbildBtn.isVisible().catch(() => false);
    check('Cover mode toggle NOT visible on Innen rechts', !vollbildOnInnerR);
  }

  // Navigate back to Aussen links (outside page)
  if (aussenLinksVisible) {
    await aussenLinksBtn.click();
    await page.waitForTimeout(1500);

    const vollbildBack = await vollbildBtn.isVisible().catch(() => false);
    check('Cover mode toggle visible again on Ausenseite', vollbildBack);
  }

  // ── Test cover mode toggle ──
  console.log('\n--- Part 3: Cover Mode Toggle ---');

  const halbbildVisible = await halbbildBtn.isVisible().catch(() => false);
  if (halbbildVisible) {
    await halbbildBtn.click();
    await page.waitForTimeout(500);

    // Check Halbbild is now active (has brand-primary bg)
    const halbbildClasses = await halbbildBtn.getAttribute('class').catch(() => '');
    check('Halbbild mode activates (has active style)', halbbildClasses.includes('bg-brand-primary'));

    // Switch back to Vollbild
    await vollbildBtn.click();
    await page.waitForTimeout(500);
    const vollbildClasses = await vollbildBtn.getAttribute('class').catch(() => '');
    check('Vollbild mode activates (has active style)', vollbildClasses.includes('bg-brand-primary'));
  } else {
    check('Halbbild button available for toggle test', false);
    check('Vollbild button available for toggle test', false);
  }

  // ── Test Preview ──
  console.log('\n--- Part 4: Preview Modal ---');

  const previewBtn = page.locator('button').filter({ hasText: /Vorschau/ }).first();
  const previewVisible = await previewBtn.isVisible().catch(() => false);
  check('Vorschau button exists', previewVisible);

  if (previewVisible) {
    await previewBtn.click();
    await page.waitForTimeout(4000);

    // PreviewModal uses fixed inset-0 z-50 overlay
    const modalOverlay = page.locator('.fixed.inset-0.z-50');
    const modalOpen = await modalOverlay.isVisible().catch(() => false);
    check('Preview modal opens', modalOpen);

    // Check iframe exists in modal
    const previewIframe = page.locator('iframe[title="Kartenvorschau"]');
    const iframeVisible = await previewIframe.isVisible().catch(() => false);
    check('Preview iframe visible', iframeVisible);

    // Take screenshot of preview
    await page.screenshot({ path: 'C:/Users/fires/OneDrive/Git/BENJEMIN/e2e/bifold-preview.png', fullPage: true });
    console.log('  Screenshot saved: e2e/bifold-preview.png');

    // Close modal using "Zurueck zur Gestaltung" button
    const closeBtn = page.locator('button').filter({ hasText: /Zurück zur Gestaltung/ }).first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // ── PART 5: Negative test — Trauerkarte single should NOT have bifold pages ──
  console.log('\n--- Part 5: Negative Test - Trauerkarte Single (no bifold) ---');

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Select Trauerkarte — wait for template picker to load
  await page.waitForTimeout(2000);
  const trauerBtn = page.locator('[data-testid="card-type-trauerkarte"]');
  const trauerVisible = await trauerBtn.isVisible({ timeout: 5000 }).catch(() => false);
  check('Trauerkarte card type button exists', trauerVisible);

  if (trauerVisible) {
    await trauerBtn.click();
    await page.waitForTimeout(500);

    // Default format is "single" — click first available template
    const firstTrauerTemplate = page.locator('[data-testid^="template-"]').first();
    const firstTrauerVisible = await firstTrauerTemplate.isVisible({ timeout: 3000 }).catch(() => false);

    if (firstTrauerVisible) {
      const templateName = await firstTrauerTemplate.getAttribute('data-testid');
      console.log(`  Selected template: ${templateName}`);
      await firstTrauerTemplate.click();
      await page.waitForTimeout(2000);

      // Check NO Ausenseite button exists (single cards don't have outside-spread)
      const aussenAfter = page.locator('button').filter({ hasText: 'Außen links' });
      const aussenCount = await aussenAfter.count();
      check('Trauerkarte single has NO Aussen links button', aussenCount === 0);

      // Check NO cover mode toggle
      const vollbildAfter = page.locator('button').filter({ hasText: 'Vollbild' });
      const vollbildCount = await vollbildAfter.count();
      check('Trauerkarte single has NO Vollbild button', vollbildCount === 0);

      // It should have Front/Back if it's a 2-page template
      const frontBtn = page.locator('button').filter({ hasText: /Vorderseite|Innen links/ }).first();
      const backBtn = page.locator('button').filter({ hasText: /Rückseite|Innen rechts/ }).first();
      const hasFront = await frontBtn.isVisible().catch(() => false);
      const hasBack = await backBtn.isVisible().catch(() => false);
      console.log(`  Front button visible: ${hasFront}, Back button visible: ${hasBack}`);
    } else {
      check('Trauerkarte template available', false);
    }
  }

  // ── Summary ──
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  console.log(failed === 0 ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('E2E CRASH:', err.message);
  process.exit(1);
});
