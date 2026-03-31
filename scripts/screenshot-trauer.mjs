import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const BASE = "http://localhost:3000";

// Canvas builder: trauerkarte
const p1 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await p1.goto(`${BASE}/de/builder-v2`, { waitUntil: "networkidle" });
const trBtn = p1.locator('[data-testid="card-type-trauerkarte"]');
if (await trBtn.count() > 0) {
  await trBtn.click();
  await p1.waitForTimeout(800);
  await p1.screenshot({ path: "test-results/batch3-canvas-trauer-picker.png" });
  const tplBtns = p1.locator('[data-testid^="template-"]');
  const count = await tplBtns.count();
  console.log(`Trauerkarte templates: ${count}`);
  if (count > 0) {
    await tplBtns.first().click();
    await p1.waitForTimeout(3000);
    await p1.screenshot({ path: "test-results/batch3-canvas-trauer-TE01.png" });
    console.log("TE01 screenshot taken");
  }
} else {
  console.log("ERROR: trauerkarte button not found");
}
await p1.close();

// Canvas builder: dankkarte
const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await p2.goto(`${BASE}/de/builder-v2`, { waitUntil: "networkidle" });
const dkBtn = p2.locator('[data-testid="card-type-dankkarte"]');
if (await dkBtn.count() > 0) {
  await dkBtn.click();
  await p2.waitForTimeout(800);
  const tplBtns = p2.locator('[data-testid^="template-"]');
  const count = await tplBtns.count();
  console.log(`Dankkarte templates: ${count}`);
  if (count > 0) {
    await tplBtns.first().click();
    await p2.waitForTimeout(3000);
    await p2.screenshot({ path: "test-results/batch3-canvas-dank-TD01.png" });
    console.log("TD01 screenshot taken");
  }
} else {
  console.log("ERROR: dankkarte button not found");
}
await p2.close();

// Wizard: trauerkarte flow
const p3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await p3.goto(`${BASE}/de/builder`, { waitUntil: "networkidle" });
await p3.locator("button:has-text('Trauerkarte')").click();
await p3.waitForTimeout(500);
const nextBtn = p3.locator("button:has-text('Next')");
const disabled = await nextBtn.getAttribute("aria-disabled");
console.log(`Wizard Trauerkarte Next button disabled: ${disabled}`);
if (disabled !== "true") {
  await nextBtn.click();
  await p3.waitForTimeout(800);
  await p3.screenshot({ path: "test-results/batch3-wizard-trauer-templates.png" });
  console.log("Wizard trauerkarte template step screenshot taken");
}
await p3.close();

await browser.close();
console.log("DONE");
