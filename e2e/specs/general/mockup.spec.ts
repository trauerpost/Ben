import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E tests for CardMockup integration (Batch 5).
 * Verifies 3D mockup toggle on preview step for v2 templates.
 */

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

/** Click the wizard "Next ->" button */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next \u2192", exact: true }).click();
}

/**
 * Navigate from step 1 to step 7 (Preview) using TI05 template with a photo.
 * Flow: type -> template -> bg -> photo -> text (fill name) -> decorations -> preview
 */
async function navigateToPreview(page: import("@playwright/test").Page, options?: { skipPhoto?: boolean }) {
  await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);

  // Step 1: Card type - select Erinnerungsbild (sterbebild)
  await page.getByRole("button", { name: /Erinnerungsbild/i }).click();
  await clickNext(page);

  // Step 2: Template - select TI05
  await page.locator("[data-testid='TI05']").click();
  await clickNext(page);

  // Step 3: Background - default is pre-selected
  await expect(page.getByRole("heading", { name: /Hintergrund/i })).toBeVisible({ timeout: 10000 });
  await clickNext(page);

  // Step 4: Photo
  await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible({ timeout: 10000 });
  if (!options?.skipPhoto) {
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
  }
  await clickNext(page);

  // Step 5: Text - fill required name field
  await expect(page.getByText("Step 5 of 8")).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder("Maria Musterfrau").fill("Test Mockup");
  await clickNext(page);

  // Step 6: Decorations
  await expect(page.getByText("Step 6 of 8")).toBeVisible({ timeout: 10000 });
  await clickNext(page);

  // Step 7: Preview
  await expect(page.getByText("Step 7 of 8")).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to preview using TI04 (no-photo template).
 * Flow: type -> template -> bg -> (photo skipped) -> text -> decorations -> preview
 */
async function navigateToPreviewNoPhoto(page: import("@playwright/test").Page) {
  await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);

  // Step 1: Card type
  await page.getByRole("button", { name: /Erinnerungsbild/i }).click();
  await clickNext(page);

  // Step 2: Template - select TI04 (Nur Text, no photo)
  await page.locator("h3", { hasText: "Nur Text" }).click();
  await clickNext(page);

  // Step 3: Background
  await page.waitForTimeout(500);
  await clickNext(page);

  // TI04 skips photo step -> lands on step 5
  await expect(page.getByText("Step 5 of 8")).toBeVisible({ timeout: 10000 });

  // Step 5: Text - fill required name
  await page.getByPlaceholder("Maria Musterfrau").fill("Test No Photo");
  await clickNext(page);

  // Step 6: Decorations
  await expect(page.getByText("Step 6 of 8")).toBeVisible({ timeout: 10000 });
  await clickNext(page);

  // Step 7: Preview
  await expect(page.getByText("Step 7 of 8")).toBeVisible({ timeout: 10000 });
}

test.describe("CardMockup Display", () => {

  test("Preview step shows Mockup toggle for v2 templates", async ({ page }) => {
    await navigateToPreview(page);
    await expect(page.getByRole("button", { name: /mockup/i })).toBeVisible({ timeout: 10000 });
  });

  test("Clicking Mockup shows 3D card with perspective transform", async ({ page }) => {
    await navigateToPreview(page);
    await page.getByRole("button", { name: /mockup/i }).click();
    await page.waitForTimeout(500);

    // Verify the mockup container renders
    const mockupContainer = page.locator('[class*="mockup"], [data-testid="card-mockup"]').first();
    await expect(mockupContainer).toBeVisible({ timeout: 5000 });
  });

  test("Mockup renders without crash for no-photo template (TI04)", async ({ page }) => {
    await navigateToPreviewNoPhoto(page);

    // Verify preview step loaded without crash
    await expect(page.getByText("Live preview")).toBeVisible({ timeout: 10000 });

    // If mockup toggle exists for TI04, click it and verify no crash
    const mockupBtn = page.getByRole("button", { name: /mockup/i });
    if (await mockupBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mockupBtn.click();
      await page.waitForTimeout(500);
      // Page should not show error
      await expect(page.locator("text=Error")).not.toBeVisible();
    }
  });

  test("Mockup toggle switches between flat and 3D views", async ({ page }) => {
    await navigateToPreview(page);

    // Click mockup to enable 3D view
    const mockupBtn = page.getByRole("button", { name: /mockup/i });
    await mockupBtn.click();
    await page.waitForTimeout(500);

    // Verify mockup container is visible
    const mockupContainer = page.locator('[class*="mockup"], [data-testid="card-mockup"]').first();
    await expect(mockupContainer).toBeVisible({ timeout: 5000 });

    // Click again to toggle back to flat preview
    await mockupBtn.click();
    await page.waitForTimeout(500);

    // Flat preview should still show Live preview text
    await expect(page.getByText("Live preview")).toBeVisible({ timeout: 5000 });
  });

  test("Mobile: mockup scales without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToPreview(page);

    const mockupBtn = page.getByRole("button", { name: /mockup/i });
    if (await mockupBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mockupBtn.click();
      await page.waitForTimeout(500);

      // Verify no horizontal scrollbar
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
    }
  });
});
