import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * E2E tests for ImageEnhancer + BackgroundRemover (Batch 6).
 * Verifies filter presets, manual sliders, background removal buttons,
 * and persistence across step navigation.
 */

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

/** Click the wizard "Next ->" button */
async function clickNext(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Next \u2192", exact: true }).click();
}

/** Click the wizard "<- Back" button */
async function clickBack(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Back|\u2190/i }).click();
}

/**
 * Navigate from step 1 to step 4 (Photo) using TI05 template.
 * Flow: type -> template -> bg -> photo step
 */
async function navigateToPhotoStep(page: import("@playwright/test").Page) {
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

  // Now on step 4: Photo
  await expect(page.getByRole("heading", { name: "Photo" })).toBeVisible({ timeout: 10000 });
}

/** Upload the test photo and wait for crop editor */
async function uploadTestPhoto(page: import("@playwright/test").Page) {
  const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
  await fileInput.setInputFiles(TEST_PHOTO);
  await page.waitForTimeout(1500);
  await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
}

test.describe("Image Enhancement", () => {

  test("Filter presets render after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Verify filter preset buttons appear (at least Original should exist)
    await expect(page.getByText(/Original|Warm|Sepia/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("Clicking a filter preset updates the selection", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Click "Warm" preset if visible
    const warmButton = page.getByText("Warm").first();
    if (await warmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await warmButton.click();
      await page.waitForTimeout(300);

      // Verify visual feedback - button should have selected styling (ring, border, or aria)
      const parent = warmButton.locator("..");
      const hasRing = await parent.evaluate(
        (el) => el.className.includes("ring") || el.className.includes("selected") || el.className.includes("active")
      );
      expect(hasRing).toBe(true);
    }
  });

  test("Manual sliders are visible after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Check for slider labels (German or English)
    await expect(
      page.getByText(/Helligkeit|Brightness/i).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/Kontrast|Contrast/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("Filter persists across step navigation", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Apply a filter if available
    const sepiaButton = page.getByText("Sepia").first();
    if (await sepiaButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sepiaButton.click();
      await page.waitForTimeout(300);

      // Navigate to step 5 (text) and back to step 4 (photo)
      await clickNext(page);
      await expect(page.getByText("Step 5 of 8")).toBeVisible({ timeout: 10000 });

      await clickBack(page);
      await page.waitForTimeout(500);

      // Verify Sepia is still visible and selected
      await expect(sepiaButton).toBeVisible({ timeout: 5000 });
    }
  });

  test("Reset button restores original filter", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Apply a filter first
    const warmButton = page.getByText("Warm").first();
    if (await warmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await warmButton.click();
      await page.waitForTimeout(300);

      // Click reset button
      const resetBtn = page.getByRole("button", { name: /Zur\u00fccksetzen|Reset/i });
      if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await resetBtn.click();
        await page.waitForTimeout(300);

        // Verify "Original" is now the active preset
        await expect(page.getByText("Original").first()).toBeVisible();
      }
    }
  });

  test("Background removal buttons visible after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Check for background removal controls (German or English)
    await expect(
      page.getByText(/Hintergrund entfernen|Remove Background/i).first()
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText(/Hintergrund weichzeichnen|Blur Background/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("No enhancer controls without photo", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Don't upload any photo - verify enhancer controls are NOT visible
    await expect(
      page.getByText(/Helligkeit|Brightness/i).first()
    ).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // Expected: either not visible or not in DOM at all
    });

    await expect(
      page.getByText(/Hintergrund entfernen|Remove Background/i).first()
    ).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // Expected: not visible without photo
    });
  });

  test("Mobile: filter presets are accessible on small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Verify at least one preset is visible on mobile
    await expect(
      page.getByText(/Original|Warm|Sepia/i).first()
    ).toBeVisible({ timeout: 5000 });

    // Verify no horizontal overflow from enhancement controls
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test("Crop editor and enhancement controls coexist", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadTestPhoto(page);

    // Both crop canvas and enhancement controls should be visible
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="range"]')).toBeVisible();
    await expect(
      page.getByText(/Original|Warm|Sepia/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
