import { test, expect } from "@playwright/test";
import path from "path";

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");
const SECOND_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-simple.svg");

/**
 * Helper: navigate from step 1 to step 4 (Photo).
 * Flow: select Erinnerungsbild (sterbebild) → pick TI05 template → pick first background → land on Photo step.
 */
async function navigateToPhotoStep(page: import("@playwright/test").Page) {
  await page.goto("/de/builder", { waitUntil: "commit" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit" });
  await page.waitForTimeout(2000);

  // Step 1: Card type — select Erinnerungsbild (sterbebild)
  await page.getByRole("button", { name: /Erinnerungsbild/i }).click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // Step 2: Template — select TI05
  await page.locator("[data-testid='TI05']").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // Step 3: Background — a default color is pre-selected, just proceed
  await expect(page.getByRole("heading", { name: /Hintergrund/i })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Next →", exact: true }).click();

  // Now on step 4: Photo
  await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible({ timeout: 10000 });
}

test.describe("Photo Upload Edge Cases", () => {

  test("valid image upload shows crop editor", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Upload photo via hidden file input
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);

    // Verify crop editor elements
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="range"]')).toBeVisible();
    await expect(page.getByText("Replace Photo")).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" })).toBeVisible();
  });

  test("remove photo clears the editor", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Upload photo
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });

    // Click Remove
    await page.getByRole("button", { name: "Remove" }).click();

    // Verify editor is gone and upload area is back
    await expect(page.locator("canvas")).toBeHidden();
    await expect(page.getByText("Click to upload photo")).toBeVisible();
  });

  test("replace photo loads new image", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Upload first photo
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });

    // Click "Replace Photo" — it's a label wrapping a hidden file input
    const replaceInput = page.locator('input[type="file"][accept="image/*"]').first();
    await replaceInput.setInputFiles(SECOND_PHOTO);

    // Verify canvas is still visible (new image loaded)
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
  });

  test("zoom slider changes zoom level", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Upload photo
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.setInputFiles(TEST_PHOTO);
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });

    // Read initial zoom text — default is 120%
    const zoomText = page.getByText(/Zoom: \d+%/);
    await expect(zoomText).toBeVisible();
    const initialZoom = await zoomText.textContent();
    expect(initialZoom).toBe("Zoom: 120%");

    // Move slider to max (3 = 300%)
    const slider = page.locator('input[type="range"]');
    await slider.fill("3");

    // Verify zoom text changed
    await expect(zoomText).toHaveText("Zoom: 300%");
  });

  test("skip photo step (optional) proceeds to text", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Don't upload any photo — just click Next
    const nextBtn = page.getByRole("button", { name: "Next →", exact: true });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Verify we moved to step 5 (Text)
    await expect(page.getByRole("heading", { name: "Text eingeben" })).toBeVisible({ timeout: 10000 });
  });
});
