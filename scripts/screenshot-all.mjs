import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const BASE = "http://localhost:3000";
const templates = ["TI04", "TI05", "TI06", "TI07", "TI08", "TI09"];

for (const tpl of templates) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/de/builder-v2`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="card-type-sterbebild"]').click();
  await page.waitForTimeout(800);
  const btn = page.locator(`[data-testid="template-${tpl}"]`);
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(3000); // extra time for image loading
    await page.screenshot({ path: `test-results/batch2-canvas-${tpl}.png` });
    console.log(`${tpl}: screenshot taken`);
  }
  await page.close();
}

await browser.close();
console.log("DONE");
