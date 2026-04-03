import { test, expect } from "@playwright/test";
test("TI05 back page screenshot", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/de/builder-v2?_t=" + Date.now(), { waitUntil: "networkidle" });
  await page.click('[data-testid="card-type-sterbebild"]');
  await page.click('[data-testid="template-TI05"]');
  await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "e2e/screenshots/TI05-front.png" });

  // Switch to back page — use first matching button
  const backTab = page.locator('text="Rückseite"').first();
  await backTab.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "e2e/screenshots/TI05-back.png" });
});
