import { test, expect, devices } from "@playwright/test";
import path from "path";

/**
 * Mobile viewport tests for the wizard flow using iPhone 14 device profile.
 */

test.use({
  ...devices["iPhone 14"],
  navigationTimeout: 60000,
});

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

/** Click the wizard "Next →" button */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next →", exact: true }).click();
}

test.describe("Wizard Mobile (iPhone 14) — TI05 flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/de/builder", { waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "commit", timeout: 60000 });
    await page.waitForSelector("body", { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("TI05 full flow on mobile: select → bg → photo → text → preview", async ({ page }) => {
    // Step 1: Select Erinnerungsbild
    await page.getByText("Erinnerungsbild").click();

    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Step 2: Select Foto 50/50
    await page.getByText("Foto 50/50").click();
    await clickNext(page);

    // Step 3: Background — just advance
    await page.waitForTimeout(500);
    await clickNext(page);

    // Step 4: Photo upload
    await expect(page.getByText("Step 4 of 8")).toBeVisible();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await page.waitForTimeout(1500);

    // Crop canvas should be visible on mobile
    await expect(page.locator("canvas")).toBeVisible();

    // Zoom slider visible
    await expect(page.locator('input[type="range"]')).toBeVisible();

    // Step 5: Text
    await clickNext(page);
    await expect(page.getByText("Step 5 of 8")).toBeVisible();

    // Fill name
    await page.getByPlaceholder("Maria Musterfrau").fill("Mobile Test");

    // Next button should be visible and enabled on mobile
    const nextBtnText = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtnText).toBeVisible();
    await expect(nextBtnText).toBeEnabled();

    // Step 6: decorations
    await clickNext(page);
    await expect(page.getByText("Step 6 of 8")).toBeVisible();

    // Step 7: preview
    await clickNext(page);
    await expect(page.getByText("Step 7 of 8")).toBeVisible();
    await expect(page.getByText("Live preview")).toBeVisible();
  });

  test("Back button visible and functional on mobile", async ({ page }) => {
    // Navigate to step 2
    await page.getByText("Erinnerungsbild").click();
    await clickNext(page);

    await expect(page.getByText("Step 2 of 8")).toBeVisible();

    // Back button should be visible on mobile
    const backBtn = page.getByRole("button", { name: "← Back" });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Should be back on step 1
    await expect(page.getByText("Step 1 of 8")).toBeVisible();
  });
});
