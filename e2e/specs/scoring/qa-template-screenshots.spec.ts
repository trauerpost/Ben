/**
 * QA Template Screenshots — Canvas Builder V2
 *
 * Captures front (and back where applicable) screenshots of all
 * sterbebild templates TI05-TI09 for QA review.
 *
 * Usage:
 *   npx playwright test e2e/qa-template-screenshots.spec.ts --project=chromium
 *
 * Screenshots saved to: e2e/screenshots/{ID}-front-final.png
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "e2e", "screenshots");
const TEMPLATES = ["TI05", "TI06", "TI07", "TI08", "TI09"];
// TI05 sterbebild has a back page
const TEMPLATES_WITH_BACK = ["TI05"];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

for (const templateId of TEMPLATES) {
  test(`Screenshot ${templateId} front`, async ({ page }) => {
    // 1. Go to builder-v2
    await page.goto("/de/builder-v2");
    await page.waitForLoadState("networkidle");

    // 2. Click sterbebild card type
    const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
    await sterbebildBtn.waitFor({ state: "visible", timeout: 10000 });
    await sterbebildBtn.click();

    // 3. Wait for template grid
    await page.waitForTimeout(800);

    // 4. Click template
    const templateBtn = page.locator(`[data-testid="template-${templateId}"]`);
    await templateBtn.waitFor({ state: "visible", timeout: 10000 });
    await templateBtn.click();

    // 5. Wait for images/canvas to load
    await page.waitForTimeout(3000);

    // 6. Take front screenshot
    const frontPath = path.join(SCREENSHOTS_DIR, `${templateId}-front-final.png`);
    await page.screenshot({ path: frontPath, fullPage: false });
    console.log(`Saved: ${frontPath}`);

    // Verify file was created
    expect(fs.existsSync(frontPath)).toBe(true);
  });

  // 7. Back page for templates that have one
  if (TEMPLATES_WITH_BACK.includes(templateId)) {
    test(`Screenshot ${templateId} back`, async ({ page }) => {
      // Navigate and select template again
      await page.goto("/de/builder-v2");
      await page.waitForLoadState("networkidle");

      const sterbebildBtn = page.locator('[data-testid="card-type-sterbebild"]');
      await sterbebildBtn.waitFor({ state: "visible", timeout: 10000 });
      await sterbebildBtn.click();
      await page.waitForTimeout(800);

      const templateBtn = page.locator(`[data-testid="template-${templateId}"]`);
      await templateBtn.waitFor({ state: "visible", timeout: 10000 });
      await templateBtn.click();
      await page.waitForTimeout(3000);

      // Click "Ruckseite" tab (back page)
      // Try multiple selectors for the back tab
      const backTab = page.locator('text=ückseite').first()
        .or(page.locator('text=Ruckseite').first())
        .or(page.locator('text=Rück').first())
        .or(page.locator('[data-testid*="back"]').first());

      await backTab.waitFor({ state: "visible", timeout: 5000 });
      await backTab.click();
      await page.waitForTimeout(2000);

      const backPath = path.join(SCREENSHOTS_DIR, `${templateId}-back-final.png`);
      await page.screenshot({ path: backPath, fullPage: false });
      console.log(`Saved: ${backPath}`);

      expect(fs.existsSync(backPath)).toBe(true);
    });
  }
}
