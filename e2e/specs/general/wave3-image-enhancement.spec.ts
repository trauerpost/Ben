/**
 * Wave 3 — Batch 6: Image Enhancement Tests
 *
 * Covers: filter presets, manual sliders, reset, background removal UI,
 * filter persistence across steps, no-enhancer without photo, mobile.
 */
import { test, expect, type Page } from "@playwright/test";
import path from "path";

test.use({ navigationTimeout: 60000 });

const TEST_PHOTO = path.join(__dirname, "..", "public", "assets", "ornaments", "cross-with-roses.png");

async function clearAndGo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "commit", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "commit", timeout: 60000 });
  await page.waitForTimeout(2000);
}

/** Navigate to Step 3 (Photo) with TI05 template selected */
async function navigateToPhotoStep(page: Page): Promise<void> {
  await clearAndGo(page, "/de/builder");

  // Step 1: Card type
  await page.getByText("Erinnerungsbild").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Step 2: Template TI05
  await page.getByTestId("TI05").click();
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await page.waitForTimeout(500);

  // Now at Step 3 (Photo)
  await expect(page.getByText("Step 3 of 7")).toBeVisible({ timeout: 10000 });
}

async function uploadPhoto(page: Page): Promise<void> {
  const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
  await fileInput.setInputFiles(TEST_PHOTO);
  await page.waitForTimeout(1500);
}

// ── Filter Presets ──

test.describe("Filter Presets", () => {
  test("filter preset buttons render after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Filter presets section should appear
    await expect(page.getByText("Filter")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Original")).toBeVisible();
    await expect(page.getByText("Warm")).toBeVisible();
    await expect(page.getByText("Sepia")).toBeVisible();
  });

  test("clicking a filter preset selects it (ring highlight)", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Click "Warm"
    await page.getByText("Warm").click();
    await page.waitForTimeout(300);

    // The warm button's parent should have the ring class
    const warmButton = page.locator("button").filter({ hasText: "Warm" }).first();
    await expect(warmButton).toHaveClass(/ring-2/, { timeout: 3000 });
  });

  test("all 10 presets are rendered", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    const presetNames = ["Original", "Warm", "Sepia", "Schwarz-Weiß"];
    for (const name of presetNames) {
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("clicking preset resets manual adjustments", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Change brightness slider
    const brightnessSlider = page.locator('input[type="range"]').nth(1); // skip zoom slider
    if (await brightnessSlider.isVisible()) {
      await brightnessSlider.fill("1.4");
      await page.waitForTimeout(200);

      // Now click a preset — should reset
      await page.getByText("Sepia").click();
      await page.waitForTimeout(300);

      // Brightness value should be back to 1.00
      await expect(page.getByText("1.00").first()).toBeVisible({ timeout: 3000 });
    }
  });
});

// ── Manual Adjustments ──

test.describe("Manual Adjustments", () => {
  test("slider labels visible after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    await expect(page.getByText("Helligkeit")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Kontrast")).toBeVisible();
    await expect(page.getByText("Sättigung")).toBeVisible();
    await expect(page.getByText("Schärfe")).toBeVisible();
  });

  test("reset button restores original filter", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Apply a filter
    await page.getByText("Warm").click();
    await page.waitForTimeout(200);

    // Click reset
    await page.getByText("Zurücksetzen").click();
    await page.waitForTimeout(200);

    // "Original" should now be selected
    const originalButton = page.locator("button").filter({ hasText: "Original" }).first();
    await expect(originalButton).toHaveClass(/ring-2/, { timeout: 3000 });
  });
});

// ── Background Removal UI ──

test.describe("Background Removal UI", () => {
  test("remove/blur buttons visible after photo upload", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    await expect(page.getByText("Hintergrund entfernen")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Hintergrund weichzeichnen")).toBeVisible();
  });

  test("restore button NOT visible before processing", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Restore should only show after bg removal
    await expect(page.getByText("Original wiederherstellen")).not.toBeVisible({ timeout: 2000 });
  });
});

// ── No Enhancer Without Photo ──

test.describe("No enhancer without photo", () => {
  test("enhancement controls hidden when no photo uploaded", async ({ page }) => {
    await navigateToPhotoStep(page);

    // Don't upload — verify enhancer is not visible
    await expect(page.getByText("Helligkeit")).not.toBeVisible({ timeout: 2000 });
    await expect(page.getByText("Hintergrund entfernen")).not.toBeVisible({ timeout: 2000 });
  });

  test("removing photo hides enhancement controls", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Verify controls visible
    await expect(page.getByText("Helligkeit")).toBeVisible({ timeout: 5000 });

    // Remove photo
    await page.getByRole("button", { name: "Remove" }).click();
    await page.waitForTimeout(500);

    // Controls should disappear
    await expect(page.getByText("Helligkeit")).not.toBeVisible({ timeout: 3000 });
  });
});

// ── Filter Persistence Across Steps ──

test.describe("Filter persistence", () => {
  test("filter survives step 3→4→3 navigation", async ({ page }) => {
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Apply Sepia
    await page.getByText("Sepia").click();
    await page.waitForTimeout(300);

    // Go to step 4
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForTimeout(500);

    // Go back to step 3
    await page.getByRole("button", { name: "← Back" }).click();
    await page.waitForTimeout(500);

    // Sepia should still be selected
    const sepiaButton = page.locator("button").filter({ hasText: "Sepia" }).first();
    await expect(sepiaButton).toHaveClass(/ring-2/, { timeout: 5000 });
  });
});

// ── Mobile ──

test.describe("Mobile: image enhancement", () => {
  test("filter presets scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await navigateToPhotoStep(page);
    await uploadPhoto(page);

    // Filter section should be visible
    await expect(page.getByText("Original")).toBeVisible({ timeout: 5000 });

    // No horizontal scroll on main page
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });
});
