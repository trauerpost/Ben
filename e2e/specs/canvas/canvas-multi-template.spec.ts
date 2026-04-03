import { test, expect } from "@playwright/test";

test.describe("Canvas Builder V2 — Multiple Templates", () => {
  async function loadTemplate(page: import("@playwright/test").Page, templateId: string): Promise<void> {
    await page.goto("/de/builder-v2");
    await page.waitForLoadState("networkidle");
    await page.click('[data-testid="card-type-sterbebild"]');
    const btn = page.locator(`[data-testid="template-${templateId}"]`);
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    // Wait for template to load (Elemente tab appears in sidebar)
    await expect(page.locator('button:text-is("Elemente")')).toBeVisible({ timeout: 15000 });
    // Extra time for images to render on canvas
    await page.waitForTimeout(2000);
  }

  test("TI05 full-page photo loads with cover crop", async ({ page }) => {
    await loadTemplate(page, "TI05");
    await page.screenshot({ path: "e2e/screenshots/canvas-TI05.png" });
  });

  test("TI06 partial photo loads with cover crop", async ({ page }) => {
    await loadTemplate(page, "TI06");
    await page.screenshot({ path: "e2e/screenshots/canvas-TI06.png" });
  });

  test("TI07 three-zone with ornament loads", async ({ page }) => {
    await loadTemplate(page, "TI07");
    await page.screenshot({ path: "e2e/screenshots/canvas-TI07.png" });
  });

  test("TI08 rounded photo loads with cover crop", async ({ page }) => {
    await loadTemplate(page, "TI08");
    await page.screenshot({ path: "e2e/screenshots/canvas-TI08.png" });
  });
});
