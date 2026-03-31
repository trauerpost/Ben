import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const BASE = "http://localhost:3000";

// Screenshot every single template in both builders
const templates = ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"];

// WIZARD: select each template, go to preview step, screenshot
console.log("=== WIZARD: Every template ===");
for (const tpl of templates) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/de/builder`, { waitUntil: "networkidle" });
  await page.locator("button:has-text('Erinnerungsbild')").click();
  await page.waitForTimeout(300);
  await page.locator("button:has-text('Next')").click();
  await page.waitForTimeout(800);
  const btn = page.locator(`[data-testid="${tpl}"]`);
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(300);
    // Navigate to text step (skip photo)
    for (let i = 0; i < 3; i++) {
      const nb = page.locator("button:has-text('Next')");
      if (await nb.count() > 0 && await nb.getAttribute("aria-disabled") !== "true") {
        await nb.click(); await page.waitForTimeout(500);
      }
    }
    await page.screenshot({ path: `test-results/real-wizard-${tpl}.png` });
    console.log(`  wizard ${tpl}: screenshot taken`);
  }
  await page.close();
}

// CANVAS: select each template, screenshot the canvas
console.log("\n=== CANVAS: Every template ===");
for (const tpl of templates) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/de/builder-v2`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="card-type-sterbebild"]').click();
  await page.waitForTimeout(800);
  const btn = page.locator(`[data-testid="template-${tpl}"]`);
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `test-results/real-canvas-${tpl}.png` });
    console.log(`  canvas ${tpl}: screenshot taken`);
  }
  await page.close();
}

// WIZARD: trauerkarte + dankkarte
console.log("\n=== WIZARD: trauerkarte + dankkarte ===");
for (const ct of ["Trauerkarte", "Dankeskarte"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/de/builder`, { waitUntil: "networkidle" });
  await page.locator(`button:has-text("${ct}")`).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/real-wizard-${ct}.png` });
  // Try clicking single format
  const singleBtn = page.locator("button:has-text('Einfach')");
  if (await singleBtn.count() > 0) {
    await singleBtn.click();
    await page.waitForTimeout(300);
  }
  // Try next
  const nextBtn = page.locator("button:has-text('Next')");
  const disabled = await nextBtn.getAttribute("aria-disabled");
  if (disabled !== "true") {
    await nextBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: `test-results/real-wizard-${ct}-step2.png` });
  console.log(`  wizard ${ct}: screenshots taken`);
  await page.close();
}

// EN homepage
const enPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await enPage.goto(`${BASE}/en`, { waitUntil: "networkidle" });
await enPage.screenshot({ path: "test-results/real-en-homepage.png" });
await enPage.close();

// DE homepage
const dePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await dePage.goto(`${BASE}/de`, { waitUntil: "networkidle" });
await dePage.screenshot({ path: "test-results/real-de-homepage.png" });
await dePage.close();

await browser.close();
console.log("\nDONE — all screenshots in test-results/");
