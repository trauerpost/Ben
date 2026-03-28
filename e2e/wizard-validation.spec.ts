import { test, expect } from "@playwright/test";

/**
 * E2E tests for validation & error handling (Batch 3):
 * - Inline validation on StepText
 * - Replace alert() with inline error in StepPhoto
 * - Disabled Next button reason text
 */

test.use({ navigationTimeout: 60000 });

async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →" }).click();
}

async function navigateToStepText(page: import("@playwright/test").Page) {
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);
  await page.getByTestId("TI05").click();
  await clickNext(page);
  await clickNext(page); // skip photo
  await page.waitForTimeout(500);
}

async function navigateToStepPhoto(page: import("@playwright/test").Page) {
  await page.getByText("Erinnerungsbild").click();
  await clickNext(page);
  await page.getByTestId("TI05").click();
  await clickNext(page);
  await page.waitForTimeout(500);
}

test.describe("Wizard Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForTimeout(2000);
  });

  test("1. Step 4: empty name + click Next → validation message visible", async ({ page }) => {
    await navigateToStepText(page);
    // Don't fill the name — click Next
    await clickNext(page);
    // Validation message should appear
    await expect(page.locator("p.text-red-500", { hasText: /Namen/ })).toBeVisible();
  });

  test("2. Step 4: type name → validation disappears, Next works", async ({ page }) => {
    await navigateToStepText(page);
    // Click Next without name
    await clickNext(page);
    await expect(page.locator("p.text-red-500")).toBeVisible();
    // Now type a name
    await page.getByPlaceholder("Maria Musterfrau").fill("Test Name");
    // Click Next again — should navigate to step 5
    await clickNext(page);
    // Should be on step 5 (decorations)
    await expect(page.locator("p.text-red-500")).not.toBeVisible();
  });

  test("3. Step 3: upload >10MB → inline error (not browser alert)", async ({ page }) => {
    await navigateToStepPhoto(page);
    // Create a fake file >10MB
    const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    // Listen for dialog (alert) — it should NOT fire
    let alertFired = false;
    page.on("dialog", () => { alertFired = true; });

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "large.jpg",
      mimeType: "image/jpeg",
      buffer,
    });

    // Inline error should appear
    await expect(page.locator(".bg-red-50", { hasText: /zu groß|too large/i })).toBeVisible({ timeout: 3000 });
    expect(alertFired).toBe(false);
  });

  test("4. Step 3: error auto-dismisses after 5 seconds", async ({ page }) => {
    await navigateToStepPhoto(page);
    const buffer = Buffer.alloc(11 * 1024 * 1024);
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "large.jpg",
      mimeType: "image/jpeg",
      buffer,
    });
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 3000 });
    // Wait 5.5s for auto-dismiss
    await page.waitForTimeout(5500);
    await expect(page.locator(".bg-red-50")).not.toBeVisible();
  });

  test("5. Step 1: click Next without selecting card type → validation reason", async ({ page }) => {
    // On step 1, don't select anything, click Next
    await clickNext(page);
    // Should still be on step 1 (Next is disabled, but clicking triggers validation)
    // The validation reason text should appear on desktop
    await expect(page.locator("span.text-red-400")).toBeVisible();
  });
});
